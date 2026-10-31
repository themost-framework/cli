---
index: 1
title: MOST Web Framework CLI Documentation
summary: An index of the articles which describe how to install and use the @themost/cli command line utility.
category: CLI
readingTime: 3 min
---

# MOST Web Framework CLI Documentation

`@themost/cli` (binary name `themost`) is the command line utility of the MOST Web Framework. It creates new projects, generates models, classes, listeners, controllers and services, extracts schema.org based data models and queries and imports data.

This documentation describes version 2.12.0, which uses `yargs@17` for command parsing.

## Requirements

- Node.js 14 or later (`engines.node` is `>=14`). Projects created from the templates require Node.js 22 or later.
- The peer dependencies `@themost/common` (`^2`), `@themost/data` (`^2`) and `@themost/express` (`^1 || ^2`). Commands which need an application (`cat`, `import`, `modeler extract`) resolve `@themost/data` and `@themost/express` from the `node_modules` folder of the current working directory, so they must be installed in your project.

## Installation

Install the package globally:

```sh
npm i -g @themost/cli
```

or run it on demand with `npx`:

```sh
npx @themost/cli --help
```

Inside a project the CLI is usually installed as a development dependency and invoked through an npm script (`"cli": "themost"`):

```sh
npm run cli -- modeler ls
```

## Command overview

| Command | Description | Article |
|---------|-------------|---------|
| `new project <directory>` | Creates a new project from a template | Getting Started |
| `generate <command>` | Generates models, classes, class definitions, listeners, controllers and services | Generating Components |
| `modeler <command>` | Lists, inspects and extracts schema.org data models | Working with the Modeler |
| `import <file>` | Imports data from a JSON file | Data Commands |
| `cat [model]` | Queries a data model and prints or saves the result | Data Commands |
| `random <type>` | Prints a random integer, string, hex string or guid | Data Commands |

Running `npx @themost/cli` with no arguments starts the interactive shell (see Data Commands).

## Articles

1. [Getting Started](getting-started.md) - install the CLI, create a project and run it.
2. [Configuring the CLI](configuration.md) - the `.themost-cli.json` file and the options it honors.
3. [Generating Components](generate.md) - every `generate` subcommand.
4. [Working with the Modeler](modeler.md) - the `modeler` subcommands.
5. [Data Commands](data-commands.md) - `import`, `cat`, `random` and the interactive shell.
6. [Building and Running Projects](build-and-serve.md) - the npm scripts which build and run a project.

## Summary

Start with Getting Started to create a project, then read Configuring the CLI to understand how the commands locate your sources and compiled output. Every other article is a reference for one group of commands.
