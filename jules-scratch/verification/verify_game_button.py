import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Go to the local file
        await page.goto(f"file:///app/index.html")

        # Find and click the "Game" navigation item
        game_button = page.locator('.nav-item[data-screen="game-screen"]')
        await expect(game_button).to_be_visible()
        await game_button.click()

        # Check that the "Game" screen is now active
        game_screen = page.locator("#game-screen")
        await expect(game_screen).to_have_class("screen active")

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/game_screen_visible.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
