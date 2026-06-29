/*
Configs
Carregar, salvar e aplicar configurações do usuário via localStorage
*/

class SettingsManager {
  constructor() {
    this.storageKey = 'aquanauta-settings';
    this.config = this._load();
    this.onSave = null;
  }

  _load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return this._merge(DEFAULT_CONFIG, JSON.parse(saved));
      }
    } catch (e) {
      // volta pro defaults
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  _merge(defaults, saved) {
    const result = JSON.parse(JSON.stringify(defaults));
    for (const key of Object.keys(saved)) {
      if (typeof saved[key] === 'object' && !Array.isArray(saved[key]) && result[key]) {
        result[key] = { ...result[key], ...saved[key] };
      } else {
        result[key] = saved[key];
      }
    }
    return result;
  }

  save(newConfig) {
    this.config = this._merge(this.config, newConfig);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (e) {
      // armazenamento cheio ou inacessível
    }
    if (this.onSave) {
      this.onSave(this.config);
    }
  }

  get() {
    return this.config;
  }

  /*
  Popular os campos do modal com os valores atuais
  */
  populateModal() {
    const c = this.config;
    document.getElementById('setting-work-duration').value = c.pomodoro.workDuration;
    document.getElementById('setting-break-duration').value = c.pomodoro.breakDuration;
    document.getElementById('setting-long-break').value = c.pomodoro.longBreakDuration;
    document.getElementById('setting-cycles').value = c.pomodoro.cyclesBeforeLongBreak;
    document.getElementById('setting-water-interval').value = c.notifications.waterInterval;
    document.getElementById('setting-stretch-interval').value = c.notifications.stretchInterval;
    document.getElementById('setting-eyes-interval').value = c.notifications.eyesInterval;
    document.getElementById('toggle-water').checked = c.toggles.water;
    document.getElementById('toggle-stretch').checked = c.toggles.stretch;
    document.getElementById('toggle-eyes').checked = c.toggles.eyes;
    document.getElementById('toggle-sound').checked = c.toggles.sound;
    document.getElementById('toggle-bg-sound').checked = c.toggles.bgSound !== false;
    document.getElementById('toggle-btn-sound').checked = c.toggles.btnSound !== false;
  }

    /*
  Coletar os valores do modal e salvar
  */
  saveFromModal() {
    const newConfig = {
      pomodoro: {
        workDuration: parseInt(document.getElementById('setting-work-duration').value, 10) || 25,
        breakDuration: parseInt(document.getElementById('setting-break-duration').value, 10) || 5,
        longBreakDuration: parseInt(document.getElementById('setting-long-break').value, 10) || 15,
        cyclesBeforeLongBreak: parseInt(document.getElementById('setting-cycles').value, 10) || 4,
      },
      notifications: {
        waterInterval: parseInt(document.getElementById('setting-water-interval').value, 10) || 30,
        stretchInterval: parseInt(document.getElementById('setting-stretch-interval').value, 10) || 45,
        eyesInterval: parseInt(document.getElementById('setting-eyes-interval').value, 10) || 20,
      },
      toggles: {
        water: document.getElementById('toggle-water').checked,
        stretch: document.getElementById('toggle-stretch').checked,
        eyes: document.getElementById('toggle-eyes').checked,
        sound: document.getElementById('toggle-sound').checked,
        bgSound: document.getElementById('toggle-bg-sound').checked,
        btnSound: document.getElementById('toggle-btn-sound').checked,
      },
    };
    this.save(newConfig);
  }
}
