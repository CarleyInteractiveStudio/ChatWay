document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    // IMPORTANT: Replace these placeholders with your actual Supabase credentials.
    // Do NOT commit these keys to version control.
    const supabaseUrl = '!!!_REPLACE_WITH_YOUR_SUPABASE_URL_!!!';
    const supabaseKey = '!!!_REPLACE_WITH_YOUR_SUPABASE_ANON_KEY_!!!';

    if (supabaseUrl.startsWith('!!!') || supabaseKey.startsWith('!!!')) {
        alert('CRITICAL ERROR: Supabase credentials have not been configured in app.js. The application cannot start.');
        throw new Error('Supabase credentials not configured.');
    }

    const supabase = supabase.createClient(supabaseUrl, supabaseKey);

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

    // --- Simulated Login/Registration ---
    const showApp = async () => {
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        await loadUsers();
    };

    // --- Load Users for "Hacer Amigos" section ---
    const loadUsers = async () => {
        const userList = document.querySelector('#hacer-amigos');

        // Clear previous list
        userList.innerHTML = '<h2>Hacer Amigos</h2>';

        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('full_name, country');

        if (error) {
            console.error('Error fetching profiles:', error);
            const errorElement = document.createElement('p');
            errorElement.textContent = 'Could not load users.';
            userList.appendChild(errorElement);
            return;
        }

        if (profiles) {
            profiles.forEach(profile => {
                const userElement = document.createElement('div');
                userElement.classList.add('user-card'); // for styling
                userElement.innerHTML = `
                    <p><strong>${profile.full_name}</strong></p>
                    <p><em>${profile.country}</em></p>
                    <button>Add Friend</button>
                `;
                userList.appendChild(userElement);
            });
        }
    };

    loginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        const { data, error } = await supabase.auth.signInWithPassword({
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
        const { data, error } = await supabase.auth.signUp({
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
});
