const pgp = require("pg-promise")();
require("dotenv").config();

const connectionString = process.env.JIRA_BRIDGE_PG_DATABASE_URL;
const db = pgp(connectionString);

db.connect()
  .then((obj) => {
    console.log("Database connection successful");
    obj.done();
  })
  .catch((error) => {
    console.error("ERROR:", error.message || error);
  });

module.exports = db;
