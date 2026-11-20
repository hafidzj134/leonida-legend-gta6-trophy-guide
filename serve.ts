// A small local preview server for the Leonida Legend guide.
// Usage: node serve.ts [--port 8123]
// It serves the files in app/ on 127.0.0.1 with the content types a
// browser needs, answers 404 for anything missing, and refuses paths
// that try to climb out of app/. Development use only.
import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

const argv = process.argv.slice(2);
const portFlag = argv.indexOf('--port');
const parsedPort = portFlag >= 0 ? Number(argv[portFlag + 1]) : 8080;
const listenPort = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : 8080;

const CONTENT_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.woff2', 'font/woff2'],
]);

const server = createServer((req, res) => {
  let rawPath;
  try {
    rawPath = decodeURIComponent(new URL(req.url ?? '/', 'http://127.0.0.1').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (rawPath.endsWith('/')) rawPath += 'index.html';
  const target = resolve(join(appRoot, normalize(rawPath)));
  if (target !== appRoot && !target.startsWith(appRoot + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let body;
  try {
    if (!statSync(target).isFile()) throw new Error('not a file');
    body = readFileSync(target);
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': CONTENT_TYPES.get(extname(target).toLowerCase()) ?? 'application/octet-stream',
    'content-length': body.length,
    'cache-control': 'no-store',
  });
  res.end(body);
});

server.listen(listenPort, '127.0.0.1', () => {
  console.log('app/ is on http://localhost:' + listenPort);
});
