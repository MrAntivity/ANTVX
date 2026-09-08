(() => {
  'use strict';
  const root = document.documentElement;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('.hero-stage');
  const scene = document.querySelector('.hero-scene');
  const image = document.querySelector('.hero-image');
  const intro = document.querySelector('.hero-intro');
  const destination = document.querySelector('.hero-destination');
  const progressBar = document.querySelector('.hero-progress span');
  const cue = document.querySelector('.scroll-cue');
  const reveals = document.querySelectorAll('[data-animate]');
  let frame = 0;
  let observer;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, progress) => from + (to - from) * progress;
  const smoothstep = value => value * value * (3 - 2 * value);

  function renderScroll() {
    frame = 0;
    if (!hero || motionPreference.matches) return;
    const distance = hero.offsetHeight - stage.offsetHeight;
    const progress = clamp(-hero.getBoundingClientRect().top / Math.max(1, distance));
    const expand = smoothstep(clamp(progress / .82));
    const mobile = window.innerWidth <= 600;
    const tablet = window.innerWidth <= 900;
    const insets = mobile ? [39, 0, 8, 22] : tablet ? [33, 0, 8, 28] : [29, 5, 11, 48];
    scene.style.clipPath = `inset(${insets.map(value => `${lerp(value, 0, expand)}%`).join(' ')})`;
    image.style.transform = `scale(${lerp(1, 1.1, expand)})`;
    intro.style.opacity = String(1 - clamp(progress / .38));
    intro.style.transform = `translateY(${-80 * expand}px)`;
    // Avoid invisible links remaining in the keyboard tab order after the intro exits.
    intro.inert = progress >= .38;
    const reveal = smoothstep(clamp((progress - .46) / .36));
    destination.style.opacity = String(reveal);
    destination.style.transform = `translateY(${lerp(35, 0, reveal)}px)`;
    progressBar.style.transform = `scaleX(${progress})`;
    if (cue) cue.style.opacity = String(1 - clamp(progress * 5));
  }
  function scheduleScroll() {
    if (!frame && !motionPreference.matches) frame = requestAnimationFrame(renderScroll);
  }
  function configureMotion() {
    const enabled = !motionPreference.matches;
    root.classList.toggle('motion-enabled', enabled);
    if (observer) observer.disconnect();
    if (enabled && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: .08 });
      reveals.forEach(element => observer.observe(element));
    } else reveals.forEach(element => element.classList.add('visible'));
    if (!enabled) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      [scene, image, intro, destination, progressBar, cue].forEach(element => {
        if (element) element.removeAttribute('style');
      });
      if (intro) intro.inert = false;
    } else scheduleScroll();
  }
  // A restored tab or a hash URL can load halfway through the animation.
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll);
  window.addEventListener('pageshow', scheduleScroll);
  motionPreference.addEventListener('change', configureMotion);
  document.querySelectorAll('[data-year]').forEach(element => {
    element.textContent = String(new Date().getFullYear());
  });
  configureMotion();
})();
