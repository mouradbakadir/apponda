export function tenantScope(req, res, next) {
    // SUPER_ADMIN voit tout : pas de filtre
    req.tenantFilter = req.user.role === 'SUPER_ADMIN' ? {} : { airportId: req.user.airportId };
    next();
  }