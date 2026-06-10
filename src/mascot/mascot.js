/*
 Mascote Interativo
 gerenciar a apresentação, falas e imagem do mascote por seção
 */

class Mascot {
  constructor() {
    this.speechBubble = document.getElementById('speech-bubble');
    this.speechText = document.getElementById('speech-text');
    this.mascotImg = document.getElementById('mascot-img');
    this.messageTimeout = null;

    //map notification type to mascot image
    this.imageMap = {
      water: '../../assets/mascote/noti_water.png',
      stretch: '../../assets/mascote/noti_stretch.png',
      eyes: '../../assets/mascote/noti_eyes.png',
      break: '../../assets/mascote/noti_break.png',
      longBreak: '../../assets/mascote/noti_longbreak.png',
      custom: '../../assets/icons/personalizado.png',
      medication: '../../assets/mascote/noti_medication.png',
      sleep: '../../assets/mascote/noti_sleep.png',
      wake: '../../assets/mascote/noti_wake.png',
      lunch: '../../assets/mascote/noti_lunch.png',
      routine: '../../assets/mascote/noti_routine.png',
      default: '../../assets/mascote/mascote.png',
    };
  }

  /*
  exibir uma mensagem e trocar a imagem do mascote conforme o tipo
  */
  say(message, duration = 8000, type = null) {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    // troca a imagem pra esse tipo de noti
    if (type && this.imageMap[type]) {
      this.mascotImg.src = this.imageMap[type];
    }

    this.speechText.textContent = message;
    this.speechBubble.style.display = 'block';

    if (duration > 0) {
      this.messageTimeout = setTimeout(() => {
        this._showDefaultMessage();
        // volta ppro mascote padrao
        this.mascotImg.src = this.imageMap.default;
      }, duration);
    }
  }

  /*
  exibir mensagem aleatoria de um tipo, com imagem correspondente
  */
  sayRandom(type) {
    const messages = MASCOT_MESSAGES[type];
    if (messages && messages.length > 0) {
      const idx = Math.floor(Math.random() * messages.length);
      this.say(messages[idx], 8000, type);
    }
  }

  _showDefaultMessage() {
    const defaults = [
      'Estou aqui cuidando de você!',
      'Continue focado, mas lembre-se de cuidar da saúde!',
      'Trabalhando bem! Mantenha o ritmo.',
      'Postura correta faz toda a diferenca!',
    ];
    const idx = Math.floor(Math.random() * defaults.length);
    this.speechText.textContent = defaults[idx];
  }

  welcome() {
    this.sayRandom('welcome');
  }
}
