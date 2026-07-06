const USERS_KEY = "amazon_clone_edu_demo_users";
const CURRENT_USER_KEY = "amazon_clone_edu_demo_current_user";

// This is a self-contained front-end demo. Everything below only reads and
// writes to this browser's own localStorage — nothing is ever sent to a
// server, and no data leaves the visitor's device.

// ===== Storage helpers =====
function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read users:", err);
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUser(identifier) {
  const key = identifier.trim().toLowerCase();
  return getUsers().find((u) => u.email.toLowerCase() === key);
}

function setCurrentUser(identifier) {
  localStorage.setItem(CURRENT_USER_KEY, identifier);
}

function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY);
}

function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// ===== Step elements =====
const steps = {
  email: document.getElementById("emailStep"),
  password: document.getElementById("passwordStep"),
  register: document.getElementById("registerStep"),
  success: document.getElementById("successStep"),
};

function showStep(name) {
  Object.values(steps).forEach((el) => el.classList.add("hidden"));
  steps[name].classList.remove("hidden");
}

let pendingIdentifier = "";

// ===== Step 1: email/mobile =====
const emailForm = document.getElementById("emailForm");
const emailInput = document.getElementById("emailInput");
const emailError = document.getElementById("emailError");

function isValidIdentifier(value) {
  const trimmed = value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\+?\d{10,15}$/;
  return emailPattern.test(trimmed) || phonePattern.test(trimmed);
}

emailForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = emailInput.value.trim();

  if (!value) {
    emailError.textContent = "Enter your mobile number or email.";
    return;
  }
  if (!isValidIdentifier(value)) {
    emailError.textContent = "Enter a valid mobile number or email address.";
    return;
  }

  emailError.textContent = "";
  pendingIdentifier = value;

  const existingUser = findUser(value);
  if (existingUser) {
    openPasswordStep(value);
  } else {
    openRegisterStep(value);
  }
});

// ===== Step 2: password (existing account) =====
const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("passwordInput");
const passwordError = document.getElementById("passwordError");
const passwordStepEmail = document.getElementById("passwordStepEmail");
const showPasswordCheckbox = document.getElementById("showPasswordCheckbox");
const changeEmailLink = document.getElementById("changeEmailLink");
const goToRegisterBtn = document.getElementById("goToRegisterBtn");

function openPasswordStep(identifier) {
  pendingIdentifier = identifier;
  passwordStepEmail.textContent = identifier;
  passwordInput.value = "";
  passwordError.textContent = "";
  showPasswordCheckbox.checked = false;
  passwordInput.type = "password";
  showStep("password");
  passwordInput.focus();
}

passwordForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const password = passwordInput.value;

  if (!password) {
    passwordError.textContent = "Enter your password.";
    return;
  }

  const user = findUser(pendingIdentifier);
  if (!user || user.password !== password) {
    passwordError.textContent = "Incorrect password. Please try again.";
    return;
  }

  passwordError.textContent = "";
  setCurrentUser(user.email);
  openSuccessStep(user.name, user.email);
});

showPasswordCheckbox.addEventListener("change", () => {
  passwordInput.type = showPasswordCheckbox.checked ? "text" : "password";
});

changeEmailLink.addEventListener("click", (e) => {
  e.preventDefault();
  emailInput.value = pendingIdentifier;
  emailError.textContent = "";
  showStep("email");
  emailInput.focus();
});

goToRegisterBtn.addEventListener("click", () => {
  openRegisterStep(pendingIdentifier);
});

// ===== Step 3: create account =====
const registerForm = document.getElementById("registerForm");
const nameInput = document.getElementById("nameInput");
const registerEmailInput = document.getElementById("registerEmailInput");
const registerPasswordInput = document.getElementById("registerPasswordInput");
const registerConfirmInput = document.getElementById("registerConfirmInput");
const registerError = document.getElementById("registerError");
const goToSigninBtn = document.getElementById("goToSigninBtn");

function openRegisterStep(identifier) {
  pendingIdentifier = identifier;
  nameInput.value = "";
  registerEmailInput.value = identifier;
  registerPasswordInput.value = "";
  registerConfirmInput.value = "";
  registerError.textContent = "";
  showStep("register");
  nameInput.focus();
}

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const identifier = registerEmailInput.value.trim();
  const password = registerPasswordInput.value;
  const confirmPassword = registerConfirmInput.value;

  if (!name) {
    registerError.textContent = "Enter your name.";
    return;
  }
  if (!isValidIdentifier(identifier)) {
    registerError.textContent = "Enter a valid mobile number or email address.";
    return;
  }
  if (findUser(identifier)) {
    registerError.textContent = "An account already exists for this email or mobile number.";
    return;
  }
  if (password.length < 6) {
    registerError.textContent = "Password must be at least 6 characters.";
    return;
  }
  if (password !== confirmPassword) {
    registerError.textContent = "Passwords do not match.";
    return;
  }

  registerError.textContent = "";

  const users = getUsers();
  users.push({ name, email: identifier, password });
  saveUsers(users);

  setCurrentUser(identifier);
  openSuccessStep(name, identifier);
});

goToSigninBtn.addEventListener("click", () => {
  if (pendingIdentifier && findUser(pendingIdentifier)) {
    openPasswordStep(pendingIdentifier);
  } else {
    emailInput.value = pendingIdentifier || "";
    showStep("email");
    emailInput.focus();
  }
});

// ===== Step 4: signed in =====
const successMessage = document.getElementById("successMessage");
const continueShoppingBtn = document.getElementById("continueShoppingBtn");
const signOutBtn = document.getElementById("signOutBtn");

function openSuccessStep(name, identifier) {
  successMessage.textContent = name
    ? `Signed in as ${name} (${identifier})`
    : `Signed in as ${identifier}`;
  showStep("success");
}

continueShoppingBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

signOutBtn.addEventListener("click", () => {
  clearCurrentUser();
  pendingIdentifier = "";
  emailInput.value = "";
  emailError.textContent = "";
  showStep("email");
});

// ===== On load: if already signed in, skip straight to success step =====
(function init() {
  const currentIdentifier = getCurrentUser();
  if (currentIdentifier) {
    const user = findUser(currentIdentifier);
    openSuccessStep(user ? user.name : "", currentIdentifier);
  } else {
    showStep("email");
  }
})();