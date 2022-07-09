import * as app from '../server/server';
import {HttpApplication} from '@themost/web';
import * as request from 'supertest';

describe("should load application", () => {
    it("should load app", async () => {
        expect(app).toBeTruthy();
        expect(app).toBeInstanceOf(HttpApplication);
    });
    it("should call /users/me", async () => {
        const response = await request((<HttpApplication>app).runtime())
            .get('/users/me')
            .expect('Content-Type', /html/)
            .expect(200);
        expect(response).toBeTruthy();
    });
});