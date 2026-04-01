# Qwen3-TTS 本地部署与集成指南

本项目已成功集成 Qwen3-TTS (0.6B 版本) 作为本地 Text-to-Speech 引擎，支持自然语言指令驱动的情绪化合成。

## 1. 环境准备

Qwen3-TTS 需要 Python 3.10+ 环境。本项目使用项目根目录下的 `.venv` 虚拟环境。

### 1.1 创建虚拟环境

进入项目根目录：

```bash
cd $\aigc_e_commerce_team
```

使用 Python 创建虚拟环境：

```bash
# 使用系统默认 Python 版本创建虚拟环境
python -m venv .venv

# 或指定 Python 版本（如果安装了多个版本）
python3.12 -m venv .venv
```

虚拟环境创建成功后，会在项目目录下生成 `.venv` 文件夹。

### 1.2 激活虚拟环境

**Windows PowerShell**：

```powershell
.venv\Scripts\Activate.ps1
```

**Windows CMD**：

```cmd
.venv\Scripts\activate
```

激活成功后，命令行前面会显示 `(.venv)` 前缀。

### 1.3 安装 PyTorch

**关键步骤：选择正确的 CUDA 版本**

PyTorch 需要与你的显卡驱动版本兼容。请按照以下步骤操作：

1. **检查显卡驱动支持的最高 CUDA 版本**：
   在命令行输入：
   ```bash
   nvidia-smi
   ```
   查看右上角的 `CUDA Version: xx.x`（例如 12.4）。**这是你的显卡驱动支持的最高版本**。

2. **选择 PyTorch 版本**：
   - 你安装的 PyTorch CUDA 版本必须 **小于或等于** 你的驱动支持版本。
   - 推荐使用最新稳定版以获得最佳性能。

**根据你的检查结果选择一条命令安装：**

**情况 A：显卡驱动支持 CUDA 12.4 或更高（推荐 RTX 40/30 系列更新驱动后）**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
```

**情况 B：显卡驱动支持 CUDA 12.1 - 12.3**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

**情况 C：显卡驱动较旧（支持 CUDA 11.8）**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**CPU 版本（无 NVIDIA 显卡）**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### 1.4 安装项目依赖

```bash
# 安装 faster-qwen3-tts（优化版 TTS 库）
pip install faster-qwen3-tts

# 安装 modelscope（用于下载模型）
pip install modelscope

# 安装 FastAPI 和 Uvicorn（用于 Web 服务）
pip install fastapi uvicorn

# 安装音频处理库
pip install soundfile

# 安装数据验证库
pip install pydantic
```

**验证安装**：

```bash
python -c "import torch; print(f'PyTorch version: {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}')"
python -c "from faster_qwen3_tts import FasterQwen3TTS; print('Faster Qwen3-TTS installed successfully')"
```

### 1.5 使用 Conda（可选）

如果你更喜欢使用 Conda 管理环境，可以按照以下步骤操作：

#### 1.5.1 创建 Conda 环境

```bash
# 创建名为 qwen3_tts_env 的虚拟环境，使用 Python 3.12
conda create -n qwen3_tts_env python=3.12 -y

# 激活虚拟环境
conda activate qwen3_tts_env
```

#### 1.5.2 安装 PyTorch

**情况 A：显卡驱动支持 CUDA 12.4+（推荐）**
```bash
conda install pytorch torchvision torchaudio pytorch-cuda=12.4 -c pytorch -c nvidia
```

**情况 B：显卡驱动支持 CUDA 12.1**
```bash
conda install pytorch torchvision torchaudio pytorch-cuda=12.1 -c pytorch -c nvidia
```

**情况 C：显卡驱动支持 CUDA 11.8**
```bash
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia
```

**CPU 版本**
```bash
conda install pytorch torchvision torchaudio cpuonly -c pytorch
```

#### 1.5.3 安装项目依赖

```bash
# 安装 faster-qwen3-tts
pip install faster-qwen3-tts

# 安装其他依赖
pip install modelscope fastapi uvicorn soundfile pydantic
```

**验证安装**：

```bash
python -c "import torch; print(f'PyTorch version: {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}')"
python -c "from faster_qwen3_tts import FasterQwen3TTS; print('Faster Qwen3-TTS installed successfully')"
```

## 2. 模型下载与启动

### 2.1 了解模型信息

Qwen3-TTS-12Hz-0.6B-CustomVoice 是一个 0.6B 参数的多语言 TTS 模型，具有以下特性：

- **支持语言**：中文、英文、日文、韩文、德文、法文、俄文、葡萄牙文、西班牙文、意大利文
- **支持音色**：9 种优质音色
- **情绪控制**：通过自然语言指令控制语气和情感
- **低延迟**：使用 faster-qwen3-tts 优化后，首包延迟降低 50-60%

### 2.2 启动服务端

进入 TTS 服务端目录（先激活虚拟环境）：

```bash
cd tts/qwen3tts_server
```

启动服务端（确保虚拟环境已激活）：

**使用项目根目录的 venv**：

```powershell
# 从项目根目录启动
cd $\aigc_e_commerce_team
.venv\Scripts\python.exe tts/qwen3tts_server/server.py
```

**使用 Conda**：

```bash
# 确保已激活 conda 环境
conda activate qwen3_tts_env
python server.py
```

### 2.3 首次启动说明

**首次启动时**：

1. 服务会自动从 HuggingFace 下载模型文件（约 1.2GB）
2. 下载过程可能需要几分钟，请保持网络畅通
3. 模型会自动缓存到本地，后续启动无需重新下载
4. 模型加载到显存需要 30-50 秒（冷启动）
5. 后续合成通常在 1-3 秒内完成

**显存要求**：

- **8GB 显存**：建议开启 `bfloat16`（代码中已默认开启）
- **6GB 显存**：可能需要降低精度或使用 CPU 推理
- **4GB 显存**：建议使用 CPU 推理或量化模型

### 2.4 验证服务运行

服务启动成功后，会显示类似以下信息：

```
[TTS-SERVER] 正在加载 FasterQwen3TTS 模型...
[TTS-SERVER] PyTorch 版本: 2.5.1+cu124
[TTS-SERVER] CUDA 可用: NVIDIA GeForce RTX 4060
[TTS-SERVER] 正在加载模型: Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice
[TTS-SERVER] 正在预热模型（CUDA Graph 捕获）...
[TTS-SERVER] 模型预热完成
[TTS-SERVER] Faster Qwen3-TTS 服务已就绪！
INFO:     Uvicorn running on http://127.0.0.1:8000
```

在浏览器中访问 `http://127.0.0.1:8000/docs` 可以查看 API 文档。

## 3. Fay 平台配置

### 3.1 system.conf 配置

找到 Fay 项目的 `system.conf` 配置文件，确保以下项已正确配置：

```ini
[key]
# TTS 类型选择 qwen3
tts_module = qwen3

# Qwen3-TTS 本地服务端地址（默认 8000 端口）
qwen3_tts_url = http://127.0.0.1:8000/tts
```

### 3.2 config.json 配置

在 Fay 的 UI 面板中配置，或直接修改 `config.json` 文件：

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

**注意**：建议使用音色的原生语言以获得最佳效果。

## 4. 使用特性

### 4.1 自然语言指令控制

Qwen3-TTS 支持通过自然语言指令（Instruct）控制语气和情感。本项目已自动完成以下情绪映射：

| Fay 情绪状态 | Qwen3 语气指令 | 效果说明 |
| :--- | :--- | :--- |
| 平静 (calm) | 用平稳、自然、淡定的语气说话 | 适合日常对话 |
| 生气 (angry) | 用非常生气、严厉的语气说话 | 表达愤怒情绪 |
| 开朗 (cheerful) | 用开朗、活泼、阳光的语气说话 | 表达快乐情绪 |
| 温柔 (lyrical) | 用温柔、感性、充满感情的语气说话 | 表达柔和情感 |
| 专业 (assistant) | 用专业、有礼貌的助手语气说话 | 适合客服场景 |

### 4.2 自定义语气指令

你也可以在代码中直接使用自定义的自然语言指令：

```python
# 示例：使用不同的语气指令
instructions = [
    "用非常激动的语气说",
    "用悲伤的语气说",
    "用神秘的语气说",
    "用幽默的语气说",
    "用严肃的语气说",
]
```

## 5. 常见问题排查

### 5.1 连接超时问题

**问题**：`Read timed out (120s)`

**原因**：首次合成时模型需要加载到显存（冷启动）

**解决方案**：
- 首次合成需要 30-50 秒，请耐心等待
- 后续合成通常在 1-3 秒内完成
- 如果持续超时，检查显存是否充足

### 5.2 不支持的音色

**问题**：`Unsupported speakers`

**原因**：音色配置不正确

**解决方案**：
- 确保 `voice` 选择的是 `Qwen3-灵动女声` 或 `Qwen3-稳重男声` 等
- 代码会自动将其映射为模型支持的音色名称
- 查看服务端日志确认音色映射是否正确

### 5.3 端口占用问题

**问题**：`WinError 10048` - 端口被占用

**原因**：之前的 Python 进程未正常关闭

**解决方案**：

**方法 1：使用命令查找并关闭进程**

```bash
# 查找占用 8000 端口的进程
netstat -ano | findstr :8000

# 记下 PID（最后一列的数字）
# 关闭进程（替换 <PID> 为实际的进程 ID）
taskkill /PID <PID> /F
```

**方法 2：使用任务管理器**

1. 按 `Ctrl + Shift + Esc` 打开任务管理器
2. 切换到"详细信息"选项卡
3. 找到 `python.exe` 进程
4. 右键选择"结束任务"

### 5.4 显存不足问题

**问题**：`CUDA out of memory`

**原因**：显卡显存不足以加载模型

**解决方案**：

**方法 1：降低精度**

修改 `server.py`，将 `dtype` 从 `torch.bfloat16` 改为 `torch.float16`：

```python
model = FasterQwen3TTS.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice",
    device_map="cuda:0",
    dtype=torch.float16,  # 改为 float16
)
```

**方法 2：使用 CPU 推理**

修改 `device_map` 为 CPU：

```python
model = FasterQwen3TTS.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice",
    device_map="cpu",  # 使用 CPU
    dtype=torch.float32,
)
```

**注意**：CPU 推理会慢很多（约 5-10 倍）。

### 5.5 模型下载失败

**问题**：模型下载失败或速度很慢

**原因**：网络连接问题或 HuggingFace 服务器繁忙

**解决方案**：

**方法 1：使用 HuggingFace 镜像**

```bash
# 设置 HuggingFace 镜像
set HF_ENDPOINT=https://hf-mirror.com

# 然后重新启动服务
python server.py
```

**方法 2：使用代理**

```bash
# 设置代理（根据实际情况修改）
set HTTP_PROXY=http://127.0.0.1:7890
set HTTPS_PROXY=http://127.0.0.1:7890

# 然后重新启动服务
python server.py
```

**方法 3：手动下载模型**

1. 访问 [HuggingFace 模型页面](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice)
2. 手动下载模型文件
3. 将模型文件放置到 HuggingFace 缓存目录（通常在 `C:\Users\<用户名>\.cache\huggingface\hub\`）

### 5.6 依赖安装失败

**问题**：`pip install` 失败

**原因**：网络问题或依赖冲突

**解决方案**：

**方法 1：使用国内镜像源**

```bash
# 使用清华镜像源
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple faster-qwen3-tts

# 或使用阿里云镜像源
pip install -i https://mirrors.aliyun.com/pypi/simple/ faster-qwen3-tts
```

**方法 2：逐个安装依赖**

```bash
pip install faster-qwen3-tts
pip install modelscope
pip install fastapi
pip install uvicorn
pip install soundfile
pip install pydantic
```

### 5.7 虚拟环境激活失败

**问题**：PowerShell 中无法激活虚拟环境

**原因**：PowerShell 执行策略限制

**解决方案**：

```powershell
# 临时允许执行脚本
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# 然后再激活虚拟环境
.venv\Scripts\Activate.ps1
```

### 5.8 PyTorch 版本错误

**问题**：`CUDA-graph capture in the fast path is not reliable on torch<=2.5.0`

**原因**：faster-qwen3-tts 要求 PyTorch 2.5.1 或更高版本

**解决方案**：

```bash
# 升级 PyTorch
pip install --upgrade torch>=2.5.1 torchvision torchaudio
```

### 5.9 实际部署经验总结

以下是在 Windows 环境下部署 TTS 服务时遇到的实际问题和解决方案：

#### 问题 1：虚拟环境未激活导致使用系统 Python

**现象**：直接运行 `python main.py` 或 `python server.py` 时，使用的是系统安装的 Python，而不是虚拟环境中的 Python

**解决方案**：
- 必须先激活虚拟环境：`.venv\Scripts\Activate.ps1`
- 激活后命令行会显示 `(.venv)` 前缀

#### 问题 2：PyTorch CUDA 版本与系统 CUDA 不兼容

**现象**：安装了 CUDA 12.1 版本的 PyTorch，但系统 CUDA 版本是 13.1
**错误信息**：`OSError: [WinError 126] 找不到指定的模块` 或 `OSError: [WinError 127] 找不到指定的程序`

**解决方案**：
- 检查 CUDA 版本：`nvidia-smi`
- 如果 PyTorch 版本不兼容，需要卸载后重新安装：
  ```bash
  pip uninstall torch torchvision torchaudio -y
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
  ```
- 修改 [server.py](file://$\aigc_e_commerce_team\tts\qwen3tts_server\server.py) 使用 CPU 推理

#### 问题 3：torchaudio 模块导入失败

**现象**：`ModuleNotFoundError: No module named 'torchaudio'`
**原因**：卸载 CUDA 版本后，CPU 版本的 torchaudio 未正确安装

**解决方案**：
```bash
# 重新安装 torchaudio
pip install torchaudio
```

#### 问题 4：多个依赖模块缺失

**现象**：启动时报错缺少各种模块
**缺失的模块**：
- `aliyunsdkcore` - 阿里云 SDK
- `flask` - Web 框架
- `flask-cors` - 跨域支持
- `requests` - HTTP 请求库

**解决方案**：逐个安装缺失的依赖
```bash
pip install aliyun-python-sdk-core flask flask-cors requests
```

#### 问题 5：SoX 音频工具缺失警告

**现象**：启动时显示 `'sox' 不是内部或外部命令` 警告
**影响**：这只是警告，不影响 TTS 服务运行
**说明**：SoX 是可选的音频处理工具，不安装也可以正常使用

#### 问题 6：浏览器访问返回 404 错误

**现象**：浏览器访问 http://127.0.0.1:8000 时返回 404
**原因**：TTS 服务是纯 API 服务，不提供前端页面
**解决方案**：
- 访问 API 文档：http://127.0.0.1:8000/docs
- 访问健康检查：http://127.0.0.1:8000/health
- 直接调用 API：POST http://127.0.0.1:8000/tts

#### 问题 7：pip 版本过旧导致依赖安装失败

**现象**：`TypeError: expected string or bytes-like object, got 'NoneType'`
**原因**：pip 版本过旧，无法正确解析依赖关系

**解决方案**：
```bash
# 升级 pip
python -m pip install --upgrade pip
```

#### 最佳实践建议

1. **使用完整路径启动服务**：避免虚拟环境激活问题
   ```bash
   $\aigc_e_commerce_team\.venv\Scripts\python.exe tts/qwen3tts_server/server.py
   ```

2. **CPU 推理作为备选方案**：当 CUDA 版本不兼容时，CPU 推理可以保证服务正常运行，虽然速度较慢

3. **验证 PyTorch 安装**：
   ```bash
   python -c "import torch; print(f'PyTorch version: {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}')"
   ```

4. **首次启动预留足够时间**：模型下载和加载需要 3-5 分钟，请耐心等待

5. **检查服务状态**：通过 http://127.0.0.1:8000/health 确认服务是否正常运行

## 6. 性能优化建议

### 6.1 显卡性能优化

- **CUDA Graph 加速**：faster-qwen3-tts 已内置 CUDA Graph 优化，首包延迟降低 50-60%
- **使用 bfloat16**：代码中已默认启用，可减少显存占用并提升速度
- **关闭其他 GPU 程序**：释放更多显存给 TTS 模型

### 6.2 CPU 性能优化

- **使用多线程**：PyTorch 默认使用多线程，可调整线程数
- **关闭不必要的服务**：释放 CPU 资源

### 6.3 网络优化

- **使用本地缓存**：模型下载后会自动缓存，无需重复下载
- **减少 API 调用延迟**：确保服务端和客户端在同一网络

## 7. 技术参考

### 7.1 模型信息

- **模型名称**：Qwen3-TTS-12Hz-0.6B-CustomVoice
- **模型大小**：约 1.2GB
- **参数量**：0.6B
- **采样率**：12Hz
- **支持语言**：10 种主要语言

### 7.2 性能对比

| 指标 | 原版 Qwen3-TTS | Faster Qwen3-TTS | 提升 |
|------|---------------|------------------|------|
| 首包延迟 | 800-1500ms | 300-600ms | **50-60%** |
| 实时率 (RTF) | 0.3-0.5 | 0.1-0.2 | **60-70%** |
| 显存占用 | ~4GB | ~3.5GB | **~12%** |
| 依赖复杂度 | 高 | 低 | **简化** |

### 7.3 论文引用

如果 Qwen3-TTS 对你的研究有帮助，请引用：

```bibtex
@article{Qwen3-TTS,
  title={Qwen3-TTS Technical Report},
  author={Hangrui Hu and Xinfa Zhu and Ting He and Dake Guo and Bin Zhang and Xiong Wang and Zhifang Guo and Ziyue Jiang and Hongkun Hao and Zishan Guo and Xinyu Zhang and Pei Zhang and Baosong Yang and Jin Xu and Jingren Zhou and Junyang Lin},
  journal={arXiv preprint arXiv:2601.15621},
  year={2026}
}
```

### 7.4 相关链接

- **Faster Qwen3-TTS GitHub**: https://github.com/andimarafioti/faster-qwen3-tts
- **Windows 安装指南**: https://github.com/andimarafioti/faster-qwen3-tts/blob/main/WINDOWS_SETUP_GUIDE.md
- **Qwen3-TTS 模型**: https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice
- **PyTorch 安装**: https://pytorch.org/get-started/locally/

---

启动成功后，在 Fay 中配置 `tts_module = qwen3` 和 `qwen3_tts_url = http://127.0.0.1:8000/tts` 即可使用。
