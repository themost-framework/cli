import {EdmMapping,EdmType} from '@themost/data';
import {DataObject} from '@themost/data';
import { Account } from './Account';

/**
 * @class
 * @property {Array<Account|any>} members
 * @property {number} id
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

export { Group };