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

    // Represents the current logged-in user.
    const currentUser = { id: 1 };

    const userListContainer = document.querySelector('.user-list');
    const chatMessagesContainer = document.getElementById('chat-messages');

    // --- State Management ---
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

    function renderChat() {
        chatMessagesContainer.innerHTML = '';
        const receivedRequests = coupleRequests.filter(r => r.toId === currentUser.id && r.status === 'pending');

        receivedRequests.forEach(request => {
            const sender = getUser(request.fromId);
            const letterHTML = `
                <div class="letter-container" data-from-id="${request.fromId}">
                    <div class="letter-envelope">
                        <ion-icon name="heart"></ion-icon>
                    </div>
                    <div class="letter-content">
                        <p>De: ${sender.name}</p>
                        <p>${request.message}</p>
                        <div class="letter-actions">
                            <button class="action-button accept" data-action="accept"><ion-icon name="checkmark-outline"></ion-icon></button>
                            <button class="action-button reject" data-action="reject"><ion-icon name="close-outline"></ion-icon></button>
                        </div>
                    </div>
                </div>
            `;
            chatMessagesContainer.innerHTML += letterHTML;
        });
    }


    // --- Event Listeners ---
    chatMessagesContainer.addEventListener('click', (event) => {
        const letterContainer = event.target.closest('.letter-container');
        if (letterContainer) {
            const actionButton = event.target.closest('.action-button');
            const fromId = parseInt(letterContainer.dataset.fromId, 10);

            if (actionButton) {
                const action = actionButton.dataset.action;
                handleLetterAction(fromId, action);
            } else {
                // Toggle open/close only if not clicking a button
                letterContainer.classList.toggle('open');
            }
        }
    });

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

    function handleLetterAction(fromId, action) {
        const request = coupleRequests.find(r => r.fromId === fromId && r.toId === currentUser.id && r.status === 'pending');
        if (!request) return;

        if (action === 'accept') {
            const sender = getUser(request.fromId);
            const receiver = getUser(request.toId);

            // Update users to be partners
            sender.partnerId = receiver.id;
            receiver.partnerId = sender.id;

            // Mark request as accepted
            request.status = 'accepted';

        } else if (action === 'reject') {
            // Mark request as rejected
            request.status = 'rejected';
        }

        // Re-render everything to reflect the change
        render();
    }
});
