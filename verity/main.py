import tkinter as tk
from tkinter import ttk, scrolledtext
import threading
import requests
import time
import ctypes
import configparser
import os
from flask import Flask, request, jsonify

# ================= Windows缩放适配 =================
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(1)
except:
    pass
# ==================================================

class ConfigWindow:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("API转发配置 -适用于 Verity JE Mod")
        # 稍微增加宽度以容纳新按钮
        self.window.geometry("620x580") 
        
        self.providers = {
            "智谱": {
                "base_url": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
                "default_model": "glm-5.2"
            },
            "DeepSeek": {
                "base_url": "https://api.deepseek.com/v1/chat/completions",
                "default_model": "deepseek-v4-flash"
            },
            "豆包": {
                "base_url": "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
                "default_model": "doubao-pro-4k"
            },
            "MiniMax": {
                "base_url": "https://api.minimax.chat/v1/text/completion_v2",
                "default_model": "abab6.5-chat"
            },
            "Kimi": {
                "base_url": "https://api.moonshot.cn/v1/chat/completions",
                "default_model": "moonshot-v1-8k"
            },
            "通义千问": {
                "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
                "default_model": "qwen-turbo"
            }
        }
        
        self.server_thread = None
        self.server_running = False
        self.flask_app = None
        
        # 配置文件路径 (生成在当前目录下)
        self.config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.ini")
        
        self.setup_ui()
        self.load_config() # 程序启动时加载配置
        
    def setup_ui(self):
        # 提供商选择
        tk.Label(self.window, text="提供商:", font=("Microsoft YaHei UI", 10)).grid(row=0, column=0, padx=10, pady=10, sticky="w")
        self.provider_combo = ttk.Combobox(self.window, values=list(self.providers.keys()), state="readonly", width=30, font=("Microsoft YaHei UI", 10))
        self.provider_combo.set("通义千问")
        self.provider_combo.grid(row=0, column=1, padx=10, pady=10, columnspan=2)
        self.provider_combo.bind("<<ComboboxSelected>>", self.on_provider_change)
        
        # 模型名称输入
        tk.Label(self.window, text="模型名称:", font=("Microsoft YaHei UI", 10)).grid(row=1, column=0, padx=10, pady=10, sticky="w")
        self.model_entry = tk.Entry(self.window, width=35, font=("Microsoft YaHei UI", 10))
        self.model_entry.insert(0, "qwen-turbo")
        self.model_entry.grid(row=1, column=1, padx=10, pady=10, columnspan=2)
        
        # 密钥输入
        tk.Label(self.window, text="API密钥:", font=("Microsoft YaHei UI", 10)).grid(row=2, column=0, padx=10, pady=10, sticky="w")
        self.key_entry = tk.Entry(self.window, width=25, show="*", font=("Microsoft YaHei UI", 10)) # 调整宽度为按钮腾出空间
        self.key_entry.grid(row=2, column=1, padx=10, pady=10, sticky="w")
        
        # 显示/隐藏密钥按钮
        self.toggle_key_btn = tk.Button(self.window, text="显示", width=8, command=self.toggle_key_visibility)
        self.toggle_key_btn.grid(row=2, column=2, padx=5, pady=10, sticky="w")
        
        # 按钮区域 Frame
        btn_frame = tk.Frame(self.window)
        btn_frame.grid(row=3, column=0, columnspan=3, pady=15)
        
        # 开始运行按钮 (放在右侧)
        self.start_btn = tk.Button(btn_frame, text="开始运行", command=self.start_server, width=12, bg="#4CAF50", fg="white", font=("Microsoft YaHei UI", 10, "bold"))
        self.start_btn.pack(side=tk.LEFT, padx=10)
        
        # 信息显示区域
        self.info_text = scrolledtext.ScrolledText(self.window, width=65, height=18, wrap=tk.WORD, font=("Consolas", 10))
        self.info_text.grid(row=4, column=0, columnspan=3, padx=10, pady=10)
        self.info_text.insert(tk.END, "欢迎使用API转发配置工具\n")
        self.info_text.insert(tk.END, "已启用: 自动去除思考过程\n")
        self.info_text.insert(tk.END, f"配置文件路径: {self.config_file}\n")
        self.info_text.insert(tk.END, "="*50 + "\n")

    def toggle_key_visibility(self):
        """切换密钥显示状态"""
        if self.key_entry.cget('show') == '*':
            self.key_entry.config(show='')
            self.toggle_key_btn.config(text="隐藏")
        else:
            self.key_entry.config(show='*')
            self.toggle_key_btn.config(text="显示")

    def load_config(self):
        """从配置文件读取设置"""
        config = configparser.ConfigParser()
        if os.path.exists(self.config_file):
            try:
                config.read(self.config_file, encoding='utf-8')
                if 'Settings' in config:
                    provider = config['Settings'].get('provider', '智谱')
                    api_key = config['Settings'].get('api_key', '')
                    model = config['Settings'].get('model', '')
                    
                    # 回填界面
                    if provider in self.providers:
                        self.provider_combo.set(provider)
                    
                    self.key_entry.delete(0, tk.END)
                    self.key_entry.insert(0, api_key)
                    
                    if model:
                        self.model_entry.delete(0, tk.END)
                        self.model_entry.insert(0, model)
                    else:
                        self.on_provider_change(None) # 触发默认模型填充
                        
                self.log_info("✔ 已加载配置文件")
            except Exception as e:
                self.log_info(f"⚠ 读取配置失败: {e}")
        else:
            self.log_info("⚠ 未找到配置文件，将使用默认设置")

    def save_config(self):
        """保存当前设置到配置文件"""
        config = configparser.ConfigParser()
        config['Settings'] = {
            'provider': self.provider_combo.get(),
            'api_key': self.key_entry.get().strip(),
            'model': self.model_entry.get().strip()
        }
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                config.write(f)
            self.log_info("💾 配置已保存到 config.ini")
        except Exception as e:
            self.log_info(f"⚠ 保存配置失败: {e}")
        
    def on_provider_change(self, event):
        provider = self.provider_combo.get()
        default_model = self.providers[provider]["default_model"]
        self.model_entry.delete(0, tk.END)
        self.model_entry.insert(0, default_model)
        
    def log_info(self, message):
        self.info_text.insert(tk.END, message + "\n")
        self.info_text.see(tk.END)
        
    def create_flask_app(self):
        provider = self.provider_combo.get()
        API_KEY = self.key_entry.get().strip()
        MODEL = self.model_entry.get().strip()
        BASE_URL = self.providers[provider]["base_url"]
        
        app = Flask(__name__)
        
        @app.route(rule="/chat/completions", methods=['POST'])
        def chat():
            data = request.get_json()
            data["model"] = MODEL
            
            # ========================================
            # 核心修改：自动关闭思考模式
            # ========================================
            if "enable_thinking" in data:
                del data["enable_thinking"] # 移除用户可能传入的设置
            data["enable_thinking"] = False # 强制关闭思考
            
            headers = {"Authorization": f"Bearer {API_KEY}"}
            
            try:
                response = requests.post(BASE_URL, json=data, headers=headers, timeout=60)
                response.raise_for_status()
                result = response.json()
                
                if "choices" in result and len(result["choices"]) > 0:
                    # 清洗响应数据，去除思考过程
                    if "reasoning_content" in result["choices"][0]["message"]:
                        del result["choices"][0]["message"]["reasoning_content"]
                    
                    content = result["choices"][0]["message"]["content"]
                    
                    # 清洗 token 统计
                    if "usage" in result:
                        if "reasoning_tokens" in result["usage"]:
                            del result["usage"]["reasoning_tokens"]
                    
                    return jsonify({
                        "id": result.get("id", "chatcmpl-verity"),
                        "object": "chat.completion",
                        "created": int(time.time()*1000),
                        "model": MODEL,
                        "choices": [{
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": content
                            },
                            "finish_reason": "stop"
                        }],
                        "usage": result.get("usage", {
                            "prompt_tokens": 10,
                            "completion_tokens": 20,
                            "total_tokens": 30
                        })
                    })
                else:
                    return jsonify({"error": "Invalid response from API"}), 500
                    
            except requests.exceptions.RequestException as e:
                self.log_info(f"❌ API请求错误: {str(e)}")
                return jsonify({"error": str(e)}), 500
            except Exception as e:
                self.log_info(f"❌ 未知错误: {str(e)}")
                return jsonify({"error": str(e)}), 500
        
        return app
        
    def run_flask(self):
        try:
            self.log_info(f"🌐 本地地址: http://127.0.0.1:5000/chat/completions")
            self.log_info("="*50)
            self.flask_app = self.create_flask_app()
            self.flask_app.run(debug=False, port=5000, host="127.0.0.1", threaded=True)
        except Exception as e:
            self.log_info(f"❌ 服务器错误: {str(e)}")
            self.server_running = False
            self.start_btn.config(text="开始运行", bg="#4CAF50")
            
    def start_server(self):
        if not self.server_running:
            # 验证输入
            if not self.key_entry.get().strip():
                self.log_info("❌ 请输入API密钥")
                return
            if not self.model_entry.get().strip():
                self.log_info("❌ 请输入模型名称")
                return
            
            # 保存配置到本地文件
            self.save_config()
            
            self.server_running = True
            self.start_btn.config(text="停止运行", bg="#f44336")
            
            # 在新线程中运行Flask
            self.server_thread = threading.Thread(target=self.run_flask, daemon=True)
            self.server_thread.start()
            
            self.log_info("\n" + "="*50)
            self.log_info("✅ 服务器已启动!")
            self.log_info("📋 请将以下地址复制到Verity配置:")
            self.log_info("http://127.0.0.1:5000/chat/completions")
            self.log_info("="*50 + "\n")
        else:
            self.server_running = False
            self.start_btn.config(text="开始运行", bg="#4CAF50")
            self.log_info("⏹ 服务器已停止")
            
    def run(self):
        self.window.mainloop()

if __name__ == "__main__":
    app = ConfigWindow()
    app.run()
