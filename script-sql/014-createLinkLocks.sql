CREATE TABLE remote_link_locks (
  id SERIAL PRIMARY KEY,
  issue_key VARCHAR(255) NOT NULL,
  test_suite_url VARCHAR(1024) NOT NULL,
  application_type VARCHAR(255),
  application_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE UNIQUE INDEX unique_issue_test_suite_idx 
ON remote_link_locks (issue_key, test_suite_url) 
WHERE deleted_at IS NULL;
