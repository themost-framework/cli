import {EdmMapping, DataObject} from '@themost/data';

@EdmMapping.entityType('Thing')
class Thing extends DataObject {
    /**
     * @constructor
     */
    constructor() {
        super();
    }
}

export {
    Thing
}