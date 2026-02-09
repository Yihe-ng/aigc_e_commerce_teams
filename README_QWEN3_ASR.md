# Qwen3-ASR 集成指南

本文档详细说明如何在本项目中部署和使用 Qwen3-ASR 服务。

## 1. 环境准备

确保您的系统已安装 Python 3.10 或更高版本，并已配置好虚拟环境（本项目使用 `.venv`）。

### 1.1 激活虚拟环境

在项目根目录下打开终端，执行以下命令激活虚拟环境：

**Windows (PowerShell):**
```powershell
.\.venv\Scripts\activate
```

### 1.2 安装依赖

Qwen3-ASR 需要 `transformers`、`torch`、`accelerate` 等库。我们推荐直接安装 `qwen-asr` 包，它会自动处理大部分依赖。

```powershell
pip install qwen-asr python-multipart uvicorn
```

*注意：如果遇到 `nagisa` 相关错误，无需理会，我们的服务端代码不依赖该模块。*

## 2. 服务端部署

服务端代码位于 `asr/qwen3_server/server.py`，基于 FastAPI 和 Transformers 实现。

### 2.1 启动 ASR 服务

在激活了虚拟环境的终端中，运行以下命令启动服务：

```powershell
# 确保在项目根目录
$env:PYTHONPATH="."
python asr\qwen3_server\server.py
```

*   **首次运行**: 会自动从 HuggingFace/ModelScope 下载 `Qwen/Qwen3-ASR-0.6B` 模型（约 1-2GB），请保持网络畅通。
*   **启动成功**: 当看到 `Uvicorn running on http://0.0.0.0:8001` 时，表示服务已就绪。

## 3. 项目配置

修改 `system.conf` 文件，启用 Qwen3-ASR 模式。

打开 `system.conf`，找到 `[key]` 部分，修改如下配置：

```ini
[key]
# 将 ASR_mode 设置为 qwen3
ASR_mode = qwen3

# 确保配置了 Qwen3-ASR 的服务端地址（默认无需修改）
qwen3_asr_url = http://127.0.0.1:8001/asr
```

## 4. 验证测试

我们提供了一个测试脚本来验证 ASR 服务是否正常工作。

在**新的终端**窗口中（同样需要激活虚拟环境）：

```powershell
.\.venv\Scripts\activate
python test_qwen3_asr.py
```

如果输出 `Status: 200` 和识别到的文本（或空文本），则表示集成成功。

## 5. 启动主程序

在 ASR 服务保持运行的情况下，启动 Fay 数字人主程序：

```powershell
python main.py
```

现在，当您对着数字人说话时，系统将通过 Qwen3-ASR 进行语音识别。

## 常见问题

1.  **显存不足**: 默认配置尝试使用 CUDA (GPU)。如果显存不足或只有 CPU，代码会自动回退到 CPU 运行 (`device=cpu`)，但速度会较慢。
2.  **端口冲突**: 如果 8001 端口被占用，请修改 `asr/qwen3_server/server.py` 和 `system.conf` 中的端口号。
3.  **识别超时**: Qwen3 模型较大，首次推理或 CPU 推理可能较慢。我们在 `core/recorder.py` 中将超时时间调整为了 10 秒。
