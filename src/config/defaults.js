// configurações padrão
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
    inactivityThreshold: 30, // tempo em segundos sem atividade para considerar inativo (30 = teste, 120-300 recomendado para produção)
  },
};

// mensagens do mascote por tipo de notificação
const MASCOT_MESSAGES = {
  water: [
    'Hora de beber água! Mantenha-se hidratado.',
    'Que tal um copo de água? Seu corpo agradece!',
    'Hidratação é fundamental! Beba água agora.',
    'Lembre-se: água é vida! Tome um gole.',
  ],
  stretch: [
    'Hora de alongar! Levante e estique o corpo.',
    'Seus músculos precisam de atenção. Alongue-se!',
    'Faça uma pausa para alongar. Seu corpo merece!',
    'Alongamento rápido: estique braços e pernas.',
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
    'Pausa longa! Você completou todos os ciclos.',
    'Excelente trabalho! Hora de uma pausa mais longa.',
    'Você merece! Descanse bem nessa pausa longa.',
  ],
  welcome: [
    'Olá! Eu sou o Aquanauta. Vou te ajudar a manter hábitos saudáveis!',
  ],
  idle: [
    'Parece que você se ausentou. Bem-vindo de volta!',
    'Detectei que você voltou. Reiniciando contadores!',
  ],
};
