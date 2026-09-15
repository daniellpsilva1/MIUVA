import { createServer } from 'node:http';
import { extname, join, normalize, parse, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = parse(fileURLToPath(import.meta.url)).dir;
const root = join(__dirname, '..');

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
};

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4173;

const server = createServer((req, res) => {
  let urlPath = req.url?.split('?')[0] || '/';
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const safePath = normalize(join(root, urlPath));
  if (!safePath.startsWith(root + sep) && safePath !== root) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  import('node:fs').then((fs) => {
    fs.promises.readFile(safePath).then((data) => {
      const ext = extname(safePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    }).catch(() => {
      res.writeHead(404);
      res.end('Not found');
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`EHDS dev server: http://localhost:${PORT}/`);
});
