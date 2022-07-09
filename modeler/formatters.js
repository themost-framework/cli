// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const _ = require('lodash');
const pluralize = require('pluralize');

class Utils {
    static removeAttribute(model, name) {
        if (model && _.isArray(model.fields)) {
            let i = _.findIndex(model.fields, (x)=> {
                return x.name === 'potentialAction';
            });
            if (i>=0) {
                model.fields.splice(i,1);
            }
        }
    }
    static findAttribute(model, name) {
        if (model && _.isArray(model.fields)) {
            return _.find(model.fields, (x)=> {
                return x.name === name;
            });
        }
    }

    static assignToAttribute(model, name, data) {
        if (model && _.isArray(model.fields)) {
            let attr = _.find(model.fields, (x)=> {
                return x.name === name;
            });
            if (attr) {
                Object.assign(attr, data);
            }
        }
    }
}

module.exports.thingModelFormatter = function(model) {
    if (model.name === 'Thing') {
        Object.assign(model, {
           "abstract": true,
           "hidden": true
        });
        Utils.findAttribute(model, 'id').primary = true;
        Utils.removeAttribute(model, 'potentialAction');
        Utils.assignToAttribute(model, 'identifier', {
            "type":"Text"
        });
        Utils.assignToAttribute(model, 'image', {
            "type":"Text"
        });
    }
};

module.exports.intangibleModelFormatter = function(model) {
    if (model.name === 'Intangible') {
        Object.assign(model, {
            "abstract": true,
            "hidden": true
        });
    }
};

module.exports.enumerationModelFormatter = function(model) {
    if (model.name === 'Enumeration') {
        Object.assign(model, {
            "abstract": true,
            "hidden": true
        });
    }
};

module.exports.inheritsPartyFormatter = function(model) {
    if (model.name === "Person" || model.name === "Organization") {
        model.inherits = "Party";
    }
};


module.exports.implementsEnumerationFormatter = function(model) {
    if (model.inherits && model.inherits === 'Enumeration') {
        delete model.inherits;
        let idField = model.fields.find((x)=> {
            return x.name === 'id';
        });
        if (idField) {
            idField.type = "Integer";
        }
        model.implements = "Enumeration";
    }
};

module.exports.implementsIntangibleFormatter = function(model) {
    if (model.inherits && model.inherits === 'Intangible') {
        delete model.inherits;
        model.implements = "Intangible";
    }
};

module.exports.implementsStructuredValueFormatter = function(model) {
    if (model.name === 'StructuredValue') {
        delete model.inherits;
        let idField = model.fields.find((x)=> {
            return x.name === 'id';
        });
        if (idField) {
            idField.type = "Integer";
        }
        model.implements = "Intangible";
    }
};

module.exports.trimPluralizedPropertyFormatter = function(model) {
    let names = _.map(model.fields, (x)=> {
       return x.name;
    });
    _.find(names, (x)=> {
        if (pluralize.isSingular(x)) {
            let index = _.findIndex(model.fields, (y) => {
                return y.name === pluralize.plural(x);
            });
            if (index>=0) {
                model.fields.splice(index, 1);
            }
        }
    });
};