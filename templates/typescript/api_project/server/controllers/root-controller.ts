import {HttpBaseController} from '@themost/web';
import {httpController, httpGet, httpAction} from '@themost/web/decorators';

@httpController()
class RootController extends HttpBaseController {

    constructor() {
        super();
    }

    @httpGet()
    @httpAction('index')
    getIndex(): any {
        return this.view();
    }

    @httpGet()
    @httpAction('hello')
    hello(): any {
        return this.json({
            "message": "Hello World!"
        });
    }

}

export = RootController;
