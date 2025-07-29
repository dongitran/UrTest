CREATE TABLE remote_link_locks (
  id SERIAL PRIMARY KEY,
  issue_key VARCHAR(255) NOT NULL,
  test_suite_id VARCHAR(255) NOT NULL,
  application_type VARCHAR(255),
  application_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE UNIQUE INDEX unique_test_suite_id_idx 
ON remote_link_locks (test_suite_id) 
WHERE deleted_at IS NULL;