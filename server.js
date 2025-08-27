'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

// Seguridad base
app.disable('x-powered-by');

// 🔒 CSP: solo 'self' para scripts y estilos
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'"],
      imgSrc:     ["'self'", "data:"],
      connectSrc: ["'self'"],
      baseUri:    ["'self'"],
      formAction: ["'self'"]
    }
  }
}));

app.use(cors({ origin: '*' }));

// Confianza en proxy solo en producción (p.ej., Render)
app.set('trust proxy', isProd ? 1 : false);

// ⏱️ Rate limit (deshabilitado en test)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // si confías en proxy en prod, díselo al limiter:
  trustProxy: isProd
});
if (!isTest) app.use(limiter);

// Estáticos
app.use('/public', express.static(process.cwd() + '/public'));

// Rutas FCC
if (fccTestingRoutes) app.use('/_api', fccTestingRoutes);

// Rutas del proyecto
app.use('/api', apiRoutes);

// Home
app.get('/', function (_req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Mongo
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fcc-stock';
mongoose.connect(uri, { dbName: 'fcc-stock' })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Mongo error:', err));

// Arranque
const port = process.env.PORT || (isTest ? 3001 : 3000);

if (!isTest) {
  app.listen(port, () => console.log('Listening on port ' + port));
} else {
  app.listen(port, () => {
    console.log('Listening on port ' + port);
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        if (runner && runner.run) runner.run();
      } catch (e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500);
  });
}

module.exports = app;
