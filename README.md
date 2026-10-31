## @themost/cli

![MOST Web Framework Logo](https://github.com/themost-framework/common/raw/master/docs/img/themost_framework_v3_128.png)

A command line utility for [Most Web Framework](https://github.com/themost-framework/) applications.

### Generate a new MOST Web Framework application

    npx @themost/cli new project <project name> [--template <api|express>] [--typescript]

Note: Use --typescript flag if you want to generate a typescript project.
    
This operation will create a new MOST Web Framework application. Execute:

    cd <project name> && npm i
    
to install dependencies.

### Import data

    npx @themost/cli import <data file path> --model <data model name> [--dev]
    
### Query data

Applies the specified OData query options against the defined data model and prints the result

    npx @themost/cli cat --model <data model name> [--dev] 
            [--filter=<filter option>] 
            [--select=<select option>]
            [--top=<top option>] 
            [--skip=<skip option>]
            [--count=<count option>]
            [--order=<order by option>]
            [--group=<group by option>]
            [--expand=<expand option>]

### Interactive mode

Use `--interactive` (or `-i`) to start an interactive shell which executes any command against the same process,
so the application instance is loaded once and shared across commands

    npx @themost/cli -i

Each line accepts a command with its options e.g.

    @themost> cat User --filter "name eq 'admin'" --select id,name --top 1
    @themost> import data/users.json --model User

A command passed together with `-i` is executed before prompting e.g. `npx @themost/cli cat User --top 1 -i`.
Use `help` to print the available commands, `help <command>` for command options and `exit` (or `quit`, `.exit`) to quit.
Command history is kept in `~/.themost_history`.

### User modeler

Use modeler commands to manage data models:

    npx @themost/cli modeler <command>

### List data models

    npx @themost/cli modeler ls

Enumerates all the available data models

### Inspect a data model

    npx @themost/cli modeler inspect <model name>

Prints the definition of the given data model, including its fields and the fields inherited from implemented models e.g.

    npx @themost/cli modeler inspect UpdateAction

`npx @themost/cli modeler info <model name>` is an alias of `inspect` and is deprecated.

### Extract a data model

    npx @themost/cli modeler extract <model name>

e.g. 

    npx @themost/cli modeler extract Article

Extract a data model definition and its dependencies. There is a large set of data model definitions
as they are defined and documented at [schema.org](https://schema.org) 

### Create an new controller

    npx @themost/cli generate controller <controller name>

This operation will generate a new controller and it will place it in controllers folder (server/controllers).
### Create an new model

    npx @themost/cli generate model <model name>

This operation will generate a new model and it will place it in models definition folder (server/config/models).

### Create an new model class

    npx @themost/cli generate class <model name>

This operation will generate a new model class and it will place it in models folder (server/models).

### Create an new model listener

    npx @themost/cli generate listener <listener name>

This operation will generate a new model listener and it will place it in listeners folder (server/listeners).

### Create an new application service

    npx @themost/cli generate service <service name>

This operation will generate a new application service and it will place it in services folder (server/services).
