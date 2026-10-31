---
index: 6
title: Data Commands
summary: Import data from JSON files, query models with OData options, generate random values and use the interactive shell.
category: CLI
readingTime: 9 min
---

# Data Commands

The data commands `import` and `cat` run against your application: they read `.themost-cli.json`, load `@themost/express` and `@themost/data` from the project's `node_modules`, and create the application from `<out>/config` (default `dist/server/config`). Build the project before using them. See Configuring the CLI.

Both commands accept `--configuration` (`-c`), with the choices `development` and `production` and the default `development`. The CLI sets `NODE_ENV` to the selected value before the application is loaded.

## import

```
npx @themost/cli import <file> --model <model> [--configuration <development|production>]
```

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `file` | positional, required | - | A JSON file, resolved against the working directory. It contains one object or an array of objects |
| `--model` | string | none (required in practice) | The target data model |
| `--configuration`, `-c` | string, choices `development`, `production` | `development` | See above |

Behavior:

- A missing `--model` or a missing file prints an error and exits with code 1.
- Strings that look like ISO dates or date times (for example `2024-05-01` or `2024-05-01T10:30:00Z`) are converted to `Date` objects while the file is parsed.
- The operation runs in unattended mode. For each item, `$state` is used when present (1 insert, 2 update, 4 delete); otherwise the state is inferred with `model.inferStateAsync()`. The command logs how many items will be inserted, updated and deleted.
- All items are saved with `model.save(items)`, the context is finalized and the process exits with code 0. Any error prints a message and exits with code 1.

Example, with `data/groups.json`:

```json
[
    { "name": "Contributors", "alternateName": "contributors" },
    { "name": "Reviewers", "alternateName": "reviewers" }
]
```

```sh
npx @themost/cli import data/groups.json --model Group
```

Expected effect: two groups are inserted (or updated if the model can match them to existing rows) and the log ends with `The operation was completed successfully`.

## cat

```
npx @themost/cli cat [model] [--model <model>] [query options] [--out <file>] [--state <state>] [-c <configuration>]
```

`model` may be given as a positional argument or with `--model`. If both are missing the command fails with `The target cannot be empty`.

| Option | Default | Description |
|--------|---------|-------------|
| `--filter` | `null` | `$filter` expression |
| `--select` | `null` | `$select` expression |
| `--expand` | `null` | `$expand` expression |
| `--group` | `null` | `$groupby` expression |
| `--order` | `null` | `$orderby` expression |
| `--top` | `25` | `$top` |
| `--skip` | `0` | `$skip` |
| `--count` | `false` | `$count`. When truthy the result comes from `getList()` and has the shape of a paged result (`total`, `skip`, `value`) |
| `--out` | `null` | Writes the result as JSON to this file (resolved against the working directory) instead of printing it |
| `--state` | `none` | One of `none`, `insert`, `update`, `delete`. Sets `$state` on each item (1, 2 or 4) so the output can be fed to `import` |
| `--configuration`, `-c` | `development` | See above |

Options with an empty value (`null`, `0` or `false`) are not sent to the query. The query is executed silently (privileges are not applied) with `q.silent()`. When `--top 1` is used without `--count` a single object is printed instead of an array. The output is pretty-printed JSON (4 spaces). With `--out` the message `Data was successfully exported to <path>` is written to stderr.

Examples:

```sh
npx @themost/cli cat User --filter "enabled eq true" --select id,name --top 10
npx @themost/cli cat Group --order name --count true
npx @themost/cli cat User --top 1
```

Export and re-import data, for example between environments:

```sh
npx @themost/cli cat Group --top 1000 --state insert --out data/groups.json
npx @themost/cli import data/groups.json --model Group -c production
```

Note that `--state update` or `--state insert` is only a marker for `import`; `import` honors `$state` values over inference.

## random

```
npx @themost/cli random [type] [--min <n>] [--max <n>] [--length <n>]
```

`type` is an optional positional argument.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `type` | choices `int`, `string`, `guid`, `hex` | `int` | The kind of value |
| `--min` | number | `0` | Used by `int` |
| `--max` | number | `1000000` | Used by `int` |
| `--length`, `-l` | number | `8` | Used by `string` and `hex` |

| Type | Output |
|------|--------|
| `int` | A random integer between `min` and `max`, both inclusive |
| `string` | A string of `length` characters from an alphabet without ambiguous characters |
| `hex` | A string of `length` hex digits generated with `crypto.randomBytes` |
| `guid` | An RFC 4122 version 4 style identifier |

```sh
npx @themost/cli random guid
npx @themost/cli random hex --length 48
npx @themost/cli random int --min 100 --max 200
```

The `hex` form is handy for the application secret in `server/config/app.json`, since it uses `crypto.randomBytes`. The `int`, `string` and `guid` values come from `Math.random()` and are not cryptographically secure. The last example prints a number from 100 to 200.

## Interactive shell

```
npx @themost/cli   # no arguments
npx @themost/cli -i
npx @themost/cli cat User --top 1 -i
```

Running `npx @themost/cli` without arguments, or with `--interactive` / `-i`, starts a shell with the prompt `@themost> `. The shared application instance is created once, so repeated `cat` and `import` commands do not reload it. A command given together with `-i` runs first.

Inside the shell:

- Each line is parsed like a shell command line with single and double quotes and backslash escapes.
- Any CLI command works, for example `cat User --filter "name eq 'admin'" --top 1`.
- `help` prints the commands, `help <command>` prints the options of a command.
- `exit` or `quit` (and the REPL command `.exit`) leave the shell. Tab completes command names.
- Command history is stored in `~/.themost_history`.
- Unknown commands are rejected (strict command mode) and a command which fails prints `ERROR <message>`, then the prompt returns.
- In the shell `cat` clears the screen before printing its result when it is not writing to a file.

## Summary

`import` and `cat` are the two sides of data transfer: `cat --state ... --out` exports and `import` applies. They need a built project and a valid `.themost-cli.json`. `random` is a standalone helper, and the interactive shell is the best way to run many commands quickly. Next, see Building Projects.
