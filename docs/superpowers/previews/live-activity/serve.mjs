// Tiny static server for the Live Activity preview. Serves the repo root so the
// page can load the app's real lantern image and Amiri Quran font.
//   node docs/superpowers/previews/live-activity/serve.mjs   ->  http://localhost:5179
/* global process, console */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// The repo root, four levels up from this file — not the cwd, so the server
// works whichever folder starts it.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const PORT = Number(process.env.PORT) || 5179;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') {
      res.writeHead(302, { Location: '/docs/superpowers/previews/live-activity/' });
      return res.end();
    }
    let file = path.join(ROOT, urlPath);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end();
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not found');
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Live Activity preview on http://localhost:${PORT}`));
