---
index: 7
title: Building Projects
summary: Explains the build command, the JavaScript and TypeScript build paths, and the commands which this version of the CLI does not provide.
category: CLI
readingTime: 4 min
---

# Building Projects

## build

```
themost build
```

The command takes no positional arguments or options of its own. It reads `.themost-cli.json` and then delegates to a build module, which is chosen with the `mode` option (see Configuring the CLI):

| `mode` | Module | Call |
|--------|--------|------|
| not `typescript` (or not set) | `@themost-devkit/build` | `build(process.cwd())` |
| `typescript` | `@themost-devkit/build-typescript` | `build(process.cwd())` |

On success it prints `Build operation was completed successfully.`. If the build fails, the error is logged and the CLI exits with a non-zero code.

Neither `@themost-devkit/build` nor `@themost-devkit/build-typescript` is a dependency or peer dependency of `@themost/cli`, so install the one you need first, for example `npm i -D @themost-devkit/build`. If it is missing, the command logs `Build module <name> cannot be found` with the install command and exits with a non-zero code. This documentation does not describe the build modules themselves.

## Building with npm scripts

The project templates do not use `themost build`. They define their own `build` scripts, which is the recommended way to compile a created project:

- JavaScript templates compile `server` to `dist/server` with Babel (`babel server --out-dir dist/server --copy-files --source-maps`).
- TypeScript templates run `rimraf dist && tsc && cpy "server/**/*.{html,css,twig,json}" dist/server`, so non-TypeScript assets reach `dist/server`.

```sh
npm run build
npm run dev      # nodemon, rebuilds on changes under server/
```

Because `cat`, `import` and `modeler extract` read the compiled application in `dist/server` (`out`), rebuild after changing models or `app.json`.

## Serve and test

The CLI has no `serve` or `test` commands in this version. The command files are `build`, `cat`, `generate`, `import`, `modeler`, `new` and `random`. Start a project with `npm start` or `npm run dev`.

## Summary

`themost build` only dispatches to an external build package selected by `mode`. For projects created from the templates use `npm run build`, and run it before any command which loads the application.
