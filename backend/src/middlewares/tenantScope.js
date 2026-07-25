export function tenantScope(req, res, next) {
  if (req.user.role === 'SUPER_ADMIN') {
    const overrideAirportId = req.headers['x-airport-id'];
    // Un SUPER_ADMIN peut "se placer" sur un aeroport precis via l'en-tete x-airport-id.
    // Sans en-tete (ou valeur "all"), il garde sa vue nationale (aucun filtre).
    req.tenantFilter = overrideAirportId && overrideAirportId !== 'all'
      ? { airportId: overrideAirportId }
      : {};
  } else {
    // Un SUPERVISEUR/TECHNICIEN est TOUJOURS filtre sur son propre airportId,
    // extrait du JWT signe cote serveur - jamais falsifiable depuis le client,
    // meme s'il essaie d'envoyer un en-tete x-airport-id.
    req.tenantFilter = { airportId: req.user.airportId };
  }
  next();
}