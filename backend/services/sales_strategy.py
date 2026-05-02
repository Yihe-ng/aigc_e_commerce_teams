"""销售状态机 —— 根据用户对话阶段动态生成营销指令"""

from enum import Enum
from typing import Optional


class SalesStage(Enum):
    ENTER = "enter"
    BROWSING = "browsing"
    COMPARING = "comparing"
    READY = "ready"


_DEFAULT_MARKETING_RULES = {
    "inventory_urgent_threshold": 10,
    "inventory_critical_threshold": 3,
    "discount_message": "现在下单享受限时9折优惠！",
    "free_shipping_message": "今天下单包邮哦～",
}


def infer_stage_from_text(text: str) -> SalesStage:
    content = (text or "").strip()
    if not content:
        return SalesStage.BROWSING

    purchase_signals = (
        "怎么买", "下单", "哪里买", "购买", "多少钱",
        "发什么快递", "包邮", "有优惠", "打折", "便宜点",
    )
    if any(sig in content for sig in purchase_signals):
        return SalesStage.READY

    comparison_signals = (
        "哪个好", "有什么区别", "对比", "哪个更", "纠结",
    )
    if any(sig in content for sig in comparison_signals):
        return SalesStage.COMPARING
    if "和" in content and "比" in content:
        return SalesStage.COMPARING

    detail_signals = (
        "面料", "材质", "怎么洗", "尺码", "码数",
        "颜色", "适合", "搭配", "透气", "舒服",
    )
    if any(sig in content for sig in detail_signals):
        return SalesStage.BROWSING

    return SalesStage.BROWSING


def get_inventory_urgency(inventory_count: Optional[int]) -> tuple:
    if inventory_count is None:
        return "", 0
    if inventory_count <= 0:
        return "这款目前已售罄，要不要看看相似款？我帮你推荐～", 3
    if inventory_count <= 3:
        return f"这款库存仅剩最后{inventory_count}件！错过就没了，现在拍下立马发货！", 3
    if inventory_count <= 10:
        return f"这款是爆款，库存只剩{inventory_count}件了，喜欢的话抓紧哦～", 2
    return "库存充足，可以放心选购～", 0


def _truncate(text: str, limit: int = 250) -> str:
    if len(text) <= limit:
        return text
    return text[:limit - 1].rstrip()


def build_cta_prompt(
    stage: SalesStage,
    product_name: str = "",
    inventory_count: Optional[int] = None,
    has_discount: bool = False,
) -> str:
    base = "你是一名专业又亲切的服装导购。回答用户问题时，请自然结合以下营销策略，不要生硬拼接：\n"

    urgency_msg, urgency_level = get_inventory_urgency(inventory_count)
    discount_msg = _DEFAULT_MARKETING_RULES["discount_message"] if has_discount else ""
    free_shipping_msg = _DEFAULT_MARKETING_RULES["free_shipping_message"]

    target = f"【商品】{product_name}。" if product_name else ""

    if stage == SalesStage.ENTER:
        stage_rule = "先热情欢迎，再引导用户说出偏好（风格/场景/预算），给出轻松选择建议。"
    elif stage == SalesStage.BROWSING:
        stage_rule = "先回答当前问题，再补充1-2个核心卖点，最后自然追加温和购买引导。"
    elif stage == SalesStage.COMPARING:
        stage_rule = "先认可用户谨慎对比，再给出关键差异与适配建议；若库存紧张可提醒时效。"
    else:
        stage_rule = "突出现在下单的好处与时效，强调穿着价值和服务保障，促成当下决策。"

    extras = []
    if urgency_level >= 2 and urgency_msg:
        extras.append(urgency_msg)
    if has_discount and discount_msg:
        extras.append(discount_msg)
    if stage == SalesStage.READY:
        extras.append(free_shipping_msg)

    body = " ".join(p for p in [target, stage_rule] + extras if p).strip()
    return _truncate(base + body, limit=250)


def get_default_cta_prompt() -> str:
    base = "你是一名专业又亲切的服装导购。回答用户问题时，请自然结合以下营销策略，不要生硬拼接：\n"
    rule = "先理解用户需求并给出清晰建议，可适度补充卖点与搭配建议，语气自然、真诚，不夸张。"
    return _truncate(base + rule, limit=250)
