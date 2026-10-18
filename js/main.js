import { AudioPlayer } from './audio.js';

const PAGE_DURATION = 320;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ICONS = {
  heart:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  envelope:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
  cap:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>',
  star:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
  flower:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25zM12 5.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S9.5 9.38 9.5 8s1.12-2.5 2.5-2.5zM3 13c0 4.97 4.03 9 9 9 0-4.97-4.03-9-9-9z"/></svg>',
  sun:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>',
  sparkle:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></svg>',
  chevronRight:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
};

const SPARKLE_COLORS = ['#E8A87C', '#B5838D', '#D9A66E'];

const els = {
  app: document.getElementById('app'),
  heartsLayer: document.getElementById('hearts-layer'),
  musicToggle: document.getElementById('music-toggle'),
  cover: document.getElementById('screen-cover'),
  page: document.getElementById('screen-page'),
  closing: document.getElementById('screen-closing'),
  coverTitle: document.getElementById('cover-title'),
  coverSubtext: document.getElementById('cover-subtext'),
  openBtn: document.getElementById('open-btn'),
  pageContent: document.getElementById('page-content'),
  closingMessage: document.getElementById('closing-message'),
  closingSignature: document.getElementById('closing-signature'),
  replayBtn: document.getElementById('replay-btn'),
  nav: document.getElementById('page-nav'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  progress: document.getElementById('progress')
};

let content = null;
let audio = null;
let audioStarted = false;
let screenName = 'cover';
let pageIndex = 0;
let animating = false;

init();

async function init() {
  try {
    const res = await fetch('data/content.json');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    content = await res.json();
  } catch {
    els.coverSubtext.textContent =
      'Cerita tidak bisa dimuat lewat file://. Buka lewat server lokal (contoh: python -m http.server) atau lewat link GitHub Pages.';
    els.openBtn.disabled = true;
    return;
  }

  audio = new AudioPlayer({ src: content.music.src, title: content.music.title });
  document.title = content.opening.headline;

  renderCover();
  renderProgress();
  renderClosing();
  bindEvents();
  createHearts();
}

function renderCover() {
  els.coverTitle.textContent = content.opening.headline;
  els.coverSubtext.textContent = content.opening.subtext;
  els.openBtn.textContent = content.opening.buttonLabel;
}

function renderClosing() {
  els.closingMessage.textContent = content.closing.message;
  els.closingSignature.textContent = `— ${content.closing.signature}`;
  els.replayBtn.textContent = content.closing.replayLabel;
}

function renderProgress() {
  els.progress.innerHTML = content.pages
    .map((page) => `<span class="dot" title="${page.title}">${ICONS.heart}</span>`)
    .join('');
}

function renderPageContent() {
  const page = content.pages[pageIndex];
  const icon = ICONS[page.icon] || ICONS.sparkle;
  const paragraphs = page.paragraphs.map((text) => `<p>${text}</p>`).join('');
  const quote = page.quote ? `<blockquote class="quote">${page.quote}</blockquote>` : '';

  els.pageContent.innerHTML = `
    <div class="page-icon">${icon}</div>
    <h2 class="page-title">${page.title}</h2>
    <div class="divider"><span></span>${ICONS.heart}<span></span></div>
    <div class="page-text">${paragraphs}</div>
    ${quote}
  `;
}

function updateChrome() {
  const onPages = screenName === 'page';
  els.nav.hidden = !onPages;
  els.musicToggle.hidden = !audioStarted;
  if (!onPages) {
    return;
  }

  els.prevBtn.disabled = pageIndex === 0;
  const isLast = pageIndex === content.pages.length - 1;
  els.nextBtn.innerHTML = isLast ? ICONS.heart : ICONS.chevronRight;
  els.nextBtn.setAttribute('aria-label', isLast ? 'Selesai' : 'Halaman berikutnya');

  Array.from(els.progress.children).forEach((dot, i) => {
    dot.classList.toggle('is-done', i < pageIndex);
    dot.classList.toggle('is-current', i === pageIndex);
  });
}

function screenEl(name) {
  if (name === 'cover') {
    return els.cover;
  }
  if (name === 'closing') {
    return els.closing;
  }
  return els.page;
}

function changeScreen(name) {
  if (animating || screenName === name) {
    return;
  }
  animating = true;

  const from = screenEl(screenName);
  const to = screenEl(name);

  const complete = () => {
    from.classList.remove('is-leaving');
    from.hidden = true;
    to.hidden = false;
    to.scrollTop = 0;
    to.classList.add('is-entering');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        to.classList.remove('is-entering');
        animating = false;
        spawnSparkles();
      })
    );
    screenName = name;
    updateChrome();
  };

  if (reduceMotion) {
    complete();
    return;
  }

  from.classList.add('is-leaving');
  setTimeout(complete, PAGE_DURATION);
}

function changePage(index) {
  if (animating || index < 0 || index >= content.pages.length || index === pageIndex) {
    return;
  }
  pageIndex = index;
  animating = true;

  const wrap = els.pageContent;

  const complete = () => {
    renderPageContent();
    wrap.classList.remove('is-leaving');
    wrap.classList.add('is-entering');
    els.page.scrollTop = 0;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        wrap.classList.remove('is-entering');
        animating = false;
        spawnSparkles();
      })
    );
    updateChrome();
  };

  if (reduceMotion) {
    complete();
    return;
  }

  wrap.classList.add('is-leaving');
  setTimeout(complete, PAGE_DURATION);
}

function nextPage() {
  if (screenName !== 'page') {
    return;
  }
  if (pageIndex < content.pages.length - 1) {
    changePage(pageIndex + 1);
  } else {
    changeScreen('closing');
  }
}

function prevPage() {
  if (screenName !== 'page' || pageIndex === 0) {
    return;
  }
  changePage(pageIndex - 1);
}

function openStory() {
  audio.start();
  audioStarted = true;
  pageIndex = 0;
  renderPageContent();
  updateChrome();
  changeScreen('page');
}

function bindEvents() {
  els.openBtn.addEventListener('click', openStory);

  els.prevBtn.addEventListener('click', prevPage);
  els.nextBtn.addEventListener('click', nextPage);

  els.replayBtn.addEventListener('click', () => {
    pageIndex = 0;
    changeScreen('cover');
  });

  els.musicToggle.addEventListener('click', () => {
    const muted = audio.toggleMute();
    els.musicToggle.classList.toggle('is-muted', muted);
  });

  window.addEventListener('keydown', (e) => {
    if (screenName === 'cover' && (e.key === 'Enter' || e.key === 'ArrowRight')) {
      e.preventDefault();
      els.openBtn.click();
      return;
    }
    if (screenName === 'page') {
      if (e.key === 'ArrowRight') {
        nextPage();
      }
      if (e.key === 'ArrowLeft') {
        prevPage();
      }
      return;
    }
    if (screenName === 'closing' && e.key === 'Enter') {
      e.preventDefault();
      els.replayBtn.click();
    }
  });

  let touchX = null;
  let touchY = null;

  els.app.addEventListener(
    'touchstart',
    (e) => {
      const touch = e.changedTouches[0];
      touchX = touch.clientX;
      touchY = touch.clientY;
    },
    { passive: true }
  );

  els.app.addEventListener(
    'touchend',
    (e) => {
      if (touchX === null) {
        return;
      }
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchX;
      const dy = touch.clientY - touchY;
      touchX = null;
      touchY = null;

      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) {
        return;
      }

      if (screenName === 'cover') {
        if (dx < 0) {
          els.openBtn.click();
        }
        return;
      }
      if (screenName !== 'page') {
        return;
      }
      if (dx < 0) {
        nextPage();
      } else {
        prevPage();
      }
    },
    { passive: true }
  );
}

function createHearts() {
  if (reduceMotion) {
    return;
  }
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('span');
    el.className = 'heart-float';
    const size = 10 + Math.random() * 14;
    el.style.cssText = [
      `left:${(Math.random() * 100).toFixed(2)}%`,
      `width:${size.toFixed(1)}px`,
      `height:${size.toFixed(1)}px`,
      `--dur:${(14 + Math.random() * 12).toFixed(1)}s`,
      `--delay:${(-Math.random() * 20).toFixed(1)}s`,
      `--op:${(0.1 + Math.random() * 0.18).toFixed(2)}`
    ].join(';');
    el.innerHTML = ICONS.heart;
    els.heartsLayer.appendChild(el);
  }
}

function spawnSparkles() {
  if (reduceMotion) {
    return;
  }
  for (let i = 0; i < 7; i++) {
    const el = document.createElement('span');
    el.className = 'sparkle';
    const size = 10 + Math.random() * 16;
    el.style.cssText = [
      `left:${(15 + Math.random() * 70).toFixed(1)}%`,
      `top:${(15 + Math.random() * 60).toFixed(1)}%`,
      `width:${size.toFixed(1)}px`,
      `height:${size.toFixed(1)}px`,
      `color:${SPARKLE_COLORS[i % SPARKLE_COLORS.length]}`,
      `animation-delay:${(Math.random() * 0.25).toFixed(2)}s`
    ].join(';');
    el.innerHTML = ICONS.sparkle;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}
