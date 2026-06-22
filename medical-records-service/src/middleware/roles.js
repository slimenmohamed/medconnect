/**
 * Guard par rôle realm Keycloak.
 * Usage: router.get('/', authenticate, hasRole('DOCTOR','ADMIN'), handler)
 */
function hasRole(...allowedRoles) {
  return (req, res, next) => {
    const roles = (req.user && req.user.roles) || [];
    if (roles.some(r => allowedRoles.includes(r))) return next();
    return res.status(403).json({
      error: 'Forbidden',
      required: allowedRoles,
      actual: roles
    });
  };
}

module.exports = { hasRole };
