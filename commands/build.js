/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
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