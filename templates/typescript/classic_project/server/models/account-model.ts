import {EdmMapping} from '@themost/data';
import Thing = require('./thing-model');

/**
 * @class
 */
@EdmMapping.entityType('Account')
class Account extends Thing {
    public id?: number;
    /**
     * @constructor
     */
    constructor() {
        super();
    }
}

export = Account;
