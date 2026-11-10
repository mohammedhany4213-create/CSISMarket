const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const money = (value) => new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 }).format(value);
const isArabic = () => document.documentElement.lang === "ar";
const localLabel = (english, arabic) => isArabic() ? arabic : english;
const categoryLabel = (value) => isArabic() ? ({ Books: "كتب", Electronics: "إلكترونيات", Accessories: "إكسسوارات", "Study tools": "أدوات دراسة", Other: "أخرى" }[value] || value) : value;
const conditionLabel = (value) => isArabic() ? ({ New: "جديد", "Like new": "كالجديد", Good: "جيد", Fair: "مقبول" }[value] || value) : value;
const api = async (url, options = {}) => {
  const response = await fetch(url, { credentials: "same-origin", ...options, headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
};
const toast = (message) => { const node = $("#toast"); if (!node) return; node.textContent = message; node.classList.add("show"); setTimeout(() => node.classList.remove("show"), 3200); };
const formData = (form) => Object.fromEntries(new FormData(form).entries());
const setError = (message) => { const node = $("#form-error"); if (node) node.textContent = message; };
const nav = async () => {
  const host = $("#nav-account"); if (!host) return;
  try {
    const { user } = await api("/api/auth/me");
    host.innerHTML = '<a class="login-link" href="/dashboard.html">My listings</a><a class="login-link" href="/profile.html">Profile</a><button class="button button-dark" id="logout-button">Log out</button>';
    $("#logout-button").addEventListener("click", async () => { await api("/api/auth/logout", { method: "POST" }); location.href = "/"; });
  } catch { /* public visitor */ }
};
const productCard = (item, own = false) => {
  const image = item.imageUrl ? escapeHtml(item.imageUrl) : "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=700&q=80";
  return '<article class="product-card"><a class="product-image" href="/product.html?id=' + encodeURIComponent(item._id) + '"><img src="' + image + '" alt="' + escapeHtml(item.title) + '" loading="lazy"><span>' + escapeHtml(conditionLabel(item.condition)) + '</span></a><div class="product-card-info"><div class="product-card-top"><span>' + escapeHtml(categoryLabel(item.category)) + '</span><strong>' + money(item.price) + '</strong></div><h3><a href="/product.html?id=' + encodeURIComponent(item._id) + '">' + escapeHtml(item.title) + '</a></h3><p>by ' + escapeHtml(item.seller?.name || "You") + '</p>' + (own ? '<div class="card-actions"><a href="/create-listing.html?id=' + encodeURIComponent(item._id) + '">Edit</a><button data-delete="' + item._id + '">Delete</button></div>' : '') + '</div></article>';
};
async function authPage(page) {
  const form = $("#"+page+"-form"); if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); setError("");
    const button = form.querySelector("button[type=submit]"); button.disabled = true;
    try {
      await api("/api/auth/"+page, { method: "POST", body: JSON.stringify(formData(form)) });
      location.href = "/dashboard.html";
    } catch (error) { setError(error.message); button.disabled = false; }
  });
}
async function marketPage() {
  const grid = $("#product-grid"); if (!grid) return;
  let page = 1;
  const load = async () => {
    grid.innerHTML = '<p class="loading-note">Finding good things…</p>';
    const params = new URLSearchParams({ page, limit: 12 });
    if ($("#search-input").value.trim()) params.set("q", $("#search-input").value.trim());
    if ($("#category-filter").value) params.set("category", $("#category-filter").value);
    try {
      const data = await api("/api/products?"+params);
      $("#results-count").textContent = data.pagination.total + (isArabic() ? " إعلان" : (data.pagination.total === 1 ? " listing" : " listings"));
      grid.innerHTML = data.items.length ? data.items.map((item) => productCard(item)).join("") : '<div class="empty-results"><span>✳</span><h2>Nothing here just yet.</h2><p>Try another search, or be the first to list something.</p><a class="button button-dark" href="/create-listing.html">List an item ↗</a></div>';
      $("#pagination").innerHTML = data.pagination.pages > 1 ? '<button '+(page===1?'disabled':'')+' data-page="'+(page-1)+'">← Previous</button><span>'+localLabel('Page','صفحة')+' '+page+' '+localLabel('of','من')+' '+data.pagination.pages+'+'</span><button '+(page===data.pagination.pages?'disabled':'')+' data-page="'+(page+1)+'">Next →</button>' : "";
    } catch (error) { grid.innerHTML = '<p class="form-error">'+escapeHtml(error.message)+'</p>'; }
  };
  $("#search-button").addEventListener("click", () => { page=1; load(); });
  $("#search-input").addEventListener("keydown", (event) => { if(event.key==="Enter"){page=1;load();} });
  $("#category-filter").addEventListener("change", () => { page=1;load(); });
  $("#pagination").addEventListener("click", (event) => { const button=event.target.closest("[data-page]"); if(button){page=Number(button.dataset.page);load();window.scrollTo({top:0,behavior:"smooth"});} });
  window.addEventListener("cs-marche-language-change", load);
  await load();
}
async function productPage() {
  const host=$("#product-detail"); if(!host) return;
  const id=new URLSearchParams(location.search).get("id");
  if(!id){host.textContent="Listing not found.";return;}
  try {
    const {item}=await api("/api/products/"+encodeURIComponent(id));
    const seller=item.seller||{};
    const phone=(seller.whatsapp||seller.phone||"").replace(/\D/g,"");
    const contact=phone ? "https://wa.me/"+phone : "mailto:"+encodeURIComponent(seller.email||"");
    host.innerHTML='<div class="detail-image"><img src="'+(item.imageUrl?escapeHtml(item.imageUrl):"https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80")+'" alt="'+escapeHtml(item.title)+'"></div><article class="detail-copy"><span class="section-index">'+escapeHtml(categoryLabel(item.category))+' · '+escapeHtml(conditionLabel(item.condition))+'</span><h1>'+escapeHtml(item.title)+'</h1><strong class="detail-price">'+money(item.price)+'</strong><p class="detail-description">'+escapeHtml(item.description)+'</p><div class="seller-panel"><span class="form-eyebrow">THE PERSON BEHIND IT</span><h3>'+escapeHtml(seller.name||"Campus seller")+'</h3><p>Connect directly to ask a question or arrange a handoff.</p>'+(phone?'<a class="button button-dark button-full" target="_blank" rel="noopener noreferrer" href="'+contact+'">Chat on WhatsApp ↗</a>':'<p class="muted-note">Seller has not added a WhatsApp number yet.</p>')+'</div><a class="text-link back-link" href="/market.html">← Back to the market</a></article>';
  } catch(error){host.innerHTML='<div class="empty-results"><h2>We couldn't find this listing.</h2><p>'+escapeHtml(error.message)+'</p><a href="/market.html">Back to the market</a></div>';}
}
async function dashboardPage() {
  const grid = $("#my-listings");
  if (!grid) return;
  window.oncsMarcheLanguageChange = dashboardPage;
  grid.onclick = async (event) => {
    const button = event.target.closest("[data-delete]");
    if (!button) return;
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    button.disabled = true;
    try {
      await api("/api/products/" + button.dataset.delete, { method: "DELETE" });
      toast("Listing deleted.");
      await dashboardPage();
    } catch (error) {
      toast(error.message);
      button.disabled = false;
    }
  };
  try {
    const { items } = await api("/api/products/mine");
    $("#dashboard-count").textContent = items.length + (isArabic() ? " إجمالي" : " total");
    grid.innerHTML = items.length
      ? items.map((item) => productCard(item, true)).join("")
      : '<div class="empty-results"><h2>Your market starts here.</h2><p>You haven\'t listed anything yet.</p><a class="button button-dark" href="/create-listing.html">Create your first listing ↗</a></div>';
  } catch {
    grid.innerHTML = '<div class="empty-results"><h2>Log in to see your listings.</h2><a class="button button-dark" href="/login.html">Log in ↗</a></div>';
  }
}
async function listingFormPage() {
  const form=$("#listing-form");if(!form)return;
  let id=new URLSearchParams(location.search).get("id");
  if(id){
    try{const {item}=await api("/api/products/"+encodeURIComponent(id));form.elements.title.value=item.title;form.elements.description.value=item.description;form.elements.price.value=item.price;form.elements.category.value=item.category;form.elements.condition.value=item.condition;form.elements.imageUrl.value=item.imageUrl||"";$("#listing-title").textContent="Edit listing";$("#listing-eyebrow").textContent="MAKE IT JUST RIGHT";form.querySelector("button").innerHTML='Save changes <span>↗</span>';}
    catch(error){setError(error.message);return;}
  }
  form.addEventListener("submit",async(event)=>{event.preventDefault();setError("");const button=form.querySelector("button");button.disabled=true;try{const data=formData(form);data.price=Number(data.price);await api(id?"/api/products/"+id:"/api/products",{method:id?"PATCH":"POST",body:JSON.stringify(data)});location.href="/dashboard.html";}catch(error){setError(error.message);button.disabled=false;}});
}
document.addEventListener("DOMContentLoaded",()=>{
  const year=$("#year");if(year)year.textContent=new Date().getFullYear();
  nav();
  const page=document.body.dataset.page;
  if(page==="login"||page==="register")authPage(page);
  if(page==="market")marketPage();
  if(page==="product")productPage();
  if(page==="dashboard")dashboardPage();
  if(page==="listing-form")listingFormPage();
  if(page==="profile")profilePage();
});

async function profilePage() {
  const form = $("#profile-form"); if (!form) return;
  try {
    const { user } = await api("/api/auth/me");
    for (const field of ["name", "email", "phone", "whatsapp", "bio"]) form.elements[field].value = user[field] || "";
  } catch { location.href = "/login.html"; return; }
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); setError("");
    const button = form.querySelector("button"); button.disabled = true;
    try {
      await api("/api/auth/profile", { method: "PATCH", body: JSON.stringify(formData(form)) });
      toast("Your profile has been updated.");
    } catch (error) { setError(error.message); }
    finally { button.disabled = false; }
  });
}
