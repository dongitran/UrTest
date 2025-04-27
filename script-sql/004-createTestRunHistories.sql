CREATE TYPE test_environment AS ENUM ('dev', 'staging', 'production');

CREATE TABLE tbl_test_run_histories (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    test_suite_id VARCHAR(255) NOT NULL,
    run_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    skipped_tests INTEGER DEFAULT 0,
    duration NUMERIC(10, 2) DEFAULT 0,
    progress INTEGER DEFAULT 0,
    failed_test_details JSONB,
    run_by VARCHAR(255),
    environment test_environment DEFAULT 'dev',
    version VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    params JSONB,
    FOREIGN KEY (project_id) REFERENCES tbl_projects(id),
    FOREIGN KEY (test_suite_id) REFERENCES tbl_test_suites(id)
);

CREATE INDEX idx_test_run_histories_project_id ON tbl_test_run_histories(project_id);
CREATE INDEX idx_test_run_histories_test_suite_id ON tbl_test_run_histories(test_suite_id);
CREATE INDEX idx_test_run_histories_run_date ON tbl_test_run_histories(run_date);