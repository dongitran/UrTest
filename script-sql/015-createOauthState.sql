CREATE TABLE IF NOT EXISTS oauth_states (
    id SERIAL PRIMARY KEY,
    state VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    callback_url TEXT,
    keycloak_access_token TEXT,
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_email ON oauth_states(email);