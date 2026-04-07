# Qwen3-TTS 本地部署与集成指南

本项目集成 Qwen3-TTS (0.6B 版本) 作为本地 Text-to-Speech 引擎，支持自然语言指令驱动的情绪化合成。

**Qwen3-TTS** 是基于 Qwen3-Omni 基础模型开发的语音合成模型系列：
*   **多语言支持**：支持 10 种主要语言（中文、英文、日文、韩文、德文、法文、俄文、葡萄牙文、西班牙文、意大利文）。
*   **高性能**：本项目使用的 **Qwen3-TTS-12Hz-0.6B-CustomVoice** 版本，使用 faster-qwen3-tts 优化后，首包延迟降低 50-60%。
*   **音色控制**：支持 9 种优质音色，可通过自然语言指令控制语气和情感。

---

## 快速开始

如果你已经配置好环境，直接执行：

```powershell
# 1. 激活虚拟环境
.\.venv\Scripts\activate

# 2. 启动 TTS 服务（首次启动会自动从魔搭下载模型）
python tts\qwen3tts_server\server.py

# 3. 在浏览器中访问 http://127.0.0.1:8000/docs 查看 API 文档
```

---

## 1. 环境准备

确保系统已安装 Python 3.10+。

### 1.1 创建虚拟环境

在项目根目录下打开终端，执行以下命令创建虚拟环境：

**Windows (PowerShell):**
```powershell
# 创建虚拟环境（放在项目根目录）
python -m venv .venv
```

### 1.2 激活虚拟环境

```powershell
.\.venv\Scripts\activate
```

### 1.3 安装依赖

```powershell
pip install -U faster-qwen3-tts modelscope fastapi uvicorn soundfile pydantic
```

*注意：如果遇到 `sox` 相关警告，无需理会，不影响 TTS 服务运行，可以手动另外进行安装。*

### 1.4 模型下载（可选）

服务端代码会在首次启动时自动通过 ModelScope（魔搭）下载模型。建议预先手动下载以确保速度：

```powershell
# 安装 modelscope CLI（如果尚未安装）
pip install -U modelscope

# 下载模型（默认会下载到 ModelScope 缓存目录）
modelscope download --model Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice
```

---

## 2. 服务端部署

服务端代码位于 `tts/qwen3tts_server/server.py`，基于 FastAPI 实现。

### 2.1 启动 TTS 服务

在激活了虚拟环境的终端中：

```powershell
# 确保在项目根目录
python tts\qwen3tts_server\server.py
```

*   **首次运行**: 会自动从魔搭下载 `Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice` 模型（约 1.2GB）。如果已手动下载，将直接加载。
*   **启动成功**: 当看到 `Uvicorn running on http://127.0.0.1:8000` 时，表示服务已就绪。

### 2.2 验证服务运行

服务启动成功后，会显示类似以下信息：

```
[TTS-SERVER] 正在加载 Faster Qwen3-TTS 模型...
[TTS-SERVER] CUDA 可用: NVIDIA GeForce RTX 4060
[TTS-SERVER] 模型预热完成
[TTS-SERVER] Faster Qwen3-TTS 服务已就绪！
INFO:     Uvicorn running on http://127.0.0.1:8000
```

在浏览器中访问 `http://127.0.0.1:8000/docs` 可以查看 API 文档。

---

## 3. 项目配置

### 3.1 system.conf 配置

打开 `system.conf`，找到 `[key]` 部分：

```ini
[key]
# TTS 类型选择 qwen3
tts_module = qwen3

# Qwen3-TTS 本地服务端地址（默认 8000 端口）
qwen3_tts_url = http://127.0.0.1:8000/tts
```

### 3.2 音色配置

在 Fay 的 UI 面板中选择音色，或直接修改 `config.json`：

```json
{
  "voice": "Qwen3-灵动女声",
  "playSound": true
}
```

**支持的音色**：

| Fay 配置项 | 模型音色 | 音色描述 | 推荐语言 |
| :--- | :--- | :--- | :--- |
| Qwen3-灵动女声 | Vivian | 明亮年轻女声 | 中文 |
| Qwen3-稳重男声 | Eric | 活跃成都男声 | 中文（四川） |
| Qwen3-温柔女声 | Serena | 温柔年轻女声 | 中文 |
| Qwen3-成熟男声 | Uncle_Fu | 成熟男声，醇厚音色 | 中文 |
| Qwen3-北京男声 | Dylan | 年轻北京男声 | 中文（北京） |
| Qwen3-活力男声 | Ryan | 动感男声，有节奏感 | 英文 |
| Qwen3-阳光男声 | Aiden | 阳光美国男声 | 英文 |
| Qwen3-可爱女声 | Ono_Anna | 活泼日本女声 | 日文 |
| Qwen3-温暖女声 | Sohee | 温暖韩国女声 | 韩文 |

---

## 4. 使用特性

### 4.1 自然语言指令控制

Qwen3-TTS 支持通过自然语言指令控制语气和情感。本项目已自动完成情绪映射(!这部分需要1.2BVoiceDesign版本模型)：

| Fay 情绪状态 | Qwen3 语气指令 |
| :--- | :--- |
| 平静 (calm) | 用平稳、自然、淡定的语气说话 |
| 生气 (angry) | 用非常生气、严厉的语气说话 |
| 开朗 (cheerful) | 用开朗、活泼、阳光的语气说话 |
| 温柔 (lyrical) | 用温柔、感性、充满感情的语气说话 |
| 专业 (assistant) | 用专业、有礼貌的助手语气说话 |

---

## 5. 常见问题

1.  **连接超时**: 首次合成时模型需要加载到显存（冷启动），需要 30-50 秒，请耐心等待。
2.  **显存不足**: 默认配置尝试使用 CUDA (GPU)。如果显存不足或只有 CPU，代码会自动回退到 CPU 运行 (`device=cpu`)，但速度会较慢。
3.  **端口冲突**: 如果 8000 端口被占用，请修改 `tts/qwen3tts_server/server.py` 和 `system.conf` 中的端口号。
4.  **模型下载失败**: 确保网络连接正常，或预先手动下载模型（见 1.3 节）。

---

## 6. 技术参考

### 6.1 模型信息

- **模型名称**：Qwen3-TTS-12Hz-0.6B-CustomVoice
- **模型大小**：约 1.2GB
- **参数量**：0.6B
- **支持语言**：10 种主要语言

### 6.2 性能对比

| 指标 | 原版 Qwen3-TTS | Faster Qwen3-TTS | 提升 |
|------|---------------|------------------|------|
| 首包延迟 | 800-1500ms | 300-600ms | **50-60%** |
| 实时率 (RTF) | 0.3-0.5 | 0.1-0.2 | **60-70%** |
| 显存占用 | ~4GB | ~3.5GB | **~12%** |

### 6.3 相关链接

- **Faster Qwen3-TTS GitHub**: https://github.com/andimarafioti/faster-qwen3-tts
- **魔搭模型页面**: https://www.modelscope.cn/models/Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice
