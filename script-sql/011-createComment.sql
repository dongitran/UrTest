CREATE TABLE tbl_comments (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    testsuite_id VARCHAR(255),
    resource_id VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    params JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(255),
    
    CONSTRAINT fk_comment_project FOREIGN KEY (project_id) REFERENCES tbl_projects(id),
    CONSTRAINT fk_comment_testsuite FOREIGN KEY (testsuite_id) REFERENCES tbl_test_suites(id),
    CONSTRAINT fk_comment_resource FOREIGN KEY (resource_id) REFERENCES tbl_test_resource(id)
);

CREATE INDEX idx_comments_project_id ON tbl_comments(project_id);
CREATE INDEX idx_comments_testsuite_id ON tbl_comments(testsuite_id);
CREATE INDEX idx_comments_resource_id ON tbl_comments(resource_id);
CREATE INDEX idx_comments_email ON tbl_comments(email);
CREATE INDEX idx_comments_created_at ON tbl_comments(created_at);

CREATE INDEX idx_comments_project_testsuite_active ON tbl_comments(project_id, testsuite_id) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_comments_project_resource_active ON tbl_comments(project_id, resource_id) 
WHERE deleted_at IS NULL;