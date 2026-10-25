import {EdmMapping,EdmType} from '@themost/data';
import {DataObject} from '@themost/data';
import { Account } from './Account';
/**
 * @class

 * @property {Date} lockoutTime
 * @property {number} logonCount
 * @property {boolean} enabled
 * @property {Date} lastLogon
 * @property {Array<Group|any>} groups
 * @property {number} userFlags
 * @property {number} id
 */
@EdmMapping.entityType('User')
class User extends Account {
    /**
     * @constructor
     */
    constructor() {
        super();
    }

    /**
     * Gets the interactive user
     * @param context
     * @returns {Promise<User>}
     */
    @EdmMapping.func('Me', 'User')
    static async getMe(context) {
        return await context.model('User').where('name').equal(context.user && context.user.name).getTypedItem();
    }
}

export {
    User
}
