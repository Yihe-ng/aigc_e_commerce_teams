import os
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
# 获取上一级目录，即项目根目录
project_root = os.path.dirname(current_dir)

# 将项目根目录添加到 sys.path
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# --- 关键步骤 2: 现在可以安全地导入项目模块了 ---

# 导入配置工具
from utils import config_util

# 导入 TTS 相关模块 (使用 try-except 防止因缺少文件导致崩溃)


# --- 关键步骤 3: 导入标准库和第三方库 ---
from flask import Flask, request, jsonify, send_from_directory, render_template, redirect, url_for, Response, stream_with_context
from flask_cors import CORS
from openai import OpenAI
from gevent import pywsgi
from tts import tts_voice
from tts import qwen3
from tts import volcano_tts
from scheduler.thread_manager import MyThread
from core import wsa_server
from core.interact import Interact
import fay_booter
import pandas as pd
import subprocess
from http import HTTPStatus
from urllib.parse import urlparse, unquote, urlencode
from pathlib import PurePosixPath, Path
import requests
from dashscope import ImageSynthesis
import dashscope
from werkzeug.utils import secure_filename
import hmac
from hashlib import sha1
import base64
import uuid
import time
import hashlib
import urllib.parse
import json
import traceback
from threading import Lock
from datetime import datetime
import oss2
import redis
import random

# 获取项目根目录（从 gui 目录向上一级）
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)

# 将项目根目录添加到 Python 路径
if project_root not in sys.path:
    sys.path.insert(0, project_root)

app = Flask(__name__, static_url_path='/static')
CORS(app)
# 视频生成配置
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ACCESS_KEY = 'k2zYSKKhs0UjVzPaUk4Sng'
SECRET_KEY = 'xiY39rrbIkWX_quiDoCSQWInNnmw6aIu'
API_ENDPOINT = 'https://openapi.liblibai.cloud/api/generate/comfyui/app'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload
#大小设置
# 创建上传目录
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# chat-------------------------------------------------------------------------------------------
def chat(query):
    headers = {
        'Authorization': 'Bearer app-G1jK63X8rj8Rkok4P32sMus7',
        'Content-Type': 'application/json',
    }
    # 根据小红书文案生成工作流构建请求体
    payload = {
        "inputs": {
            "basic_instruction": query  # 用户输入作为基础指令
        },
        "response_mode": "blocking",
        "user": "user_123"  # 用户标识符
    }
    
    try:
        response = requests.post(
            "https://api.dify.ai/v1/workflows/run",
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        
        response_data = response.json()
        
        # 提取小红书文案和话题
        if response_data.get('status') == 'succeeded':
            outputs = response_data.get('data', {}).get('outputs', {})
            red_content = outputs.get('red_content', '')
            red_hashtag = outputs.get('red_hashtag', '')
            
            # 组合返回结果
            result = f"{red_content}\n\n{red_hashtag}" if red_hashtag else red_content
            return result
        else:
            return "文案生成失败，请稍后再试"
            
    except requests.exceptions.Timeout:
        return "请求超时，请稍后再试"
    except requests.exceptions.RequestException as e:
        print(f"Dify API请求失败: {str(e)}")
        return "文案生成服务暂时不可用"
    except Exception as e:
        print(f"处理响应出错: {str(e)}")
        return "处理文案结果时出错"

# 在chat函数下方添加新的API处理函数
@app.route('/api/chat-messages', methods=['POST'])
def dify_chat():
    """处理Dify.ai标准格式的聊天请求"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        user_id = data.get('user', 'anonymous')
        
        # 调用Dify.ai API
        response = requests.post(
            'https://api.dify.ai/v1/chat-messages',
            headers={
                'Authorization': 'Bearer app-SBvChHqxwwb8fPmPDiZjbQ6U',
                'Content-Type': 'application/json'
            },
            json={
                "inputs": data.get('inputs', {}),
                "query": query,
                "response_mode": data.get('response_mode', 'blocking'),
                "conversation_id": data.get('conversation_id', ''),
                "user": user_id
            },
            timeout=30
        )
        response.raise_for_status()
        
        # 直接转发Dify.ai的响应
        return jsonify(response.json()), response.status_code
        
    except requests.exceptions.Timeout:
        return jsonify({
            "status": "error",
            "message": "请求超时",
            "code": 408
        }), 408
    except requests.exceptions.RequestException as e:
        return jsonify({
            "status": "error",
            "message": f"API请求失败: {str(e)}",
            "code": 502
        }), 502
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"服务器内部错误: {str(e)}",
            "code": 500
        }), 500


from flask import redirect, url_for # 确保在文件顶部导入了这些

# 添加流式响应处理端点
@app.route('/api/chat-messages/stream', methods=['GET'])
def dify_chat_stream():
    """处理Dify.ai的流式响应"""
    try:
        message_id = request.args.get('id')
        if not message_id:
            return jsonify({"error": "缺少message_id参数"}), 400
            
        # 转发流式请求
        response = requests.get(
            f'https://api.dify.ai/v1/chat-messages/stream?id={message_id}',
            headers={
                'Authorization': 'Bearer app-SBvChHqxwwb8fPmPDiZjbQ6U',
                'Accept': 'text/event-stream'
            },
            stream=True
        )
        
        # 创建流式响应
        def generate():
            for chunk in response.iter_content(chunk_size=1024):
                yield chunk
                
        return Response(generate(), mimetype='text/event-stream')
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
'''
# write excel---------------------------------------------------------------------------------------
@app.route('/submit-form-data', methods=['POST'])
def submit_form_data():
    data = request.get_json()
    product_name = data['product_name']
    product_features = data['product_features']
    ad_type = data['ad_type']
    ad_best = data['ad_best']

    # 构造要写入CSV的问题和回答
    question_features = f"{product_name}的产品特点是什么？"
    answer_features = f"{product_name}的产品特点有 {product_features}"
    question_ad = f"{product_name}的广告是什么？"
    answer_ad = f"{product_name}的广告是 {ad_best}"

    # 创建一个DataFrame
    df = pd.DataFrame({
        '问题': [question_features, question_ad],
        '回答': [answer_features, answer_ad]
    })

    # 指定CSV文件路径
    file_path = 'qa.csv'

    # 检查文件是否存在，如果存在，则追加数据；如果不存在，则创建文件
    try:
        # 如果文件存在，追加数据
        if os.path.exists(file_path):
            # 读取现有文件
            existing_df = pd.read_csv(file_path)
            # 追加新数据
            new_df = pd.concat([existing_df, df], ignore_index=True)
            # 保存到文件
            new_df.to_csv(file_path, index=False)
        else:
            # 文件不存在，直接写入新数据
            df.to_csv(file_path, index=False)
        return jsonify({'status': 'success', 'message': 'Data saved successfully'})
'''

@app.route('/')
def index():
    return redirect(url_for('login')) # 访问 localhost:5000 时自动跳转到登录页

# 视频生成-------------------------------------------------------------------------------
@app.route('/api/generate_video', methods=['POST'])
def handle_generate_video():
    data = request.get_json()
    image_url = data.get('image_url')
    text_description = data.get('text_description', '')  # 获取文本描述
    
    if not image_url:
        return jsonify({'status': 'error', 'error': '缺少图片URL'}), 400
    
    try:
        # 配置参数 (请替换为您的实际密钥)
        ak = "k2zYSKKhs0UjVzPaUk4Sng"
        sk = "xiY39rrbIkWX_quiDoCSQWInNnmw6aIu"
        template_uuid = "4df2efa0f18d46dc9758803e478eb51c"
        workflow_uuid = "6ae5fdbd17ca44f3ab02bdba9b55da27"
        node_id = "47"
        text_node_id = "55"   # 添加文本节点ID

        # 生成认证信息
        uri = "/api/generate/comfyui/app"
        timestamp = str(int(time.time() * 1000))
        nonce = str(uuid.uuid4())
        content = f"{uri}&{timestamp}&{nonce}"
        digest = hmac.new(sk.encode(), content.encode(), hashlib.sha1).digest()
        signature = base64.urlsafe_b64encode(digest).rstrip(b'=').decode()

        # 构建请求URL
        url = f"https://openapi.liblibai.cloud{uri}?AccessKey={ak}&Signature={signature}&Timestamp={timestamp}&SignatureNonce={nonce}"

        # 构建请求体
        request_body = {
            "templateUuid": template_uuid,
            "generateParams": {
                node_id: {
                    "class_type": "LoadImage",
                    "inputs": {
                        "image": image_url
                    }
                },
                text_node_id: {  # 添加文本节点
                    "class_type": "StringConstantMultiline",
                    "inputs": {
                        "string": text_description
                    }
                },
                "workflowUuid": workflow_uuid
            }
        }

        # 发送请求
        headers = {'Content-Type': 'application/json'}
        response = requests.post(url, headers=headers, json=request_body)
        response.raise_for_status()
        result = response.json()

        if result.get("code") == 0 and result.get("data", {}).get("generateUuid"):
            generate_uuid = result["data"]["generateUuid"]
            
            # 等待任务完成
            videos = wait_for_video(ak, sk, generate_uuid)
            if videos:
                video_data = videos[0]
                return jsonify({
                    'status': 'success',
                    'video_url': video_data.get('videoUrl'),
                    'cover_url': video_data.get('coverPath'),
                    'log': [
                        '状态变更: 执行中 -> 任务成功',
                        f'任务进度: 任务成功, 完成度: 100.0%',
                        f'消耗点数: {video_data.get("pointsCost", 0)}',
                        '视频生成成功！'
                    ]
                })
            
        return jsonify({'status': 'error', 'error': result.get('msg', '视频生成失败')}), 500
        
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


# 数字人启动exe-------------------------------------------------------------------------------
@app.route('/run_exe', methods=['POST', 'OPTIONS'])
def run_exe():
    # 处理OPTIONS预检请求
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    # 处理POST请求
    # 获取当前文件所在目录的绝对路径
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # 构建相对路径 (从gui目录向上到aigc_e_commerce，再进入fay目录)
    exe_path = os.path.normpath(os.path.join(current_dir, '..', 'fay', 'Fay5_4_Oct.exe'))

    # 调用本地exe文件
    try:
        # 检查文件是否存在
        if not os.path.exists(exe_path):
            return jsonify({
                'msg': 'error',
                'error_message': f'文件不存在: {exe_path}',
                'debug_info': {
                    'current_dir': current_dir,
                    'resolved_path': exe_path
                }
            }), 404

        # 启动程序
        subprocess.Popen(exe_path)
        return jsonify({
            'msg': 'success',
            'path': exe_path,
            'relative_path': '../fay/Fay5_4_Oct.exe'
        })
    except Exception as e:
        return jsonify({
            'msg': 'error',
            'error_message': str(e),
            'path': exe_path
        }), 500


# 图生图-------------------------------------------------------------------------------------
# 图生图配置参数
IMG2IMG_ACCESS_KEY = 'k2zYSKKhs0UjVzPaUk4Sng'
IMG2IMG_SECRET_KEY = 'xiY39rrbIkWX_quiDoCSQWInNnmw6aIu'
IMG2IMG_API_BASE = 'https://openapi.liblibai.cloud'
# 添加全局任务锁
task_lock = Lock()
active_tasks = 0
MAX_CONCURRENT_TASKS = 3  # 根据API限制调整

def generate_signature(uri, timestamp, nonce):
    """HMAC-SHA1签名生成（与picturetopicture.py完全一致）"""
    # 关键点1：uri必须保留开头的斜杠
    uri = uri if uri.startswith('/') else f'/{uri}'
    # 关键点2：拼接顺序必须为 uri&timestamp&nonce
    data = f"{uri}&{timestamp}&{nonce}"
    # 关键点3：使用相同的HMAC-SHA1实现
    digest = hmac.new(
        IMG2IMG_SECRET_KEY.encode('utf-8'),
        data.encode('utf-8'),
        hashlib.sha1
    ).digest()
    # 关键点4：Base64 URL安全编码，去掉末尾等号
    return base64.urlsafe_b64encode(digest).rstrip(b'=').decode('utf-8')

def build_request_url(uri, signature, timestamp, nonce):
    """构建完整请求URL"""
    return f"{IMG2IMG_API_BASE}{uri}?AccessKey={IMG2IMG_ACCESS_KEY}&Signature={signature}&Timestamp={timestamp}&SignatureNonce={nonce}"

def validate_image_url(url):
    """验证图片URL是否可访问"""
    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def check_status(task_id):
    """查询生成任务状态"""
    try:
        img2img = Img2imgHandler()
        uri = "/api/generate/comfy/status"
        timestamp = str(int(time.time() * 1000))
        nonce = str(uuid.uuid4())
        signature = img2img.generate_signature(uri, timestamp, nonce)
        request_url = img2img.build_request(uri)

        request_body = {
            "generateUuid": task_id
        }

        response = requests.post(request_url, headers=img2img.headers, json=request_body)
        response.raise_for_status()
        result = response.json()

        if result.get("code") == 0:
            data = result.get("data", {})
            # 增加返回图片URL的逻辑
            image_url = None
            if data.get("images") and len(data["images"]) > 0:
                image_url = data["images"][0]  # 获取第一张图片的URL

            return {
                'status': 'progress',
                'completed': data.get("generateStatus") == 5,
                'progress': data.get("percentCompleted", 0),
                'message': f"任务状态: {get_status_text(data.get('generateStatus'))} ({data.get('percentCompleted', 0)}%)",
                'image_url': image_url
            }
        else:
            return {'status': 'error', 'error': result.get('msg')}

    except Exception as e:
        return {'status': 'error', 'error': str(e)}

def get_status_text(code):
    """状态码转文字"""
    status_map = {
        1: "等待中",
        2: "准备中",
        3: "生成中",
        4: "审核中",
        5: "已完成"
    }
    return status_map.get(code, f"未知状态({code})")

class Img2imgHandler:
    def __init__(self):
        self.ak = 'k2zYSKKhs0UjVzPaUk4Sng'
        self.sk = 'xiY39rrbIkWX_quiDoCSQWInNnmw6aIu'
        self.headers = {'Content-Type': 'application/json'}
        self.task_lock = Lock()
        self.active_tasks = 0
        self.MAX_CONCURRENT_TASKS = 3

    def hmac_sha1(self, data):
        """HMAC-SHA1签名生成"""
        return hmac.new(
            self.sk.encode(),
            data.encode(),
            hashlib.sha1
        ).digest()

    def generate_signature(self, uri, timestamp, nonce):
        """生成请求签名"""
        data = f"{uri}&{timestamp}&{nonce}"
        digest = self.hmac_sha1(data)
        return base64.urlsafe_b64encode(digest).rstrip(b'=').decode()

    def build_request(self, uri):
        """构建基础请求参数"""
        timestamp = str(int(time.time() * 1000))
        nonce = str(uuid.uuid4())
        signature = self.generate_signature(uri, timestamp, nonce)
        url = f"https://openapi.liblibai.cloud{uri}?AccessKey={self.ak}&Signature={signature}&Timestamp={timestamp}&SignatureNonce={nonce}"
        return url

    def submit_task(self, image_url):
        """提交图生图任务"""
        uri = "/api/generate/comfyui/app"
        request_url = self.build_request(uri)
        
        request_body = {
            "templateUuid": "4df2efa0f18d46dc9758803e478eb51c",
            "generateParams": {
                "11": {
                    "class_type": "LoadImage",
                    "inputs": {
                        "image": image_url
                    }
                },
                "workflowUuid": "af405f45d61e4737ac3c4a6449d053be"
            }
        }
        
        response = requests.post(
            request_url,
            headers=self.headers,
            json=request_body,
            timeout=30
        )
        response.raise_for_status()
        return response.json()

    def check_status(self, generate_uuid):
        """检查任务状态"""
        uri = "/api/generate/comfy/status"
        request_url = self.build_request(uri)
        
        response = requests.post(
            request_url,
            headers=self.headers,
            json={"generateUuid": generate_uuid},
            timeout=10
        )
        response.raise_for_status()
        return response.json()

# 初始化处理器
img2img_handler = Img2imgHandler()

@app.route('/api/generate_img2img', methods=['POST'])
def generate_img2img():
    try:
        data = request.get_json()
        if not data or not data.get('image_url'):
            return jsonify({
                "code": 1,
                "msg": "缺少image_url参数",
                "data": None
            }), 400

        # 提交任务
        submit_response = img2img_handler.submit_task(data['image_url'])
        if submit_response.get("code") != 0:
            return jsonify({
                "code": 1,
                "msg": submit_response.get("msg", "任务提交失败"),
                "data": None
            }), 500

        return jsonify({
            "code": 0,
            "msg": "",
            "data": {
                "generateUuid": submit_response["data"]["generateUuid"],
                "checkUrl": "/api/check_img2img_status"
            }
        })

    except Exception as e:
        return jsonify({
            "code": 1,
            "msg": str(e),
            "data": None
        }), 500

@app.route('/api/check_img2img_status', methods=['POST'])
def check_img2img_status():
    try:
        data = request.get_json()
        if not data or not data.get('generateUuid'):
            return jsonify({
                "code": 1,
                "msg": "缺少generateUuid参数",
                "data": None
            }), 400

        status_response = img2img_handler.check_status(data['generateUuid'])
        if status_response.get("code") != 0:
            return jsonify({
                "code": 1,
                "msg": status_response.get("msg", "状态查询失败"),
                "data": None
            }), 500

        return jsonify(status_response)

    except Exception as e:
        return jsonify({
            "code": 1,
            "msg": str(e),
            "data": None
        }), 500

# -------------------------------------------------------------------------------------------
#登录界面
@app.route('/api/login', methods=['POST'])
def handle_login():
    data = request.get_json()
    # 简单验证
    if data.get('email') == 'zxhy' and data.get('password') == '12345678':
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401


@app.route('/home')
def home():
    # 原有主页逻辑
    return render_template('index_main.html')


@app.route('/product_marketing')
def product_marketing():
    return render_template('product_marketing.html')

@app.route('/test1')  # 广告文案
def test1():
    return render_template('test1.html')


@app.route('/test2')  # 宣传图
def test2():
    return render_template('test2.html')


@app.route('/test3')  # 宣传视频
def test3():
    return render_template('test3.html')


# @app.route('/test4')  # 直播数字人
# def test4():
#   return render_template('test4.html')


@app.route('/charts')  # 直播数据统计/售卖情况表格/....
def charts():
    return render_template('charts.html')


@app.route('/calendar')  # 日程安排
def calendar():
    return render_template('calendar.html')


@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/note')
def note():
    # 原有主页逻辑
    return render_template('note.html')

# 添加静态文件路由
@app.route('/static/products/<path:filename>')
def custom_static(filename):
    # 将URL路径映射到本地文件系统路径
    filepath = os.path.join("D:/aigc/aigc_e_commerce/commodity", filename)
    if os.path.exists(filepath):
        return send_from_directory("D:/aigc/aigc_e_commerce/commodity", filename)
    else:
        return "File not found", 404
    
# 获取当前文件所在目录
BASE_DIR = Path(__file__).parent
PRODUCTS_FILE = BASE_DIR / 'products.csv'

@app.route('/product_management')
def product_management():
    return render_template('product_management.html')

# 修正后的OSS配置
OSS_CONFIG = {
    'ACCESS_KEY_ID': os.getenv('ALIYUN_ACCESS_KEY_ID'),
    'ACCESS_KEY_SECRET': os.getenv('ALIYUN_ACCESS_KEY_SECRET'),
    'ENDPOINT': 'oss-cn-shenzhen.aliyuncs.com',
    'BUCKET_NAME': 'oceanedgen',
    'CUSTOM_DOMAIN': 'oceanedgen.oss-cn-shenzhen.aliyuncs.com'
}

auth = None
bucket = None
if OSS_CONFIG['ACCESS_KEY_ID'] and OSS_CONFIG['ACCESS_KEY_SECRET']:
    try:
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
    except Exception as e:
        print(f"Warning: Failed to initialize Aliyun OSS: {e}")
else:
    print("Warning: Aliyun OSS credentials not found. OSS features will be disabled.")

def generate_product_id():
    return f"prod_{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}"

@app.route('/save_product', methods=['POST'])
@app.route('/save_product/<product_id>', methods=['PUT'])
def save_product(product_id=None):
    try:
        data = request.get_json()
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
        
        # 验证必填字段
        required_fields = ['name', 'category', 'price']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'status': 'error', 'error': f'缺少必填字段: {field}'}), 400
        
        # 新建商品时生成ID
        if not product_id:
            product_id = f"prod_{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}"
        
        # 处理图片
        final_images = []
        for img_url in data.get('images', []):
            if 'temp_uploads' in img_url:
                filename = img_url.split('/')[-1]
                new_path = f'products/{product_id}/original_images/{filename}'
                bucket.copy_object(OSS_CONFIG['BUCKET_NAME'], img_url.replace(f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/", ""), new_path)
                bucket.delete_object(img_url.replace(f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/", ""))
                final_images.append(f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/{new_path}")
            else:
                final_images.append(img_url)
        
        # 保存商品信息
        product_info = {
            'name': data['name'],
            'category': data['category'],
            'price': float(data['price']),
            'features': data.get('features', []),
            'description': data.get('description', ''),
            'images': final_images,
            'updated_at': datetime.now().isoformat()
        }
        
        bucket.put_object(f'products/{product_id}/info.json', json.dumps(product_info, ensure_ascii=False))
        
        # 更新索引
        update_product_index(product_id, product_info)
        
        return jsonify({
            'status': 'success',
            'product_id': product_id,
            'product': product_info
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

def update_product_index(product_id, product_data):
    # 更新分类索引
    category_index_path = f'products/_index/by_category/{product_data["category"]}.json'
    try:
        content = bucket.get_object(category_index_path).read()
        index_data = json.loads(content)
    except:
        index_data = []
    
    index_data.append({
        'product_id': product_id,
        'name': product_data['name'],
        'main_image': f'products/{product_id}/original_images/{product_data["images"][0].split("/")[-1]}' if product_data.get('images') else None,
        'updated_at': datetime.now().isoformat()
    })
    
    bucket.put_object(category_index_path, json.dumps(index_data, ensure_ascii=False))

@app.route('/generate_marketing', methods=['POST'])
def generate_marketing():
    try:
        data = request.get_json()
        product_id = data['product_id']
        
        # 生成营销内容 (示例)
        marketing_content = {
            'generated_at': datetime.now().isoformat(),
            'text': f"新品上市：{data['product_name']}，{data['description']}",
            'tags': ['新品', '热卖']
        }
        
        # 保存到OSS
        content_path = f'products/{product_id}/generated_content/marketing.json'
        bucket.put_object(content_path, json.dumps(marketing_content, ensure_ascii=False))
        
        return jsonify({
            'status': 'success',
            'content_url': f"{OSS_CONFIG['CUSTOM_DOMAIN']}/{content_path}"
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

# 增强的商品加载函数
@app.route('/get_products')
def get_products():
    try:
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
        
        products = []
        prefix = 'products/'
        
        # 只查找有效的商品目录
        for obj in oss2.ObjectIterator(bucket, prefix=prefix, delimiter='/'):
            if obj.is_prefix() and obj.key.count('/') == 2:  # 确保是二级目录
                product_id = obj.key.split('/')[1]
                if not product_id.startswith('prod_'):
                    continue
                    
                info_path = f'{prefix}{product_id}/info.json'
                
                try:
                    # 检查info.json是否存在
                    if not bucket.object_exists(info_path):
                        continue
                        
                    info = bucket.get_object(info_path).read()
                    product = json.loads(info)
                    product['id'] = product_id
                    
                    # 获取主图URL
                    image_prefix = f'{prefix}{product_id}/original_images/'
                    for img in oss2.ObjectIterator(bucket, prefix=image_prefix, max_keys=1):
                        if not img.key.endswith('/'):
                            product['main_image'] = f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/{img.key}"
                            break
                    
                    products.append(product)
                except Exception as e:
                    print(f"跳过无效商品 {product_id}: {str(e)}")
                    continue
        
        return jsonify(products)
        
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/get_product_folders', methods=['GET'])
def get_product_folders():
    try:
        base_path = "D:/aigc/aigc_e_commerce/commodity"
        print(f"正在扫描商品文件夹，基础路径: {base_path}")
        
        # 确保products.csv存在
        if not PRODUCTS_FILE.exists():
            return jsonify({"error": "商品数据库不存在"}), 404
            
        products_df = pd.read_csv(PRODUCTS_FILE)
        product_names = products_df['product_name'].dropna().tolist()
        
        folders = []
        for product_name in product_names:
            folder_path = os.path.join(base_path, product_name)
            if not os.path.exists(folder_path):
                continue
                
            folder_data = {
                "name": product_name,
                "pictures": [],
                "videos": []
            }
            
            # 获取图片
            picture_path = os.path.join(folder_path, "picture")
            if os.path.exists(picture_path):
                folder_data["pictures"] = [
                    f"/static/products/{product_name}/picture/{f}" 
                    for f in os.listdir(picture_path) 
                    if f.lower().endswith(('.png', '.jpg', '.jpeg'))
                ]
            
            # 获取视频
            video_path = os.path.join(folder_path, "video")
            if os.path.exists(video_path):
                folder_data["videos"] = [
                    f"/static/products/{product_name}/video/{f}"
                    for f in os.listdir(video_path)
                    if f.lower().endswith(('.mp4', '.avi', '.mov'))
                ]
            
            folders.append(folder_data)
        
        return jsonify(folders)
        
    except Exception as e:
        print(f"发生错误: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/delete_product/<product_id>', methods=['DELETE'])
def delete_product_by_id(product_id):  # 修改函数名确保唯一性
    try:
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
        
        # 检查商品是否存在
        info_path = f'products/{product_id}/info.json'
        if not bucket.object_exists(info_path):
            return jsonify({'status': 'error', 'error': '商品不存在'}), 404
            
        # 删除商品目录
        prefix = f'products/{product_id}/'
        for obj in oss2.ObjectIterator(bucket, prefix=prefix):
            bucket.delete_object(obj.key)
            
        # 更新索引
        update_product_index(product_id, None, delete=True)
        
        return jsonify({'status': 'success'})
        
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

#小红书文案生成
@app.route('/generate_xiaohongshu', methods=['POST'])
def handle_xiaohongshu():
    try:
        data = request.get_json(force=True) or {}
        response = requests.post(
            'https://api.dify.ai/v1/workflows/run',
            headers={'Authorization': 'Bearer app-G1jK63X8rj8Rkok4P32sMus7'},
            json={
                'inputs': {'basic_instruction': data.get('query', '')},
                'response_mode': 'blocking',
                'user': 'abc-123'
            },
            timeout=25
        )
        response_data = response.json()

        outputs = response_data.get('data', {}).get('outputs', {})
        content = ''
        hashtags = ''
        if isinstance(outputs, dict):
            for k in ['red_content', 'content', 'text', 'output', 'result', 'reply']:
                v = outputs.get(k)
                if isinstance(v, str) and v.strip():
                    content = v
                    break
            for k in ['red_hashtag', 'hashtags', 'tags']:
                v = outputs.get(k)
                if isinstance(v, str):
                    hashtags = v
                    break
        if not content:
            data_section = response_data.get('data', {})
            for k in ['text', 'result', 'message']:
                v = data_section.get(k)
                if isinstance(v, str) and v.strip():
                    content = v
                    break
        if not isinstance(content, str):
            content = str(content or '')
        if not isinstance(hashtags, str):
            hashtags = str(hashtags or '')
        
        return jsonify({
            'content': content,
            'hashtags': hashtags,
            'raw_data': response_data  # 调试用
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate_xiaohongshu_stream', methods=['GET'])
def handle_xiaohongshu_stream():
    q = request.args.get('query', '')
    @stream_with_context
    def generate():
        try:
            r = requests.post(
                'https://api.dify.ai/v1/workflows/run',
                headers={'Authorization': 'Bearer app-G1jK63X8rj8Rkok4P32sMus7'},
                json={'inputs': {'basic_instruction': q}, 'response_mode': 'blocking', 'user': 'abc-123'},
                timeout=25
            )
            rd = r.json()
            outs = rd.get('data', {}).get('outputs', {})
            content = ''
            hashtags = ''
            if isinstance(outs, dict):
                for k in ['red_content', 'content', 'text', 'output', 'result', 'reply']:
                    v = outs.get(k)
                    if isinstance(v, str) and v.strip():
                        content = v
                        break
                for k in ['red_hashtag', 'hashtags', 'tags']:
                    v = outs.get(k)
                    if isinstance(v, str):
                        hashtags = v
                        break
            if not content:
                ds = rd.get('data', {})
                for k in ['text', 'result', 'message']:
                    v = ds.get(k)
                    if isinstance(v, str) and v.strip():
                        content = v
                        break
            if not isinstance(content, str):
                content = str(content or '')
            if not isinstance(hashtags, str):
                hashtags = str(hashtags or '')
            size = 48
            i = 0
            while i < len(content):
                chunk = content[i:i+size]
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                i += size
                time.sleep(0.02)
            yield f"data: {json.dumps({'done': True, 'hashtags': hashtags})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/stream_generate', methods=['POST'])  # 新增专用流式端点
def stream_generate():
    if not request.is_json:
        return jsonify({'status': 'error', 'error': '需要JSON格式'}), 400
    
    data = request.get_json()
    image_url = data.get('image_url')
    
    @stream_with_context
    def generate():
        try:
            init_response = generate_img2img(image_url)
            yield f"data: {json.dumps(init_response)}\n\n"
            
            if init_response.get('status') != 'success':
                return
 
            task_id = init_response['task_id']
            while True:
                status = img2img_handler.check_status(task_id)
                yield f"data: {json.dumps(status)}\n\n"
                
                if status.get('completed'):
                    break
                    
                time.sleep(5)
                
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'error': str(e)})}\n\n"

    return Response(generate(), mimetype='text/event-stream')

# 原有生成函数改为内部调用
def generate_img2img(image_url):
    try:
        submit_response = img2img_handler.submit_task(image_url)
        if submit_response.get("code") == 0:
            return {'status': 'success', 'task_id': submit_response["data"]["generateUuid"]}
        else:
            return {'status': 'error', 'error': submit_response.get('msg')}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}
'''
if __name__ == '__main__':
    #app.run(host='localhost', port=5000)
'''

def run():
    server = pywsgi.WSGIServer(('0.0.0.0', 5000), app)
    server.serve_forever()

def start():
    try:
        print(">>> Auto-starting WebSocket servers...")
        ui = wsa_server.get_web_instance()
        human = wsa_server.get_instance()

        if ui is None or not ui.is_running():
            wsa_server.new_web_instance(port=10003).start_server()

        if human is None or not human.is_running():
            wsa_server.new_instance(port=10004).start_server()
        wsa_server.start_port_forwarder(listen_port=10000, target_port=10004)
    except Exception as e:
        print(f"WebSocket auto-start failed: {e}")

    MyThread(target=run).start()

# 在后端添加简单记录
GENERATION_HISTORY = []

@app.route('/api/generation_history')
def get_history():
    return jsonify({
        'average_time': sum(h['time'] for h in GENERATION_HISTORY)/len(GENERATION_HISTORY),
        'recent': GENERATION_HISTORY[-5:]
    })

# 状态码映射函数
def get_status_description(status_code):
    status_map = {
        1: "等待执行",
        2: "执行中",
        3: "已生图",
        4: "审核中",
        5: "任务成功",
        6: "任务失败"
    }
    return status_map.get(status_code, f"未知状态({status_code})")

def get_audit_status_description(audit_code):
    audit_map = {
        1: "待审核",
        2: "审核中",
        3: "审核通过",
        4: "审核拦截",
        5: "审核失败"
    }
    return audit_map.get(audit_code, f"未知审核状态({audit_code})")

# 等待视频生成完成的函数
def wait_for_video(ak, sk, generate_uuid, interval=5, timeout=1800):
    start_time = time.time()
    
    while True:
        # 检查超时
        if time.time() - start_time > timeout:
            return None

        # 查询状态
        status_response = check_video_status(ak, sk, generate_uuid)
        if not status_response or status_response.get("code") != 0:
            time.sleep(interval)
            continue

        data = status_response.get("data", {})
        generate_status = data.get("generateStatus")
        
        # 任务完成
        if generate_status == 5:
            return data.get("videos", [])
        # 任务失败
        elif generate_status == 6:
            return None
        
        time.sleep(interval)

# 检查视频状态的函数
def check_video_status(ak, sk, generate_uuid):
    try:
        # 生成认证信息
        uri = "/api/generate/comfy/status"
        timestamp = str(int(time.time() * 1000))
        nonce = str(uuid.uuid4())
        content = f"{uri}&{timestamp}&{nonce}"
        digest = hmac.new(sk.encode(), content.encode(), hashlib.sha1).digest()
        signature = base64.urlsafe_b64encode(digest).rstrip(b'=').decode()

        # 构建请求URL
        url = f"https://openapi.liblibai.cloud{uri}?AccessKey={ak}&Signature={signature}&Timestamp={timestamp}&SignatureNonce={nonce}"

        # 构建请求体
        request_body = {"generateUuid": generate_uuid}

        # 发送请求
        headers = {'Content-Type': 'application/json'}
        response = requests.post(url, headers=headers, json=request_body)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"查询视频状态失败: {e}")
        return None

@app.route('/upload_image', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'error': '未选择文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'error', 'error': '文件名不能为空'}), 400
    
    try:
        # 生成临时存储路径
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        temp_path = f"temp_uploads/{datetime.now().strftime('%Y%m%d')}/{uuid.uuid4().hex}.{ext}"
        
        # 上传到OSS临时目录
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
        
        result = bucket.put_object(temp_path, file)
        if result.status != 200:
            return jsonify({'status': 'error', 'error': 'OSS上传失败'}), 500
        
        return jsonify({
            'status': 'success',
            'image_url': f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/{temp_path}",
            'temp_path': temp_path,
            'filename': file.filename
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/setting')
def setting():
    config_util.load_config()
    return render_template('setting.html', config=config_util.config)

@app.route('/api/get-data', methods=['post'])
def api_get_data():
    config_util.load_config()
    send_voice_list = []
    
    # 1. 总是加入本地 Azure/Edge 声音
    try:
        voice_list = tts_voice.get_voice_list()
        for voice in voice_list:
            voice_data = voice.value
            send_voice_list.append({"id": voice_data.get('name', voice_data['voiceName']), "name": voice_data['name']})
    except Exception as e:
        print(f"Azure voice list error: {e}")

    # 2. 合并 Ali 声音
    ali_voices = [
        {"id": "abin", "name": "阿斌"}, {"id": "zhixiaobai", "name": "知小白"}, {"id": "zhixiaoxia", "name": "知小夏"},
        {"id": "zhixiaomei", "name": "知小妹"}, {"id": "zhigui", "name": "知柜"}, {"id": "zhishuo", "name": "知硕"},
        {"id": "aixia", "name": "艾夏"}, {"id": "zhifeng_emo", "name": "知锋_多情感"}, {"id": "zhibing_emo", "name": "知冰_多情感"},
        {"id": "zhimiao_emo", "name": "知妙_多情感"}, {"id": "zhimi_emo", "name": "知米_多情感"}, {"id": "zhiyan_emo", "name": "知燕_多情感"},
        {"id": "zhibei_emo", "name": "知贝_多情感"}, {"id": "zhitian_emo", "name": "知甜_多情感"}, {"id": "xiaoyun", "name": "小云"},
        {"id": "xiaogang", "name": "小刚"}, {"id": "ruoxi", "name": "若兮"}, {"id": "siqi", "name": "思琪"},
        {"id": "sijia", "name": "思佳"}, {"id": "sicheng", "name": "思诚"}, {"id": "aiqi", "name": "艾琪"},
        {"id": "aijia", "name": "艾佳"}, {"id": "aicheng", "name": "艾诚"}, {"id": "aida", "name": "艾达"},
        {"id": "ninger", "name": "宁儿"}, {"id": "ruilin", "name": "瑞琳"}, {"id": "siyue", "name": "思悦"},
        {"id": "aiya", "name": "艾雅"}, {"id": "aimei", "name": "艾美"}, {"id": "aiyu", "name": "艾雨"},
        {"id": "aiyue", "name": "艾悦"}, {"id": "aijing", "name": "艾婧"}, {"id": "xiaomei", "name": "小美"},
        {"id": "aina", "name": "艾娜"}, {"id": "yina", "name": "伊娜"}, {"id": "sijing", "name": "思婧"},
        {"id": "sitong", "name": "思彤"}, {"id": "xiaobei", "name": "小北"}, {"id": "aitong", "name": "艾彤"},
        {"id": "aiwei", "name": "艾薇"}, {"id": "aibao", "name": "艾宝"}, {"id": "shanshan", "name": "姗姗"},
        {"id": "chuangirl", "name": "小玥"}, {"id": "lydia", "name": "Lydia"}, {"id": "aishuo", "name": "艾硕"},
        {"id": "qingqing", "name": "青青"}, {"id": "cuijie", "name": "翠姐"}, {"id": "xiaoze", "name": "小泽"},
        {"id": "zhimao", "name": "知猫"}, {"id": "zhiyuan", "name": "知媛"}, {"id": "zhiya", "name": "知雅"},
        {"id": "zhiyue", "name": "知悦"}, {"id": "zhida", "name": "知达"}, {"id": "zhistella", "name": "知莎"},
        {"id": "kelly", "name": "Kelly"}, {"id": "jiajia", "name": "佳佳"}, {"id": "taozi", "name": "桃子"},
        {"id": "guijie", "name": "柜姐"}, {"id": "stella", "name": "Stella"}, {"id": "stanley", "name": "Stanley"},
        {"id": "kenny", "name": "Kenny"}, {"id": "rosa", "name": "Rosa"}, {"id": "mashu", "name": "马树"},
        {"id": "xiaoxian", "name": "小仙"}, {"id": "yuer", "name": "悦儿"}, {"id": "maoxiaomei", "name": "猫小美"},
        {"id": "aifei", "name": "艾飞"}, {"id": "yaqun", "name": "亚群"}, {"id": "qiaowei", "name": "巧薇"},
        {"id": "dahu", "name": "大虎"}, {"id": "ailun", "name": "艾伦"}, {"id": "jielidou", "name": "杰力豆"},
        {"id": "laotie", "name": "老铁"}, {"id": "laomei", "name": "老妹"}, {"id": "aikan", "name": "艾侃"}
    ]
    send_voice_list += ali_voices

    # 3. 合并 Volcano 声音
    try:
        send_voice_list += volcano_tts.get_volcano_voices()
    except Exception:
        pass

    # 4. 合并 Qwen 声音
    try:
        send_voice_list += qwen3.get_qwen_voices()
    except Exception:
        pass
    
    # 5. 去重 (按 name)
    seen = set()
    unique_list = []
    for v in send_voice_list:
        nm = v.get('name')
        if nm and nm not in seen:
            seen.add(nm)
            unique_list.append(v)
    
    return json.dumps({'config': config_util.config, 'voice_list': unique_list})

@app.route('/api/submit', methods=['post'])
def api_submit():
    data = request.values.get('data')
    config_data = json.loads(data) if data else request.get_json(force=True)
    cfg = config_data.get('config', config_data)
    config_util.save_config(cfg)
    return '{"result":"successful"}'

@app.route('/api/start-live', methods=['post'])
def api_start_live():
    try:
        config_util.load_config()
        web = wsa_server.new_web_instance(port=10003)
        web.start_server()
        human = wsa_server.new_instance(port=10004)
        human.start_server()
        fay_booter.start()
        wsa_server.get_web_instance().add_cmd({"liveState": 1})
        return "{\"result\":\"successful\"}"
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/stop-live', methods=['post'])
def api_stop_live():
    try:
        fay_booter.stop()
        wsa_server.get_web_instance().add_cmd({"liveState": 0})
        return "{\"result\":\"successful\"}"
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['post'])
def api_chat():
    try:
        data = request.get_json(force=True)
        text = data.get('text', '')
        user = data.get('user', 'User')
        
        if not text:
            return jsonify({"error": "Empty text"}), 400
            
        if not fay_booter.is_running():
            fay_booter.start()
            
        # 异步处理交互，不等待返回，模拟 console 输入
        interact = Interact("text", 1, {'user': user, 'msg': text})
        
        # 使用 MyThread 异步运行，避免阻塞 HTTP 请求太久
        # 但为了让前端看到是否触发，我们这里还是调用一下，不过 on_interact 本身可能是同步的
        # 为了不阻塞，我们还是放入线程池或者直接起个线程
        # 注意：这里我们不需要返回值，因为输出是通过 WebSocket 推送给前端的
        
        MyThread(target=fay_booter.feiFei.on_interact, args=[interact]).start()
        
        return jsonify({"status": "success", "message": "Interaction started"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ws-status')
def ws_status():
    ui = wsa_server.get_web_instance()
    human = wsa_server.get_instance()
    return jsonify({
        "ui_server_running": ui is not None,
        "human_server_running": human is not None,
        "human_client_connected": (human.isConnect if human else False)
    })

@app.route('/v1/chat/completions', methods=['post'])
@app.route('/api/send/v1/chat/completions', methods=['post'])
def api_send_v1_chat_completions():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = {}

    last_content = ""
    username = "User"

    messages = data.get('messages') or []
    if isinstance(messages, list) and messages:
        last_message = messages[-1] if isinstance(messages[-1], dict) else {}
        username = last_message.get('role', 'User')
        if username == 'user':
            username = 'User'
        last_content = last_message.get('content', '')
    else:
        prompt = data.get('prompt')
        if isinstance(prompt, str):
            last_content = prompt

    if not fay_booter.is_running() or getattr(fay_booter, 'feiFei', None) is None:
        try:
            fay_booter.start()
        except Exception as e:
            return jsonify({"error": f"core not running: {e}"}), 500

    try:
        interact = Interact("text", 1, {'user': username, 'msg': last_content})
        resp = fay_booter.feiFei.on_interact(interact)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if resp is None:
        resp_text = ""
    elif isinstance(resp, str):
        resp_text = resp
    else:
        resp_text = str(resp)

    return jsonify({
        "id": "chatcmpl-local",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": data.get('model', 'fay'),
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": resp_text},
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": len(last_content or ""),
            "completion_tokens": len(resp_text),
            "total_tokens": len(last_content or "") + len(resp_text)
        }
    })

# 获取单个商品详情
@app.route('/get_product/<product_id>')
def get_product(product_id):
    try:
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
        
        info_path = f'products/{product_id}/info.json'
        if not bucket.object_exists(info_path):
            return jsonify({'status': 'error', 'error': '商品不存在'}), 404
            
        info = bucket.get_object(info_path).read()
        product = json.loads(info)
        product['id'] = product_id
        
        # 获取所有图片
        image_prefix = f'products/{product_id}/original_images/'
        product['images'] = [
            f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/{obj.key}"
            for obj in oss2.ObjectIterator(bucket, prefix=image_prefix)
            if not obj.key.endswith('/')
        ]
        
        return jsonify(product)
        
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

# 获取商品详情 (确保端点唯一)
@app.route('/get_product_detail/<product_id>')
def get_product_detail(product_id):
    try:
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
        
        info_path = f'products/{product_id}/info.json'
        if not bucket.object_exists(info_path):
            return jsonify({'status': 'error', 'error': '商品不存在'}), 404
            
        info = bucket.get_object(info_path).read()
        product = json.loads(info)
        
        # 获取所有图片
        product['images'] = [
            f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/{obj.key}"
            for obj in oss2.ObjectIterator(bucket, prefix=f'products/{product_id}/')
            if obj.key.endswith(('.jpg', '.png', '.gif', '.webp'))
        ]
        
        return jsonify({
            'status': 'success',
            'product': product
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

# 获取商品营销素材
@app.route('/get_marketing_materials/<product_name>')
def get_marketing_materials(product_name):
    try:
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
        
        # 1. 查找商品目录
        product_prefix = f"products/prod_{product_name}_"
        for obj in oss2.ObjectIterator(bucket, prefix=product_prefix, delimiter='/'):
            if obj.is_prefix():
                product_id = obj.key.split('/')[1]
                break
        else:
            return jsonify({'status': 'error', 'error': '商品不存在'}), 404
        
        # 2. 获取营销素材
        marketing_data = {
            'product_name': product_name,
            'copywriting': '',
            'images': [],
            'videos': []
        }
        
        # 读取营销文案
        copy_path = f'products/{product_id}/marketing/copywriting.txt'
        if bucket.object_exists(copy_path):
            marketing_data['copywriting'] = bucket.get_object(copy_path).read().decode('utf-8')
        
        # 获取营销图片
        images_path = f'products/{product_id}/marketing/images/'
        for img in oss2.ObjectIterator(bucket, prefix=images_path):
            if not img.key.endswith('/'):
                marketing_data['images'].append(f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/{img.key}")
        
        # 获取营销视频
        videos_path = f'products/{product_id}/marketing/videos/'
        for video in oss2.ObjectIterator(bucket, prefix=videos_path):
            if not video.key.endswith('/'):
                marketing_data['videos'].append(f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/{video.key}")
        
        return jsonify({'status': 'success', 'data': marketing_data})
        
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/get_all_marketing_products')
def get_all_marketing_products():
    try:
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
        
        products = []
        prefix = 'products/'
        
        # 遍历所有商品目录
        for obj in oss2.ObjectIterator(bucket, prefix=prefix, delimiter='/'):
            if obj.is_prefix() and obj.key.startswith('products/prod_') and obj.key.count('/') == 2:
                product_id = obj.key.split('/')[1]
                
                # 获取商品基本信息
                info_path = f'{prefix}{product_id}/info.json'
                if not bucket.object_exists(info_path):
                    continue
                
                try:
                    info = json.loads(bucket.get_object(info_path).read())
                    
                    # 获取营销素材
                    marketing_data = {
                        'product_id': product_id,
                        'product_name': info.get('name', '未命名商品'),
                        'marketing_text': '',
                        'posters': [],
                        'videos': []
                    }
                    
                    # 读取营销文案
                    text_path = f'{prefix}{product_id}/generated_content/marketing.txt'
                    if bucket.object_exists(text_path):
                        marketing_data['marketing_text'] = bucket.get_object(text_path).read().decode('utf-8')
                    
                    # 获取海报图片
                    posters_path = f'{prefix}{product_id}/generated_content/images/'
                    for poster in oss2.ObjectIterator(bucket, prefix=posters_path):
                        if not poster.key.endswith('/'):
                            marketing_data['posters'].append({
                                'url': f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/{poster.key}",
                                'filename': poster.key.split('/')[-1]
                            })
                    
                    # 获取视频
                    videos_path = f'{prefix}{product_id}/generated_content/videos/'
                    for video in oss2.ObjectIterator(bucket, prefix=videos_path):
                        if not video.key.endswith('/'):
                            marketing_data['videos'].append({
                                'url': f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/{video.key}",
                                'filename': video.key.split('/')[-1]
                            })
                    
                    products.append(marketing_data)
                except Exception as e:
                    print(f"处理商品 {product_id} 出错: {str(e)}")
                    continue
        
        return jsonify({'status': 'success', 'data': products})
        
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/delete_marketing/<product_id>', methods=['DELETE'])
def delete_marketing_content(product_id):
    try:
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
        
        # 只删除营销内容，保留商品基本信息
        prefix = f'products/{product_id}/generated_content/'
        for obj in oss2.ObjectIterator(bucket, prefix=prefix):
            bucket.delete_object(obj.key)
            
        return jsonify({'status': 'success'})
        
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/oss/products', methods=['GET'])
def get_oss_products():
    try:
        category = request.args.get('category', '')
        has_images = request.args.get('has_images', 'false').lower() == 'true'
        
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
        
        products = []
        
        # 方法1：通过分类索引查找
        if category:
            index_path = f'products/_index/by_category/{category}.json'
            if bucket.object_exists(index_path):
                index_data = json.loads(bucket.get_object(index_path).read())
                for item in index_data:
                    info_path = f'products/{item["product_id"]}/info.json'
                    if bucket.object_exists(info_path):
                        info = json.loads(bucket.get_object(info_path).read())
                        # 检查是否有图片的条件
                        if not has_images or (info.get('images') and len(info['images']) > 0):
                            products.append({
                                'id': item['product_id'],
                                'name': info.get('name', '未命名商品'),
                                'images': info.get('images', []),
                                'main_image': item.get('main_image') or 
                                             (info['images'][0] if info.get('images') else None)
                            })
        
        # 方法2：全量扫描（分类为空时）
        else:
            for obj in oss2.ObjectIterator(bucket, prefix='products/', delimiter='/'):
                if obj.is_prefix() and obj.key.startswith('products/prod_') and obj.key.count('/') == 2:
                    product_id = obj.key.split('/')[1]
                    info_path = f'products/{product_id}/info.json'
                    
                    if bucket.object_exists(info_path):
                        info = json.loads(bucket.get_object(info_path).read())
                        # 检查是否有图片的条件
                        if not has_images or (info.get('images') and len(info['images']) > 0):
                            products.append({
                                'id': product_id,
                                'name': info.get('name', '未命名商品'),
                                'images': info.get('images', []),
                                'main_image': info['images'][0] if info.get('images') else None
                            })
        
        return jsonify({
            'status': 'success',
            'data': products
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/save_generated_content', methods=['POST'])
def save_generated_content():
    try:
        data = request.get_json()
        product_id = data['product_id']
        content_type = data['type']  # 'image' 或 'video'
        file_url = data['file_url']
        custom_path = data.get('custom_path', '')
        
        # 验证商品ID格式
        if not product_id.startswith('prod_'):
            return jsonify({'status': 'error', 'error': '无效的商品ID格式'}), 400
        
        # 初始化OSS客户端
        auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        bucket = oss2.Bucket(auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])
        
        # 生成OSS保存路径
        file_ext = file_url.split('.')[-1].lower()
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_str = uuid.uuid4().hex[:6]
        
        # 使用自定义路径或默认路径
        if custom_path:
            save_path = f"{custom_path}gen_{timestamp}_{random_str}.{file_ext}"
            # 确保目录存在
            dir_path = custom_path if custom_path.endswith('/') else f"{custom_path}/"
            if not bucket.object_exists(dir_path):
                bucket.put_object(dir_path, '')
        else:
            if content_type == 'image':
                save_path = f'products/{product_id}/generated_content/images/gen_{timestamp}_{random_str}.{file_ext}'
            else:
                save_path = f'products/{product_id}/generated_content/videos/gen_{timestamp}_{random_str}.{file_ext}'
            # 确保目录存在
            ensure_oss_directories(bucket, product_id)
        
        # 下载文件并上传到OSS
        try:
            response = requests.get(file_url, stream=True, timeout=30)
            response.raise_for_status()
            
            # 直接使用流式上传
            result = bucket.put_object(save_path, response.raw)
            
            if result.status != 200:
                error_msg = f"OSS上传失败，状态码: {result.status}"
                print(error_msg)
                return jsonify({'status': 'error', 'error': error_msg}), 500
            
            # 返回OSS访问URL
            oss_url = f"https://{OSS_CONFIG['CUSTOM_DOMAIN']}/{save_path}"
            
            return jsonify({
                'status': 'success',
                'oss_url': oss_url,
                'save_path': save_path
            })
            
        except requests.exceptions.RequestException as e:
            error_msg = f"下载文件失败: {str(e)}"
            print(error_msg)
            return jsonify({'status': 'error', 'error': error_msg}), 500
            
    except Exception as e:
        error_msg = f"服务器内部错误: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': error_msg}), 500

def ensure_oss_directories(bucket, product_id):
    """确保OSS目录结构存在"""
    required_dirs = [
        f'products/{product_id}/',
        f'products/{product_id}/generated_content/',
        f'products/{product_id}/generated_content/images/',
        f'products/{product_id}/generated_content/videos/'
    ]
    
    for dir_path in required_dirs:
        # OSS通过创建空对象来模拟目录
        if not bucket.object_exists(dir_path):
            bucket.put_object(dir_path, '')

@app.route('/api/oss/categories')
def get_oss_categories():
    """获取所有商品分类"""
    try:
        if not OSS_CONFIG['ACCESS_KEY_ID'] or not OSS_CONFIG['ACCESS_KEY_SECRET']:
            return jsonify({"status": "error", "error": "未配置OSS密钥"}), 500

        local_auth = oss2.Auth(OSS_CONFIG['ACCESS_KEY_ID'], OSS_CONFIG['ACCESS_KEY_SECRET'])
        local_bucket = oss2.Bucket(local_auth, OSS_CONFIG['ENDPOINT'], OSS_CONFIG['BUCKET_NAME'])

        prefix = "products/_index/by_category/"
        files = local_bucket.list_objects(prefix=prefix).object_list
        
        # 提取分类名称（去掉.json后缀）
        categories = [
            os.path.splitext(os.path.basename(f.key))[0] 
            for f in files 
            if f.key.endswith('.json')
        ]
        
        return jsonify({
            "status": "success",
            "data": categories
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500


@app.route('/api/oss/products_by_category')
def get_oss_products_by_category():
    """获取指定分类下的所有商品"""
    category = request.args.get('category', '')
    if not category:
        return jsonify({"status": "error", "error": "缺少分类参数"}), 400

    try:
        # 双重解码URL编码
        decoded_category = unquote(unquote(category))
        oss_path = f"products/_index/by_category/{decoded_category}.json"
        
        # 验证文件存在性
        if not bucket.object_exists(oss_path):
            return jsonify({
                "status": "success",
                "data": [],
                "message": f"分类'{decoded_category}'暂无商品"
            })

        # 读取OSS文件内容
        obj = bucket.get_object(oss_path)
        products = json.loads(obj.read().decode('utf-8'))
        
        # 验证数据格式
        if not isinstance(products, list):
            raise ValueError("商品数据格式错误，应为数组")

        return jsonify({
            "status": "success",
            "data": products
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e),
            "debug": {
                "received_category": category,
                "decoded_category": decoded_category,
                "oss_path": oss_path
            }
        }), 500
#if __name__ == '__main__':
   # app.run(host='0.0.0.0',port=5050,debug=True)
