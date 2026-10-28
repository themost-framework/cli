const JsonTypes = [
    'StructuredValue',
    'Quantity',
    'Rating'
];

/**
 * 
 * @param {import('@themost/common').DataContextBase} context 
 * @param {import('@themost/common').DataModelProperties} model 
 */
function formatJsonTypedAttribute(context, model) {

    if (JsonTypes.includes(model.name)) {
        model.hidden = true;
    }
    if (JsonTypes.includes(model.inherits)) {
        model.hidden = true;
    }
    for (const field of model.fields) {
        // get the model for the current field type
        const fieldModel = context.model(field.type);
        // if the field model inherits from another model, check if it is JSON typed
        if (fieldModel) {
            if (fieldModel.inherits) {
                const inheritedModel = context.model(fieldModel.inherits);
                // if inherited model is a JSON typed model
                if (JsonTypes.includes(inheritedModel.inherits)) {
                    // push the current model to JSON types if not already included
                    // to follow the JSON typed inheritance chain
                    if (JsonTypes.includes(fieldModel.name) === false) {
                        JsonTypes.push(fieldModel.name);
                    }
                }
            }
            // if the field model itself is a JSON typed model, add it to the JSON types list if not already included
            const isJsonTypedValue = JsonTypes.includes(fieldModel.name) || JsonTypes.includes(fieldModel.inherits);
            if (isJsonTypedValue) {
                // perform formatting logic for a JSON typed attribute
                field.additionalType = field.type;
                field.type = 'Json';
            }
        }
    }
}

module.exports = {
    formatJsonTypedAttribute
};