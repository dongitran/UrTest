CREATE TABLE IF NOT EXISTS oauth_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at BIGINT NOT NULL,
  cloud_id VARCHAR(255),
  cloud_name VARCHAR(255),
  cloud_url VARCHAR(255),
  scopes TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS oauth_tokens_user_id_idx ON oauth_tokens(user_id);

ALTER TABLE oauth_tokens 
ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;

ALTER TABLE oauth_tokens 
ALTER COLUMN access_token DROP NOT NULL,
ALTER COLUMN refresh_token DROP NOT NULL;

CREATE INDEX IF NOT EXISTS oauth_tokens_deleted_at_idx ON oauth_tokens(deleted_at);

CREATE INDEX IF NOT EXISTS oauth_tokens_user_email_deleted_at_idx ON oauth_tokens(user_email, deleted_at);