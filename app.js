document.addEventListener('DOMContentLoaded', () => {
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

    // --- Custom Notifications ---
    const notificationContainer = document.getElementById('notification-container');
    let notificationTimeout;

    const showNotification = (message, type = 'success') => {
        clearTimeout(notificationTimeout);
        notificationContainer.textContent = message;
        notificationContainer.className = type; // 'success' or 'error'

        notificationTimeout = setTimeout(() => {
            notificationContainer.classList.add('hidden');
        }, 3000); // Hide after 3 seconds
    };

    // --- Language Selector ---
    const languages = ["Español", "English", "Português", "Français", "Deutsch", "Italiano"];

    const populateLanguages = () => {
        const container = document.getElementById('language-select-container');
        languages.forEach(lang => {
            const div = document.createElement('div');
            div.classList.add('language-option');
            div.innerHTML = `<input type="checkbox" id="lang-${lang}" name="language" value="${lang}"><label for="lang-${lang}" style="margin-left: 5px;">${lang}</label>`;
            container.appendChild(div);
        });
    };

    // --- Geolocation ---
    let detectedCountry = ''; // Variable to store detected country

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
            detectedCountry = 'Unknown'; // Fallback
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

    // --- Simulated Login/Registration ---
    const showApp = () => {
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';
    };

    loginButton.addEventListener('click', (e) => {
        e.preventDefault();
        // Here you would add real authentication logic
        console.log('Simulating login...');
        showApp();
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

        // Get selected languages
        const selectedLanguages = [];
        document.querySelectorAll('input[name="language"]:checked').forEach((checkbox) => {
            selectedLanguages.push(checkbox.value);
        });

        // --- Validation ---
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!name || !nameRegex.test(name.trim())) {
            showNotification("El nombre solo puede contener letras y espacios.", "error");
            return;
        }

        if (password !== confirmPassword) {
            showNotification("Las contraseñas no coinciden.", "error");
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
            showNotification("Debes tener al menos 18 años para registrarte.", "error");
            return;
        }

        if (selectedLanguages.length === 0) {
            showNotification("Debes seleccionar al menos un idioma.", "error");
            return;
        }

        // --- Sign up user (Real Logic) ---
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    date_of_birth: dob,
                    gender: sex,
                    country: detectedCountry,
                    language: selectedLanguages.join(', '), // Save as comma-separated string
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

    // --- Main App Navigation ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

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

    populateLanguages(); // Call on initial load
});
