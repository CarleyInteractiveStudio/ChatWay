document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    // --- Supabase Client Initialization ---
    const supabaseUrl = 'https://fzmankchbxunxygovgqp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bWFua2NoYnh1bnh5Z292Z3FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTAzNjIsImV4cCI6MjA3NTY2NjM2Mn0.0QBTHnhpeumfFnFCZ5XS8QwomG_hCfj2dGqJUS335j8';

    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const loginButton = loginForm.querySelector('button');
    const registerButton = registerForm.querySelector('button');

    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    // Make sure the initial active link corresponds to the visible section
    document.querySelector('.nav-link[data-target="mundo"]').classList.add('active');
    document.getElementById('mundo').style.display = 'block';

    // --- Geolocation ---
    const fetchCountry = async () => {
        try {
            const response = await fetch('http://ip-api.com/json/');
            if (!response.ok) {
                throw new Error('Could not fetch country');
            }
            const data = await response.json();
            if (data && data.country) {
                registerForm.querySelector('input[placeholder="Country"]').value = data.country;
            }
        } catch (error) {
            console.error("Geolocation error:", error);
            // Don't block registration, user can still type manually.
        }
    };

    // --- Content Moderation ---
    const BANNED_ITEMS = ['🏳️‍🌈', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '🏳️‍⚧️']; // Non-country flags and prohibited emojis
    const MODERATION_MESSAGE = '✖️⚠️ emolli proivido ⚠️✖️';

    const moderateContent = (text) => {
        for (const item of BANNED_ITEMS) {
            if (text.includes(item)) {
                return MODERATION_MESSAGE;
            }
        }
        return text;
    };

    // --- Authentication Form Switching ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        fetchCountry(); // Fetch country when register form is shown
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'flex';
    });

    let currentUser = null; // Variable to hold current user data

    // --- Main App Logic ---
    const showApp = async () => {
        const { data: { user } } = await supabaseClient.auth.getUser();
        currentUser = user;

        if (!currentUser) {
            alert("Could not get user session. Returning to login.");
            authContainer.style.display = 'block';
            appContainer.style.display = 'none';
            return;
        }

        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        await loadCoupleRequests();
        await loadFriendRequests();
        await loadUsers();
    };

    // --- Couple System ---
    const acceptCoupleRequest = async (requestId, senderId) => {
        // Step 1: Update request to 'accepted'
        const { error: updateError } = await supabaseClient.from('couple_requests').update({ status: 'accepted' }).eq('id', requestId);
        if (updateError) return alert('Error accepting couple request.');

        // Step 2: Create the couple record
        const { error: insertError } = await supabaseClient.from('couples').insert({ user1_id: currentUser.id, user2_id: senderId });
        if (insertError) return alert('Error creating couple.');

        // Step 3: Reject any other pending couple requests for both users
        const userIds = [currentUser.id, senderId];
        await supabaseClient.from('couple_requests').update({ status: 'rejected' }).in('sender_id', userIds).eq('status', 'pending');
        await supabaseClient.from('couple_requests').update({ status: 'rejected' }).in('receiver_id', userIds).eq('status', 'pending');

        // Step 4: Refresh UI
        await loadCoupleRequests();
        await loadUsers();
    };

    const rejectCoupleRequest = async (requestId) => {
        const { error } = await supabaseClient.from('couple_requests').update({ status: 'rejected' }).eq('id', requestId);
        if (error) return alert('Error rejecting couple request.');
        await loadCoupleRequests();
    };

    const loadCoupleRequests = async () => {
        const requestsContainer = document.getElementById('couple-requests-container');
        requestsContainer.innerHTML = '<h3>Solicitudes de Pareja</h3>'; // Reset

        const { data: requests, error } = await supabaseClient
            .from('couple_requests')
            .select('id, sender_id, profiles:sender_id (full_name)')
            .eq('receiver_id', currentUser.id)
            .eq('status', 'pending');

        if (error) return console.error('Error fetching couple requests:', error);

        if (requests && requests.length > 0) {
            requests.forEach(req => {
                const reqEl = document.createElement('div');
                reqEl.classList.add('user-card');
                reqEl.innerHTML = `
                    <p><strong>${req.profiles.full_name}</strong> quiere ser tu pareja.</p>
                    <div>
                        <button class="accept-couple-btn" data-request-id="${req.id}" data-sender-id="${req.sender_id}">Aceptar</button>
                        <button class="reject-couple-btn" data-request-id="${req.id}">Rechazar</button>
                    </div>`;
                requestsContainer.appendChild(reqEl);
            });
            document.querySelectorAll('.accept-couple-btn').forEach(b => b.addEventListener('click', e => acceptCoupleRequest(e.target.dataset.requestId, e.target.dataset.senderId)));
            document.querySelectorAll('.reject-couple-btn').forEach(b => b.addEventListener('click', e => rejectCoupleRequest(e.target.dataset.requestId)));
        } else {
            requestsContainer.innerHTML += '<p>No tienes solicitudes de pareja pendientes.</p>';
        }
    };

    const sendCoupleRequest = async (receiverId) => {
        const senderId = currentUser.id;
        const { error } = await supabaseClient.from('couple_requests').insert({ sender_id: senderId, receiver_id: receiverId });
        if (error) {
            alert(`Error sending couple request: ${error.message}`);
        } else {
            // Reload users to update the button state
            loadUsers();
        }
    };

    // --- Friend System ---
    const sendFriendRequest = async (receiverId) => {
        const senderId = currentUser.id;
        const { error } = await supabaseClient.from('friend_requests').insert({ sender_id: senderId, receiver_id: receiverId });
        if (error) {
            alert(`Error sending friend request: ${error.message}`);
        } else {
            loadUsers(); // Reload user list to show updated status
        }
    };

    const acceptFriendRequest = async (requestId, senderId) => {
        // Step 1: Update the request status to 'accepted'
        const { error: updateError } = await supabaseClient.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
        if (updateError) return alert('Error accepting request.');

        // Step 2: Create a new friendship record
        const { error: insertError } = await supabaseClient.from('friendships').insert({ user1_id: currentUser.id, user2_id: senderId });
        if (insertError) return alert('Error creating friendship.');

        // Step 3: Refresh the UI
        await loadFriendRequests();
        await loadUsers();
    };

    const rejectFriendRequest = async (requestId) => {
        const { error } = await supabaseClient.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
        if (error) return alert('Error rejecting request.');
        await loadFriendRequests(); // Just refresh the requests list
    };

    const loadFriendRequests = async () => {
        const requestsContainer = document.getElementById('friend-requests-container');
        requestsContainer.innerHTML = '<h3>Solicitudes de Amistad</h3>'; // Reset container

        const { data: requests, error } = await supabaseClient
            .from('friend_requests')
            .select('id, sender_id, profiles:sender_id (full_name)')
            .eq('receiver_id', currentUser.id)
            .eq('status', 'pending');

        if (error) return console.error('Error fetching requests:', error);

        if (requests && requests.length > 0) {
            requests.forEach(req => {
                const reqEl = document.createElement('div');
                reqEl.classList.add('user-card');
                reqEl.innerHTML = `
                    <p><strong>${req.profiles.full_name}</strong> te envió una solicitud.</p>
                    <div>
                        <button class="accept-btn" data-request-id="${req.id}" data-sender-id="${req.sender_id}">Aceptar</button>
                        <button class="reject-btn" data-request-id="${req.id}">Rechazar</button>
                    </div>`;
                requestsContainer.appendChild(reqEl);
            });
            // Add event listeners
            document.querySelectorAll('.accept-btn').forEach(b => b.addEventListener('click', e => acceptFriendRequest(e.target.dataset.requestId, e.target.dataset.senderId)));
            document.querySelectorAll('.reject-btn').forEach(b => b.addEventListener('click', e => rejectFriendRequest(e.target.dataset.requestId)));
        } else {
            requestsContainer.innerHTML += '<p>No tienes solicitudes pendientes.</p>';
        }
    };

    const loadUsers = async () => {
        const userListContainer = document.getElementById('user-list-container');
        userListContainer.innerHTML = ''; // Clear previous list

        // Fetch all necessary data in parallel
        const [ { data: profiles, error: pError }, { data: friendships, error: fError }, { data: couples, error: cError }, { data: sentFriendRequests, error: sfrError }, { data: sentCoupleRequests, error: scrError } ] = await Promise.all([
            supabaseClient.from('profiles').select('id, full_name, country').neq('id', currentUser.id),
            supabaseClient.from('friendships').select('*').or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`),
            supabaseClient.from('couples').select('*').or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`),
            supabaseClient.from('friend_requests').select('receiver_id').eq('sender_id', currentUser.id).eq('status', 'pending'),
            supabaseClient.from('couple_requests').select('receiver_id').eq('sender_id', currentUser.id).eq('status', 'pending')
        ]);

        if (pError || fError || cError || sfrError || scrError) return console.error('Error fetching user data:', pError || fError || cError || sfrError || scrError);

        // Create sets for quick lookups
        const friends = new Set(friendships.map(f => f.user1_id === currentUser.id ? f.user2_id : f.user1_id));
        const partner = new Set(couples.map(c => c.user1_id === currentUser.id ? c.user2_id : c.user1_id));
        const sentFriendPending = new Set(sentFriendRequests.map(r => r.receiver_id));
        const sentCouplePending = new Set(sentCoupleRequests.map(r => r.receiver_id));

        if (profiles) {
            profiles.forEach(profile => {
                let buttonHtml;
                if (partner.has(profile.id)) {
                    buttonHtml = '<button disabled>Pareja</button>';
                } else if (friends.has(profile.id)) {
                    if (sentCouplePending.has(profile.id)) {
                        buttonHtml = '<button disabled>Solicitud de Pareja Enviada</button>';
                    } else {
                        buttonHtml = `<button class="propose-couple-btn" data-userid="${profile.id}">Proponer Pareja</button>`;
                    }
                } else if (sentFriendPending.has(profile.id)) {
                    buttonHtml = '<button disabled>Solicitud Enviada</button>';
                } else {
                    buttonHtml = `<button class="add-friend-btn" data-userid="${profile.id}">Agregar Amigo</button>`;
                }

                const userEl = document.createElement('div');
                userEl.classList.add('user-card');
                userEl.innerHTML = `
                    <div>
                        <p><strong>${profile.full_name}</strong></p>
                        <p><em>${profile.country}</em></p>
                    </div>
                    ${buttonHtml}
                `;
                userListContainer.appendChild(userEl);
            });
            // Add event listeners to the actionable buttons
            document.querySelectorAll('.add-friend-btn').forEach(b => b.addEventListener('click', e => sendFriendRequest(e.target.dataset.userid)));
            document.querySelectorAll('.propose-couple-btn').forEach(b => b.addEventListener('click', e => sendCoupleRequest(e.target.dataset.userid)));
        }
    };

    loginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            alert(`Error logging in: ${error.message}`);
        } else {
            showApp();
        }
    });

    registerButton.addEventListener('click', async (e) => {
        e.preventDefault();

        // Get form data
        const name = registerForm.querySelector('input[placeholder="Name"]').value;
        const email = registerForm.querySelector('input[placeholder="Email"]').value;
        const password = registerForm.querySelector('input[placeholder="Password"]').value;
        const confirmPassword = registerForm.querySelector('input[placeholder="Confirm Password"]').value;
        const dob = registerForm.querySelector('input[type="date"]').value;
        const sex = registerForm.querySelector('select').value;
        const country = registerForm.querySelector('input[placeholder="Country"]').value;
        const language = registerForm.querySelector('input[placeholder="Language"]').value;

        // --- Validation ---
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            alert("You must be at least 18 years old to register.");
            return;
        }

        // --- Sign up user ---
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    date_of_birth: dob,
                    gender: sex,
                    country: country,
                    language: language,
                }
            }
        });

        if (error) {
            alert(`Error signing up: ${error.message}`);
        } else {
            alert('Registration successful! Please check your email to verify your account.');
            // Optionally, switch back to the login form
            registerForm.style.display = 'none';
            loginForm.style.display = 'flex';
        }
    });

    // --- Chat System ---
    let activeConversation = { conversationId: null, partnerId: null, unsubscribe: null };

    const sendMessage = async () => {
        let content = document.getElementById('message-input').value.trim();
        if (!content || !activeConversation.conversationId) return;

        // Apply content moderation before sending
        content = moderateContent(content);

        const { error } = await supabaseClient.from('messages').insert({
            conversation_id: activeConversation.conversationId,
            sender_id: currentUser.id,
            content: content
        });

        if (error) {
            alert('Error sending message.');
            console.error('Send message error:', error);
        } else {
            document.getElementById('message-input').value = '';
        }
    };

    const loadMessages = async (partnerId, partnerName) => {
        // Unsubscribe from previous real-time channel if it exists
        if (activeConversation.unsubscribe) activeConversation.unsubscribe();

        // Update UI
        document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.conversation-item[data-user-id="${partnerId}"]`).classList.add('active');
        document.getElementById('chat-header').textContent = `Chat con ${partnerName}`;
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.innerHTML = ''; // Clear old messages

        // Find or create the conversation
        let { data: conversation, error: convoError } = await supabaseClient.from('conversations')
            .select('id').or(`(user1_id.eq.${currentUser.id},and(user2_id.eq.${partnerId})),(user1_id.eq.${partnerId},and(user2_id.eq.${currentUser.id}))`).single();

        if (convoError && convoError.code !== 'PGRST116') { // PGRST116: no rows found, which is fine
            return console.error('Error finding conversation:', convoError);
        }

        if (!conversation) {
            const { data: newConvo, error: createError } = await supabaseClient.from('conversations').insert({ user1_id: currentUser.id, user2_id: partnerId }).select().single();
            if (createError) return console.error('Error creating conversation:', createError);
            conversation = newConvo;
        }

        activeConversation = { conversationId: conversation.id, partnerId };

        // Fetch initial messages
        const { data: messages, error: msgError } = await supabaseClient.from('messages').select('*, sender:sender_id(full_name)').eq('conversation_id', conversation.id).order('created_at');
        if (msgError) return console.error('Error fetching messages:', msgError);

        messages.forEach(msg => displayMessage(msg));

        // Subscribe to real-time updates
        const channel = supabaseClient.channel(`messages_${conversation.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, payload => {
                displayMessage(payload.new);
            })
            .subscribe();

        activeConversation.unsubscribe = () => channel.unsubscribe();
    };

    const displayMessage = (message) => {
        const messagesContainer = document.getElementById('messages-container');
        const msgEl = document.createElement('div');
        msgEl.classList.add('message');
        if (message.sender_id === currentUser.id) {
            msgEl.classList.add('sent');
        } else {
            msgEl.classList.add('received');
        }
        msgEl.textContent = message.content;
        messagesContainer.appendChild(msgEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
    };

    const loadConversations = async () => {
        const conversationsList = document.getElementById('conversations-list');
        conversationsList.innerHTML = '<h3>Conversaciones</h3>'; // Reset

        const [ { data: friendships, error: fError }, { data: couple, error: cError } ] = await Promise.all([
            supabaseClient.from('friendships').select('user1_id, user2_id, profiles1:user1_id(full_name), profiles2:user2_id(full_name)').or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`),
            supabaseClient.from('couples').select('user1_id, user2_id, profiles1:user1_id(full_name), profiles2:user2_id(full_name)').or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`).single()
        ]);

        if (fError || cError) return console.error("Error fetching conversations", fError || cError);

        const conversationPartners = new Map();
        if (couple) {
            const partner = couple.user1_id === currentUser.id ? { id: couple.user2_id, ...couple.profiles2 } : { id: couple.user1_id, ...couple.profiles1 };
            conversationPartners.set(partner.id, partner.full_name);
        }
        friendships.forEach(f => {
            const friend = f.user1_id === currentUser.id ? { id: f.user2_id, ...f.profiles2 } : { id: f.user1_id, ...f.profiles1 };
            conversationPartners.set(friend.id, friend.full_name);
        });

        if (conversationPartners.size === 0) {
            conversationsList.innerHTML += '<p>No tienes amigos para chatear.</p>';
            return;
        }

        conversationPartners.forEach((name, id) => {
            const convoEl = document.createElement('div');
            convoEl.classList.add('conversation-item');
            convoEl.dataset.userId = id;
            convoEl.dataset.userName = name;
            convoEl.textContent = name;
            conversationsList.appendChild(convoEl);
        });

        // Add event listeners to conversation items
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const partnerId = e.target.dataset.userId;
                const partnerName = e.target.dataset.userName;
                loadMessages(partnerId, partnerName);
            });
        });
    };

    // --- Event Listeners for Chat Input ---
    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // --- Main App Navigation ---
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            if (link.dataset.target === 'chat') {
                await loadConversations();
            }

            // Deactivate all links
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            // Hide all sections
            contentSections.forEach(section => section.style.display = 'none');

            // Activate clicked link
            link.classList.add('active');
            // Show target section
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';
        });
    });
});
