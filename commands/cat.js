// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const {getConfiguration, getApplication, createLogger} = require('../util');
const isInteractiveSession = require('../interactive').isInteractiveSession;
const fs = require('fs-extra');
const path = require('path');

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
                    let state = argv.state === 'insert' ? 1 : argv.state === 'update' ? 2 : argv.state === 'delete' ? 4 : 0;
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
            console.error('INFO',`Data was successfully exported to ${outFile}`);
        });
    }
    if (isInteractiveSession()) {
        // clear previous output of interactive shell
        console.clear();
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

module.exports.handler = function handler(argv) {
    let options = getConfiguration();
    const logger = createLogger();
    if ((typeof argv.model === 'undefined' || argv.model === null)) {
        return Promise.reject(new Error('The target cannot be empty'));
    }
    // set NODE_ENV based on the given configuration
    process.env.NODE_ENV = argv.configuration;
    Object.assign(options, {
        configuration: argv.configuration
    });
    let app = getApplication(options);
    return executeQuery(app, argv).then(() => {
        return Promise.resolve();
    }).catch((err) => {
        logger.error('An error occurred while querying data.');
        return Promise.reject(err);
    });
};
