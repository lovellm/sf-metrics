# Snowpark Container Services API Server

Basic API server for issuing queries in a safe and controlled manner.

## Access to Data

Any table that is desired to be queried by the API server must be explicitly allowed.
This is done using the JSON files in `server/config`.

- `callerRead.json` determines which tables are allowed to be queried with Caller Rights
- `serviceRead.json` determines which tables are alloed to be quereied using the Service itself.

Both files have the sames structure, with an example as follows.

```json
{
  "database1": {
    "schema1": {
      "table1": true,
      "table2": true
    },
    "schema2": {
      "*": true
    }
  }
}
```

Any level of that structure can have a `*` that will allow any values for that level.

In the example above:

- `database1.schema1.table1` is allowed - it is listed.
- `database1.schema2.anytable` is allowed - it is covered by the `*` for `database1.schema2`.
- `database1.schema1.table3` is not allowed - it is not listed and not covered by any `*`.
- `database2.schema1.table1` is not allowed - `database2` is not listed and there is no `*` for databases.

**Default Data Access**

The default access in this repository does the following.

- Query as User
  - Can query any table/view a schema called `SF_METRICS` in any database.
  - Since these run as the user with the user's rights, it will not allow anything beyond what they already have access to.
- Query as Service
  - Can query the specific views that the application is expecting.
  - Be careful with what you allow the service to query.
  - The queries run as the Service's owner role, you could enable privilege escalation if it is over broad.

_Additional Note_

The default Query as Service allows access to all views.
If you want to be extra cautious you can remove the ones that are only queries using caller rights.
Search the `ui` folder for `asUser` to find the relevant views that could be removed.
If you are being this cautious, make sure you also add row level security to the views.
See the data deployment documentation for more information.

# UI

The UI should be placed in the `server/public` folder.
There is a minimal `default.html` file there that will be used.
If an `index.html` file exists, that will be used instead.

The build script for the container image builds the React UI
and places the compiled files into this folder.

# Running Tests

Run all tests using `npm run test`.
That includes a file filter to only look as `src/` folder.
Otherwise `build` would also be included.

**Test Single File / Pattern**

To test a single file or file pattern, `npm run test:pattern "src/**/file.test.ts"`.
Include `src/**` or you may duplicate tests from `build/`.
