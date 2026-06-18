(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const COUNT = 28;
  const W = window.innerWidth;
  const H = window.innerHeight;

  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    const size    = 3 + Math.random() * 6;          // 3–9 px
    const left    = Math.random() * 100;             // % across viewport
    const bottom  = -size;                           // start just below screen
    const dur     = 12 + Math.random() * 20;        // 12–32 s float-up
    const delay   = Math.random() * dur;             // stagger across full cycle

    Object.assign(p.style, {
      width:             size + 'px',
      height:            size + 'px',
      left:              left + 'vw',
      bottom:            bottom + 'px',
      animationName:     'float-particle',
      animationDuration: dur + 's',
      animationDelay:    '-' + delay + 's',   // negative = already mid-cycle
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    });

    container.appendChild(p);
  }
})();

(function initMusic() {
  const audio = document.getElementById('bg-music');
  const btn   = document.getElementById('music-toggle');
  const icon  = btn ? btn.querySelector('.music-icon') : null;
  if (!audio || !btn || !icon) return;

  audio.volume = 0.22;
  audio.loop   = true;

  function setMuted(muted) {
    audio.muted = muted;
    icon.textContent = muted ? '🔇' : '🔊';
    btn.title = muted ? 'Ativar som' : 'Silenciar';
    btn.classList.toggle('playing', !muted);
  }

  audio.muted = true;
  const promise = audio.play();

  if (promise !== undefined) {
    promise.then(() => {
      // Playback started; unmute right away
      setMuted(false);
    }).catch(() => {
      // Fully blocked — wait for first user gesture
      const unlockOnce = () => {
        audio.muted = false;
        audio.play().then(() => setMuted(false)).catch(() => {});
        document.removeEventListener('click',   unlockOnce);
        document.removeEventListener('keydown', unlockOnce);
        document.removeEventListener('touchend',unlockOnce);
      };
      document.addEventListener('click',    unlockOnce, { once: true });
      document.addEventListener('keydown',  unlockOnce, { once: true });
      document.addEventListener('touchend', unlockOnce, { once: true });
      setMuted(true);
    });
  }

  // Toggle button always mutes/unmutes (does not stop playback)
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // don't trigger the unlock listener
    if (audio.paused) {
      audio.muted = false;
      audio.play().then(() => setMuted(false)).catch(() => {});
    } else {
      setMuted(!audio.muted);
    }
  });
})();

/* navbar scroll opacity */
(function initNav() {
  const nav = document.querySelector('.glass-nav');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* scroll reveal */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
})();

/* botão de download */
(function initDownload() {
  const btn = document.getElementById('btn-download');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const href = btn.getAttribute('href');
    if (href && href !== '#') {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      // Visual feedback while no release is published yet.
      const orig = btn.innerHTML;
      btn.innerHTML = '<span>Em breve...</span>';
      btn.style.pointerEvents = 'none';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.pointerEvents = '';
      }, 2000);
    }
  });
})();

/* smooth scroll para links âncora */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();
