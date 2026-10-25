import {EdmMapping} from '@themost/data';
import { Account } from './Account';
import {ExpressDataContext} from '@themost/express';

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
    static async getMe(context: ExpressDataContext): Promise<any> {
        return await context.model('User').where('name').equal(context.user && context.user.name).getTypedItem();
    }
}

export {
    User
}
