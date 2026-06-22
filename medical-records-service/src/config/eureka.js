/**
 * Enregistrement Eureka du service Node.js.
 * Le service s'inscrit sous le nom "MEDICAL-RECORDS-SERVICE" pour que
 * le gateway Spring puisse l'appeler via "lb://MEDICAL-RECORDS-SERVICE"
 * et qu'appointment-service le découvre via Feign.
 */
const { Eureka } = require('eureka-js-client');

function startEureka({ appName, hostName, ipAddr, port, eurekaHost, eurekaPort }) {
  const client = new Eureka({
    instance: {
      app: appName,
      instanceId: `${appName}:${hostName}:${port}`,
      hostName: hostName,
      ipAddr: ipAddr,
      port: { '$': port, '@enabled': 'true' },
      vipAddress: appName.toLowerCase(),
      secureVipAddress: appName.toLowerCase(),
      statusPageUrl: `http://${hostName}:${port}/info`,
      healthCheckUrl: `http://${hostName}:${port}/health`,
      homePageUrl: `http://${hostName}:${port}/`,
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn'
      }
    },
    eureka: {
      host: eurekaHost,
      port: eurekaPort,
      servicePath: '/eureka/apps/',
      maxRetries: 10,
      requestRetryDelay: 3000
    }
  });

  client.start(err => {
    if (err) console.error('[eureka] register error:', err.message);
    else console.log(`[eureka] Registered as ${appName} -> ${eurekaHost}:${eurekaPort}`);
  });

  process.on('SIGINT', () => client.stop(() => process.exit(0)));
  process.on('SIGTERM', () => client.stop(() => process.exit(0)));

  return client;
}

module.exports = { startEureka };
