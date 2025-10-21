import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Go to the local file
        await page.goto(f"file:///app/index.html")

        # Find and click the "Mundo" navigation item
        mundo_button = page.locator('.nav-item[data-screen="mundo-screen"]')
        await expect(mundo_button).to_be_visible()
        await mundo_button.click()

        # Check that the "Mundo" screen is now active
        mundo_screen = page.locator("#mundo-screen")
        await expect(mundo_screen).to_have_class("screen active")

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/mundo_screen_visible.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
