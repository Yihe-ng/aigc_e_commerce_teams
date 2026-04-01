"""
配置验证脚本 - 用于快速检查数字人系统配置
使用方法: python validate_config.py
"""

import configparser
import json
import sys
import os

def validate_system_conf():
    """验证system.conf配置文件"""
    print("="*60)
    print("验证 system.conf 配置文件")
    print("="*60)
    
    try:
        config = configparser.ConfigParser()
        config.read('system.conf', encoding='utf-8')
        
        # 获取当前TTS模块
        tts_module = config.get('DEFAULT', 'tts_module')
        
        # 根据TTS模块动态确定必需的配置项
        if tts_module == 'qwen3':
            required_keys = {
                'ASR_mode': 'qwen3',
                'qwen3_asr_url': 'http://127.0.0.1:8001/asr',
                'tts_module': 'qwen3',
                'qwen3_tts_url': 'http://127.0.0.1:8000/tts',
                'chat_module': 'gpt',
                'gpt_base_url': 'http://127.0.0.1:9880/v1',
                'gpt_model_engine': 'gpt-4o-mini',
                'gpt_api_key': 'sk-xxx',
                'ltp_mode': 'baidu',
                'baidu_emotion_app_id': '122043068',
                'baidu_emotion_api_key': 'xxx',
                'baidu_emotion_secret_key': 'xxx'
            }
        else:
            # 使用gpt-tts或其他TTS模块
            required_keys = {
                'ASR_mode': 'qwen3',
                'qwen3_asr_url': 'http://127.0.0.1:8001/asr',
                'tts_module': 'gpt',
                'gpt_tts_url': 'http://127.0.0.1:9880',
                'chat_module': 'gpt',
                'gpt_base_url': 'http://127.0.0.1:9880/v1',
                'gpt_model_engine': 'gpt-4o-mini',
                'gpt_api_key': 'sk-xxx',
                'ltp_mode': 'baidu',
                'baidu_emotion_app_id': '122043068',
                'baidu_emotion_api_key': 'xxx',
                'baidu_emotion_secret_key': 'xxx'
            }
        
        all_valid = True
        for key, default_value in required_keys.items():
            try:
                value = config.get('DEFAULT', key)
                print(f"[OK] {key}: {value}")
            except configparser.NoOptionError:
                print(f"[FAIL] {key}: 缺失 (建议值: {default_value})")
                all_valid = False
            except Exception as e:
                print(f"[FAIL] {key}: 验证失败 ({e})")
                all_valid = False
        
        return all_valid
        
    except Exception as e:
        print(f"[FAIL] system.conf 验证失败: {e}")
        return False

def validate_config_json():
    """验证config.json配置文件"""
    print("\n" + "="*60)
    print("验证 config.json 配置文件")
    print("="*60)
    
    try:
        with open('config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # 必需的配置项
        required_keys = {
            'attribute': ['name', 'gender', 'voice'],
            'interact': ['perception', 'playSound']
        }
        
        all_valid = True
        for section, keys in required_keys.items():
            if section not in config:
                print(f"[FAIL] {section}: 缺失")
                all_valid = False
                continue
            
            for key in keys:
                if key not in config[section]:
                    print(f"[FAIL] {section}.{key}: 缺失")
                    all_valid = False
                else:
                    print(f"[OK] {section}.{key}: {config[section][key]}")
        
        return all_valid
        
    except FileNotFoundError:
        print("[FAIL] config.json: 文件不存在")
        return False
    except json.JSONDecodeError as e:
        print(f"[FAIL] config.json: JSON格式错误 ({e})")
        return False
    except Exception as e:
        print(f"[FAIL] config.json 验证失败: {e}")
        return False

def check_directories():
    """检查必需的目录"""
    print("\n" + "="*60)
    print("检查目录结构")
    print("="*60)
    
    required_dirs = ['samples', 'logs']
    all_exist = True
    
    for dir_name in required_dirs:
        if os.path.exists(dir_name):
            print(f"[OK] {dir_name}: 存在")
        else:
            print(f"[WARN] {dir_name}: 不存在 (将自动创建)")
            try:
                os.makedirs(dir_name, exist_ok=True)
                print(f"[OK] {dir_name}: 已创建")
            except Exception as e:
                print(f"[FAIL] {dir_name}: 创建失败 ({e})")
                all_exist = False
    
    return all_exist

def check_files():
    """检查必需的文件"""
    print("\n" + "="*60)
    print("检查必需文件")
    print("="*60)
    
    required_files = ['system.conf', 'config.json']
    all_exist = True
    
    for file_name in required_files:
        if os.path.exists(file_name):
            print(f"[OK] {file_name}: 存在")
        else:
            print(f"[FAIL] {file_name}: 不存在")
            all_exist = False
    
    return all_exist

def print_summary(results):
    """打印验证总结"""
    print("\n" + "="*60)
    print("验证总结")
    print("="*60)
    
    all_passed = all(results.values())
    
    for test_name, passed in results.items():
        status = "[OK]" if passed else "[FAIL]"
        print(f"{status}: {test_name}")
    
    print("\n" + "="*60)
    if all_passed:
        print("[OK] 所有验证通过! 系统配置正确")
        print("="*60)
        return 0
    else:
        print("[FAIL] 部分验证失败! 请检查上述问题")
        print("="*60)
        return 1

def main():
    """主函数"""
    print("\n" + "="*60)
    print("数字人系统配置验证工具")
    print("="*60)
    print("\n开始验证...\n")
    
    results = {
        "system.conf": validate_system_conf(),
        "config.json": validate_config_json(),
        "目录结构": check_directories(),
        "必需文件": check_files()
    }
    
    return print_summary(results)

if __name__ == '__main__':
    sys.exit(main())
