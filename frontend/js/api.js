// ============================================================
// Central API configuration & fetch helper
// ============================================================
const API_BASE_URL = "http://localhost:5000/api";

/**
 * Generic request helper. Automatically attaches the JWT (user or admin)
 * if present in localStorage, and parses JSON responses.
 */
async function apiRequest(endpoint, { method = "GET", body, auth = "user" } = {}) {
  const headers = { "Content-Type": "application/json" };

  const tokenKey = auth === "admin" ? "adminToken" : "userToken";
  const token = localStorage.getItem(tokenKey);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }
  return data;
}

// ---------------- Auth helpers ----------------
function getUserToken() { return localStorage.getItem("userToken"); }
function getUser() {
  const raw = localStorage.getItem("userData");
  return raw ? JSON.parse(raw) : null;
}
function setUserSession(token, user) {
  localStorage.setItem("userToken", token);
  localStorage.setItem("userData", JSON.stringify(user));
}
function clearUserSession() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
}

function getAdminToken() { return localStorage.getItem("adminToken"); }
function getAdmin() {
  const raw = localStorage.getItem("adminData");
  return raw ? JSON.parse(raw) : null;
}
function setAdminSession(token, admin) {
  localStorage.setItem("adminToken", token);
  localStorage.setItem("adminData", JSON.stringify(admin));
}
function clearAdminSession() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminData");
}

// ---------------- Small UI helpers ----------------
function showAlert(containerId, message, type = "error") {
  const el = document.getElementById(containerId);
  if (!el) return alert(message);
  el.innerHTML = `<div class="alert alert-${type === "error" ? "error" : "success"}">${message}</div>`;
}

function formatCurrency(amount) {
  return `₹${Number(amount).toFixed(2)}`;
}

function updateNavCartBadge() {
  const badgeEls = document.querySelectorAll(".cart-count");
  if (!badgeEls.length) return;
  if (!getUserToken()) {
    badgeEls.forEach((b) => (b.textContent = "0"));
    return;
  }
  apiRequest("/cart")
    .then((cart) => {
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      badgeEls.forEach((b) => (b.textContent = count));
    })
    .catch(() => {});
}
