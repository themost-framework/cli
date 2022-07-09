/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
const writeFileFromTemplate = require('../../util').writeFileFromTemplate;
const getConfiguration = require('../../util').getConfiguration;
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

module.exports.command = 'service <name>';

module.exports.desc = 'Generate a new service';

module.exports.builder = {
};

module.exports.handler = function handler(argv) {
    let options = getConfiguration();
    //validating service name
    if (!/^[a-zA-Z0-9_]+$/.test(argv.name)) {
        console.error('ERROR','Service name is not valid. Expected only latin characters, numbers or "_" character.');
        return process.exit(1);
    }
    //get service name
    let serviceName = /service$/i.test(argv.name) ? _.upperFirst(_.camelCase(argv.name)) : _.upperFirst(_.camelCase(argv.name.concat('-service')));
    //get service file name
    let destFile = _.dasherize(serviceName).concat(options.mode==='typescript' ? '.ts': '.js');
    console.log('INFO',`Generating service ${destFile}`);
    let destPath = path.resolve(process.cwd(), options.base, `services/${destFile}`);
    console.log('INFO',`Validating service path ${destPath}`);
    if (fs.existsSync(destPath)) {
        console.error('ERROR','The specified service already exists.');
        return process.exit(1);
    }
    //get template file path
    let templateFile = path.resolve(__dirname,'../../templates/generate/service' + (options.mode==='typescript' ? '.ts': '.js') + '.ejs');
    
    //get destination folder path
    let destFolder = path.dirname(destPath);
    console.error('INFO', 'LISTENER', `Validating service folder (${destFolder}).`);
    try {
        fs.ensureDirSync(destFolder);
    }
    catch (err) {
        console.error('ERROR', 'LISTENER', 'An error occurred while validating destination path.');
        console.error(err);
        return process.exit(1);
    }
    console.log('INFO', 'LISTENER', `Generate service from template`);
    return writeFileFromTemplate(templateFile, destPath, {
        name:serviceName
    }).then(()=> {
        console.log('INFO', 'LISTENER', 'The operation was completed succesfully.');
        return process.exit(0);
    }).catch((err)=> {
        console.error('ERROR', 'LISTENER', 'An error occurred while generating service.');
        console.error(err);
        return process.exit(1);
    });
};
