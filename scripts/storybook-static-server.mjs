// storybook-static/ を配信する検査用の静的サーバー。
// Playwright の webServer から `node scripts/storybook-static-server.mjs <port>` で起動する。
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
  console.error("使い方：node scripts/storybook-static-server.mjs <port>");
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../storybook-static");
if (!existsSync(path.join(root, "index.json"))) {
  console.error(
    `${root} に Storybook の静的ビルドがありません。先に pnpm build-storybook を実行してください。`,
  );
  process.exit(1);
}

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
  [".txt", "text/plain; charset=utf-8"],
]);

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
    const pathname = decodeURIComponent(url.pathname);
    const relativePath = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    const filePath = path.join(root, relativePath);

    if (!filePath.startsWith(root + path.sep)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }

    const fileStat = await stat(filePath).catch(() => null);
    if (fileStat === null || !fileStat.isFile()) {
      response.writeHead(404);
      response.end("not found");
      return;
    }

    response.writeHead(200, {
      "content-type":
        contentTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream",
      "content-length": fileStat.size,
      "cache-control": "no-store",
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    console.error(error);
    response.writeHead(500);
    response.end("internal server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`storybook-static を http://127.0.0.1:${port} で配信しています`);
});
