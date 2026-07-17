import { prisma } from '../config/prisma.js';

export const auditLog = (tableName) => async (req, res, next) => {
  // On intercepte la réponse pour être sûr que l'action a réussi (status 200/201/204)
  const originalSend = res.send;
  
  res.send = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300 && ['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      const action = req.method === 'POST' ? 'CREATE' : req.method === 'PATCH' ? 'UPDATE' : 'DELETE';
      
      // Essayer de récupérer l'ID de l'élément créé/modifié
      let recordId = req.params.id; // Pour PATCH et DELETE
      if (!recordId && body) {
        try {
          const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
          recordId = parsedBody?.id || null;
        } catch (e) { /* Ignorer erreur parsing */ }
      }

      // Enregistrer silencieusement en base de données
      prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          airportId: req.user?.airportId,
          action,
          tableName,
          recordId,
          newValues: req.method !== 'DELETE' ? req.body : null, // Ne pas loguer le body si c'est un DELETE
          ipAddress: req.ip || req.connection.remoteAddress
        }
      }).catch(err => console.error('Erreur lors de la création de l\'Audit Log:', err));
    }
    
    // Renvoyer la vraie réponse au client
    originalSend.call(this, body);
  };
  
  next();
};