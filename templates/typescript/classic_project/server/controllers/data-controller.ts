import {HttpDataModelController} from '@themost/web';
import {httpController} from '@themost/web/decorators';

@httpController()
class DataController extends HttpDataModelController {
    constructor() {
        super();
    }
}

export = DataController;
