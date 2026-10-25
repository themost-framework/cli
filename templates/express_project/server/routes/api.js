import express from 'express';
import {usersRouter} from './users';
function api() {
    const router = express.Router();
    router.use('/users', usersRouter());
    return router;
}

export { api };