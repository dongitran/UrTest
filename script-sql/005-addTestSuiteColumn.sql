ALTER TABLE tbl_test_suites
ADD COLUMN tags TEXT[];

alter table tbl_test_suites
add column file_name varchar(255);
