import os
from aliyunsdkcore import __file__ as sdk_path

print("SDK 安装路径:", os.path.dirname(sdk_path))

# 检查关键文件是否存在
request_dir = os.path.join(os.path.dirname(sdk_path), "request")
print("request 目录:", request_dir)
print("目录内容:", os.listdir(request_dir))
print("__init__.py 存在:", os.path.exists(os.path.join(request_dir, "__init__.py")))
print("common.py 存在:", os.path.exists(os.path.join(request_dir, "common.py")))
