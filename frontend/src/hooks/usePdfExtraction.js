import { useState, useCallback, useRef, useEffect } from 'react';
import { marcheDocumentsApi } from '../services/marcheDocuments.api.js';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 45 * 60 * 1000;

const PROGRESS_MESSAGES = [
  { afterMs: 0, text: "Analyse du document en cours..." },
  { afterMs: 30_000, text: "Lecture des pages scannées (OCR par IA)..." },
  { afterMs: 120_000, text: "Toujours en cours -- les documents scannés de plusieurs pages peuvent prendre plusieurs minutes." },
  { afterMs: 300_000, text: "Extraction toujours en cours. Vous pouvez patienter, ou fermer et revenir plus tard : le traitement continue côté serveur." },
  { afterMs: 900_000, text: "Ce document est long à traiter (nombreuses pages scannées). Le traitement continue normalement." },
];

export function usePdfExtraction() {
  const [document, setDocument] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | polling | done | error
  const [error, setError] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  // Progression réelle du transfert du fichier vers le serveur (0 à 100).
  // À ne pas confondre avec progressMessage, qui décrit l'extraction IA
  // faite APRÈS l'upload et dont la durée n'est pas mesurable en pourcentage.
  const [uploadProgress, setUploadProgress] = useState(0);
  const pollTimerRef = useRef(null);
  const stopRef = useRef(false);

  useEffect(() => () => {
    stopRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
  }, []);

  const poll = useCallback(async (documentId, startedAt) => {
    if (stopRef.current) return;
    try {
      const current = await marcheDocumentsApi.getStatus(documentId);
      setDocument(current);

      if (current.statut === 'EXTRAIT') {
        setStatus('done');
        return;
      }
      if (current.statut === 'ECHEC') {
        setStatus('error');
        setError(current.erreurMessage || "L'extraction a échoué");
        return;
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed > POLL_TIMEOUT_MS) {
        setStatus('error');
        setError("L'extraction prend anormalement longtemps (plus de 45 minutes).");
        return;
      }

      const applicable = [...PROGRESS_MESSAGES].reverse().find((p) => elapsed >= p.afterMs);
      if (applicable) setProgressMessage(applicable.text);

      pollTimerRef.current = setTimeout(() => poll(documentId, startedAt), POLL_INTERVAL_MS);
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error?.message || 'Erreur pendant le suivi de l\'extraction');
    }
  }, []);

  /**
   * Upload un fichier. Si `autoExtract` est explicitement false (dépôt
   * simple, sans lancer l'IA), le document est sauvegardé et le statut
   * passe directement à 'done' -- PAS de polling, puisqu'aucun traitement
   * n'a été lancé côté serveur.
   */
  const upload = useCallback(async (file, options = {}) => {
    setStatus('uploading');
    setError('');
    setProgressMessage('');
    setUploadProgress(0);
    try {
      const created = await marcheDocumentsApi.upload(file, {
        ...options,
        onProgress: setUploadProgress,
      });
      setDocument(created);
      if (options.autoExtract === false) {
        setStatus('done'); // sauvegardé, mais pas encore extrait -- extractedJson sera null
      } else {
        setStatus('polling');
        poll(created.id, Date.now());
      }
      return created;
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error?.message || 'Erreur pendant l\'upload du PDF');
      throw err;
    }
  }, [poll]);

  /**
   * Déclenche l'extraction sur un document déjà uploadé (sans extraction
   * automatique à l'origine), et reprend le suivi de son statut.
   */
  const startExtraction = useCallback(async (documentId) => {
    setStatus('polling');
    setError('');
    setProgressMessage('');
    try {
      const updated = await marcheDocumentsApi.triggerExtraction(documentId);
      setDocument(updated);
      poll(documentId, Date.now());
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error?.message || 'Erreur au déclenchement de l\'extraction');
    }
  }, [poll]);

  const reset = useCallback(() => {
    stopRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    stopRef.current = false;
    setDocument(null);
    setStatus('idle');
    setError('');
    setProgressMessage('');
    setUploadProgress(0);
  }, []);

  return { document, status, error, progressMessage, uploadProgress, upload, startExtraction, reset };
}