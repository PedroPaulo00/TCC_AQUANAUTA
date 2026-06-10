/*
Servico de Notificacoes
enviar notificacoes para a janela popup externa
*/

class NotificationService {
  constructor() {
    this.audioEl = document.getElementById('notification-sound');
    this.soundEnabled = true;
  }

  /**
   * @param {string} type - tipo visual (water, stretch, eyes, break, longBreak, custom)
   * @param {string} title - titulo da notificacao
   * @param {string} message - mensagem
   * @param {string} [dismissType] - tipo enviado ao clicar OK (para custom timers, e o ID do timer)
   */

  show(type, title, message, dismissType) {
    if (this.soundEnabled) {
      this._playSound();
    }

    if (window.electronAPI) {
      window.electronAPI.showPopupNotification({
        type: dismissType || type,
        visualType: type,
        title,
        message,
        playSound: this.soundEnabled,
      });
    }
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  _playSound() {
    if (this.audioEl) {
      this.audioEl.currentTime = 0;
      this.audioEl.play().catch(() => {});
    }
  }
}
