// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const {writeFileFromTemplate, getConfiguration, createLogger} = require('../../util');
const fs = require('fs-extra');
const path = require('path');

module.exports.command = 'controller <name>';

module.exports.desc = 'Generate a new controller';

module.exports.builder = {
};

module.exports.handler = function (argv) {
    const options = getConfiguration();
    const logger = createLogger();
    //get controller name e.g. Home or HomeController => HomeController
    const controllerName = argv.name.replace(/Controller$/i,'').concat('Controller');
    //get controller file name
    const controllerFile = controllerName.concat(options.mode==='typescript' ? '.ts': '.js');
    const controllerPath = path.resolve(process.cwd(), options.base, `controllers/${controllerFile}`);
    if (fs.existsSync(controllerPath)) {
        logger.warn('The specified controller already exists.');
        return Promise.resolve();
    }
    //get template file path
    const templateFile = path.resolve(__dirname,'../../templates/generate/controller'+(options.mode==='typescript' ? '.ts': '.js')+'.ejs');

    //get destination folder path
    const destFolder = path.dirname(controllerPath);
    return fs.ensureDir(destFolder).catch((err) => {
           logger.error('An error occurred while validating destination path.');
           return Promise.reject(err);
    }).then(() => {
       return writeFileFromTemplate(templateFile, controllerPath, {
            name:controllerName.replace(/Controller$/i,'')
        }).then(() => {
           logger.info(`The controller "${argv.name}" generated successfully at ${path.relative(process.cwd(), controllerPath)}`);
           return Promise.resolve();
       }).catch((err)=> {
           logger.error('An error occurred while generating controller.');
           return Promise.reject(err);
        });

    });

};
