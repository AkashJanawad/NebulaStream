document.addEventListener('DOMContentLoaded', async () => {
    // Create Chatbot UI Elements
    const chatbotHTML = `
        <div id="chatbot-container">
            <div id="chat-window">
                <div id="chat-header">
                    <h3>Nebula AI</h3>
                    <div id="chat-status">
                        <span class="status-dot"></span>
                        <span id="status-text">Connecting...</span>
                    </div>
                </div>
                <div id="chat-messages"></div>
                <div id="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Ask for a movie recommendation..." autocomplete="off">
                    <button id="send-btn">
                        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                    </button>
                </div>
            </div>
            <div id="chatbot-toggle">
                <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    const toggle = document.getElementById('chatbot-toggle');
    const window = document.getElementById('chat-window');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const messages = document.getElementById('chat-messages');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');

    let llmUrl = '';
    let isOnline = false;

    // Load Config
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        llmUrl = config.llmUrl;
        checkConnection();
    } catch (e) {
        console.error('Failed to load chatbot config', e);
        updateStatus(false);
    }

    // Toggle Chat
    toggle.addEventListener('click', () => {
        window.classList.toggle('active');
        if (window.classList.contains('active')) {
            input.focus();
            if (messages.children.length === 0) {
                addMessage('Hello! I am your Nebula AI assistant. Looking for a movie recommendation?', 'bot');
            }
        }
    });

    // Check Connection
    async function checkConnection() {
        if (!llmUrl) return;
        try {
            // Simple ping to the ngrok URL (assuming the LLM server has a /health or similar, 
            // otherwise just try to fetch and see if it fails or hits a 404)
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 3000);
            await fetch(llmUrl.replace('/chat', '/'), { method: 'GET', signal: controller.signal, mode: 'no-cors' });
            updateStatus(true);
        } catch (e) {
            updateStatus(false);
            setTimeout(checkConnection, 10000); // Retry every 10s
        }
    }

    function updateStatus(online) {
        isOnline = online;
        if (online) {
            statusDot.classList.add('online');
            statusText.innerText = 'Online';
        } else {
            statusDot.classList.remove('online');
            statusText.innerText = 'Offline';
        }
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        msgDiv.innerText = text;
        messages.appendChild(msgDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing message bot-message';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        messages.appendChild(typingDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        input.value = '';

        if (!isOnline) {
            addMessage("I'm currently offline. Please make sure the mobile LLM is running and ngrok is active. I'll try to reconnect automatically.", 'bot');
            checkConnection();
            return;
        }

        showTyping();

        try {
            const response = await fetch(llmUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            hideTyping();
            addMessage(data.reply || "Sorry, I couldn't process that.", 'bot');
        } catch (e) {
            hideTyping();
            addMessage("Connection lost. Trying to reconnect...", 'bot');
            updateStatus(false);
            checkConnection();
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});
