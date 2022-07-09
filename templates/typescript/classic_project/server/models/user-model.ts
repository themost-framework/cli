import { EdmMapping } from '@themost/data';
import Account = require('./account-model');

/**
 * @class
 */
@EdmMapping.entityType('User')
class User extends Account {

    @EdmMapping.func('Me', 'User')
    public static async getMe(context: any) {
        return await context.model('User').where('name').equal(context.user && context.user.name).getTypedItem();
    }

    public lockoutTime?: Date;
    public logonCount?: number;
    public enabled?: boolean;
    public lastLogon?: Date;
    public groups?: Array<any>;
    public userFlags?: number;
    public id?: number;

    /**
     * @constructor
     */
    constructor() {
        super();
    }

}

export = User;
