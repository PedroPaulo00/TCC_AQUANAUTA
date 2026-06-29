/* relação de faixas — edite title e artist para refletir os arquivos reais */
const TRACKS = [
  { file: 'aquatic_ambience.mp3',  title: 'Aquatic Ambience',       artist: 'Donkey Kong Country, Nintendo'    },
  { file: 'basshunter.mp3',        title: 'All I Ever Wanted',       artist: 'Basshunter'                       },
  { file: 'big_chemistry.mp3',     title: 'big chemistry ♡',         artist: 'Gregory Dillon, frutiger dillon'  },
  { file: 'lease.mp3',             title: 'LEASE',                   artist: 'Takeshi Abo'                      },
  { file: 'wind.mp3',              title: 'Wind',                    artist: 'Akeboshi'                         },
  { file: 'olivia.mp3',            title: 'Drop Dead',               artist: 'Olivia Rodrigo'                   },
  { file: 'snow.mp3',              title: 'When The Snow Melts',     artist: 'Manus Lunny, Phil Cunningham'     },
  { file: 'in_the_end.mp3',        title: 'In The End',              artist: 'Linkin Park'                      },
  { file: 'mgmt.mp3',              title: 'Kids',                    artist: 'MGMT'                             },
  { file: 'win98.mp3',             title: 'Windows98',               artist: 'Gregory Dillon, frutiger dillon'  },
];

/* bolhas de vidro flutuantes no fundo */
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 22; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';

    const size  = 6 + Math.random() * 20;
    const left  = Math.random() * 100;
    const dur   = 14 + Math.random() * 22;
    const delay = Math.random() * dur;

    Object.assign(b.style, {
      width:                   size + 'px',
      height:                  size + 'px',
      left:                    left + 'vw',
      bottom:                  '-' + size + 'px',
      animationDuration:       dur + 's',
      animationDelay:          '-' + delay + 's',
      animationIterationCount: 'infinite',
    });

    container.appendChild(b);
  }
})();

/*
  Marquee animado por JavaScript (requestAnimationFrame) — mais confiável
  do que a versão CSS com translateX(-50%), que falha em alguns navegadores
  dependendo da largura calculada do elemento inline-flex.

  Lógica: o marquee-inner contém dois spans idênticos lado a lado.
  O offset sobe de 0 → spanWidth, sendo aplicado como translateX(offset - spanWidth).
  Quando offset == spanWidth, o loop zera para 0 de forma imperceptível
  (pois os dois spans têm o mesmo texto).
*/
const Marquee = (function () {
  const inner = document.getElementById('marquee-inner');
  const s1    = document.getElementById('np-text');
  const s2    = document.getElementById('np-text-dupe');

  if (!inner || !s1 || !s2) return { update: function () {} };

  const SPEED = 58; /* pixels por segundo */
  let offset  = 0;
  let last    = null;

  function tick(ts) {
    if (!last) last = ts;
    const dt    = Math.min((ts - last) / 1000, 0.1); /* limita dt para evitar saltos */
    last        = ts;
    const spanW = s1.offsetWidth;

    if (spanW > 0) {
      offset += SPEED * dt;
      if (offset >= spanW) offset -= spanW;
      inner.style.transform = 'translateX(' + (offset - spanW) + 'px)';
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  return {
    update: function (track) {
      const label = track.title + '  —  ' + track.artist;
      s1.textContent = label;
      s2.textContent = label;
      offset = 0; /* reinicia posição ao trocar de faixa */
    },
  };
})();

/* sistema de música com 10 faixas */
(function initMusic() {
  const audio    = document.getElementById('bg-music');
  const btn      = document.getElementById('music-btn');
  const btnPrev  = document.getElementById('btn-prev');
  const btnNext  = document.getElementById('btn-next');
  const btnReset = document.getElementById('btn-reset-track');

  if (!audio || !btn) return;

  let currentIndex = 0;
  let userMuted    = false;
  let unlocked     = false;

  audio.volume = 0.55;

  function setBtnState() {
    const effectively = !unlocked || userMuted;
    btn.textContent   = effectively ? '♪' : '♫';
    btn.classList.toggle('muted', effectively);
    if (!unlocked) {
      btn.title = 'Clique para ativar música';
    } else {
      btn.title = userMuted ? 'Ativar música' : 'Silenciar música';
    }
  }

  function unlock() {
    if (unlocked) return;
    unlocked     = true;
    audio.muted  = userMuted;
    /* se o áudio estava pausado (autoplay bloqueado), começa agora */
    if (audio.paused) audio.play().catch(() => {});
    setBtnState();
  }

  function loadAndPlay(index) {
    const track  = TRACKS[index];
    audio.src    = '../assets/sounds/' + track.file;
    audio.muted  = !unlocked || userMuted;
    Marquee.update(track);
    audio.load();
    audio.play().catch(() => {});
  }

  /* ao terminar a faixa, avança para a próxima */
  audio.addEventListener('ended', function () {
    currentIndex = (currentIndex + 1) % TRACKS.length;
    loadAndPlay(currentIndex);
  });

  /* tenta autoplay com som; se o navegador bloquear, toca mudo e aguarda interação */
  Marquee.update(TRACKS[0]);
  audio.src    = '../assets/sounds/' + TRACKS[0].file;
  audio.muted  = false;
  audio.load();

  var firstPlay = audio.play();
  if (firstPlay !== undefined) {
    firstPlay.then(function () {
      /* autoplay com som liberado pelo navegador */
      unlocked = true;
      setBtnState();
    }).catch(function () {
      /* bloqueado — toca mudo; desbloqueia no primeiro clique/toque */
      audio.muted = true;
      audio.play().catch(function () {});
      setBtnState();
    });
  }

  /* desbloqueia no primeiro clique/toque em qualquer lugar da página */
  document.addEventListener('click',    unlock, { once: true });
  document.addEventListener('touchend', unlock, { once: true });

  /* botão de silenciar/ativar da status bar */
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    unlock();
    userMuted   = !userMuted;
    audio.muted = userMuted;
    setBtnState();
  });

  /* botão: faixa anterior */
  if (btnPrev) {
    btnPrev.addEventListener('click', function () {
      currentIndex = (currentIndex - 1 + TRACKS.length) % TRACKS.length;
      loadAndPlay(currentIndex);
    });
  }

  /* botão: próxima faixa */
  if (btnNext) {
    btnNext.addEventListener('click', function () {
      currentIndex = (currentIndex + 1) % TRACKS.length;
      loadAndPlay(currentIndex);
    });
  }

  /* botão: reiniciar faixa atual */
  if (btnReset) {
    btnReset.addEventListener('click', function () {
      audio.currentTime = 0;
      audio.play().catch(function () {});
    });
  }
})();

/* troca de abas */
(function initTabs() {
  const tabs   = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const target = tab.dataset.tab;

      tabs.forEach(function (t) { t.classList.remove('active'); });
      panels.forEach(function (p) { p.style.display = 'none'; });

      tab.classList.add('active');
      const panel = document.getElementById('panel-' + target);
      if (panel) panel.style.display = 'block';
    });
  });
})();

/* carrossel da galeria */
(function initGallery() {
  var slides   = document.querySelectorAll('.gallery-slide');
  var dotsWrap = document.getElementById('gallery-dots');
  var btnPrev  = document.getElementById('gallery-prev');
  var btnNext  = document.getElementById('gallery-next');

  if (!slides.length || !dotsWrap) return;

  var current   = 0;
  var total     = slides.length;
  var autoTimer = null;
  var AUTO_MS   = 5000;

  /* cria bolinhas */
  for (var i = 0; i < total; i++) {
    var dot = document.createElement('button');
    dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('title', 'Slide ' + (i + 1));
    dot.setAttribute('data-idx', i);
    dotsWrap.appendChild(dot);
  }

  var dots = dotsWrap.querySelectorAll('.gallery-dot');

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (idx + total) % total;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(function () { goTo(current + 1); }, AUTO_MS);
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  if (btnPrev) btnPrev.addEventListener('click', function () { goTo(current - 1); startAuto(); });
  if (btnNext) btnNext.addEventListener('click', function () { goTo(current + 1); startAuto(); });

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      goTo(parseInt(dot.getAttribute('data-idx'), 10));
      startAuto();
    });
  });

  /* pausa ao passar o mouse, retoma ao sair */
  var galleryWrap = document.querySelector('.gallery-wrap');
  if (galleryWrap) {
    galleryWrap.addEventListener('mouseenter', stopAuto);
    galleryWrap.addEventListener('mouseleave', startAuto);
  }

  /* swipe em dispositivos touch */
  var touchStartX = 0;
  var stage = document.querySelector('.gallery-stage');
  if (stage) {
    stage.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      stopAuto();
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
      startAuto();
    }, { passive: true });
  }

  startAuto();
})();

/* relógio analógico + calendário */
(function initClock() {
  var btnClock   = document.getElementById('btn-clock');
  var panel      = document.getElementById('clock-panel');
  var dateLabel  = document.getElementById('cp-date-label');
  var monthLabel = document.getElementById('cp-month-label');
  var daysGrid   = document.getElementById('cp-days-grid');
  var digital    = document.getElementById('cp-digital-time');
  var canvas     = document.getElementById('analog-clock');
  var btnPrev    = document.getElementById('cp-prev');
  var btnNext    = document.getElementById('cp-next');

  if (!btnClock || !panel || !canvas) return;

  var ctx = canvas.getContext('2d');

  var MONTHS = ['janeiro','fevereiro','março','abril','maio','junho',
                'julho','agosto','setembro','outubro','novembro','dezembro'];
  var WDAYS  = ['domingo','segunda-feira','terça-feira','quarta-feira',
                'quinta-feira','sexta-feira','sábado'];

  var viewDate    = new Date();
  var tickTimer   = null;

  /* ── calendário ─────────────────────────────────── */
  function buildCalendar() {
    var now = new Date();
    var y = viewDate.getFullYear();
    var m = viewDate.getMonth();

    monthLabel.textContent = MONTHS[m] + ' de ' + y;

    var firstDay  = new Date(y, m, 1).getDay();        /* 0=Dom */
    var lastDay   = new Date(y, m + 1, 0).getDate();
    var prevLast  = new Date(y, m, 0).getDate();

    daysGrid.innerHTML = '';

    /* dias do mês anterior */
    for (var i = firstDay - 1; i >= 0; i--) {
      var d = document.createElement('div');
      d.className = 'cp-day other-month';
      d.textContent = prevLast - i;
      daysGrid.appendChild(d);
    }

    /* dias do mês atual */
    for (var j = 1; j <= lastDay; j++) {
      var d2 = document.createElement('div');
      d2.className = 'cp-day';
      if (j === now.getDate() && m === now.getMonth() && y === now.getFullYear()) {
        d2.classList.add('today');
      }
      d2.textContent = j;
      daysGrid.appendChild(d2);
    }

    /* preenchimento do próximo mês */
    var total = firstDay + lastDay;
    var rem   = (7 - (total % 7)) % 7;
    for (var k = 1; k <= rem; k++) {
      var d3 = document.createElement('div');
      d3.className = 'cp-day other-month';
      d3.textContent = k;
      daysGrid.appendChild(d3);
    }
  }

  /* ── relógio analógico ───────────────────────────── */
  function hand(angle, len, width, color) {
    ctx.beginPath();
    ctx.moveTo(60, 60);
    ctx.lineTo(60 + Math.cos(angle) * len, 60 + Math.sin(angle) * len);
    ctx.strokeStyle = color;
    ctx.lineWidth   = width;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  function drawClock() {
    var now = new Date();
    var h = now.getHours() % 12;
    var m = now.getMinutes();
    var s = now.getSeconds();

    ctx.clearRect(0, 0, 120, 120);

    /* face */
    var grad = ctx.createRadialGradient(50, 42, 6, 60, 60, 56);
    grad.addColorStop(0, '#f8fdff');
    grad.addColorStop(1, '#d4ecf8');
    ctx.beginPath();
    ctx.arc(60, 60, 56, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#88b8d8';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* marcas */
    for (var i = 0; i < 12; i++) {
      var a   = (i / 12) * 2 * Math.PI - Math.PI / 2;
      var big = (i % 3 === 0);
      ctx.beginPath();
      ctx.moveTo(60 + Math.cos(a) * (big ? 46 : 50),
                 60 + Math.sin(a) * (big ? 46 : 50));
      ctx.lineTo(60 + Math.cos(a) * 54, 60 + Math.sin(a) * 54);
      ctx.strokeStyle = big ? '#1a3870' : '#6090c0';
      ctx.lineWidth   = big ? 2 : 1;
      ctx.stroke();
    }

    /* ponteiros */
    hand(((h + m / 60) / 12) * 2 * Math.PI - Math.PI / 2, 31, 4,   '#1a2848');
    hand(((m + s / 60) / 60) * 2 * Math.PI - Math.PI / 2, 44, 2.5, '#1a2848');
    hand((s / 60) * 2 * Math.PI - Math.PI / 2,             50, 1.2, '#c82010');

    /* centro */
    ctx.beginPath();
    ctx.arc(60, 60, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a2848';
    ctx.fill();

    /* hora digital */
    digital.textContent =
      String(now.getHours()).padStart(2, '0') + ':' +
      String(m).padStart(2, '0') + ':' +
      String(s).padStart(2, '0');

    /* data no header */
    dateLabel.textContent =
      WDAYS[now.getDay()] + ', ' + now.getDate() +
      ' de ' + MONTHS[now.getMonth()] + ' de ' + now.getFullYear();
  }

  /* ── abrir / fechar ──────────────────────────────── */
  function openPanel() {
    var rect  = btnClock.getBoundingClientRect();
    var right = window.innerWidth - rect.right;
    panel.style.top   = (rect.bottom + 6) + 'px';
    panel.style.right = Math.max(right - 4, 10) + 'px';
    panel.style.left  = 'auto';

    viewDate = new Date();
    buildCalendar();
    drawClock();
    panel.classList.add('open');
    tickTimer = setInterval(drawClock, 1000);
  }

  function closePanel() {
    panel.classList.remove('open');
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  }

  btnClock.addEventListener('click', function (e) {
    e.stopPropagation();
    panel.classList.contains('open') ? closePanel() : openPanel();
  });

  /* fecha ao clicar fora */
  document.addEventListener('click', function () {
    if (panel.classList.contains('open')) closePanel();
  });

  /* cliques dentro do painel não fecham */
  panel.addEventListener('click', function (e) { e.stopPropagation(); });

  /* navegação de meses */
  btnPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    buildCalendar();
  });

  btnNext.addEventListener('click', function (e) {
    e.stopPropagation();
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    buildCalendar();
  });
})();

(function initDownload() {
  var GH_API  = 'https://api.github.com/repos/PedroPaulo00/TCC_AQUANAUTA/releases/tags/v1.0.0';
  var countEl = document.getElementById('dl-count');
  var btn     = document.getElementById('btn-download');

  /* soma os download_count de todos os assets do release */
  function fetchCount() {
    fetch(GH_API, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!countEl || !Array.isArray(data.assets)) return;
        var total = data.assets.reduce(function (sum, a) { return sum + (a.download_count || 0); }, 0);
        countEl.textContent = total.toLocaleString('pt-BR');
      })
      .catch(function () {});
  }

  fetchCount();

  if (!btn) return;

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    var href = btn.getAttribute('href');
    if (href && href !== '#') {
      /* inicia o download e actualiza o contador 2s depois (GitHub leva um momento) */
      window.location.href = href;
      setTimeout(fetchCount, 2000);
    } else {
      var orig = btn.innerHTML;
      btn.innerHTML = '<span>Em breve...</span>';
      btn.style.pointerEvents = 'none';
      setTimeout(function () { btn.innerHTML = orig; btn.style.pointerEvents = ''; }, 2200);
    }
  });
})();
