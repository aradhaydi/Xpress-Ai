document.addEventListener("DOMContentLoaded", function () {
    const sendBtn = document.getElementById("send-btn");
    const userInput = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");
    const newChatBtn = document.getElementById("new-chat");

    const menuBtn = document.getElementById("menu-btn");
    const sidebar = document.getElementById("sidebar");
    const closeSidebar = document.getElementById("close-sidebar");

    // ✅ Get API key from Vercel environment
    async function getAPIKey() {
        const response = await fetch("/api/get-key");
        const data = await response.json();
        return data.apiKey;
    }

    // ✅ Send user message and get AI response
    async function sendMessage() {
        let message = userInput.value.trim();
        if (message === "") return;

        addMessage("You", message, "user-message");

        userInput.value = "";
        userInput.disabled = true;

        let botReply = await getBotResponse(message);
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
    function addMessage(sender, text, className) {
        const messageElement = document.createElement("div");
        messageElement.classList.add(className);
        messageElement.innerHTML = `<strong>${sender}:</strong><br>${text}`;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // ✅ Format AI response (bold, spacing, paragraphs)
    function formatAIResponse(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **bold**
            .replace(/\n/g, "<br>"); // Line breaks
    }

    // ✅ Handle Send Button & Enter Key
    sendBtn.addEventListener("click", sendMessage);
    userInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendMessage();
    });

    // ✅ Clear Chat on New Chat Click
    newChatBtn.addEventListener("click", function () {
        chatBox.innerHTML = "";
    });

    // ✅ Hamburger Menu Controls
    menuBtn.addEventListener("click", function () {
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
