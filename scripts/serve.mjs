#!/usr/bin/env node

import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const root = path.resolve("dist");
const port = Number(process.env.PORT ?? 8000);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const candidate = path.resolve(
      root,
      decodedPath === "/" ? "index.html" : decodedPath.slice(1),
    );

    if (!candidate.startsWith(`${root}${path.sep}`) && candidate !== root) {
      throw new Error("Caminho inválido");
    }

    let filePath = candidate;
    let stat;
    try {
      stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, "index.html");
        stat = await fs.stat(filePath);
      }
    } catch {
      filePath = path.join(root, "404.html");
      stat = await fs.stat(filePath);
      response.statusCode = 404;
    }

    if (!stat.isFile()) {
      throw new Error("Arquivo não encontrado");
    }

    response.setHeader(
      "Content-Type",
      contentTypes[path.extname(filePath).toLowerCase()] ??
        "application/octet-stream",
    );
    response.end(await fs.readFile(filePath));
  } catch {
    response.statusCode = 500;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Erro ao servir o site.");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Site disponível em http://127.0.0.1:${port}/`);
});
