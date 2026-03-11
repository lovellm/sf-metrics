# Monorepo for Snowflake Container Services Apps

Overall structure of the respoitory

- Root Folder
  - Common configuration, such as Prettier, and ESLint
  - Package file with Workspaces configured
  - Base tsconfig files
- server
  - API Server for running apps inside Snowflake Container Services
- packages
  - Base TailwindCSS configuration file
  - Folder for each shared UI Package
- ui
  - Folder for each UI app
- db
  - For for each UI app with necessary scripts and documentation to be able to deploy it
- scripts
  - Folder for each UI app with Dockerfile build script for it
- docs
  - UI specific documentation for creating and deploying the containers

## Package Files - Names and versions

The Root `package.json` file defines the workspaces within the repository.
All folders under `packages` are considered workspaces.
The UIs are listed individually, as is the server.
If adding a new UI, make sure to add it to the workspaces list.

The name of the Root package should also be used as the organization name for all workspace projects.
That is, if the Root package is `spcs-apps`, then all other packages should have a name `@spcs-apps/package-name`.

All the shared projects in the `packages` folder should use a version number of `0.0.0`.
Any UI that has a dependency on one of those should depend on exact version `0.0.0`.

The UI and Server can have version numbers as appropriate for their releases.

## Running NPM Commands

All NPM commands should be run from the repository Root.
If needed, indicate which workspace the command should be run under.

**NPM Install**

Should be run for all workspaces. This is simply `npm i` from the repository root.

**Running Server**

First build the server.
Only needed once unless you change it.

`npm run build -w=@spcs-apps/server`

Then start the server.

`npm run start -w=@spcs-apps/server`

**Package Build**

Before you can use a package within a UI, you must build it.
If you change any package files, you must build it before the UI will be aware of the changes.

`npm run build -w=workspace-name`

Where `workspace-name` is the name of the workspace as found in its `package.json` file.

Alternatively, build all packages by using the following.
If new packages are added, they will need this script added to them in order for this command to find them.

```sh
npm run build-package --workspaces --if-present
```

**Running UIs**

`npm run dev -w=ui-name`

Where `ui-name` is the name of the UI as found in its `package.json` file.

**Preview Website Static FIles**

```sh
npm run build -w=ui-name
npm run preview -w=ui-name
```

First need to build the website static files, then use the preview command to run Vite's preview server with them.

If you want to preview it from the server itself,
copy the `/dist` folder for the UI to the `/server/public` folder.
Then start the folder and navigate to it in your browser.

# General Snowflake Container Services Documentation

- [Documentation Home](https://docs.snowflake.com/en/developer-guide/snowpark-container-services/overview)
- [Basic Tutorial](https://docs.snowflake.com/en/developer-guide/snowpark-container-services/tutorials/tutorial-1)
