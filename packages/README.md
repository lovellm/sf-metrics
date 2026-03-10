# Packages

Each folder is a shared library serving some purpose.

They should be set up as though they would be published to NPM, but they are not published.
They are used as workspace packages by other workspaces in the repo.

As such, they should be set up as libraries, and correctly export the needed functionality and types.
They should be built to a dist folder.

If using Vite, they should be built using Vite's library mode.
The actual library source should go in the `lib` folder of a package.
The `src` folder is only used to hold a demo site to ease development and testing.

If making a new package, it is easiest to copy an existing one, remove what is not needed,
and change the rest.
