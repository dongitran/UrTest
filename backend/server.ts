import websocket from "./src/lib/Websocket";
import app from "./src";

const serve = Bun.serve({
  routes: {
    "/health": () => new Response("OK"),
  },
  port: Bun.env.PORT,
  fetch: (req) => {
    const url = new URL(req.url);

    if (url.pathname === "/ws" && serve.upgrade) {
      serve.upgrade(req);
    }
    return app.fetch(req);
  },
  websocket,
});
console.log(`Server running on port http://localhost:${serve.port}`);
