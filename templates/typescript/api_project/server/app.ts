import express, {Application, ErrorRequestHandler} from 'express';
import path from 'path';
import Twig from 'twig';
import {ExpressDataApplication, serviceRouter, dateReviver, setContext} from '@themost/express';
import {indexRouter} from './routes';
import {TraceUtils} from '@themost/common';

function getApplication(): Application {

  const app: Application = express();
  // eslint-disable-next-line @typescript-eslint/unbound-method
  app.engine('twig', Twig.__express as any);
// view engine setup
  app.set('view engine', 'twig');
  app.set('views', path.join(__dirname, 'views'));

  app.use(express.json({
    reviver: dateReviver
  }));
  app.use(express.urlencoded({ extended: false }));
// @themost/data application setup
  const dataApplication = new ExpressDataApplication(path.resolve(__dirname, 'config'));
// hold data application
  app.set('ExpressDataApplication', dataApplication);

// use data middleware (register req.context)
  app.use(setContext(dataApplication));

// use static content
  app.use(express.static(path.join(process.cwd(), 'public')));

  app.use('/', indexRouter());
  app.use('/api/', serviceRouter);

  function errorHandler(): ErrorRequestHandler {
    return (err, _req, res, next) => {
      TraceUtils.error(err);
      if (res.headersSent) {
        return next(err);
      }
      const errorWithStatus = err as Error & { status?: number, statusCode?: number };
      res.status(errorWithStatus.status || errorWithStatus.statusCode || 500);
      try {
        res.render('error', { error: errorWithStatus });
      } catch (e) {
        TraceUtils.error(e);
      }
    }
  }

// error handler
  app.use(errorHandler());
  return app;
}

export { getApplication };
