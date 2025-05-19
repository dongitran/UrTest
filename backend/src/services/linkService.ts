import db from '../db/db';
import { RemoteLinkLocksTable } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import jiraService from './jiraService';
import dayjs from 'dayjs';

export interface CheckAndCreateLinkResult {
  isNew: boolean;
  linkData: any;
  wasRelinked?: boolean;
}

class LinkService {
  private findRemoteLinkByTestSuiteId(remoteLinks: any[], testSuiteId: string): any {
    let link = remoteLinks.find(
      (link: any) => link.object && link.object.url && link.object.url.includes(testSuiteId)
    );

    if (link) return link;

    link = remoteLinks.find(
      (link: any) =>
        link.object &&
        link.object.summary &&
        link.object.summary.includes(`TestSuite ID: ${testSuiteId}`)
    );

    if (link) return link;

    link = remoteLinks.find(
      (link: any) =>
        link.application &&
        (link.application.type === 'TestSuite' || link.application.name === 'UrTest') &&
        link.object &&
        link.object.title &&
        link.object.title.includes('Test Suite')
    );

    return link;
  }

  async checkAndCreateLink(
    issueKey: string,
    testSuiteId: string,
    applicationType: string,
    applicationName: string,
    email: string
  ): Promise<CheckAndCreateLinkResult> {
    try {
      const isConnected = await jiraService.checkJiraConnection(email);
      if (!isConnected) {
        throw new Error('No valid JIRA connection found. Please link your JIRA account first.');
      }

      const existingLinkByTestSuite = await db.query.RemoteLinkLocksTable.findFirst({
        where: and(
          eq(RemoteLinkLocksTable.testSuiteId, testSuiteId),
          isNull(RemoteLinkLocksTable.deletedAt)
        ),
      });

      if (existingLinkByTestSuite && existingLinkByTestSuite.issueKey === issueKey) {
        return {
          isNew: false,
          linkData: existingLinkByTestSuite,
          wasRelinked: false,
        };
      }

      if (existingLinkByTestSuite && existingLinkByTestSuite.issueKey !== issueKey) {
        try {
          const oldRemoteLinks = await jiraService.getRemoteLinks(
            email,
            existingLinkByTestSuite.issueKey
          );

          const oldLinkToDelete = this.findRemoteLinkByTestSuiteId(oldRemoteLinks, testSuiteId);

          if (oldLinkToDelete && oldLinkToDelete.id) {
            await jiraService.deleteRemoteLink(
              email,
              existingLinkByTestSuite.issueKey,
              oldLinkToDelete.id
            );
          }
        } catch (error) {
          console.error('Failed to remove old remote link from Jira:', error);
        }

        await db
          .update(RemoteLinkLocksTable)
          .set({
            deletedAt: dayjs().toISOString(),
            updatedAt: dayjs().toISOString(),
          })
          .where(eq(RemoteLinkLocksTable.id, existingLinkByTestSuite.id));
      }

      const newLink = await db
        .insert(RemoteLinkLocksTable)
        .values({
          issueKey,
          testSuiteId,
          applicationType,
          applicationName,
          email,
          createdAt: dayjs().toISOString(),
          updatedAt: dayjs().toISOString(),
        })
        .returning()
        .then((res) => res[0]);

      return {
        isNew: !existingLinkByTestSuite,
        linkData: newLink,
        wasRelinked: !!existingLinkByTestSuite,
      };
    } catch (error) {
      console.error('Error checking and creating link:', error);
      throw error;
    }
  }

  async deleteLink(issueKey: string, testSuiteId: string, email: string): Promise<boolean> {
    try {
      const isConnected = await jiraService.checkJiraConnection(email);

      if (isConnected) {
        try {
          const remoteLinks = await jiraService.getRemoteLinks(email, issueKey);
          const linkToDelete = this.findRemoteLinkByTestSuiteId(remoteLinks, testSuiteId);

          if (linkToDelete && linkToDelete.id) {
            await jiraService.deleteRemoteLink(email, issueKey, linkToDelete.id);
          }
        } catch (jiraError) {
          console.error(
            'Failed to delete remote link from JIRA (but will continue with local delete):',
            jiraError
          );
        }
      } else {
        console.log('JIRA connection not found, skipping JIRA remote link deletion');
      }

      const result = await db
        .update(RemoteLinkLocksTable)
        .set({
          deletedAt: dayjs().toISOString(),
          updatedAt: dayjs().toISOString(),
        })
        .where(
          and(
            eq(RemoteLinkLocksTable.issueKey, issueKey),
            eq(RemoteLinkLocksTable.testSuiteId, testSuiteId),
            isNull(RemoteLinkLocksTable.deletedAt)
          )
        )
        .returning();

      return true;
    } catch (error) {
      console.error('Error deleting link:', error);
      throw error;
    }
  }

  async getLinksByTestSuite(testSuiteId: string) {
    try {
      return await db.query.RemoteLinkLocksTable.findMany({
        where: and(
          eq(RemoteLinkLocksTable.testSuiteId, testSuiteId),
          isNull(RemoteLinkLocksTable.deletedAt)
        ),
      });
    } catch (error) {
      console.error('Error getting links by test suite:', error);
      throw error;
    }
  }

  async getLinksByIssue(issueKey: string) {
    try {
      return await db.query.RemoteLinkLocksTable.findMany({
        where: and(
          eq(RemoteLinkLocksTable.issueKey, issueKey),
          isNull(RemoteLinkLocksTable.deletedAt)
        ),
      });
    } catch (error) {
      console.error('Error getting links by issue:', error);
      throw error;
    }
  }

  async getLinksByUser(email: string) {
    try {
      return await db.query.RemoteLinkLocksTable.findMany({
        where: and(eq(RemoteLinkLocksTable.email, email), isNull(RemoteLinkLocksTable.deletedAt)),
        orderBy: (clm, { desc }) => desc(clm.createdAt),
      });
    } catch (error) {
      console.error('Error getting links by user:', error);
      throw error;
    }
  }

  async getTestSuiteLinkOwner(testSuiteId: string): Promise<string | null> {
    try {
      const link = await db.query.RemoteLinkLocksTable.findFirst({
        where: and(
          eq(RemoteLinkLocksTable.testSuiteId, testSuiteId),
          isNull(RemoteLinkLocksTable.deletedAt)
        ),
      });
      return link ? link.email : null;
    } catch (error) {
      console.error('Error getting test suite link owner:', error);
      throw error;
    }
  }
}

export default new LinkService();
