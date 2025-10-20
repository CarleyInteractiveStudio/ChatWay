document.addEventListener('DOMContentLoaded', () => {

    // --- Mock Data ---
    const users = [
        { id: 1, name: 'Luna', avatar: 'https://i.pravatar.cc/150?u=luna', isFriend: false },
        { id: 2, name: 'Mateo', avatar: 'https://i.pravatar.cc/150?u=mateo', isFriend: true },
        { id: 3, name: 'Sofía', avatar: 'https://i.pravatar.cc/150?u=sofia', isFriend: false },
        { id: 4, name: 'Leo', avatar: 'https://i.pravatar.cc/150?u=leo', isFriend: false },
        { id: 5, name: 'Valeria', avatar: 'https://i.pravatar.cc/150?u=valeria', isFriend: true },
    ];

    const userListContainer = document.querySelector('.user-list');

    // --- Render User Profiles ---
    function renderUsers() {
        userListContainer.innerHTML = ''; // Clear existing list
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <img src="${user.avatar}" alt="${user.name}" class="avatar">
                <div class="user-info">
                    <h3>${user.name}</h3>
                </div>
                <button class="action-button ${user.isFriend ? 'friends' : ''}" data-user-id="${user.id}">
                    <ion-icon name="${user.isFriend ? 'checkmark-outline' : 'add-outline'}"></ion-icon>
                </button>
            `;
            userListContainer.appendChild(userCard);
        });
    }

    // --- Event Listeners ---

    // Add/Remove Friend Button
    userListContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.action-button');
        if (button) {
            const userId = parseInt(button.dataset.userId, 10);
            const user = users.find(u => u.id === userId);

            if (user) {
                if (user.isFriend) {
                     // Simple confirmation for removing a friend
                    if (confirm(`¿Seguro que quieres eliminar a ${user.name} de tus amigos?`)) {
                        user.isFriend = false;
                    }
                } else {
                    user.isFriend = true;
                }
                renderUsers(); // Re-render the list to show the change
            }
        }
    });

    // Navigation Menu
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');

    navItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();

            // Deactivate all items and screens
            navItems.forEach(i => i.classList.remove('active'));
            screens.forEach(s => s.classList.remove('active'));

            // Activate the clicked item and corresponding screen
            item.classList.add('active');
            const screenId = item.dataset.screen;
            document.getElementById(screenId).classList.add('active');
        });
    });

    // --- Initial Load ---
    renderUsers();
});
