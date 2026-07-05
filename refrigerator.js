const CURRENT_USER_KEY = "amazon_clone_current_user";
const USERS_KEY = "amazon_clone_users";
const accountNav = document.getElementById("accountNav");

function updateAccountNav() {
  if (!accountNav) return;

  const currentIdentifier = localStorage.getItem(CURRENT_USER_KEY);
  if (!currentIdentifier) {
    accountNav.innerHTML = `<p>Hello, sign in</p><h4>Account & Lists</h4>`;
    return;
  }

  let users = [];
  try {
    users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch (err) {
    users = [];
  }

  const user = users.find((u) => u.email.toLowerCase() === currentIdentifier.toLowerCase());
  const displayName = user && user.name ? user.name.split(" ")[0] : currentIdentifier;

  accountNav.innerHTML = `<p>Hello, ${displayName}</p><h4>Account & Lists</h4>`;
}

updateAccountNav();


// ===== Filter controls =====
const freeShipping = document.getElementById("free_ship");
const brandCheckboxes = document.querySelectorAll(".brand");
const rating4Star = document.getElementById("rating4star");
const newItem = document.getElementById("new-item");
const outOfStock = document.getElementById("out-of-stock");
const payOnDelivary = document.getElementById("pay-on-delivary");
const priceMin = document.getElementById("priceMin");
const priceMax = document.getElementById("priceMax");
const priceDisplay = document.getElementById("priceDisplay");

// Search controls (category dropdown is intentionally ignored)
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const productsContainer = document.getElementById("productsContainer");
const cartCountEl = document.getElementById("cartCount");

let allProducts = [];

let ratingFilterActive = false;

let searchQuery = "";

fetch("./data/square-card-data.json")
  .then((response) => response.json())
  .then((squareCardData) => {
    let matchedItem = null;
    for (const deal of squareCardData) {
      const found = deal.items.find((item) => item.name === "Refrigerators");
      if (found) {
        matchedItem = found;
        break;
      }
    }

    const products = matchedItem && matchedItem.products ? matchedItem.products : [];

    allProducts = products.filter((p) => p.product_name);

    if (allProducts.length === 0) {
      productsContainer.innerHTML = `<p>No products found for this category yet.</p>`;
      return;
    }

    setupPriceSlider();
    applyFilters();
  })
  .catch((err) => {
    console.error("Failed to load refrigerator products:", err);
    productsContainer.innerHTML = `<p>Unable to load products right now.</p>`;
  });

// ===== Price slider setup =====
function setupPriceSlider() {
  const prices = allProducts.map((p) => Number(p.product_price) || 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  priceMin.min = min;
  priceMin.max = max;
  priceMin.value = min;

  priceMax.min = min;
  priceMax.max = max;
  priceMax.value = max;

  updatePriceDisplay();
}

function updatePriceDisplay() {
  const min = Math.min(Number(priceMin.value), Number(priceMax.value));
  const max = Math.max(Number(priceMin.value), Number(priceMax.value));
  priceDisplay.textContent = `${formatRupees(min)} - ${formatRupees(max)}${max >= Number(priceMax.max) ? "+" : ""}`;
}

function formatRupees(value) {
  return "₹" + Number(value).toLocaleString("en-IN");
}

// ===== Filtering =====
function applyFilters() {
  const isFreeShipping = freeShipping.checked;
  const selectedBrands = Array.from(brandCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
  const isNewOnly = newItem.checked;
  const includeOutOfStock = outOfStock.checked;
  const isPayOnDelivery = payOnDelivary.checked;
  const minPrice = Math.min(Number(priceMin.value), Number(priceMax.value));
  const maxPrice = Math.max(Number(priceMin.value), Number(priceMax.value));
  const query = searchQuery.trim().toLowerCase();

  const filtered = allProducts.filter((product) => {
    if (query && !product.product_name.toLowerCase().includes(query)) return false;

    if (isFreeShipping && !product.free_sheeping) return false;

    if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
      return false;
    }

    if (ratingFilterActive && !(Number(product.product_rating) >= 4)) return false;

    if (isNewOnly && !product.new_product) return false;

    if (!includeOutOfStock && product.out_of_stock) return false;

    if (isPayOnDelivery && !product.pay_on_delivary) return false;

    const price = Number(product.product_price) || 0;
    if (price < minPrice || price > maxPrice) return false;

    return true;
  });

  renderProducts(filtered);
}

function renderProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML = `<p class="no-results">No products match the selected filters.</p>`;
    return;
  }
  productsContainer.innerHTML = products.map(renderProductCard).join("");
}

function renderProductCard(product) {
  const ratingStars = "⭐".repeat(Math.round(Number(product.product_rating) || 0));

  return `
    <div class="card">
      <img src="${product.image}" alt="${product.product_name}">
      <h3>${product.product_name}</h3>

      ${product.product_rating
      ? `<div class="rating">
              <span>${product.product_rating} ${ratingStars}</span>
            </div>`
      : ""
    }

      ${product.bought_past_month
      ? `<p>${product.bought_past_month}+ bought in past month</p>`
      : ""
    }

      <div class="price">
        ${formatRupees(product.product_price)}
        ${product.product_mrp
      ? `<span class="mrp">${formatRupees(product.product_mrp)}</span>`
      : ""
    }
      </div>

      ${product.discount_percentage
      ? `<p class="offer">(${product.discount_percentage}% off)</p>`
      : ""
    }

      ${product.delivary_date
      ? `<p class="delivery">FREE delivery as soon as <b>${product.delivary_date}</b></p>`
      : ""
    }
      ${product.out_of_stock
      ? `<b class="OUT">Out of Stock</b>`
      : ""
    }

      <button
        class="add-to-cart-btn"
        data-id="${product.id}"
        ${product.out_of_stock ? "disabled" : ""}
      >
        ${product.out_of_stock ? "Currently Unavailable" : "Add to Cart"}
      </button>
    </div>
  `;
}

// ===== Cart (shared with addToCart.html via localStorage) =====
const CART_KEY = "amazon_clone_cart";

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read cart:", err);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      product_name: product.product_name,
      image: product.image,
      product_price: product.product_price,
      product_mrp: product.product_mrp,
      brand: product.brand,
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartCount();
}

function updateCartCount() {
  if (!cartCountEl) return;
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = totalItems;
}


productsContainer.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart-btn");
  if (!btn || btn.disabled) return;

  const productId = Number(btn.dataset.id);
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  addToCart(product);

  const originalText = btn.textContent;
  btn.textContent = "Added ✓";
  btn.classList.add("added");
  setTimeout(() => {
    btn.textContent = originalText;
    btn.classList.remove("added");
  }, 1200);
});

updateCartCount();

// ===== Wire up filter event listeners =====
freeShipping.addEventListener("change", applyFilters);
brandCheckboxes.forEach((cb) => cb.addEventListener("change", applyFilters));
newItem.addEventListener("change", applyFilters);
outOfStock.addEventListener("change", applyFilters);
payOnDelivary.addEventListener("change", applyFilters);


rating4Star.addEventListener("click", () => {
  ratingFilterActive = !ratingFilterActive;
  rating4Star.classList.toggle("active", ratingFilterActive);
  applyFilters();
});

priceMin.addEventListener("input", () => {
  updatePriceDisplay();
  applyFilters();
});
priceMax.addEventListener("input", () => {
  updatePriceDisplay();
  applyFilters();
});


searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  applyFilters();
});

searchButton.addEventListener("click", () => {
  searchQuery = searchInput.value;
  applyFilters();
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchQuery = searchInput.value;
    applyFilters();
  }
});

//sidebar collapse function

const sidebarCollapseBTN = document.querySelector(".sidebar-collapse");
const sidebar = document.querySelector(".sidebar");

sidebarCollapseBTN.addEventListener("click", () => {
  sidebar.classList.toggle('active')
})