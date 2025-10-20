# Snowflake Metrics UI

Displays metrics about snowflake usage and cost.

## Update Source for Your Snowflake

Search the `ui` folder for the string `getQueryProfileUrl`.
Update the return value with your snowflake account, replacing `[ORG_NAME]` and `[ACCOUNT_NAME]` with the appropriate values.
This is used to link to the Snowflake Query Profile for a specific query id.
