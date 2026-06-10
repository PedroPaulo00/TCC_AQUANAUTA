  /*
  Configs padrão
  */

const DEFAULT_CONFIG = {
  pomodoro: {
    workDuration: 3,        // minutos
    breakDuration: 5,       // minutos
    longBreakDuration: 15,  // minutos
    cyclesBeforeLongBreak: 4,
  },
  notifications: {
    waterInterval: 4,       // minutos
    stretchInterval: 45,    // minutos
    eyesInterval: 20,       // minutos
  },
  toggles: {
    water: true,
    stretch: true,
    eyes: true,
    sound: true,
    bgSound: true,
  },
  activity: {
    /*
    TEMPO DE INATIVIDADE
    alterar este valor (em segundos) para definir quanto tempo sem
    atividade do mouse/teclado o sistema considera o usuario como inativo
    valor atual é 30 segundos (para teste). eu recomendo para prodção: 120-300
    */
    inactivityThreshold: 30,
  },
};

/*
Mensagens do mascote por tipo de notificacao
 */

const MASCOT_MESSAGES = {
  water: [
    'Hora de beber agua! Mantenha-se hidratado.',
    'Que tal um copo de agua? Seu corpo agradece!',
    'Hidratacao e fundamental! Beba agua agora.',
    'Lembre-se: agua e vida! Tome um gole.',
  ],
  stretch: [
    'Hora de alongar! Levante e estique o corpo.',
    'Seus musculos precisam de atencao. Alongue-se!',
    'Faca uma pausa para alongar. Seu corpo merece!',
    'Alongamento rapido: estique bracos e pernas.',
  ],
  eyes: [
    'Regra 20-20-20: olhe para algo a 6 metros por 20 segundos.',
    'Seus olhos precisam descansar. Olhe para longe!',
    'Descanse os olhos um pouquinho. Olhe para a janela!',
    'Pisque bastante e olhe para um ponto distante.',
  ],
  break: [
    'Hora da pausa! Descanse um pouco.',
    'Pausa merecida! Relaxe por alguns minutos.',
    'Seu ciclo de trabalho terminou. Descanse!',
  ],
  longBreak: [
    'Pausa longa! Voce completou todos os ciclos.',
    'Excelente trabalho! Hora de uma pausa mais longa.',
    'Voce merece! Descanse bem nessa pausa longa.',
  ],
  welcome: [
    'Ola! Eu sou o Aquanauta. Vou te ajudar a manter habitos saudaveis!',
  ],
  idle: [
    'Parece que voce se ausentou. Bem-vindo de volta!',
    'Detectei que voce voltou. Reiniciando contadores!',
  ],
};
