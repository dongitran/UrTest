CREATE TABLE tbl_activity_logs (
  id VARCHAR(255) PRIMARY KEY,
  activity_type VARCHAR(50) NOT NULL,
  project_id VARCHAR(255) NOT NULL,
  target_id VARCHAR(255),
  target_type VARCHAR(50),
  user_email VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  created_by VARCHAR(255),
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(255),
  deleted_at TIMESTAMPTZ,
  deleted_by VARCHAR(255),
  
  FOREIGN KEY (project_id) REFERENCES tbl_projects(id)
);

CREATE INDEX idx_activity_logs_project_id ON tbl_activity_logs(project_id);
CREATE INDEX idx_activity_logs_created_at ON tbl_activity_logs(created_at);