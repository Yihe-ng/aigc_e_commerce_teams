# 作用是处理交互逻辑，文字输入，语音、文字及情绪的发送、播放及展示输出
import math
import os
import time
import socket
import wave
import pygame
import requests
from pydub import AudioSegment

# 适应模型使用
import numpy as np

from ai_module import baidu_emotion
from core import wsa_server
from core.interact import Interact
from tts.tts_voice import EnumVoice
from scheduler.thread_manager import MyThread
from tts import tts_voice
from utils import util, config_util
from core import qa_service
from utils import config_util as cfg
from core import content_db
from ai_module import nlp_cemotion
from llm import nlp_rasa
from llm import nlp_gpt
from llm import nlp_lingju
from llm import nlp_xingchen
from llm import nlp_langchain
from llm import nlp_ollama_api
from llm import nlp_coze
from core import member_db
from backend.services.forbidden_words_service import check_text as check_forbidden_text
from backend.services.knowledge_service import detect_domain as detect_knowledge_domain
from backend.services.knowledge_service import retrieve_context_details as retrieve_knowledge_context_details
from backend.services.knowledge_service import should_enhance as should_knowledge_enhance
from backend.services.product_intro_service import resolve_product_intro
from backend.lipsync.manager import lip_sync_manager
from utils.trace_utils import summarize_text, trace_log
import threading
import functools
import traceback  # 确保导入

# 加载配置
cfg.load_config()
if cfg.tts_module == 'ali':
    from tts.ali_tss import Speech
elif cfg.tts_module == 'qwen3':
    from tts.qwen3 import Speech
elif cfg.tts_module == 'gptsovits':
    from tts.gptsovits import Speech
elif cfg.tts_module == 'gptsovits_v3':
    from tts.gptsovits_v3 import Speech
elif cfg.tts_module == 'volcano':
    from tts.volcano_tts import Speech
elif cfg.tts_module == 'azure':
    from tts.ms_tts_sdk import Speech
elif cfg.tts_module == 'gpt':  # 添加对GPT模型的支持
    from tts.gpt import Speech
else:
    from tts.ms_tts_sdk import Speech

# windows运行推送唇形数据
import platform

if platform.system() == "Windows":
    import sys

    sys.path.append("test/ovr_lipsync")
    try:
        from test_olipsync import LipSyncGenerator
    except ModuleNotFoundError:
        LipSyncGenerator = None

modules = {
    "nlp_gpt": nlp_gpt,
    "nlp_rasa": nlp_rasa,
    "nlp_lingju": nlp_lingju,
    "nlp_xingchen": nlp_xingchen,
    "nlp_langchain": nlp_langchain,
    "nlp_ollama_api": nlp_ollama_api,
    "nlp_coze": nlp_coze
}

GUIDE_IDENTITY_REPLY = "我是这边的导购助手，可以帮你介绍商品、推荐款式、解答面料和洗护问题～你现在想看哪一类呢？"
GUIDE_IDENTITY_QUERIES = (
    "你是谁",
    "介绍一下你自己",
    "你能做什么",
    "你叫什么",
    "你是做什么的",
)


def get_guide_identity_reply(text: str) -> str:
    content = str(text or "").strip()
    if not content:
        return ""
    if any(query in content for query in GUIDE_IDENTITY_QUERIES):
        return GUIDE_IDENTITY_REPLY
    return ""


# 大语言模型回复
def handle_chat_message(msg, username='User', request_id='', chat_context=None, has_product_context=False):
    text = ''
    textlist = []
    started_at = time.perf_counter()
    try:
        util.printInfo(1, username, '自然语言处理...')
        tm = time.time()
        cfg.load_config()
        module_name = "nlp_" + cfg.key_chat_module
        selected_module = modules.get(module_name)
        if selected_module is None:
            # 默认使用GPT模型
            selected_module = nlp_gpt
        trace_log(
            module="avatar",
            stage="nlp_dispatch",
            status="ok",
            request_id=request_id,
            user=username,
            provider=module_name,
            has_knowledge_context=bool(isinstance(chat_context, dict) and str(chat_context.get("knowledge_context") or "").strip()),
            knowledge_context_len=len(str((chat_context or {}).get("knowledge_context") or "")),
        )

        if cfg.key_chat_module == 'rasa':
            textlist = selected_module.question(msg)
            text = textlist[0]['text']
        else:
            uid = member_db.new_instance().find_user(username)
            if module_name == "nlp_gpt":
                text = selected_module.question(
                    msg,
                    uid,
                    chat_context=chat_context,
                    has_product_context=has_product_context,
                )
            else:
                text = selected_module.question(msg, uid)
        util.printInfo(1, username, '自然语言处理完成. 耗时: {} ms'.format(math.floor((time.time() - tm) * 1000)))
        if text == '哎呀，你这么说我也不懂，详细点呗' or text == '':
            util.printInfo(1, username, '[!] 自然语言无语了！')
            text = '哎呀，你这么说我也不懂，详细点呗'
    except BaseException as e:
        print(e)
        trace_log(
            module="avatar",
            stage="nlp_exception",
            status="error",
            request_id=request_id,
            error=summarize_text(e),
            time_cost=(time.perf_counter() - started_at) * 1000,
            user=username,
        )
        util.printInfo(1, username, '自然语言处理错误！')
        text = '哎呀，你这么说我也不懂，详细点呗'

    trace_log(
        module="avatar",
        stage="nlp",
        status="ok" if text else "error",
        request_id=request_id,
        time_cost=(time.perf_counter() - started_at) * 1000,
        user=username,
        provider="nlp_" + str(cfg.key_chat_module),
        text_len=len(text),
        text_preview=summarize_text(text),
    )
    return text, textlist


# 可以使用自动播放的标记
can_auto_play = True
auto_play_lock = threading.Lock()


class FeiFei:
    def __init__(self):
        self.lock = threading.Lock()
        self.mood = 0.0  # 情绪值
        self.old_mood = 0.0
        self.item_index = 0
        self.X = np.array([1, 0, 0, 0, 0, 0, 0, 0]).reshape(1, -1)  # 适应模型变量矩阵
        # self.W = np.array([0.01577594,1.16119452,0.75828,0.207746,1.25017864,0.1044121,0.4294899,0.2770932]).reshape(-1,1) #适应模型变量矩阵
        self.W = np.array([0.0, 0.6, 0.1, 0.7, 0.3, 0.0, 0.0, 0.0]).reshape(-1, 1)  # 适应模型变量矩阵

        self.wsParam = None
        self.wss = None
        self.sp = Speech()
        self._tts_cache = {}
        self.speaking = False  # 声音是否在播放
        self.__running = True
        self.sp.connect()  # TODO 预连接
        self.cemotion = None

    # 语音消息处理检查是否命中q&a
    def __get_answer(self, interleaver, text):
        answer = None
        # 全局问答
        answer = qa_service.QAService().question('qa', text)
        if answer is not None:
            return answer

    # 语音消息处理
    def __process_interact(self, interact: Interact):
        if self.__running:
            try:
                index = interact.interact_type
                if index == 1:  # 语音文字交互
                    request_id = interact.data.get("request_id", "")
                    trace_log(
                        module="avatar",
                        stage="on_interact",
                        status="ok",
                        request_id=request_id,
                        user=interact.data.get("user", "User"),
                        text_len=len(str(interact.data.get("msg", "") or "")),
                        text_preview=summarize_text(interact.data.get("msg", "")),
                    )
                    # 记录用户问题,方便obs等调用
                    self.write_to_file("./logs", "asr_result.txt", interact.data["msg"])

                    # 同步用户问题到数字人
                    if wsa_server.get_instance().is_connected(interact.data.get("user")):
                        content = {'Topic': 'Unreal', 'Data': {'Key': 'question', 'Value': interact.data["msg"]},
                                   'Username': interact.data.get("user")}
                        wsa_server.get_instance().add_cmd(content)

                    # 记录用户
                    username = interact.data.get("user", "User")
                    if member_db.new_instance().is_username_exist(username) == "notexists":
                        member_db.new_instance().add_user(username)
                    uid = member_db.new_instance().find_user(username)

                    # 记录用户问题
                    content_db.new_instance().add_content('member', 'speak', interact.data["msg"], username, uid)
                    if wsa_server.get_web_instance().is_connected(username):
                        wsa_server.get_web_instance().add_cmd({"panelReply": {"type": "member",
                                                                              "content": interact.data["msg"],
                                                                              "username": username, "uid": uid},
                                                               "Username": username})

                    # 商品介绍类请求优先走结构化匹配，避免被历史 QA 误命中并持续污染 qa.csv
                    text = ''
                    textlist = []
                    original_msg = interact.data["msg"]
                    safe_reply = getattr(cfg, "audit_fallback_reply", '这个问题我不太方便回答，我们换个话题聊聊吧')
                    intro_resolution = {"handled": False, "llm_input": None, "reply_text": None, "matched_product": None}
                    answer = None
                    used_audit_fallback = False
                    record_generated_qa = False

                    has_input_forbidden = False
                    input_forbidden_word = ""
                    if getattr(cfg, "audit_enabled", True) and getattr(cfg, "audit_input_enabled", True):
                        try:
                            has_input_forbidden, input_forbidden_word = check_forbidden_text(original_msg)
                            trace_log(
                                module="avatar",
                                stage="audit_input",
                                status="blocked" if has_input_forbidden else "pass",
                                request_id=request_id,
                                user=username,
                                blocked_word=input_forbidden_word if has_input_forbidden else "",
                            )
                        except Exception as e:
                            trace_log(
                                module="avatar",
                                stage="audit_input",
                                status="error",
                                request_id=request_id,
                                user=username,
                                error=str(e),
                            )
                            has_input_forbidden = False
                            input_forbidden_word = ""
                    else:
                        trace_log(
                            module="avatar",
                            stage="audit_input",
                            status="skip",
                            request_id=request_id,
                            user=username,
                            reason="audit_disabled",
                        )

                    if has_input_forbidden:
                        text = safe_reply
                        used_audit_fallback = True
                        util.printInfo(1, username, f'[Audit] User input blocked: {input_forbidden_word}')
                    else:
                        identity_reply = get_guide_identity_reply(original_msg)
                        if identity_reply:
                            answer = identity_reply
                        else:
                            intro_resolution = resolve_product_intro(original_msg)
                            if intro_resolution.get("reply_text"):
                                answer = intro_resolution.get("reply_text")

                    llm_input = original_msg
                    should_call_llm = (not has_input_forbidden) and answer is None
                    has_product_context = intro_resolution.get("response_mode") in ("product_intro", "product_qa") if intro_resolution else False
                    knowledge_context = None
                    knowledge_domain = detect_knowledge_domain(original_msg)
                    knowledge_dataset_name = ""
                    if should_call_llm:
                        llm_input = intro_resolution.get("llm_input") or original_msg
                        knowledge_reason = "not_attempted"
                        if intro_resolution.get("handled") and not intro_resolution.get("allow_knowledge_enhance", False):
                            knowledge_reason = "product_intro_handled"
                        elif not getattr(cfg, "knowledge_enabled", False):
                            knowledge_reason = "knowledge_disabled"
                        elif not should_knowledge_enhance(original_msg):
                            knowledge_reason = "no_keyword_match"
                        elif cfg.key_chat_module != 'gpt':
                            knowledge_reason = "provider_not_supported"
                        else:
                            knowledge_result = retrieve_knowledge_context_details(original_msg, domain=knowledge_domain)
                            knowledge_context = knowledge_result.get("context")
                            knowledge_domain = knowledge_result.get("domain") or knowledge_domain
                            knowledge_dataset_name = str(knowledge_result.get("dataset_name") or "")
                            knowledge_reason = knowledge_result.get("reason") or ("context_loaded" if knowledge_context else "context_unavailable")
                        trace_log(
                            module="avatar",
                            stage="knowledge",
                            status="hit" if knowledge_context else "skip",
                            request_id=request_id,
                            user=username,
                            provider=str(cfg.key_chat_module),
                            domain=knowledge_domain or "",
                            dataset_name=knowledge_dataset_name,
                            reason=knowledge_reason,
                            context_len=len(knowledge_context or ""),
                        )
                        if should_call_llm and wsa_server.get_web_instance().is_connected(username):
                            wsa_server.get_web_instance().add_cmd({"panelMsg": "思考中...", "Username": username,
                                                                   'robot': f'http://{cfg.backend_api_url}/robot/Thinking.jpg'})
                        if should_call_llm and wsa_server.get_instance().is_connected(username):
                            content = {'Topic': 'Unreal', 'Data': {'Key': 'log', 'Value': "思考中..."},
                                       'Username': username, 'robot': f'http://{cfg.backend_api_url}/robot/Thinking.jpg'}
                            wsa_server.get_instance().add_cmd(content)
                        if should_call_llm:
                            chat_context = {"knowledge_context": knowledge_context} if knowledge_context else None
                            text, textlist = handle_chat_message(
                                llm_input,
                                username,
                                request_id=request_id,
                                chat_context=chat_context,
                                has_product_context=has_product_context,
                            )
                            record_generated_qa = not intro_resolution.get("handled")
                    else:
                        knowledge_skip_reason = "input_audit_blocked" if has_input_forbidden else "answer_already_available"
                        trace_log(
                            module="avatar",
                            stage="knowledge",
                            status="skip",
                            request_id=request_id,
                            user=username,
                            provider=str(cfg.key_chat_module),
                            domain=knowledge_domain or "",
                            dataset_name="",
                            reason=knowledge_skip_reason,
                            context_len=0,
                        )
                        if answer is not None:
                            text = answer

                    if text and getattr(cfg, "audit_enabled", True) and getattr(cfg, "audit_output_enabled", True):
                        has_output_forbidden, output_forbidden_word = check_forbidden_text(text)
                        trace_log(
                            module="avatar",
                            stage="audit_output",
                            status="blocked" if has_output_forbidden else "pass",
                            request_id=request_id,
                            user=username,
                            blocked_word=output_forbidden_word if has_output_forbidden else "",
                        )
                        if has_output_forbidden:
                            text = safe_reply
                            textlist = []
                            used_audit_fallback = True
                            util.printInfo(1, username, f'[Audit] Model output blocked: {output_forbidden_word}')
                    else:
                        trace_log(
                            module="avatar",
                            stage="audit_output",
                            status="skip",
                            request_id=request_id,
                            user=username,
                            reason="audit_disabled_or_empty_reply",
                        )

                    if record_generated_qa and text and not used_audit_fallback:
                        qa_service.QAService().record_qapair(original_msg, text)  # 沟通记录缓存到qa文件

                    # 记录回复
                    self.write_to_file("./logs", "answer_result.txt", text)
                    content_db.new_instance().add_content('avatar', 'speak', text, username, uid)
                    trace_log(
                        module="avatar",
                        stage="reply_ready",
                        status="ok",
                        request_id=request_id,
                        user=username,
                        text_len=len(text),
                        text_preview=summarize_text(text),
                    )
                    lip_sync_manager.register_text_timeline(text, request_id=request_id)

                    # 文字输出：面板、聊天窗、log、数字人
                    if wsa_server.get_web_instance().is_connected(username):
                        wsa_server.get_web_instance().add_cmd({"panelMsg": "回复中...", "Username": username,
                                                               'robot': f'http://{cfg.backend_api_url}/robot/Speaking.jpg'})
                        wsa_server.get_web_instance().add_cmd(
                            {"panelReply": {"type": "avatar", "content": text, "username": username, "uid": uid},
                             "Username": username})
                    if len(textlist) > 1:
                        i = 1
                        while i < len(textlist):
                            content_db.new_instance().add_content('avatar', 'speak', textlist[i]['text'], username, uid)
                            if wsa_server.get_web_instance().is_connected(username):
                                wsa_server.get_web_instance().add_cmd({"panelReply": {"type": "avatar",
                                                                                      "content": textlist[i]['text'],
                                                                                      "username": username, "uid": uid},
                                                                       "Username": username,
                                                                       'robot': f'http://{cfg.backend_api_url}/robot/Speaking.jpg'})
                            i += 1
                    util.printInfo(1, interact.data.get('user'), '({}) {}'.format(self.__get_mood_voice(), text))
                    if wsa_server.get_instance().is_connected(username):
                        content = {'Topic': 'Unreal', 'Data': {'Key': 'text', 'Value': text}, 'Username': username,
                                   'robot': f'http://{cfg.backend_api_url}/robot/Speaking.jpg'}
                        wsa_server.get_instance().add_cmd(content)

                    # 声音输出
                    MyThread(target=self.say, args=[interact, text]).start()

                    return text

                elif (index == 2):  # 透传模式，用于适配自动播放控制及agent的通知工具
                    # 记录用户
                    username = interact.data.get("user", "User")
                    if member_db.new_instance().is_username_exist(username) == "notexists":
                        member_db.new_instance().add_user(username)
                    uid = member_db.new_instance().find_user(username)

                    # TODO 这里可以通过qa来触发指定的脚本操作，如ppt翻页等

                    if interact.data.get("text"):
                        # 记录回复
                        text = interact.data.get("text")
                        self.write_to_file("./logs", "answer_result.txt", text)
                        content_db.new_instance().add_content('avatar', 'speak', text, username, uid)

                        # 文字输出：面板、聊天窗、log、数字人
                        if wsa_server.get_web_instance().is_connected(username):
                            wsa_server.get_web_instance().add_cmd({"panelMsg": "回复中...", "Username": username,
                                                                   'robot': f'http://{cfg.backend_api_url}/robot/Speaking.jpg'})
                            wsa_server.get_web_instance().add_cmd(
                                {"panelReply": {"type": "avatar", "content": text, "username": username, "uid": uid},
                                 "Username": username})
                        lip_sync_manager.register_text_timeline(text, request_id=interact.data.get("request_id", ""))
                        util.printInfo(1, interact.data.get('user'), '({}) {}'.format(self.__get_mood_voice(), text))
                        if wsa_server.get_instance().is_connected(username):
                            content = {'Topic': 'Unreal', 'Data': {'Key': 'text', 'Value': text}, 'Username': username,
                                       'robot': f'http://{cfg.backend_api_url}/robot/Speaking.jpg'}
                            wsa_server.get_instance().add_cmd(content)

                    # 声音输出
                    MyThread(target=self.say, args=[interact, text]).start()

            except BaseException as e:
                print(e)
                return "哎呀，出错了！请稍后再试"
        else:
            return "还没有开始运行"

    # 记录问答到log
    def write_to_file(self, path, filename, content):
        if not os.path.exists(path):
            os.makedirs(path)
        full_path = os.path.join(path, filename)
        safe_content = "" if content is None else str(content)
        with open(full_path, 'w', encoding='utf-8') as file:
            file.write(safe_content)
            file.flush()
            os.fsync(file.fileno())

            # 触发语音交互

    def on_interact(self, interact: Interact):
        MyThread(target=self.__update_mood, args=[interact]).start()
        return self.__process_interact(interact)

    # 发送情绪
    def __send_mood(self):
        while self.__running:
            time.sleep(3)
            ws_instance = wsa_server.get_instance()
            if ws_instance is not None and ws_instance.is_connected("User"):
                if self.old_mood != self.mood:
                    content = {'Topic': 'Unreal', 'Data': {'Key': 'mood', 'Value': self.mood}}
                    ws_instance.add_cmd(content)
                    self.old_mood = self.mood

    # TODO 考虑重构这个逻辑
    # 更新情绪
    def __update_mood(self, interact):
        perception = config_util.config["interact"]["perception"]
        if interact.interact_type == 1:
            try:
                if cfg.ltp_mode == "cemotion":
                    result = nlp_cemotion.get_sentiment(self.cemotion, interact.data["msg"])
                    chat_perception = perception["chat"]
                    if result >= 0.5 and result <= 1:
                        self.mood = self.mood + (chat_perception / 150.0)
                    elif result <= 0.2:
                        self.mood = self.mood - (chat_perception / 100.0)
                else:
                    if str(cfg.baidu_emotion_api_key) == '' or str(cfg.baidu_emotion_app_id) == '' or str(
                            cfg.baidu_emotion_secret_key) == '':
                        self.mood = 0
                    else:
                        result = int(baidu_emotion.get_sentiment(interact.data["msg"]))
                        chat_perception = perception["chat"]
                        if result >= 2:
                            self.mood = self.mood + (chat_perception / 150.0)
                        elif result == 0:
                            self.mood = self.mood - (chat_perception / 100.0)
            except BaseException as e:
                self.mood = 0
                print("[System] 情绪更新错误！")
                print(e)

        elif interact.interact_type == 2:
            self.mood = self.mood + (perception["join"] / 100.0)

        elif interact.interact_type == 3:
            self.mood = self.mood + (perception["gift"] / 100.0)

        elif interact.interact_type == 4:
            self.mood = self.mood + (perception["follow"] / 100.0)

        if self.mood >= 1:
            self.mood = 1
        if self.mood <= -1:
            self.mood = -1

    # 获取不同情绪声音
    def __get_mood_voice(self):
        voice = tts_voice.get_voice_of(config_util.config["attribute"]["voice"])
        if voice is None:
            voice = EnumVoice.XIAO_XIAO
        styleList = voice.value["styleList"]
        sayType = styleList["calm"]
        if -1 <= self.mood < -0.5:
            sayType = styleList["angry"]
        if -0.5 <= self.mood < -0.1:
            sayType = styleList["lyrical"]
        if -0.1 <= self.mood < 0.1:
            sayType = styleList["calm"]
        if 0.1 <= self.mood < 0.5:
            sayType = styleList["assistant"]
        if 0.5 <= self.mood <= 1:
            sayType = styleList["cheerful"]
        return sayType

    def __get_tts_speech(self):
        voice_value = None
        try:
            voice_value = config_util.config["attribute"]["voice"]
        except Exception:
            voice_value = None

        voice = tts_voice.get_voice_of(voice_value) if voice_value else None
        voice_str = voice_value if isinstance(voice_value, str) else ""
        is_qwen_voice = (
                (voice in (EnumVoice.QWEN3_FEMALE, EnumVoice.QWEN3_MALE))
                or (voice_str.startswith("qwen_") or voice_str.startswith("Qwen"))
        )
        is_gpt_voice = (
                (voice in (EnumVoice.GPT_FEMALE, EnumVoice.GPT_MALE))
                or (voice_str.startswith("gpt_") or voice_str.startswith("GPT"))
        )
        is_ms_voice = (voice is not None) and (
                voice not in (EnumVoice.QWEN3_FEMALE, EnumVoice.QWEN3_MALE, EnumVoice.GPT_FEMALE,
                              EnumVoice.GPT_MALE))
        is_volcano_voice = voice_str.startswith("volcano_") or voice_str.startswith("火山")
        is_ali_voice = (
                isinstance(voice_value, str)
                and voice_value != ""
                and voice_value.replace("_", "").isalnum()
                and not is_qwen_voice
                and not is_gpt_voice
                and not is_volcano_voice
        )

        # 添加对GPT模型的支持
        if is_gpt_voice:
            if cfg.tts_module == "gpt":
                return self.sp
            sp = self._tts_cache.get("gpt")
            if sp is None:
                from tts.gpt import Speech as GPTSpeech
                sp = GPTSpeech()
                try:
                    sp.connect()
                except Exception as e:
                    util.log(1, f"GPT-TTS connect error: {e}")
                self._tts_cache["gpt"] = sp
            return sp

        if is_qwen_voice:
            if cfg.tts_module == "qwen3":
                return self.sp
            sp = self._tts_cache.get("qwen3")
            if sp is None:
                from tts.qwen3 import Speech as QwenSpeech
                sp = QwenSpeech()
                try:
                    sp.connect()
                except Exception as e:
                    util.log(1, f"Qwen3-TTS connect error: {e}")
                self._tts_cache["qwen3"] = sp
            return sp

        if is_volcano_voice:
            if cfg.tts_module == "volcano":
                return self.sp
            sp = self._tts_cache.get("volcano")
            if sp is None:
                from tts.volcano_tts import Speech as VolcanoSpeech
                sp = VolcanoSpeech()
                try:
                    sp.connect()
                except Exception as e:
                    util.log(1, f"Volcano TTS connect error: {e}")
                self._tts_cache["volcano"] = sp
            return sp

        if is_ali_voice:
            if cfg.tts_module == "ali":
                return self.sp
            sp = self._tts_cache.get("ali")
            if sp is None:
                from tts.ali_tss import Speech as AliSpeech
                sp = AliSpeech()
                try:
                    sp.connect()
                except Exception as e:
                    util.log(1, f"Ali TTS connect error: {e}")
                self._tts_cache["ali"] = sp
            return sp

        if is_ms_voice:
            if cfg.tts_module in ("azure", "ms"):
                return self.sp
            sp = self._tts_cache.get("ms")
            if sp is None:
                from tts.ms_tts_sdk import Speech as MsSpeech
                sp = MsSpeech()
                try:
                    sp.connect()
                except Exception as e:
                    util.log(1, f"MS TTS connect error: {e}")
                self._tts_cache["ms"] = sp
            return sp

        return self.sp

    # 合成声音
    def say(self, interact, text):
        try:
            request_id = interact.data.get("request_id", "")
            started_at = time.perf_counter()
            result = None
            tts_error_code = ""
            tts_error_detail = ""
            text = "" if text is None else str(text)
            audio_url = interact.data.get('audio')  # 透传的音频
            if audio_url is not None:
                file_name = 'sample-' + str(int(time.time() * 1000)) + '.wav'
                result = self.download_wav(audio_url, './samples/', file_name)
                trace_log(
                    module="avatar",
                    stage="audio_passthrough",
                    status="ok" if result else "error",
                    request_id=request_id,
                    time_cost=(time.perf_counter() - started_at) * 1000,
                    user=interact.data.get("user"),
                    filename=os.path.basename(result) if result else "",
                    audio_url=summarize_text(audio_url),
                )
            elif config_util.config["interact"]["playSound"] or wsa_server.get_instance().is_connected(
                    interact.data.get("user")) or self.__is_send_remote_device_audio(interact):  # tts
                util.printInfo(1, interact.data.get('user'), '合成音频...')
                tm = time.time()
                sp = self.__get_tts_speech()
                try:
                    trace_log(
                        module="avatar",
                        stage="tts_start",
                        status="ok",
                        request_id=request_id,
                        user=interact.data.get("user"),
                        provider=type(sp).__module__ + "." + type(sp).__name__,
                        text_len=len(text),
                        text_preview=summarize_text(text),
                    )
                    result = sp.to_sample(text.replace("*", ""), self.__get_mood_voice(), request_id=request_id)
                    tts_error_code = getattr(sp, "last_error_code", "")
                    tts_error_detail = getattr(sp, "last_error_detail", "")
                except AttributeError as ae:
                    util.log(1, f"[AVATAR-CORE] TTS 实例缺少 to_sample: {ae}")
                    traceback.print_exc()
                    trace_log(
                        module="avatar",
                        stage="tts_call",
                        status="error",
                        request_id=request_id,
                        error=summarize_text(ae),
                        time_cost=(time.perf_counter() - started_at) * 1000,
                        user=interact.data.get("user"),
                    )
                    result = None
                except Exception as e:
                    util.log(1, f"[AVATAR-CORE] to_sample 异常: {e}")
                    traceback.print_exc()
                    trace_log(
                        module="avatar",
                        stage="tts_call",
                        status="error",
                        request_id=request_id,
                        error=summarize_text(e),
                        time_cost=(time.perf_counter() - started_at) * 1000,
                        user=interact.data.get("user"),
                    )
                    result = None
                util.printInfo(1, interact.data.get('user'),
                               '合成音频完成. 耗时: {} ms 文件:{}'.format(math.floor((time.time() - tm) * 1000),
                                                                          result))

            if result is not None:
                trace_log(
                    module="avatar",
                    stage="tts_result",
                    status="ok",
                    request_id=request_id,
                    time_cost=(time.perf_counter() - started_at) * 1000,
                    user=interact.data.get("user"),
                    filename=os.path.basename(result),
                    text_len=len(text),
                )
                MyThread(target=self.__process_output_audio, args=[result, interact, text]).start()
                return result
            else:
                trace_log(
                    module="avatar",
                    stage="tts_result",
                    status="error",
                    request_id=request_id,
                    time_cost=(time.perf_counter() - started_at) * 1000,
                    user=interact.data.get("user"),
                    error=tts_error_code or "audio_not_generated",
                    detail=summarize_text(tts_error_detail),
                    text_len=len(text),
                )
                if wsa_server.get_web_instance().is_connected(interact.data.get('user')):
                    panel_msg = ""
                    if tts_error_code == "provider_unreachable":
                        panel_msg = "语音服务不可达"
                    elif tts_error_code == "provider_error":
                        panel_msg = "语音服务返回异常"
                    elif tts_error_code == "empty_audio":
                        panel_msg = "语音生成为空"
                    wsa_server.get_web_instance().add_cmd({"panelMsg": panel_msg, 'Username': interact.data.get('user'),
                                                           'robot': f'http://{cfg.backend_api_url}/robot/Normal.jpg'})
                # 使用广播发送给所有连接的客户端
                content = {'Topic': 'Unreal', 'Data': {'Key': 'log', 'Value': ''},
                           'Username': interact.data.get('user'),
                           'robot': f'http://{cfg.backend_api_url}/robot/Normal.jpg'}
                wsa_server.get_instance().add_cmd(content)
        except Exception as e:
            print(f"[AVATAR-CORE] say error: {e}")
            trace_log(
                module="avatar",
                stage="say",
                status="error",
                request_id=interact.data.get("request_id", ""),
                error=summarize_text(e),
                user=interact.data.get("user"),
            )
            traceback.print_exc()  # 打印完整堆栈

    # 下载wav
    def download_wav(self, url, save_directory, filename):
        try:
            # 发送HTTP GET请求以获取WAV文件内容
            response = requests.get(url, stream=True)
            response.raise_for_status()  # 检查请求是否成功

            # 确保保存目录存在
            if not os.path.exists(save_directory):
                os.makedirs(save_directory)

            # 构建保存文件的路径
            save_path = os.path.join(save_directory, filename)

            # 将WAV文件内容保存到指定文件
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=1024):
                    if chunk:
                        f.write(chunk)

            return save_path
        except requests.exceptions.RequestException as e:
            print(f"[Error] Failed to download file: {e}")
            return None

    # 面板播放声音
    def __play_sound(self, file_url, audio_length, interact):
        util.printInfo(1, interact.data.get('user'), '播放音频...')
        pygame.mixer.init()
        pygame.mixer.music.load(file_url)
        pygame.mixer.music.play()

        # 等待音频播放完成，唤醒模式不用等待

        length = 0
        while True:
            if audio_length + 0.01 > length:
                length = length + 0.01
                time.sleep(0.01)
            else:
                break
        if wsa_server.get_instance().is_connected(interact.data.get("user")):
            wsa_server.get_web_instance().add_cmd({"panelMsg": "", 'Username': interact.data.get('user')})

    # 推送远程音频
    def __send_remote_device_audio(self, file_url, interact):
        import avatar_runtime
        delkey = None
        for key, value in avatar_runtime.DeviceInputListenerDict.items():
            if value.username == interact.data.get(
                    "user") and value.isOutput:  # 按username选择推送，booter.devicelistenerdice按用户名记录
                try:
                    value.deviceConnector.send(b"\x00\x01\x02\x03\x04\x05\x06\x07\x08")  # 发送音频开始标志，同时也检查设备是否在线
                    wavfile = open(os.path.abspath(file_url), "rb")
                    data = wavfile.read(102400)
                    total = 0
                    while data:
                        total += len(data)
                        value.deviceConnector.send(data)
                        data = wavfile.read(102400)
                        time.sleep(0.0001)
                    value.deviceConnector.send(b'\x08\x07\x06\x05\x04\x03\x02\x01\x00')  # 发送音频结束标志
                    util.printInfo(1, value.username, "远程音频发送完成：{}".format(total))
                except socket.error as serr:
                    util.printInfo(1, value.username, "远程音频输入输出设备已经断开：{}".format(key))
                    value.stop()
                    delkey = key
        if delkey:
            value = avatar_runtime.DeviceInputListenerDict.pop(delkey)
            if wsa_server.get_web_instance().is_connected(interact.data.get('user')):
                wsa_server.get_web_instance().add_cmd(
                    {"remote_audio_connect": False, "Username": interact.data.get('user')})

    def __is_send_remote_device_audio(self, interact):
        import avatar_runtime
        for key, value in avatar_runtime.DeviceInputListenerDict.items():
            if value.username == interact.data.get("user") and value.isOutput:
                return True
        return False

        # 输出音频处理

    def __process_output_audio(self, file_url, interact, text):
        try:
            try:
                audio = AudioSegment.from_wav(file_url)
                audio_length = len(audio) / 1000.0  # 时长以秒为单位
            except Exception as e:
                audio_length = 3

            # 自动播放关闭
            global auto_play_lock
            global can_auto_play
            with auto_play_lock:
                can_auto_play = False

            self.speaking = True
            # 推送远程音频
            MyThread(target=self.__send_remote_device_audio, args=[file_url, interact]).start()
            # 基于音频能量的唇形同步帧推送
            MyThread(target=self.__push_web_lip_sync, args=[file_url, interact]).start()

            # 发送音频给数字人接口
            if wsa_server.get_instance().is_connected(interact.data.get("user")):
                content = {'Topic': 'Unreal', 'Data': {'Key': 'audio', 'Value': os.path.abspath(file_url),
                                                       'HttpValue': f'http://{cfg.backend_api_url}/audio/' + os.path.basename(
                                                           file_url), 'Text': text, 'Time': audio_length,
                                                       'Type': 'interact'}, 'Username': interact.data.get('user')}
                # 计算lips
                if platform.system() == "Windows":
                    try:
                        if LipSyncGenerator is not None:
                            lip_sync_generator = LipSyncGenerator()
                            viseme_list = lip_sync_generator.generate_visemes(os.path.abspath(file_url))
                            consolidated_visemes = lip_sync_generator.consolidate_visemes(viseme_list)
                            content["Data"]["Lips"] = consolidated_visemes
                    except Exception as e:
                        print(f"[AVATAR-CORE] lip sync error: {e}")
                        util.printInfo(1, interact.data.get("user"), "唇型数据生成失败")
                wsa_server.get_instance().add_cmd(content)
                util.printInfo(1, interact.data.get("user"), "数字人接口发送音频数据成功")

            # 播放完成通知
            threading.Timer(audio_length, self.send_play_end_msg, [interact]).start()

        except Exception as e:
            print(f"[AVATAR-CORE] output audio error: {e}")

    def __push_web_lip_sync(self, file_url, interact):
        try:
            username = interact.data.get("user", "User")
            request_id = interact.data.get("request_id", "")
            if not file_url:
                return
            lip_sync_manager.stream_wav_file(
                file_url,
                username=username,
                request_id=request_id,
                lead_in_ms=220,
            )
        except Exception as e:
            print(f"[AVATAR-CORE] lip sync stream error: {e}")

    def send_play_end_msg(self, interact):
        if wsa_server.get_web_instance().is_connected(interact.data.get('user')):
            wsa_server.get_web_instance().add_cmd({"panelMsg": "", 'Username': interact.data.get('user'),
                                                   'robot': f'http://{cfg.backend_api_url}/robot/Normal.jpg'})
        if wsa_server.get_instance().is_connected(interact.data.get("user")):
            content = {'Topic': 'Unreal', 'Data': {'Key': 'log', 'Value': ""}, 'Username': interact.data.get('user'),
                       'robot': f'http://{cfg.backend_api_url}/robot/Normal.jpg'}
            wsa_server.get_instance().add_cmd(content)
        # 恢复自动播放(如何有)
        global auto_play_lock
        global can_auto_play
        with auto_play_lock:
            can_auto_play = True

        self.speaking = False

    # 启动核心服务
    def start(self):
        if cfg.ltp_mode == "cemotion":
            from cemotion import Cemotion
            self.cemotion = Cemotion()
        MyThread(target=self.__send_mood).start()

    # 停止核心服务
    def stop(self):
        self.__running = False
        self.speaking = False
        try:
            self.sp.close()
        except Exception:
            pass
        for sp in list(getattr(self, "_tts_cache", {}).values()):
            try:
                sp.close()
            except Exception:
                pass
        web_instance = wsa_server.get_web_instance()
        if web_instance is not None:
            web_instance.add_cmd({"panelMsg": ""})
        ws_instance = wsa_server.get_instance()
        if ws_instance is not None:
            content = {'Topic': 'Unreal', 'Data': {'Key': 'log', 'Value': ""}}
            ws_instance.add_cmd(content)


# 中性命名主入口，供 avatar_runtime 等新链路使用。
AvatarCore = FeiFei
