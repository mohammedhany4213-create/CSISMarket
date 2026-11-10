const yearElement = document.querySelector("#year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}


// Subtle scroll reveals; keep content visible when motion is reduced or unsupported.
const revealTargets = document.querySelectorAll(
  ".hero-copy, .hero-visual, .market-heading, .market-gallery, .empty-state, .manifesto-main, .step, .closing-cta > div, .closing-cta > .button"
);

if (revealTargets.length && "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("reveal-ready");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

  revealTargets.forEach((element) => revealObserver.observe(element));
}
