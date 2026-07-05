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


const CART_KEY = "amazon_clone_cart";

const cartItemsContainer = document.getElementById("cartItemsContainer");
const summaryItemCount = document.getElementById("summaryItemCount");
const summarySubtotal = document.getElementById("summarySubtotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const cartCountEl = document.getElementById("cartCount");

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

function formatRupees(value) {
  return "₹" + Number(value).toLocaleString("en-IN");
}

function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountEl) cartCountEl.textContent = totalItems;
}

function renderCart() {
  const cart = getCart();

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <p>Your Amazon Cart is empty.</p>
        <p><a href="refrigerator.html">Continue shopping</a></p>
      </div>
    `;
  } else {
    cartItemsContainer.innerHTML = cart.map(renderCartRow).join("");
  }

  updateSummary(cart);
  updateCartCount();
}

function renderCartRow(item) {
  const subtotal = item.product_price * item.quantity;

  return `
    <div class="cart-row" data-id="${item.id}">
      <img src="${item.image}" alt="${item.product_name}">
      <div class="cart-row-details">
        <h3>${item.product_name}</h3>
        ${item.brand ? `<p class="cart-row-brand">Brand: ${item.brand}</p>` : ""}
        <div>
          <span class="cart-row-price">${formatRupees(item.product_price)}</span>
          ${item.product_mrp
      ? `<span class="cart-row-mrp">${formatRupees(item.product_mrp)}</span>`
      : ""
    }
        </div>
        <div class="cart-row-actions">
          <div class="qty-stepper">
            <button class="qty-decrease" data-id="${item.id}">−</button>
            <span>${item.quantity}</span>
            <button class="qty-increase" data-id="${item.id}">+</button>
          </div>
          <button class="remove-item-btn" data-id="${item.id}">Delete</button>
        </div>
      </div>
      <div class="cart-row-subtotal">${formatRupees(subtotal)}</div>
    </div>
  `;
}

function updateSummary(cart) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.product_price * item.quantity, 0);

  summaryItemCount.textContent = totalItems;
  summarySubtotal.textContent = formatRupees(totalPrice);
  checkoutBtn.disabled = cart.length === 0;
}

function changeQuantity(id, delta) {
  const cart = getCart();
  const item = cart.find((p) => p.id === id);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeItem(id);
    return;
  }

  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  const cart = getCart().filter((p) => p.id !== id);
  saveCart(cart);
  renderCart();
}

cartItemsContainer.addEventListener("click", (e) => {
  const increaseBtn = e.target.closest(".qty-increase");
  const decreaseBtn = e.target.closest(".qty-decrease");
  const removeBtn = e.target.closest(".remove-item-btn");

  if (increaseBtn) {
    changeQuantity(Number(increaseBtn.dataset.id), 1);
  } else if (decreaseBtn) {
    changeQuantity(Number(decreaseBtn.dataset.id), -1);
  } else if (removeBtn) {
    removeItem(Number(removeBtn.dataset.id));
  }
});

checkoutBtn.addEventListener("click", () => {
  if (checkoutBtn.disabled) return;
  alert("This is a demo store - checkout isn't connected to real payments.");
});

renderCart();