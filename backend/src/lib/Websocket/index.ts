import checkStatusTestSuite from "./checkStatusTestSuite";

export default {
  open() {
    console.log("🟢 WebSocket connected");
  },
  message(ws: Bun.ServerWebSocket<unknown>, message: string | Buffer<ArrayBufferLike>) {
    //! Chỉ xử lý cho trường hợp là string
    console.log("💬 Received:", message);
    let data;
    if (typeof message === "string") {
      try {
        data = JSON.parse(message);
      } catch (error) {}
      if (data.key === "checkStatusTestSuite") {
        checkStatusTestSuite(ws, data);
      }
    }
  },
  close() {
    console.log("🔴 WebSocket closed");
  },
};
