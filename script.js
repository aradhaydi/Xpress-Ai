document.addEventListener("DOMContentLoaded", function () {
    const sendBtn = document.getElementById("send-btn");
    const userInput = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");
    const newChatBtn = document.getElementById("new-chat");
    const historyList = document.getElementById("history-list");
    
    let currentChatId = Date.now().toString();
    let chats = JSON.parse(localStorage.getItem('chats') || '{}');

    const menuBtn = document.getElementById("menu-btn");
    const sidebar = document.getElementById("sidebar");
    const closeSidebar = document.getElementById("close-sidebar");

    // ✅ Get API key from Vercel environment
    async function getAPIKey() {
    try {
        const response = await fetch("/api/get-key");
        if (!response.ok) throw new Error("Failed to fetch API key");
        const data = await response.json();
        return data.apiKey;
    } catch (error) {
        console.error("Error fetching API key:", error);
        return null; // Return null if fetching fails
    }
    }
     // ✅ Send user message and get AI response
    async function sendMessage() {
        let message = userInput.value.trim();
        if (message === "") return;

        addMessage("You", message, "user-message");
        userInput.value = "";
        userInput.disabled = true;

        // Add loading animation
        const loadingBubble = document.createElement("div");
        loadingBubble.className = "loading-bubble";
        loadingBubble.innerHTML = `
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
        `;
        chatBox.appendChild(loadingBubble);
        chatBox.scrollTop = chatBox.scrollHeight;

        let botReply = await getBotResponse(message);
        chatBox.removeChild(loadingBubble);
        addMessage("AI", botReply, "bot-message");

        userInput.disabled = false;
    }

    // ✅ Fetch AI response from Gemini API
    async function getBotResponse(userMessage) {
        try {
            const apiKey = await getAPIKey();
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: userMessage }] }] })
            });

            const data = await response.json();
            return formatAIResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't understand.");
        } catch (error) {
            console.error("API Error:", error);
            return "Error: Unable to connect to AI.";
        }
    }

    // ✅ Add message to chat
    function addMessage(sender, text, className, save = true) {
        const messageElement = document.createElement("div");
        messageElement.classList.add(className);
        messageElement.innerHTML = `<strong>${sender}:</strong><br>${text}`;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        if (save) {
            if (!chats[currentChatId]) {
                chats[currentChatId] = {
                    title: text.slice(0, 30) + "...",
                    messages: []
                };
                updateHistoryList();
            }
            chats[currentChatId].messages.push({sender, text, className});
            localStorage.setItem('chats', JSON.stringify(chats));
        }
    }

    function updateHistoryList() {
        historyList.innerHTML = '';
        Object.entries(chats).forEach(([id, chat]) => {
            const li = document.createElement('li');
            li.innerHTML = `<button class="history-item">${chat.title}</button>`;
            li.querySelector('button').addEventListener('click', () => loadChat(id));
            historyList.appendChild(li);
        });
    }

    function loadChat(chatId) {
        currentChatId = chatId;
        chatBox.innerHTML = '';
        chats[chatId].messages.forEach(msg => {
            addMessage(msg.sender, msg.text, msg.className, false);
        });
        document.getElementById('sidebar').classList.remove('sidebar-open');
    }

    // ✅ Format AI response (bold, spacing, paragraphs)
    function formatAIResponse(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold text
            .replace(/^[-*]\s(.+)$/gm, "<li>$1</li>") // Bullet points
            .replace(/(?:^|\n)([^\n]+)\n/g, "<p>$1</p>") // Paragraphs
            .replace(/`([^`]+)`/g, "<code>$1</code>") // Inline code
            .replace(/```([^```]+)```/g, "<pre><code>$1</code></pre>") // Code blocks
            .replace(/>(.*?)(\n|$)/g, "<blockquote>$1</blockquote>") // Blockquotes
            .replace(/<li>.*?<\/li>/gs, match => `<ul>${match}</ul>`); // Wrap lists
    }

    // ✅ Handle Send Button & Enter Key
    sendBtn.addEventListener("click", sendMessage);
    userInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendMessage();
    });

    // ✅ Clear Chat on New Chat Click
    newChatBtn.addEventListener("click", function () {
        chatBox.innerHTML = "";
        currentChatId = Date.now().toString();
        document.getElementById('sidebar').classList.remove('sidebar-open');
    });

    function showChatHistory() {
        const historySection = document.createElement('div');
        historySection.id = 'history-section';
        historySection.innerHTML = `
            <h2>Chat History</h2>
            <div class="history-list">
                ${Object.entries(chats).map(([id, chat]) => `
                    <button class="history-item" data-chat-id="${id}">
                        ${chat.title}
                    </button>
                `).join('')}
            </div>
        `;
        
        sidebar.querySelector('ul').style.display = 'none';
        sidebar.appendChild(historySection);
        
        historySection.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                loadChat(item.dataset.chatId);
                closeSidebarMenu();
            });
        });
        
        const backBtn = document.createElement('button');
        backBtn.id = 'back-to-menu';
        backBtn.innerHTML = '← Back to Menu';
        backBtn.onclick = () => {
            historySection.remove();
            sidebar.querySelector('ul').style.display = 'block';
        };
        historySection.insertBefore(backBtn, historySection.firstChild);
    }

    function closeSidebarMenu() {
        sidebar.classList.remove("sidebar-open");
        const historySection = document.getElementById('history-section');
        if (historySection) {
            historySection.remove();
            sidebar.querySelector('ul').style.display = 'block';
        }
        setTimeout(() => {
            sidebar.style.visibility = "hidden";
            sidebar.style.opacity = "0";
        }, 300);
    }

    // Add click handler for history button
    document.getElementById('history-btn').addEventListener('click', showChatHistory);

    // ✅ Hamburger Menu Controls
    menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        sidebar.classList.add("sidebar-open");
        sidebar.style.visibility = "visible";
        sidebar.style.opacity = "1";
    });

    closeSidebar.addEventListener("click", function () {
        sidebar.classList.remove("sidebar-open");
        setTimeout(() => {
            sidebar.style.visibility = "hidden";
            sidebar.style.opacity = "0";
        }, 300);
    });

    document.addEventListener("click", function (event) {
        if (!sidebar.contains(event.target) && event.target !== menuBtn) {
            sidebar.classList.remove("sidebar-open");
            setTimeout(() => {
                sidebar.style.visibility = "hidden";
                sidebar.style.opacity = "0";
            }, 300);
        }
    });
});
