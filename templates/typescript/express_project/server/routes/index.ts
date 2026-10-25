import express from 'express';

function indexRouter() {
    const router = express.Router();
    /* GET home page. */
    router.get('/', (_req, res, _next) => {
      res.render('index', { title: 'Express server project using @themost framework' });
    });
    return router;
}

export { indexRouter };