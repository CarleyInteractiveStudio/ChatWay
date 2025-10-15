// This file will contain the logic specific to the admin panel.

document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin panel JS loaded.");

    // --- Admin Sub-Navigation Logic ---
    const adminContainer = document.getElementById('admin-container');
    if (adminContainer) {
        const subNavButtons = adminContainer.querySelectorAll('.sub-nav-button');
        const subSections = adminContainer.querySelectorAll('.sub-section');

        adminContainer.addEventListener('click', (event) => {
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

    // Further logic for fetching users, games, and reports will be added here.
});
