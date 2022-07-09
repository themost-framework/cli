// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const contentFromTemplate = require('../../util').contentFromTemplate;
const getConfiguration = require('../../util').getConfiguration;
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const pluralize = require('pluralize');

module.exports.command = 'model <name>';

module.exports.desc = 'Generate a new model';

module.exports.builder = function builder(yargs) {
    return yargs.option('implements', {
        describe:'define the model which is going to be implemented by this model',
    }).option('inherits', {
        describe: 'define the model which is going to be inherited by this model'
    })
};

module.exports.handler = function handler(argv) {
    let options = getConfiguration();
    // validating name
    if (!/^[a-zA-Z0-9_]+$/.test(argv.name)) {
        console.error('ERROR','Model name is not valid. Expected only latin characters, numbers or "_" character.');
        return process.exit(1);
    }
    // get file name
    let destFile = argv.name.concat('.json');
    console.log('INFO',`Generating model ${argv.name}`);
    let destPath = path.resolve(process.cwd(), options.base, `config/models/${destFile}`);
    console.log('INFO',`Validating model path ${destPath}`);
    if (fs.existsSync(destPath)) {
        console.error('ERROR','The specified model already exists.');
        return process.exit(1);
    }
    // read template
    let templateFile = path.resolve(__dirname,'../../templates/generate/model.json.ejs');
    console.log('INFO', 'MODEL', `Generate model from template`);
    const data = _.assign({ }, argv, {
        title: pluralize.plural(argv.name)
    });
    return contentFromTemplate(templateFile, data).then( str => {
        const model = JSON.parse(str);
        if (model.inherits || model.implements) {
            // clear fields
            model.fields.splice(0, model.fields.length);
        }
        fs.writeFileSync(destPath, JSON.stringify(model, null, 4));
        console.log('INFO', 'MODEL', 'The operation was completed succesfully.');
        return process.exit(0);
    }).catch((err)=> {
        console.error('ERROR', 'LISTENER', 'An error occurred while generating model.');
        console.error(err);
        return process.exit(1);
    });
};
