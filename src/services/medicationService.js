/*
Servico de Medicamentos
gerencia lista de remedios diarios. cada remedio tem nome, dose, horarios fixos
(HH:MM), dias da semana e observacoes. dispara notificacao quando o relogio do
sistema bate com um horario agendado num dia ativo.

dados em localStorage: aquanauta-medications
*/

class MedicationManager {
  constructor() {
    this.storageKey = 'aquanauta-medications';
    this.items = this._load();
    // chave "id|HH:MM|YYYY-MM-DD" -> true. evita disparar 2x o mesmo slot no mesmo dia
    this._firedToday = {};
    this._tickInterval = null;
    this.onTrigger = null;  // (item, hhmm) => void
    this.onChange = null;   // () => void
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
    // tick a cada 30s para nao perder a janela de 1 min sem custo
    this._tickInterval = setInterval(() => this._tick(), 30 * 1000);
    // tick imediato pra capturar caso o app abra exatamente no minuto agendado
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
    return this.items.find(m => m.id === id) || null;
  }

  add(data) {
    const item = this._normalize({ ...data, id: this._generateId() });
    this.items.push(item);
    this._save();
    return item;
  }

  update(id, data) {
    const idx = this.items.findIndex(m => m.id === id);
    if (idx === -1) return null;
    const merged = this._normalize({ ...this.items[idx], ...data, id });
    this.items[idx] = merged;
    this._save();
    return merged;
  }

  remove(id) {
    const idx = this.items.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    this._save();
    return true;
  }

  /*
  retorna proximo medicamento agendado para hoje (a partir do horario atual)
  null se nao houver mais.
  */
  nextToday() {
    const now = new Date();
    const today = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    let best = null;
    for (const item of this.items) {
      if (!item.days.includes(today)) continue;
      for (const t of item.times) {
        const m = t.hh * 60 + t.mm;
        if (m < nowMinutes) continue;
        if (!best || m < best.minutes) {
          best = { item, hhmm: this._formatHHMM(t), minutes: m };
        }
      }
    }
    return best;
  }

  _normalize(data) {
    const times = (data.times || [])
      .map(t => {
        if (typeof t === 'string') {
          const [hh, mm] = t.split(':').map(n => parseInt(n, 10));
          return { hh: hh || 0, mm: mm || 0 };
        }
        return { hh: t.hh || 0, mm: t.mm || 0 };
      })
      .filter(t => t.hh >= 0 && t.hh < 24 && t.mm >= 0 && t.mm < 60)
      .sort((a, b) => (a.hh * 60 + a.mm) - (b.hh * 60 + b.mm));

    const days = Array.isArray(data.days) && data.days.length > 0
      ? data.days.filter(d => d >= 0 && d <= 6)
      : [0, 1, 2, 3, 4, 5, 6];

    return {
      id: data.id,
      name: (data.name || '').trim() || 'Medicamento',
      dose: (data.dose || '').trim(),
      notes: (data.notes || '').trim(),
      times,
      days,
    };
  }

  _formatHHMM(t) {
    return `${String(t.hh).padStart(2, '0')}:${String(t.mm).padStart(2, '0')}`;
  }

  _generateId() {
    return 'med_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  _tick() {
    const now = new Date();
    const today = now.getDay();
    const hh = now.getHours();
    const mm = now.getMinutes();
    const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    // limpa dedupe de dias passados
    for (const k of Object.keys(this._firedToday)) {
      if (!k.endsWith('|' + dateKey)) delete this._firedToday[k];
    }

    for (const item of this.items) {
      if (!item.days.includes(today)) continue;
      for (const t of item.times) {
        if (t.hh !== hh || t.mm !== mm) continue;
        const key = `${item.id}|${this._formatHHMM(t)}|${dateKey}`;
        if (this._firedToday[key]) continue;
        this._firedToday[key] = true;
        if (this.onTrigger) {
          this.onTrigger(item, this._formatHHMM(t));
        }
      }
    }
  }
}
