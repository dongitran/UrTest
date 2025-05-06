require("dotenv").config();
const { createApiServer } = require("./api");

const port = process.env.API_PORT || 3000;

const app = createApiServer();
app.listen(port, () => {
  console.log(`Keyword Extractor API server running on port ${port}`);
});
