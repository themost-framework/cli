// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const writeFileFromTemplate = require('../../util').writeFileFromTemplate;
const getConfiguration = require('../../util').getConfiguration;
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');


module.exports.command = 'controller <name>';

module.exports.desc = 'Generate a new controller';

module.exports.builder = {
};

module.exports.handler = function handler(argv) {
    let options = getConfiguration();
    //validating controller name
    if (!/^[a-zA-Z0-9_]+$/.test(argv.name)) {
        console.error('ERROR','Controller name is not valid. Expected only latin characters, numbers or "_" character.');
        return process.exit(1);
    }
     //get controller name
    let controllerName = /controller$/i.test(argv.name) ? _.upperFirst(_.camelCase(argv.name)) : _.upperFirst(_.camelCase(argv.name.concat('-controller')));
    //get controller file name
    let controllerFile = _.dasherize(controllerName).concat(options.mode==='typescript' ? '.ts': '.js');
    console.log('INFO',`Generating controller ${controllerFile}`);
    let controllerPath = path.resolve(process.cwd(), options.base, `controllers/${controllerFile}`);
    console.log('INFO',`Validating controller path ${controllerPath}`);
    if (fs.existsSync(controllerPath)) {
        console.error('ERROR','The specified controller already exists.');
        return process.exit(1);
    }
    //get template file path
    let templateFile = path.resolve(__dirname,'../../templates/generate/controller'+(options.mode==='typescript' ? '.ts': '.js')+'.ejs');
    
    //get destination folder path
    let destFolder = path.dirname(controllerPath);
    console.error('INFO',`Validating controller folder (${destFolder}).`);
    fs.ensureDir(destFolder, (err)=> {
       if (err) {
           console.error('ERROR','An error occurred while validating destination path.');
            console.error(err);
       } 
       writeFileFromTemplate(templateFile, controllerPath, {
            name:controllerName.replace(/Controller$/i,'')
        }).then(()=> {
            console.log('INFO','The operation was completed succesfully.');
              return process.exit(0);
        }).catch((err)=> {
            console.error('ERROR','An error occurred while generating controller.');
            console.error(err);
            return process.exit(1);
        });
       
    });
    
};
