
import express from 'express';
import path from 'path';
import Twig from 'twig';
import {ExpressDataApplication, serviceRouter, dateReviver, setContext} from '@themost/express';
import {indexRouter} from './routes/index';
import {TraceUtils} from '@themost/common';
import { api } from './routes/api';

/**
 * @returns {import('express').Application}
 */
function getApplication() {
  /**
   * Initialize express application
   * @type {import('express').Application}
   */
  const app = express();

  app.engine('twig', Twig.__express);
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

  /**
   *
   * @returns {import('express').ErrorRequestHandler}
   */
  function errorHandler() {
    return (err, req, res, next) => {
      TraceUtils.error(err);
      if (res.headersSent) {
        return next(err);
      }
      res.status(err.status || err.statusCode || 500);
      try {
        res.render('error', { error: err });
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
