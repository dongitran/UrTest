CREATE OR REPLACE FUNCTION slugify(text) RETURNS text AS $$
DECLARE
  result text;
BEGIN
  result := $1;
  result := regexp_replace(result, '[áàảãạâấầẩẫậăắằẳẵặ]', 'a', 'g');
  result := regexp_replace(result, '[éèẻẽẹêếềểễệ]', 'e', 'g');
  result := regexp_replace(result, '[íìỉĩị]', 'i', 'g');
  result := regexp_replace(result, '[óòỏõọôốồổỗộơớờởỡợ]', 'o', 'g');
  result := regexp_replace(result, '[úùủũụưứừửữự]', 'u', 'g');
  result := regexp_replace(result, '[ýỳỷỹỵ]', 'y', 'g');
  result := regexp_replace(result, '[đ]', 'd', 'g');
  
  result := regexp_replace(result, '[^\w\s-]', '', 'g');
  
  result := regexp_replace(result, '[\s]', '-', 'g');
  
  result := regexp_replace(result, '-+', '-', 'g');
  
  result := lower(result);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP INDEX IF EXISTS idx_projects_unique_active_slug;
DROP INDEX IF EXISTS idx_projects_slug;

ALTER TABLE tbl_projects
DROP COLUMN slug;

ALTER TABLE tbl_projects
ADD COLUMN slug varchar(255) GENERATED ALWAYS AS (slugify(title)) STORED;


CREATE UNIQUE INDEX idx_projects_unique_active_slug 
ON tbl_projects (slug) 
WHERE deleted_at IS NULL;