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

const handleParallax = () => {
  const scrollY = window.scrollY;
  parallaxItems.forEach((el) => {
    const speed = parseFloat(el.dataset.speed || '0.1');
    const offset = (scrollY - el.offsetTop + window.innerHeight / 2) * speed;
    el.style.transform = `translateY(${offset}px)`;
  });
};

handleParallax();
window.addEventListener('scroll', handleParallax);
window.addEventListener('resize', handleParallax);
