import * as app from '../server/server';
import {HttpApplication} from '@themost/web';
import * as request from 'supertest';

describe("should load application", () => {
    it("should load app", async () => {
        expect(app).toBeTruthy();
        expect(app).toBeInstanceOf(HttpApplication);
    });
    it("should call /api/users/me", async () => {
        const response = await request((<HttpApplication>app).runtime())
            .get('/api/users/me')
            .expect('Content-Type', /json/)
            .expect(200);
        expect(response).toBeTruthy();
        expect(response.body.name).toBe('anonymous');
    });
});