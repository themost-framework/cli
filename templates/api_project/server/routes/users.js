import express from 'express';
import {HttpNotFoundError, HttpBadRequestError} from '@themost/common';

/**
 * A sample router for serving users using @themost/data
 * @returns {import('express').Router}
 */
function usersRouter() {
    const router = express.Router();

    /**
     * GET /users
     * Returns a list of users. Supports OData-like query options
     * e.g. /users?$filter=enabled eq true&$select=id,name&$orderby=name&$top=10&$skip=0
     */
    router.get('/', async (req, res, next) => {
        try {
            // prepare query based on request query params ($filter, $select, $orderby, $top, $skip, $expand)
            const q = await req.context.model('User').filterAsync(req.query);
            // if $top is not defined, apply a default page size
            if (req.query.$top == null) {
                q.take(25);
            }
            // returns { total, skip, value }
            const result = await q.getList();
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    });

    /**
     * GET /users/me
     * Returns the interactive user (if any)
     */
    router.get('/me', async (req, res, next) => {
        try {
            const name = req.context.user && req.context.user.name;
            const user = await req.context.model('User')
                .where('name').equal(name)
                .expand('groups')
                .getItem();
            if (user == null) {
                return next(new HttpNotFoundError('User cannot be found'));
            }
            return res.json(user);
        } catch (err) {
            return next(err);
        }
    });

    /**
     * GET /users/:id
     * Returns a single user by identifier
     */
    router.get('/:id', async (req, res, next) => {
        try {
            const user = await req.context.model('User')
                .where('id').equal(req.params.id)
                .expand('groups')
                .getItem();
            if (user == null) {
                return next(new HttpNotFoundError('User cannot be found'));
            }
            return res.json(user);
        } catch (err) {
            return next(err);
        }
    });

    /**
     * POST /users
     * Creates a new user
     */
    router.post('/', async (req, res, next) => {
        try {
            if (req.body == null || typeof req.body !== 'object' || Array.isArray(req.body)) {
                return next(new HttpBadRequestError('Expected a user object'));
            }
            // ensure that a new item will be inserted
            const user = Object.assign({}, req.body);
            delete user.id;
            await req.context.model('User').insert(user);
            return res.status(201).json(user);
        } catch (err) {
            return next(err);
        }
    });

    /**
     * PUT /users/:id
     * Updates an existing user
     */
    router.put('/:id', async (req, res, next) => {
        try {
            const model = req.context.model('User');
            const target = await model.where('id').equal(req.params.id).select('id').getItem();
            if (target == null) {
                return next(new HttpNotFoundError('User cannot be found'));
            }
            const user = Object.assign({}, req.body, {
                id: target.id
            });
            await model.update(user);
            return res.json(user);
        } catch (err) {
            return next(err);
        }
    });

    /**
     * DELETE /users/:id
     * Removes an existing user
     */
    router.delete('/:id', async (req, res, next) => {
        try {
            const model = req.context.model('User');
            const user = await model.where('id').equal(req.params.id).select('id').getItem();
            if (user == null) {
                return next(new HttpNotFoundError('User cannot be found'));
            }
            await model.remove(user);
            return res.status(204).send();
        } catch (err) {
            return next(err);
        }
    });

    return router;
}

export {
    usersRouter
};
