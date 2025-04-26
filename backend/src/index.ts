import ErrorLog from "@middlewars/ErrorLog";
import { customLogger } from "@middlewars/index";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import MongoConfig from "./config/mongodb";
const app = new Hono();

MongoConfig.connectToMongoDB();

app.use(cors());
app.use(logger(customLogger));

app.onError(ErrorLog);

export default app;
