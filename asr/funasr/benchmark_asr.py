import os
import re
from funasr import AutoModel
import tqdm

def calculate_cer(reference, hypothesis):
    """
    计算字符错误率 (CER)。
    """
    # 移除空格和常见标点（，。！？）进行比较
    chars_to_remove = [" ", "，", "。", "！", "？"]
    for char in chars_to_remove:
        reference = reference.replace(char, "")
        hypothesis = hypothesis.replace(char, "")
    
    reference = reference.strip()
    hypothesis = hypothesis.strip()
    
    n = len(reference)
    m = len(hypothesis)
    
    if n == 0: return m, 0
    if m == 0: return n, n
    
    # 编辑距离 (Levenshtein Distance)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1): dp[i][0] = i
    for j in range(m + 1): dp[0][j] = j
    
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if reference[i-1] == hypothesis[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1
    
    return dp[n][m], n

def post_process(text):
    if not text:
        return ""
    # 修复“4斤，装” -> “4斤装”
    text = re.sub(r'(\d+斤)，装', r'\1斤装', text)
    # 修复常见的单位断句问题
    text = re.sub(r'(\d+)，(瓶|袋|听|件|个)', r'\1\2', text)
    # 恢复常用的误转数字
    text = text.replace("不1样", "不一样")
    return text

# 1. 加载模型
print("正在加载模型...")
model = AutoModel(model="paraformer-zh", model_revision="v2.0.4",
                  vad_model="fsmn-vad", vad_model_revision="v2.0.4",
                  punc_model="ct-punc-c", punc_model_revision="v2.0.4")

# 2. 设置测试集路径
base_dir = "asr/funasr/data/test"
trans_file = os.path.join(base_dir, "TRANS.txt")

if not os.path.exists(trans_file):
    print(f"错误: 找不到测试集索引文件 {trans_file}")
    exit(1)

# 3. 读取索引文件
print("读读取测试集索引...")
with open(trans_file, "r", encoding="utf-8") as f:
    lines = f.readlines()[1:] # 跳过表头

# 4. 开始跑分
limit = 200 
total_dist = 0
total_len = 0
results = []

print(f"开始测试 (共选取 {min(limit, len(lines))} 个样本)...")

for line in tqdm.tqdm(lines[:limit]):
    parts = line.strip().split('\t')
    if len(parts) < 3:
        continue
    
    audio_id, speaker_id, ground_truth = parts
    audio_path = os.path.join(base_dir, speaker_id, audio_id)
    
    if os.path.exists(audio_path):
        res = model.generate(input=audio_path, is_final=True, itn=False)
        if res:
            prediction = post_process(res[0]['text'])
            
            dist, length = calculate_cer(ground_truth, prediction)
            total_dist += dist
            total_len += length
            
            # 如果错误率太高，记录下来分析
            error_rate = dist / length if length > 0 else 0
            if error_rate > 0.3:
                results.append((audio_id, ground_truth, prediction, error_rate))

# 5. 输出汇总
print("\n" + "="*40)
if total_len > 0:
    final_cer = total_dist / total_len
    print(f"测试完成！")
    print(f"样本总数: {min(limit, len(lines))}")
    print(f"平均字符错误率: {final_cer:.2%}")
    print(f"准确率: {1 - final_cer:.2%}")
else:
    print("没有找到有效的音频文件。")
print("="*40)

# 输出前5正确率低
if results:
    print("\n前五正确率低:")
    for audio, ref, hyp, err in results[:5]:
        print(f"\n文件: {audio} (错误率: {err:.1%})")
        print(f"  标准答案: {ref}")
        print(f"  识别结果: {hyp}")
