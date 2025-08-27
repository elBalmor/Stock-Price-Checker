'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const apiRoutes = require('./routes/api.js');

const app = express();

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

// Seguridad base
app.disable('x-powered-by');

// CSP: scripts y estilos solo 'self'
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

// 🔒 Asegurar CSP mínima que exige FCC (scripts y CSS solo desde 'self')
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'"
  );
  next();
});


app.use(cors({ origin: '*' }));

// trust proxy solo en prod (1 salto típico)
app.set('trust proxy', isProd ? 1 : false);

// Rate limit (deshabilitado en test)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: isProd
});
if (!isTest) app.use(limiter);

// Estáticos
app.use('/public', express.static(process.cwd() + '/public'));

// ⚠️ Rutas FCC y runner: SOLO en test
let runner; // declarado aquí para usar abajo en el arranque de test
if (isTest) {
  const fccTestingRoutes = require('./routes/fcctesting.js');
  app.use('/_api', fccTestingRoutes);
  runner = require('./test-runner');
}

// Rutas del proyecto
app.use('/api', apiRoutes);

// Home
app.get('/', (_req, res) => {
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
