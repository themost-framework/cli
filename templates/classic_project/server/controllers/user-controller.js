import {httpController,httpGet, httpAction} from '@themost/web/decorators';
import HttpDataModelController from '@themost/web/controllers/model';

@httpController()
class UserController extends HttpDataModelController {

    constructor() {
        super();
    }

    @httpGet()
    @httpAction('me')
    async getMe() {
        return await this.context.model('User').where('name').equal(this.context.user.name).getItem();
    }

    @httpGet()
    @httpAction('dashboard')
    getDashboard() {
        return this.view();
    }

}

module.exports = UserController;
