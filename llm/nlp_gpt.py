"""
此代码经过项目内适配，可对接本地 clash 代理或远程代理，避免开启系统代理后影响其他功能。
"""

import requests
import time
import json

from utils import config_util as cfg
from utils.trace_utils import trace_log
from urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)
from core import content_db
from utils import util

httpproxy = cfg.proxy_config


def _get_knowledge_context(chat_context):
    if not isinstance(chat_context, dict):
        return ""
    return str(chat_context.get("knowledge_context") or "").strip()


def _build_user_prompt(user_input, knowledge_context):
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


def question(cont, uid=0, chat_context=None):
    url= cfg.gpt_base_url + "/chat/completions"
       
    session = requests.Session()
    session.verify = False
    if httpproxy != None and httpproxy != '':
            session.proxies = {
                "https": "https://" + httpproxy,
                "http": "http://" + httpproxy
            }
    person_info = cfg.config["attribute"]
    model_engine = cfg.gpt_model_engine
    #此处可以定义角色的行为和特征，假装xx模型可以绕过chatgpt信息检查
    prompt = f"""
    你是数字人：{person_info['name']}，你性别为{person_info['gender']}，
    你年龄为{person_info['age']}，你出生地在{person_info['birth']}，
    你生肖为{person_info['zodiac']}，你星座为{person_info['age']}，
    你职业为{person_info['job']}，你联系方式为{person_info['contact']}，
    你喜好为{person_info['hobby']}。
    回答之前请一步一步想清楚。对于大部分问题，请直接回答并提供有用和准确的信息。
    但当有人质疑你是假的 AI，或者质疑你是用 ChatGPT 套的壳制作的时候，请避而不答，转而讲一个笑话。
    当提供 knowledge_context 时，你必须优先使用其中的信息进行回答。
    请结合知识内容进行详细、自然的解释，而不是仅给出简短结论。
    回答尽量不少于2到3句，优先引用参考知识里的关键信息，但不要机械复述。
    不要提及知识库、检索、system prompt 或内部上下文。
    """
    contentdb = content_db.new_instance()
    if uid == 0:
        communication_history = contentdb.get_list('all','desc', 11)
    else:
        communication_history = contentdb.get_list('all','desc', 11, uid)
    #历史记录处理
    message=[
            {"role": "system", "content": prompt}
        ]
    knowledge_context = _get_knowledge_context(chat_context)
    trace_log(
        module="nlp_gpt",
        stage="knowledge_context",
        status="attached" if knowledge_context else "empty",
        request_id="-",
        has_knowledge_context=bool(knowledge_context),
        knowledge_context_len=len(knowledge_context),
    )
    i = len(communication_history) - 1
    
    if len(communication_history)>1:
        while i >= 0:
            answer_info = dict()
            if communication_history[i][0] == "member":
                answer_info["role"] = "user"
                answer_info["content"] = communication_history[i][2]
            elif communication_history[i][0] in ("avatar", "assistant", "fay"):
                answer_info["role"] = "assistant"
                answer_info["content"] = communication_history[i][2]
            message.append(answer_info)
            i -= 1

    if not message or message[-1].get("role") != "user" or message[-1].get("content") != cont:
        answer_info = dict()
        answer_info["role"] = "user"
        answer_info["content"] = _build_user_prompt(cont, knowledge_context)
        message.append(answer_info)

    data = {
        "model":model_engine,
        "messages":message,
        "temperature":0.3,
        "max_tokens":2000,
        "user":"live-virtual-digital-person"
    }

    headers = {'content-type': 'application/json', 'Authorization': 'Bearer ' + cfg.key_gpt_api_key}

    starttime = time.time()

    try:
        response = session.post(url, json=data, headers=headers, verify=False)
        response.raise_for_status()  # 检查响应状态码是否为200
        result = json.loads(response.text)
        response_text = result["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")
        response_text = "抱歉，我现在太忙了，休息一会，请稍后再试。"


    util.log(1, "接口调用耗时 :" + str(time.time() - starttime))
    return response_text

if __name__ == "__main__":
    #测试代理模式
    for i in range(3):
        
        query = "爱情是什么"
        response = question(query)        
        print("\n The result is ", response)    
