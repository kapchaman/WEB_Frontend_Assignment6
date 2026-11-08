// Test dependency only; the assignment itself remains fully offline.
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('node:path');
const fs = require('node:fs');

(async function () {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => console.error(error.message));
  const dom = await JSDOM.fromFile(path.join(__dirname, '../dist/tests/index.html'), {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole
  });
  const start = Date.now();
  const timer = setInterval(function () {
    const result = dom.window.Assignment6TestResults;
    if (result) {
      console.log(JSON.stringify(result, null, 2));
      fs.writeFileSync(path.join(__dirname, 'latest-dom-results.json'), JSON.stringify(result, null, 2) + '\n');
      clearInterval(timer); dom.window.close(); process.exitCode = result.failed ? 1 : 0;
    } else if (Date.now() - start > 120000) {
      console.error('Timed out:', dom.window.document.body.textContent);
      clearInterval(timer); dom.window.close(); process.exitCode = 1;
    }
  }, 500);
})();
