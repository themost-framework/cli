import {HttpBaseController} from '@themost/web';
import {httpController, httpGet, httpAction} from '@themost/web/decorators';

@httpController()
class RootController extends HttpBaseController {

    constructor() {
        super();
    }

    @httpGet()
    @httpAction('index')
    getIndex() {
        return Promise.resolve(this.view());
    }

}

export = RootController;
