# Server

A simple API server intended to be run inside of Snowflake Container Services.

## Functionality

- `/user` (GET/POST) - returns the current user and check roles.
- `/query` (POST) - runs a SELECT statement based on the provided JSON query definition.
- `/sf/api/v2/cortex/inference:complete` (POST) - proxies to the Cortex AI Rest API.
- `/sf/api/v2/databases/{database}/schemas/{schema}/cortex-search-services/{service}/query` (POST) - proxies to the Cortex Seaerch Rest API.

Currently no way call procedures or run insert/update/delete operations.

## Data Security

**/user**

The `/user` endpoint can only return information for the currently logged in user.
It will return their user id, and which of the provided roles the user is in.

**/query**

The `/query` endpoint checks all tables used within a query, with a "Deny by Default" approach.
In order for the query to generate, every table referenced in the query must be in the approapriate "Allow" list.
These lists are different depending on whether the request is to run as the Service (`serviceRead.json`), or as the User (`callerRead.json`).

The lists are an object containing a nested hierarchy, DB -> Schema -> Table -> true.
Any level of that hierarchy can be `*` to allow all values of that level (lower level checks still apply).

**/sf/api/v2/cortex/inference:complete**

Currently no security. Must be run using Service.
Probably possible to run as user if correct caller privileges are determined.

TODO: add config file to limit the models that can be used.

**/sf/api/v2/databases/{database}/schemas/{schema}/cortex-search-services/{service}/query**

Currently no security. Must be run using Service, so any search services it has access to are exposed.
Probably possible to run as user if correct caller privileges are determined.

TODO: add config file with same format as `/query` config files to specify which services can be used.

---

Additionally, once deployed, Snowflake role-based security must also be satisfied.
That is, the user must exist in Snowflake and be granted access to the Service that is running the container.

# Running Tests

Run all tests using `npm run test`.
That includes a file filter to only look as `src/` folder.
Otherwise `build` would also be included.

**Test Single File / Pattern**

To test a single file or file pattern, `npm run test:pattern "src/**/file.test.ts"`.
Include `src/**` or you may duplicate tests from `build/`.
