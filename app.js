document.addEventListener('DOMContentLoaded', () => {
    // --- Data Models ---
    let users = [
        { id: 1, name: 'Luna', avatar: 'https://i.pravatar.cc/150?u=luna', isFriend: true, partnerId: null },
        { id: 2, name: 'Mateo', avatar: 'https://i.pravatar.cc/150?u=mateo', isFriend: true, partnerId: 5 },
        { id: 3, name: 'Sofía', avatar: 'https://i.pravatar.cc/150?u=sofia', isFriend: false, partnerId: null },
        { id: 4, name: 'Leo', avatar: 'https://i.pravatar.cc/150?u=leo', isFriend: true, partnerId: null },
        { id: 5, name: 'Valeria', avatar: 'https://i.pravatar.cc/150?u=valeria', isFriend: true, partnerId: 2 },
    ];

    let coupleRequests = [
        { fromId: 4, toId: 1, message: "¡Hola Luna! Llevamos un tiempo siendo amigos y me gustaría que fuéramos pareja. ¿Qué dices? :)", status: 'pending' }
    ];

    let conversations = [
        { userId: 2, lastMessage: "¡Claro! ¿A qué hora nos vemos?", timestamp: "18:32", unreadCount: 0, isTyping: false },
        { userId: 4, lastMessage: "Recibiste una solicitud de pareja.", timestamp: "Ayer", unreadCount: 1, isTyping: false },
        { userId: 5, lastMessage: "Jajaja, qué gracioso.", timestamp: "1/3/2025", unreadCount: 3, isTyping: true },
    ];

    // Simulating a database of messages for all conversations
    let messages = {
        // Conversation with Mateo (userId: 2)
        2: [
            { id: 1, senderId: 2, text: "¿Has visto la nueva película de la que todos hablan?", timestamp: "18:25", status: "seen", repliedToId: null },
            { id: 2, senderId: 1, text: "¡Sí! La vi anoche. ¡Estuvo increíble!", timestamp: "18:28", status: "seen", repliedToId: 1 },
            { id: 3, senderId: 1, text: "La cinematografía era espectacular.", timestamp: "18:28", status: "delivered", repliedToId: null },
            { id: 4, senderId: 2, text: "Totalmente de acuerdo. Necesitamos ir a ver otra pronto.", timestamp: "18:30", status: "seen", repliedToId: null },
            { id: 5, senderId: 1, text: "¡Claro! ¿A qué hora nos vemos?", timestamp: "18:32", status: "sent", repliedToId: null },
        ]
    };

    // Represents the current logged-in user.
    const currentUser = { id: 1 };

    const userListContainer = document.querySelector('.user-list');
    const bubbleNavBar = document.getElementById('bubble-nav-bar');
    const individualChatScreen = document.getElementById('individual-chat-screen');
    const backToChatListButton = document.getElementById('back-to-chat-list');
    const conversationListContainer = document.getElementById('conversation-list');

    // --- State Management ---
    let currentOpenChatUserId = null;

    function getUser(id) {
        return users.find(u => u.id === id);
    }

    function amICoupled() {
        return !!getUser(currentUser.id)?.partnerId;
    }

    function getCoupleStatus(userId) {
        const sentRequest = coupleRequests.find(r => r.fromId === currentUser.id && r.toId === userId && r.status === 'pending');
        if (sentRequest) return 'pending_sent';

        const receivedRequest = coupleRequests.find(r => r.fromId === userId && r.toId === currentUser.id && r.status === 'pending');
        if (receivedRequest) return 'pending_received';

        return null;
    }

    // --- Rendering ---
    function render() {
        renderUsers();
        renderChat();
    }

    function renderUsers() {
        userListContainer.innerHTML = '';
        const renderedUserIds = new Set();
        users.forEach(user => {
            if (renderedUserIds.has(user.id) || user.id === currentUser.id) return;

            if (user.partnerId) {
                const partner = getUser(user.partnerId);
                if (partner && !renderedUserIds.has(partner.id)) {
                    renderCoupleCard(user, partner);
                    renderedUserIds.add(user.id);
                    renderedUserIds.add(partner.id);
                }
            } else {
                renderSingleUserCard(user);
                renderedUserIds.add(user.id);
            }
        });
    }

    function renderSingleUserCard(user) {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <img src="${user.avatar}" alt="${user.name}" class="avatar">
            <div class="user-info">
                <h3>${user.name}</h3>
            </div>
            <div class="button-group">
                ${createFriendButton(user)}
                ${createCoupleButton(user)}
            </div>
        `;
        userListContainer.appendChild(userCard);
    }

    function renderCoupleCard(user1, user2) {
        const coupleCard = document.createElement('div');
        coupleCard.className = 'couple-card';
        coupleCard.innerHTML = `
            <div class="couple-avatars">
                <img src="${user1.avatar}" alt="${user1.name}" class="avatar">
                <div class="heart-animation">❤️</div>
                <img src="${user2.avatar}" alt="${user2.name}" class="avatar">
            </div>
            <div class="couple-info">
                <h3>${user1.name} & ${user2.name}</h3>
            </div>
        `;
        userListContainer.appendChild(coupleCard);
    }

    function createFriendButton(user) {
        const icon = user.isFriend ? 'checkmark-outline' : 'add-outline';
        return `<button class="action-button friend-button ${user.isFriend ? 'friends' : ''}" data-user-id="${user.id}" data-action="friend">
                    <ion-icon name="${icon}"></ion-icon>
                </button>`;
    }

    function createCoupleButton(user) {
        if (!user.isFriend || amICoupled() || user.partnerId) {
            return '';
        }

        const coupleStatus = getCoupleStatus(user.id);
        let icon = 'heart-outline';
        let statusClass = '';

        if (coupleStatus === 'pending_sent') {
            icon = 'time-outline';
            statusClass = 'pending';
        } else if (coupleStatus === 'pending_received') {
            // This button won't be used for accepting anymore, but we can show it
            icon = 'heart';
            statusClass = 'request-received';
        }

        return `<button class="action-button couple-button ${statusClass}" data-user-id="${user.id}" data-action="couple">
                    <ion-icon name="${icon}"></ion-icon>
                </button>`;
    }

    function renderMessages(userId) {
        const messageListContainer = document.getElementById('message-list');
        const user = getUser(userId);
        if (!messageListContainer || !user) return;

        // Update header
        document.getElementById('chat-header-avatar').src = user.avatar;
        document.getElementById('chat-header-name').textContent = user.name;

        messageListContainer.innerHTML = '';
        const chatMessages = messages[userId] || [];

        chatMessages.forEach(msg => {
            const messageBubble = document.createElement('div');
            const isSent = msg.senderId === currentUser.id;
            messageBubble.className = `message-bubble ${isSent ? 'sent' : 'received'}`;

            let repliedMessageHTML = '';
            if (msg.repliedToId) {
                const originalMsg = chatMessages.find(m => m.id === msg.repliedToId);
                if (originalMsg) {
                    const originalSenderName = originalMsg.senderId === currentUser.id ? 'Tú' : getUser(originalMsg.senderId).name;
                    repliedMessageHTML = `
                        <div class="reply-preview">
                            <strong>${originalSenderName}</strong>
                            <p>${originalMsg.text}</p>
                        </div>
                    `;
                }
            }

            messageBubble.innerHTML = `
                ${repliedMessageHTML}
                <p class="message-text">${msg.text}</p>
                <div class="message-meta">
                    <span class="timestamp">${msg.timestamp}</span>
                    ${isSent ? renderStatusIcon(msg.status) : ''}
                </div>
            `;
            messageListContainer.appendChild(messageBubble);
        });

        // Scroll to the bottom
        messageListContainer.scrollTop = messageListContainer.scrollHeight;
    }

    function renderStatusIcon(status) {
        let iconName = 'checkmark-outline'; // sent
        let className = 'status-icon';
        if (status === 'delivered') {
            iconName = 'checkmark-done-outline';
        } else if (status === 'seen') {
            iconName = 'checkmark-done-outline';
            className += ' seen';
        }
        return `<ion-icon name="${iconName}" class="${className}"></ion-icon>`;
    }

    function renderChat() {
        if (!conversationListContainer) return;

        conversationListContainer.innerHTML = '';

        conversations.forEach(conv => {
            const user = getUser(conv.userId);
            if (!user) return;

            const conversationItem = document.createElement('div');
            conversationItem.className = 'conversation-item';
            conversationItem.dataset.userId = conv.userId;

            if (conv.unreadCount > 0) {
                conversationItem.classList.add('unread');
            }

            const lastMessageOrTyping = conv.isTyping
                ? `<p class="typing-indicator">Escribiendo...</p>`
                : `<p>${conv.lastMessage}</p>`;

            conversationItem.innerHTML = `
                <img src="${user.avatar}" alt="${user.name}" class="avatar">
                <div class="conversation-details">
                    <h3>${user.name}</h3>
                    ${lastMessageOrTyping}
                </div>
                <div class="conversation-meta">
                    <span class="timestamp">${conv.timestamp}</span>
                    ${conv.unreadCount > 0 ? `<span class="unread-count">${conv.unreadCount}</span>` : ''}
                </div>
            `;

            conversationListContainer.appendChild(conversationItem);
        });
    }


    // --- Navigation Logic ---

    function openChat(userId) {
        currentOpenChatUserId = userId;

        // Hide main screens and nav bar
        document.querySelectorAll('.screen.active').forEach(s => s.classList.remove('active'));
        bubbleNavBar.style.display = 'none';

        // Show individual chat screen
        individualChatScreen.classList.add('active');

        renderMessages(userId);
    }

    function closeChat() {
        currentOpenChatUserId = null;

        // Hide individual chat screen
        individualChatScreen.classList.remove('active');

        // Show chat list screen and nav bar
        document.getElementById('chat-screen').classList.add('active');
        bubbleNavBar.style.display = 'flex';
    }


    // --- Event Listeners ---
    conversationListContainer.addEventListener('click', (event) => {
        const conversationItem = event.target.closest('.conversation-item');
        if (conversationItem) {
            const userId = parseInt(conversationItem.dataset.userId, 10);
            openChat(userId);
        }
    });

    backToChatListButton.addEventListener('click', closeChat);

    userListContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.action-button');
        if (!button) return;

        const userId = parseInt(button.dataset.userId, 10);
        const action = button.dataset.action;
        const user = getUser(userId);

        if (!user) return;

        if (action === 'friend') {
            handleFriendAction(user);
        } else if (action === 'couple') {
            handleCoupleAction(user);
        }
    });

    function handleFriendAction(user) {
        if (user.isFriend) {
            if (user.partnerId) {
                alert("No puedes eliminar a tu pareja de tus amigos.");
                return;
            }
            if (confirm(`¿Seguro que quieres eliminar a ${user.name} de tus amigos?`)) {
                user.isFriend = false;
                // Cancel any pending requests between them
                coupleRequests = coupleRequests.filter(r =>
                    !(r.fromId === user.id && r.toId === currentUser.id) &&
                    !(r.fromId === currentUser.id && r.toId === user.id)
                );
            }
        } else {
            user.isFriend = true;
        }
        render();
    }

    function handleCoupleAction(user) {
        const coupleStatus = getCoupleStatus(user.id);
        if (coupleStatus === null) {
            showCoupleRequestPanel(user);
        } else if (coupleStatus === 'pending_received') {
             // Guide the user to the chat screen and switch automatically
            alert(`Tienes una solicitud de ${user.name}. ¡Revisa tu pantalla de Chat para responder!`);
            document.querySelector('.nav-item[data-screen="chat-screen"]').click();
        }
    }

    // --- Couple Request Panel Logic ---
    const coupleRequestPanel = document.getElementById('couple-request-panel');
    const sendRequestButton = document.getElementById('send-couple-request');
    const cancelRequestButton = document.getElementById('cancel-couple-request');
    const requestMessageTextarea = document.getElementById('couple-request-message');
    let targetUserForRequest = null;

    function showCoupleRequestPanel(user) {
        targetUserForRequest = user;
        requestMessageTextarea.value = '';
        coupleRequestPanel.style.display = 'flex';
    }

    function hideCoupleRequestPanel() {
        coupleRequestPanel.style.display = 'none';
        targetUserForRequest = null;
    }

    cancelRequestButton.addEventListener('click', hideCoupleRequestPanel);

    sendRequestButton.addEventListener('click', () => {
        if (targetUserForRequest) {
            const modalContent = coupleRequestPanel.querySelector('.modal-content');
            modalContent.classList.add('sending');

            setTimeout(() => {
                const message = requestMessageTextarea.value;
                coupleRequests.push({ fromId: currentUser.id, toId: targetUserForRequest.id, message, status: 'pending' });

                hideCoupleRequestPanel();
                modalContent.classList.remove('sending');
                render();
            }, 800);
        }
    });

    // Navigation Menu
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');

    navItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            screens.forEach(s => s.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(item.dataset.screen).classList.add('active');
        });
    });

    // --- Initial Load ---
    render();
});
