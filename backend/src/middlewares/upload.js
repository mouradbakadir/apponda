import multer from 'multer';
import { AppError } from '../utils/AppError.js';

// On utilise le stockage EN MÉMOIRE (memoryStorage) plutôt que d'écrire
// directement sur disque via multer. Pourquoi : ça laisse storageService.js
// seul responsable de l'organisation des fichiers sur disque (sous-dossier
// par aéroport, nom de fichier généré, etc.) — un seul point de vérité,
// plus facile à tester et à faire évoluer (ex: passer à S3 plus tard sans
// toucher au multer).
const storage = multer.memoryStorage();

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 Mo (un PDF scanné avec tampons peut être lourd)

function fileFilter(req, file, cb) {
  if (file.mimetype !== 'application/pdf') {
    return cb(new AppError(400, 'Seuls les fichiers PDF sont acceptés', 'INVALID_FILE_TYPE'));
  }
  cb(null, true);
}

export const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
});