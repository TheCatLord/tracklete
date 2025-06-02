(function () {
    const BASE_URL = 'https://llm.leibmann.org';
    const DUCK_API = 'https://api.duckduckgo.com/';
    const MODEL_NAME = 'mistral:latest';
    const BASE_SYSTEM_PROMPT = `You are a helpful assistant specialized in providing precise and concise answers.`;

    const messagesEl = document.getElementById('messages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

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
        prompt += `\nUser: ${userText}\nAssistant:`;

        const payload = {
            model: MODEL_NAME,
            prompt: prompt,
            stream: false
        };

        const requestUrl = BASE_URL + "/api/generate";

        console.log("Request URL:", requestUrl);
        console.log("Request Payload:", JSON.stringify(payload, null, 2));

        try {
            const res = await fetch(requestUrl, {
                method: 'POST',
                // Note: 'no-cors' prevents you from reading the response, so use 'cors' instead if possible
                mode: 'cors',
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
        } catch (err) {
            console.error("Fetch Error:", err);
            throw err;
        }
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

})();