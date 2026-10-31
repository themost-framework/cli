---
index: 4
title: Generating Components
summary: A reference for every generate subcommand - model, class, classdef, controller, listener and service - with options, output locations and examples.
category: CLI
readingTime: 9 min
---

# Generating Components

```
themost generate <command> <name> [options]
```

All generators read `.themost-cli.json` (see Configuring the CLI), write below the `base` folder (default `server`) and emit TypeScript (`.ts`) instead of JavaScript (`.js`) when `mode` is `typescript`. Run them from the project root.

| Command | Output |
|---------|--------|
| `generate model <name>` | `<base>/config/models/<name>.json` |
| `generate class <name>` | `<base>/models/<Name>.js` or `.ts` (plus a `.d.ts`, see below) |
| `generate classdef <name>` | `<base>/models/<name>.d.ts` |
| `generate controller <name>` | `<base>/controllers/<Name>Controller.js` or `.ts` |
| `generate listener <name>` | `<base>/listeners/<name>.js` or `.ts` |
| `generate service <name>` | `<base>/services/<name>.js` or `.ts` |

Existing files are never overwritten by `model`, `controller`, `listener` and `service`: the command prints a warning and finishes without error. `class` and `classdef` can overwrite with `--force`.

## generate model

```
themost generate model <name> [--inherits <model>] [--implements <model>]
```

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `name` | positional, required | - | The model name, also used as the file name |
| `--inherits` | string | not set | The model to inherit |
| `--implements` | string | not set | The model to implement |

The definition is rendered from `templates/generate/model.json.ejs`: `@id` is `https://themost.io/schemas/<name>`, `title` is the plural form of the name (via `pluralize`), `version` is `1.0` and the model has one field, the primary `id` of type `Counter`, empty `constraints` and `eventListeners` and global privileges (mask 15) for everyone and for `Administrators`. When `--inherits` or `--implements` is given, the `inherits`/`implements` property is added and the `fields` array is emptied, so that fields come from the parent model.

The `config/models` folder is created if it does not exist.

```sh
themost generate model Article
themost generate model BlogPost --inherits Article
```

Expected result: `server/config/models/Article.json` and `server/config/models/BlogPost.json` (with `"inherits": "Article"` and no fields).

## generate class

```
themost generate class <name> [--silent] [--force]
```

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `name` | positional, required | - | A model name, several names joined with `+`, or `app`/`*` for every entity type of the application |
| `--silent` | boolean | `false` | Described as "disable errors"; the handler does not otherwise use it |
| `--force` | boolean | `false` | Replaces an existing class file |

How it works:

- The name must match `^[a-zA-Z0-9_-]+$`; otherwise the command fails with `Class name is not valid.`.
- It loads the data configuration from `<base>/config` and the model definition of the same name. If no definition exists an empty one is used, so a bare class is generated.
- The file name is the upper-camel-cased model name with `.js` or `.ts` (for example `Article.js`). If it exists and `--force` is not set, a warning is printed and the file is skipped.
- The class extends the model it inherits (imported from `./<Parent>`) or `DataObject` from `@themost/data`. Models used as field types are imported and generated too, unless they already exist.
- After the class, the handler also runs the `classdef` generator for the same name (`generate class` therefore also writes `<name>.d.ts`).

```sh
themost generate class User
themost generate class User+Group --force
themost generate class app
```

## generate classdef

```
themost generate classdef <name> [--silent] [--force]
```

Same options and name rules as `generate class` (here both options are untyped in the declaration; the defaults are `false`). It writes `<base>/models/<name>.d.ts`, a TypeScript declaration of the model class using `any` for unknown types. The declaration lists the fields declared by the model itself (`attribute.model === name`) and marks nullable fields as optional. Referenced models get their declarations generated too, unless a file already exists.

```sh
themost generate classdef Article
```

## generate controller

```
themost generate controller <name>
```

`name` is positional and required. A trailing `Controller` is removed from `name` and then appended again, so `Home` and `HomeController` both produce `class HomeController` in `<base>/controllers/HomeController.js|ts`. The template extends `HttpBaseController` from `@themost/web` and defines a `getIndex()` action decorated with `@httpGet()` and `@httpAction('index')`.

```sh
themost generate controller Home
```

## generate listener

```
themost generate listener <name>
```

The file is `<base>/listeners/<name>.js|ts`. The JavaScript template exports `beforeSave` and `afterSave` functions with the `(event, callback)` signature. Register the listener in the `eventListeners` of a model definition yourself, the command does not modify models. The command logs the destination with `debug` and `info` levels of the logger.

```sh
themost generate listener OnArticleSave
```

## generate service

```
themost generate service <name>
```

The file is `<base>/services/<name>.js|ts`. The template declares `class <name>Service extends ApplicationService` (from `@themost/common`), so `generate service Mailer` creates `Mailer.js` containing `MailerService`. Register it in your application with `useService`.

```sh
themost generate service Mailer
```

## Summary

Use `generate model` to create definitions and `generate class`/`classdef` to create matching source files. Generators skip existing files, so they are safe to re-run, and `--force` is available for classes and declarations. Next, read Working with the Modeler to import ready-made schema.org definitions.
