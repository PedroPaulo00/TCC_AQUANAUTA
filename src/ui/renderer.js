/*
 Renderer Principal
 Inicializa e conecta todos os modulos da aplicacao.
 */

(function () {
  'use strict';

  const settings = new SettingsManager();
  const config = settings.get();

  const activityMonitor = new ActivityMonitor(config.activity);
  const notificationService = new NotificationService();
  const mascot = new Mascot();

  const scheduler = new Scheduler(config.pomodoro);

  // health timers
  const waterTimer = new HealthTimer('water', config.notifications.waterInterval, config.toggles.water);
  const stretchTimer = new HealthTimer('stretch', config.notifications.stretchInterval, config.toggles.stretch);
  const eyesTimer = new HealthTimer('eyes', config.notifications.eyesInterval, config.toggles.eyes);

  const timerMap = {
    water: waterTimer,
    stretch: stretchTimer,
    eyes: eyesTimer,
  };

  // services novos (medicamentos e cronograma)
  const medicationManager = new MedicationManager();
  const scheduleManager = new ScheduleManager();

  let customTimers = []; // { id, name, minutes, timer: HealthTimer }

  // elemntos UI
  const pomodoroDisplay = document.getElementById('pomodoro-display');
  const pomodoroProgress = document.getElementById('pomodoro-progress');
  const waterDisplay = document.getElementById('water-display');
  const stretchDisplay = document.getElementById('stretch-display');
  const eyesDisplay = document.getElementById('eyes-display');
  const activityDot = document.getElementById('activity-dot');
  const activityStatus = document.getElementById('activity-status');
  const customTimersContainer = document.getElementById('custom-timers-container');

  const btnPlayPomodoro = document.getElementById('btn-play-pomodoro');
  const btnResetPomodoro = document.getElementById('btn-reset-pomodoro');
  const btnZoomReset = document.getElementById('btn-zoom-reset');

  const bgAudio = document.getElementById('bg-sound');
  const btnSettings = document.getElementById('btn-settings');
  const settingsModal = document.getElementById('settings-modal');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnAddTimer = document.getElementById('btn-add-timer');

  const btnAbout = document.getElementById('btn-about');
  const aboutModal = document.getElementById('about-modal');
  const btnCloseAbout = document.getElementById('btn-close-about');

  // elementos modal timer
  const timerModal = document.getElementById('timer-modal');
  const timerModalTitle = document.getElementById('timer-modal-title');
  const timerNameInput = document.getElementById('timer-name-input');
  const timerMinutesInput = document.getElementById('timer-minutes-input');
  const btnSaveTimer = document.getElementById('btn-save-timer');
  const btnDeleteTimer = document.getElementById('btn-delete-timer');
  const btnCloseTimerModal = document.getElementById('btn-close-timer-modal');

  // reesetar botoes manualmente
  const btnResetWater = document.getElementById('btn-reset-water');
  const btnResetStretch = document.getElementById('btn-reset-stretch');
  const btnResetEyes = document.getElementById('btn-reset-eyes');

  // controlar janela
  const btnMinimize = document.getElementById('btn-minimize');
  const btnClose = document.getElementById('btn-close');

  let editingTimerId = null;
  let timerImageUrl = null;
  let bgSoundEnabled = config.toggles.bgSound !== false;

  function updateBgAudio() {
    if (!bgSoundEnabled || document.hidden || !document.hasFocus()) {
      bgAudio.pause();
    } else {
      bgAudio.play().catch(() => {});
    }
  }

  document.addEventListener('visibilitychange', updateBgAudio);
  window.addEventListener('focus', updateBgAudio);
  window.addEventListener('blur', updateBgAudio);

  // formatar o tempo
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function generateId() {
    return 'ct_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  scheduler.on('tick', (data) => {
    pomodoroDisplay.textContent = formatTime(data.remaining);
    pomodoroProgress.style.width = `${data.progress}%`;
  });

  scheduler.on('stateChange', (data) => {
    switch (data.state) {
      case 'working':
        pomodoroProgress.style.background = 'linear-gradient(to bottom, #00CCCC, #009999)';
        btnPlayPomodoro.disabled = true;
        btnResetPomodoro.disabled = false;
        break;
      case 'break':
        pomodoroProgress.style.background = 'linear-gradient(to bottom, #80FF00, #5ab800)';
        btnPlayPomodoro.disabled = true;
        btnResetPomodoro.disabled = false;
        break;
      case 'longBreak':
        pomodoroProgress.style.background = 'linear-gradient(to bottom, #FFaa00, #cc8800)';
        btnPlayPomodoro.disabled = true;
        btnResetPomodoro.disabled = false;
        break;
      case 'idle':
        pomodoroDisplay.textContent = formatTime(scheduler.config.workDuration * 60);
        pomodoroProgress.style.width = '0%';
        btnPlayPomodoro.disabled = false;
        btnResetPomodoro.disabled = true;
        break;
    }
  });

  scheduler.on('workComplete', (data) => {
    const isLong = data.cycle >= scheduler.config.cyclesBeforeLongBreak;
    const type = isLong ? 'longBreak' : 'break';
    mascot.sayRandom(type);
    notificationService.show(
      type,
      isLong ? 'Pausa Longa!' : 'Hora da Pausa!',
      isLong
        ? `Você completou ${data.cycle} ciclos. Descanse bem!`
        : `Ciclo ${data.cycle} completo. Descanse um pouco!`
    );
  });

  scheduler.on('breakComplete', () => {
    mascot.say('Pausa terminou! Hora de voltar ao trabalho.', 5000, 'break');
    notificationService.show('break', 'Fim da Pausa!', 'Sua pausa acabou. Hora de voltar ao trabalho!');
  });

  scheduler.on('longBreakComplete', () => {
    mascot.say('Pausa longa concluída! Pronto para mais?', 5000, 'longBreak');
    notificationService.show('longBreak', 'Fim da Pausa Longa!', 'Pausa longa encerrada. Pronto para mais ciclos?');
  });

  function onHealthTimerTrigger(name) {
    const titles = {
      water: 'Hidratação',
      stretch: 'Alongamento',
      eyes: 'Descanso dos Olhos',
    };

    mascot.sayRandom(name);
    notificationService.show(
      name,
      titles[name] || name,
      MASCOT_MESSAGES[name][Math.floor(Math.random() * MASCOT_MESSAGES[name].length)]
    );
  }

  waterTimer.onTrigger = onHealthTimerTrigger;
  stretchTimer.onTrigger = onHealthTimerTrigger;
  eyesTimer.onTrigger = onHealthTimerTrigger;

  waterTimer.onTick = (formatted) => { waterDisplay.textContent = formatted; };
  stretchTimer.onTick = (formatted) => { stretchDisplay.textContent = formatted; };
  eyesTimer.onTick = (formatted) => { eyesDisplay.textContent = formatted; };

  if (window.electronAPI) {
    window.electronAPI.onNotificationDismissed((type) => {
      if (timerMap[type]) {
        timerMap[type].reset();
        return;
      }
      const ct = customTimers.find(c => c.id === type);
      if (ct) {
        ct.timer.reset();
      }
    });
  }

  // botão reset manual
  btnResetWater.addEventListener('click', () => { waterTimer.reset(); });
  btnResetStretch.addEventListener('click', () => { stretchTimer.reset(); });
  btnResetEyes.addEventListener('click', () => { eyesTimer.reset(); });

  // monitorar eventos de atividade
  activityMonitor.on('inactive', () => {
    activityDot.classList.add('inactive');
    activityStatus.textContent = 'Usuário inativo';
    waterTimer.stop();
    stretchTimer.stop();
    eyesTimer.stop();
    customTimers.forEach(ct => ct.timer.stop());
  });

  activityMonitor.on('active', () => {
    activityDot.classList.remove('inactive');
    activityStatus.textContent = 'Monitorando atividade...';
    mascot.sayRandom('idle');
    waterTimer.reset();
    stretchTimer.reset();
    eyesTimer.reset();
    customTimers.forEach(ct => ct.timer.reset());
  });

  // handlers de botao
  btnPlayPomodoro.addEventListener('click', () => {
    if (scheduler.state === 'idle') {
      scheduler.startWork();
    }
  });

  btnResetPomodoro.addEventListener('click', () => {
    scheduler.reset();
  });

  btnZoomReset.addEventListener('click', () => {
    if (window.electronAPI) window.electronAPI.resetZoom();
  });

  document.addEventListener('keydown', (e) => {
    if (!e.ctrlKey) return;
    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      if (window.electronAPI) window.electronAPI.adjustZoom(0.1);
    } else if (e.key === '-') {
      e.preventDefault();
      if (window.electronAPI) window.electronAPI.adjustZoom(-0.1);
    }
  });

  // configs
  btnSettings.addEventListener('click', () => {
    settings.populateModal();
    settingsModal.style.display = 'flex';
  });

  btnCloseSettings.addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
  });

  btnSaveSettings.addEventListener('click', () => {
    settings.saveFromModal();
    settingsModal.style.display = 'none';
  });

  // esconde/mostra a linha do status de acordo com o toggle (corrige bug do
  // botao remover: ao desativar o toggle, a linha ficava visivel com tempo congelado)
  function applyHealthRowVisibility(toggles) {
    const map = {
      water: document.getElementById('status-item-water'),
      stretch: document.getElementById('status-item-stretch'),
      eyes: document.getElementById('status-item-eyes'),
    };
    Object.keys(map).forEach(key => {
      const el = map[key];
      if (!el) return;
      if (toggles[key]) el.classList.remove('is-hidden');
      else el.classList.add('is-hidden');
    });
  }

  // ressincroniza o texto exibido com o tempo restante atual de cada timer.
  // necessario apos mudar o intervalo (reset deixa em remainingMs = intervalMs).
  function syncHealthDisplays() {
    waterDisplay.textContent = waterTimer.getRemainingFormatted();
    stretchDisplay.textContent = stretchTimer.getRemainingFormatted();
    eyesDisplay.textContent = eyesTimer.getRemainingFormatted();
  }

  settings.onSave = (newConfig) => {
    scheduler.updateConfig(newConfig.pomodoro);
    if (scheduler.state === 'idle') {
      pomodoroDisplay.textContent = formatTime(newConfig.pomodoro.workDuration * 60);
    }
    waterTimer.setInterval(newConfig.notifications.waterInterval);
    waterTimer.setEnabled(newConfig.toggles.water);
    stretchTimer.setInterval(newConfig.notifications.stretchInterval);
    stretchTimer.setEnabled(newConfig.toggles.stretch);
    eyesTimer.setInterval(newConfig.notifications.eyesInterval);
    eyesTimer.setEnabled(newConfig.toggles.eyes);
    notificationService.setSoundEnabled(newConfig.toggles.sound);
    bgSoundEnabled = newConfig.toggles.bgSound !== false;
    updateBgAudio();
    applyHealthRowVisibility(newConfig.toggles);
    syncHealthDisplays();
    mascot.say('Configurações salvas com sucesso!', 4000);
  };

  // modal sobre
  btnAbout.addEventListener('click', () => {
    aboutModal.style.display = 'flex';
  });

  btnCloseAbout.addEventListener('click', () => {
    aboutModal.style.display = 'none';
  });

  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) aboutModal.style.display = 'none';
    const socialBtn = e.target.closest('.social-btn');
    if (socialBtn) {
      const url = socialBtn.dataset.url;
      if (url && window.electronAPI) window.electronAPI.openExternal(url);
    }
  });

  // timers personalizados

  function updateCustomTimersEmptyState() {
    const emptyMsg = document.getElementById('custom-timers-empty');
    if (emptyMsg) emptyMsg.style.display = customTimers.length === 0 ? 'block' : 'none';
  }

  function saveCustomTimersToStorage() {
    const data = customTimers.map(ct => ({ id: ct.id, name: ct.name, minutes: ct.minutes, imageUrl: ct.imageUrl || null }));
    try {
      localStorage.setItem('aquanauta-custom-timers', JSON.stringify(data));
    } catch (e) {}
  }

  function loadCustomTimersFromStorage() {
    try {
      const data = JSON.parse(localStorage.getItem('aquanauta-custom-timers') || '[]');
      data.forEach(item => addCustomTimer(item.name, item.minutes, item.id, false, item.imageUrl || null));
    } catch (e) {}
    updateCustomTimersEmptyState();
  }

  function renderCustomTimerItem(ct) {
    const div = document.createElement('div');
    div.className = 'custom-timer';
    div.id = 'custom-timer-' + ct.id;
    const iconSrc = ct.imageUrl || '../../assets/icons/personalizado.png';

    div.innerHTML = `
      <img src="${iconSrc}" class="custom-timer-icon" alt="${ct.name}" draggable="false">
      <div class="custom-timer-info">
        <span class="custom-timer-name">${ct.name}</span>
        <span class="custom-timer-value" id="ct-display-${ct.id}">${formatTime(ct.minutes * 60)}</span>
      </div>
      <div class="status-actions">
        <button class="custom-timer-edit" data-id="${ct.id}" title="Editar temporizador">
          <img src="../../assets/icons/settings.png" alt="Editar" draggable="false">
        </button>
        <button class="counter-reset-btn" data-reset-id="${ct.id}" title="Reiniciar contador">
          <img src="../../assets/icons/reset.png" alt="Reset" draggable="false">
        </button>
      </div>
    `;

    div.querySelector('.custom-timer-edit').addEventListener('click', () => {
      openTimerModal(ct.id);
    });

    div.querySelector('.counter-reset-btn').addEventListener('click', () => {
      ct.timer.reset();
    });

    customTimersContainer.appendChild(div);
  }

  function addCustomTimer(name, minutes, id = null, save = true, imageUrl = null) {
    const timerId = id || generateId();

    const timer = new HealthTimer(timerId, minutes, true);
    timer.onTrigger = (timerName) => {
      const ct = customTimers.find(c => c.id === timerName);
      const displayName = ct ? ct.name : timerName;
      mascot.say(`${displayName}`, 8000, 'custom');
      notificationService.show('custom', displayName, `Lembrete: ${displayName}`, timerName);
    };
    timer.onTick = (formatted) => {
      const el = document.getElementById('ct-display-' + timerId);
      if (el) el.textContent = formatted;
    };
    timer.start();

    const ct = { id: timerId, name, minutes, imageUrl: imageUrl || null, timer };
    customTimers.push(ct);
    renderCustomTimerItem(ct);
    updateCustomTimersEmptyState();

    if (save) saveCustomTimersToStorage();
  }

  function updateCustomTimer(id, name, minutes, imageUrl = null) {
    const ct = customTimers.find(c => c.id === id);
    if (!ct) return;

    ct.name = name;
    ct.minutes = minutes;
    ct.imageUrl = imageUrl;
    ct.timer.setInterval(minutes);

    const div = document.getElementById('custom-timer-' + id);
    if (div) {
      div.querySelector('.custom-timer-name').textContent = name;
      const iconEl = div.querySelector('.custom-timer-icon');
      iconEl.src = imageUrl || '../../assets/icons/personalizado.png';
      iconEl.alt = name;
    }

    saveCustomTimersToStorage();
  }

  function removeCustomTimer(id) {
    const idx = customTimers.findIndex(c => c.id === id);
    if (idx === -1) return;

    customTimers[idx].timer.stop();
    customTimers.splice(idx, 1);

    const div = document.getElementById('custom-timer-' + id);
    if (div) div.remove();
    updateCustomTimersEmptyState();

    saveCustomTimersToStorage();
  }

  // modal timer

  const timerIconInput = document.getElementById('timer-icon-input');
  const timerIconPreview = document.getElementById('timer-icon-preview');
  const btnClearTimerIcon = document.getElementById('btn-timer-icon-clear');

  function openTimerModal(editId = null) {
    editingTimerId = editId;
    timerIconInput.value = '';

    if (editId) {
      const ct = customTimers.find(c => c.id === editId);
      if (!ct) return;
      timerModalTitle.textContent = 'Editar Temporizador';
      timerNameInput.value = ct.name;
      timerMinutesInput.value = ct.minutes;
      timerImageUrl = ct.imageUrl || null;
      timerIconPreview.src = timerImageUrl || '../../assets/icons/personalizado.png';
      btnDeleteTimer.style.display = 'inline-block';
      btnClearTimerIcon.style.display = timerImageUrl ? 'inline-block' : 'none';
    } else {
      timerModalTitle.textContent = 'Adicionar Temporizador';
      timerNameInput.value = '';
      timerMinutesInput.value = '10';
      timerImageUrl = null;
      timerIconPreview.src = '../../assets/icons/personalizado.png';
      btnDeleteTimer.style.display = 'none';
      btnClearTimerIcon.style.display = 'none';
    }

    timerModal.style.display = 'flex';
    timerNameInput.focus();
  }

  function closeTimerModal() {
    timerModal.style.display = 'none';
    editingTimerId = null;
    timerImageUrl = null;
  }

  timerIconInput.addEventListener('change', () => {
    const file = timerIconInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      timerImageUrl = e.target.result;
      timerIconPreview.src = timerImageUrl;
      btnClearTimerIcon.style.display = 'inline-block';
    };
    reader.onerror = () => { timerImageUrl = null; };
    reader.readAsDataURL(file);
  });

  btnClearTimerIcon.addEventListener('click', () => {
    timerImageUrl = null;
    timerIconPreview.src = '../../assets/icons/personalizado.png';
    timerIconInput.value = '';
    btnClearTimerIcon.style.display = 'none';
  });

  btnAddTimer.addEventListener('click', () => openTimerModal(null));

  btnCloseTimerModal.addEventListener('click', closeTimerModal);

  timerModal.addEventListener('click', (e) => {
    if (e.target === timerModal) closeTimerModal();
  });

  btnSaveTimer.addEventListener('click', () => {
    const name = timerNameInput.value.trim();
    const minutes = parseInt(timerMinutesInput.value, 10);

    if (!name) { timerNameInput.focus(); return; }
    if (!minutes || minutes < 1) { timerMinutesInput.focus(); return; }

    if (editingTimerId) {
      updateCustomTimer(editingTimerId, name, minutes, timerImageUrl);
      mascot.say(`Temporizador "${name}" atualizado!`, 4000);
    } else {
      addCustomTimer(name, minutes, null, true, timerImageUrl);
      mascot.say(`Temporizador "${name}" adicionado!`, 4000);
    }

    closeTimerModal();
  });

  btnDeleteTimer.addEventListener('click', () => {
    if (editingTimerId) {
      const ct = customTimers.find(c => c.id === editingTimerId);
      const name = ct ? ct.name : '';
      removeCustomTimer(editingTimerId);
      mascot.say(`Temporizador "${name}" removido.`, 4000);
      closeTimerModal();
    }
  });

  // medicamentos

  const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function formatDaysSummary(days) {
    if (!days || days.length === 0) return 'Nenhum dia';
    if (days.length === 7) return 'Todo dia';
    const sortedWeekdays = [1, 2, 3, 4, 5].every(d => days.includes(d)) && days.length === 5;
    if (sortedWeekdays) return 'Dias úteis';
    const weekendOnly = days.length === 2 && days.includes(0) && days.includes(6);
    if (weekendOnly) return 'Fim de semana';
    return days.slice().sort().map(d => WEEKDAY_NAMES[d]).join(', ');
  }

  function buildWeekdayRow(containerId, selectedDays) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const selected = new Set(selectedDays);
    for (let i = 0; i < 7; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'weekday-chip' + (selected.has(i) ? ' active' : '');
      btn.dataset.day = String(i);
      btn.textContent = WEEKDAY_LABELS[i];
      btn.title = WEEKDAY_NAMES[i];
      btn.addEventListener('click', () => btn.classList.toggle('active'));
      container.appendChild(btn);
    }
  }

  function readWeekdayRow(containerId) {
    const container = document.getElementById(containerId);
    const result = [];
    container.querySelectorAll('.weekday-chip.active').forEach(el => {
      result.push(parseInt(el.dataset.day, 10));
    });
    return result;
  }

  function applyWeekdayPreset(containerId, preset) {
    const presets = {
      all: [0, 1, 2, 3, 4, 5, 6],
      weekdays: [1, 2, 3, 4, 5],
      weekend: [0, 6],
    };
    const days = presets[preset] || [];
    buildWeekdayRow(containerId, days);
  }

  // medicamento - listagem

  const medicationListEl = document.getElementById('medication-list');
  const medicationModal = document.getElementById('medication-modal');
  const medicationFormModal = document.getElementById('medication-form-modal');
  const medicationFormTitle = document.getElementById('medication-form-title');
  const medNameInput = document.getElementById('med-name-input');
  const medDoseInput = document.getElementById('med-dose-input');
  const medNotesInput = document.getElementById('med-notes-input');
  const medTimesListEl = document.getElementById('med-times-list');
  const medTimeAddInput = document.getElementById('med-time-add-input');
  const btnMedTimeAdd = document.getElementById('btn-med-time-add');
  const btnSaveMedication = document.getElementById('btn-save-medication');
  const btnDeleteMedication = document.getElementById('btn-delete-medication');
  const btnCloseMedication = document.getElementById('btn-close-medication');
  const btnCloseMedicationForm = document.getElementById('btn-close-medication-form');
  const btnAddMedication = document.getElementById('btn-add-medication');
  const btnMedication = document.getElementById('btn-medication');

  let editingMedicationId = null;
  let medFormTimes = []; // [{hh, mm}, ...]

  function renderMedTimesList() {
    medTimesListEl.innerHTML = '';
    if (medFormTimes.length === 0) {
      const span = document.createElement('span');
      span.className = 'form-section-hint';
      span.style.marginBottom = '0';
      span.textContent = 'Nenhum horário adicionado.';
      medTimesListEl.appendChild(span);
      return;
    }
    medFormTimes
      .slice()
      .sort((a, b) => (a.hh * 60 + a.mm) - (b.hh * 60 + b.mm))
      .forEach((t, idx) => {
        const chip = document.createElement('span');
        chip.className = 'time-chip';
        chip.textContent = `${String(t.hh).padStart(2,'0')}:${String(t.mm).padStart(2,'0')}`;
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'time-chip-remove';
        rm.textContent = '×';
        rm.title = 'Remover horário';
        rm.addEventListener('click', () => {
          medFormTimes.splice(idx, 1);
          renderMedTimesList();
        });
        chip.appendChild(rm);
        medTimesListEl.appendChild(chip);
      });
  }

  function renderMedicationList() {
    medicationListEl.innerHTML = '';
    const items = medicationManager.list();
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.textContent = 'Nenhum medicamento cadastrado.';
      medicationListEl.appendChild(empty);
      return;
    }
    const next = medicationManager.nextToday();
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'med-card';
      const times = item.times.map(t => `${String(t.hh).padStart(2,'0')}:${String(t.mm).padStart(2,'0')}`).join(' • ');
      const isNext = next && next.item.id === item.id;
      card.innerHTML = `
        <img class="med-card-icon" src="../../assets/mascote/noti_medication.png" alt="${item.name}" draggable="false">
        <div class="med-card-info">
          <div class="med-card-name">${escapeHtml(item.name)}${isNext ? ` <span class="upcoming-badge">próximo ${next.hhmm}</span>` : ''}</div>
          <div class="med-card-meta">${times || 'sem horários'} - ${formatDaysSummary(item.days)}</div>
          ${item.dose ? `<div class="med-card-meta">${escapeHtml(item.dose)}</div>` : ''}
          ${item.notes ? `<div class="med-card-meta">${escapeHtml(item.notes)}</div>` : ''}
        </div>
        <div class="med-card-actions">
          <button class="aero-pill-btn" data-action="edit" data-id="${item.id}" title="Editar">
            <img src="../../assets/icons/settings.png" alt="Editar">
          </button>
        </div>
      `;
      card.querySelector('[data-action="edit"]').addEventListener('click', () => {
        openMedicationForm(item.id);
      });
      medicationListEl.appendChild(card);
    });
  }

  function openMedicationModal() {
    renderMedicationList();
    medicationModal.style.display = 'flex';
  }

  function closeMedicationModal() {
    medicationModal.style.display = 'none';
  }

  function openMedicationForm(editId = null) {
    editingMedicationId = editId;
    if (editId) {
      const item = medicationManager.get(editId);
      if (!item) return;
      medicationFormTitle.textContent = 'Editar Medicamento';
      medNameInput.value = item.name;
      medDoseInput.value = item.dose || '';
      medNotesInput.value = item.notes || '';
      medFormTimes = item.times.map(t => ({ hh: t.hh, mm: t.mm }));
      buildWeekdayRow('med-weekday-row', item.days);
      btnDeleteMedication.style.display = 'inline-block';
    } else {
      medicationFormTitle.textContent = 'Adicionar Medicamento';
      medNameInput.value = '';
      medDoseInput.value = '';
      medNotesInput.value = '';
      medFormTimes = [{ hh: 8, mm: 0 }];
      buildWeekdayRow('med-weekday-row', [0, 1, 2, 3, 4, 5, 6]);
      btnDeleteMedication.style.display = 'none';
    }
    renderMedTimesList();
    medicationFormModal.style.display = 'flex';
    medNameInput.focus();
  }

  function closeMedicationForm() {
    medicationFormModal.style.display = 'none';
    editingMedicationId = null;
  }

  btnMedication.addEventListener('click', openMedicationModal);
  btnCloseMedication.addEventListener('click', closeMedicationModal);
  medicationModal.addEventListener('click', (e) => {
    if (e.target === medicationModal) closeMedicationModal();
  });
  btnAddMedication.addEventListener('click', () => openMedicationForm(null));
  btnCloseMedicationForm.addEventListener('click', closeMedicationForm);
  medicationFormModal.addEventListener('click', (e) => {
    if (e.target === medicationFormModal) closeMedicationForm();
  });

  btnMedTimeAdd.addEventListener('click', () => {
    const v = (medTimeAddInput.value || '').split(':');
    const hh = parseInt(v[0], 10);
    const mm = parseInt(v[1], 10);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return;
    if (medFormTimes.some(t => t.hh === hh && t.mm === mm)) return;
    medFormTimes.push({ hh, mm });
    renderMedTimesList();
  });

  // shortcuts dos dias da semana (medicamento)
  document.querySelectorAll('#medication-form-modal .weekday-shortcut').forEach(btn => {
    btn.addEventListener('click', () => applyWeekdayPreset('med-weekday-row', btn.dataset.preset));
  });

  btnSaveMedication.addEventListener('click', () => {
    const name = medNameInput.value.trim();
    if (!name) { medNameInput.focus(); return; }
    if (medFormTimes.length === 0) { medTimeAddInput.focus(); return; }
    const days = readWeekdayRow('med-weekday-row');
    if (days.length === 0) return;

    const payload = {
      name,
      dose: medDoseInput.value.trim(),
      notes: medNotesInput.value.trim(),
      times: medFormTimes,
      days,
    };

    if (editingMedicationId) {
      medicationManager.update(editingMedicationId, payload);
      mascot.say(`Medicamento "${name}" atualizado!`, 4000);
    } else {
      medicationManager.add(payload);
      mascot.say(`Medicamento "${name}" cadastrado!`, 4000);
    }
    closeMedicationForm();
    renderMedicationList();
  });

  btnDeleteMedication.addEventListener('click', () => {
    if (!editingMedicationId) return;
    const item = medicationManager.get(editingMedicationId);
    medicationManager.remove(editingMedicationId);
    if (item) mascot.say(`Medicamento "${item.name}" removido.`, 4000);
    closeMedicationForm();
    renderMedicationList();
  });

  medicationManager.onTrigger = (item, hhmm) => {
    const title = `Hora do remédio: ${item.name}`;
    const parts = [];
    if (item.dose) parts.push(item.dose);
    parts.push(`Horário: ${hhmm}`);
    if (item.notes) parts.push(item.notes);
    const message = parts.join(' • ');
    mascot.say(`${item.name} - ${hhmm}`, 8000, 'medication');
    notificationService.show('medication', title, message, 'medication_' + item.id);
  };

  // cronograma

  const scheduleListEl = document.getElementById('schedule-list');
  const scheduleModal = document.getElementById('schedule-modal');
  const scheduleFormModal = document.getElementById('schedule-form-modal');
  const scheduleFormTitle = document.getElementById('schedule-form-title');
  const schNameInput = document.getElementById('sch-name-input');
  const schCategoryInput = document.getElementById('sch-category-input');
  const schTimeInput = document.getElementById('sch-time-input');
  const schPreAlertInput = document.getElementById('sch-prealert-input');
  const btnSaveSchedule = document.getElementById('btn-save-schedule');
  const btnDeleteSchedule = document.getElementById('btn-delete-schedule');
  const btnCloseSchedule = document.getElementById('btn-close-schedule');
  const btnCloseScheduleForm = document.getElementById('btn-close-schedule-form');
  const btnAddSchedule = document.getElementById('btn-add-schedule');
  const btnSchedule = document.getElementById('btn-schedule');

  let editingScheduleId = null;

  const SCHEDULE_CATEGORY_LABELS = {
    sleep: 'Dormir', wake: 'Acordar', lunch: 'Almoço',
    breakfast: 'Café da manhã', dinner: 'Jantar',
    work: 'Trabalho', study: 'Estudo', computer: 'Computador',
    custom: 'Personalizado',
  };

  const SCHEDULE_CATEGORY_MASCOT = {
    sleep: 'sleep', wake: 'wake', lunch: 'lunch',
    breakfast: 'lunch', dinner: 'lunch',
    work: 'routine', study: 'routine', computer: 'routine',
    custom: 'routine',
  };

  function renderScheduleList() {
    scheduleListEl.innerHTML = '';
    const items = scheduleManager.list();
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.textContent = 'Nenhum evento cadastrado.';
      scheduleListEl.appendChild(empty);
      return;
    }
    const next = scheduleManager.nextToday();
    // ordena por horario do dia
    items
      .slice()
      .sort((a, b) => (a.time.hh * 60 + a.time.mm) - (b.time.hh * 60 + b.time.mm))
      .forEach(item => {
        const card = document.createElement('div');
        card.className = 'schedule-card';
        const isNext = next && next.item.id === item.id;
        const hhmm = `${String(item.time.hh).padStart(2,'0')}:${String(item.time.mm).padStart(2,'0')}`;
        const mascotKey = SCHEDULE_CATEGORY_MASCOT[item.category] || 'routine';
        const preAlertTxt = item.preAlertMinutes > 0
          ? ` - aviso ${item.preAlertMinutes} min antes`
          : '';
        card.innerHTML = `
          <img class="schedule-card-icon" src="../../assets/mascote/noti_${mascotKey}.png" alt="${item.name}" draggable="false">
          <div class="schedule-card-info">
            <div class="schedule-card-name">${escapeHtml(item.name)}${isNext ? ` <span class="upcoming-badge">próximo ${next.hhmm}</span>` : ''}</div>
            <div class="schedule-card-meta">${hhmm} - ${SCHEDULE_CATEGORY_LABELS[item.category] || ''}${preAlertTxt}</div>
            <div class="schedule-card-meta">${formatDaysSummary(item.days)}</div>
          </div>
          <div class="schedule-card-actions">
            <button class="aero-pill-btn" data-action="edit" data-id="${item.id}" title="Editar">
              <img src="../../assets/icons/settings.png" alt="Editar">
            </button>
          </div>
        `;
        card.querySelector('[data-action="edit"]').addEventListener('click', () => {
          openScheduleForm(item.id);
        });
        scheduleListEl.appendChild(card);
      });
  }

  function openScheduleModal() {
    renderScheduleList();
    scheduleModal.style.display = 'flex';
  }

  function closeScheduleModal() {
    scheduleModal.style.display = 'none';
  }

  function openScheduleForm(editId = null) {
    editingScheduleId = editId;
    if (editId) {
      const item = scheduleManager.get(editId);
      if (!item) return;
      scheduleFormTitle.textContent = 'Editar Evento';
      schNameInput.value = item.name;
      schCategoryInput.value = item.category;
      schTimeInput.value = `${String(item.time.hh).padStart(2,'0')}:${String(item.time.mm).padStart(2,'0')}`;
      schPreAlertInput.value = String(item.preAlertMinutes || 0);
      buildWeekdayRow('sch-weekday-row', item.days);
      btnDeleteSchedule.style.display = 'inline-block';
    } else {
      scheduleFormTitle.textContent = 'Adicionar Evento';
      schNameInput.value = '';
      schCategoryInput.value = 'custom';
      schTimeInput.value = '08:00';
      schPreAlertInput.value = '0';
      buildWeekdayRow('sch-weekday-row', [0, 1, 2, 3, 4, 5, 6]);
      btnDeleteSchedule.style.display = 'none';
    }
    scheduleFormModal.style.display = 'flex';
    schNameInput.focus();
  }

  function closeScheduleForm() {
    scheduleFormModal.style.display = 'none';
    editingScheduleId = null;
  }

  btnSchedule.addEventListener('click', openScheduleModal);
  btnCloseSchedule.addEventListener('click', closeScheduleModal);
  scheduleModal.addEventListener('click', (e) => {
    if (e.target === scheduleModal) closeScheduleModal();
  });
  btnAddSchedule.addEventListener('click', () => openScheduleForm(null));
  btnCloseScheduleForm.addEventListener('click', closeScheduleForm);
  scheduleFormModal.addEventListener('click', (e) => {
    if (e.target === scheduleFormModal) closeScheduleForm();
  });

  document.querySelectorAll('#schedule-form-modal .weekday-shortcut').forEach(btn => {
    btn.addEventListener('click', () => applyWeekdayPreset('sch-weekday-row', btn.dataset.preset));
  });

  btnSaveSchedule.addEventListener('click', () => {
    const name = schNameInput.value.trim();
    if (!name) { schNameInput.focus(); return; }
    const days = readWeekdayRow('sch-weekday-row');
    if (days.length === 0) return;

    const payload = {
      name,
      category: schCategoryInput.value,
      time: schTimeInput.value,
      preAlertMinutes: parseInt(schPreAlertInput.value, 10) || 0,
      days,
    };

    if (editingScheduleId) {
      scheduleManager.update(editingScheduleId, payload);
      mascot.say(`Evento "${name}" atualizado!`, 4000);
    } else {
      scheduleManager.add(payload);
      mascot.say(`Evento "${name}" cadastrado!`, 4000);
    }
    closeScheduleForm();
    renderScheduleList();
  });

  btnDeleteSchedule.addEventListener('click', () => {
    if (!editingScheduleId) return;
    const item = scheduleManager.get(editingScheduleId);
    scheduleManager.remove(editingScheduleId);
    if (item) mascot.say(`Evento "${item.name}" removido.`, 4000);
    closeScheduleForm();
    renderScheduleList();
  });

  scheduleManager.onTrigger = (item, kind) => {
    const mascotKey = SCHEDULE_CATEGORY_MASCOT[item.category] || 'routine';
    const label = SCHEDULE_CATEGORY_LABELS[item.category] || 'Evento';
    const hhmm = `${String(item.time.hh).padStart(2,'0')}:${String(item.time.mm).padStart(2,'0')}`;
    let title, message;
    if (kind === 'prealert') {
      title = `Em ${item.preAlertMinutes} min: ${item.name}`;
      message = `${label} às ${hhmm}. Prepare-se!`;
    } else {
      title = `${label}: ${item.name}`;
      message = `Horário agendado: ${hhmm}`;
    }
    mascot.say(`${item.name}`, 8000, mascotKey);
    notificationService.show(mascotKey, title, message, 'schedule_' + item.id);
  };

  // util html-escape para nomes/observacoes inseridos pelo usuario
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // controles de janela
  btnMinimize.addEventListener('click', () => {
    if (window.electronAPI) window.electronAPI.minimizeWindow();
  });

  btnClose.addEventListener('click', () => {
    if (window.electronAPI) window.electronAPI.closeWindow();
  });

  // inicializacao
  function init() {
    pomodoroDisplay.textContent = formatTime(config.pomodoro.workDuration * 60);
    waterDisplay.textContent = formatTime(config.notifications.waterInterval * 60);
    stretchDisplay.textContent = formatTime(config.notifications.stretchInterval * 60);
    eyesDisplay.textContent = formatTime(config.notifications.eyesInterval * 60);

    notificationService.setSoundEnabled(config.toggles.sound);
    applyHealthRowVisibility(config.toggles);

    activityMonitor.start();
    waterTimer.start();
    stretchTimer.start();
    eyesTimer.start();

    loadCustomTimersFromStorage();

    medicationManager.start();
    scheduleManager.start();

    mascot.welcome();
    updateBgAudio();
  }

  init();
})();
