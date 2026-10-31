---
index: 3
title: Configuring the CLI
summary: Describes the .themost-cli.json file, its options and how each command uses them.
category: CLI
readingTime: 5 min
---

# Configuring the CLI

Project commands read a JSON file named `.themost-cli.json` from the current working directory. Run the CLI from the project root.

## The configuration file

The file is loaded with `require(path.resolve(process.cwd(), '.themost-cli.json'))` and merged over these defaults:

```json
{
    "base": "server",
    "out": "dist/server"
}
```

The JavaScript templates (`api` and `express`) generate exactly this content. The TypeScript templates add `"mode": "typescript"`:

```json
{
    "mode": "typescript",
    "out": "dist/server",
    "base": "server"
}
```

## Options

| Option | Type | Default | Used by |
|--------|------|---------|---------|
| `base` | string | `server` | The source folder. Generators write into it (`models`, `controllers`, `listeners`, `services`, `config/models`). `generate class` and `generate classdef` also read the data configuration from `<base>/config`, and `modeler extract` writes into `<base>/config/models` |
| `out` | string | `dist/server` | The compiled output folder. `cat`, `import` and `modeler extract` create the application from `<out>/config` |
| `mode` | string | not set | When it equals `typescript`, generators emit `.ts` files and `build` uses the TypeScript build module. Any other value, or no value, means JavaScript |
| `application` | string | not set | A custom application factory, see below |

Paths are resolved against the current working directory.

## Custom application

By default `cat`, `import` and `modeler extract` create an `ExpressDataApplication` loaded from `@themost/express` in the project's `node_modules`, pointing to `<out>/config`. If `application` is set, the CLI loads your module instead.

The value has two forms. A module path starting with `.` is resolved against the working directory in both.

- `<module>#<ExportName>`: the named export is instantiated with `new`.
- `<module>`: the module itself must export a function, which is called and must return the application.

In both cases the application receives the absolute path of `<out>` (the output folder itself, not `<out>/config`).

```json
{
    "base": "server",
    "out": "dist/server",
    "application": "./dist/server/app#MyApplication"
}
```

If a module given without `#` does not export a function, the CLI throws `Invalid application module ... does not export a function`.

## Command line options which are not in the file

`cat` and `import` accept `--configuration` (`-c`) with the choices `development` and `production` (default `development`). When the value is `development` the CLI sets `process.env.NODE_ENV` to `development`. The value `production` leaves `NODE_ENV` untouched. See Data Commands.

## Errors

- If the file does not exist the CLI prints `Configuration cannot be found. It seems that current working directory does not contain a MOST Web Framework project.` and rethrows the error.
- If the file cannot be loaded for another reason (for example invalid JSON) it prints `An error occurred while loading configuration.`.

Commands that never read the file are `random`, `modeler ls`, `modeler inspect`, `modeler info` and `new project`.

## Summary

Keep `.themost-cli.json` at the project root. `base` is where you edit sources, `out` is the compiled project the application commands run against and `mode` switches generators and `build` to TypeScript.
