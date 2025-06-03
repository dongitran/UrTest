CREATE TYPE bug_severity AS ENUM ('Critical', 'High', 'Medium', 'Low');
CREATE TYPE bug_priority AS ENUM ('High', 'Medium', 'Low');
CREATE TYPE bug_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed', 'Reopened');

CREATE TABLE tbl_bugs (
    id VARCHAR(255) PRIMARY KEY UNIQUE NOT NULL,
    manual_test_case_id VARCHAR(255) NOT NULL REFERENCES tbl_manual_test_cases(id),
    project_id VARCHAR(255) NOT NULL REFERENCES tbl_projects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity bug_severity DEFAULT 'Medium' NOT NULL,
    priority bug_priority DEFAULT 'Medium' NOT NULL,
    status bug_status DEFAULT 'Open' NOT NULL,
    assigned_to_email VARCHAR(255),
    reporter_email VARCHAR(255) NOT NULL,
    params JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(255)
);

CREATE INDEX idx_bugs_manual_test_case_id ON tbl_bugs(manual_test_case_id);
CREATE INDEX idx_bugs_project_id ON tbl_bugs(project_id);
CREATE INDEX idx_bugs_status ON tbl_bugs(status);
CREATE INDEX idx_bugs_assigned_to_email ON tbl_bugs(assigned_to_email);
CREATE INDEX idx_bugs_reporter_email ON tbl_bugs(reporter_email);