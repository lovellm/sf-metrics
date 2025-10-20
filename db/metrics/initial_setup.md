# Initial Schema and Privilege Setup

The following information and commands will create all necessary objects and privileges for the app to be usable.

## Identify Needed Parameters

Before you begin, set the database and session variables to appropriate values.

```sql
SET DB_NAME='DB_NAME_HERE'; -- Must already exist
SET OWNER_ROLE='DEV_OWNER_ROLE_HERE'; -- Must already exist
SET COMPUTE_POOL_NAME='NAME_OF_COMPUTE_POOL'; -- Will be created if not already exists
SET QUERY_WAREHOUSE='WH_TO_USE_HERE'; -- Must already exist
USE DATABASE IDENTIFIER($DB_NAME);
```

The App Developer will also need these values when it comes time deploy the application.
So share those values as needed.

## Create Schema and Privileges

**Make the Schema**

```sql
CREATE SCHEMA IF NOT EXISTS SF_METRICS
  WITH MANAGED ACCESS
  COMMENT = 'Snowflake Metrics Application'
;
```

**Make Database Roles for the Schema**

```sql
-- Create the DEV/OWNER database role
CREATE DATABASE ROLE IF NOT EXISTS SF_METRICS_DEV;

-- Grant the database role to the owner account role
GRANT DATABASE ROLE SF_METRICS_DEV TO ROLE IDENTIFIER($OWNER_ROLE);

-- Add the needed privileges to the database role
GRANT USAGE ON SCHEMA SF_METRICS TO DATABASE ROLE SF_METRICS_DEV;
GRANT
  -- Minimum Required
  CREATE TABLE,
  CREATE VIEW,
  CREATE TASK,
  CREATE PROCEDURE,
  CREATE STAGE,
  CREATE SERVICE,
  CREATE IMAGE REPOSITORY,
  -- Others that may be useful or needed to add more functionality
  CREATE DYNAMIC TABLE,
  CREATE FUNCTION,
  CREATE MATERIALIZED VIEW,
  CREATE SEQUENCE,
  CREATE MASKING POLICY,
  CREATE ROW ACCESS POLICY,
  CREATE SECRET,
  CREATE STREAM,
  CREATE PIPE,
  CREATE NOTEBOOK,
  CREATE FILE FORMAT,
  ADD SEARCH OPTIMIZATION,
  CREATE STREAMLIT
ON SCHEMA SF_METRICS TO DATABASE ROLE SF_METRICS_DEV;

-- Add a viewer role to allow non developers to view the data.
-- This contains only minimum for app to work.
CREATE DATABASE ROLE IF NOT EXISTS SF_METRICS_VIEW;
GRANT USAGE ON SCHEMA SF_METRICS TO DATABASE ROLE SF_METRICS_VIEW;
GRANT SELECT ON ALL VIEWS IN SCHEMA SF_METRICS TO DATABASE ROLE SF_METRICS_VIEW;
GRANT SELECT ON FUTURE VIEWS IN SCHEMA SF_METRICS TO DATABASE ROLE SF_METRICS_VIEW;
-- Will also need the service role to execute the service.
-- Can only be granted after the service is created, so commented out here.
-- GRANT SERVICE ROLE SF_METRICS.APP_SF_METRICS!all_endpoints_usage TO DATABASE ROLE SF_METRICS_VIEW;
```

**Grant a Viewer Role Access to the Views**

If you need users in a role other than the owner role to use the app and run the queries, that role(s) will need to be given access.
Update the following SQL as appropriate and run for each desired role.

```sql
SET VIEWER_ROLE='VIEWER_ROLE_GOES_HERE';
GRANT DATABASE ROLE SF_METRICS_VIEW TO ROLE IDENTIFIER($VIEWER_ROLE);
-- If your chosen viewer role already has access to the warehouse, you can skip this
GRANT USAGE ON WAREHOUSE IDENTIFIER($QUERY_WAREHOUSE) TO ROLE IDENTIFIER($VIEWER_ROLE);
```

## Create the Compute Pool and Grant Access

You may re-use an existing compute pool.
Simply set the session variable to its name.

```sql
-- Create Compute Pool
CREATE COMPUTE POOL IF NOT EXISTS IDENTIFIER($COMPUTE_POOL_NAME)
  INSTANCE_FAMILY = CPU_X64_XS
  MIN_NODES = 1
  MAX_NODES = 1
  AUTO_RESUME = TRUE
  INITIALLY_SUSPENDED = TRUE
  AUTO_SUSPEND_SECS = 120
  COMMENT = 'Compute Pool for Snowflake Metrics App'
;
```

Give the owner role access to the Compute Pool.
At minimum, it requires `USAGE`.
`MONITOR` is useful for troubleshooting.
`OPERATE` is useful to allow the Dev role to SUSPEND / RESUME it on demand.
This is not needed since it will auto-resume when the Service starts and auto-suspend when the Service suspends.

```sql
GRANT USAGE, MONITOR, OPERATE
ON COMPUTE POOL IDENTIFIER($COMPUTE_POOL_NAME)
TO ROLE IDENTIFIER($OWNER_ROLE)
;
```

## Access to Allow a Web Endpoint

Grant the owner role the ability to `BIND SERVICE ENDPOINT`.
This is required to have a "Public Endpoint" for a Service.
That is, a Service that will expose any HTTP endpoint that can be accessed.
Without this, the Service can only be called from within a Function.

```sql
-- required for a service to be available via a url
GRANT BIND SERVICE ENDPOINT ON ACCOUNT TO ROLE IDENTIFIER($OWNER_ROLE);
```

## Caller Rights to Allow Queries as the User

Grant the owner role access to use CALLER Rights.
This is required for the Service to run queries as the logged in User rather than as itself.

```sql
-- allow a service to run queries as the user
GRANT CALLER USAGE ON DATABASE IDENTIFIER($DB_NAME) TO ROLE IDENTIFIER($OWNER_ROLE);
GRANT CALLER USAGE ON SCHEMA SF_METRICS TO ROLE IDENTIFIER($OWNER_ROLE);
GRANT INHERITED CALLER SELECT ON ALL VIEWS IN SCHEMA SF_METRICS TO ROLE IDENTIFIER($OWNER_ROLE);
GRANT CALLER USAGE ON WAREHOUSE IDENTIFIER($QUERY_WAREHOUSE) TO ROLE IDENTIFIER($OWNER_ROLE);
```

## Grant the Owner Role Access to the Needed Data

The Owner role needs to be granted appropriate access to the Snowflake Account Usage views.

```sql
-- For: DYNAMIC_TABLE_REFRESH_HISTORY, QUERY_ATTRIBUTION_HISTORY
-- SERVLESS_TASK_HISTORY, TASK_HISTORY
-- METERING_DAILY_HISTORY, SNOWPARK_CONTAINER_SERVICES_HISTORY
-- CORTEX_SEARCH_DAILY_USAGE_HISTORY, CORTEX_FUNCTIONS_USAGE_HISTORY
-- HYBRID_TABLE_USAGE_HISTORY, MATERIALIZED_VIEW_REFRESH_HISTORY
-- WAREHOUSE_EVENTS_HISTORY, WAREHOUSE_METERING_HISTORY
GRANT DATABASE ROLE SNOWFLAKE.USAGE_VIEWER TO ROLE IDENTIFIER($OWNER_ROLE);
-- For: QUERY_HISTORY, QUERY_ATTRIBUTION_HISTORY
GRANT DATABASE ROLE SNOWFLAKE.GOVERNANCE_VIEWER TO ROLE IDENTIFIER($OWNER_ROLE);
-- For: SESSIONS, USERS
GRANT DATABASE ROLE SNOWFLAKE.SECURITY_VIEWER TO ROLE IDENTIFIER($OWNER_ROLE);
-- For: HYBRID_TABLES
GRANT DATABASE ROLE SNOWFLAKE.OBJECT_VIEWER TO ROLE IDENTIFIER($OWNER_ROLE);
```

Alternatively, just grant all access

```sql
GRANT IMPORTED PRIVILEGES ON DATABASE SNOWFLAKE TO ROLE IDENTIFIER($OWNER_ROLE);
```

See [Snowflake Documentation on Account Usage](https://docs.snowflake.com/en/sql-reference/account-usage#account-usage-schema-snowflake-database-roles) for more information.

## (Optional) Access to View the Event Logs

Grant the Owner Role access to view the Event Logs.

This is needed to check the logs from the Service.
Anything written to `stdout` or `stderr` will be saved as a row in the Event Table.

```sql
GRANT APPLICATION ROLE SNOWFLAKE.EVENTS_ADMIN TO ROLE IDENTIFIER($OWNER_ROLE);
```
