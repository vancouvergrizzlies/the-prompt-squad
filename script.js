// ===== HLS Video Setup =====
const video = document.getElementById('heroVideo');
const videoSrc = 'https://stream.mux.com/s8pMcOvMQXc4GD6AX4e1o01xFogFxipmuKltNfSYza0200.m3u8';

if (video) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {});
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari native HLS
    video.src = videoSrc;
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(() => {});
    });
  }
}

// ===== Split Text Animation =====
document.querySelectorAll('.hero-heading .split-text').forEach(el => {
  const html = el.innerHTML;
  // Split by spaces but preserve HTML tags (like <em>)
  const parts = [];
  let current = '';
  let inTag = false;

  for (let i = 0; i < html.length; i++) {
    const char = html[i];
    if (char === '<') inTag = true;
    if (char === '>') {
      inTag = false;
      current += char;
      continue;
    }
    if (char === ' ' && !inTag) {
      if (current.trim()) parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current);

  el.innerHTML = parts.map(word => `<span class="word">${word}</span>`).join('');
});

// ===== Nav Scroll Behavior =====
const nav = document.getElementById('nav');
const hero = document.getElementById('hero');

function updateNav() {
  const heroBottom = hero ? hero.offsetHeight : 600;
  const scrolled = window.scrollY > heroBottom - 80;
  nav.classList.toggle('scrolled', scrolled);
  if (scrolled) {
    nav.classList.remove('nav--transparent');
  } else {
    nav.classList.add('nav--transparent');
  }
}

window.addEventListener('scroll', updateNav);
updateNav();

// ===== Mobile Nav Toggle =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  navToggle.classList.toggle('active');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    navToggle.classList.remove('active');
  });
});

// ===== Form Submission =====
const form = document.getElementById('intakeForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    if (data[key]) {
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }

  form.innerHTML = `
    <div style="text-align: center; padding: 60px 20px;">
      <div style="font-size: 1.5rem; margin-bottom: 16px; font-weight: 800; color: #0f172a;">The Prompt Squad</div>
      <h3 style="font-size: 1.5rem; margin-bottom: 12px; color: #0f172a;">We Got Your Info!</h3>
      <p style="font-size: 1.1rem; color: #475569; max-width: 480px; margin: 0 auto;">
        Thanks for reaching out. Cole will review your details and get back to you within 24 hours with a custom plan.
      </p>
    </div>
  `;

  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  console.log('Form submitted:', data);
});

// ===== Smooth Scroll =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
