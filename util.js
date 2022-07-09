/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
const _ = require('lodash');
const ejs = require('ejs');
const fs = require('fs-extra');
const path = require('path');

const configurationDefaults = {
                "base":"server",
                "out": "dist/server"
            };

/**
 *
 * @param s
 * @returns {*}
 * @private
 */
function _dasherize(s) {
    if (_.isString(s))
        return _.trim(s).replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').replace(/^-/,'').toLowerCase();
    return s;
}

/**
 * @method dasherize
 * @memberOf _
 */
if (typeof _.dasherize !== 'function') {
    _.mixin({'dasherize' : _dasherize});
}

function writeFileFromTemplate(source, dest, data) {
    return ejs.renderFile(source, data).then((res)=> {
        return new Promise((resolve, reject)=> {
            //write file
            fs.writeFile(dest, res, (err) => {
              if (err) {
                    return reject(err);
              }
              return resolve();
            });
        });
    });
}

module.exports.writeFileFromTemplate = writeFileFromTemplate;

function contentFromTemplate(source, data) {
    return ejs.renderFile(source, data);
}

module.exports.contentFromTemplate = contentFromTemplate;

function loadConfiguration() {
    let config = require(path.resolve(process.cwd(), '.themost-cli.json'));
    return Object.assign({}, configurationDefaults, config);
}

module.exports.loadConfiguration = loadConfiguration;

function getConfiguration() {
    try {
        return loadConfiguration();
    }
    catch(err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.error('ERROR','Configuration cannot be found. It seems that current working directory does not contain a MOST Web Framework project.');
            process.exit(1);
        }
        else {
            console.error('ERROR','An error occurred while loading configuration.');
            console.error(err);
            process.exit(1);
        }
    }
}

module.exports.getConfiguration = getConfiguration;

    class SimpleDataContext {
    constructor(configuration) {
        this.getConfiguration = ()=> configuration;
    }
   getStrategy(strategyCtor) {
    return this.getConfiguration().getStrategy(strategyCtor);
  }
  
  model(name) {
    let self = this;
    if ((name === null) || (name === undefined))
        return null;
    let obj = self.getConfiguration().getStrategy(function DataConfigurationStrategy() {}).model(name);
    if (_.isNil(obj)) {
        return null;
    }
    //do some things for CLI only
    //remove class path if any
    delete obj.classPath;
    //clear event listeners
    obj.eventListeners = [];
    let dataModule = require.resolve('@themost/data/data-model',{
            paths:[path.resolve(process.cwd(), 'node_modules')]
        });
    let DataModel = require(dataModule).DataModel,
        model = new DataModel(obj);
    //set model context
    model.context = self;
    //return model
    return model;
  }
  
}

module.exports.SimpleDataContext = SimpleDataContext;

module.exports.getDataConfiguration = function getDataConfiguration(options) {
    let DataConfiguration;
    try {
        let dataModule = require.resolve('@themost/data/data-configuration',{
            paths:[path.resolve(process.cwd(), 'node_modules')]
        });
        DataConfiguration = require(dataModule).DataConfiguration;
    }
    catch(err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.error('ERROR','MOST Web Framework data configuration module cannot be found.');
        }
        else {
            console.error('ERROR','An error occurred while trying to initialize data configuration.');
            console.error(err);
        }
        return process.exit(1);
    }
    console.log('INFO','Initializing configuration');
    let res = new DataConfiguration(path.resolve(process.cwd(), options.base, 'config'));
    //modify data configuration strategy
    let dataConfigurationStrategy = res.getStrategy(function DataConfigurationStrategy() {});
    let getModel = dataConfigurationStrategy.model;
    dataConfigurationStrategy.model = function(name) {
        let model = getModel.bind(this)(name);
        if (model) {
            //do some things for CLI only
            //remove class path if any
            delete model.classPath;
            //clear event listeners
            model.eventListeners = [];
        }
        return model;
    };
    
    return res;
    
};

module.exports.getBuilder = function getBuilder(config) {
    let ODataConventionModelBuilder;
    let dataModule = require.resolve('@themost/data/odata',{
            paths:[path.resolve(process.cwd(), 'node_modules')]
        });
    ODataConventionModelBuilder = require(dataModule).ODataConventionModelBuilder;
    
    let dataObjectModule = require.resolve('@themost/data/data-object',{
            paths:[path.resolve(process.cwd(), 'node_modules')]
        });
    //disable data model class loader
    config.getStrategy(function ModelClassLoaderStrategy() {}).resolve = function(model) {
        return require(dataObjectModule).DataObject;
    };
    return new ODataConventionModelBuilder(config);
};

module.exports.getHttpApplication = function getHttpApplication(options) {
    let HttpApplication;
    let appModule;
    try {
        appModule = require.resolve('@themost/web',{
            paths:[path.resolve(process.cwd(), 'node_modules')]
        });
        HttpApplication = require(appModule).HttpApplication;
    }
    catch(err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.error('ERROR','MOST Web Framework module cannot be found.');
        }
        else {
            console.error('ERROR','An error occurred while trying to initialize MOST Web Framework Application.');
            console.error(err);
        }
        return process.exit(1);
    }
    console.log('INFO','Initializing application');
    let app  = new HttpApplication(path.resolve(process.cwd(), options.out));
        let strategy = app.getConfiguration().getStrategy(function DataConfigurationStrategy() {
        });
        //get adapter types
        let adapterTypes = strategy.adapterTypes;
        //get configuration adapter types
        let configurationAdapterTypes = app.getConfiguration().getSourceAt('adapterTypes');
        if (Array.isArray(configurationAdapterTypes)) {
            configurationAdapterTypes.forEach((configurationAdapterType)=> {
                if (typeof adapterTypes[configurationAdapterType.invariantName] === 'undefined') {
                    //load adapter type
                    let adapterModulePath = require.resolve(configurationAdapterType.type,{
                        paths:[path.resolve(process.cwd(), 'node_modules')]
                    });
                    let adapterModule = require(adapterModulePath);
                    adapterTypes[configurationAdapterType.invariantName] = {
                        invariantName:configurationAdapterType.invariantName,
                        name: configurationAdapterType.name,
                        createInstance:adapterModule.createInstance
                    };
                }
            });
        }
        // auto register application extensions
        let disableExtensions = false;
        if (Object.prototype.hasOwnProperty.call(options, 'disableExtensions')) {
            disableExtensions = options.disableExtensions;
        }
        if (disableExtensions === false) {
            console.log('INFO','Loading application extensions');
            const extensionsDir = path.resolve(process.cwd(), options.out, 'extensions');
            if (fs.existsSync(extensionsDir)) {
                const extensionModules = fs.readdirSync(extensionsDir);
                extensionModules.filter((extensionModule) => {
                    return path.extname(extensionModule) === '.js';
                }).forEach((extensionModule) => {
                    require(path.resolve(extensionsDir, extensionModule));
                });
            }
        }
        // auto register application services
        let disableServices = false;
        if (Object.prototype.hasOwnProperty.call(options, 'disableServices')) {
            disableServices = options.disableServices;
        }
        if (disableServices === false) {
            console.log('INFO','Loading application services');
            // get services configuration
            const ServicesConfiguration = require(appModule).ServicesConfiguration;
            // configure application
            ServicesConfiguration.config(app);
        }
    return app;
};
