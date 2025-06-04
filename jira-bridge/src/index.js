require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");
const jiraRoutes = require("../routes/jira");
const apiRoutes = require("../routes/api");
const { errorHandler } = require("../middleware/errorHandler");
const { isAuthenticated, setUserCookie } = require("../middleware/auth");
const keycloakAuth = require("../middleware/keycloakAuth");
const tokenService = require("../services/tokenService");

const app = express();
const JIRA_BRIDGE_PORT = process.env.JIRA_BRIDGE_PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.JIRA_BRIDGE_SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.JIRA_BRIDGE_NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(setUserCookie);

app.get("/", async (req, res) => {
  try {
    const { email, access_token, callback_url } = req.query;

    if (!email || !access_token || !callback_url) {
      return res.status(401).render("access-denied", {
        message:
          "Access denied. Invalid URL or missing required authentication information.",
      });
    }

    return keycloakAuth(req, res, async () => {
      const existingToken = await tokenService.getTokenByEmail(email);

      if (existingToken) {
        return res.redirect(
          `${callback_url}?status=success&email=${encodeURIComponent(email)}`
        );
      }

      res.render("connect-jira", {
        email,
        keycloakVerified: true,
        callback_url,
      });
    });
  } catch (error) {
    console.error("Error in home route:", error);
    res.status(500).render("error", {
      message: "An error occurred while processing your request.",
    });
  }
});

app.use("/auth", jiraRoutes);
app.use("/api", apiRoutes);

app.use(errorHandler);

app.listen(JIRA_BRIDGE_PORT, () => {
  console.log(`Server running on http://localhost:${JIRA_BRIDGE_PORT}`);
});
