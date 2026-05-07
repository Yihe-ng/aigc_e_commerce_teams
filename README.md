# AIGC 电商数字化营销平台

**基于 Live2D 数字人的全链路 AI 电商营销解决方案**

[项目简介](#项目简介) • [系统架构](#系统架构) • [技术栈](#技术栈) • [快速开始](#快速开始) • [配置说明](#配置说明) • [开发指南](#开发指南) • [常见问题](#常见问题)

## 📋 目录
- [AIGC 电商数字化营销平台](#aigc-电商数字化营销平台)
  - [📋 目录](#-目录)
  - [📖 项目简介](#-项目简介)
    - [🎯 核心功能](#-核心功能)
  - [🏗️ 系统架构](#️-系统架构)
    - [整体架构图](#整体架构图)
    - [核心数据流程](#核心数据流程)
    - [服务端口说明](#服务端口说明)
  - [🛠️ 技术栈](#️-技术栈)
    - [后端技术栈](#后端技术栈)
    - [前端技术栈](#前端技术栈)
    - [AI服务集成](#ai服务集成)
    - [第三方服务](#第三方服务)
  - [🚀 快速开始](#-快速开始)
    - [环境要求](#环境要求)
    - [第一步：环境准备](#第一步环境准备)
      - [1.1 克隆项目](#11-克隆项目)
      - [1.2 创建并激活Python虚拟环境](#12-创建并激活python虚拟环境)
      - [1.3 安装Python依赖](#13-安装python依赖)
      - [1.4 可选：安装本地 Qwen3 TTS/ASR 服务依赖](#14-可选安装本地-qwen3-ttsasr-服务依赖)
      - [1.5 安装前端依赖](#15-安装前端依赖)
    - [第二步：服务启动](#第二步服务启动)
      - [2.1 启动主程序](#21-启动主程序)
      - [2.2 可选：启动 Qwen3 TTS 服务](#22-可选启动-qwen3-tts-服务)
      - [2.3 可选：启动 Qwen3 ASR 服务](#23-可选启动-qwen3-asr-服务)
    - [第三步：验证服务](#第三步验证服务)
      - [3.1 服务健康检查](#31-服务健康检查)
      - [3.2 访问Web界面](#32-访问web界面)
  - [⚙️ 配置说明](#️-配置说明)
    - [配置文件位置与用途](#配置文件位置与用途)
    - [1. `system.conf` - 系统主配置模板](#1-systemconf---系统主配置模板)
    - [2. `config.json` - 数字人配置模板](#2-configjson---数字人配置模板)
    - [3. `.env` - 环境变量配置模板](#3-env---环境变量配置模板)
    - [4. `knowledge_keywords.json` - 知识库关键词配置模板](#4-knowledge_keywordsjson---知识库关键词配置模板)
    - [5. `backend/services/rules.json` - 搭配规则库配置](#5-backendservicesrulesjson---搭配规则库配置)
    - [6. Dify 工作流配置说明](#6-dify-工作流配置说明)
    - [7. 数字人运行时配置 (Runtime Config)](#7-数字人运行时配置-runtime-config)
    - [AI服务密钥申请](#ai服务密钥申请)
  - [🖥️ 访问与使用](#️-访问与使用)
    - [Web界面功能](#web界面功能)
      - [1. 数字人直播界面](#1-数字人直播界面)
      - [2. 电商管理后台](#2-电商管理后台)
      - [3. API接口](#3-api接口)
    - [基本操作流程](#基本操作流程)
      - [1. 数字人对话](#1-数字人对话)
      - [2. AI内容生成](#2-ai内容生成)
      - [3. 营销管理](#3-营销管理)
  - [🔧 开发指南](#-开发指南)
    - [项目结构详解](#项目结构详解)
    - [模块扩展指南](#模块扩展指南)
      - [1. 添加新的TTS引擎](#1-添加新的tts引擎)
      - [2. 添加新的ASR引擎](#2-添加新的asr引擎)
      - [3. 添加新的LLM服务](#3-添加新的llm服务)
      - [4. 自定义数字人模型](#4-自定义数字人模型)
      - [5. 扩展搭配规则](#5-扩展搭配规则)
      - [6. 调优相似推荐算法](#6-调优相似推荐算法)
    - [调试与日志](#调试与日志)
      - [1. 日志文件位置](#1-日志文件位置)
      - [2. 调试模式](#2-调试模式)
      - [3. 常见调试命令](#3-常见调试命令)
  - [❓ 常见问题](#-常见问题)
    - [安装问题](#安装问题)
      - [Q1: 安装 PyAudio 失败 (Windows)](#q1-安装-pyaudio-失败-windows)
      - [Q2: 安装 torch 时 CUDA 相关问题](#q2-安装-torch-时-cuda-相关问题)
      - [Q3: 前端依赖安装失败](#q3-前端依赖安装失败)
    - [启动问题](#启动问题)
      - [Q1: 端口被占用](#q1-端口被占用)
      - [Q2: TTS/ASR 服务启动失败](#q2-ttsasr-服务启动失败)
      - [Q3: 模型下载缓慢或失败](#q3-模型下载缓慢或失败)
    - [运行问题](#运行问题)
      - [Q1: 数字人不说话](#q1-数字人不说话)
      - [Q2: 语音识别无结果](#q2-语音识别无结果)
      - [Q3: Web界面无法访问](#q3-web界面无法访问)
    - [配置问题](#配置问题)
      - [Q1: API密钥无效](#q1-api密钥无效)
      - [Q2: 音色不可用](#q2-音色不可用)
  - [🤝 贡献与维护](#-贡献与维护)
    - [代码规范](#代码规范)
    - [提交指南](#提交指南)
    - [版本管理](#版本管理)
    - [维护说明](#维护说明)
  - [📄 许可证](#-许可证)
  - [🆘 技术支持](#-技术支持)

## 📖 项目简介

**AIGC 电商数字化营销平台** 是一个集成了 Live2D 数字人直播、AI 内容生成和电商营销管理的全链路解决方案。项目起源于 Fay 架构，现已演变为成熟的 Live2D 数字人电商营销平台。

### 🎯 核心功能

1. **Live2D 数字人直播**
   - 实时语音交互与表情同步
   - 多音色语音合成 (TTS)
   - 高精度语音识别 (ASR)
   - 唇形同步与表情增强

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

5. **智能交互与合规保障**
   - 知识库检索与增强 (Dify集成 + 本地RAG向量检索)
   - 违禁词审核与合规检查 (输入/输出双重过滤)
   - 智能产品匹配与意图识别
    - 专业知识库集成 (面料、洗护、风格等领域)

6. **搭配规则引擎**
   - 结构化搭配规则库 (9风格 × 6场景 × 3版型 × 6颜色)
   - 关键词触发 (搭配/怎么搭/配什么 等6个触发词)
   - 规则匹配 + LLM话术润色，避免纯LLM编造
   - 可扩展JSON规则库 (`rules.json`)

7. **相似商品推荐**
   - TF-IDF 加权 Jaccard 相似度算法
   - 属性级语义匹配 (style/scene/tags/color/material)
   - 触发词匹配 (相似/类似/推荐/还有/同款/看看别的)
   - 可解释推荐结果 (显示匹配属性和相似度分数)

8. **尺码推荐系统**
   - 商品尺码表匹配 + 身形数据推理
   - 版型/弹力/厚度/偏码多因子加权
   - 支持身高体重选码、梨形/肩宽适配
   - 用户数据提取 (身高/体重/身形/平时尺码)

9. **主播风格控制**
   - 三种预设风格: `vtuber_light`(元气主播)、`professional`(专业导购)、`natural`(自然对话)
   - 风格Prompt注入 + Few-shot示例学习
   - 前后端统一的风格切换与持久化
   - 数字人设置页面可视化管理

10. **AI 商品自动打标**
    - LLM 一键生成商品 description / style / scene / tags
    - 前端商品表单集成 (风格 Select、场景/标签 Chip 组)
    - 数据双向同步 (数据库与 raw_info 兼容)

## 🏗️ 系统架构

### 整体架构图

```
┌──────────────────────────────────────────────────────────────┐
│                      前端界面 (Next.js)                       │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐  │
│  │Live2D数字人│ │电商管理后台│ │ AI工具工作区│ │ 数字人设置 ⚙️ │  │
│  └─────────┘ └──────────┘ └───────────┘ └───────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼─────────────────────────────────────┐
│                    主业务API层 (Flask :5000)                   │
│  ┌─────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ aigc_server │ │ 登录/注册  │ │ 数据看板   │ │runtime-  │ │
│  │ (商品/AI/配置)│ │   (3002)   │ │   (5001)   │ │config API│ │
│  └─────────────┘ └────────────┘ └────────────┘ └──────────┘ │
└────────┬────────────────┬─────────────┬──────────────────────┘
         │                │             │
┌────────▼────────────────▼──────┬──────▼──────────────────────┐
│          服务引擎层 (backend/services/)                       │
│  ┌───────────┐ ┌───────────┐ ┌────────────┐ ┌────────────┐  │
│  │搭配规则引擎│ │相似推荐引擎│ │尺码推荐引擎│ │销售策略引擎│  │
│  │outfit_rules│ │similarity │ │size_recomm │ │sales_strategy│ │
│  └───────────┘ └───────────┘ └────────────┘ └────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
  ┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼──────────┐
  │ Qwen3-TTS │ │ Qwen3-ASR │ │   WebSocket     │
  │  :8000    │ │  :8001    │ │ (10003-10004)   │
  └────────────┘ └────────────┘ └─────────────────┘
         │               │
  ┌──────▼───────────────▼──────┐
  │        AI 服务集群           │
  │  • LLM (LongCat/GPT/Qwen)   │
  │  • Dify.ai 工作流 / 知识库   │
  │  • LiblibAI / 阿里云OSS     │
  │  • 硅基流动 Embedding        │
  └──────────────────────────────┘
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

4. **知识检索流程**
   ```
   用户查询 → 关键词匹配 → 知识库检索 → 上下文注入 → LLM增强回复
   ```

5. **审核与合规流程**
   ```
   用户输入 → 违禁词检测 → 知识域识别 → 产品匹配 → LLM处理 → 输出审核 → 最终回复
   ```

6. **搭配推理流程（规则引擎）**
   ```
   用户提问 → 触发词检测 → rules.json 规则匹配 → 搭配结果 → LLM 话术润色 → 输出
   ```

7. **相似推荐流程（Jaccard 相似度）**
   ```
   当前商品属性 → 候选商品属性提取 → TF-IDF 加权 Jaccard 计算 → 排序 → Top-K 推荐
   ```

8. **尺码推荐流程**
   ```
   用户身形数据 → 商品尺码表检索 → 版型/弹力/偏码多因子规则 → 尺码建议 → LLM 话术
   ```

9. **风格控制流程**
   ```
   结构化结果(JSON) → persona_style 分支 → 风格 Prompt + Few-shot 注入 → LLM 生成 → 风格化话术
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
| WebSocket UI服务 | 10003 | 前端实时通信 | `core/wsa_server.py` |
| WebSocket 数字人服务 | 10004 | 数字人实时通信 | `core/wsa_server.py` |
| 端口转发器 | 10000 | 转发到数字人服务(10004) | `core/wsa_server.py` |

## 🛠️ 技术栈

### 后端技术栈
- **Web框架**: Flask 3.0 + gevent
- **API服务**: FastAPI (用于TTS/ASR服务)
- **实时通信**: WebSocket (ws4py, websockets)
- **数据库**: SQLite (任务管理) + MySQL (用户数据，可选) + 阿里云OSS (云存储)
- **向量数据库**: ChromaDB (本地向量存储)
- **AI框架**: PyTorch + Transformers + ModelScope
- **知识检索框架**: Dify知识库API + 本地RAG检索器
- **审核引擎**: 快速模式匹配 + 语义理解
- **任务调度**: schedule
- **推荐引擎**: TF-IDF 加权 Jaccard 相似度 / 结构化搭配规则引擎 / 多因子尺码推荐
- **风格控制**: 三模式 Persona 风格注入 + Few-shot 示例学习
- **音频处理**: pydub, soundfile, pyaudio

### 前端技术栈
- **框架**: Next.js 15 + React 19 + TypeScript
- **UI组件**: HeroUI v3 + Tailwind CSS + Radix UI (含数字人设置、商品打标等表单组件)
- **Live2D渲染**: PixiJS + pixi-live2d-display
- **状态管理**: React Context + 原生Hooks
- **构建工具**: pnpm + ESLint + PostCSS

### AI服务集成
- **TTS引擎**: Qwen3-TTS, Azure TTS, 阿里云TTS, GPT-SoVITS, 火山引擎TTS
- **ASR引擎**: Qwen3-ASR, FunASR, 阿里云NLS
- **LLM服务**: GPT API, 通义星尘, 灵聚AI, Coze, Ollama, LangChain
- **图像生成**: LiblibAI API, 稳定扩散模型
- **情感分析**: 百度AI情感分析, Cemotion
- **知识检索**: Dify知识库API, 本地RAG向量检索 (ChromaDB + 硅基流动Embedding)
- **商品理解**: AI 自动打标 (style/scene/tags 提取), 自然语言查询 → 结构化属性映射
- **审核服务**: 违禁词检测, 内容合规检查
- **唇形同步**: 能量模型, 文本时间线处理

### 第三方服务
- **云存储**: 阿里云OSS
- **API网关**: Dify.ai
- **Embedding服务**: 硅基流动API (BAAI/bge-m3)
- **知识库平台**: Dify.ai (知识库管理)
- **部署环境**: Docker (可选)

## 🚀 快速开始

### 环境要求
- **操作系统**: Windows 10/11 (推荐), Linux/macOS (需适配)
- **Python**: 3.10+ (推荐 3.11)
- **Node.js**: 18+
- **包管理器**: pnpm (前端), pip/uv/conda 环境内 pip (后端)
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
# 安装主程序依赖
python -m pip install -r requirements.txt
```

**注意**: `requirements.txt` 用于主程序环境，已包含：
- Web 框架依赖 (`fastapi`, `uvicorn`, `flask`)
- AI 与本地检索依赖 (`langchain`, `chromadb`, `torch`, `transformers`, `sentence-transformers`)
- 工具类依赖 (`pydub`, `soundfile`, `opencv-python`)

如果你使用 uv 或 conda，请先进入对应 Python 环境，再执行同样的
`python -m pip install -r requirements.txt` 命令。

#### 1.4 可选：安装本地 Qwen3 TTS/ASR 服务依赖

只有当 `system.conf` 中启用本地 Qwen3 TTS/ASR 时，才需要安装本节依赖。
Qwen3 TTS 与 Qwen3 ASR 必须使用不同虚拟环境，不能安装到同一个环境。
若使用uv/conda参考他们的依赖文件开头注释

原因是 `qwen-tts` 当前固定依赖 `transformers==4.57.3`，而 `qwen-asr`
当前固定依赖 `transformers==4.57.6`。

Qwen3 TTS 环境：
```powershell
.\.venv-qwen-tts\Scripts\Activate.ps1
python -m pip install -r requirements-qwen-tts.txt
```

Qwen3 ASR 环境：
```powershell
.\.venv-qwen-asr\Scripts\Activate.ps1
python -m pip install -r requirements-qwen-asr.txt
```

#### 1.5 安装前端依赖
```powershell
# 进入前端目录
cd frontend

# 安装依赖 (使用 pnpm)
pnpm i

# 返回项目根目录
cd ..
```

### 第二步：服务启动

默认只需要启动主程序。`main.py` 会拉起主 API、登录服务、WebSocket
服务，以及 Next.js 前端开发服务。只有当配置启用本地 Qwen3 TTS 或
Qwen3 ASR 时，才需要额外启动对应服务。

#### 2.1 启动主程序
```powershell
.\.venv\Scripts\Activate.ps1
python .\main.py
```
**成功标志**: 看到以下服务启动信息：
- 主业务 API 服务启动，默认端口 `5000`
- 登录服务启动，默认端口 `3002`
- 页面壳服务启动，默认端口 `6000`
- WebSocket 服务启动，默认端口 `10003` / `10004`
- 前端开发服务启动，默认端口 `3000`

#### 2.2 可选：启动 Qwen3 TTS 服务

当 `system.conf` 中 `tts_module = qwen3` 时，需要单独启动本服务。

```powershell
.\.venv-qwen-tts\Scripts\Activate.ps1
python .\tts\qwen3tts_server\server.py
```
**成功标志**: 看到 `Uvicorn running on http://0.0.0.0:8000`

#### 2.3 可选：启动 Qwen3 ASR 服务

当 `system.conf` 中 `ASR_mode = qwen3` 时，需要单独启动本服务。

```powershell
.\.venv-qwen-asr\Scripts\Activate.ps1
python .\asr\qwen3_server\server.py
```
**成功标志**: 看到 `Uvicorn running on http://0.0.0.0:8001`

### 第三步：验证服务

#### 3.1 服务健康检查
```powershell
# 主 API 健康检查
curl http://127.0.0.1:5000/api/health/live
curl http://127.0.0.1:5000/api/ws-status
curl http://127.0.0.1:5000/api/admin/local-rag/status

# Qwen3 TTS 服务健康检查 (仅启用本地 Qwen3 TTS 时使用)
curl http://127.0.0.1:8000/health

# Qwen3 ASR 服务健康检查 (仅启用本地 Qwen3 ASR 时使用)
curl http://127.0.0.1:8001/health
```

#### 3.2 访问Web界面
- **主管理界面**: http://127.0.0.1:3000
- **登录界面**: http://127.0.0.1:3000/login
- **Live2D数字人界面**: http://127.0.0.1:3000/live
- **主 API 服务**: http://127.0.0.1:5000
- **API文档 (Qwen3 TTS，仅启动后可用)**: http://127.0.0.1:8000/docs
- **API文档 (Qwen3 ASR，仅启动后可用)**: http://127.0.0.1:8001/docs

## ⚙️ 配置说明

### 配置文件位置与用途

项目使用以下三个核心配置文件，**均需放置在项目根目录**：

| 配置文件 | 用途 | 必需性 |
|----------|------|--------|
| `system.conf` | 系统主配置，定义AI服务模式、API密钥等 | **必需** |
| `config.json` | 数字人属性配置，定义音色、模型、交互参数等 | **必需** |
| `.env` | 环境变量配置，用于云服务、第三方API密钥等 | 可选（但建议配置） |
| `knowledge_keywords.json` | 知识库关键词映射配置，定义面料、洗护、风格等知识域 | 可选（知识库功能需要） |
| `backend/services/rules.json` | 搭配规则库，定义风格/场景/版型/颜色的搭配规则 | 可选（搭配推荐功能需要） |
| `runtime/forbidden_words.txt` | 违禁词库文件，用于内容审核与合规检查 | 可选（审核功能需要） |

### 1. `system.conf` - 系统主配置模板

**文件位置**: 项目根目录 `/system.conf`

```ini
[key]
# ==================== ASR 配置 ====================
# ASR模式选择: funasr / ali / sensevoice / qwen3
# qwen3 需要单独启动 Qwen3-ASR 服务
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
# qwen3 需要单独启动 Qwen3-TTS 服务；不启动本地服务时可使用 azure / ali / volcano
tts_module = azure

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
  - `voice`: 音色设置 (如 "Qwen3-灵动女声"，根据服务商进行配置)
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

# ==================== Dify 配置 ====================

# 营销文案生成器工作流 API Key
DIFY_MARKETING_COPY_KEY=app-YOUR_MARKETING_COPY_KEY

# 导购文案生成器工作流 API Key  
DIFY_GUIDE_COPY_KEY=app-YOUR_GUIDE_COPY_KEY

# ==================== 知识增强配置 ====================
# Dify 知识库数据集 API Key (用于知识检索服务)
DIFY_DATASET_API_KEY=dataset-YOUR_DATASET_API_KEY

# 硅基流动 API Key (用于本地 RAG Embedding 生成)
SILICONFLOW_API_KEY=sk-YOUR_SILICONFLOW_API_KEY

# ==================== 可选配置 ====================
# 违禁词文件路径 (默认: ./runtime/forbidden_words.txt)
FORBIDDEN_WORDS_FILE=./runtime/forbidden_words.txt

# ==================== Python 环境配置 ====================
# Python路径配置 (保持默认即可)
PYTHONPATH=.

# 模型缓存路径 (用于 ModelScope 模型下载)
MODELSCOPE_CACHE=C:/Users/你的用户名/.cache/modelscope

# FFmpeg路径 (用于音频处理)
PATH=%PATH%;./test/ovr_lipsync/ffmpeg/bin
```

### 4. `knowledge_keywords.json` - 知识库关键词配置模板

**文件位置**: 项目根目录 `/config/knowledge_keywords.json`

```json
{
  "fabric": {
    "description": "Fabric, material, and texture related questions.",
    "keywords": [
      "fabric",
      "material",
      "面料",
      "材质",
      "透气",
      "柔软",
      "亲肤",
      "棉",
      "麻",
      "羊毛",
      "针织",
      "手感",
      "质感"
    ],
    "dataset_aliases": [
      "fabric",
      "material",
      "面料",
      "材质",
      "布料",
      "材质面料"
    ]
  },
  "care": {
    "description": "Washing, care, and maintenance related questions.",
    "keywords": [
      "care",
      "wash",
      "clean",
      "洗护",
      "清洗",
      "怎么洗",
      "机洗",
      "手洗",
      "晾晒",
      "保养",
      "缩水",
      "掉色",
      "变形"
    ],
    "dataset_aliases": [
      "care",
      "wash",
      "clean",
      "洗护",
      "清洗",
      "保养",
      "洗涤"
    ]
  },
  "style": {
    "description": "Style, outfit matching, and scene related questions.",
    "keywords": [
      "style",
      "look",
      "风格",
      "搭配",
      "穿搭",
      "适合",
      "场合",
      "通勤",
      "约会",
      "休闲",
      "正式",
      "显瘦",
      "修身"
    ],
    "dataset_aliases": [
      "style",
      "look",
      "风格",
      "穿搭",
      "搭配",
      "场景",
      "场合"
    ]
  }
}
```

**配置字段说明**:
- **fabric/care/style**: 知识域定义，每个域包含：
  - `description`: 领域描述（英文）
  - `keywords`: 触发该领域检索的关键词列表（中英文混合）
  - `dataset_aliases`: 对应Dify知识库数据集的别名列表

**使用流程**:
1. 当用户输入包含`keywords`中的关键词时，系统自动触发对应知识域检索
2. 系统通过`dataset_aliases`映射到Dify知识库中的具体数据集
3. 检索到的专业知识将作为上下文注入LLM，生成更专业的回复

### 5. `backend/services/rules.json` - 搭配规则库配置

**文件位置**: 项目根目录下的 `backend/services/rules.json`

搭配规则库是搭配推荐引擎的配置核心，定义了服装属性与推荐搭配项的映射关系。当前覆盖 **9 种风格 × 6 种场景 × 3 种版型 × 6 种颜色** 的组合规则。

**规则结构示例**:
```json
{
  "style": { "法式": ["高跟鞋", "小包", "珍珠配饰"] },
  "scene": { "通勤": ["西装外套", "乐福鞋", "通勤包"] },
  "fit": { "修身": ["高腰下装"], "宽松": ["修身下装"] },
  "color": { "黑色": ["浅色包", "银色饰品", "亮色丝巾"] }
}
```

**扩展方式**: 直接在 JSON 中添加新的风格/场景/版型/颜色键值对即可，引擎会自动匹配。

### 6. Dify 工作流配置说明

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

### 7. 数字人运行时配置 (Runtime Config)

数字人的主播风格、语气等个性化设置通过运行时配置系统管理，不在 `config.json` 中直接修改。

**管理接口**: `GET/POST /api/runtime-config/digital-human`

**可配置字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `persona_style` | `string` | 主播风格: `vtuber_light`(元气主播) / `professional`(专业导购) / `natural`(自然对话) |
| `temperature` | `float` | LLM 生成温度 (0.3-0.8) |
| `voice` | `string` | TTS 音色选择 |

**Web 界面管理**: 登录后在 数字人设置页面 可视化调整以上参数。

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
│   │   ├── outfit_rules.py    #   搭配规则匹配引擎
│   │   ├── rules.json         #   搭配规则库 (9风格×6场景×3版型×6颜色)
│   │   ├── similarity.py      #   相似商品推荐引擎 (TF-IDF + Jaccard)
│   │   ├── size_recommendation.py  # 尺码推荐引擎
│   │   ├── sales_strategy.py  #   销售策略 (含 persona_style 三风格)
│   │   └── ...
│   ├── adapters/              # AI服务适配器
│   ├── config/                # 运行时配置
│   └── schemas/               # 数据模型定义
├── frontend/                  # Next.js前端应用
│   ├── app/                   # App Router页面
│   ├── components/            # React组件库
│   │   ├── products/          #   商品管理组件 (含 AI 打标表单)
│   │   ├── settings/          #   设置页组件 (含数字人设置 digital-human-settings.tsx)
│   │   └── ...
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
├── docs/                      # 项目文档
│   ├── 计划/                   #   功能规划文档
│   └── 变更日志/               #   版本变更记录
└── ...
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

#### 5. 扩展搭配规则
搭配规则集中在 `backend/services/rules.json`，按 JSON 键值对组织：
- 添加新风格/场景/版型/颜色：直接在对应 key 下追加数组元素
- 引擎 `outfit_rules.py` 自动遍历所有规则进行匹配
- 无需修改代码，重启服务即生效

#### 6. 调优相似推荐算法
- **IDF 权重**：在 `backend/services/similarity.py` 的 `IDF_WEIGHTS` 字典中调整各属性的权重
- **相似度阈值**：修改 `SIMILARITY_THRESHOLD` (当前默认 0.30)，越高结果越严格
- **触发词**：修改 `SIMILARITY_TRIGGERS` 列表控制何时激活推荐
- 测试脚本：`test/test_weighted_sim.py` 可验证调优效果

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
python -m pip check

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
**A**: Qwen3 TTS 与 Qwen3 ASR 使用不同依赖环境，不能安装到同一个
虚拟环境中。分别检查对应环境的依赖：
```powershell
# 检查 Qwen3 TTS 环境
.\.venv-qwen-tts\Scripts\Activate.ps1
python -m pip list | findstr faster-qwen3-tts
python -m pip list | findstr qwen-tts

# 重新安装 Qwen3 TTS 依赖
python -m pip install -r requirements-qwen-tts.txt
```

```powershell
# 检查 Qwen3 ASR 环境
.\.venv-qwen-asr\Scripts\Activate.ps1
python -m pip list | findstr qwen-asr

# 重新安装 Qwen3 ASR 依赖
python -m pip install -r requirements-qwen-asr.txt
```

如果 ASR 服务启动时报项目模块导入错误，可在当前终端补充项目根目录到
`PYTHONPATH` 后重试：
```powershell
$env:PYTHONPATH="."
python .\asr\qwen3_server\server.py
```
若终端自动选取了某个虚拟环境激活，可输入“deactivate”来退出

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


## 🆘 技术支持

如遇问题，请按以下步骤排查：

1. 查看本文档的 **常见问题** 部分
2. 检查 `docs/` 目录下的专项指南
3. 查看项目 Issue 列表是否有类似问题
4. 提供详细的环境信息和错误日志
5. 联系项目维护团队

---




*让AI赋能电商，让数字人创造价值*


