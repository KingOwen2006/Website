import "./styles.css";
import "./shop.css";
import { element, mountNavigation } from "./navigation";
import { escapeHTML as esc } from "@portabletext/to-html";
import { loadStripe, type StripeEmbeddedCheckout } from "@stripe/stripe-js";

mountNavigation("shop");
type Product = {
  _id: string; title: string; slug: string; summary?: string; description?: string;
  category?: string; price: number; availability: string;
  images?: {url: string; alt?: string}[]; details?: string[];
};
type Catalog = {products: Product[]; paymentsReady: boolean; settings?: {
  title?: string; intro?: string; delivery?: string; returns?: string;
} | null};
let products: Product[] = [];
let ready = false;
let embedded: StripeEmbeddedCheckout | undefined;
const storageKey = "portfolio-shop-basket";
let basket: Record<string, number> = {};
try {
  const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
  if (saved && typeof saved === "object") {
    for (const [id, quantity] of Object.entries(saved)) {
      if (typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0 && quantity <= 10) basket[id] = quantity;
    }
  }
} catch { /* An empty basket works when storage is unavailable. */ }
const money = (value: number) => new Intl.NumberFormat("en-GB", {style: "currency", currency: "GBP"}).format(value);
const status = element("#shop-status");
const grid = element("#shop-products");
const productDialog = element<HTMLDialogElement>("#product-dialog");
const basketDialog = element<HTMLDialogElement>("#basket-dialog");
const checkoutDialog = element<HTMLDialogElement>("#checkout-dialog");
const search = element<HTMLInputElement>("#shop-search");
const category = element<HTMLSelectElement>("#shop-category");

function photo(product: Product, index = 0) {
  const image = product.images?.[index];
  return image?.url?.startsWith("https://cdn.sanity.io/")
    ? `<img src="${esc(image.url)}?w=1000&auto=format" alt="${esc(image.alt || product.title)}" loading="lazy">`
    : '<div class="shop-image-empty" aria-label="Product image coming soon"></div>';
}
function save(replaceItems = true) {
  try { localStorage.setItem(storageKey, JSON.stringify(basket)); } catch { /* Keep the basket in memory. */ }
  renderBasket(replaceItems);
}
function renderProducts() {
  const term = search.value.toLowerCase().trim();
  const selected = products.filter(p => (!category.value || p.category === category.value) &&
    `${p.title} ${p.summary ?? ""}`.toLowerCase().includes(term));
  grid.innerHTML = selected.map(p => `<a class="shop-card" href="/shop/?product=${encodeURIComponent(p.slug)}" data-product="${esc(p._id)}">
    <div class="shop-card-image">${photo(p)}<span class="shop-tag">${esc(p.category || "Creation")}</span></div>
    <div class="shop-card-copy"><h2>${esc(p.title)}</h2><p>${esc(p.summary || "")}</p>
    <div class="shop-card-footer"><strong>${money(p.price)}</strong><span>${p.availability === "available" ? "View creation ↗" : p.availability === "sold-out" ? "Sold out" : "Coming soon"}</span></div></div></a>`).join("");
  status.textContent = !products.length ? "New creations are on their way. Check back soon." : !selected.length ? "No creations match your search." : "";
  grid.setAttribute("aria-busy", "false");
}
function openProduct(product: Product) {
  const available = product.availability === "available";
  element("#product-content").innerHTML = `<div class="shop-product-layout"><div><div id="product-photo">${photo(product)}</div>
    <div class="shop-thumbnails">${(product.images ?? []).map((_, i) => `<button type="button" data-photo="${i}" aria-label="View image ${i + 1}">${photo(product, i)}</button>`).join("")}</div></div>
    <div class="shop-product-copy"><p class="shop-eyebrow">${esc(product.category || "Creation")}</p><h2 id="product-title">${esc(product.title)}</h2>
    <p class="shop-product-price">${money(product.price)}</p><p class="shop-description">${esc(product.description || product.summary || "")}</p>
    <ul>${(product.details ?? []).map(d => `<li>${esc(d)}</li>`).join("")}</ul>
    <button type="button" class="shop-primary" id="product-add" ${available ? "" : "disabled"}>${available ? "Add to basket" : product.availability === "sold-out" ? "Sold out" : "Coming soon"}</button>
    <p role="status" id="product-message"></p></div></div>`;
  element("#product-content").querySelectorAll<HTMLButtonElement>("[data-photo]").forEach(button => button.addEventListener("click", () => {
    element("#product-photo").innerHTML = photo(product, Number(button.dataset.photo));
  }));
  element("#product-add").addEventListener("click", () => {
    basket[product._id] = Math.min(10, (basket[product._id] ?? 0) + 1);
    save();
    element("#product-message").textContent = "Added to your basket.";
  });
  if (!productDialog.open) productDialog.showModal();
  document.title = `${product.title} | King Owen`;
}
function renderBasket(replaceItems = true) {
  element("#basket-count").textContent = String(Object.values(basket).reduce((a, b) => a + b, 0));
  const entries = Object.entries(basket).map(([id, quantity]) => ({id, quantity, product: products.find(p => p._id === id)}));
  if (replaceItems) element("#basket-items").innerHTML = entries.length ? entries.map(({id, quantity, product}) => `<div class="shop-basket-item"><div><h3>${esc(product?.title || "Unavailable product")}</h3><p>${product ? money(product.price) : "Remove this item to continue"}</p></div>
    <label>Quantity <input type="number" min="1" max="10" value="${quantity}" data-quantity="${esc(id)}"></label><button type="button" data-remove="${esc(id)}">Remove</button></div>`).join("") : '<p>Your basket is waiting for something good.</p>';
  element("#basket-total").textContent = `Subtotal ${money(entries.reduce((sum, {product, quantity}) => sum + (product?.price ?? 0) * quantity, 0))}`;
  element<HTMLButtonElement>("#checkout-start").disabled = !ready || !entries.length || entries.some(({product}) => product?.availability !== "available");
  element("#basket-error").textContent = !ready ? "Checkout will be available when the shop opens." : "";
}
grid.addEventListener("click", event => {
  const link = (event.target as Element).closest<HTMLAnchorElement>("[data-product]");
  if (!link || !(event instanceof MouseEvent) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const product = products.find(p => p._id === link.dataset.product);
  if (product) { event.preventDefault(); history.pushState(null, "", link.href); openProduct(product); }
});
search.addEventListener("input", renderProducts);
category.addEventListener("change", renderProducts);
element("#basket-open").addEventListener("click", () => { renderBasket(); basketDialog.showModal(); });
element("#basket-items").addEventListener("click", event => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-remove]");
  if (button?.dataset.remove) { delete basket[button.dataset.remove]; save(); }
});
element("#basket-items").addEventListener("change", event => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.quantity) {
    basket[input.dataset.quantity] = Math.max(1, Math.min(10, Math.round(Number(input.value) || 1)));
    input.value = String(basket[input.dataset.quantity]);
    save(false);
  }
});
document.querySelectorAll<HTMLButtonElement>("[data-close]").forEach(button => button.addEventListener("click", () => {
  element<HTMLDialogElement>(`#${button.dataset.close}`).close();
}));
productDialog.addEventListener("close", () => {
  const url = new URL(location.href);
  url.searchParams.delete("product");
  history.replaceState(null, "", url);
  document.title = "Shop | King Owen";
});
checkoutDialog.addEventListener("close", () => { embedded?.destroy(); embedded = undefined; });
window.addEventListener("popstate", () => {
  const product = products.find(p => p.slug === new URLSearchParams(location.search).get("product"));
  if (product) openProduct(product); else productDialog.close();
});
element("#checkout-start").addEventListener("click", async () => {
  const button = element<HTMLButtonElement>("#checkout-start");
  button.disabled = true;
  button.textContent = "Opening checkout…";
  try {
    const response = await fetch("/api/checkout", {method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({items: Object.entries(basket).map(([id, quantity]) => ({id, quantity}))})});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Checkout could not start.");
    const stripe = await loadStripe(result.publishableKey);
    if (!stripe) throw new Error("Secure checkout could not load.");
    embedded?.destroy();
    const checkout = await stripe.createEmbeddedCheckoutPage({clientSecret: result.clientSecret});
    embedded = checkout;
    basketDialog.close();
    checkoutDialog.showModal();
    checkout.mount("#stripe-checkout");
  } catch (error) { element("#basket-error").textContent = error instanceof Error ? error.message : "Please try again."; }
  finally { button.textContent = "Checkout"; button.disabled = false; }
});

async function load() {
  try {
    const response = await fetch("/api/shop");
    if (!response.ok) throw new Error();
    const data: Catalog = await response.json();
    products = data.products.filter(p => p.slug && Number.isFinite(p.price));
    ready = data.paymentsReady;
    for (const key of ["title", "intro", "delivery", "returns"] as const) {
      const value = data.settings?.[key];
      if (value) element(`#shop-${key}`).textContent = value;
    }
    category.innerHTML += [...new Set(products.map(p => p.category).filter(Boolean))].map(c => `<option value="${esc(c!)}">${esc(c!)}</option>`).join("");
    renderProducts(); renderBasket();
    const slug = new URLSearchParams(location.search).get("product");
    const selected = products.find(p => p.slug === slug);
    if (selected) openProduct(selected);
    else if (slug) status.textContent = "This creation is no longer available.";
    const session = new URLSearchParams(location.search).get("session_id");
    if (session) {
      const result = await fetch(`/api/order-status?session_id=${encodeURIComponent(session)}`);
      if (!result.ok) throw new Error();
      const payment: {paid: boolean} = await result.json();
      status.textContent = payment.paid ? "Thank you. Your payment is confirmed." : "Your payment has not completed. Your basket is still here.";
      if (payment.paid) { basket = {}; save(); }
    }
  } catch {
    status.innerHTML = 'The shop could not load. <button type="button" id="shop-retry">Try again</button>';
    element("#shop-retry").addEventListener("click", () => location.reload());
    grid.setAttribute("aria-busy", "false");
  }
}
renderBasket();
void load();
