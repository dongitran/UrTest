const TEST_SUITE_DRAFTS_KEY = "urtest_test_suite_drafts";

export const saveTestSuiteDraft = (projectId, testSuiteId, data) => {
  if (!projectId) return false;

  try {
    const draftsJson = localStorage.getItem(TEST_SUITE_DRAFTS_KEY);
    const drafts = draftsJson ? JSON.parse(draftsJson) : {};

    if (!drafts[projectId]) {
      drafts[projectId] = {};
    }

    const draftId = testSuiteId || "new";
    const currentDraft = drafts[projectId][draftId];

    if (!currentDraft) {
      drafts[projectId][draftId] = {
        ...data,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(TEST_SUITE_DRAFTS_KEY, JSON.stringify(drafts));
      return true;
    }

    const hasNameChanged = currentDraft.name !== data.name;
    const hasContentChanged = currentDraft.content !== data.content;

    let haveTagsChanged = false;
    if (currentDraft.tags && data.tags) {
      if (currentDraft.tags.length !== data.tags.length) {
        haveTagsChanged = true;
      } else {
        for (let i = 0; i < data.tags.length; i++) {
          if (currentDraft.tags[i] !== data.tags[i]) {
            haveTagsChanged = true;
            break;
          }
        }
      }
    } else {
      haveTagsChanged = currentDraft.tags !== data.tags;
    }

    if (hasNameChanged || hasContentChanged || haveTagsChanged) {
      drafts[projectId][draftId] = {
        ...data,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(TEST_SUITE_DRAFTS_KEY, JSON.stringify(drafts));
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error saving test suite draft:", error);
    return false;
  }
};

export const getTestSuiteDraft = (projectId, testSuiteId) => {
  if (!projectId) return null;

  try {
    const draftsJson = localStorage.getItem(TEST_SUITE_DRAFTS_KEY);
    if (!draftsJson) return null;

    const drafts = JSON.parse(draftsJson);
    if (!drafts[projectId]) return null;

    const draftId = testSuiteId || "new";
    return drafts[projectId][draftId] || null;
  } catch (error) {
    console.error("Error getting test suite draft:", error);
    return null;
  }
};

export const clearTestSuiteDraft = (projectId, testSuiteId) => {
  if (!projectId) return;

  try {
    const draftsJson = localStorage.getItem(TEST_SUITE_DRAFTS_KEY);
    if (!draftsJson) return;

    const drafts = JSON.parse(draftsJson);
    if (!drafts[projectId]) return;

    const draftId = testSuiteId || "new";

    if (drafts[projectId][draftId]) {
      delete drafts[projectId][draftId];
      localStorage.setItem(TEST_SUITE_DRAFTS_KEY, JSON.stringify(drafts));
    }
  } catch (error) {
    console.error("Error clearing test suite draft:", error);
  }
};

export const hasTestSuiteDraft = (projectId, testSuiteId) => {
  return getTestSuiteDraft(projectId, testSuiteId) !== null;
};

export const formatDraftSavedTime = (isoString) => {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} days ago`;
  } catch (error) {
    return "";
  }
};
