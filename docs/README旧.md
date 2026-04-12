# Live2D 数字人项目快速上手

这份文档面向第一次拿到项目的人，目标是让你先跑起来，再去理解细节。

## 目录和端口

- `main.py`：项目主入口
- `gui/aigc_server.py`：主业务 API，默认端口 `5000`
- `gui/flask_server.py`：页面壳和兼容代理层，默认端口 `6000`
- `tts/qwen3tts_server/server.py`：Qwen3-TTS 服务，默认端口 `8000`
- `asr/qwen3_server/server.py`：Qwen3-ASR 服务，默认端口 `8001`

## 最短启动顺序

建议始终在项目根目录启动，这样最不容易踩路径坑。

### 1. 进入项目并激活虚拟环境

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
.\.venv\Scripts\Activate.ps1
```

### 2. 启动 TTS 服务

新开一个终端窗口，仍然切到项目根目录后执行：

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
.\.venv\Scripts\Activate.ps1
python .\tts\qwen3tts_server\server.py
```

看到服务监听 `8000` 即表示正常。

### 3. 启动 ASR 服务

再开一个终端窗口：

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH="."
python .\asr\qwen3_server\server.py
```

看到服务监听 `8001` 即表示正常。

### 4. 启动主程序

再开一个终端窗口：

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
.\.venv\Scripts\Activate.ps1
python .\main.py
```

## 当前调用关系

```text
Live2D 页面 / 前端
        |
        | 访问 5000（主 API）
        | 或访问 6000（兼容层，会转发到 5000）
        v
主业务后端 gui/aigc_server.py
        |
        +--> Qwen3-ASR (8001)
        +--> Qwen3-TTS (8000)
        +--> LLM / 业务链路 / Live2D runtime
```

## 必改配置

编辑 `system.conf`：

```ini
[key]
ASR_mode = qwen3
tts_module = qwen3
qwen3_asr_url = http://127.0.0.1:8001/asr
qwen3_tts_url = http://127.0.0.1:8000/tts
backend_api_url = 127.0.0.1:5000
start_mode = web
```

编辑 `config.json`：

- `attribute.voice` 选择可用音色
- 当前推荐：
  - `Qwen3-灵动女声`
  - `Qwen3-稳重男声`

## 访问入口

- 主 API：`http://127.0.0.1:5000`
- 页面壳：`http://127.0.0.1:6000`

如果你是新接手这个项目，建议优先把外部调用都对齐到 `5000`；`6000` 现在主要用于页面路由和兼容旧调用。

## 常见错误

### 1. `.venv\Scripts\python.exe` 找不到

原因通常是你已经 `cd` 到子目录里了，还在使用根目录相对路径。

最稳妥的做法：

- 始终回到项目根目录再启动
- 已经激活虚拟环境后直接用 `python`

### 2. 页面能开，但数字人不说话

优先检查：

- `8000` 的 TTS 服务是否已启动
- `system.conf` 里的 `tts_module` 是否是 `qwen3`
- `config.json` 里的 `attribute.voice` 是否是可用音色

### 3. 录音后没有识别结果

优先检查：

- `8001` 的 ASR 服务是否已启动
- `system.conf` 里的 `ASR_mode` 是否是 `qwen3`
- `qwen3_asr_url` 是否可访问

## 补充文档

- `TTS_快速启动指南.md`：TTS 单独启动说明
- `README_QWEN3_TTS.md`：Qwen3-TTS 详细说明
- `README_QWEN3_ASR.md`：Qwen3-ASR 详细说明

## 关于 Fay 命名

项目历史上来自 Fay 架构，仓库中仍保留少量兼容文件名或兼容配置名，例如 `core/fay_core.py`、`fay_url`。这些现在都只是兼容层，新的主入口和主文档已经统一到 `avatar_runtime`、`avatar_core`、`backend_api_url`。
