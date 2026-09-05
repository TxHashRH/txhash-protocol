/**
 * A static server for `public/`, for looking at the document locally.
 *
 * It is not part of the build and nothing is checked through it. Pick a free
 * port with PORT if the default is taken.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const PORT = Number(process.env.PORT) || 47821;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};

createServer((req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);

  /* Resolve, then confirm the result is still inside ROOT. Checking the request
     string for ".." instead would miss encoded and platform-specific forms; the
     resolved path is the thing that actually gets read. */
  const target = resolve(ROOT, `.${normalize(path)}`);
  if (target !== ROOT && !target.startsWith(ROOT + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  const file = existsSync(target) && statSync(target).isDirectory() ? resolve(target, 'index.html') : target;

  if (!existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
    return;
  }

  res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`serving ${ROOT} at http://127.0.0.1:${PORT}\n`);
});
