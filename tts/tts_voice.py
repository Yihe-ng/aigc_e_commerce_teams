from enum import Enum


class EnumVoice(Enum):
    XIAO_XIAO_NEW = {
        "name": "晓晓(azure)",
        "voiceName": "zh-CN-XiaoxiaoMultilingualNeural",
        "styleList": {
            "angry": "angry",
            "lyrical": "lyrical",
            "calm": "gentle",
            "assistant": "affectionate",
            "cheerful": "cheerful"
        }
    }
    XIAO_XIAO = {
        "name": "晓晓(edge)",
        "voiceName": "zh-CN-XiaoxiaoNeural",
        "styleList": {
            "angry": "angry",
            "lyrical": "lyrical",
            "calm": "gentle",
            "assistant": "affectionate",
            "cheerful": "cheerful"
        }
    }
    YUN_XI = {
        "name": "云溪",
        "voiceName": "zh-CN-YunxiNeural",
        "styleList": {
            "angry": "angry",
            "lyrical": "disgruntled",
            "calm": "calm",
            "assistant": "assistant",
            "cheerful": "cheerful"
        }
    }
    YUN_JIAN = {
        "name": "云健",
        "voiceName": "zh-CN-YunjianNeural",
        "styleList": {
            "angry": "angry",
            "lyrical": "disgruntled",
            "calm": "calm",
            "assistant": "assistant",
            "cheerful": "cheerful"
        }
    }
    XIAO_YI = {
        "name": "晓伊",
        "voiceName": "zh-CN-XiaoyiNeural",
        "styleList": {
            "angry": "angry",
            "lyrical": "lyrical",
            "calm": "gentle",
            "assistant": "affectionate",
            "cheerful": "cheerful"
        }
    }
    YUN_YANG = {
        "name": "云阳",
        "voiceName": "zh-CN-YunyangNeural",
        "styleList": {
            "angry": "angry",
            "lyrical": "lyrical",
            "calm": "gentle",
            "assistant": "affectionate",
            "cheerful": "cheerful"
        }
    }
    YUN_XIA = {
        "name": "云夏",
        "voiceName": "zh-CN-YunxiaNeural",
        "styleList": {
            "angry": "angry",
            "lyrical": "lyrical",
            "calm": "gentle",
            "assistant": "affectionate",
            "cheerful": "cheerful"
        }
    }
    QWEN3_FEMALE = {
        "name": "Qwen3-灵动女声",
        "voiceName": "vivian",
        "styleList": {
            "angry": "用非常生气、严厉的语气说话",
            "lyrical": "用温柔、感性、充满感情的语气说话",
            "calm": "用平稳、自然、淡定的语气说话",
            "assistant": "用专业、有礼貌的助手语气说话",
            "cheerful": "用开朗、活泼、阳光的语气说话"
        }
    }
    QWEN3_MALE = {
        "name": "Qwen3-稳重男声",
        "voiceName": "eric",
        "styleList": {
            "angry": "用愤怒、低沉、严肃的语气说话",
            "lyrical": "用深情、温柔、儒雅的语气说话",
            "calm": "用平稳、浑厚、冷静的语气说话",
            "assistant": "用沉稳、干练、职业的助手语气说话",
            "cheerful": "用爽朗、阳光、充满活力的语气说话"
        }
    }
    GPT_FEMALE = {
        "name": "GPT-温柔女声",
        "voiceName": "gpt_female",
        "aliases": ["gpt_female"],
        "styleList": {
            "calm": "用平稳、自然、淡定的语气说话",
            "angry": "用愤怒、暴躁的语气说话",
            "lyrical": "用抒情、柔和的语气说话",
            "assistant": "用温柔、体贴的语气说话",
            "cheerful": "用愉快、热情的语气说话"
        }
    }
    GPT_MALE = {
        "name": "GPT-沉稳男声",
        "voiceName": "gpt_male",
        "aliases": ["gpt_male"],
        "styleList": {
            "calm": "用平稳、自然、淡定的语气说话",
            "angry": "用愤怒、暴躁的语气说话",
            "lyrical": "用抒情、柔和的语气说话",
            "assistant": "用温柔、体贴的语气说话",
            "cheerful": "用愉快、热情的语气说话"
        }
    }


ALI_VOICE_OPTIONS = [
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


def get_voice_list():
    return [EnumVoice.XIAO_XIAO_NEW, EnumVoice.YUN_XI, EnumVoice.XIAO_XIAO, EnumVoice.YUN_JIAN, EnumVoice.XIAO_YI, EnumVoice.YUN_YANG, EnumVoice.YUN_XIA, EnumVoice.QWEN3_FEMALE, EnumVoice.QWEN3_MALE, EnumVoice.GPT_FEMALE , EnumVoice.GPT_MALE]


def get_voice_of(name):
    for voice in get_voice_list():
        voice_data = voice.value
        aliases = voice_data.get("aliases", [])
        if name in [voice_data["name"], voice_data["voiceName"], *aliases]:
            return voice
    return None


def _to_voice_option(voice):
    voice_data = voice.value
    return {"id": voice_data["name"], "name": voice_data["name"]}


def get_builtin_voice_options():
    return [_to_voice_option(voice) for voice in get_voice_list()]


def get_qwen_voice_options():
    return [_to_voice_option(EnumVoice.QWEN3_FEMALE), _to_voice_option(EnumVoice.QWEN3_MALE)]


def get_ali_voice_options():
    return [voice.copy() for voice in ALI_VOICE_OPTIONS]


def merge_voice_options(*voice_groups):
    merged = []
    seen = set()
    for group in voice_groups:
        for voice in group or []:
            voice_id = voice.get("id")
            voice_name = voice.get("name")
            key = (voice_id, voice_name)
            if not voice_name or key in seen:
                continue
            seen.add(key)
            merged.append({"id": voice_id, "name": voice_name})
    return merged
