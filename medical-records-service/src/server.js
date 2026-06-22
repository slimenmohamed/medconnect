/**
 * medical-records-service - point d'entrée.
 *
 * Étapes au démarrage :
 *  1) Charger la config (env + bonus: config-server JSON)
 *  2) Connexion Mongo
 *  3) Connexion RabbitMQ (consumer "appointment.confirmed" + publisher)
 *  4) Init middleware Keycloak (JWT via JWKS)
 *  5) Init Express + routes + Swagger
 *  6) Enregistrement Eureka
 */
require('dotenv').config();
require('express-async-errors');

const express  = require('express');
const morgan   = require('morgan');
const cors     = require('cors');
const os       = require('os');

const { loadRemoteConfig, resolve } = require('./config/configClient');
const { connectMongo }              = require('./config/db');
const { initRabbit }                = require('./config/rabbit');
const { startEureka }               = require('./config/eureka');
const { configureKeycloak }         = require('./middleware/keycloak');
const { mountSwagger }              = require('./swagger');

const recordsRoutes       = require('./routes/records.routes');
const prescriptionsRoutes = require('./routes/prescriptions.routes');

const MedicalRecord = require('./models/MedicalRecord');

(async () => {
  // 1) Configuration
  const remote = await loadRemoteConfig();
  const PORT        = Number(resolve(remote, 'server.port', 5001));
  const MONGO_URI   = resolve(remote, 'mongo.uri',
                       'mongodb://medconnect:medconnectpass@localhost:27017/medconnect_records?authSource=admin');
  const RABBIT_URL  = resolve(remote, 'rabbitmq.url',
                       'amqp://medconnect:medconnectpass@localhost:5672');
  const KC_ISSUER   = resolve(remote, 'keycloak.issuer', 'http://localhost:8180/realms/medconnect');
  const KC_JWKS     = resolve(remote, 'keycloak.jwks',
                       'http://localhost:8180/realms/medconnect/protocol/openid-connect/certs');
  const EUREKA_HOST = resolve(remote, 'eureka.host', 'localhost');
  const EUREKA_PORT = Number(resolve(remote, 'eureka.port', 8761));
  const APP_NAME    = 'MEDICAL-RECORDS-SERVICE';
  const HOST_NAME   = process.env.HOSTNAME || os.hostname();
  const IP_ADDR     = process.env.HOSTNAME || '127.0.0.1';

  // 2) Mongo
  await connectMongo(MONGO_URI);

  // 3) RabbitMQ avec callback pour appointment.confirmed
  //    -> Scénario async (a) : on crée un MedicalRecord vide si le patient n'en a pas
  await initRabbit(RABBIT_URL, async ({ patientId }) => {
    if (patientId == null) return;
    const existing = await MedicalRecord.findOne({ patientId: Number(patientId) });
    if (!existing) {
      const created = await MedicalRecord.create({ patientId: Number(patientId) });
      console.log('[rabbit-handler] MedicalRecord auto-créé pour patient', patientId, '->', created._id.toString());
    } else {
      console.log('[rabbit-handler] MedicalRecord déjà présent pour patient', patientId);
    }
  });

  // 4) Keycloak
  configureKeycloak({ issuer: KC_ISSUER, jwksUri: KC_JWKS });

  // 5) Express
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  // Endpoints techniques (utilisés par Eureka et Docker healthcheck)
  app.get('/health', (req, res) => res.json({ status: 'UP' }));
  app.get('/info',   (req, res) => res.json({ app: APP_NAME, version: '1.0.0' }));

  app.use('/api/records',       recordsRoutes);
  app.use('/api/prescriptions', prescriptionsRoutes);

  mountSwagger(app);

  // Error handler global
  app.use((err, req, res, next) => {
    console.error('[error]', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error'
    });
  });

  app.listen(PORT, () => {
    console.log(`[server] medical-records-service listening on ${PORT}`);
    console.log(`[server] Swagger UI -> http://localhost:${PORT}/swagger-ui.html`);

    // 6) Eureka (une fois Express up)
    startEureka({
      appName: APP_NAME,
      hostName: HOST_NAME,
      ipAddr: IP_ADDR,
      port: PORT,
      eurekaHost: EUREKA_HOST,
      eurekaPort: EUREKA_PORT
    });
  });
})().catch(err => {
  console.error('[fatal] startup failed:', err);
  process.exit(1);
});
