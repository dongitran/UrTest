CREATE OR REPLACE FUNCTION slugify(text) RETURNS text AS $$
  SELECT lower(
    regexp_replace(
      regexp_replace(
        regexp_replace($1, '[^\w\s-]', '', 'g'),
        '[\s]', '-', 'g'),
      '-+', '-', 'g')
    );
$$ LANGUAGE SQL IMMUTABLE;

ALTER TABLE tbl_projects
ADD COLUMN slug varchar(255) GENERATED ALWAYS AS (slugify(title)) STORED;

CREATE INDEX idx_projects_slug ON tbl_projects(slug);

CREATE UNIQUE INDEX idx_projects_unique_active_slug 
ON tbl_projects (slug) 
WHERE deleted_at IS NULL;