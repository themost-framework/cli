import HttpBaseController from '@themost/web/controllers/base';
import {httpController,httpGet,httpAction} from '@themost/web/decorators';

@httpController()
class RootController extends HttpBaseController {

    constructor() {
        super();
    }

    @httpGet()
    @httpAction('index')
    async getIndex() {
        return this.view();
    }

}

module.exports = RootController;
