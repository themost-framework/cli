import {Router} from 'express';

function indexRouter(): Router {
    let router = Router();

    /* GET home page. */
    router.get('/', (req, res, next) => {
    res.render('index', { title: 'Express' });
    });
    return router;
}

export {
    indexRouter
}
