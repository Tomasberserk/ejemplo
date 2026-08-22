/**
 * SENA ATTENDANCE SYSTEM - Offline Queue Manager (Buffer Offline)
 * Permite almacenar registros de asistencia en localStorage cuando no hay se├▒al
 * y sincronizarlos de forma autom├ítica e idempotente al recuperar la conexi├│n.
 */

const QUEUE_STORAGE_KEY = 'sena_attendance_offline_queue';

export class OfflineAttendanceQueue {
  constructor(options = {}) {
    this.storageKey = options.storageKey || QUEUE_STORAGE_KEY;
    this.apiBaseUrl = options.apiBaseUrl || window.location.origin;
    this.isSyncing = false;
    this.onQueueChangeCallbacks = [];
    this.onSyncCompleteCallbacks = [];

    this._initListeners();
  }

  /**
   * Obtiene todos los elementos encolados en localStorage
   * @returns {Array<Object>}
   */
  getQueue() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Error reading offline queue from localStorage:', e);
      return [];
    }
  }

  /**
   * Guarda la cola completa en localStorage
   * @param {Array<Object>} queue 
   */
  _saveQueue(queue) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(queue));
      this._notifyQueueChange(queue);
    } catch (e) {
      console.error('Error saving offline queue to localStorage:', e);
    }
  }

  /**
   * Encola un nuevo registro de asistencia
   * @param {Object} checkinData Datos de la marcaci├│n (token, documento, photo_evidence, etc.)
   * @returns {Object} El elemento encolado con ID y timestamp
   */
  enqueue(checkinData) {
    const queue = this.getQueue();
    const item = {
      id: 'offline_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      queuedAt: new Date().toISOString(),
      retries: 0,
      status: 'pending',
      data: checkinData
    };
    queue.push(item);
    this._saveQueue(queue);
    console.log('[OfflineQueue] Marcaci├│n encolada:', item.id);
    return item;
  }

  /**
   * Elimina un elemento de la cola
   * @param {string} id 
   */
  remove(id) {
    const queue = this.getQueue().filter(item => item.id !== id);
    this._saveQueue(queue);
  }

  /**
   * Limpia toda la cola
   */
  clear() {
    this._saveQueue([]);
  }

  /**
   * Conteo de marcaciones pendientes
   * @returns {number}
   */
  get pendingCount() {
    return this.getQueue().length;
  }

  /**
   * Sincroniza todas las marcaciones pendientes con el backend
   * @param {string} authToken Token JWT opcional
   * @returns {Promise<{synced: number, failed: number}>}
   */
  async syncAll(authToken = '') {
    if (this.isSyncing) {
      console.log('[OfflineQueue] Sincronizaci├│n en curso...');
      return { synced: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log('[OfflineQueue] Sin conexi├│n. No se puede sincronizar.');
      return { synced: 0, failed: 0 };
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;
    const remainingQueue = [];

    for (const item of queue) {
      try {
        const { token, documento, photo_evidence, verification_method, biometric_match_score } = item.data;
        const targetUrl = (this.apiBaseUrl || '') + '/public/attendance/' + (token || 'manual') + '/register';
        
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
          headers['Authorization'] = 'Bearer ' + authToken;
        }

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            documento,
            photo_evidence,
            verification_method: verification_method || 'offline_sync',
            biometric_match_score,
            offline_queued_at: item.queuedAt
          })
        });

        if (response.ok || response.status === 200 || response.status === 201) {
          synced++;
          console.log('[OfflineQueue] Marcaci├│n sincronizada exitosamente:', item.id);
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('[OfflineQueue] Error del servidor al sincronizar:', errData);
          // Si es un error de cliente irrecuperable (ej: documento no existe), o si ya super├│ 5 reintentos
          item.retries = (item.retries || 0) + 1;
          item.lastError = errData.error?.message || 'Error del servidor';
          if (item.retries < 5) {
            remainingQueue.push(item);
          } else {
            console.error('[OfflineQueue] Descartando elemento tras 5 reintentos fallidos:', item.id);
            failed++;
          }
        }
      } catch (err) {
        console.warn('[OfflineQueue] Error de red durante la sincronizaci├│n:', err);
        item.retries = (item.retries || 0) + 1;
        remainingQueue.push(item);
        failed++;
        break; // Detener el ciclo si fall├│ la conexi├│n
      }
    }

    this._saveQueue(remainingQueue);
    this.isSyncing = false;

    this._notifySyncComplete({ synced, failed, remaining: remainingQueue.length });
    return { synced, failed };
  }

  /**
   * Suscribe un callback a los cambios en la cola
   * @param {Function} cb 
   */
  onQueueChange(cb) {
    if (typeof cb === 'function') this.onQueueChangeCallbacks.push(cb);
  }

  /**
   * Suscribe un callback al finalizar la sincronizaci├│n
   * @param {Function} cb 
   */
  onSyncComplete(cb) {
    if (typeof cb === 'function') this.onSyncCompleteCallbacks.push(cb);
  }

  _notifyQueueChange(queue) {
    for (const cb of this.onQueueChangeCallbacks) {
      try { cb(queue); } catch (e) { console.error(e); }
    }
  }

  _notifySyncComplete(stats) {
    for (const cb of this.onSyncCompleteCallbacks) {
      try { cb(stats); } catch (e) { console.error(e); }
    }
  }

  _initListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[OfflineQueue] Conexi├│n restablecida. Iniciando sincronizaci├│n autom├ítica...');
        this.syncAll();
      });

      // Intento de sincronizaci├│n peri├│dico cada 30 segundos si hay internet
      setInterval(() => {
        if (navigator.onLine && this.pendingCount > 0) {
          this.syncAll();
        }
      }, 30000);
    }
  }
}

// Instancia global exportada por defecto
export const offlineQueue = new OfflineAttendanceQueue();
