# Qwen3-TTS 本地部署与集成指南

本项目集成 Qwen3-TTS（0.6B 版本）作为本地 Text-to-Speech 引擎，支持自然语言指令驱动的情绪化合成。

**Qwen3-TTS** 是基于 Qwen3-Omni 基础模型开发的语音合成模型系列：
- **多语言支持**：支持 10 种主要语言（中文、英文、日文、韩文、德文、法文、俄文、葡萄牙文、西班牙文、意大利文）
- **高性能**：本项目使用的 **Qwen3-TTS-12Hz-0.6B-CustomVoice** 版本，使用 faster-qwen3-tts 优化后，首包延迟降低 50-60%
- **音色控制**：支持通过自然语言指令控制语气和情感

---

## 快速开始

如果你已经配置好环境，直接执行：

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
.\.venv\Scripts\Activate.ps1
python .\tts\qwen3tts_server\server.py
```

然后在浏览器中访问：

```text
http://127.0.0.1:8000/docs
```

---

## 1. 环境准备

确保系统已安装 Python 3.10+。

### 1.1 创建虚拟环境

在项目根目录下打开终端，执行以下命令创建虚拟环境：

```powershell
python -m venv .venv
```

### 1.2 激活虚拟环境

```powershell
.\.venv\Scripts\Activate.ps1
```

### 1.3 安装依赖

```powershell
pip install -U faster-qwen3-tts modelscope fastapi uvicorn soundfile pydantic
```

注意：如果遇到 `sox` 相关警告，无需理会，不影响 TTS 服务运行。

### 1.4 模型下载（可选）

服务端代码会在首次启动时自动通过 ModelScope 下载模型。建议预先手动下载以确保速度：

```powershell
pip install -U modelscope
modelscope download --model Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice
```

---

## 2. 服务端部署

服务端代码位于 `tts/qwen3tts_server/server.py`，基于 FastAPI 实现。

### 2.1 启动 TTS 服务

在激活了虚拟环境的终端中：

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
.\.venv\Scripts\Activate.ps1
python .\tts\qwen3tts_server\server.py
```

- **首次运行**：会自动下载 `Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice` 模型（约 1.2GB）
- **启动成功**：当看到 `Uvicorn running on http://127.0.0.1:8000` 时，表示服务已就绪

### 2.2 验证服务运行

可用以下地址检查：

- 文档页：`http://127.0.0.1:8000/docs`
- 健康检查：`http://127.0.0.1:8000/health`

---

## 3. 后端配置

### 3.1 system.conf 配置

找到项目根目录下的 [`system.conf`](E:/aigc_team/aigc_e_commerce_teams/system.conf)，确保以下项已正确配置：

```ini
[key]
tts_module = qwen3
qwen3_tts_url = http://127.0.0.1:8000/tts
backend_api_url = 127.0.0.1:5000
```

### 3.2 音色配置

在项目根目录的 [`config.json`](E:/aigc_team/aigc_e_commerce_teams/config.json) 中配置音色，或通过前端页面保存配置：

```json
{
  "attribute": {
    "voice": "Qwen3-灵动女声"
  },
  "interact": {
    "playSound": true
  }
}
```

当前项目代码里稳定暴露的 Qwen3 音色有两种：

| 配置项 | 模型音色 | 音色描述 | 推荐语言 |
| :--- | :--- | :--- | :--- |
| Qwen3-灵动女声 | Vivian | 明亮年轻女声 | 中文 |
| Qwen3-稳重男声 | Eric | 稳重男声 | 中文 |

这些定义位于 [`tts/tts_voice.py`](E:/aigc_team/aigc_e_commerce_teams/tts/tts_voice.py)。

### 3.3 调用链说明

当前项目的 TTS 调用链如下：

1. Qwen3-TTS 服务端运行在 `http://127.0.0.1:8000/tts`
2. 主业务后端运行在 `http://127.0.0.1:5000`
3. 主业务后端通过 [`tts/qwen3.py`](E:/aigc_team/aigc_e_commerce_teams/tts/qwen3.py) 调用本地 Qwen3-TTS 服务
4. 如果页面仍然请求 `6000` 端口，它会由壳层服务转发到 `5000`

也就是说：

- `8000`：Qwen3-TTS 独立服务
- `5000`：主 API，真正发起 TTS 调用
- `6000`：兼容页面壳/代理层，不是主 TTS 处理入口

---

## 4. 使用特性

### 4.1 自然语言指令控制

Qwen3-TTS 支持通过自然语言指令控制语气和情感。本项目已自动完成情绪映射：

| 情绪状态 | Qwen3 语气指令 | 效果说明 |
| :--- | :--- | :--- |
| 平静 (calm) | 用平稳、自然、淡定的语气说话 | 适合日常对话 |
| 生气 (angry) | 用非常生气、严厉的语气说话 | 表达愤怒情绪 |
| 开朗 (cheerful) | 用开朗、活泼、阳光的语气说话 | 表达快乐情绪 |
| 温柔 (lyrical) | 用温柔、感性、充满感情的语气说话 | 表达柔和情感 |
| 专业 (assistant) | 用专业、有礼貌的助手语气说话 | 适合客服场景 |

---

## 5. 常见问题

1. **连接超时**：首次合成时模型需要加载到显存，冷启动可能需要 30-50 秒
2. **显存不足**：默认优先使用 CUDA；显存不足时会回退到 CPU，但速度较慢
3. **端口冲突**：如果 8000 端口被占用，请同时修改 `tts/qwen3tts_server/server.py` 和 [`system.conf`](E:/aigc_team/aigc_e_commerce_teams/system.conf)
4. **模型下载失败**：确保网络连接正常，或预先手动下载模型

---

## 6. 技术参考

### 6.1 模型信息

- 模型名称：Qwen3-TTS-12Hz-0.6B-CustomVoice
- 模型大小：约 1.2GB
- 参数量：0.6B
- 支持语言：10 种主要语言

### 6.2 性能对比

| 指标 | 原版 Qwen3-TTS | Faster Qwen3-TTS | 提升 |
|------|---------------|------------------|------|
| 首包延迟 | 800-1500ms | 300-600ms | 50-60% |
| 实时率 (RTF) | 0.3-0.5 | 0.1-0.2 | 60-70% |
| 显存占用 | ~4GB | ~3.5GB | ~12% |

### 6.3 相关链接

- Faster Qwen3-TTS GitHub: [https://github.com/andimarafioti/faster-qwen3-tts](https://github.com/andimarafioti/faster-qwen3-tts)
- Windows 安装指南: [https://github.com/andimarafioti/faster-qwen3-tts/blob/main/WINDOWS_SETUP_GUIDE.md](https://github.com/andimarafioti/faster-qwen3-tts/blob/main/WINDOWS_SETUP_GUIDE.md)
- Qwen3-TTS 模型: [https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice)
- PyTorch 安装: [https://pytorch.org/get-started/locally/](https://pytorch.org/get-started/locally/)

---

## 7. 最短启动步骤

如果你只想快速跑通当前项目里的 Qwen3-TTS，可以按下面顺序启动：

1. 启动 Qwen3-TTS 服务

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
.\.venv\Scripts\Activate.ps1
python .\tts\qwen3tts_server\server.py
```

2. 确认 TTS 服务健康状态

```text
http://127.0.0.1:8000/health
```

3. 检查 [`system.conf`](E:/aigc_team/aigc_e_commerce_teams/system.conf)

```ini
tts_module = qwen3
qwen3_tts_url = http://127.0.0.1:8000/tts
```

4. 检查 [`config.json`](E:/aigc_team/aigc_e_commerce_teams/config.json) 中音色

```json
"voice": "Qwen3-灵动女声"
```

或：

```json
"voice": "Qwen3-稳重男声"
```

5. 启动项目主后端

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
.\.venv\Scripts\Activate.ps1
python .\main.py
```

6. 访问服务

- 主 API：`http://127.0.0.1:5000`
- 兼容壳层：`http://127.0.0.1:6000`

只要 `5000` 正常运行，它就会在需要播报时通过 `qwen3_tts_url` 调用 `8000` 的 Qwen3-TTS 服务。
