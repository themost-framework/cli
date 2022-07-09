import {EdmMapping} from '@themost/data';
import Account = require('./account-model');

/**
 * @class
 */
@EdmMapping.entityType('Group')
class Group extends Account {

    public members?: Array<Account|any>;
    public id?: number;

    /**
     * @constructor
     */
    constructor() {
        super();
    }
}

export = Group;
