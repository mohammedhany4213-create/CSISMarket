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

const homeListings = document.querySelector("#home-listings");
if (homeListings) {
  fetch("/api/products?limit=3").then((response) => response.json()).then((data) => {
    if (!data.items || !data.items.length) return;
    const cards = data.items.map((item) => {
      const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
      const image = safe(item.imageUrl || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=700&q=80");
      const title = safe(item.title);
      const category = safe(item.category);
      const condition = safe(item.condition);
      const price = new Intl.NumberFormat("en-EG", { style:"currency", currency:"EGP", maximumFractionDigits:0 }).format(item.price);
      return '<article class="product-card"><a class="product-image" href="/product.html?id='+encodeURIComponent(item._id)+'"><img src="'+image+'" alt="'+title+'" loading="lazy"><span>'+condition+'</span></a><div class="product-card-info"><div class="product-card-top"><span>'+category+'</span><strong>'+price+'</strong></div><h3><a href="/product.html?id='+encodeURIComponent(item._id)+'">'+title+'</a></h3></div></article>';
    }).join("");
    homeListings.outerHTML = '<div class="home-featured"><div class="results-meta"><span>FRESH FROM THE COMMUNITY</span><a href="/market.html">Explore all listings ↗</a></div><div class="product-grid">'+cards+'</div></div>';
  }).catch(() => {});
}
