import { ExpressDataContext } from '@themost/express';

declare global {
    namespace Express {
        interface User {
            name: string;
        }
    }
}