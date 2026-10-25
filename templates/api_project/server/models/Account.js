import {EdmMapping} from '@themost/data';
import { Thing } from './Thing';

@EdmMapping.entityType('Account')
class Account extends Thing {
    /**
     * @constructor
     */
    constructor() {
        super();
    }
}

export {
    Account
}