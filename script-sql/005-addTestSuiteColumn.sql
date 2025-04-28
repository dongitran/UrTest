ALTER TABLE tbl_test_suites
ADD COLUMN tags TEXT[];

ALTER TABLE tbl_test_suites
ADD COLUMN file_name varchar(255) GENERATED ALWAYS AS (slugify(name)) STORED;
