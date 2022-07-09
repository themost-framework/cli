import * as app from '../server/app';
import * as request from 'supertest';

describe("should load application", () => {
    it("should load app", async () => {
        expect(app).toBeTruthy();
    });
    it("should call /api/users/me", async () => {
        const response = await request(app)
            .get('/api/users/me')
            .expect('Content-Type', /json/)
            .expect(200);
        expect(response).toBeTruthy();
        expect(response.body.name).toBe('anonymous');
    });
});