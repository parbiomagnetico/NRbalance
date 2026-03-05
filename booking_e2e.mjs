import { chromium } from 'playwright';

(async () => {
    console.log('[E2E TEST] Inciando navegador...');
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

    // Catch errors
    page.on('console', msg => { if (msg.type() === 'error') console.log('BROWSER ERR:', msg.text()); });
    page.on('pageerror', error => console.log('PAGE ERR:', error.message));

    await page.goto('http://localhost:4321');
    await page.waitForTimeout(1000);

    console.log('[E2E TEST] Step 1: Seleccionando servicio...');
    const btn = await page.$('.service-option');
    if (!btn) throw new Error("No service-option found");
    await btn.click();

    // Wait for the step 2 transition
    await page.waitForTimeout(1000);

    console.log('[E2E TEST] Step 2: Seleccionando fecha...');
    // Click the 14th day of the month (just picking a middle date)
    const days = await page.$$('.calendar-day:not(.disabled)');
    if (days.length === 0) throw new Error("No available days in calendar");

    // Let's click the first valid day after today
    await days[1].click();

    // Wait for time slots from the API
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e_slots_loaded.png' });

    console.log('[E2E TEST] Step 2: Seleccionando slot de tiempo...');
    const slots = await page.$$('.time-slot');
    if (slots.length === 0) throw new Error("No time slots loaded from API");
    await slots[0].click();

    // Wait for the step 3 transition
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e_form_screen.png' });

    console.log('[E2E TEST] Step 3: Rellenando formulario y haciendo POST...');
    const inputs = await page.$$('input');
    await inputs[0].fill('Test Auto Playwright');
    await inputs[1].fill('test@nrbalance.es'); // Replace with valid test email
    await inputs[2].fill('+34600123456');

    // Click submit
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    console.log('[E2E TEST] Esperando respuesta del server...');
    // Increase wait time to allow for Google Calendar + Resend API calls
    await page.waitForTimeout(6000);

    // Save final screenshot
    await page.screenshot({ path: 'e2e_final_result.png' });
    console.log('[E2E TEST] Final result screenshot saved to e2e_final_result.png');

    await browser.close();
})();
