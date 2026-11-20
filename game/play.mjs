// Complete the latte order with keyboard input and read the public game state.
export async function play(page, { seconds, t0 }) {
  const keyboard = page.keyboard;
  await page.waitForFunction(() => !!window.__game?.state, null, { timeout: 90000 });
  const read = () => page.evaluate(() => window.__game.state);
  const end = t0 + seconds * 1000 - 200;
  let arcKeyDown = false;
  while (Date.now() < end) {
    const s = await read();
    if (!s) break;
    if (s.phase === 'title') {
      await keyboard.press('Enter');
    } else if (s.phase === 'win') {
      await page.waitForTimeout(2500);
      break;
    } else if (s.phase === 'play') {
      if (s.whisking) {
        await keyboard.press('Space');
        await page.waitForTimeout(190);
      } else if (s.precisionPhase === 'line') {
        if (s.linePosition >= .697 && s.linePosition <= .713) await keyboard.press('Space');
      } else if (s.precisionPhase === 'arc') {
        if (!arcKeyDown) { await keyboard.down('Space'); arcKeyDown = true; }
        if (s.arcProgress >= .758) { await keyboard.up('Space'); arcKeyDown = false; }
      } else if (s.step < 9) {
        await keyboard.press(`Digit${s.step + 1}`);
        await page.waitForTimeout(650);
      }
    }
    await page.waitForTimeout(12);
  }
  if (arcKeyDown) await keyboard.up('Space');
}
