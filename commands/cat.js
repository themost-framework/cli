// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const getConfiguration = require('../util').getConfiguration;
const getHttpApplication = require('../util').getHttpApplication;
const fs = require('fs-extra');
const path = require('path');

const QUERY_OPTS = ['filter', 'expand', 'order', 'group', 'top', 'skip', 'count', 'select'];

module.exports.command = 'cat <model> [options]';

module.exports.desc = 'Query data';

module.exports.builder = function builder(yargs) {
    return yargs.option('model', {
        describe:'the target model'
    }).option('dev', {
        default: false,
        boolean: true,
        describe: 'enables development mode'
    }).option('filter', {
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
};

module.exports.handler = function handler(argv) {
    let options = getConfiguration();
    if (typeof argv.model === 'undefined' || argv.model === null) {
        console.error('ERROR','The target cannot be empty');
        process.exit(1);
    }
    if (argv.dev) {
        //set development mode
        process.env.NODE_ENV='development';
    }
    let app = getHttpApplication(options);
    app.execute((context)=> {
        try {
            let model = context.model(argv.model);
            if (typeof model === 'undefined' || model === null) {
                console.error('ERROR','Target model cannot be found.');
               return process.exit(1);
            }
            let query={};
            QUERY_OPTS.forEach((x)=> {
                if (argv.hasOwnProperty(x) && argv[x]) {
                    query[`$${x}`] = argv[x];
                }
            });
            //build query options
            model.filter(query, (err, q)=> {
                if (err) {
                    console.error('ERROR','An error occurred while applying query.');
                        console.error(err);
                        return process.exit(1);
                }
                
                let source = argv.count ? q.silent().getList() : q.silent().getItems();
                return source.then((res)=> {
                        if (res) {
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
                            if (argv.out) {
                                let outFile = path.resolve(process.cwd(), argv.out);
                                return fs.writeFile(outFile, JSON.stringify(finalResult,null,4),'utf8',(err)=> {
                                    if (err) {
                                        console.error('ERROR','An error occurred while writing output.');
                                        console.error(err);
                                        return process.exit(1);
                                    }
                                    console.error('INFO',`Data was succesfully exported to ${outFile}`);
                                    return process.exit(0);
                                });
                            }
                            else {
                                console.log(JSON.stringify(finalResult,null,4));
                            }
                        }
                        process.exit(0);
                    }).catch((err)=> {
                        console.error('ERROR','An error occurred while querying data.');
                        console.error(err);
                        return process.exit(1);
                    });
                
            });
        }
        catch(err) {
            console.error('ERROR','An error occurred while getting data.');
            console.error(err);
            process.exit(1);
        }
       
    });
};
