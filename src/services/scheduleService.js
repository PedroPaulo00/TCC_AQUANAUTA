/*
Servico de Cronograma
gerencia eventos diarios da rotina do usuario (dormir, acordar, almoco,
trabalho, estudo, uso do computador, etc). cada evento tem nome, categoria,
horario unico (HH:MM), dias da semana e pre-alerta opcional em minutos

dispara 1 notificacao no momento exato e, se configurado, outra N minutos antes

dados em localStorage: aquanauta-schedule
*/

const SCHEDULE_CATEGORIES = {
  sleep:    { label: 'Dormir',      mascot: 'sleep'    },
  wake:     { label: 'Acordar',     mascot: 'wake'     },
  lunch:    { label: 'Almoco',      mascot: 'lunch'    },
  breakfast:{ label: 'Cafe da manha', mascot: 'lunch'  },
  dinner:   { label: 'Jantar',      mascot: 'lunch'    },
  work:     { label: 'Trabalho',    mascot: 'routine'  },
  study:    { label: 'Estudo',      mascot: 'routine'  },
  computer: { label: 'Computador',  mascot: 'routine'  },
  custom:   { label: 'Personalizado', mascot: 'routine' },
};

class ScheduleManager {
  constructor() {
    this.storageKey = 'aquanauta-schedule';
    this.items = this._load();
    this._fired = {};
    this._tickInterval = null;
    this.onTrigger = null;  
    this.onChange = null;
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  }

  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (_) {}
    if (this.onChange) this.onChange();
  }

  start() {
    if (this._tickInterval) return;
    this._tickInterval = setInterval(() => this._tick(), 30 * 1000);
    this._tick();
  }

  stop() {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  }

  list() {
    return this.items.slice();
  }

  get(id) {
    return this.items.find(s => s.id === id) || null;
  }

  add(data) {
    const item = this._normalize({ ...data, id: this._generateId() });
    this.items.push(item);
    this._save();
    return item;
  }

  update(id, data) {
    const idx = this.items.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const merged = this._normalize({ ...this.items[idx], ...data, id });
    this.items[idx] = merged;
    this._save();
    return merged;
  }

  remove(id) {
    const idx = this.items.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    this._save();
    return true;
  }

  /*
  proximo evento ativo (a partir do horario atual no dia atual)
  null se nao houver.
  */
  nextToday() {
    const now = new Date();
    const today = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    let best = null;
    for (const item of this.items) {
      if (!item.days.includes(today)) continue;
      const m = item.time.hh * 60 + item.time.mm;
      if (m < nowMinutes) continue;
      if (!best || m < best.minutes) {
        best = { item, hhmm: this._formatHHMM(item.time), minutes: m };
      }
    }
    return best;
  }

  _normalize(data) {
    let time;
    if (typeof data.time === 'string') {
      const [hh, mm] = data.time.split(':').map(n => parseInt(n, 10));
      time = { hh: hh || 0, mm: mm || 0 };
    } else {
      time = { hh: (data.time && data.time.hh) || 0, mm: (data.time && data.time.mm) || 0 };
    }
    if (time.hh < 0 || time.hh > 23) time.hh = 0;
    if (time.mm < 0 || time.mm > 59) time.mm = 0;

    const days = Array.isArray(data.days) && data.days.length > 0
      ? data.days.filter(d => d >= 0 && d <= 6)
      : [0, 1, 2, 3, 4, 5, 6];

    const category = SCHEDULE_CATEGORIES[data.category] ? data.category : 'custom';
    const preAlert = parseInt(data.preAlertMinutes, 10);

    return {
      id: data.id,
      name: (data.name || '').trim() || SCHEDULE_CATEGORIES[category].label,
      category,
      time,
      days,
      preAlertMinutes: Number.isFinite(preAlert) && preAlert > 0 ? preAlert : 0,
    };
  }

  _formatHHMM(t) {
    return `${String(t.hh).padStart(2, '0')}:${String(t.mm).padStart(2, '0')}`;
  }

  _generateId() {
    return 'sch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  _tick() {
    const now = new Date();
    const today = now.getDay();
    const hh = now.getHours();
    const mm = now.getMinutes();
    const nowMinutes = hh * 60 + mm;
    const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    for (const k of Object.keys(this._fired)) {
      if (!k.endsWith('|' + dateKey)) delete this._fired[k];
    }

    for (const item of this.items) {
      if (!item.days.includes(today)) continue;
      const itemMinutes = item.time.hh * 60 + item.time.mm;

      // pre-alerta
      if (item.preAlertMinutes > 0) {
        const preMinutes = itemMinutes - item.preAlertMinutes;
        if (preMinutes === nowMinutes) {
          const k = `${item.id}|pre|${dateKey}`;
          if (!this._fired[k]) {
            this._fired[k] = true;
            if (this.onTrigger) this.onTrigger(item, 'prealert');
          }
        }
      }

      // evento principal
      if (item.time.hh === hh && item.time.mm === mm) {
        const k = `${item.id}|evt|${dateKey}`;
        if (!this._fired[k]) {
          this._fired[k] = true;
          if (this.onTrigger) this.onTrigger(item, 'event');
        }
      }
    }
  }
}
