/**
 * (Bonus "valeur ajoutée")
 * Le service Node.js consomme directement la config exposée par
 * Spring Cloud Config Server en JSON.
 *
 *   GET http://config-server:8888/medical-records-service/default
 *
 * Si l'appel échoue ou si CONFIG_SERVER_URL n'est pas défini, on fallback
 * sur les variables d'environnement (utile en dev local sans config-server).
 */
const axios = require('axios');

async function loadRemoteConfig() {
  const url = process.env.CONFIG_SERVER_URL;
  if (!url) {
    console.log('[config-client] CONFIG_SERVER_URL non défini -> env vars only');
    return {};
  }

  const target = `${url.replace(/\/$/, '')}/medical-records-service/default`;
  for (let i = 0; i < 10; i++) {
    try {
      const { data } = await axios.get(target, { timeout: 3000 });
      const flat = {};
      (data.propertySources || []).forEach(ps => {
        Object.entries(ps.source || {}).forEach(([k, v]) => {
          if (!(k in flat)) flat[k] = v;
        });
      });
      // Résout les placeholders Spring "${VAR:default}" contre process.env
      // (config-server ne les résout pas pour les clients non-Spring).
      Object.keys(flat).forEach(k => {
        if (typeof flat[k] === 'string') flat[k] = resolvePlaceholders(flat[k]);
      });
      console.log(`[config-client] Loaded ${Object.keys(flat).length} props from ${target}`);
      return flat;
    } catch (e) {
      console.warn(`[config-client] retry ${i + 1}/10 - ${e.message}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.warn('[config-client] config-server inaccessible, fallback env vars');
  return {};
}

/**
 * Remplace toute occurrence de ${VAR} ou ${VAR:default} par process.env[VAR]
 * (ou la valeur par défaut). Reproduit le comportement de Spring Boot.
 */
function resolvePlaceholders(value) {
  return value.replace(/\$\{([^}:]+)(?::([^}]*))?\}/g, (_, name, def) => {
    const env = process.env[name];
    if (env !== undefined && env !== '') return env;
    return def !== undefined ? def : '';
  });
}

/**
 * Merge: remote config (depuis config-server) < env vars (priorité plus haute).
 */
function resolve(remote, key, fallback) {
  if (process.env[envKey(key)] !== undefined) return process.env[envKey(key)];
  if (remote[key] !== undefined) return remote[key];
  return fallback;
}
function envKey(k) {
  return k.toUpperCase().replace(/[.\-]/g, '_');
}

module.exports = { loadRemoteConfig, resolve };
