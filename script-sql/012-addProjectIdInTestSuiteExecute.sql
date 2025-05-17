ALTER TABLE tbl_testsuite_execute
ADD COLUMN project_id varchar(255);

UPDATE tbl_testsuite_execute e
SET project_id = s.project_id
FROM tbl_test_suites s
WHERE e.testsuite_id = s.id;

ALTER TABLE tbl_testsuite_execute 
ALTER COLUMN testsuite_id DROP NOT NULL;

CREATE INDEX idx_testsuite_execute_project_id ON tbl_testsuite_execute(project_id);

ALTER TABLE tbl_testsuite_execute
ADD CONSTRAINT fk_testsuite_execute_project
FOREIGN KEY (project_id) REFERENCES tbl_projects(id);