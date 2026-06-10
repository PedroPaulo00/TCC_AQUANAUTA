/*
 scheduler (Pomodoro + Timers)
gerenciar ciclos Pomodoro e temporizadores de saude
 */

class Scheduler {
  constructor(config) {
    this.config = { ...DEFAULT_CONFIG.pomodoro, ...config };
    this.state = 'idle'; // idle | working | break | longBreak
    this.currentCycle = 0;
    this.remainingSeconds = 0;
    this.tickInterval = null;
    this.listeners = {
      tick: [],
      workComplete: [],
      breakComplete: [],
      longBreakComplete: [],
      stateChange: [],
    };
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

  startWork() {
    this._stopTick();
    this.state = 'working';
    this.remainingSeconds = this.config.workDuration * 60;
    this._emit('stateChange', { state: this.state, cycle: this.currentCycle + 1 });
    this._startTick();
  }

  startBreak() {
    this._stopTick();
    const isLongBreak = (this.currentCycle + 1) >= this.config.cyclesBeforeLongBreak;

    if (isLongBreak) {
      this.state = 'longBreak';
      this.remainingSeconds = this.config.longBreakDuration * 60;
      this.currentCycle = 0;
    } else {
      this.state = 'break';
      this.remainingSeconds = this.config.breakDuration * 60;
      this.currentCycle++;
    }

    this._emit('stateChange', { state: this.state, cycle: this.currentCycle });
    this._startTick();
  }

  pause() {
    this._stopTick();
    this._emit('stateChange', { state: 'paused', remaining: this.remainingSeconds });
  }

  resume() {
    if (this.remainingSeconds > 0) {
      this._emit('stateChange', { state: this.state, remaining: this.remainingSeconds });
      this._startTick();
    }
  }

  reset() {
    this._stopTick();
    this.state = 'idle';
    this.currentCycle = 0;
    this.remainingSeconds = this.config.workDuration * 60;
    this._emit('stateChange', { state: 'idle' });
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  getTotalSeconds() {
    switch (this.state) {
      case 'working': return this.config.workDuration * 60;
      case 'break': return this.config.breakDuration * 60;
      case 'longBreak': return this.config.longBreakDuration * 60;
      default: return this.config.workDuration * 60;
    }
  }

  getProgress() {
    const total = this.getTotalSeconds();
    if (total === 0) return 0;
    return ((total - this.remainingSeconds) / total) * 100;
  }

  _startTick() {
    this.tickInterval = setInterval(() => {
      this.remainingSeconds--;

      this._emit('tick', {
        remaining: this.remainingSeconds,
        state: this.state,
        progress: this.getProgress(),
      });

      if (this.remainingSeconds <= 0) {
        this._stopTick();
        this._onTimerComplete();
      }
    }, 1000);
  }

  _stopTick() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  _onTimerComplete() {
    switch (this.state) {
      case 'working':
        this._emit('workComplete', { cycle: this.currentCycle + 1 });
        this.startBreak();
        break;
      case 'break':
        this._emit('breakComplete', { cycle: this.currentCycle });
        this.startWork();
        break;
      case 'longBreak':
        this._emit('longBreakComplete', {});
        this.state = 'idle';
        this._emit('stateChange', { state: 'idle' });
        break;
    }
  }
}

/*
temporizador generico para alertas de saude
 */
class HealthTimer {
  constructor(name, intervalMinutes, enabled = true) {
    this.name = name;
    this.intervalMs = intervalMinutes * 60 * 1000;
    this.remainingMs = this.intervalMs;
    this.enabled = enabled;
    this.tickInterval = null;
    this.onTrigger = null;
    this.onTick = null;
  }

  start() {
    if (!this.enabled) return;
    this.remainingMs = this.intervalMs;
    this._startTick();
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  reset() {
    this.stop();
    this.remainingMs = this.intervalMs;
    if (this.enabled) this._startTick();
  }

  setInterval(minutes) {
    this.intervalMs = minutes * 60 * 1000;
    this.reset();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    } else {
      this.reset();
    }
  }

  getRemainingFormatted() {
    const totalSeconds = Math.max(0, Math.ceil(this.remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  _startTick() {
    this.tickInterval = setInterval(() => {
      this.remainingMs -= 1000;

      if (this.onTick) {
        this.onTick(this.getRemainingFormatted());
      }

      if (this.remainingMs <= 0) {
        // para no zero. continua parado até ser manualmente resetado (clicar ok na noti
        //ou clicar manualmente no reset)
        this.remainingMs = 0;
        this.stop();
        if (this.onTrigger) {
          this.onTrigger(this.name);
        }
      }
    }, 1000);
  }
}
