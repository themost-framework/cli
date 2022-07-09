import {httpController, httpGet, httpAction} from '@themost/web/decorators';
import {HttpDataModelController} from '@themost/web';
import User = require('../models/user-model');

@httpController()
class UserController extends HttpDataModelController {

    constructor() {
        super();
    }

    @httpGet()
    @httpAction('me')
    async getMe() {
        return await User.getMe(this.context);
    }

    @httpGet()
    @httpAction('dashboard')
    getDashboard() {
        return this.view();
    }

}

export = UserController;
