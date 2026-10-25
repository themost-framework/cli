import express from 'express';
import {usersRouter} from './users';
import {Router} from 'express-serve-static-core';

function api(): Router {
    const router = express.Router();
    router.use('/users', usersRouter());
    return router;
}

export { api };