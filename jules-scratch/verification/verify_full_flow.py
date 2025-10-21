from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.set_default_timeout(5000)

    try:
        # 1. Go to the app
        page.goto("http://localhost:8000")
        expect(page).to_have_title("ChatWey")

        # 2. Navigate to the Chat screen to see the request
        page.locator('.nav-item[data-screen="chat-screen"]').click()
        chat_screen = page.locator("#chat-screen")
        expect(chat_screen).to_be_visible()

        letter = page.locator(".letter-container")
        expect(letter).to_be_visible()
        page.screenshot(path="jules-scratch/verification/01_chat_screen_with_letter.png")
        print("Screenshot 1: Chat screen with letter.")

        # 3. Click the letter to open it
        letter.click()
        time.sleep(0.6) # Wait for animation to complete

        letter_content = letter.locator(".letter-content")
        expect(letter_content).to_be_visible()
        page.screenshot(path="jules-scratch/verification/02_letter_opened.png")
        print("Screenshot 2: Letter opened.")

        # 4. Accept the request
        letter_content.locator("button.accept").click()

        # The letter should disappear from the chat
        expect(letter).not_to_be_visible()

        # 5. Navigate back to Conocer screen to verify the couple card
        page.locator('.nav-item[data-screen="conocer-screen"]').click()
        conocer_screen = page.locator("#conocer-screen")
        expect(conocer_screen).to_be_visible()

        # The order of names depends on the loop, so we check for the correct text
        couple_card = page.locator(".couple-card", has_text="Leo & Luna")
        expect(couple_card).to_be_visible()

        page.screenshot(path="jules-scratch/verification/03_final_couple_card.png")
        print("Screenshot 3: Final couple card verified.")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
