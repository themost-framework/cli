// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const getConfiguration = require('../util').getConfiguration;

module.exports = {
    command: 'build',
    desc: 'Build current @themost/cli project',
    builder: function builder(yargs) {
        return yargs;
    },
    handler: function handler(argv) {
        let options = getConfiguration();
        let buildModule = '@themost-devkit/build';
        let build;
        if (options.mode === 'typescript') {
            // load build module
            buildModule = '@themost-devkit/build-typescript';
            build = require(buildModule).build;
            return build(process.cwd()).then( () => {
                console.log('INFO', 'Build operation was completed successfully.');
            }).catch(err => {
                console.error(err);
            });
        } 
        else {
            build = require(buildModule).build;
            return build(process.cwd()).then( () => {
                console.log('INFO', 'Build operation was completed successfully.');
            }).catch(err => {
                console.error(err);
            });
        }
    }
};