const db = require("../config/db");
const jiraService = require("./jiraService");

const linkService = {
  async checkAndCreateLink(
    issueKey,
    testSuiteUrl,
    applicationType,
    applicationName,
    email
  ) {
    try {
      return await db.tx(async (t) => {
        const existingLink = await t.oneOrNone(
          "SELECT * FROM remote_link_locks WHERE issue_key = $1 AND test_suite_url = $2 AND deleted_at IS NULL",
          [issueKey, testSuiteUrl]
        );

        if (existingLink) {
          return {
            isNew: false,
            linkData: existingLink,
          };
        }

        const newLink = await t.one(
          `INSERT INTO remote_link_locks(
            issue_key, test_suite_url, application_type, application_name, 
            email, created_at, updated_at, deleted_at
          ) VALUES(
            $1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
          ) RETURNING *`,
          [issueKey, testSuiteUrl, applicationType, applicationName, email]
        );

        return {
          isNew: true,
          linkData: newLink,
        };
      });
    } catch (error) {
      console.error("Error checking and creating link:", error);
      throw error;
    }
  },

  async deleteLink(issueKey, testSuiteUrl, email) {
    try {
      const remoteLinks = await jiraService.getRemoteLinks(email, issueKey);

      const linkToDelete = remoteLinks.find(
        (link) => link.object && link.object.url === testSuiteUrl
      );

      if (linkToDelete && linkToDelete.id) {
        await jiraService.deleteRemoteLink(email, issueKey, linkToDelete.id);
      }

      await db.none(
        "UPDATE remote_link_locks SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE issue_key = $1 AND test_suite_url = $2 AND deleted_at IS NULL",
        [issueKey, testSuiteUrl]
      );

      return true;
    } catch (error) {
      console.error("Error deleting link:", error);
      throw error;
    }
  },
};

module.exports = linkService;
