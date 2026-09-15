// Renders the right-hand nav links depending on whether a user is logged in.
document.addEventListener("DOMContentLoaded", () => {
  const authArea = document.getElementById("navAuthArea");
  if (!authArea) return;

  const user = getUser();

  if (user) {
    authArea.innerHTML = `
      <span style="font-weight:600;">Hi, ${user.name.split(" ")[0]}</span>
      <a href="orders.html">My Orders</a>
      <a href="cart.html">Cart <span class="cart-badge cart-count">0</span></a>
      <button id="logoutBtn">Logout</button>
    `;
    document.getElementById("logoutBtn").addEventListener("click", () => {
      clearUserSession();
      window.location.href = "index.html";
    });
  } else {
    authArea.innerHTML = `
      <a href="cart.html">Cart <span class="cart-badge cart-count">0</span></a>
      <a href="login.html">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  }

  updateNavCartBadge();
});
