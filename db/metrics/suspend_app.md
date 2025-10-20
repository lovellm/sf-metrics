# Suspend the App

The Compute Pool, as defined in the initial setup,
will automatically suspend itself if all apps assigned to it are suspended.
Therefore, cost can be reduced by suspending the app during times when it is not expected to be used.

## Auto Resume

Both the App Service and the Compute Pool are set up for Auto Resume.
If someone tries to access the App Service while it is suspended, it will automatically start.
When it does this, the Compute Pool will also automatically start.

**Note:** When you access the App Service while it is suspended, you will get a generic
error response (in JSON format) that the service is not running.
This is expected, as resuming the App Service and Compute Pool is not instantaneous.
Wait 1-2 minutes then refresh the page and it should work.

## Suspend the App

You can manually suspend the app with SQL.

```sql
ALTER SERVICE SF_METRICS.APP_SF_METRICS SUSPEND;
```

The Compute Pool will automatically suspend based on its auto suspend setting.

## Schedule the App to Suspend

The easiest way is to have a Task run the suspend command at times when you do not expect the app to be used.

If someone tries using the app during these times, it will resume and they will be able to use it.
However, it will get suspended again based on its schedule.
Continued use will again resume it, but working with it may be interrupted.

In these examples, make sure you update the Warehouse and CRON schedule to be appropriate.

**Suspend During the Weekend**

This example runs every hour during the weekend and suspends the app.

```sql
CREATE OR REPLACE TASK SF_METRCIS.T_STOP_APP_WEEKEND
  WAREHOUSE = SOME_XSMALL_WAREHOUSE
  SCHEDULE = 'USING CRON 14 * * * SAT,SUN America/Chicago'
AS
  ALTER SERVICE SF_METRICS.APP_SF_METRICS SUSPEND
;

ALTER TASK SF_METRCIS.T_STOP_APP_WEEKEND RESUME;
```

**Suspend After Hours During the Week**

This example runs every hour during the week outside normal hours and suspends the app.

```sql
CREATE OR REPLACE TASK SF_METRCIS.T_STOP_APP_WEEK
  WAREHOUSE = SOME_XSMALL_WAREHOUSE
  SCHEDULE = 'USING CRON 14 0-7,18-23 * * MON-FRI America/Chicago'
AS
  ALTER SERVICE SF_METRCIS.APP_SF_METRICS SUSPEND
;

ALTER TASK SF_METRCIS.T_STOP_APP_WEEK RESUME;
```

**Warehouse for the Tasks**

The examples as they are written will not use or resume their warehouse.
They will only incur cloud services charges.

If you were to modify them to have a BEGIN/END or to call a procedure,
then they would resume a warehouse and have charges.

If that is the case, you may want to switch them to Serverless instead.
