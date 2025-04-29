CREATE TYPE enum_testsuite_execute_status AS ENUM ('pending', 'processing', 'success', 'failed');
CREATE TABLE tbl_testsuite_execute
(
    id           varchar(255) unique           NOT NULL,
    testsuite_id varchar(255)                  not null,
    status       enum_testsuite_execute_status not null,
    params       jsonb                         NULL,
    created_at   timestamptz                   NOT NULL,
    created_by   varchar(255)                  NOT NULL,
    updated_at   timestamptz,
    updated_by   varchar(255),
    deleted_at   timestamptz,
    deleted_by   varchar(255),
    PRIMARY KEY (id)
);
