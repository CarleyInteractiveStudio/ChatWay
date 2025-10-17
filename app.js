// Supabase Client Initialization
// IMPORTANT: In a production environment, use environment variables to store these keys securely.
// Do not commit them directly into your source code.
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL from your project settings
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key from your project settings

// Use a unique name to avoid conflicts with the global 'supabase' object
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("ChatWey app.js loaded");

// --- UTILS ---
/**
 * Displays a custom notification message to the user.
 * @param {string} message The message to display.
 * @param {string} type 'success' or 'error'.
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}


// --- AUTHENTICATION ---
const registerForm = document.getElementById('register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Get form data
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const dob = new Date(document.getElementById('dob').value);
        const sex = document.getElementById('sex').value;
        const country = document.getElementById('country').value;
        const languages = Array.from(document.querySelectorAll('input[name="language"]:checked')).map(el => el.value);

        // 1. Age Validation (must be 18+)
        const age = new Date().getFullYear() - dob.getFullYear();
        const monthDiff = new Date().getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < dob.getDate())) {
            age--;
        }

        if (age < 18) {
            showNotification('Debes tener al menos 18 años para registrarte.', 'error');
            return;
        }

        // 2. Name validation (only letters and spaces)
        if (!/^[a-zA-Z\s]+$/.test(name)) {
            showNotification('El nombre solo puede contener letras y espacios.', 'error');
            return;
        }

        // 3. Sign up the user with Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) {
            showNotification(`Error de registro: ${authError.message}`, 'error');
            return;
        }

        if (authData.user) {
            // 4. Insert public profile into the 'users' table
            const { error: profileError } = await supabaseClient
                .from('users')
                .insert([{
                    id: authData.user.id,
                    name: name,
                    date_of_birth: document.getElementById('dob').value,
                    sex: sex,
                    country: country,
                    languages: languages
                }]);

            if (profileError) {
                showNotification(`Error al crear el perfil: ${profileError.message}`, 'error');
            } else {
                showNotification('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.', 'success');
                registerForm.reset();
            }
        }
    });
}

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// --- Chat Logic ---
const conversationsList = document.getElementById('conversations-list');
const chatWindow = document.getElementById('chat-window');
const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
let currentConversationId = null; // This will hold the ID of the currently open conversation

// Handle sending a new message
if (sendButton && messageInput) {
    sendButton.addEventListener('click', async () => {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

        // 1. Get the current logged-in user
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            showNotification('Debes iniciar sesión para enviar mensajes.', 'error');
            return;
        }

        // 2. Define the message payload
        // Use the currently active conversation ID
        if (!currentConversationId) {
            showNotification('Selecciona una conversación válida primero.', 'error');
            return;
        }

        const messagePayload = {
            sender_id: user.id,
            conversation_id: conversationId,
            content: messageText
        };

        // Add reply information if in reply mode
        if (replyingToMessage) {
            messagePayload.replied_to_message_id = replyingToMessage.id;
        }

        // 3. Insert the message into the database
        const { error } = await supabaseClient.from('messages').insert([messagePayload]);

        if (error) {
            showNotification(`Error al enviar el mensaje: ${error.message}`, 'error');
        } else {
            messageInput.value = ''; // Clear the input field
            // Reset reply mode
            if (replyingToMessage) {
                replyingToMessage = null;
                replyBar.style.display = 'none';
            }
        }
    });
}

/**
 * Renders a list of conversations in the chat list view.
 * @param {Array<object>} conversations Array of conversation objects.
 */
function renderConversations(conversations) {
    if (!conversationsList) return;
    // Clear the list, but keep the default "ChatWey" contact
    conversationsList.innerHTML = `
        <div class="conversation-item active" data-conversation-id="system">
            <img src="img/Chatwey.png" alt="ChatWey Logo" class="avatar">
            <div class="conversation-details">
                <div class="conversation-name">ChatWey</div>
                <div class="conversation-preview">Notificaciones del sistema</div>
            </div>
        </div>
    `;

    // In a real app, you would iterate over conversations and render them.
    // For this correction, let's add a placeholder to show it's working.
    const placeholderConv = document.createElement('div');
    placeholderConv.className = 'conversation-item';
    placeholderConv.dataset.conversationId = '1'; // Example ID
    placeholderConv.innerHTML = `
        <img src="img/Chatwey.png" alt="User Avatar" class="avatar">
        <div class="conversation-details">
            <div class="conversation-name">Usuario de Prueba</div>
            <div class="conversation-preview">Haz clic para chatear...</div>
        </div>
    `;
    conversationsList.appendChild(placeholderConv);
}

/**
 * Fetches the conversations for the current user.
 */
async function fetchUserConversations() {
    if (!localUser) return;
    // This is a complex query. For now, we'll just render a placeholder.
    // In a real app, you would query conversation_participants to find conversations
    // where the user is a member.
    renderConversations([]); // Pass empty array to render placeholder
}

const messagesContainer = document.getElementById('messages-container');
let localUser = null; // To store the current user info
let replyingToMessage = null; // To store info about the message being replied to

// --- Reply UI Logic ---
const replyBar = document.getElementById('reply-bar');
const cancelReplyButton = document.getElementById('cancel-reply');

// Activate reply mode when a message is clicked
if (messagesContainer) {
    messagesContainer.addEventListener('click', (event) => {
        const messageBubble = event.target.closest('.message-bubble');
        if (!messageBubble || !messageBubble.dataset.messageId) return;

        const messageId = messageBubble.dataset.messageId;
        const userName = messageBubble.querySelector('.user-name').textContent;
        const messageText = messageBubble.querySelector('.text').textContent;

        replyingToMessage = {
            id: messageId,
            user: userName,
            text: messageText
        };

        // Show the reply bar
        replyBar.querySelector('strong').textContent = userName;
        replyBar.style.display = 'flex';
        messageInput.focus(); // Focus the input field
    });
}

// Cancel reply mode
if (cancelReplyButton) {
    cancelReplyButton.addEventListener('click', () => {
        replyingToMessage = null;
        replyBar.style.display = 'none';
    });
}

/**
 * Renders a single message object into the chat window.
 * @param {object} message The message object from Supabase.
 */
function renderMessage(message) {
    if (!localUser || !messagesContainer) return;

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';
    messageBubble.dataset.messageId = message.id; // Add message ID for reply functionality

    // Determine if the message is incoming or outgoing
    if (message.sender_id === localUser.id) {
        messageBubble.classList.add('outgoing');
    } else {
        messageBubble.classList.add('incoming');
    }

    const senderName = message.sender ? message.sender.name : (message.sender_id === localUser.id ? "Tú" : "Usuario Desconocido");

    // Check if it's a reply and build the preview
    let replyPreviewHTML = '';
    if (message.replied_message && message.replied_message.sender) {
        const repliedToUser = message.replied_message.sender.name;
        replyPreviewHTML = `
            <div class="reply-preview">
                <div class="reply-user">${repliedToUser}</div>
                <div class="reply-text">${message.replied_message.content}</div>
            </div>
        `;
    }

    // Add a timestamp and read-receipt status for outgoing messages
    let statusIndicator = '';
    if (message.sender_id === localUser.id) {
        statusIndicator = `
            <div class="message-status">
                <ion-icon name="checkmark-done-outline" class="${message.status === 'visto' ? 'read' : ''}"></ion-icon>
            </div>
        `;
    }

    messageBubble.innerHTML = `
        <img src="img/Chatwey.png" alt="Avatar" class="avatar message-avatar">
        <div class="message-content">
            <div class="user-name">${senderName}</div>
            ${replyPreviewHTML}
            <div class="text">${message.content}</div>
            ${statusIndicator}
        </div>
    `;
    messagesContainer.appendChild(messageBubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
}

/**
 * Fetches all messages for a given conversation and renders them.
 * @param {number} conversationId The ID of the conversation to fetch.
 */
async function fetchAndRenderMessages(conversationId) {
    if (!messagesContainer) return;
    messagesContainer.innerHTML = ''; // Clear previous messages

    const { data: messages, error } = await supabaseClient
        .from('messages')
        .select(`
            *,
            sender:users ( name ),
            replied_message:messages ( id, content, sender:users ( name ) )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        showNotification('Error al cargar los mensajes.', 'error');
        console.error(error);
    } else if (messages) {
        messages.forEach(renderMessage);

        // After rendering, mark all incoming messages as 'visto'
        // This simulates the current user reading them.
        const incomingMessageIds = messages
            .filter(msg => msg.sender_id !== localUser.id && msg.status !== 'visto')
            .map(msg => msg.id);

        if (incomingMessageIds.length > 0) {
            const { error: updateError } = await supabaseClient
                .from('messages')
                .update({ status: 'visto' })
                .in('id', incomingMessageIds);

            if (updateError) {
                console.error("Error updating message status:", updateError);
            }
        }
    }
}

let messageSubscription = null;

/**
 * Subscribes to real-time new messages for a given conversation.
 * @param {number} conversationId The ID of the conversation to subscribe to.
 */
function subscribeToConversation(conversationId) {
    // Unsubscribe from any previous channel
    if (messageSubscription) {
        supabaseClient.removeSubscription(messageSubscription);
    }

    messageSubscription = supabaseClient
        .from(`messages:conversation_id=eq.${conversationId}`)
        .on('INSERT', payload => {
            // New message received, render it
            renderMessage(payload.new);
        })
        .on('UPDATE', payload => {
            // A message was updated (e.g., status changed to 'visto')
            const updatedMessage = payload.new;
            if (updatedMessage.status === 'visto') {
                const messageElement = messagesContainer.querySelector(`[data-message-id='${updatedMessage.id}']`);
                if (messageElement) {
                    const icon = messageElement.querySelector('.message-status ion-icon');
                    if (icon) {
                        icon.classList.add('read');
                    }
                }
            }
        })
        .subscribe();

    console.log(`Subscribed to conversation ${conversationId}`);
}

// --- Chat UI Navigation ---
const backToConversationsButton = document.getElementById('back-to-conversations');

if (conversationsList && chatWindow && backToConversationsButton) {
    // Show chat window when a conversation is clicked
    conversationsList.addEventListener('click', (event) => {
        const conversationItem = event.target.closest('.conversation-item');
        if (conversationItem) {
            conversationsList.style.display = 'none';
            chatWindow.style.display = 'flex'; // Use flex because the window is a flex container
            mainNav.style.display = 'none'; // Hide main navigation

            // Fetch messages for the selected conversation
            const conversationId = parseInt(conversationItem.dataset.conversationId, 10);
            if (isNaN(conversationId)) return; // Ignore if the ID is not a number (e.g., 'system')

            currentConversationId = conversationId; // Store the current conversation ID
            fetchAndRenderMessages(conversationId);
            subscribeToConversation(conversationId); // Subscribe to real-time updates
        }
    });

    // Go back to conversations list
    backToConversationsButton.addEventListener('click', () => {
        chatWindow.style.display = 'none';
        conversationsList.style.display = 'block';
        mainNav.style.display = 'grid'; // Show main navigation again
        currentConversationId = null;

        // Unsubscribe from the channel when leaving the chat window
        if (messageSubscription) {
            supabaseClient.removeSubscription(messageSubscription);
            messageSubscription = null;
            console.log("Unsubscribed from conversation.");
        }
    });
}


// --- Game Section Sub-Navigation Logic ---
const gameSection = document.getElementById('game-section');
if (gameSection) {
    const subNavButtons = gameSection.querySelectorAll('.sub-nav-button');
    const subSections = gameSection.querySelectorAll('.sub-section');

    gameSection.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.sub-nav-button');
        if (!targetButton) return;

        // Hide all sub-sections
        subSections.forEach(section => {
            section.style.display = 'none';
        });

        // Show target sub-section
        const targetSectionId = `${targetButton.dataset.subsection}-subsection`;
        const targetSection = document.getElementById(targetSectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update active button state
        subNavButtons.forEach(button => {
            button.classList.remove('active');
        });
        targetButton.classList.add('active');
    });
}


// --- "Conocer Personas" Sub-Navigation Logic ---
const conocerPersonasSection = document.getElementById('conocer-personas-section');
if (conocerPersonasSection) {
    const subNavButtons = conocerPersonasSection.querySelectorAll('.sub-nav-button');
    const subSections = conocerPersonasSection.querySelectorAll('.sub-section');

    conocerPersonasSection.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.sub-nav-button');
        if (!targetButton) return;

        // Hide all sub-sections
        subSections.forEach(section => {
            section.style.display = 'none';
        });

        // Show target sub-section
        const targetSectionId = `${targetButton.dataset.subsection}-subsection`;
        const targetSection = document.getElementById(targetSectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update active button state
        subNavButtons.forEach(button => {
            button.classList.remove('active');
        });
        targetButton.classList.add('active');
    });
}


// --- Navigation Logic ---
const mainNav = document.getElementById('main-nav');
const appSections = document.querySelectorAll('.app-section');
const navButtons = Array.from(document.querySelectorAll('.nav-button'));
const navSlider = document.querySelector('.nav-slider');

if (mainNav && navSlider) {
    mainNav.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.nav-button');
        if (!targetButton) return;

        const targetSectionId = targetButton.dataset.section;
        const targetIndex = navButtons.indexOf(targetButton);

        // Hide all sections
        appSections.forEach(section => {
            section.style.display = 'none';
        });

        // Show target section
        const targetSection = document.getElementById(targetSectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update active button state
        navButtons.forEach(button => {
            button.classList.remove('active');
        });
        targetButton.classList.add('active');

        // Move the slider
        navSlider.style.transform = `translateX(${targetIndex * 100}%)`;
    });
}


// --- UI Management ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const logoutButton = document.getElementById('logout-button');
const userNameEl = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session && session.user) {
        // User is logged in
        localUser = session.user; // Store user info for chat logic
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';

        fetchUserConversations(); // Fetch and render user's conversations

        // Fetch user profile and premium status
        const { data, error } = await supabaseClient
            .from('users')
            .select(`
                name,
                premium_subscriptions ( subscription_level )
            `)
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
        } else if (data) {
            // Populate user info
            document.getElementById('user-name').textContent = data.name;
            document.getElementById('user-email').textContent = session.user.email;

            // Handle premium features visibility
            const premiumStatusEl = document.getElementById('premium-status');
            const createGroupButton = document.getElementById('create-group-button');

            // Note: The join syntax `premium_subscriptions ( subscription_level )` assumes a foreign key relationship is set up in Supabase.
            if (data.premium_subscriptions && data.premium_subscriptions.length > 0) {
                premiumStatusEl.textContent = `Premium (${data.premium_subscriptions[0].subscription_level})`;
                createGroupButton.style.display = 'block';
            } else {
                premiumStatusEl.textContent = 'Usuario Normal';
                createGroupButton.style.display = 'none';
            }
        }

    } else {
        // User is logged out
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});

// Logout functionality
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        showNotification('Has cerrado sesión.', 'success');
    });
}

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const { error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            showNotification(`Error al iniciar sesión: ${error.message}`, 'error');
        } else {
            showNotification('¡Inicio de sesión exitoso!', 'success');
            // Here you would typically redirect the user or update the UI
            loginForm.reset();
        }
    });
}
