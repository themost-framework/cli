
import HttpBaseController from '@themost/web';
import {httpController,httpGet,httpAction} from '@themost/web';

@httpController()
class RootController extends HttpBaseController {
    
    constructor() {
        super();
    }
    
    @httpGet()
    @httpAction('index')
    getIndex() {
        return this.view();
    }
}

module.exports = RootController;
