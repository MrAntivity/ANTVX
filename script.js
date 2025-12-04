const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.25,
});

document.querySelectorAll('[data-animate]').forEach((el, index) => {
  el.style.transitionDelay = `${index * 80}ms`;
  observer.observe(el);
});

const parallaxItems = document.querySelectorAll('[data-parallax]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const handleParallax = () => {
  const parallaxEnabled = !prefersReducedMotion.matches && window.innerWidth >= 900;

  parallaxItems.forEach((el) => {
    if (!parallaxEnabled) {
      el.style.transform = 'translateY(0)';
      return;
    }

    const speed = parseFloat(el.dataset.speed || '0.1');
    const elementCenter = el.offsetTop + el.offsetHeight / 2;
    const viewportCenter = window.scrollY + window.innerHeight / 2;
    const distanceFromCenter = viewportCenter - elementCenter;
    const offset = clamp(distanceFromCenter * speed, -32, 32);
    el.style.transform = `translateY(${offset}px)`;
  });
};

handleParallax();
window.addEventListener('scroll', handleParallax, { passive: true });
window.addEventListener('resize', handleParallax);
prefersReducedMotion.addEventListener('change', handleParallax);
