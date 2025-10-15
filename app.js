document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    const supabaseUrl = 'https://fzmankchbxunxygovgqp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bWFua2NoYnh1bnh5Z292Z3FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTAzNjIsImV4cCI6MjA3NTY2NjM2Mn0.0QBTHnhpeumfFnFCZ5XS8QwomG_hCfj2dGqJUS335j8';
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // --- DOM Elements ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginButton = loginForm.querySelector('button');
    const registerButton = registerForm.querySelector('button');
    const navLinks = document.querySelectorAll('.nav-link');

    // --- Custom Notifications ---
    const notificationContainer = document.getElementById('notification-container');
    let notificationTimeout;

    const showNotification = (message, type = 'success') => {
        clearTimeout(notificationTimeout);
        notificationContainer.textContent = message;

        // Explicitly manage classes for robustness
        notificationContainer.classList.remove('success', 'error', 'hidden');
        notificationContainer.classList.add(type); // Add 'success' or 'error' class for color

        notificationTimeout = setTimeout(() => {
            notificationContainer.classList.add('hidden');
        }, 3000);
    };

    // --- Language Search Component ---
    const allLanguages = ["Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Basque", "Belarusian", "Bengali", "Bosnian", "Bulgarian", "Catalan", "Cebuano", "Chinese (Simplified)", "Chinese (Traditional)", "Corsican", "Croatian", "Czech", "Danish", "Dutch", "English", "Esperanto", "Estonian", "Finnish", "French", "Frisian", "Galician", "Georgian", "German", "Greek", "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi", "Hmong", "Hungarian", "Icelandic", "Igbo", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Kannada", "Kazakh", "Khmer", "Kinyarwanda", "Korean", "Kurdish", "Kyrgyz", "Lao", "Latin", "Latvian", "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malay", "Malayalam", "Maltese", "Maori", "Marathi", "Mongolian", "Myanmar (Burmese)", "Nepali", "Norwegian", "Nyanja (Chichewa)", "Odia (Oriya)", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Samoan", "Scots Gaelic", "Serbian", "Sesotho", "Shona", "Sindhi", "Sinhala (Sinhalese)", "Slovak", "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili", "Swedish", "Tagalog (Filipino)", "Tajik", "Tamil", "Tatar", "Telugu", "Thai", "Turkish", "Turkmen", "Ukrainian", "Urdu", "Uyghur", "Uzbek", "Vietnamese", "Welsh", "Xhosa", "Yiddish", "Yoruba", "Zulu"];
    let selectedLanguages = new Set();

    const languageSearchInput = document.getElementById('language-search-input');
    const suggestionsContainer = document.getElementById('language-suggestions');
    const tagsContainer = document.getElementById('selected-languages-tags');

    const renderTags = () => {
        tagsContainer.innerHTML = '';
        selectedLanguages.forEach(lang => {
            const tag = document.createElement('div');
            tag.classList.add('language-tag');
            tag.textContent = lang;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => removeLanguage(lang));
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        });
    };

    const addLanguage = (lang) => {
        selectedLanguages.add(lang);
        languageSearchInput.value = '';
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
        renderTags();
    };

    const removeLanguage = (lang) => {
        selectedLanguages.delete(lang);
        renderTags();
    };

    languageSearchInput.addEventListener('input', () => {
        const query = languageSearchInput.value.toLowerCase();
        suggestionsContainer.innerHTML = '';
        if (!query) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        const filtered = allLanguages.filter(lang =>
            lang.toLowerCase().includes(query) && !selectedLanguages.has(lang)
        );

        filtered.slice(0, 5).forEach(lang => { // Show max 5 suggestions
            const item = document.createElement('div');
            item.classList.add('suggestion-item');
            item.textContent = lang;
            item.addEventListener('click', () => addLanguage(lang));
            suggestionsContainer.appendChild(item);
        });

        suggestionsContainer.style.display = filtered.length > 0 ? 'block' : 'none';
    });

    // --- Geolocation ---
    let detectedCountry = '';

    const fetchCountry = async () => {
        try {
            const response = await fetch('https://ip-api.com/json/');
            if (!response.ok) throw new Error('Could not fetch country');
            const data = await response.json();
            if (data && data.country) {
                detectedCountry = data.country;
            }
        } catch (error) {
            console.error("Geolocation error:", error);
            detectedCountry = 'Unknown';
        }
    };

    // --- Authentication Form Switching ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        fetchCountry();
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'flex';
    });

    // --- App Logic ---
    const showApp = () => {
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        // Future logic to load app content will go here
    };

    // --- Event Listeners ---
    loginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            showNotification(`Error al iniciar sesión: ${error.message}`, 'error');
        } else {
            showNotification('¡Inicio de sesión exitoso!');
            showApp();
        }
    });

    registerButton.addEventListener('click', async (e) => {
        e.preventDefault();

        const name = registerForm.querySelector('input[placeholder="Name"]').value;
        const email = registerForm.querySelector('input[placeholder="Email"]').value;
        const password = registerForm.querySelector('input[placeholder="Password"]').value;
        const confirmPassword = registerForm.querySelector('input[placeholder="Confirm Password"]').value;
        const dob = registerForm.querySelector('input[type="date"]').value;
        const sex = registerForm.querySelector('select').value;

        // Get selected languages from the Set
        const languagesArray = Array.from(selectedLanguages);

        // Validation
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!name || !nameRegex.test(name.trim())) {
            return showNotification("El nombre solo puede contener letras y espacios.", "error");
        }
        if (password !== confirmPassword) {
            return showNotification("Las contraseñas no coinciden.", "error");
        }
        const age = new Date().getFullYear() - new Date(dob).getFullYear();
        if (age < 18) {
            return showNotification("Debes tener al menos 18 años para registrarte.", "error");
        }
        if (languagesArray.length === 0) {
            return showNotification("Debes seleccionar al menos un idioma.", "error");
        }

        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    date_of_birth: dob,
                    gender: sex,
                    country: detectedCountry,
                    language: languagesArray.join(', '),
                }
            }
        });

        if (error) {
            showNotification(`Error en el registro: ${error.message}`, 'error');
        } else {
            showNotification('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.');
            registerForm.style.display = 'none';
            loginForm.style.display = 'flex';
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
            document.querySelector(link.getAttribute('href')).style.display = 'block';
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

});
