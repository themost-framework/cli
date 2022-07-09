import {EdmMapping} from '@themost/data';
import {DataObject} from '@themost/data/';
let Account = require('./account-model');
/**
 * @class
 
 * @property {Array<Account|any>} members
 * @property {number} id
 * @augments {DataObject}
 */
@EdmMapping.entityType('Group')
class Group extends Account {
    /**
     * @constructor
     */
    constructor() {
        super();
    }
}
module.exports = Group;