/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
const path = require('path');

module.exports.command = 'new <command>';

module.exports.desc = 'Create a new component';

module.exports.builder = function builder(yargs) {
    return yargs.commandDir(path.resolve(__dirname, 'new_commands'));
};

module.exports.handler = function handler() {

};
