const {writeFileFromTemplate, getConfiguration, SimpleDataContext,
    getBuilder, getDataConfiguration, createLogger} = require('../../util');
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const generateClassDefinitionHandler = require('./classdef').handler;


function generateAnyClass(argv) {
    //get cli options
    let options = getConfiguration();
    //get data configuration
    let config = getDataConfiguration(options);
    //get OData Builder
    let builder = getBuilder(config);
    let sources = [];
    return builder.getEdm().then((schema)=> {
        if (argv.name === 'app' || argv.name === '*') {
            sources = schema.entityType.map((x)=> {
                return generateClass(Object.assign({
                    inProcClass:[]
                }, argv, {
                    "name": x.name
                }), true);
            });
        }
        else {
            sources = argv.name.split('+').map((x)=> {
                return generateClass(Object.assign({
                    inProcClass:[]
                }, argv, {
                    "name": x
                }), false);
            });
        }
        return Promise.all(sources);
    });
    
}

module.exports.generateAnyClass = generateAnyClass;

function generateClass(argv, ignoreOther) {
    return new Promise((resolve, reject) => {
        const logger = createLogger();
        //get cli options
        let options = getConfiguration();
        //get data configuration
        let config = getDataConfiguration(options);
        //validating name
        if (!/^[a-zA-Z0-9_-]+$/.test(argv.name)) {
            logger.error('An error occurred while validating class name.');
            return reject(new Error('Class name is not valid. Expected only Latin characters, numbers or "_,-" characters.'));
        }
        //--
        let context = new SimpleDataContext(config);
        argv.inProcClass = argv.inProcClass || [];
        if (argv.inProcClass.indexOf(argv.name)>=0) {
            return resolve();
        }
        //get OData Builder
        let builder = getBuilder(config);
        return builder.getEdm().then(()=> {
                //get model definition
                let emptyModel = {
                        name: _.upperFirst(_.camelCase(argv.name)),
                        fields: [],
                        attributes:[],
                        inherits: null
                    };
                let dataTypes = config.getDataConfiguration().dataTypes;
                let model = context.model(argv.name) || emptyModel;
                model.inherits = model.inherits || null; 
                model.imports = [];
                if (model.inherits) {
                    model.inheritsClassPath = './'.concat(model.inherits);
                    model.imports.push({
                      "name": model.inherits,
                      "from": model.inheritsClassPath
                    });
                }
                else {
                    model.imports.push({
                      "name": "DataObject",
                      "from": "@themost/data"
                    });
                }
                model.attributes.forEach((x)=> {
                   //format data type
                    let dataType = dataTypes[x.type];
                    if (typeof x.type === 'undefined') {
                        x.typeName = x.many ?  "Array<*>" : "*";
                        return;
                    }
                    if (!Object.prototype.hasOwnProperty.call(x, 'nullable')) {
                        x.nullable = true;
                    }
                    //add import
                    if (x.model === model.name) {
                        let importModel = context.model(x.type);
                        if (importModel && importModel.name !== model.name) {
                            if (typeof model.imports.find((x)=> { return x.name === importModel.name }) === 'undefined') {
                                model.imports.push({
                                    "name": importModel.name,
                                    "from": "./".concat(importModel.name)
                                });
                            }
                            x.typeName = x.many ?  'Array<*>' : '*';
                            return;
                        }
                    }
                    if (dataType) {
                        x.typeName = x.many ?  "Array<" + dataType.type + ">" : dataType.type;
                        return;
                    }
                    x.typeName = x.many ?  'Array<*>' : '*';
                });
                //get file name
                let destFile = model.name.concat(options.mode==='typescript' ? '.ts': '.js');
                logger.info(`Generating class ${destFile}`);
                let destPath = path.resolve(process.cwd(), options.base, `models/${destFile}`);
                logger.info(`Validating class path ${destPath}`);
                if (fs.existsSync(destPath) && !argv.force) {
                    logger.warn(`The specified class "${argv.name}" already exists.Skipping class generation.`);
                    return resolve();
                }
                //get template file path
                let templateFile = path.resolve(__dirname, '../../templates/generate/class'+(options.mode==='typescript' ? '.ts': '.js')+'.ejs');
                //get destination folder path
                let destFolder = path.dirname(destPath);
                logger.info(`Validating class folder (${destFolder}).`);
                void fs.ensureDir(destFolder, (err) => {
                    if (err) {
                        logger.error('An error occurred while validating destination path.');
                        return reject(err);
                    }
                    const data = {
                        ...model
                    };
                    data.attributes = model.attributes;
                    writeFileFromTemplate(templateFile, destPath, data).then(() => {
                        logger.info('The operation was completed successfully.');
                        if (ignoreOther) {
                            return resolve();
                        }
                        //add in-process class
                        argv.inProcClass.push(model.name);
                        let generateExtra = model.imports.filter((x)=> {
                           return x.name !== "DataObject" && x.name !== model.name;
                        }).map((x)=> {
                            return generateClass(Object.assign({}, argv, {
                                    'name': x.name,
                                    'silent': true,
                                    'force': false
                                }));
                        });
                        Promise.all(generateExtra).then(()=> {
                            if (options.mode==='typescript') {
                                return resolve();
                            }
                            return resolve();
                        }).catch((err)=> {
                            return reject(err);
                        });
                    }).catch((err) => {
                        logger.error('An error occurred while generating data model class.');
                        return reject(err);
                    });
                });
        }).then(() => {
            return generateClassDefinitionHandler(argv);
        }).catch((err) => {
            return reject(err);
        });
    });
}

module.exports.generateClass = generateClass;

module.exports.command = 'class <name>';

module.exports.desc = 'Generate a new data model class';

module.exports.builder = function builder(yargs) {
    return yargs.option('silent', {
        type: 'boolean',
        default: false,
        describe: 'disable errors'
    }).option('force', {
        type: 'boolean',
        default: false,
        describe: 'replace if exists'
    });
};

module.exports.handler = function handler(argv) {
    return generateAnyClass(argv);
};
