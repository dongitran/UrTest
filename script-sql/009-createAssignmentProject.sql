CREATE TABLE tbl_project_assignments (
    id            VARCHAR(255) PRIMARY KEY NOT NULL,
    project_id    VARCHAR(255) NOT NULL,
    user_email    VARCHAR(255) NOT NULL,
    params        JSONB,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by    VARCHAR(255),
    updated_at    TIMESTAMP WITH TIME ZONE,
    updated_by    VARCHAR(255),
    deleted_at    TIMESTAMP WITH TIME ZONE,
    deleted_by    VARCHAR(255),
    CONSTRAINT fk_project
        FOREIGN KEY (project_id)
        REFERENCES tbl_projects(id)
);

CREATE INDEX idx_project_assignments_project_id ON tbl_project_assignments(project_id);
CREATE INDEX idx_project_assignments_user_email ON tbl_project_assignments(user_email);