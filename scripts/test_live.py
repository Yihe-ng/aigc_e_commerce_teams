"""Live 链路端到端测试 — 可复用脚本
用法:
  python scripts/test_live.py                  # 全量 25 轮
  python scripts/test_live.py --only 1 4       # 指定轮次
  python scripts/test_live.py --category intro # 按类别
  python scripts/test_live.py --timeout 90     # 自定义超时
  python scripts/test_live.py --soft           # 弱验证模式(不崩溃即可)
  python scripts/test_live.py -v               # 详细输出

已知限制（测试层面，非功能缺陷）:
  - 价格/指代查询依赖前置商品上下文；单独跑会因无上下文而失败
  - 相似推荐触发词不包含"差不多/风格像"等口语表达
  - 商品上下文 TTL 180s，跨 session 丢失（属管道设计，非测试问题）
  - LLM 回复具有随机性，关键词验证可能偶发未命中(用 --soft 跳过)
"""

import asyncio, json, sys, time, urllib.request, urllib.error, argparse

WS_WEB   = "ws://127.0.0.1:10003"
WS_HUMAN = "ws://127.0.0.1:10004"
CHAT_URL = "http://127.0.0.1:5000/api/chat"
USER     = "User"
MSG_WAIT = 30
DEBOUNCE = 2

# 每项: (类别, 轮次, 描述, 用户消息, 预期关键词)
# 关键词=[] 表示必须有回复但内容不限
TEST_CASES = [
    # ═══ 会话1: 连衣裙全流程 ═══
    ("intro",     1, "介绍连衣裙", "帮我介绍一下法式碎花连衣裙", ["碎花", "法式"]),
    ("similar",   2, "相似推荐", "有没有类似这款的推荐", ["法式"]),
    ("outfit",    3, "搭配建议", "这个怎么搭配", ["搭配"]),
    ("size",      4, "尺码 kg", "我身高160体重55kg穿什么码", ["码"]),
    ("price",     5, "价格询问", "这件多少钱", ["元", "价"]),

    # ═══ 会话2: 西装全流程 ═══
    ("intro",     6, "介绍西装", "介绍一下通勤西装外套", ["西装"]),
    ("similar",   7, "相似推荐2", "看看别的类似款有什么", ["款"]),
    ("outfit",    8, "搭配建议2", "这个好搭吗", ["搭"]),
    ("size",      9, "尺码 斤", "我120斤穿什么码合适", ["码"]),
    ("detail",   10, "面料透气", "这是什么面料的，透气吗", ["透气"]),
    ("detail",   11, "洗护保养", "这件衣服怎么洗，会缩水吗", ["洗"]),

    # ═══ 独立查询 ═══
    ("intro",    12, "品类查询", "有没有甜辣风格的上衣", ["甜辣"]),
    ("intro",    13, "模糊查询", "我想看看通勤穿的衣服", ["通勤"]),
    ("color",    14, "颜色选择", "有哪些颜色可以选", ["颜色"]),
    ("live",     15, "库存发货", "这个有现货吗什么时候发货", ["发货", "现货", "天"]),
    ("live",     16, "退换货", "不合适可以退换吗", ["退", "换"]),
    ("live",     17, "优惠券", "有没有优惠券或者活动", ["优惠", "券", "活动"]),

    # ═══ 上下文 + 季节性 ═══
    ("context",  18, "季节适配", "这件春天穿合适吗", ["春", "适合"]),
    ("context",  19, "实拍请求", "能看看实拍图吗", ["图", "看", "展示"]),

    # ═══ 直播互动 ═══
    ("live",     20, "开场引导", "你好今天有什么推荐的", []),
    ("live",     21, "犹豫询问", "我再想想这个适合我吗", []),
    ("live",     22, "催促下单", "哪款最值得买", []),

    # ═══ 边界 ═══
    ("edge",     23, "闲聊", "今天天气真好", []),
    ("edge",     24, "太贵了", "太贵了能不能便宜点", []),
    ("edge",     25, "空消息(脚本健壮)", "", None),
]

# ═══════════════════ 核心逻辑 ═══════════════════

class LiveTester:
    def __init__(self, verbose=False, timeout=MSG_WAIT):
        self.verbose = verbose
        self.timeout = timeout
        self.messages = []
        self.panel_replies = []
        self._ws_web = None
        self._ws_human = None
        self._running = True
        self._ws_connected = False
        self._last_reply_time = 0.0

    def log(self, msg):
        if self.verbose:
            print(f"  [{msg}]")

    async def _recv_web(self):
        while self._running:
            try:
                raw = await asyncio.wait_for(self._ws_web.recv(), timeout=1.0)
                try:
                    data = json.loads(raw)
                    typ = list(data.keys())[0] if data else "?"
                    self.messages.append(("WEB", typ, data))
                    # 提取 avatar 回复
                    pr = data.get("panelReply", {})
                    if isinstance(pr, dict) and pr.get("type") == "avatar":
                        content = pr.get("content", "")
                        self.panel_replies.append(content)
                        self._last_reply_time = time.time()
                        self.log(f"WEB panelReply: {content[:100]}")
                except json.JSONDecodeError:
                    self.messages.append(("WEB", "raw", raw[:200]))
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                if self._running:
                    self.log(f"WEB recv err: {e}")
                self._ws_connected = False
                break

    async def _recv_human(self):
        while self._running:
            try:
                raw = await asyncio.wait_for(self._ws_human.recv(), timeout=1.0)
                try:
                    data = json.loads(raw)
                    typ = list(data.keys())[0] if data else "?"
                    self.messages.append(("HUMAN", typ, data))
                except json.JSONDecodeError:
                    self.messages.append(("HUMAN", "raw", raw[:200]))
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                if self._running:
                    self.log(f"HUMAN recv err: {e}")
                self._ws_connected = False
                break

    async def connect(self, ws_web_url=WS_WEB, ws_human_url=WS_HUMAN):
        try:
            self._ws_web = await __import__("websockets").connect(ws_web_url, ping_interval=None)
            self._ws_human = await __import__("websockets").connect(ws_human_url, ping_interval=None)
            self._ws_connected = True
        except Exception as e:
            self._ws_connected = False
            raise ConnectionError(f"WebSocket 连接失败: {e}")
        self._recv_web_task = asyncio.create_task(self._recv_web())
        self._recv_human_task = asyncio.create_task(self._recv_human())

    async def disconnect(self):
        self._running = False
        self._ws_connected = False
        for ws in [self._ws_web, self._ws_human]:
            if ws:
                try: await ws.close()
                except: pass
        for task in [self._recv_web_task, self._recv_human_task]:
            if task and not task.done():
                task.cancel()
                try: await task
                except asyncio.CancelledError: pass

    async def send_chat(self, text: str, user: str = USER, chat_url: str = CHAT_URL) -> str:
        before_count = len(self.panel_replies)
        self.log(f"POST /api/chat: {text[:60]}")

        payload = json.dumps({"user": user, "text": text}).encode()
        try:
            req = urllib.request.Request(chat_url, data=payload,
                headers={"Content-Type": "application/json"})
            urllib.request.urlopen(req, timeout=10)
        except urllib.error.URLError as e:
            raise ConnectionError(f"Chat API 不可达: {e}")

        deadline = time.time() + self.timeout
        while time.time() < deadline:
            await asyncio.sleep(0.5)
            current_count = len(self.panel_replies)
            if current_count > before_count:
                stable_for = time.time() - self._last_reply_time
                if stable_for >= DEBOUNCE:
                    break
            if not self._ws_connected:
                break

        new_replies = self.panel_replies[before_count:]
        return new_replies[-1] if new_replies else ""

    def verify(self, reply: str, keywords, soft=False) -> bool:
        if soft or keywords is None:
            return True
        if not reply:
            return False
        if len(keywords) == 0:
            return True
        reply_lower = reply.lower()
        return any(kw.lower() in reply_lower for kw in keywords)

# ═══════════════════ 主流程 ═══════════════════

async def main():
    parser = argparse.ArgumentParser(description="Live 链路端到端测试")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细输出")
    parser.add_argument("--timeout", "-t", type=int, default=MSG_WAIT, help="单条消息超时秒数")
    parser.add_argument("--only", "-o", type=int, nargs="+", help="只运行指定轮次")
    parser.add_argument("--category", "-c", type=str, help="只运行指定类别")
    parser.add_argument("--soft", "-s", action="store_true", help="弱验证模式（不崩溃即通过）")
    parser.add_argument("--user", "-u", type=str, default=None, help=f"聊天用户名（默认: {USER}）")
    parser.add_argument("--chat-url", type=str, default=None, help=f"Chat API URL")
    parser.add_argument("--ws-web", type=str, default=None, help=f"Web WS URL")
    parser.add_argument("--ws-human", type=str, default=None, help=f"Human WS URL")
    args = parser.parse_args()

    user = args.user or USER
    chat_url = args.chat_url or CHAT_URL
    ws_web = args.ws_web or WS_WEB
    ws_human = args.ws_human or WS_HUMAN

    tester = LiveTester(verbose=args.verbose, timeout=args.timeout)

    print("=" * 60)
    print("Live 链路端到端测试")
    print(f"WebSocket: {ws_web} + {ws_human}")
    print(f"Chat API:  {chat_url}")
    print(f"用户:      {user}")
    print(f"测试用例:  {len(TEST_CASES)} 条")
    print("=" * 60)

    try:
        await tester.connect(ws_web, ws_human)
        await asyncio.sleep(0.3)  # 等连接稳定
    except Exception as e:
        print(f"\n❌ 连接失败: {e}")
        print(f"请确认: 1) 后端已启动  2) {ws_web} 和 {ws_human} 端口未被占用")
        return 1

    results = []
    for cat, round_num, desc, msg, keywords in TEST_CASES:
        if args.only and round_num not in args.only:
            continue
        if args.category and cat != args.category:
            continue

        print(f"\n[第{round_num}轮] [{cat}] {desc}")
        print(f"  👤 用户: {msg}")

        if not msg.strip():
            print(f"  ⏭️  空消息，跳过（脚本健壮性检查）")
            continue

        try:
            reply = await tester.send_chat(msg, user, chat_url)
        except ConnectionError as e:
            print(f"  ❌ API 错误: {e}")
            results.append((round_num, cat, desc, False, str(e)))
            continue
        except asyncio.CancelledError:
            break

        if not reply:
            print(f"  ❌ 未收到回复（超时 {args.timeout}s）")
            results.append((round_num, cat, desc, False, "无回复"))
            continue

        print(f"  🤖 AI: {reply[:120]}{'...' if len(reply) > 120 else ''}")

        passed = tester.verify(reply, keywords, args.soft)
        status = "✅" if passed else "⚠️"
        if not passed and keywords:
            found = [kw for kw in keywords if kw.lower() in reply.lower()]
            print(f"  {status} 关键词未命中: {keywords}, 实际命中: {found if found else '(无)'}")

        results.append((round_num, cat, desc, passed, None))

    # ═══════════════ 报告 ═══════════════
    print("\n" + "=" * 60)
    print("测试报告")
    print("=" * 60)
    passed = sum(1 for _, _, _, ok, _ in results if ok)
    total = len(results)
    by_cat = {}
    for _, cat, _, ok, _ in results:
        by_cat.setdefault(cat, {"ok": 0, "total": 0})
        by_cat[cat]["total"] += 1
        if ok: by_cat[cat]["ok"] += 1

    for cat, stats in sorted(by_cat.items()):
        pct = stats["ok"] * 100 // stats["total"] if stats["total"] else 0
        bar = "█" * (pct // 10) + "░" * (10 - pct // 10)
        print(f"  {bar} {cat:10s} {stats['ok']}/{stats['total']}")

    for rnd, cat, desc, ok, err in results:
        status = "✅" if ok else ("❌" if err else "⚠️")
        detail = f" — {err}" if err else ""
        print(f"  {status} 第{rnd:2d}轮 [{cat:8s}] {desc}{detail}")
    print(f"\n  结果: {passed}/{total} 通过 ({passed*100//total if total else 0}%)")

    # 统计消息量
    print(f"\n  收到消息: {len(tester.messages)} 条")
    print(f"  其中 panelReply: {len(tester.panel_replies)} 条")

    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
