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