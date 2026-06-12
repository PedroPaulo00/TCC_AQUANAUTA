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
    this.cycleInterval = null;
    this.shuffledTips = [];
    this.tipIndex = 0;
    this.lastMascotIndex = -1;
    this.mascotCycleImages = [
      '../../assets/mascote/masc1.png',
      '../../assets/mascote/masc2.png',
      '../../assets/mascote/masc3.png',
      '../../assets/mascote/masc4.png',
      '../../assets/mascote/masc5.png',
    ];

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

    this.healthTips = [
      'Hidratação: beba pelo menos 2 litros de água por dia. Tenha sempre uma garrafa perto!',
      'A cada 30 minutos, levante e caminhe por 2 minutos para ativar a circulação.',
      'Regra 20-20-20: a cada 20 minutos, olhe para algo a 6 metros por 20 segundos.',
      'Ajuste a altura da cadeira para que seus pés fiquem planos no chão.',
      'O monitor deve estar na altura dos olhos para evitar dores no pescoço.',
      'Mantenha os cotovelos em ângulo de 90 graus ao digitar.',
      'Alongue o pescoço inclinando a cabeça para cada lado por 15 segundos.',
      'Pisque com mais frequência: telas ressecam os olhos. Use colírio se necessário.',
      'Uma pausa de 5 minutos a cada hora melhora o foco e reduz o cansaço mental.',
      'Alongue os pulsos: abra e feche as mãos 10 vezes para aliviar a tensão.',
      'Boa iluminação reduz o cansaço visual. Evite reflexos diretos na tela.',
      'Levante os braços acima da cabeça e estique o tronco para aliviar a coluna.',
      'Comer frutas e alimentos leves durante o expediente ajuda na concentração.',
      'Evite ficar com o queixo apoiado na mão por longos períodos.',
      'Faça rotação dos ombros para trás algumas vezes para aliviar a tensão muscular.',
      'Ajuste o brilho da tela conforme a luminosidade do ambiente.',
      'Exercite os olhos: feche-os com suavidade por 3 segundos e depois relaxe.',
      'Manter os pés no chão ou num apoio evita pressão na parte de baixo da coxa.',
      'Pausas ativas aumentam a produtividade — não pule seus alertas do Aquanauta!',
      'Estique os dedos abrindo bem a mão por 5 segundos, depois relaxe.',
      'O ideal é que a distância entre seus olhos e a tela seja de 50 a 70 cm.',
      'Levante-se ao falar ao telefone — pequenos movimentos fazem grande diferença.',
      'Eleve os calcanhares enquanto sentado por 10 repetições para ativar a panturrilha.',
      'Hidratação ajuda a prevenir dores de cabeça causadas por estresse e tensão.',
      'Organize seu espaço de trabalho para evitar posturas forçadas e desconforto.',
      'Faça respirações profundas: inspire por 4 segundos, segure 2 e expire por 6.',
      'Evite cruzar as pernas por muito tempo — isso pode prejudicar a circulação.',
      'Uma boa noite de sono é fundamental para a produtividade e para a saúde.',
      'Movimente os pés em círculos enquanto sentado para manter a circulação ativa.',
      'Use o Aquanauta todos os dias — pequenos hábitos fazem grande diferença na saúde!',
    ];
  }

  /*
  exibir uma mensagem e trocar a imagem do mascote conforme o tipo
  */
  say(message, duration = 8000, type = null) {
    this._stopCycle();
    if (this.messageTimeout) clearTimeout(this.messageTimeout);

    if (type && this.imageMap[type]) {
      this.mascotImg.src = this.imageMap[type];
    } else {
      this.mascotImg.src = this.imageMap.default;
    }

    this.speechText.textContent = message;
    this.speechBubble.style.display = 'block';

    if (duration > 0) {
      this.messageTimeout = setTimeout(() => {
        this.mascotImg.src = this.imageMap.default;
        this._startCycle();
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

  /*
  mostrar boas-vindas e iniciar o ciclo de dicas apos 10s
  */
  welcome() {
    this._stopCycle();
    if (this.messageTimeout) clearTimeout(this.messageTimeout);

    this.mascotImg.src = this.imageMap.default;
    this.speechText.textContent = 'Seja bem-vindo de volta ao Aquanauta';
    this.speechBubble.style.display = 'block';

    this.messageTimeout = setTimeout(() => {
      this._startCycle();
    }, 10000);
  }

  _shuffleTips() {
    this.shuffledTips = [...this.healthTips].sort(() => Math.random() - 0.5);
    this.tipIndex = 0;
  }

  _pickCycleMascot() {
    let idx;
    do {
      idx = Math.floor(Math.random() * this.mascotCycleImages.length);
    } while (idx === this.lastMascotIndex);
    this.lastMascotIndex = idx;
    return this.mascotCycleImages[idx];
  }

  _showNextTip() {
    if (this.tipIndex >= this.shuffledTips.length) {
      this._shuffleTips();
    }
    this.speechText.textContent = this.shuffledTips[this.tipIndex++];
    this.mascotImg.src = this._pickCycleMascot();
  }

  _startCycle() {
    this._stopCycle();
    this._shuffleTips();
    this._showNextTip();
    this.cycleInterval = setInterval(() => this._showNextTip(), 10000);
  }

  _stopCycle() {
    if (this.cycleInterval) {
      clearInterval(this.cycleInterval);
      this.cycleInterval = null;
    }
  }
}
