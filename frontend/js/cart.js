if (!getUserToken()) {
  window.location.href = "login.html";
}

let cartItems = [];

async function loadCart() {
  const wrap = document.getElementById("cartItemsWrap");
  try {
    cartItems = await apiRequest("/cart");
    if (!cartItems.length) {
      wrap.innerHTML = `<div class="empty-state">Your cart is empty. <a href="index.html" style="color:var(--primary);font-weight:700;">Browse books</a></div>`;
      renderSummary();
      return;
    }
    wrap.innerHTML = cartItems.map(renderCartItem).join("");
    renderSummary();
  } catch (err) {
    showAlert("cartAlert", err.message, "error");
  }
}

function renderCartItem(item) {
  const book = item.book;
  const price = book.discountPrice && book.discountPrice < book.price ? book.discountPrice : book.price;
  return `
    <div class="cart-item">
      <img src="${book.coverImage}" alt="${book.title}" />
      <div class="cart-item-info">
        <div style="font-weight:700;">${book.title}</div>
        <div style="color:var(--muted);font-size:13px;">by ${book.author}</div>
        <div style="font-weight:700;margin-top:6px;">${formatCurrency(price)}</div>
      </div>
      <div class="qty-control">
        <button onclick="changeQty('${book._id}', ${item.quantity - 1})">-</button>
        <span>${item.quantity}</span>
        <button onclick="changeQty('${book._id}', ${item.quantity + 1})">+</button>
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeItem('${book._id}')">Remove</button>
    </div>
  `;
}

function renderSummary() {
  const subtotal = cartItems.reduce((sum, item) => {
    const book = item.book;
    const price = book.discountPrice && book.discountPrice < book.price ? book.discountPrice : book.price;
    return sum + price * item.quantity;
  }, 0);
  document.getElementById("sumSubtotal").textContent = formatCurrency(subtotal);
  document.getElementById("sumTotal").textContent = formatCurrency(subtotal);
}

async function changeQty(bookId, newQty) {
  try {
    await apiRequest(`/cart/${bookId}`, { method: "PUT", body: { quantity: newQty } });
    loadCart();
    updateNavCartBadge();
  } catch (err) {
    showAlert("cartAlert", err.message, "error");
  }
}

async function removeItem(bookId) {
  try {
    await apiRequest(`/cart/${bookId}`, { method: "DELETE" });
    loadCart();
    updateNavCartBadge();
  } catch (err) {
    showAlert("cartAlert", err.message, "error");
  }
}

document.getElementById("checkoutBtn").addEventListener("click", () => {
  if (!cartItems.length) return;
  localStorage.removeItem("buyNowItem"); // full cart checkout, not buy-now
  window.location.href = "checkout.html?mode=cart";
});

loadCart();
