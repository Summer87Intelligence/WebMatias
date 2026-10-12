// Número de WhatsApp de Matías (Uruguay +598, sin el 0 inicial)
const WHATSAPP = '59894492946';

// Links de WhatsApp con mensaje precargado
document.querySelectorAll('[data-wa]').forEach(el => {
  el.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(el.dataset.wa)}`;
  el.target = '_blank';
  el.rel = 'noopener';
});

// Navbar: fondo al hacer scroll + botón flotante
const nav = document.getElementById('nav');
const waFloat = document.querySelector('.wa-float');
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 40);
  waFloat.classList.toggle('show', y > window.innerHeight * 0.6);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Menú mobile
const burger = document.getElementById('burger');
burger.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('#navLinks a').forEach(a =>
  a.addEventListener('click', () => nav.classList.remove('open'))
);

// Animaciones al aparecer en pantalla
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Link activo en el menú según la sección visible
const links = [...document.querySelectorAll('#navLinks a')];
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${e.target.id}`));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

// Video de fondo del hero: versión vertical en celular, horizontal en escritorio
const heroVideo = document.getElementById('heroVideo');
if (heroVideo) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroVideo.removeAttribute('autoplay'); // queda la imagen de portada
  } else {
    const movil = matchMedia('(max-width: 820px) and (orientation: portrait)').matches;
    heroVideo.src = movil ? heroVideo.dataset.srcMovil : heroVideo.dataset.src;
    heroVideo.play().catch(() => {});
  }
}

// Parallax del fondo del hero
const heroBg = document.querySelector('[data-parallax]');
if (heroBg && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) heroBg.style.transform = `translateY(${y * 0.3}px)`;
  }, { passive: true });
}

document.getElementById('year').textContent = new Date().getFullYear();
