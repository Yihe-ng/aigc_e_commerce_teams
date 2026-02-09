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


def get_voice_list():
    return [EnumVoice.XIAO_XIAO_NEW, EnumVoice.YUN_XI, EnumVoice.XIAO_XIAO, EnumVoice.YUN_JIAN, EnumVoice.XIAO_YI, EnumVoice.YUN_YANG, EnumVoice.YUN_XIA, EnumVoice.QWEN3_FEMALE, EnumVoice.QWEN3_MALE]


def get_voice_of(name):
    for voice in get_voice_list():
        voice_data = voice.value 
        if voice_data["name"] == name:
            return voice
    return None
