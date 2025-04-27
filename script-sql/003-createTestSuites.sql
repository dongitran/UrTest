CREATE TYPE test_suite_status AS ENUM ('Not Run', 'Running', 'Completed', 'Failed', 'Aborted');

CREATE TABLE tbl_test_suites (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    last_run_date TIMESTAMP WITH TIME ZONE,
    status test_suite_status DEFAULT 'Not Run',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(255),
    params JSONB,
    FOREIGN KEY (project_id) REFERENCES tbl_projects(id)
);

CREATE INDEX idx_test_suites_project_id ON tbl_test_suites(project_id);
CREATE INDEX idx_test_suites_status ON tbl_test_suites(status);
