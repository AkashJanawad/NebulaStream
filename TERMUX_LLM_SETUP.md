# Termux LLM Setup Guide (0.5B Model)

Follow these steps to run a small, fast LLM on your mobile and connect it to NebulaStream.

## 1. Install & Prepare Termux
1. Download **Termux** from F-Droid (not Play Store).
2. Open Termux and run:
   ```bash
   pkg update && pkg upgrade
   pkg install python clang binutils git wget
   ```

## 2. Install LLM Server Dependencies
We will use a simple Python server to handle requests.
```bash
pip install flask flask-cors transformers torch
```
*Note: If `torch` fails to install, you may need to install `libjpeg-turbo` and `freetype` first: `pkg install libjpeg-turbo freetype`.*

## 3. Create the LLM Server Script
Create a file named `llm_server.py` in Termux:
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# Load a very small 0.5B model (Qwen2-0.5B-Instruct)
print("Loading Nebula AI (Qwen2-0.5B)...")
pipe = pipeline("text-generation", model="Qwen/Qwen2-0.5B-Instruct", torch_dtype="auto", device_map="auto")

@app.route('/')
def home():
    return "Nebula AI Server is Online!"

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_msg = data.get('message', '')
    
    messages = [
        {"role": "system", "content": "You are Nebula AI, a helpful movie recommendation assistant for the NebulaStream platform. Keep responses concise and friendly."},
        {"role": "user", "content": user_msg},
    ]
    
    prompt = pipe.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    outputs = pipe(prompt, max_new_tokens=256, do_sample=True, temperature=0.7, top_k=50, top_p=0.95)
    
    response = outputs[0]["generated_text"].split("<|im_start|>assistant\n")[-1].strip()
    return jsonify({"reply": response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## 4. Set up Ngrok
1. Sign up at [ngrok.com](https://ngrok.com) and get your Auth Token.
2. In Termux:
   ```bash
   pkg install wget
   wget https://bin.equinox.io/c/b34edq6ZiUR/ngrok-v3-stable-linux-arm64.tgz
   tar -xvzf ngrok-v3-stable-linux-arm64.tgz
   ./ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

## 5. Run Everything
1. **Start the LLM Server:**
   ```bash
   python llm_server.py
   ```
2. **Open a new Termux session (swipe from left and click "New Session") and start Ngrok:**
   ```bash
   ./ngrok http 5000
   ```
3. Copy the **Forwarding URL** (e.g., `https://xxxx-xxx.ngrok-free.app`).

## 6. Update NebulaStream Website
1. Open `public/config.json` in your NebulaStream project.
2. Replace `YOUR_NGROK_URL` with your actual ngrok URL.
   ```json
   {
       "llmUrl": "https://xxxx-xxx.ngrok-free.app/chat"
   }
   ```
3. Refresh your website. The chatbot dot should turn **Green**!

---
**Tip:** If Termux is slow, make sure to disable "Battery Optimization" for Termux in your Android settings.
