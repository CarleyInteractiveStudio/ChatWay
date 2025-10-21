from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 375, 'height': 812})
    page = context.new_page()

    try:
        page.goto("http://localhost:8000")

        # 1. Navigate to the Profile screen
        page.locator('.nav-item[data-screen="perfil-screen"]').click()

        # 2. Wait for the profile screen to be visible
        profile_screen = page.locator('#perfil-screen')
        expect(profile_screen).to_be_visible()

        # 3. Take a screenshot of the entire profile screen
        profile_screen.screenshot(path="jules-scratch/verification/profile_view_coupled.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
