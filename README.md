# AIGC 电商数字化营销平台




**基于 Live2D 数字人的全链路 AI 电商营销解决方案**

[项目简介](#项目简介) • [系统架构](#系统架构) • [技术栈](#技术栈) • [快速开始](#快速开始) • [配置说明](#配置说明) • [开发指南](#开发指南) • [常见问题](#常见问题)



## 📖 项目简介

**AIGC 电商数字化营销平台** 是一个集成了 Live2D 数字人直播、AI 内容生成和电商营销管理的全链路解决方案。项目起源于 Fay 架构，现已演变为成熟的 Live2D 数字人电商营销平台。

### 🎯 核心功能

1. **Live2D 数字人直播**
   - 实时语音交互与表情同步
   - 多音色语音合成 (TTS)
   - 高精度语音识别 (ASR)

2. **AI 内容智能生成**
   - 营销文案自动生成 (LLM)
   - 产品宣传图生成 (文生图)
   - 短视频内容生成 (文生视频)

3. **电商营销管理**
   - 产品信息管理系统
   - 客户画像分析
   - 营销计划与排期
   - 数据看板与 Analytics

4. **多模态 AI 集成**
   - 支持多种 TTS 引擎 (Qwen3、Azure、火山引擎等)
   - 支持多种 ASR 引擎 (Qwen3、FunASR、阿里云等)
   - 支持多种 LLM 服务 (GPT、通义星尘、灵聚等)

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     前端界面 (Next.js)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │ Live2D数字人 │  │ 电商管理后台 │  │ AI工具工作区      │  │
│  └────────────┘  └────────────┘  └────────────────────┘  │
└─────────────────────────┬──────────────────────────────────┘
                          │ HTTP/WebSocket
┌─────────────────────────▼──────────────────────────────────┐
│                   主业务API层 (Flask)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │ aigc_server │  │登录/注册服务│  │ 数据看板服务      │  │
│  │   (5000)    │  │   (3002)   │  │   (5001)         │  │
│  └────────────┘  └────────────┘  └────────────────────┘  │
└─────────────────┬────────────┬────────────┬───────────────┘
                  │            │            │
       ┌──────────▼──┐  ┌─────▼────┐  ┌───▼──────────┐
       │ Qwen3-TTS   │  │ Qwen3-ASR│  │ WebSocket    │
       │   (8000)    │  │   (8001) │  │ (10003-10004)│
       └─────────────┘  └──────────┘  └──────────────┘
                  │            │
           ┌──────▼────────────▼──────┐
           │      AI服务集群           │
           │  • Dify.ai API           │
           │  • LiblibAI API          │
           │  • 阿里云OSS              │
           │  • 多种LLM后端            │
           └───────────────────────────┘
```

### 核心数据流程

1. **语音交互流程**
   ```
   用户语音输入 → ASR服务转文本 → LLM生成回复 → TTS服务转语音 → Live2D播放
   ```

2. **内容生成流程**
   ```
   产品信息输入 → LLM生成文案 → 图像/视频生成 → 内容审核 → 发布到营销平台
   ```

3. **电商营销流程**
   ```
   产品入库 → 客户画像分析 → 营销策略生成 → 内容自动生成 → 多渠道发布 → 效果分析
   ```

### 服务端口说明

| 服务 | 端口 | 说明 | 启动文件 |
|------|------|------|----------|
| 主业务API | 5000 | 核心功能服务 | `gui/aigc_server.py` |
| 页面壳/兼容层 | 6000 | 页面路由与代理 | `gui/flask_server.py` |
| Qwen3-TTS服务 | 8000 | 文本转语音服务 | `tts/qwen3tts_server/server.py` |
| Qwen3-ASR服务 | 8001 | 语音识别服务 | `asr/qwen3_server/server.py` |
| 登录服务 | 3002 | 用户认证服务 | `gui/login_server.py` |
| 数据看板服务 | 5001 | 商家数据管理 | `gui/app.py` |
| WebSocket服务 | 10003-10004 | 实时通信 | `core/wsa_server.py` |

## 🛠️ 技术栈

### 后端技术栈
- **Web框架**: Flask 3.0 + gevent
- **API服务**: FastAPI (用于TTS/ASR服务)
- **实时通信**: WebSocket (ws4py, websockets)
- **数据库**: SQLite (任务管理) + MySQL (用户数据，可选) + 阿里云OSS (云存储)
- **AI框架**: PyTorch + Transformers + ModelScope
- **任务调度**: schedule
- **音频处理**: pydub, soundfile, pyaudio

### 前端技术栈
- **框架**: Next.js 15 + React 19 + TypeScript
- **UI组件**: HeroUI + Tailwind CSS + Radix UI
- **Live2D渲染**: PixiJS + pixi-live2d-display
- **状态管理**: React Context + 原生Hooks
- **构建工具**: pnpm + ESLint + PostCSS

### AI服务集成
- **TTS引擎**: Qwen3-TTS, Azure TTS, 阿里云TTS, GPT-SoVITS, 火山引擎TTS
- **ASR引擎**: Qwen3-ASR, FunASR, 阿里云NLS
- **LLM服务**: GPT API, 通义星尘, 灵聚AI, Coze, Ollama, LangChain
- **图像生成**: LiblibAI API, 稳定扩散模型
- **情感分析**: 百度AI情感分析, Cemotion

### 第三方服务
- **云存储**: 阿里云OSS
- **API网关**: Dify.ai
- **部署环境**: Docker (可选)

## 🚀 快速开始

### 环境要求
- **操作系统**: Windows 10/11 (推荐), Linux/macOS (需适配)
- **Python**: 3.10+
- **Node.js**: 18+
- **包管理器**: pnpm (前端), pip (后端)
- **磁盘空间**: 至少10GB (用于AI模型缓存)

### 第一步：环境准备

#### 1.1 克隆项目
```bash
git clone <项目仓库地址>
cd aigc_e_commerce_team
```

#### 1.2 创建并激活Python虚拟环境
```powershell
# 创建虚拟环境 (项目根目录)
python -m venv .venv

# 激活虚拟环境 (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# 激活虚拟环境 (Windows CMD)
.venv\Scripts\activate

# 激活虚拟环境 (Linux/macOS)
source .venv/bin/activate
```

#### 1.3 安装Python依赖
```powershell
# 安装所有依赖 (包含TTS/ASR所需依赖)
pip install -r requirements.txt
```

**注意**: requirements.txt 已包含项目所需的所有依赖，包括：
- Qwen3 TTS/ASR 服务依赖 (`faster-qwen3-tts`, `qwen-asr`, `modelscope`)
- Web 框架依赖 (`fastapi`, `uvicorn`, `flask`)
- AI 框架依赖 (`torch`, `transformers`, `sentence-transformers`)
- 工具类依赖 (`pydub`, `soundfile`, `opencv-python`)

#### 1.4 安装前端依赖
```powershell
# 进入前端目录
cd frontend

# 安装依赖 (使用 pnpm)
pnpm i

# 返回项目根目录
cd ..
```

### 第二步：服务启动

项目需要启动三个核心服务，建议使用三个独立的终端窗口。

#### 2.1 启动 TTS 服务 (终端窗口1)
```powershell
# 确保在项目根目录且虚拟环境已激活
.\.venv\Scripts\Activate.ps1
python .\tts\qwen3tts_server\server.py
```
**成功标志**: 看到 `Uvicorn running on http://0.0.0.0:8000`

#### 2.2 启动 ASR 服务 (终端窗口2)
```powershell
# 确保在项目根目录且虚拟环境已激活
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH="."
python .\asr\qwen3_server\server.py
```
**成功标志**: 看到 `Uvicorn running on http://0.0.0.0:8001`

#### 2.3 启动主程序 (终端窗口3)
```powershell
# 确保在项目根目录且虚拟环境已激活
.\.venv\Scripts\Activate.ps1
python main.py
```
**成功标志**: 看到以下服务启动信息：
- `Starting aigc_server on port 5000`
- `Starting flask_server on port 6000`
- `Starting login_server on port 3002`
- `WebSocket servers started`

### 第三步：验证服务

#### 3.1 服务健康检查
```powershell
# TTS 服务健康检查
curl http://127.0.0.1:8000/health

# ASR 服务健康检查
curl http://127.0.0.1:8001/health

# 主 API 健康检查
curl http://127.0.0.1:5000/health
```

#### 3.2 访问Web界面
- 建议访问http://127.0.0.1:5000 ，会自动重定向至登录界面，完成登录后进入主页面
- **主管理界面**: http://127.0.0.1:3000
- **Live2D数字人界面**: http://127.0.0.1:3000/live
- **API文档 (TTS)**: http://127.0.0.1:8000/docs
- **API文档 (ASR)**: http://127.0.0.1:8001/docs

## ⚙️ 配置说明

### 配置文件位置与用途

项目使用以下三个核心配置文件，**均需放置在项目根目录**：

| 配置文件 | 用途 | 必需性 |
|----------|------|--------|
| `system.conf` | 系统主配置，定义AI服务模式、API密钥等 | **必需** |
| `config.json` | 数字人属性配置，定义音色、模型、交互参数等 | **必需** |
| `.env` | 环境变量配置，用于云服务、第三方API密钥等 | 可选（但建议配置） |

### 1. `system.conf` - 系统主配置模板

**文件位置**: 项目根目录 `/system.conf`

```ini
[key]
# ==================== ASR 配置 ====================
# ASR模式选择: funasr / ali / sensevoice / qwen3
# 建议使用 qwen3 (本地部署) 或 ali (阿里云，免费3个月)
ASR_mode = qwen3

# 本地 FunASR 服务地址 (当 ASR_mode=funasr 时使用)
local_asr_ip = 127.0.0.1
local_asr_port = 10197

# Qwen3-ASR 本地服务端地址 (当 ASR_mode=qwen3 时使用)
qwen3_asr_url = http://127.0.0.1:8001/asr

# 阿里云 NLS 语音识别服务密钥 (当 ASR_mode=ali 时使用)
ali_nls_key_id = YOUR_ALI_NLS_KEY_ID
ali_nls_key_secret = YOUR_ALI_NLS_KEY_SECRET
ali_nls_app_key = YOUR_ALI_NLS_APP_KEY

# ==================== TTS 配置 ====================
# TTS类型: azure / ali / gptsovits / volcano / gptsovits_v3 / qwen3
# 建议使用 qwen3 (本地部署，效果最佳)
tts_module = qwen3

# Qwen3-TTS 本地服务端地址 (当 tts_module=qwen3 时使用)
qwen3_tts_url = http://127.0.0.1:8000/tts

# 微软 Azure TTS 服务密钥 (当 tts_module=azure 时使用)
ms_tts_key = YOUR_AZURE_TTS_KEY
ms_tts_region = eastasia

# 阿里云 TTS 服务密钥 (当 tts_module=ali 时使用)
ali_tss_key_id = YOUR_ALI_TSS_KEY_ID
ali_tss_key_secret = YOUR_ALI_TSS_KEY_SECRET
ali_tss_app_key = YOUR_ALI_TSS_APP_KEY

# 火山引擎 TTS 服务密钥 (当 tts_module=volcano 时使用)
volcano_tts_appid = YOUR_VOLCANO_APPID
volcano_tts_access_token = YOUR_VOLCANO_ACCESS_TOKEN
volcano_tts_cluster = volcano_tts
volcano_tts_voice_type = 

# ==================== 情绪分析配置 ====================
# 情绪分析选择: baidu / cemotion
ltp_mode = baidu

# 百度情绪分析服务密钥 (当 ltp_mode=baidu 时使用)
baidu_emotion_app_id = YOUR_BAIDU_APP_ID
baidu_emotion_api_key = YOUR_BAIDU_API_KEY
baidu_emotion_secret_key = YOUR_BAIDU_SECRET_KEY

# ==================== LLM 配置 ====================
# NLP服务选择: lingju / gpt / rasa / xingchen / langchain / ollama_api / privategpt / coze
chat_module = gpt

# 灵聚 AI 服务密钥 (当 chat_module=lingju 时使用)
lingju_api_key = YOUR_LINGJU_API_KEY
lingju_api_authcode = YOUR_LINGJU_AUTHCODE

# GPT API 配置 (当 chat_module=gpt 时使用)
gpt_api_key = YOUR_GPT_API_KEY
gpt_base_url = https://api.longcat.chat/openai/v1
gpt_model_engine = LongCat-Flash-Chat
proxy_config =  # 代理设置，如: 127.0.0.1:7890

# 通义星尘配置 (当 chat_module=xingchen 时使用)
xingchen_api_key = YOUR_XINGCHEN_API_KEY
xingchen_characterid = YOUR_XINGCHEN_CHARACTER_ID

# Ollama 配置 (当 chat_module=ollama_api 时使用)
ollama_ip = localhost
ollama_model = gemma:latest

# Coze 配置 (当 chat_module=coze 时使用)
coze_bot_id = YOUR_COZE_BOT_ID
coze_api_key = YOUR_COZE_API_KEY

# ==================== 系统配置 ====================
# 启动模式: common / web (服务器或docker请使用web方式)
start_mode = web

# 服务器主动地址
fay_url = 127.0.0.1:5000
backend_api_url = 127.0.0.1:5000
```

### 2. `config.json` - 数字人配置模板

**文件位置**: 项目根目录 `/config.json`

```json
{
    "attribute": {
        "age": "成年",
        "birth": "智行合一团队",
        "constellation": "射手座",
        "contact": "无",
        "gender": "女",
        "hobby": "发呆",
        "job": "主播带货",
        "name": "电商助手",
        "voice": "Qwen3-灵动女声",
        "zodiac": "龙"
    },
    "interact": {
        "QnA": "qa.csv",
        "maxInteractTime": 15,
        "perception": {
            "chat": 29,
            "follow": 29,
            "gift": 29,
            "indifferent": 29,
            "join": 29
        },
        "playSound": true,
        "visualization": false
    },
    "items": [],
    "source": {
        "automatic_player_status": true,
        "automatic_player_url": "",
        "liveRoom": {
            "enabled": true,
            "url": ""
        },
        "record": {
            "device": "",
            "enabled": true
        },
        "wake_word": "你好",
        "wake_word_enabled": false,
        "wake_word_type": "common"
    }
}
```

**配置字段说明**:
- **attribute**: 数字人基本属性
  - `name`: 数字人名称 (如 "电商助手")
  - `gender`: 性别 (`女` / `男`)
  - `voice`: 音色设置 (如 "Qwen3-灵动女声")
  - `age`: 年龄显示 (如 "成年")
  - 其他字段可根据需要自定义
- **interact**: 交互设置
  - `QnA`: 问答对CSV文件路径
  - `maxInteractTime`: 最大交互时间(分钟)
  - `perception`: 感知权重配置 (数值1-100)
  - `playSound`: 是否播放声音
- **source**: 音频输入源配置
  - `wake_word`: 唤醒词 (如 "你好")
  - `wake_word_enabled`: 是否启用唤醒词
  - `liveRoom`: 直播间配置
  - `record`: 录音设备配置

**音色选项** (根据 TTS 模块不同):
- **Qwen3-TTS**: `Qwen3-灵动女声`, `Qwen3-稳重男声`, 或通过自然语言描述
- **Azure TTS**: `zh-CN-XiaoxiaoNeural`, `zh-CN-YunxiNeural` 等
- **阿里云 TTS**: `aixia`, `aixiang`, `xiaogang` 等

### 3. `.env` - 环境变量配置模板

**文件位置**: 项目根目录 `/.env`

```env
# ==================== 阿里云 OSS 配置 ====================
# 用于产品图片、生成内容等文件存储
ALIYUN_ACCESS_KEY_ID=YOUR_ALIYUN_ACCESS_KEY_ID
ALIYUN_ACCESS_KEY_SECRET=YOUR_ALIYUN_ACCESS_KEY_SECRET
ALIYUN_OSS_ENDPOINT=https://oss-cn-shenzhen.aliyuncs.com
ALIYUN_OSS_BUCKET=your-bucket-name
ALIYUN_OSS_CUSTOM_DOMAIN=your-bucket-name.oss-cn-shenzhen.aliyuncs.com

# ==================== LiblibAI 配置 ====================
# 用于视频生成和图生图功能
LIBLIB_ACCESS_KEY=YOUR_LIBLIB_ACCESS_KEY
LIBLIB_SECRET_KEY=YOUR_LIBLIB_SECRET_KEY
LIBLIB_API_BASE=https://openapi.liblibai.cloud

# ==================== Dify 工作流配置 ====================
# 文案生成中使用了 Dify 的工作流功能，需要配置以下 API Key

# 营销文案生成器工作流 API Key
DIFY_MARKETING_COPY_KEY=app-YOUR_MARKETING_COPY_KEY

# 导购文案生成器工作流 API Key  
DIFY_GUIDE_COPY_KEY=app-YOUR_GUIDE_COPY_KEY

# ==================== Python 环境配置 ====================
# Python路径配置 (保持默认即可)
PYTHONPATH=.

# 模型缓存路径 (用于 ModelScope 模型下载)
MODELSCOPE_CACHE=C:/Users/你的用户名/.cache/modelscope

# FFmpeg路径 (用于音频处理)
PATH=%PATH%;./test/ovr_lipsync/ffmpeg/bin
```

### 4. Dify 工作流配置说明

项目中的文案生成功能使用了 **Dify 工作流**，配置文件位于 `dify_workflows/` 目录：

- `导购文案生成器.yml` - 导购文案生成器工作流配置
- `营销文案生成器.yml` - 营销文案生成器工作流配置

**使用流程**:
1. 在 [Dify.ai](https://dify.ai) 平台创建对应的工作流应用
2. 获取应用的 API Key 并填入 `.env` 文件
3. 工作流会自动处理产品信息并生成营销文案
4. 生成的文案可通过数字人朗读或发布到营销平台

**工作流集成特点**:
- 支持产品信息自动提取与分析
- 生成小红书、抖音、公众号等多平台文案
- 支持情感分析与语气调整
- 与数字人语音播报无缝集成

### AI服务密钥申请

项目支持多种AI服务，需要申请相应的API密钥：

| 服务 | 用途 | 申请链接 | 配置位置 |
|------|------|----------|----------|
| **百度AI开放平台** | 情感分析 (情绪识别) | https://cloud.baidu.com/ | `system.conf`: `baidu_emotion_*` |
| **阿里云NLS** | 语音识别 (ASR) / 语音合成 (TTS) | https://ai.aliyun.com/nls/trans | `system.conf`: `ali_nls_*`, `ali_tss_*` |
| **微软Azure Cognitive Services** | 语音合成 (TTS) | https://azure.microsoft.com/ | `system.conf`: `ms_tts_key`, `ms_tts_region` |
| **火山引擎** | 语音合成 (TTS) | https://www.volcengine.com/product/voice-tech | `system.conf`: `volcano_tts_*` |
| **OpenAI API** | 大语言模型 (GPT) | https://openai.com/ | `system.conf`: `gpt_api_key`, `gpt_base_url` |
| **通义千问 (DashScope)** | 大语言模型 | https://dashscope.aliyun.com/ | `system.conf`: `xingchen_api_key` |
| **灵聚AI** | 大语言模型 | https://open.lingju.ai | `system.conf`: `lingju_api_key`, `lingju_api_authcode` |
| **Dify.ai** | 工作流自动化 (文案生成) | https://dify.ai | `.env`: `DIFY_*_KEY` |
| **阿里云OSS** | 对象存储 (图片/文件) | https://oss.console.aliyun.com | `.env`: `ALIYUN_*` |
| **LiblibAI** | 视频生成/图生图 | https://www.liblibai.com | `.env`: `LIBLIB_*` |

**Dify 工作流申请指南**:
1. 访问 [Dify.ai](https://dify.ai) 并注册账号
2. 创建新的"工作流"应用
3. 导入项目中的工作流配置文件 (`dify_workflows/` 目录)
4. 发布应用并获取 API Key
5. 将 API Key 填入 `.env` 文件的 `DIFY_*_KEY` 配置项

## 🖥️ 访问与使用

### Web界面功能

#### 1. 数字人直播界面
- 访问地址: http://127.0.0.1:3000/live
- 功能: 实时语音交互、文本对话、表情同步

#### 2. 电商管理后台
- 访问地址: http://127.0.0.1:3000
- 功能模块:
  - **仪表板**: 数据概览、销售分析
  - **产品管理**: 产品信息维护、图片上传
  - **客户管理**: 客户画像、营销笔记
  - **营销计划**: 内容排期、活动管理
  - **AI工具**: 文案生成、图片生成、视频生成

#### 3. API接口
- 主API文档: http://127.0.0.1:5000 (部分端点)
- TTS API文档: http://127.0.0.1:8000/docs
- ASR API文档: http://127.0.0.1:8001/docs

### 基本操作流程

#### 1. 数字人对话
1. 打开数字人直播界面
2. 点击"开始录音"按钮
3. 对着麦克风说话
4. 数字人自动识别语音并回复

#### 2. AI内容生成
1. 进入"AI工具"工作区
2. 选择生成类型 (文案/图片/视频)
3. 输入产品信息和生成要求
4. 点击生成并查看结果
5. 保存或发布生成内容

#### 3. 营销管理
1. 在"产品管理"中添加产品
2. 在"客户管理"中分析客户画像
3. 在"营销计划"中创建营销活动
4. 使用AI工具生成营销内容
5. 排期并发布内容

## 🔧 开发指南

### 项目结构详解
```
aigc_e_commerce_team/
├── main.py                    # 主入口，服务协调器
├── core/                      # 核心引擎模块
│   ├── avatar_core.py         # 数字人交互逻辑核心
│   ├── wsa_server.py          # WebSocket服务器
│   ├── interact.py            # 用户交互处理
│   ├── content_db.py          # 内容数据库
│   └── task_db.py             # 任务数据库
├── backend/                   # 现代化后端API (重构)
│   ├── routes/                # API路由定义
│   ├── services/              # 业务服务层
│   ├── adapters/              # AI服务适配器
│   ├── config/                # 运行时配置
│   └── schemas/               # 数据模型定义
├── frontend/                  # Next.js前端应用
│   ├── app/                   # App Router页面
│   ├── components/            # React组件库
│   ├── lib/                   # 工具函数和类型
│   └── public/                # 静态资源
├── gui/                       # 传统Flask GUI (兼容层)
│   ├── aigc_server.py         # 主业务API (5000)
│   ├── flask_server.py        # 页面壳/兼容层 (6000)
│   ├── login_server.py        # 登录服务 (3002)
│   └── static/                # 静态资源
├── tts/                       # TTS模块
│   ├── qwen3tts_server/       # Qwen3 TTS服务 (8000)
│   ├── qwen3.py               # Qwen3 TTS客户端
│   ├── azure_tts.py           # Azure TTS实现
│   └── ali_tss.py             # 阿里云TTS实现
├── asr/                       # ASR模块
│   ├── qwen3_server/          # Qwen3 ASR服务 (8001)
│   ├── qwen3_asr.py           # Qwen3 ASR客户端
│   ├── funasr/                # FunASR集成
│   └── ali_nls.py             # 阿里云NLS集成
├── llm/                       # 大语言模型集成
│   ├── nlp_gpt.py             # GPT API集成
│   ├── nlp_xingchen.py        # 通义星尘集成
│   ├── nlp_lingju.py          # 灵聚AI集成
│   └── nlp_langchain.py       # LangChain集成
├── ai_module/                 # AI功能模块
│   ├── baidu_emotion.py       # 百度情感分析
│   └── nlp_cemotion.py        # Cemotion情感分析
├── utils/                     # 工具类
│   ├── config_util.py         # 配置工具
│   ├── trace_utils.py         # 追踪工具
│   └── openai_api/            # OpenAI API兼容层
├── dify_workflows/            # Dify工作流配置
├── docker/                    # Docker部署配置
└── docs/                      # 项目文档
```

### 模块扩展指南

#### 1. 添加新的TTS引擎
1. 在 `tts/` 目录下创建新引擎文件，如 `new_tts.py`
2. 实现 `Speech` 类，包含 `get_voices()` 和 `speak()` 方法
3. 在 `system.conf` 的 `tts_module` 中添加新引擎选项
4. 在 `avatar_core.py` 中添加对应的导入逻辑

#### 2. 添加新的ASR引擎
1. 在 `asr/` 目录下创建新引擎文件，如 `new_asr.py`
2. 实现ASR识别接口
3. 在 `system.conf` 的 `ASR_mode` 中添加新引擎选项
4. 在 `avatar_core.py` 中添加对应的导入逻辑

#### 3. 添加新的LLM服务
1. 在 `llm/` 目录下创建新服务文件，如 `nlp_new.py`
2. 实现 `question()` 函数接口
3. 在 `system.conf` 的 `chat_module` 中添加新服务选项
4. 在 `avatar_core.py` 中添加对应的导入逻辑

#### 4. 自定义数字人模型
1. 将Live2D模型文件放入 `frontend/public/runtime/`
2. 模型文件应包括: `.model3.json`, `.moc3`, 纹理图片等
3. 修改 `config.json` 中的 `live2d.model` 配置
4. 添加对应的动作文件到 `frontend/public/runtime/motion/`

### 调试与日志

#### 1. 日志文件位置
- 主程序日志: `logs/main.log`
- TTS服务日志: 控制台输出 (端口8000)
- ASR服务日志: 控制台输出 (端口8001)
- 前端日志: 浏览器开发者工具

#### 2. 调试模式
```python
# 在 main.py 中添加调试配置
import logging
logging.basicConfig(level=logging.DEBUG)
```

#### 3. 常见调试命令
```powershell
# 检查端口占用
netstat -ano | findstr :5000

# 检查Python环境
python --version
pip list | findstr torch

# 检查前端构建
cd frontend
pnpm build
```

## ❓ 常见问题

### 安装问题

#### Q1: 安装 PyAudio 失败 (Windows)
**A**: 需要安装 Visual C++ Build Tools 或使用预编译版本：
```powershell
pip install pipwin
pipwin install pyaudio
```

#### Q2: 安装 torch 时 CUDA 相关问题
**A**: 使用CPU版本或指定CUDA版本：
```powershell
# CPU版本
pip install torch --index-url https://download.pytorch.org/whl/cpu

# CUDA 11.8
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### Q3: 前端依赖安装失败
**A**: 确保使用 pnpm 并清理缓存：
```powershell
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm cache clean
pnpm install
```

### 启动问题

#### Q1: 端口被占用
**A**: 修改配置文件中的端口或停止占用端口的程序：
```powershell
# 查找占用端口的进程
netstat -ano | findstr :5000

# 终止进程 (替换PID)
taskkill /PID <PID> /F
```

#### Q2: TTS/ASR 服务启动失败
**A**: 检查依赖是否安装完整：
```powershell
# 检查关键依赖
pip list | findstr faster-qwen3-tts
pip list | findstr qwen-asr
pip list | findstr modelscope

# 重新安装依赖
pip install --force-reinstall faster-qwen3-tts qwen-asr modelscope
```

#### Q3: 模型下载缓慢或失败
**A**: 使用镜像源或手动下载：
```powershell
# 设置ModelScope镜像
pip install modelscope -i https://mirror.sjtu.edu.cn/pypi/web/simple

# 手动下载模型
modelscope download --model Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice
```

### 运行问题

#### Q1: 数字人不说话
**A**: 检查TTS服务是否正常运行：
1. 确认 `python .\tts\qwen3tts_server\server.py` 正在运行
2. 访问 http://127.0.0.1:8000/health 检查服务状态
3. 确认 `system.conf` 中 `tts_module = qwen3`
4. 确认 `config.json` 中 `attribute.voice` 是有效音色

#### Q2: 语音识别无结果
**A**: 检查ASR服务是否正常运行：
1. 确认 `python .\asr\qwen3_server\server.py` 正在运行
2. 访问 http://127.0.0.1:8001/health 检查服务状态
3. 确认 `system.conf` 中 `ASR_mode = qwen3`
4. 检查麦克风权限和音频输入设备

#### Q3: Web界面无法访问
**A**: 检查所有服务是否启动：
1. 确认 `python .\main.py` 正在运行
2. 确认端口 6000 未被占用
3. 检查防火墙设置
4. 查看浏览器控制台错误信息

### 配置问题

#### Q1: API密钥无效
**A**: 重新申请并更新 `system.conf`：
1. 访问对应AI服务平台申请API密钥
2. 确保密钥有足够的额度或权限
3. 更新 `system.conf` 中的对应配置项
4. 重启相关服务

#### Q2: 音色不可用
**A**: 检查音色配置和TTS服务：
1. 查看 `tts_voice.py` 中的可用音色列表
2. 确认TTS服务支持所选音色
3. 对于Qwen3-TTS，可用音色包括：`vivian`, `male`, 等。可查阅qwen官方文档了解更多音色选项。
4. 修改 `config.json` 中的 `attribute.voice` 配置

## 🤝 贡献与维护

### 代码规范
- 使用 **Black** 代码格式化工具
- 遵循 **PEP 8** Python代码规范
- 使用 **TypeScript** 严格模式
- 提交前运行代码检查

### 提交指南
1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 版本管理
- 主分支: `main` (稳定版本)
- 开发分支: `develop` (开发版本)
- 功能分支: `feature/*` (新功能开发)
- 修复分支: `fix/*` (问题修复)

### 维护说明
1. 定期更新依赖版本
2. 维护文档与代码同步
3. 及时处理Issue和PR
4. 保持向后兼容性

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📚 相关文档

- [项目说明文档](docs/项目说明文档.md) - 项目背景与整体设计
- [前端技术报告](docs/前端技术报告.md) - 前端架构与技术选型
- [后端重构方案](docs/后端重构方案.md) - 后端架构演进与设计
- [启动命令总表](docs/启动命令总表.md) - 完整启动命令参考
- [TTS快速启动指南](docs/TTS_快速启动指南.md) - TTS服务详细指南
- [Qwen3-TTS集成指南](docs/README_QWEN3_TTS.md) - Qwen3-TTS专项指南
- [Qwen3-ASR集成指南](docs/README_QWEN3_ASR.md) - Qwen3-ASR专项指南

## 🆘 技术支持

如遇问题，请按以下步骤排查：

1. 查看本文档的 **常见问题** 部分
2. 检查 `docs/` 目录下的专项指南
3. 查看项目 Issue 列表是否有类似问题
4. 提供详细的环境信息和错误日志
5. 联系项目维护团队

---




*让AI赋能电商，让数字人创造价值*


