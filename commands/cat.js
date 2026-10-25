// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const getConfiguration = require('../util').getConfiguration;
const getApplication = require('../util').getApplication;
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const repl = require('repl');
const Yargs = require('yargs/yargs');

const QUERY_OPTS = ['filter', 'expand', 'order', 'group', 'top', 'skip', 'count', 'select'];

module.exports.command = 'cat [model] [options]';

module.exports.desc = 'Query data';

/**
 * Defines query options
 * @param {*} yargs
 */
function queryOptions(yargs) {
    return yargs.option('filter', {
        default: null,
        describe: 'defines query filter'
    }).option('expand', {
        default: null,
        describe: 'defines query expand option'
    }).option('group', {
        default: null,
        describe: 'defines query group by option'
    }).option('top', {
        default: 25,
        describe: 'defines query top option'
    }).option('skip', {
        default: 0,
        describe: 'defines query skip option'
    }).option('count', {
        default: false,
        describe: 'defines query count option'
    }).option('select', {
        default: null,
        describe: 'defines query select option'
    }).option('order', {
        default: null,
        describe: 'defines query order by option'
    }).option('out', {
        default: null,
        describe: 'defines the output file path'
    }).option('state', {
        default: 'none',
        choices: ['none', 'insert', 'update', 'delete'],
        describe: 'set state for data objects'
    });
}

module.exports.builder = function builder(yargs) {
    return queryOptions(yargs.option('model', {
        describe:'the target model'
    }).option('configuration', {
        alias:'c',
        choices: ['development', 'production'],
        default:'development'
    }).option('interactive', {
        alias: 'i',
        type: 'boolean',
        default: false,
        describe: 'starts an interactive shell for executing queries against the same application instance'
    }));
};

/**
 * Queries the given model and returns the result
 * @param {*} context
 * @param {*} argv
 * @returns {Promise<*>}
 */
function queryModel(context, argv) {
    return new Promise((resolve, reject) => {
        let model = context.model(argv.model);
        if (typeof model === 'undefined' || model === null) {
            return reject(new Error(`Target model ${argv.model} cannot be found.`));
        }
        let query={};
        QUERY_OPTS.forEach((x)=> {
            if (Object.prototype.hasOwnProperty.call(argv, x) && argv[x]) {
                query[`$${x}`] = argv[x];
            }
        });
        //build query options
        model.filter(query, (err, q)=> {
            if (err) {
                return reject(err);
            }
            let source = argv.count ? q.silent().getList() : q.silent().getItems();
            return source.then((res) => {
                if (res == null) {
                    return resolve(res);
                }
                let finalResult = (argv.top === 1 && !argv.count) ? res[0] : res;
                if (argv.state !== 'none') {
                    let state = argv.state === 'insert' ? 1 : argv.state === 'new' ? 1 :  argv.state === 'update' ? 2 : argv.state === 'delete' ? 4 : 0;
                    if (state>0) {
                        if (Array.isArray(finalResult)) {
                            finalResult.forEach( x=> {
                                x.$state = state;
                            });
                        }
                        else if (typeof finalResult === 'object') {
                            finalResult.$state = state;
                        }
                    }
                }
                return resolve(finalResult);
            }).catch(reject);
        });
    });
}

/**
 * Writes query result to the output file, if any, or to console
 * @param {*} result
 * @param {*} argv
 * @returns {Promise<void>}
 */
function writeResult(result, argv) {
    if (result == null) {
        return Promise.resolve();
    }
    if (argv.out) {
        let outFile = path.resolve(process.cwd(), argv.out);
        return fs.writeFile(outFile, JSON.stringify(result,null,4),'utf8').then(() => {
            console.error('INFO',`Data was succesfully exported to ${outFile}`);
        });
    }
    console.log(JSON.stringify(result,null,4));
    return Promise.resolve();
}

/**
 * Executes a query by using a new application context which is finalized after execution
 * @param {*} app
 * @param {*} argv
 * @returns {Promise<void>}
 */
function executeQuery(app, argv) {
    return new Promise((resolve, reject) => {
        app.execute((context)=> {
            const finalize = (err) => {
                if (typeof context.finalize !== 'function') {
                    return err ? reject(err) : resolve();
                }
                return context.finalize(() => {
                    return err ? reject(err) : resolve();
                });
            };
            try {
                queryModel(context, argv).then((result) => {
                    return writeResult(result, argv);
                }).then(() => finalize()).catch(finalize);
            }
            catch(err) {
                finalize(err);
            }
        });
    });
}

/**
 * Splits a command line into arguments respecting single/double quotes and backslash escapes
 * @param {string} line
 * @returns {Array<string>}
 */
function parseArgs(line) {
    const args = [];
    let current = '';
    let quote = null;
    let hasToken = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quote) {
            if (ch === quote) {
                quote = null;
            } else if (ch === '\\' && quote === '"' && i + 1 < line.length) {
                current += line[++i];
            } else {
                current += ch;
            }
        } else if (ch === '"' || ch === '\'') {
            quote = ch;
            hasToken = true;
        } else if (ch === '\\' && i + 1 < line.length) {
            current += line[++i];
            hasToken = true;
        } else if (/\s/.test(ch)) {
            if (hasToken) {
                args.push(current);
                current = '';
                hasToken = false;
            }
        } else {
            current += ch;
            hasToken = true;
        }
    }
    if (quote) {
        throw new Error(`Unterminated quoted string (${quote})`);
    }
    if (hasToken) {
        args.push(current);
    }
    return args;
}

/**
 * Returns a parser for query lines e.g. User --filter "name eq 'admin'" --top 1
 */
function createLineParser() {
    return queryOptions(Yargs())
        .usage('<model> [options]')
        .help(false)
        .version(false)
        .exitProcess(false)
        .fail((msg, err) => {
            throw err || new Error(msg);
        });
}

/**
 * Returns the names of the models defined in application configuration
 * @param {*} options
 * @returns {Array<string>}
 */
function getModelNames(options) {
    try {
        const modelsDir = path.resolve(process.cwd(), options.out, 'config', 'models');
        return fs.readdirSync(modelsDir).filter((file) => {
            return path.extname(file) === '.json';
        }).map((file) => {
            return path.basename(file, '.json');
        });
    }
    catch(err) {
        return [];
    }
}

/**
 * Starts an interactive shell which executes queries against the given application
 * @param {*} app
 * @param {*} argv
 * @param {*} options
 */
function startInteractive(app, argv, options) {
    const keywords = ['use', 'help', 'exit'];
    const models = getModelNames(options);
    const lineParser = createLineParser();
    let currentModel = argv.model;
    let queue = Promise.resolve();
    let closed = false;
    const getPrompt = () => currentModel ? `${currentModel}> ` : 'cat> ';
    console.log('Type a query e.g. User --filter "name eq \'admin\'" --top 1, "use <model>" to set the default model, "help" for options or ".exit" to quit.');
    const server = repl.start({
        prompt: getPrompt(),
        ignoreUndefined: true,
        completer: (line) => {
            const words = line.split(/\s+/);
            const last = words[words.length - 1];
            const candidates = words.length === 1 ? keywords.concat(models) : models;
            const hits = candidates.filter((name) => name.startsWith(last));
            return [hits.length ? hits : candidates, last];
        },
        eval: (cmd, context, filename, callback) => {
            // queries are queued so that buffered input (e.g. piped lines) is executed sequentially
            queue = queue.then(() => {
                const args = parseArgs(cmd);
                if (closed || args.length === 0) {
                    return;
                }
                if (args[0] === 'exit' || args[0] === 'quit') {
                    closed = true;
                    return server.close();
                }
                if (args[0] === 'help') {
                    return lineParser.showHelp('log');
                }
                if (args[0] === 'use') {
                    currentModel = args[1];
                    server.setPrompt(getPrompt());
                    return;
                }
                const queryArgs = lineParser.parse(args);
                const model = queryArgs._.length ? queryArgs._[0] : currentModel;
                if (model == null) {
                    throw new Error('The target model cannot be empty. Specify a model or set the default one with "use <model>".');
                }
                return executeQuery(app, Object.assign(queryArgs, {
                    model: model
                }));
            }).catch((err) => {
                console.error('ERROR', err.message);
            }).then(() => {
                return callback(null);
            });
        }
    });
    if (typeof server.setupHistory === 'function') {
        server.setupHistory(path.resolve(os.homedir(), '.themost_cat_history'), (err) => {
            if (err) {
                console.error('WARN', 'Command history cannot be loaded.', err.message);
            }
        });
    }
    server.on('exit', () => {
        // wait for pending queries e.g. when input stream ends
        queue.then(() => process.exit(0));
    });
}

module.exports.handler = function handler(argv) {
    let options = getConfiguration();
    if ((typeof argv.model === 'undefined' || argv.model === null) && !argv.interactive) {
        console.error('ERROR','The target cannot be empty');
        process.exit(1);
    }
    if (argv.configuration === 'development') {
        //set development mode
        process.env.NODE_ENV='development';
    }
    Object.assign(options, {
        configuration: argv.configuration
    });
    let app = getApplication(options);
    if (argv.interactive) {
        return startInteractive(app, argv, options);
    }
    return executeQuery(app, argv).then(() => {
        return process.exit(0);
    }).catch((err) => {
        console.error('ERROR','An error occurred while querying data.');
        console.error(err);
        return process.exit(1);
    });
};
