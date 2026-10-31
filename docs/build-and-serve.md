---
index: 7
title: Building and Running Projects
summary: Build and run a project with the npm scripts of the project templates, and the commands which the CLI does not provide.
category: CLI
readingTime: 2 min
---

# Building and Running Projects

## Building with npm scripts

The CLI has no build command. Projects created from the templates define their own `build` script:

- JavaScript templates compile `server` to `dist/server` with Babel (`babel server --out-dir dist/server --copy-files --source-maps`).
- TypeScript templates run `rimraf dist && tsc && cpy "server/**/*.{html,css,twig,json}" dist/server`, so non-TypeScript assets reach `dist/server`.

```sh
npm run build
npm run dev      # nodemon, rebuilds on changes under server/
```

Because `cat`, `import` and `modeler extract` read the compiled application in `dist/server` (`out`), rebuild after changing models or `app.json`.

## Build, serve and test

The CLI has no `build`, `serve` or `test` commands. Its commands are `cat`, `generate`, `import`, `modeler`, `new` and `random`. Start a project with `npm start` or `npm run dev`.

## Summary

Build a project with `npm run build` and run it with `npm start` or `npm run dev`. Run the build before any CLI command which loads the application.
