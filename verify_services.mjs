import { chromium } from 'playwright';

(async () => {
    console.log('Inciando navegador para verificar Services...');
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto('http://localhost:4321');
    await page.waitForTimeout(2000); // Wait for initial load

    console.log('Haciendo scroll hasta la sección Services...');

    // Find the services section and scroll it into view
    const servicesSection = await page.$('#services');
    if (servicesSection) {
        await servicesSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        // Scroll down a bit more to trigger the sticky effect on the left column
        // We know the header is about 800px tall roughly, let's scroll by 800px
        await page.mouse.wheel(0, 800);
        await page.waitForTimeout(1000); // Wait for GSAP / sticky to settle

        await page.screenshot({ path: 'services_split_screen_1.png' });
        console.log('Captura 1 guardada (Mente).');

        // Scroll down to the second category (Cuerpo)
        await page.mouse.wheel(0, 1500);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'services_split_screen_2.png' });
        console.log('Captura 2 guardada (Cuerpo).');
    } else {
        console.log('ERROR: No se encontró la sección #services');
    }

    await browser.close();
})();
