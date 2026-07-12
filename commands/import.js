const {getApplication, getConfiguration} = require('../util');
const { executeInUnattendedModeAsync } = require('@themost/data');
const fs = require('fs-extra');
const path = require('path');


module.exports.command = 'import <file> [options]';

module.exports.desc = 'Import data';

const DateTimeRegex = /^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?([+-](\d+):(\d+))?$/;

function reviveDates(key, value){
    if (typeof value === "string" && DateTimeRegex.test(value) ) {
        return new Date(value);
    }
    return value;
}

module.exports.builder = function builder(yargs) {
    return yargs.option('model', {
        describe:'the target model'
    }).option('configuration', {
        alias:'c',
        choices: ['development', 'production'],
        default:'development'
    });
};

module.exports.handler = function handler(argv) {
    let options = getConfiguration();
    if (typeof argv.model === 'undefined' || argv.model === null) {
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
    if (!fs.existsSync(argv.file)) {
        console.error('ERROR','Source data file cannot be found.');
        return process.exit(1);
    }
    //get data
    console.log('INFO','Getting item(s)');
    let data;
        return fs.readFile(path.resolve(process.cwd(),argv.file), 'utf8', (err, str)=> {
            if (err) {
                console.error('ERROR','An error occurred while trying to get items');
                console.error(err);
                return process.exit(1);
            }
            try {
                data = JSON.parse(str, reviveDates);
            }
            catch(err) {
                console.error('ERROR','An error occurred while converting item(s) from source.');
                console.error(err);
                return process.exit(1);
            }
            let app = getApplication(options);
            const context = app.createContext();
            void executeInUnattendedModeAsync(context, async () => {
                /**
                 * @type {import('@themost/data').DataModel}
                 */
                let model;
                try {
                    model = context.model(argv.model);
                    if (typeof model === 'undefined' || model === null) {
                        console.error('ERROR','Target model cannot be found');
                        return process.exit(1);
                    }
                }
                catch(err) {
                    console.error('ERROR','An error occurred while getting target model.');
                    console.error(err);
                    return process.exit(1);
                }
                const items = Array.isArray(data) ? data : [data];
                console.log('INFO',`Processing ${items.length} item(s)`);
                const itemState = {
                    inserted: 0,
                    updated: 0,
                    deleted: 0
                }
                for (const item of items) {
                    let state = 0;
                    state = item.$state;
                    if (typeof item.$state === 'undefined' || item.$state === null) {
                        state = item.$state = await model.inferStateAsync(item);
                    }
                    if (state === 1) {
                        itemState.inserted++;
                    } else if (state === 2) {
                        itemState.updated++;
                    } else if (state === 4) {
                        itemState.deleted++;
                    }
                }
                if (itemState.inserted > 0) {
                    console.log('INFO',`Inserting ${itemState.inserted} item(s)`);
                }
                if (itemState.updated > 0) {
                    console.log('INFO',`Updating ${itemState.updated} item(s)`);
                }
                if (itemState.deleted > 0) {
                    console.log('INFO',`Deleting ${itemState.deleted} item(s)`);
                }
                await model.save(items);
                context.finalize(()=> {
                    console.log('INFO','The operation was completed successfully');
                    return process.exit(0);
                });
            }).catch((err) => {
                    console.error('ERROR','An error occurred while importing data.');
                    console.error(err);
                    return process.exit(1);
                });
            });
};
