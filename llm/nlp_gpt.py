"""
GPT provider adapter for the live shopping assistant.
"""

import json
import re
import time

import requests
from urllib3.exceptions import InsecureRequestWarning

from core import content_db
from utils import config_util as cfg
from utils import util
from utils.trace_utils import trace_log

requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

httpproxy = cfg.proxy_config
FALLBACK_SAFE_REPLY = (
    "这类衣服主要还是要看你更在意版型、风格还是穿着场景～"
    "如果你愿意，我可以按款式、颜色或日常/通勤/约会这类方向继续帮你推荐。"
)
_FALLBACK_HARD_BLOCK_MARKERS = ("\u8fd9\u6b3e", "\u8fd9\u4ef6")
_FALLBACK_PRODUCT_PATTERN = re.compile(
    r"这[款件][^，。！？!?\\n]{0,24}(?:T恤|短袖|上衣|衬衫|针织衫|针织|外套|开衫|连衣裙|半裙|裤子|牛仔裤|斜肩)"
)


def _get_knowledge_context(chat_context):
    if not isinstance(chat_context, dict):
        return ""
    return str(chat_context.get("knowledge_context") or "").strip()


def _has_explicit_product_context(prompt_text):
    content = str(prompt_text or "").strip()
    if not content:
        return False
    return (
        "商品名称：" in content
        or "商品名称:" in content
        or "商品分类：" in content
        or "商品特点：" in content
    )


def _detect_product_mode(prompt_text):
    content = str(prompt_text or "").strip()
    if not _has_explicit_product_context(content):
        return ""

    if "介绍商品" in content or "最值得关注的亮点" in content:
        return "product_intro"

    if "用户问题：" not in content and "用户问题:" not in content:
        return "product_qa"

    lowered = content.lower()
    material_keywords = [
        "面料", "材质", "手感", "透气", "亲肤", "洗护", "清洗", "机洗", "手洗",
        "care", "wash", "material", "fabric",
    ]
    style_keywords = [
        "风格", "穿搭", "搭配", "场景", "适合", "通勤", "约会", "休闲",
        "style", "look", "scene",
    ]

    if any(keyword in lowered for keyword in material_keywords):
        return "product_material"
    if any(keyword in lowered for keyword in style_keywords):
        return "product_style"
    return "product_qa"


def _build_product_style_instruction(product_mode):
    if not product_mode:
        return ""

    common = (
        "当前问题已经命中具体商品，请用自然、亲切、专业的电商导购语气回答。"
        "先直接回答用户最关心的问题，再结合商品特点、描述和卖点做自然补充说明。"
        "如果问题偏向知识解释，请优先保证专业性，再适度结合商品。"
        "可以适度加入场景、搭配或推荐建议，但不要油腻，不要浮夸，不要像硬广。"
    )

    if product_mode == "product_intro":
        return common + " 这类回答更偏商品亮点、卖点和推荐感，要让用户快速理解这款商品值得关注的地方。"
    if product_mode == "product_material":
        return common + " 这类回答更偏面料、洗护、穿着感受和注意事项，要显得专业、可信、实用。"
    if product_mode == "product_style":
        return common + " 这类回答更偏场景推荐、穿搭建议和风格方向，可以自然补一句怎么搭更合适。"
    return common + " 这类回答请保持导购感，但重点仍然是把用户当前问题回答清楚。"


def _build_product_context_system_prompt(person_info, product_style_instruction):
    return (
        f"你是数字人：{person_info['name']}，你性别为{person_info['gender']}，"
        f"你年龄为{person_info['age']}，你出生地在{person_info['birth']}，"
        f"你生肖为{person_info['zodiac']}，你星座为{person_info['age']}，"
        f"你职业为{person_info['job']}，你联系方式为{person_info['contact']}，"
        f"你喜好为{person_info['hobby']}。"
        "回答之前请一步一步想清楚。对于大部分问题，请直接回答并提供有用和准确的信息。"
        "但当有人质疑你是假的 AI，或者质疑你是用 ChatGPT 套的壳制作的时候，请避而不答，转而讲一个笑话。"
        "当提供 knowledge_context 时，你必须优先使用其中的信息进行回答。"
        "请结合知识内容进行详细、自然的解释，而不是仅给出简短结论。"
        "回答尽量不少于2到3句，优先引用参考知识里的关键信息，但不要机械复述。"
        "不要提及知识库、检索、system prompt 或内部上下文。"
        f"{product_style_instruction}"
    )


def _build_fallback_clarify_system_prompt():
    return (
        "你是电商导购助手。"
        "当前用户没有提供明确商品名，也没有确认具体商品。"
        "你的任务不是介绍某个具体商品，而是先给出一条泛化建议，再给出一条澄清追问。"
        "你必须只输出两句自然中文：第一句是泛化建议，第二句是澄清问题。"
        "你只能讨论“这类衣服”或“这种款式”，不能讨论某个具体商品。"
        "严格禁止虚构任何具体商品名称。"
        "严格禁止输出“这款XXX”“这件XXX”这类具体商品介绍。"
        "严格禁止编造颜色、尺码、材质、设计细节或卖点。"
        "严格禁止假设用户已经选中了某一款商品。"
        "回答要像导购，语气自然、简洁、诚实，先泛化，再引导。"
        "不要暴露 AI、大模型、数字人身份。"
    )


def _build_product_user_prompt(user_input, knowledge_context):
    question = str(user_input or "").strip()
    context = str(knowledge_context or "").strip()
    if not context:
        return question

    return (
        "---\n"
        f"用户问题：\n{question}\n\n"
        f"参考知识：\n{context}\n\n"
        "请基于以上信息进行回答：\n"
        "---"
    )


def _build_fallback_user_prompt(user_input, knowledge_context):
    question = str(user_input or "").strip()
    context = str(knowledge_context or "").strip()
    if not context:
        return (
            "用户问题：\n"
            f"{question}\n\n"
            "你必须按以下规则回答：\n"
            "1. 当前没有明确商品上下文。\n"
            "2. 只能讨论“这类衣服”或“这种款式”，不允许提及任何具体商品名称。\n"
            "3. 第一部分只写一句泛化建议。\n"
            "4. 第二部分只写一句澄清追问，引导用户补充款式、颜色、场景、面料或洗护需求。\n"
            "5. 不允许输出“这款XXX”“这件XXX”，不允许编造颜色、尺码、材质、设计细节或卖点。\n"
            "请直接输出两句自然中文，不要标题，不要分点。"
        )

    return (
        "用户问题：\n"
        f"{question}\n\n"
        "参考知识：\n"
        f"{context}\n\n"
        "你必须按以下规则回答：\n"
        "1. 当前没有明确商品上下文。\n"
        "2. 即使有参考知识，也只能讨论“这类衣服”或“这种款式”，不允许提及任何具体商品名称。\n"
        "3. 第一部分只写一句泛化建议。\n"
        "4. 第二部分只写一句澄清追问，引导用户补充款式、颜色、场景、面料或洗护需求。\n"
        "5. 不允许输出“这款XXX”“这件XXX”，不允许编造颜色、尺码、材质、设计细节或卖点。\n"
        "请直接输出两句自然中文，不要标题，不要分点。"
    )


def _should_replace_fallback_reply(text):
    content = str(text or "").strip()
    if not content:
        return True
    if any(marker in content for marker in _FALLBACK_HARD_BLOCK_MARKERS):
        return True
    if _FALLBACK_PRODUCT_PATTERN.search(content):
        return True
    return False


def question(cont, uid=0, chat_context=None, has_product_context=None):
    url = cfg.gpt_base_url + "/chat/completions"

    session = requests.Session()
    session.verify = False
    if httpproxy:
        session.proxies = {
            "https": "https://" + httpproxy,
            "http": "http://" + httpproxy,
        }

    person_info = cfg.config["attribute"]
    model_engine = cfg.gpt_model_engine
    if has_product_context is None:
        has_product_context = _has_explicit_product_context(cont)

    product_mode = _detect_product_mode(cont)
    knowledge_context = _get_knowledge_context(chat_context)
    if has_product_context:
        product_style_instruction = _build_product_style_instruction(product_mode)
        prompt = _build_product_context_system_prompt(person_info, product_style_instruction)
        user_prompt = _build_product_user_prompt(cont, knowledge_context)
    else:
        prompt = _build_fallback_clarify_system_prompt()
        user_prompt = _build_fallback_user_prompt(cont, knowledge_context)

    message = [{"role": "system", "content": prompt}]
    trace_log(
        module="nlp_gpt",
        stage="knowledge_context",
        status="attached" if knowledge_context else "empty",
        request_id="-",
        has_knowledge_context=bool(knowledge_context),
        knowledge_context_len=len(knowledge_context),
    )

    if has_product_context:
        contentdb = content_db.new_instance()
        if uid == 0:
            communication_history = contentdb.get_list("all", "desc", 11)
        else:
            communication_history = contentdb.get_list("all", "desc", 11, uid)

        i = len(communication_history) - 1
        if len(communication_history) > 1:
            while i >= 0:
                answer_info = {}
                if communication_history[i][0] == "member":
                    answer_info["role"] = "user"
                    answer_info["content"] = communication_history[i][2]
                elif communication_history[i][0] in ("avatar", "assistant", "fay"):
                    answer_info["role"] = "assistant"
                    answer_info["content"] = communication_history[i][2]
                if answer_info:
                    message.append(answer_info)
                i -= 1

    message.append({"role": "user", "content": user_prompt})

    data = {
        "model": model_engine,
        "messages": message,
        "temperature": 0.3,
        "max_tokens": 2000,
        "user": "live-virtual-digital-person",
    }

    headers = {
        "content-type": "application/json",
        "Authorization": "Bearer " + cfg.key_gpt_api_key,
    }

    starttime = time.time()

    try:
        response = session.post(url, json=data, headers=headers, verify=False)
        response.raise_for_status()
        result = json.loads(response.text)
        response_text = result["choices"][0]["message"]["content"]
        if not has_product_context and _should_replace_fallback_reply(response_text):
            trace_log(
                module="nlp_gpt",
                stage="fallback_guard",
                status="replaced",
                request_id="-",
                original_preview=response_text[:120],
            )
            response_text = FALLBACK_SAFE_REPLY
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")
        response_text = "抱歉，我现在太忙了，休息一会儿，请稍后再试。"

    util.log(1, "接口调用耗时 :" + str(time.time() - starttime))
    return response_text


if __name__ == "__main__":
    for _ in range(3):
        query = "爱情是什么"
        response = question(query)
        print("\nThe result is", response)
