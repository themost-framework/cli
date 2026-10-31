---
index: 2
title: Getting Started
summary: Install the CLI, create a new project from the api or express template, learn the project layout and run the application.
category: CLI
readingTime: 6 min
---

# Getting Started

This article shows how to install `@themost/cli`, create a new project and run it.

## Install the CLI

```sh
npm i -g @themost/cli
themost --help
```

You can also skip the installation and use `npx @themost/cli ...`. The examples below use the `themost` binary.

## Create a project

### Synopsis

```
themost new project <directory> [--template <api|express>] [--typescript] [--skip-install]
```

### Arguments and options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `directory` | positional, required | - | The project directory, resolved against the current working directory |
| `--template` | string, choices `api`, `express` | `api` | The template to use |
| `--typescript` | boolean | `false` | Generates a TypeScript project |
| `--skip-install` | boolean | `false` | Skips `npm install` after the project is created |

### What the command does

1. If the target directory exists and is not empty, it prints a warning (`Project root directory must be empty. Skipping project creation.`) and does nothing. The process does not fail.
2. It copies the template folder into the directory. The folder is `templates/<template>_project`, or `templates/typescript/<template>_project` when `--typescript` is set.
3. If `server/config/app.json` exists in the new project, it generates two secrets and writes them back: `settings.crypto.key` (48 random bytes, hex encoded) and `settings.auth.unattendedExecutionAccount` (12 random bytes, base64 encoded). Every project therefore gets its own keys.

4. Unless `--skip-install` is set, it runs `npm install` in the new directory. If the installation fails (for example because the template's `engines.node` requirement is not met), the command exits with a non-zero code and the copied files stay in place.

### Example

```sh
themost new project my-app --template api
cd my-app
```

The dependencies are installed by the command. Use `--skip-install` to install them later yourself, for example with another package manager.

Create a TypeScript project using the express template:

```sh
themost new project my-app --template express --typescript
```

## Project layout

The `api` and `express` templates share the same structure:

```
my-app/
├── db/                     local SQLite database (db/local.db)
├── dist/                   compiled output (created by npm run build)
├── public/                 static content
├── server/
│   ├── app.js              Express application setup
│   ├── serve.js            HTTP server helpers
│   ├── standalone.js       application entry point
│   ├── config/
│   │   ├── app.json        application configuration
│   │   └── models/         data model definitions (JSON)
│   ├── listeners/          model event listeners
│   ├── models/             data model classes
│   ├── routes/             Express routers
│   └── views/              Twig templates
├── .themost-cli.json       CLI configuration
├── babel.config.js
└── nodemon.json
```

The TypeScript templates use `.ts` sources and contain a `tsconfig.json` instead of Babel configuration. The `api` template mounts an OData service at `/api/`. The `express` template mounts a sample users router. Both ship model definitions such as `Thing`, `Account`, `User`, `Group`, `Enumeration` and `Action`.

The generated `.themost-cli.json` tells the CLI where the sources and compiled output are. See Configuring the CLI.

## Run the project

JavaScript projects are compiled with Babel and TypeScript projects with `tsc`. The npm scripts of the templates are:

| Script | JavaScript templates | TypeScript templates |
|--------|----------------------|----------------------|
| `build` | `rimraf dist/server && babel server --out-dir dist/server --copy-files --source-maps` | `rimraf dist && tsc && cpy "server/**/*.{html,css,twig,json}" dist/server` |
| `start` | `node dist/server/standalone.js` | `node dist/server/standalone` |
| `dev` | `nodemon dist/server/standalone.js` | `nodemon dist/server/standalone` |
| `cli` | `themost` | `themost` |

```sh
npm run build
npm start
```

The server listens on port 3000 by default. The template README documents `--port`/`-p` and `--host`/`-h` for `standalone.js`:

```sh
node dist/server/standalone.js --port 8080 --host 0.0.0.0
```

Then use the CLI against the project:

```sh
npm run cli -- generate model Article
npm run cli -- modeler ls
npm run cli -- cat User --top 5
```

Commands which load the application (`cat`, `import`, `modeler extract`) use the compiled output in `dist/server`, so run `npm run build` first.

## Summary

`themost new project` copies a template, generates fresh secrets and installs the dependencies (unless `--skip-install` is set). It does not build the project, so run `npm run build` next. Next, read Configuring the CLI and Generating Components.
