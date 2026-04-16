/* ────────────────────────────────────────────────
   The Prompt Squad — client-side script.
   Lenis (smooth scroll) + GSAP (horizontal slide transitions).
   ──────────────────────────────────────────────── */

/* ── Horizontal track slide animation (Fazon-style) + Lenis smooth scroll ── */
window.addEventListener('load', () => {
  const wrap  = document.querySelector('.slides');
  const track = document.querySelector('.slides__track');
  if (!wrap || !track) return;

  // Bail on small screens / reduced-motion: stacks normally via CSS
  const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                || window.matchMedia('(max-width: 980px)').matches;
  if (noMotion) return;

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[The Prompt Squad] GSAP not loaded.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Lenis disabled — native scroll feels snappier

  const slides = gsap.utils.toArray('.slide');
  const numSlides = slides.length;

  // Animate the track translating left as user scrolls vertically.
  // Tighter scroll budget = each slide takes less wheel-distance to advance.
  gsap.to(track, {
    x: () => -(numSlides - 1) * window.innerWidth,
    ease: 'none',
    scrollTrigger: {
      id: 'slidesTrack',   // lets scrollToAnchor() ask where the pin starts/ends
      trigger: wrap,
      start: 'top top',
      end:   () => '+=' + (numSlides - 1) * window.innerHeight * 0.85,
      scrub: 0.25,         // a touch of smoothing
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  // Hint the GPU to prep for transforming the track
  track.style.willChange = 'transform';

  window.addEventListener('resize', () => ScrollTrigger.refresh());
});

/* ────────────────────────────────────────────── */

/* ── Nav + grid-lines color flip + per-slide opacity fade based on viewport position ── */
(function () {
  const nav = document.querySelector('.nav');
  const brandMark = document.querySelector('.brand-mark');
  const gridLines = document.querySelector('.grid-lines');
  if (!nav) return;

  const reds = Array.from(document.querySelectorAll('.section--red'));
  const darks = Array.from(document.querySelectorAll('.cta-banner'));
  const slides = Array.from(document.querySelectorAll('.slide'));

  function update() {
    const vw = window.innerWidth;
    const cx = vw / 2;
    const cy = window.innerHeight / 2;

    const isOver = (sec) => {
      const r = sec.getBoundingClientRect();
      return r.left <= cx && r.right >= cx && r.top <= cy && r.bottom >= cy;
    };

    const onRed  = reds.some(isOver);
    const onDark = darks.some(isOver);
    nav.classList.toggle('is-on-red', onRed || onDark);
    brandMark?.classList.toggle('is-on-red', onRed || onDark);
    gridLines?.classList.toggle('is-on-red', onRed || onDark);

    // Slides stay at full opacity — text stays solid.
    slides.forEach((s) => { s.style.opacity = '1'; });

    // Box/photo fade + shift — element opacity 0→1 and slight translate
    // as it moves toward viewport horizontal center. Triggers later so
    // boxes near center stay fully visible.
    fadeElements.forEach((el) => {
      const r = el.getBoundingClientRect();
      const elCenter = (r.left + r.right) / 2;
      const distance = Math.abs(elCenter - cx);
      // Within 30% of viewport center: fully visible.
      // Beyond 60% of vw from center: fully hidden.
      const t = Math.min(1, Math.max(0, (distance - vw * 0.30) / (vw * 0.30)));
      const opacity = 1 - t;
      // Shift element down + slightly to the side it's coming from
      const sign = elCenter < cx ? -1 : 1;
      const translateX = sign * t * 40;
      const translateY = t * 30;
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    });
  }

  // ONLY boxes and photos fade — never text/headlines.
  const fadeSelectors = [
    '.service-card',
    '.process__step',
    '.plan',
    '.menu__item',
    '.about__photo',
  ];
  const fadeElements = Array.from(document.querySelectorAll(fadeSelectors.join(',')));

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
  setTimeout(update, 200);
})();

/* ── Smart anchor scrolling (handles sections inside horizontal slide track) ── */
function scrollToAnchor(hash) {
  const id = hash.replace(/^#/, '');
  if (!id || id === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const el = document.getElementById(id);
  if (!el) return;

  const wrap = document.querySelector('.slides');
  const track = document.querySelector('.slides__track');
  const slides = track ? Array.from(track.querySelectorAll('.slide')) : [];

  // Is this a section inside the horizontal track?
  let slideIndex = -1;
  for (let i = 0; i < slides.length; i++) {
    if (slides[i] === el || slides[i].contains(el)) {
      slideIndex = i;
      break;
    }
  }

  // On small screens / reduced-motion the slides stack vertically — normal scroll works.
  const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                || window.matchMedia('(max-width: 980px)').matches;

  if (slideIndex > 0 && wrap && !noMotion) {
    // Ask the pinned ScrollTrigger exactly where its scroll range starts/ends.
    // (Reading wrap.getBoundingClientRect() mid-scroll returns 0 while pinned,
    //  which gave us the wrong anchor position — hence the old overshoot.)
    const st = (typeof ScrollTrigger !== 'undefined')
      ? ScrollTrigger.getById('slidesTrack')
      : null;

    let target;
    if (st) {
      const range = st.end - st.start;
      const perSlide = range / (slides.length - 1);
      target = st.start + slideIndex * perSlide + 2;
    } else {
      // Fallback: only accurate when scroll is at 0 (wrap not pinned yet).
      const wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
      const perSlide = window.innerHeight * 0.85;
      target = wrapTop + slideIndex * perSlide + 2;
    }
    window.scrollTo({ top: target, behavior: 'smooth' });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Delegate all in-page anchor clicks through scrollToAnchor
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href === '#') return;
  e.preventDefault();
  scrollToAnchor(href);
});

/* ── Hamburger menu overlay ── */
(function () {
  const btn = document.getElementById('navMenuBtn');
  const overlay = document.getElementById('menuOverlay');
  const closeBtn = document.getElementById('menuOverlayClose');
  const backdrop = document.getElementById('menuBackdrop');
  if (!btn || !overlay) return;

  function open() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    backdrop?.classList.add('is-open');
    backdrop?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    backdrop?.classList.remove('is-open');
    backdrop?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  // Close menu on any nav link click — the global anchor delegate handles scrolling.
  overlay.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

/* ── Form submission ── */
(function () {
  const form = document.getElementById('intakeForm');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const disclaimer = form.querySelector('.form__disclaimer');
  const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

  form.addEventListener('submit', async function (e) {
    const accessKey = form.querySelector('[name="access_key"]')?.value;

    if (!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
      e.preventDefault();
      showMessage(
        "This form isn't wired up yet. Replace the access_key in index.html with your Web3Forms key (web3forms.com — free, ~30 seconds).",
        'error'
      );
      return;
    }

    e.preventDefault();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending…';
    }

    try {
      const formData = new FormData(form);
      const res = await fetch(form.action, { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok && data.success) {
        form.reset();
        replaceWithThanks();
      } else {
        showMessage(
          (data && data.message) || "Something went sideways. Try emailing us directly.",
          'error'
        );
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHTML; }
      }
    } catch (err) {
      showMessage("Couldn't reach the form server. Check your connection and try again.", 'error');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHTML; }
    }
  });

  function showMessage(text, kind) {
    if (!disclaimer) return;
    disclaimer.textContent = text;
    disclaimer.style.color = kind === 'error' ? 'var(--accent)' : 'var(--ink-soft)';
  }

  function replaceWithThanks() {
    const thanks = document.createElement('div');
    thanks.className = 'thanks';
    thanks.innerHTML = `
      <h3>Got it. Thanks for the note.</h3>
      <p>We read every intake personally. Expect a reply within 24 hours — usually well sooner.</p>
    `;
    form.replaceWith(thanks);
    thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
