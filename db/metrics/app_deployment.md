# App Deployment

This document explains how to create the things needed to deploy the app, and then deploy the app.

Prerequisites:

- [Initial Setup](./initial_setup.md) must be completed.
- [Data Deployment](./data_deployment.md) must be completed.
- The person doing this must use the Owner Role used in the Initial Setup as their active role.
- The person doing this must have NodeJS installed (At least version 24).
- The person doing this must have a Container builder installed.
  - The examples use Podman.
  - Docker could be used instead, just replace `podman` with `docker` commands.

Additionally:

- Make sure you have your database set to the correct one from Initial Setup.
- Make sure you are using the Owner role defined from Initial Setup.

## Create Image Repository

Make the Image Respository to hold the images.

```sql
CREATE IMAGE REPOSITORY IF NOT EXISTS SF_METRICS.CONTAINERS;
```

## Update Source for Your Snowflake

Search the `ui` folder for the string `getQueryProfileUrl`.
Update the return value with your snowflake account, replacing `[ORG_NAME]` and `[ACCOUNT_NAME]` with the appropriate values.
This is used to link to the Snowflake Query Profile for a specific query id.

## Build and Deploy the Image

These examples are using Powershell.

- Make sure to replace `[CONNECTION-NAME]` with the name of your connection in the SnowCLI configuration.
- Make sure to replace `[ACCOUNT-NAME]` with the name of your Snowflake account.
- Make sure to replace `[DB_NAME]` with the name of the database being used. Must be **lowercase**.

Log in to the registry. Example uses a connection that is set for RSA key.

```
$env:PRIVATE_KEY_PASSPHRASE='value goes here'
snow spcs image-registry token --format=JSON --connection=[CONNECTION-NAME] | podman login [ACCOUNT-NAME].registry.snowflakecomputing.com -u 0sessiontoken --password-stdin
```

Build and push the container.
This example assumes the Docker file `./scripts/sf_metrics/Dockerfile`, update as needed.

```
$imagename = "app_sf_metrics"
$reponame = "[ACCOUNT-NAME].registry.snowflakecomputing.com/[DB_NAME]/sf_metrics/containers"
$tagname = "latest"

podman build . -f scripts/sf_metrics/Dockerfile -t "$($reponame)/$($imagename):$($tagname)"
podman push "$($reponame)/$($imagename):$($tagname)"
```

## Create the Service

Update the following SQL as needed in the following places

- `[COMPUTE_POOL_NAME]` should be replaced with the name of the compute pool from initial setup.
- `[DB_NAME]` should be replaced with the database from initial setup. Note: this must be **lowercase**.
- `[QUERY_WAREHOUSE]` should be replaced with the query warehouse from initial setup. It is in 2 locations.

Optionally:

- Update the QUERY_TAG to be anything you want.
- Update the APP_NAME to be something else.
  - It must start with a letter and contain only letters, numbers, or underscore `[A-Z0-9_]`. Otherwise the app will fail to start.
- Update the COMMENT to be anything you want.

```sql
CREATE SERVICE SF_METRICS.APP_SF_METRICS
  IN COMPUTE POOL [COMPUTE_POOL_NAME]
  FROM SPECIFICATION_TEMPLATE $$
    spec:
      containers:
        - name: app-sf-metrics
          image: /[DB_NAME]/sf_metrics/containers/app_sf_metrics:latest
          env:
            PORT: {{ port }}
            LOG_LEVEL: INFO
            QUERY_TAG: SF Metrics
            APP_NAME: SF_METRICS
            SNOWFLAKE_WAREHOUSE: [QUERY_WAREHOUSE]
      endpoints:
        - name: app-sf-metrics
          port: {{ port }}
          public: true
    capabilities:
      securityContext:
        executeAsCaller: true
  $$
  USING (port=>3000)
  QUERY_WAREHOUSE = '[QUERY_WAREHOUSE]'
  COMMENT = 'Snowflake Metrics App'
;
```

### Redeploy After an Image Change

If you update the image, the app will continue to use the old image.
You must re-deploy the service definition in order for it to use the new image.

Make sure to update it like you did when creating it.

```sql
ALTER SERVICE SF_METRICS.APP_SF_METRICS
  FROM SPECIFICATION_TEMPLATE $$
    spec:
      containers:
        - name: app-sf-metrics
          image: /[DB_NAME]/sf_metrics/containers/app_sf_metrics:latest
          env:
            PORT: {{ port }}
            LOG_LEVEL: INFO
            QUERY_TAG: SF Metrics
            APP_NAME: SF_METRICS
            SNOWFLAKE_WAREHOUSE: [QUERY_WAREHOUSE]
      endpoints:
        - name: app-sf-metrics
          port: {{ port }}
          public: true
    capabilities:
      securityContext:
        executeAsCaller: true
  $$
  USING (port=>3000)
;
```

## Grant Access to End Users

Access to the App Service depends upon a Service Role for the application.
This application does not explicitly define any service roles.
Therefore, you will use the default for it.

This default service role is automatically created when the Service is created.
Therefore, you cannot grant it until after that Service is created.

```sql
GRANT SERVICE ROLE SF_METRICS.APP_SF_METRICS!all_endpoints_usage TO DATABASE ROLE SF_METRICS_VIEW;
```

Make sure your active database is the correct one for the app's schema.

## Test It

First you will need to get the URL to the service.

```sql
SHOW ENDPOINTS IN SERVICE SF_METRICS.APP_SF_METRICS;
```

It will be the `ingress_url` in the result of the above query.

Paste that in the browser.
If everything is started and running fine, you should see the app.

**Note**: It may take a several minutes after you create the Service until the `ingress_url` exists.
There will be a message in the field if it does not yet exist.
