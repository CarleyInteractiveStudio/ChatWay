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

    // --- Authentication Form Switching ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
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

    registerButton.addEventListener('click', (e) => {
        e.preventDefault();
        // TODO: Add real registration logic
        // TODO: Add age validation here (minimum 18 years old)
        console.log('Simulating registration...');
        showApp();
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
