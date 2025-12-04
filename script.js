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
