const {contentFromTemplate, getConfiguration, createLogger} = require('../../util');
const fs = require('fs-extra');
const path = require('path');
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
    const options = getConfiguration();
    const logger = createLogger();
    // get file name
    const destFile = argv.name.concat('.json');
    let destPath = path.resolve(process.cwd(), options.base, `config/models/${destFile}`);
    if (fs.existsSync(destPath)) {
        logger.warn('The specified model already exists');
        return Promise.resolve();
    }
    // read template
    let templateFile = path.resolve(__dirname,'../../templates/generate/model.json.ejs');
    const data = Object.assign({}, argv, {
        title: pluralize.plural(argv.name)
    });
    return contentFromTemplate(templateFile, data).then((str) => {
        // noinspection JSCheckFunctionSignatures
        const model = JSON.parse(str);
        if (model.inherits || model.implements) {
            // clear fields
            model.fields.splice(0, model.fields.length);
        }
        fs.ensureDirSync(path.dirname(destPath));
        fs.writeFileSync(destPath, JSON.stringify(model, null, 4));
        return Promise.resolve();
    }).then(() => {
        logger.info(`The model "${argv.name}" generated successfully at ${path.relative(process.cwd(), destPath)}`);
        return Promise.resolve();
    }).catch((err)=> {
        logger.error('An error occurred while generating model');
        return Promise.reject(err);
    });
};
