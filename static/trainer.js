
const BASE_URL = 'https://llm.leibmann.org';
const DUCK_API = 'https://api.duckduckgo.com/';
const MODEL_NAME = 'mistral:latest';
const BASE_SYSTEM_PROMPT = `You are a personal trainer tailored to answer all questions track and field, sport, recovery, or nutrition related. Please give in depth but not overly long answers; keep it concise and readable. Refuse to answer anything that is clearly unrelated.`;

const messagesEl = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Send initial message on page load
window.addEventListener('DOMContentLoaded', () => {
    appendMessage("Hi, I am your personal AI assistant. Feel free to ask me any question about track and field, sports, recovery, nutrition, or anything else!", "bot");
});

// appends a message to the element
function appendMessage(text, className) {
    const msg = document.createElement('div');
    msg.classList.add('message', className);
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
}

// Fetch DuckDuckGo Instant Answer API
async function fetchSearchContext(query) {
    const url = `${DUCK_API}?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1`;
    const res = await fetch(url);
    if (!res.ok) return '';
    const data = await res.json();
    let context = '';
    if (data.AbstractText) {
        context += `Abstract: ${data.AbstractText}\n`;
    }
    if (data.RelatedTopics && data.RelatedTopics.length) {
        context += `Search Results:\n`;
        data.RelatedTopics.slice(0, 3).forEach(topic => {
            if (topic.Text && topic.FirstURL) {
                context += `- ${topic.Text} (${topic.FirstURL})\n`;
            }
        });
    }
    return context;
}

async function getBotResponse(userText) {
    const searchContext = await fetchSearchContext(userText);
    let prompt = BASE_SYSTEM_PROMPT;
    if (searchContext) {
        prompt += `\nSearch Context:\n${searchContext}`;
    }
    prompt += `\nUser: ${userText}`;

    const payload = {
        model: MODEL_NAME,
        prompt: prompt,
        stream: false
    };

    const requestUrl = BASE_URL + "/api/generate";

    console.log("Request URL:", requestUrl);
    console.log("Request Payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    console.log("Response Status:", res.status);

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error Response Body: ${errorText}`);
        throw new Error(`Ollama error ${res.status}: ${errorText}`);
    }

    const json = await res.json();
    console.log("Response JSON:", JSON.stringify(json, null, 2));

    return json.response
}


sendBtn.addEventListener('click', async () => {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    userInput.value = '';
    const typingMsg = appendMessage('Typing...', 'bot');

    try {
        const reply = await getBotResponse(text);
        messagesEl.removeChild(typingMsg);
        appendMessage(reply, 'bot');
    } catch (err) {
        messagesEl.removeChild(typingMsg);
        appendMessage('Error fetching response', 'bot');
        console.error(err);
    }
});

userInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});
