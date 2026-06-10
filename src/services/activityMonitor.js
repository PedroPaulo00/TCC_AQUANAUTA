/*
Monitor de Atividade
detectar atividades do usuario via eventos de mouse e teclado no renderer
é leve pois usa apenas listeners DOM, sem dependencias nativas
*/
class ActivityMonitor {
  constructor(config) {
    this.inactivityThreshold = (config?.inactivityThreshold || 120) * 1000; // ms
    this.lastActivityTime = Date.now();
    this.isActive = true;
    this.checkInterval = null;
    this.listeners = { active: [], inactive: [], activity: [] };

    this._onActivity = this._onActivity.bind(this);
  }

  start() {
    // escuta os eventos de mouse e teclado
    document.addEventListener('mousemove', this._onActivity, { passive: true });
    document.addEventListener('mousedown', this._onActivity, { passive: true });
    document.addEventListener('keydown', this._onActivity, { passive: true });
    document.addEventListener('wheel', this._onActivity, { passive: true });

    // checa inatividade periodicamente
    this.checkInterval = setInterval(() => this._checkInactivity(), 5000);
    this.lastActivityTime = Date.now();
    this.isActive = true;
  }

  stop() {
    document.removeEventListener('mousemove', this._onActivity);
    document.removeEventListener('mousedown', this._onActivity);
    document.removeEventListener('keydown', this._onActivity);
    document.removeEventListener('wheel', this._onActivity);

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  _onActivity() {
    this.lastActivityTime = Date.now();

    if (!this.isActive) {
      this.isActive = true;
      this._emit('active', { timestamp: this.lastActivityTime });
    }

    this._emit('activity', { timestamp: this.lastActivityTime });
  }

  _checkInactivity() {
    const elapsed = Date.now() - this.lastActivityTime;

    if (elapsed >= this.inactivityThreshold && this.isActive) {
      this.isActive = false;
      this._emit('inactive', {
        timestamp: Date.now(),
        idleDuration: elapsed,
      });
    }
  }

  getTimeSinceLastActivity() {
    return Date.now() - this.lastActivityTime;
  }
}
