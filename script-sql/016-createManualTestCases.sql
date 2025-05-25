CREATE TYPE manual_test_case_status AS ENUM ('Not Started', 'In Progress', 'Passed', 'Failed');
ALTER TYPE manual_test_case_status ADD VALUE 'Draft';

CREATE TYPE manual_test_case_priority AS ENUM ('Low', 'Medium', 'High');

CREATE TYPE manual_test_case_category AS ENUM ('functional', 'ui', 'integration', 'api', 'performance', 'security');

CREATE TYPE bug_status_type AS ENUM ('none', 'bug', 'fixed', 'testing', 'pending');

CREATE TABLE tbl_manual_test_cases (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category manual_test_case_category NOT NULL,
    priority manual_test_case_priority DEFAULT 'Medium',
    estimated_time INTEGER,
    description TEXT NOT NULL,
    assigned_to VARCHAR(255),
    assigned_to_email VARCHAR(255),
    due_date TIMESTAMPTZ,
    status manual_test_case_status DEFAULT 'Not Started',
    bug_status_type bug_status_type DEFAULT 'none',
    bug_reporter VARCHAR(255),
    bug_message VARCHAR(255),
    tags TEXT[],
    notes TEXT,
    execution_history JSONB DEFAULT '[]'::jsonb,
    params JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(255),
    
    FOREIGN KEY (project_id) REFERENCES tbl_projects(id)
);

CREATE INDEX idx_manual_test_cases_project_id ON tbl_manual_test_cases(project_id);
CREATE INDEX idx_manual_test_cases_status ON tbl_manual_test_cases(status);
CREATE INDEX idx_manual_test_cases_assigned_to ON tbl_manual_test_cases(assigned_to_email);
CREATE INDEX idx_manual_test_cases_created_at ON tbl_manual_test_cases(created_at);

CREATE INDEX idx_manual_test_cases_project_active ON tbl_manual_test_cases(project_id) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_manual_test_cases_assigned_active ON tbl_manual_test_cases(assigned_to_email) 
WHERE deleted_at IS NULL AND assigned_to_email IS NOT NULL;

