const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

menuToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

// Live countdown to the Azerbaijan Grand Prix race start (26 Sep 2026, 15:00 Baku time = 11:00 UTC)
const countdown = document.querySelector('#f1-countdown');

if (countdown) {
  const raceStart = Date.UTC(2026, 8, 26, 11, 0, 0);
  const dials = {
    days: { el: countdown.querySelector('[data-cd="days"]'), max: 30 },
    hours: { el: countdown.querySelector('[data-cd="hours"]'), max: 24 },
    minutes: { el: countdown.querySelector('[data-cd="minutes"]'), max: 60 },
    seconds: { el: countdown.querySelector('[data-cd="seconds"]'), max: 60 },
  };
  const toFa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  let timer;

  const tick = () => {
    const left = raceStart - Date.now();

    if (left <= 0) {
      countdown.innerHTML = '<div class="cd-done">این رویداد برگزار شد.</div>';
      clearInterval(timer);
      return;
    }

    const total = Math.floor(left / 1000);
    const values = {
      days: Math.floor(total / 86400),
      hours: Math.floor(total / 3600) % 24,
      minutes: Math.floor(total / 60) % 60,
      seconds: total % 60,
    };

    Object.entries(dials).forEach(([key, dial]) => {
      dial.el.textContent = toFa(values[key]);
      dial.el.parentElement.style.setProperty('--p', Math.min(100, (values[key] / dial.max) * 100));
    });
  };

  tick();
  timer = setInterval(tick, 1000);
}

// Background playlist: two stacked videos crossfade through the clips in order, then loop.
const bgVideos = [...document.querySelectorAll('.site-background-video')];

const conn = navigator.connection || {};
const heavyMediaOk = innerWidth >= 800 && !conn.saveData && !/(^|\W)(2g|3g)/.test(conn.effectiveType || '');

// Phones and slow connections keep the poster image instead of pulling 4K video
if (bgVideos.length === 2 && heavyMediaOk) {
  const sources = [1, 2, 3, 4].map((n) => `background/background%20${n}.mp4`);
  const fade = 1.2;
  let active = 0;
  let index = 0;
  let switching = false;
  let failures = 0;

  const load = (video, i) => {
    video.src = sources[i];
    video.load();
  };

  // If the clips aren't there (not deployed, or blocked), fall back to the poster image
  const fallBackToPoster = () => {
    bgVideos.forEach((video) => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    });
    bgVideos[0].classList.add('is-active');
    bgVideos[1].classList.remove('is-active');
  };

  const swap = () => {
    if (switching) return;
    switching = true;
    const current = bgVideos[active];
    const upcoming = bgVideos[1 - active];
    index = (index + 1) % sources.length;
    upcoming.currentTime = 0;
    upcoming.play().catch(() => {});
    upcoming.classList.add('is-active');
    current.classList.remove('is-active');
    active = 1 - active;
    setTimeout(() => {
      current.pause();
      load(current, (index + 1) % sources.length);
      switching = false;
      if (upcoming.error) swap();
    }, fade * 1000);
  };

  bgVideos.forEach((video) => {
    video.addEventListener('timeupdate', () => {
      if (video === bgVideos[active] && video.duration - video.currentTime < fade) swap();
    });
    video.addEventListener('ended', () => { if (video === bgVideos[active]) swap(); });
    video.addEventListener('error', () => {
      failures += 1;
      if (failures >= sources.length) { fallBackToPoster(); return; }
      if (video === bgVideos[active]) swap();
    });
  });

  load(bgVideos[0], 0);
  load(bgVideos[1], 1);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) bgVideos[0].play().catch(() => {});
}

const contactForm = document.querySelector('#contact-form');

if (contactForm) {
  // No backend here: the request is handed to the visitor's own mail app, addressed to us
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = document.querySelector('.form-message');
    const data = new FormData(event.currentTarget);
    const name = data.get('name');
    const body = [
      'درخواست مشاوره سفر',
      '',
      `نام و نام خانوادگی: ${name}`,
      `شماره تماس: ${data.get('phone')}`,
      `نوع خدمات مورد نیاز: ${data.get('service')}`,
      '',
      'توضیحات بیشتر:',
    ].join('\n');

    window.location.href = `mailto:arian.fard.4477@gmail.com?subject=${encodeURIComponent('درخواست مشاوره سفر — ' + name)}&body=${encodeURIComponent(body)}`;
    message.textContent = `ممنون ${name}، برنامه ایمیل شما با اطلاعات فرم باز می‌شود؛ فقط کافی است ارسال را بزنید. برای سوال سریع‌تر، از دکمه واتساپ استفاده کنید.`;
  });
}
// Reveal blocks as they scroll into view. A plain scroll check (not IntersectionObserver)
// so that jumping straight past a block — End key, anchor link, restored scroll position —
// still shows it instead of leaving it invisible.
const revealTargets = [...document.querySelectorAll('.reveal')];

if (revealTargets.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('motion-ready');

  let pending = revealTargets;
  let queued = false;

  const check = () => {
    queued = false;
    const limit = innerHeight * 0.92;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top > limit) return true;
      el.classList.add('is-visible');
      return false;
    });
    if (!pending.length) {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    }
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(check);
  };

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  check();
}

// Whole service card acts as one clickable block
document.querySelectorAll('.service-card').forEach((card) => {
  const link = card.querySelector('a[href]');
  if (!link) return;

  card.addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    link.click();
  });
});
