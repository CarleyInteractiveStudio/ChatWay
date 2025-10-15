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

// --- Chat UI Logic ---
const conversationsList = document.getElementById('conversations-list');
const chatWindow = document.getElementById('chat-window');
const backToConversationsButton = document.getElementById('back-to-conversations');

if (conversationsList && chatWindow && backToConversationsButton) {
    // Show chat window when a conversation is clicked
    conversationsList.addEventListener('click', (event) => {
        const conversationItem = event.target.closest('.conversation-item');
        if (conversationItem) {
            conversationsList.style.display = 'none';
            chatWindow.style.display = 'flex'; // Use flex because the window is a flex container
        }
    });

    // Go back to conversations list
    backToConversationsButton.addEventListener('click', () => {
        chatWindow.style.display = 'none';
        conversationsList.style.display = 'block';
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
const navButtons = document.querySelectorAll('.nav-button');

if (mainNav) {
    mainNav.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.nav-button');
        if (!targetButton) return;

        const targetSectionId = targetButton.dataset.section;

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
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';

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
