import sys
import os

# --- 路径设置开始 (必须在所有导入之前) ---
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)
# --- 路径设置结束 ---
import json
import time
from tts import qwen3
from tts import volcano_tts
import pyaudio
import re
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    Response,
    send_file,
    redirect,
)
from flask_cors import CORS
from flask_httpauth import HTTPBasicAuth
from gevent import pywsgi
from scheduler.thread_manager import MyThread

app = Flask(__name__)
app.config["DEBUG"] = True
auth = HTTPBasicAuth()
CORS(app, supports_credentials=True)
MAIN_API_BASE_URL = os.environ.get("MAIN_API_BASE_URL", "http://127.0.0.1:5000")


def load_users():
    with open("verifier.json") as f:
        users = json.load(f)
    return users


users = load_users()


@auth.verify_password
def verify_password(username, password):
    if not users or config_util.start_mode == "common":
        return True
    if username in users and users[username] == password:
        return username


def __get_template():
    return render_template("index_main.html")


def __get_device_list():
    if config_util.start_mode == "common":
        audio = pyaudio.PyAudio()
        device_list = []
        for i in range(audio.get_device_count()):
            devInfo = audio.get_device_info_by_index(i)
            if devInfo["hostApi"] == 0:
                device_list.append(devInfo["name"])
        return device_list

    try:
        upstream = requests.request(
            method=request.method,
            url=target_url,
            params=request.args,
            data=request.get_data(),
            headers=headers,
            cookies=request.cookies,
            stream=stream,
            timeout=300 if stream else 120,
        )
    except requests.RequestException as exc:
        return jsonify({"error": f"main api unavailable: {exc}"}), 502

    excluded_headers = {"content-encoding", "transfer-encoding", "connection"}
    response_headers = [
        (name, value)
        for name, value in upstream.headers.items()
        if name.lower() not in excluded_headers
    ]

    if stream:
        return Response(
            upstream.iter_content(chunk_size=8192),
            status=upstream.status_code,
            headers=response_headers,
        )

    return Response(
        upstream.content,
        status=upstream.status_code,
        headers=response_headers,
    )


@app.route("/api/submit", methods=["post"])
def api_submit():
    data = request.values.get("data")
    config_data = json.loads(data)
    if config_data["config"]["source"]["record"]["enabled"]:
        config_data["config"]["source"]["record"]["channels"] = 0
        audio = pyaudio.PyAudio()
        for i in range(audio.get_device_count()):
            devInfo = audio.get_device_info_by_index(i)
            if (
                devInfo["name"].find(
                    config_data["config"]["source"]["record"]["device"]
                )
                >= 0
                and devInfo["hostApi"] == 0
            ):
                config_data["config"]["source"]["record"]["channels"] = devInfo[
                    "maxInputChannels"
                ]

    config_util.save_config(config_data["config"])

    return '{"result":"successful"}'


@app.route("/api/get-data", methods=["post"])
def api_get_data():
    config_util.load_config()
    voice_list = tts_voice.get_voice_list()
    send_voice_list = []
    if config_util.tts_module == "ali":
        wsa_server.get_web_instance().add_cmd(
            {
                "voiceList": [
                    {"id": "abin", "name": "阿斌"},
                    {"id": "zhixiaobai", "name": "知小白"},
                    {"id": "zhixiaoxia", "name": "知小夏"},
                    {"id": "zhixiaomei", "name": "知小妹"},
                    {"id": "zhigui", "name": "知柜"},
                    {"id": "zhishuo", "name": "知硕"},
                    {"id": "aixia", "name": "艾夏"},
                    {"id": "zhifeng_emo", "name": "知锋_多情感"},
                    {"id": "zhibing_emo", "name": "知冰_多情感"},
                    {"id": "zhimiao_emo", "name": "知妙_多情感"},
                    {"id": "zhimi_emo", "name": "知米_多情感"},
                    {"id": "zhiyan_emo", "name": "知燕_多情感"},
                    {"id": "zhibei_emo", "name": "知贝_多情感"},
                    {"id": "zhitian_emo", "name": "知甜_多情感"},
                    {"id": "xiaoyun", "name": "小云"},
                    {"id": "xiaogang", "name": "小刚"},
                    {"id": "ruoxi", "name": "若兮"},
                    {"id": "siqi", "name": "思琪"},
                    {"id": "sijia", "name": "思佳"},
                    {"id": "sicheng", "name": "思诚"},
                    {"id": "aiqi", "name": "艾琪"},
                    {"id": "aijia", "name": "艾佳"},
                    {"id": "aicheng", "name": "艾诚"},
                    {"id": "aida", "name": "艾达"},
                    {"id": "ninger", "name": "宁儿"},
                    {"id": "ruilin", "name": "瑞琳"},
                    {"id": "siyue", "name": "思悦"},
                    {"id": "aiya", "name": "艾雅"},
                    {"id": "aimei", "name": "艾美"},
                    {"id": "aiyu", "name": "艾雨"},
                    {"id": "aiyue", "name": "艾悦"},
                    {"id": "aijing", "name": "艾婧"},
                    {"id": "xiaomei", "name": "小美"},
                    {"id": "aina", "name": "艾娜"},
                    {"id": "yina", "name": "伊娜"},
                    {"id": "sijing", "name": "思婧"},
                    {"id": "sitong", "name": "思彤"},
                    {"id": "xiaobei", "name": "小北"},
                    {"id": "aitong", "name": "艾彤"},
                    {"id": "aiwei", "name": "艾薇"},
                    {"id": "aibao", "name": "艾宝"},
                    {"id": "shanshan", "name": "姗姗"},
                    {"id": "chuangirl", "name": "小玥"},
                    {"id": "lydia", "name": "Lydia"},
                    {"id": "aishuo", "name": "艾硕"},
                    {"id": "qingqing", "name": "青青"},
                    {"id": "cuijie", "name": "翠姐"},
                    {"id": "xiaoze", "name": "小泽"},
                    {"id": "zhimao", "name": "知猫"},
                    {"id": "zhiyuan", "name": "知媛"},
                    {"id": "zhiya", "name": "知雅"},
                    {"id": "zhiyue", "name": "知悦"},
                    {"id": "zhida", "name": "知达"},
                    {"id": "zhistella", "name": "知莎"},
                    {"id": "kelly", "name": "Kelly"},
                    {"id": "jiajia", "name": "佳佳"},
                    {"id": "taozi", "name": "桃子"},
                    {"id": "guijie", "name": "柜姐"},
                    {"id": "stella", "name": "Stella"},
                    {"id": "stanley", "name": "Stanley"},
                    {"id": "kenny", "name": "Kenny"},
                    {"id": "rosa", "name": "Rosa"},
                    {"id": "mashu", "name": "马树"},
                    {"id": "xiaoxian", "name": "小仙"},
                    {"id": "yuer", "name": "悦儿"},
                    {"id": "maoxiaomei", "name": "猫小美"},
                    {"id": "aifei", "name": "艾飞"},
                    {"id": "yaqun", "name": "亚群"},
                    {"id": "qiaowei", "name": "巧薇"},
                    {"id": "dahu", "name": "大虎"},
                    {"id": "ailun", "name": "艾伦"},
                    {"id": "jielidou", "name": "杰力豆"},
                    {"id": "laotie", "name": "老铁"},
                    {"id": "laomei", "name": "老妹"},
                    {"id": "aikan", "name": "艾侃"},
                ]
            }
        )
    elif config_util.tts_module == "volcano":
        send_voice_list = volcano_tts.get_volcano_voices()
        wsa_server.get_web_instance().add_cmd({"voiceList": send_voice_list})
    elif config_util.tts_module == "qwen3":
        send_voice_list = qwen3.get_qwen_voices()
        wsa_server.get_web_instance().add_cmd({"voiceList": send_voice_list})
    else:
        voice_list = tts_voice.get_voice_list()
        send_voice_list = []
        for voice in voice_list:
            voice_data = voice.value
            send_voice_list.append(
                {"id": voice_data["name"], "name": voice_data["name"]}
            )
        wsa_server.get_web_instance().add_cmd({"voiceList": send_voice_list})
    wsa_server.get_web_instance().add_cmd({"deviceList": __get_device_list()})
    if fay_booter.is_running():
        wsa_server.get_web_instance().add_cmd({"liveState": 1})
    try:
        extra = []
        try:
            extra += volcano_tts.get_volcano_voices()
        except Exception:
            pass
        try:
            extra += qwen3.get_qwen_voices()
        except Exception:
            pass
        if extra:
            send_voice_list = extra
            wsa_server.get_web_instance().add_cmd({"voiceList": send_voice_list})
    except Exception:
        pass
    return json.dumps({"config": config_util.config, "voice_list": send_voice_list})


@app.route("/api/start-live", methods=["post"])
def api_start_live():
    try:
        config_util.load_config()
        web = wsa_server.new_web_instance(port=10003)
        web.start_server()
        human = wsa_server.new_instance(port=10004)
        human.start_server()
        wsa_server.start_port_forwarder(listen_port=10000, target_port=10004)
        fay_booter.start()
        time.sleep(1)
        wsa_server.get_web_instance().add_cmd({"liveState": 1})
        return '{"result":"successful"}'
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stop-live", methods=["post"])
def api_stop_live():
    return _proxy_to_main_api("/api/stop-live")


@app.route("/api/send", methods=["post"])
def api_send():
    data = request.values.get("data")
    info = json.loads(data)
    interact = Interact("text", 1, {"user": info["username"], "msg": info["msg"]})
    util.printInfo(3, "文字发送按钮", "{}".format(interact.data["msg"]), time.time())
    fay_booter.feiFei.on_interact(interact)
    return '{"result":"successful"}'


# 获取指定用户的消息记录
@app.route("/api/get-msg", methods=["post"])
def api_get_Msg():
    data = request.form.get("data")
    data = json.loads(data)
    uid = member_db.new_instance().find_user(data["username"])
    contentdb = content_db.new_instance()
    if uid == 0:
        return json.dumps({"list": []})
    else:
        list = contentdb.get_list("all", "desc", 1000, uid)
    relist = []
    i = len(list) - 1
    while i >= 0:
        relist.append(
            dict(
                type=list[i][0],
                way=list[i][1],
                content=list[i][2],
                createtime=list[i][3],
                timetext=list[i][4],
                username=list[i][5],
            )
        )
        i -= 1
    if fay_booter.is_running():
        wsa_server.get_web_instance().add_cmd({"liveState": 1})
    return json.dumps({"list": relist})


@app.route("/v1/chat/completions", methods=["post"])
@app.route("/api/send/v1/chat/completions", methods=["post"])
def api_send_v1_chat_completions():
    data = request.json
    last_content = ""
    if "messages" in data and data["messages"]:
        last_message = data["messages"][-1]
        username = last_message.get("role", "User")
        if username == "user":
            username = "User"
        last_content = last_message.get("content", "No content provided")
    else:
        last_content = "No messages found"
        username = "User"

    model = data.get("model", "fay")
    interact = Interact("text", 1, {"user": username, "msg": last_content})
    util.printInfo(3, "文字沟通接口", "{}".format(interact.data["msg"]), time.time())
    text = fay_booter.feiFei.on_interact(interact)

    if model == "fay-streaming":
        return stream_response(text)
    else:
        return non_streaming_response(last_content, text)


@app.route("/api/get-member-list", methods=["post"])
def api_get_Member_list():
    memberdb = member_db.new_instance()
    list = memberdb.get_all_users()
    return json.dumps({"list": list})


def stream_response(text):
    def generate():
        for chunk in text_chunks(text):
            message = {
                "id": "chatcmpl-8jqorq6Fw1Vi5XoH7pddGGpQeuPe0",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": "fay-streaming",
                "choices": [
                    {"delta": {"content": chunk}, "index": 0, "finish_reason": None}
                ],
            }
            yield f"data: {json.dumps(message)}\n\n"
            time.sleep(0.1)
        # 发送最终的结束信号
        yield "data: [DONE]\n\n"

    return Response(generate(), mimetype="text/event-stream")


def non_streaming_response(last_content, text):
    return jsonify(
        {
            "id": "chatcmpl-8jqorq6Fw1Vi5XoH7pddGGpQeuPe0",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": "fay",
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": text},
                    "logprobs": "",
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": len(last_content),
                "completion_tokens": len(text),
                "total_tokens": len(last_content) + len(text),
            },
            "system_fingerprint": "fp_04de91a479",
        }
    )


def text_chunks(text, chunk_size=20):
    pattern = r"([^.!?;:，。！？]+[.!?;:，。！？]?)"
    chunks = re.findall(pattern, text)
    for chunk in chunks:
        yield chunk


@app.route("/", methods=["get"])
@auth.login_required
def home():
    return __get_template()


@app.route("/", methods=["post"])
@auth.login_required
def home_post():
    wsa_server.get_web_instance().add_cmd({"is_connect": ...})
    return __get_template()


@app.route("/home")
def home_page():
    return render_template("index_main.html")


@app.route("/product_management")
def product_management():
    return render_template('product_management.html')

@app.route("/product_marketing")
def product_marketing():
    return render_template("product_marketing.html")


@app.route("/test1")
def test1():
    import os

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    return redirect(f"{frontend_url}/ai-tools/textgenerate")


@app.route("/test2")
def test2():
    return render_template("test2.html")


@app.route("/test3")
def test3():
    return render_template("test3.html")


@app.route("/calendar")
def calendar():
    return render_template("calendar.html")


@app.route("/note")
def note():
    return render_template("note.html")


@app.route("/setting", methods=["get"])
def setting():
    return render_template("setting.html")


# ==================== 新增：直播间语音接口 ====================

@app.route('/api/live/asr', methods=['POST'])
def api_live_asr():
    """
    语音识别接口 - 前端录音文件上传到这里
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'error': '没有音频文件'}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': '文件名为空'}), 400
        
        # 保存临时文件
        temp_path = f'./samples/live_asr_{int(time.time() * 1000)}.wav'
        audio_file.save(temp_path)
        
        # 调用 ASR 服务（从配置读取）
        asr_url = getattr(config_util.cfg, 'qwen3_asr_url', 'http://127.0.0.1:8001/asr')
        with open(temp_path, 'rb') as f:
            response = requests.post(asr_url, files={'file': f}, timeout=120)
        
        # 删除临时文件
        try:
            os.remove(temp_path)
        except:
            pass
        
        if response.status_code == 200:
            result = response.json()
            text = result.get('text', '')
            util.printInfo(1, "直播间 ASR", f"识别结果：{text}")
            return jsonify({'text': text})
        else:
            util.printInfo(1, "直播间 ASR", f"识别失败：{response.text}")
            return jsonify({'error': 'ASR 服务错误', 'detail': response.text}), 500
            
    except Exception as e:
        util.printInfo(1, "直播间 ASR", f"异常：{e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/live/tts', methods=['POST'])
def api_live_tts():
    """
    语音合成接口 - 前端发送文字到这里，返回 Base64 音频
    """
    try:
        data = request.json
        text = data.get('text', '')
        speaker = data.get('speaker', 'vivian')  # 默认 vivian 女声
        instruct = data.get('instruct', '用平稳、自然、淡定的语气说话')
        
        if not text:
            return jsonify({'error': '文本不能为空'}), 400
        
        # 调用 TTS 服务（从配置读取）
        tts_url = getattr(config_util.cfg, 'qwen3_tts_url', 'http://127.0.0.1:8000/tts')
        tts_data = {
            "text": text,
            "speaker": speaker,
            "instruct": instruct,
            "language": "Chinese"
        }
        
        response = requests.post(tts_url, json=tts_data, timeout=120)
        
        if response.status_code == 200:
            res_json = response.json()
            if res_json.get('status') == 'success':
                audio_base64 = res_json.get('audio_base64', '')
                time_cost = res_json.get('time_cost_ms', 0)
                util.printInfo(1, "直播间 TTS", f"合成成功，耗时：{time_cost:.1f}ms")
                return jsonify({
                    'audio_base64': audio_base64,
                    'time_cost_ms': time_cost
                })
            else:
                return jsonify({'error': 'TTS 服务错误', 'detail': res_json.get('detail')}), 500
        else:
            return jsonify({'error': 'TTS 服务错误', 'detail': response.text}), 500
            
    except Exception as e:
        util.printInfo(1, "直播间 TTS", f"异常：{e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/live/chat', methods=['POST'])
def api_live_chat():
    """
    文字聊天接口 - 前端发送文字，调用 LLM 生成回复并返回 TTS 音频
    """
    try:
        data = request.json
        message = data.get('message', '')
        username = data.get('username', 'User')
        
        if not message:
            return jsonify({'error': '消息不能为空'}), 400
        
        # 调用 fay_core 的聊天处理
        from core.interact import Interact
        interact = Interact("text", 1, {'user': username, 'msg': message})
        util.printInfo(3, "直播间聊天", f'{username}: {message}')
        
        # 获取回复（会触发 TTS）
        from core import fay_booter
        reply = fay_booter.feiFei.on_interact(interact)
        
        # 获取 TTS 音频（单独调用一次获取 Base64）
        audio_base64 = None
        try:
            tts_url = getattr(config_util.cfg, 'qwen3_tts_url', 'http://127.0.0.1:8000/tts')
            tts_data = {
                "text": reply,
                "speaker": "vivian",
                "instruct": "用平稳、自然、淡定的语气说话",
                "language": "Chinese"
            }
            tts_response = requests.post(tts_url, json=tts_data, timeout=120)
            if tts_response.status_code == 200:
                tts_json = tts_response.json()
                if tts_json.get('status') == 'success':
                    audio_base64 = tts_json.get('audio_base64', '')
        except Exception as e:
            util.printInfo(1, "直播间 TTS", f"合成失败：{e}")
        
        util.printInfo(1, "直播间聊天", f'{username}: {message} => {reply}')
        return jsonify({
            'reply': reply,
            'username': username,
            'audio_base64': audio_base64
        })
        
    except Exception as e:
        util.printInfo(1, "直播间聊天", f"异常：{e}")
        return jsonify({'error': str(e)}), 500


# ==================== 直播间接口结束 ====================


# 输出的音频http
@app.route("/audio/<filename>")
def serve_audio(filename):
    audio_file = os.path.join(os.getcwd(), "samples", filename)
    return send_file(audio_file)


# 输出的表情git
@app.route("/robot/<filename>")
def serve_gif(filename):
    gif_file = os.path.join(os.getcwd(), "gui", "robot", filename)
    return send_file(gif_file)


def run():
    server = pywsgi.WSGIServer(("0.0.0.0", 6000), app)
    server.serve_forever()


def start():
    MyThread(target=run).start()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6000, debug=True)
