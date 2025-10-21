import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Go to the local file
        await page.goto(f"file:///app/index.html")

        # 1. Click on "Mundo" nav item
        await page.locator('.nav-item[data-screen="mundo-screen"]').click()

        # 2. Click on the "Comunidad" group card
        await page.locator('.group-card').click()

        # 3. Wait for the individual chat screen to be visible
        chat_screen = page.locator("#individual-chat-screen")
        await expect(chat_screen).to_be_visible()

        # 4. Verify the header title is "Comunidad"
        header_name = page.locator("#chat-header-name")
        await expect(header_name).to_have_text("Comunidad")

        # 5. Verify that at least one sender name is visible
        sender_name = page.locator(".sender-name").first
        await expect(sender_name).to_be_visible()

        # 6. Take a screenshot
        await page.screenshot(path="jules-scratch/verification/group_chat_view.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
