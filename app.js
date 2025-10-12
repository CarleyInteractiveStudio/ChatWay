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

    let currentUser = null; // Variable to hold current user data

    // --- Main App Logic ---
    const showApp = async () => {
        const { data: { user } } = await supabase.auth.getUser();
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
        const { error: updateError } = await supabase.from('couple_requests').update({ status: 'accepted' }).eq('id', requestId);
        if (updateError) return alert('Error accepting couple request.');

        // Step 2: Create the couple record
        const { error: insertError } = await supabase.from('couples').insert({ user1_id: currentUser.id, user2_id: senderId });
        if (insertError) return alert('Error creating couple.');

        // Step 3: Reject any other pending couple requests for both users
        const userIds = [currentUser.id, senderId];
        await supabase.from('couple_requests').update({ status: 'rejected' }).in('sender_id', userIds).eq('status', 'pending');
        await supabase.from('couple_requests').update({ status: 'rejected' }).in('receiver_id', userIds).eq('status', 'pending');

        // Step 4: Refresh UI
        await loadCoupleRequests();
        await loadUsers();
    };

    const rejectCoupleRequest = async (requestId) => {
        const { error } = await supabase.from('couple_requests').update({ status: 'rejected' }).eq('id', requestId);
        if (error) return alert('Error rejecting couple request.');
        await loadCoupleRequests();
    };

    const loadCoupleRequests = async () => {
        const requestsContainer = document.getElementById('couple-requests-container');
        requestsContainer.innerHTML = '<h3>Solicitudes de Pareja</h3>'; // Reset

        const { data: requests, error } = await supabase
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
        const { error } = await supabase.from('couple_requests').insert({ sender_id: senderId, receiver_id: receiverId });
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
        const { error } = await supabase.from('friend_requests').insert({ sender_id: senderId, receiver_id: receiverId });
        if (error) {
            alert(`Error sending friend request: ${error.message}`);
        } else {
            loadUsers(); // Reload user list to show updated status
        }
    };

    const acceptFriendRequest = async (requestId, senderId) => {
        // Step 1: Update the request status to 'accepted'
        const { error: updateError } = await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
        if (updateError) return alert('Error accepting request.');

        // Step 2: Create a new friendship record
        const { error: insertError } = await supabase.from('friendships').insert({ user1_id: currentUser.id, user2_id: senderId });
        if (insertError) return alert('Error creating friendship.');

        // Step 3: Refresh the UI
        await loadFriendRequests();
        await loadUsers();
    };

    const rejectFriendRequest = async (requestId) => {
        const { error } = await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
        if (error) return alert('Error rejecting request.');
        await loadFriendRequests(); // Just refresh the requests list
    };

    const loadFriendRequests = async () => {
        const requestsContainer = document.getElementById('friend-requests-container');
        requestsContainer.innerHTML = '<h3>Solicitudes de Amistad</h3>'; // Reset container

        const { data: requests, error } = await supabase
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
            supabase.from('profiles').select('id, full_name, country').neq('id', currentUser.id),
            supabase.from('friendships').select('*').or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`),
            supabase.from('couples').select('*').or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`),
            supabase.from('friend_requests').select('receiver_id').eq('sender_id', currentUser.id).eq('status', 'pending'),
            supabase.from('couple_requests').select('receiver_id').eq('sender_id', currentUser.id).eq('status', 'pending')
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
