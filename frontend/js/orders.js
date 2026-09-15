if (!getUserToken()) {
  window.location.href = "login.html";
}

function statusBadgeClass(status) {
  if (status === "PAID" || status === "DELIVERED") return "badge-success";
  if (status === "FAILED" || status === "CANCELLED") return "badge-danger";
  return "badge-warning";
}

async function loadOrders() {
  const wrap = document.getElementById("ordersWrap");
  try {
    const orders = await apiRequest("/orders/my-orders");
    if (!orders.length) {
      wrap.innerHTML = `<div class="empty-state">You haven't placed any orders yet. <a href="index.html" style="color:var(--primary);font-weight:700;">Start shopping</a></div>`;
      return;
    }

    wrap.innerHTML = orders
      .map(
        (order) => `
      <div class="table-wrap" style="padding:20px;margin-bottom:16px;">
        <div class="flex between" style="margin-bottom:10px;">
          <div>
            <strong>Order #${order._id.slice(-8).toUpperCase()}</strong>
            <div style="font-size:13px;color:var(--muted);">Placed on ${new Date(order.createdAt).toLocaleString()}</div>
          </div>
          <div class="flex">
            <span class="badge ${statusBadgeClass(order.paymentStatus)}">${order.paymentStatus}</span>
            <span class="badge ${statusBadgeClass(order.orderStatus)}">${order.orderStatus}</span>
          </div>
        </div>
        ${order.items
          .map(
            (item) => `<div class="flex between" style="padding:6px 0;font-size:14px;">
              <span>${item.title} × ${item.quantity}</span>
              <span>${formatCurrency(item.price * item.quantity)}</span>
            </div>`
          )
          .join("")}
        <div class="flex between" style="border-top:1px solid var(--border);padding-top:10px;margin-top:8px;font-weight:700;">
          <span>Total Paid</span>
          <span>${formatCurrency(order.totalAmount)}</span>
        </div>
        <div style="font-size:13px;color:var(--muted);margin-top:8px;">Shipping to: ${order.shippingAddress}</div>
      </div>
    `
      )
      .join("");
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

loadOrders();
