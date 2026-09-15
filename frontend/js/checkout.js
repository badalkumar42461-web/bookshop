// Set this to "production" once you switch Cashfree to live mode.
const CASHFREE_MODE = "sandbox";

if (!getUserToken()) {
  window.location.href = "login.html";
}

let checkoutItems = []; // [{ bookId, title, price, quantity }]
let appliedDiscount = 0;
let appliedCouponCode = null;

const params = new URLSearchParams(window.location.search);

// ---------- Case 1: Returning from Cashfree redirect -> verify payment ----------
if (params.get("localOrderId")) {
  document.getElementById("checkoutLayout").style.display = "none";
  document.getElementById("verifyingBox").style.display = "block";
  verifyPaymentAndRedirect(params.get("localOrderId"));
} else {
  initCheckout();
}

async function verifyPaymentAndRedirect(localOrderId) {
  try {
    const res = await apiRequest(`/payment/verify/${localOrderId}`);
    if (res.order.paymentStatus === "PAID") {
      alert("Payment successful! Your order has been placed.");
      window.location.href = "orders.html";
    } else {
      showAlert("checkoutAlert", "Payment not completed. " + (res.message || ""), "error");
      document.getElementById("verifyingBox").style.display = "none";
      document.getElementById("checkoutLayout").style.display = "grid";
    }
  } catch (err) {
    showAlert("checkoutAlert", err.message, "error");
    document.getElementById("verifyingBox").style.display = "none";
    document.getElementById("checkoutLayout").style.display = "grid";
  }
}

// ---------- Case 2: Fresh checkout - build item list from cart or "Buy Now" ----------
async function initCheckout() {
  const mode = params.get("mode") || "cart";
  const buyNow = localStorage.getItem("buyNowItem");

  try {
    if (mode === "buynow" && buyNow) {
      const { bookId, quantity } = JSON.parse(buyNow);
      const book = await apiRequest(`/books/${bookId}`);
      const price = book.discountPrice && book.discountPrice < book.price ? book.discountPrice : book.price;
      checkoutItems = [{ bookId: book._id, title: book.title, price, quantity, coverImage: book.coverImage }];
    } else {
      const cart = await apiRequest("/cart");
      if (!cart.length) {
        document.getElementById("checkoutItems").innerHTML = `<div class="empty-state">Your cart is empty.</div>`;
        return;
      }
      checkoutItems = cart.map((item) => {
        const book = item.book;
        const price = book.discountPrice && book.discountPrice < book.price ? book.discountPrice : book.price;
        return { bookId: book._id, title: book.title, price, quantity: item.quantity, coverImage: book.coverImage };
      });
    }
    renderItems();
    renderSummary();

    const user = getUser();
    if (user) {
      // Pre-fill nothing sensitive; user still confirms address/phone each time.
    }
  } catch (err) {
    showAlert("checkoutAlert", err.message, "error");
  }
}

function renderItems() {
  document.getElementById("checkoutItems").innerHTML = checkoutItems
    .map(
      (item) => `
      <div class="flex between" style="padding:10px 0;border-bottom:1px solid var(--border);">
        <div class="flex">
          <img src="${item.coverImage}" style="width:44px;height:60px;object-fit:cover;border-radius:4px;" />
          <div>
            <div style="font-weight:600;">${item.title}</div>
            <div style="font-size:13px;color:var(--muted);">Qty: ${item.quantity}</div>
          </div>
        </div>
        <div style="font-weight:700;">${formatCurrency(item.price * item.quantity)}</div>
      </div>`
    )
    .join("");
}

function getSubtotal() {
  return checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderSummary() {
  const subtotal = getSubtotal();
  const total = Math.max(subtotal - appliedDiscount, 0);
  document.getElementById("sumSubtotal").textContent = formatCurrency(subtotal);
  document.getElementById("sumDiscount").textContent = "-" + formatCurrency(appliedDiscount);
  document.getElementById("sumTotal").textContent = formatCurrency(total);
}

document.getElementById("applyCouponBtn").addEventListener("click", async () => {
  const code = document.getElementById("couponCode").value.trim();
  const msgEl = document.getElementById("couponMsg");
  if (!code) return;
  try {
    const res = await apiRequest("/coupons/validate", {
      method: "POST",
      body: { code, orderAmount: getSubtotal() },
    });
    appliedDiscount = res.discount;
    appliedCouponCode = res.code;
    msgEl.style.color = "var(--success)";
    msgEl.textContent = `Coupon "${res.code}" applied! You saved ${formatCurrency(res.discount)}.`;
    renderSummary();
  } catch (err) {
    appliedDiscount = 0;
    appliedCouponCode = null;
    msgEl.style.color = "var(--danger)";
    msgEl.textContent = err.message;
    renderSummary();
  }
});

document.getElementById("payBtn").addEventListener("click", async () => {
  const shippingAddress = document.getElementById("shippingAddress").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!shippingAddress || !phone) {
    showAlert("checkoutAlert", "Please enter your shipping address and phone number.", "error");
    return;
  }
  if (!checkoutItems.length) return;

  const payBtn = document.getElementById("payBtn");
  payBtn.disabled = true;
  payBtn.textContent = "Processing...";

  try {
    const res = await apiRequest("/payment/create-order", {
      method: "POST",
      body: {
        items: checkoutItems.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        couponCode: appliedCouponCode,
        shippingAddress,
        phone,
      },
    });

    const cashfree = Cashfree({ mode: CASHFREE_MODE });
    cashfree.checkout({
      paymentSessionId: res.paymentSessionId,
      redirectTarget: "_self",
    });
  } catch (err) {
    showAlert("checkoutAlert", err.message, "error");
    payBtn.disabled = false;
    payBtn.textContent = "Pay with Cashfree";
  }
});
