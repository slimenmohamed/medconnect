/**
 * Middleware Express : vérifie un JWT Keycloak via jwks-rsa.
 * - Extrait le token "Authorization: Bearer ..."
 * - Récupère la clé publique correspondante depuis le JWKS endpoint Keycloak
 * - Vérifie signature + issuer
 * - Place sur req.user : { sub, username, roles[] }
 *
 * En env KEYCLOAK_DISABLED=true, on bypass (utile en dev local pur).
 */
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

let _verifierConfig = null;

function configureKeycloak({ issuer, jwksUri }) {
  _verifierConfig = {
    issuer,
    client: jwksClient({
      jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true
    })
  };
  console.log('[keycloak] JWT verifier ready, issuer=', issuer);
}

function getKey(header, callback) {
  _verifierConfig.client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function authenticate(req, res, next) {
  if (process.env.KEYCLOAK_DISABLED === 'true') {
    req.user = { sub: 'anonymous', username: 'anonymous', roles: ['ADMIN'] };
    return next();
  }
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }
  const token = header.substring(7);

  jwt.verify(
    token,
    getKey,
    { algorithms: ['RS256'], issuer: _verifierConfig.issuer },
    (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token', detail: err.message });
      }
      const roles = (decoded.realm_access && decoded.realm_access.roles) || [];
      req.user = {
        sub: decoded.sub,
        username: decoded.preferred_username,
        roles
      };
      next();
    }
  );
}

module.exports = { configureKeycloak, authenticate };
