CREATE TABLE tbl_test_resource
(
    id          varchar(255) unique NOT NULL,
    project_id  varchar(255)        NOT NULL,
    title       varchar(255)        not null,
    description text                not null,
    content     text                not null,
    params      jsonb               NULL,
    created_at  timestamptz         NOT NULL,
    created_by  varchar(255)        NOT NULL,
    updated_at  timestamptz,
    updated_by  varchar(255),
    deleted_at  timestamptz,
    deleted_by  varchar(255),
    PRIMARY KEY (id)
);
ALTER TABLE tbl_test_resource
ADD COLUMN file_name varchar(255) GENERATED ALWAYS AS (slugify(title)) STORED not null;
