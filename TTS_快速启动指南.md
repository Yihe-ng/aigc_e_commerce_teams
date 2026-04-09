# TTS 快速启动指南

这份文档是给第一次接手项目的人准备的。

目标很简单：

1. 启动 Qwen3-TTS 本地服务
2. 启动项目主后端
3. 确认后端已经能调用 TTS

如果你只想尽快跑通，不需要先读完整个项目。

## 一、先理解这几个端口

当前项目里和 TTS 相关的端口分工如下：

- `8000`：Qwen3-TTS 服务
- `5000`：主业务后端，真正发起 TTS / ASR / LLM 调用
- `6000`：兼容页面壳/代理层，不是主业务入口

最重要的一句话：

`5000` 会调用 `8000`，所以 **必须先启动 TTS 服务，再启动主后端**。

## 二、推荐启动方式

无论做什么，**都建议在项目根目录执行命令**。

项目根目录是：

```powershell
E:\aigc_team\aigc_e_commerce_teams
```

## 三、首次准备

### 1. 进入项目根目录

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
```

### 2. 激活虚拟环境

```powershell
.\.venv\Scripts\Activate.ps1
```

激活成功后，命令行前面一般会出现：

```powershell
(.venv)
```

### 3. 检查关键配置

打开项目根目录下的 [`system.conf`](E:/aigc_team/aigc_e_commerce_teams/system.conf)，确认至少这两项是对的：

```ini
tts_module=qwen3
qwen3_tts_url = http://127.0.0.1:8000/tts
```

打开项目根目录下的 [`config.json`](E:/aigc_team/aigc_e_commerce_teams/config.json)，确认音色是当前支持的其中一个：

```json
"voice": "Qwen3-灵动女声"
```

或者：

```json
"voice": "Qwen3-稳重男声"
```

## 四、启动步骤

### 第一步：启动 Qwen3-TTS 服务

在项目根目录执行：

```powershell
python .\tts\qwen3tts_server\server.py
```

如果你更习惯不依赖激活环境，也可以写完整路径：

```powershell
.\.venv\Scripts\python.exe .\tts\qwen3tts_server\server.py
```

启动成功后，终端一般会看到类似：

```text
Uvicorn running on http://127.0.0.1:8000
```

### 第二步：验证 TTS 服务是否正常

浏览器打开：

```text
http://127.0.0.1:8000/health
```

如果服务正常，说明 TTS 已经起来了。

也可以打开：

```text
http://127.0.0.1:8000/docs
```

查看接口文档。

### 第三步：启动主后端

重新开一个 PowerShell 窗口。

再次进入项目根目录并激活虚拟环境：

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
.\.venv\Scripts\Activate.ps1
```

然后启动主后端：

```powershell
python .\main.py
```

或者：

```powershell
.\.venv\Scripts\python.exe .\main.py
```

### 第四步：访问后端

启动成功后，主要使用下面两个地址：

- 主 API：`http://127.0.0.1:5000`
- 兼容页面壳：`http://127.0.0.1:6000`

如果你只是验证主后端是否可用，优先看 `5000`。

## 五、最短成功路径

如果你已经有 `.venv`，并且依赖都装好了，那么只要两条命令：

第一个窗口：

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
.\.venv\Scripts\Activate.ps1
python .\tts\qwen3tts_server\server.py
```

第二个窗口：

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
.\.venv\Scripts\Activate.ps1
python .\main.py
```

## 六、最容易踩的坑

### 1. 进了子目录以后，`.venv` 路径失效

错误示例：

```powershell
cd E:\aigc_team\aigc_e_commerce_teams\tts\qwen3tts_server
.venv\Scripts\python.exe main.py
```

这会报错，因为此时 PowerShell 会去找：

```text
E:\aigc_team\aigc_e_commerce_teams\tts\qwen3tts_server\.venv\Scripts\python.exe
```

这个路径并不存在。

正确做法有两种。

做法 A：回到项目根目录再运行：

```powershell
cd E:\aigc_team\aigc_e_commerce_teams
python .\tts\qwen3tts_server\server.py
```

做法 B：如果你一定要在 `tts\qwen3tts_server` 目录执行，就写相对上级路径：

```powershell
..\..\.venv\Scripts\python.exe .\server.py
```

### 2. 只启动了 `main.py`，没启动 TTS 服务

现象：

- 后端能起来
- 但播报时报 Qwen3-TTS 无法连接

原因：

主后端会调用 `http://127.0.0.1:8000/tts`
如果 `8000` 没启动，TTS 一定失败。

### 3. 音色配置写了文档里不存在的旧值

当前项目代码里稳定支持的 Qwen3 音色只有：

- `Qwen3-灵动女声`
- `Qwen3-稳重男声`

它们定义在 [`tts/tts_voice.py`](E:/aigc_team/aigc_e_commerce_teams/tts/tts_voice.py)。

### 4. 访问 `6000` 以为它是主 API

`6000` 现在是兼容页面壳和代理层。

真正的主业务 API 在：

```text
http://127.0.0.1:5000
```

## 七、怎么判断调用链是通的

当前正确调用链是：

```text
页面 / 客户端
  -> 5000 主后端
  -> 8000 Qwen3-TTS
```

兼容模式下也可能是：

```text
页面 / 客户端
  -> 6000 页面壳
  -> 5000 主后端
  -> 8000 Qwen3-TTS
```

只要 `8000` 和 `5000` 都正常，TTS 就能工作。

## 八、如果启动失败，按这个顺序检查

1. 当前命令是不是在项目根目录执行的
2. 虚拟环境是不是已经激活
3. `system.conf` 里的 `tts_module` 和 `qwen3_tts_url` 是否正确
4. `config.json` 里的 `voice` 是否是支持的音色
5. `http://127.0.0.1:8000/health` 能不能打开
6. `main.py` 启动后，`5000` 端口是否正常监听

## 九、建议团队统一的运行习惯

为了减少出错，建议团队统一采用下面这个方式：

- 永远在项目根目录启动
- 永远先启动 TTS，再启动主后端
- 优先把 `5000` 当成主 API
- `6000` 只当兼容入口，不当主业务端口

## 十、对应文件

你启动和排查 TTS 时最常看的文件就是这几个：

- [`TTS_快速启动指南.md`](E:/aigc_team/aigc_e_commerce_teams/TTS_快速启动指南.md)
- [`README_QWEN3_TTS.md`](E:/aigc_team/aigc_e_commerce_teams/README_QWEN3_TTS.md)
- [`system.conf`](E:/aigc_team/aigc_e_commerce_teams/system.conf)
- [`config.json`](E:/aigc_team/aigc_e_commerce_teams/config.json)
- [`tts/qwen3tts_server/server.py`](E:/aigc_team/aigc_e_commerce_teams/tts/qwen3tts_server/server.py)
- [`tts/qwen3.py`](E:/aigc_team/aigc_e_commerce_teams/tts/qwen3.py)
- [`main.py`](E:/aigc_team/aigc_e_commerce_teams/main.py)
