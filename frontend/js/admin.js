if (!getAdminToken()) {
  window.location.href = "admin-login.html";
}

const admin = getAdmin();
if (admin) document.getElementById("adminName").textContent = admin.name;

document.getElementById("adminLogoutBtn").addEventListener("click", () => {
  clearAdminSession();
  window.location.href = "admin-login.html";
});

// ---------------- Sidebar navigation ----------------
const navItems = document.querySelectorAll(".nav-item");
navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    navItems.forEach((n) => n.classList.remove("active"));
    item.classList.add("active");
    document.querySelectorAll(".admin-section").forEach((s) => s.classList.remove("active"));
    document.getElementById(`section-${section}`).classList.add("active");
    document.getElementById("pageTitle").textContent = item.textContent.trim();
    loadSection(section);
  });
});

function loadSection(section) {
  if (section === "dashboard") loadDashboardStats();
  if (section === "books") loadBooks();
  if (section === "orders") loadOrders();
  if (section === "users") loadUsers();
  if (section === "coupons") loadCoupons();
  if (section === "messages") loadMessages();
}

function adminApi(endpoint, opts = {}) {
  return apiRequest(endpoint, { ...opts, auth: "admin" });
}

function showGlobalAlert(message, type = "success") {
  showAlert("globalAlert", message, type);
  setTimeout(() => (document.getElementById("globalAlert").innerHTML = ""), 3500);
}

// ---------------- Dashboard ----------------
async function loadDashboardStats() {
  try {
    const stats = await adminApi("/admin/dashboard-stats");
    document.getElementById("statUsers").textContent = stats.totalUsers;
    document.getElementById("statBooks").textContent = stats.totalBooks;
    document.getElementById("statOrders").textContent = stats.totalOrders;
    document.getElementById("statRevenue").textContent = formatCurrency(stats.totalRevenue);
  } catch (err) {
    showGlobalAlert(err.message, "error");
  }
}

// ---------------- Books CRUD ----------------
let booksCache = [];

async function loadBooks() {
  const tbody = document.getElementById("booksTableBody");
  tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;
  try {
    booksCache = await adminApi("/admin/books");
    if (!booksCache.length) {
      tbody.innerHTML = `<tr><td colspan="8">No books yet. Add your first book.</td></tr>`;
      return;
    }
    tbody.innerHTML = booksCache
      .map(
        (b) => `
      <tr>
        <td><img src="${b.coverImage}" style="width:36px;height:48px;object-fit:cover;border-radius:4px;" /></td>
        <td>${b.title}</td>
        <td>${b.author}</td>
        <td>${b.category}</td>
        <td>${formatCurrency(b.discountPrice || b.price)}</td>
        <td>${b.stock}</td>
        <td><span class="badge ${b.isActive ? "badge-success" : "badge-danger"}">${b.isActive ? "Active" : "Inactive"}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="openBookModal('${b._id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteBook('${b._id}')">Delete</button>
        </td>
      </tr>`
      )
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8">${err.message}</td></tr>`;
  }
}

const bookModal = document.getElementById("bookModalOverlay");
document.getElementById("addBookBtn").addEventListener("click", () => openBookModal(null));
document.getElementById("cancelBookModal").addEventListener("click", () => bookModal.classList.remove("active"));

function openBookModal(bookId) {
  document.getElementById("bookForm").reset();
  document.getElementById("bookId").value = "";
  document.getElementById("bookModalTitle").textContent = bookId ? "Edit Book" : "Add New Book";

  if (bookId) {
    const book = booksCache.find((b) => b._id === bookId);
    document.getElementById("bookId").value = book._id;
    document.getElementById("bookTitle").value = book.title;
    document.getElementById("bookAuthor").value = book.author;
    document.getElementById("bookDescription").value = book.description || "";
    document.getElementById("bookCategory").value = book.category;
    document.getElementById("bookPrice").value = book.price;
    document.getElementById("bookDiscountPrice").value = book.discountPrice || "";
    document.getElementById("bookStock").value = book.stock;
    document.getElementById("bookCoverImage").value = book.coverImage;
    document.getElementById("bookIsActive").value = String(book.isActive);
  }
  bookModal.classList.add("active");
}

document.getElementById("bookForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const bookId = document.getElementById("bookId").value;
  const payload = {
    title: document.getElementById("bookTitle").value,
    author: document.getElementById("bookAuthor").value,
    description: document.getElementById("bookDescription").value,
    category: document.getElementById("bookCategory").value || "General",
    price: Number(document.getElementById("bookPrice").value),
    discountPrice: document.getElementById("bookDiscountPrice").value
      ? Number(document.getElementById("bookDiscountPrice").value)
      : undefined,
    stock: Number(document.getElementById("bookStock").value),
    coverImage: document.getElementById("bookCoverImage").value || undefined,
    isActive: document.getElementById("bookIsActive").value === "true",
  };

  try {
    if (bookId) {
      await adminApi(`/admin/books/${bookId}`, { method: "PUT", body: payload });
      showGlobalAlert("Book updated successfully");
    } else {
      await adminApi("/admin/books", { method: "POST", body: payload });
      showGlobalAlert("Book created successfully");
    }
    bookModal.classList.remove("active");
    loadBooks();
  } catch (err) {
    showGlobalAlert(err.message, "error");
  }
});

async function deleteBook(bookId) {
  if (!confirm("Are you sure you want to delete this book?")) return;
  try {
    await adminApi(`/admin/books/${bookId}`, { method: "DELETE" });
    showGlobalAlert("Book deleted successfully");
    loadBooks();
  } catch (err) {
    showGlobalAlert(err.message, "error");
  }
}

// ---------------- Orders ----------------
async function loadOrders() {
  const tbody = document.getElementById("ordersTableBody");
  tbody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;
  try {
    const orders = await adminApi("/admin/orders");
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="7">No orders yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = orders
      .map(
        (o) => `
      <tr>
        <td>#${o._id.slice(-8).toUpperCase()}</td>
        <td>${o.user ? o.user.name : "Deleted user"}<br><small style="color:var(--muted)">${o.user ? o.user.email : ""}</small></td>
        <td>${formatCurrency(o.totalAmount)}</td>
        <td><span class="badge ${o.paymentStatus === "PAID" ? "badge-success" : "badge-warning"}">${o.paymentStatus}</span></td>
        <td>${o.orderStatus}</td>
        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
        <td>
          <select onchange="updateOrderStatus('${o._id}', this.value)">
            ${["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]
              .map((s) => `<option value="${s}" ${s === o.orderStatus ? "selected" : ""}>${s}</option>`)
              .join("")}
          </select>
        </td>
      </tr>`
      )
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">${err.message}</td></tr>`;
  }
}

async function updateOrderStatus(orderId, orderStatus) {
  try {
    await adminApi(`/admin/orders/${orderId}/status`, { method: "PUT", body: { orderStatus } });
    showGlobalAlert("Order status updated");
  } catch (err) {
    showGlobalAlert(err.message, "error");
  }
}

// ---------------- Users ----------------
async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;
  try {
    const users = await adminApi("/admin/users");
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="6">No registered users yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.phone || "-"}</td>
        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
        <td><span class="badge ${u.isActive ? "badge-success" : "badge-danger"}">${u.isActive ? "Active" : "Blocked"}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="viewUserOrders('${u._id}', '${u.name.replace(/'/g, "")}')">View Orders</button>
          <button class="btn btn-danger btn-sm" onclick="toggleUserStatus('${u._id}')">${u.isActive ? "Block" : "Unblock"}</button>
        </td>
      </tr>`
      )
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
  }
}

async function toggleUserStatus(userId) {
  try {
    await adminApi(`/admin/users/${userId}/toggle-status`, { method: "PUT" });
    showGlobalAlert("User status updated");
    loadUsers();
  } catch (err) {
    showGlobalAlert(err.message, "error");
  }
}

const userOrdersModal = document.getElementById("userOrdersModalOverlay");
document.getElementById("closeUserOrdersModal").addEventListener("click", () => userOrdersModal.classList.remove("active"));

async function viewUserOrders(userId, name) {
  document.getElementById("userOrdersModalTitle").textContent = `${name}'s Order History`;
  document.getElementById("userOrdersContent").innerHTML = "Loading...";
  userOrdersModal.classList.add("active");
  try {
    const { orders } = await adminApi(`/admin/users/${userId}`);
    if (!orders.length) {
      document.getElementById("userOrdersContent").innerHTML = `<p>No orders placed yet.</p>`;
      return;
    }
    document.getElementById("userOrdersContent").innerHTML = orders
      .map(
        (o) => `
      <div style="border-bottom:1px solid var(--border);padding:10px 0;">
        <div class="flex between"><strong>#${o._id.slice(-8).toUpperCase()}</strong><span>${formatCurrency(o.totalAmount)}</span></div>
        <div style="font-size:13px;color:var(--muted);">${new Date(o.createdAt).toLocaleDateString()} • ${o.paymentStatus} • ${o.orderStatus}</div>
      </div>`
      )
      .join("");
  } catch (err) {
    document.getElementById("userOrdersContent").innerHTML = `<p>${err.message}</p>`;
  }
}

// ---------------- Coupons CRUD ----------------
let couponsCache = [];

async function loadCoupons() {
  const tbody = document.getElementById("couponsTableBody");
  tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;
  try {
    couponsCache = await adminApi("/admin/coupons");
    if (!couponsCache.length) {
      tbody.innerHTML = `<tr><td colspan="8">No coupons yet. Create your first coupon.</td></tr>`;
      return;
    }
    tbody.innerHTML = couponsCache
      .map(
        (c) => `
      <tr>
        <td><strong>${c.code}</strong></td>
        <td>${c.discountType}</td>
        <td>${c.discountType === "PERCENTAGE" ? c.discountValue + "%" : formatCurrency(c.discountValue)}</td>
        <td>${formatCurrency(c.minOrderAmount)}</td>
        <td>${new Date(c.expiryDate).toLocaleDateString()}</td>
        <td>${c.usedCount} / ${c.usageLimit}</td>
        <td><span class="badge ${c.isActive ? "badge-success" : "badge-danger"}">${c.isActive ? "Active" : "Inactive"}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="openCouponModal('${c._id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCoupon('${c._id}')">Delete</button>
        </td>
      </tr>`
      )
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8">${err.message}</td></tr>`;
  }
}

const couponModal = document.getElementById("couponModalOverlay");
document.getElementById("addCouponBtn").addEventListener("click", () => openCouponModal(null));
document.getElementById("cancelCouponModal").addEventListener("click", () => couponModal.classList.remove("active"));

function openCouponModal(couponId) {
  document.getElementById("couponForm").reset();
  document.getElementById("couponId").value = "";
  document.getElementById("couponModalTitle").textContent = couponId ? "Edit Coupon" : "Add New Coupon";

  if (couponId) {
    const c = couponsCache.find((x) => x._id === couponId);
    document.getElementById("couponId").value = c._id;
    document.getElementById("couponCodeInput").value = c.code;
    document.getElementById("couponDiscountType").value = c.discountType;
    document.getElementById("couponDiscountValue").value = c.discountValue;
    document.getElementById("couponMaxDiscount").value = c.maxDiscountAmount || "";
    document.getElementById("couponMinOrder").value = c.minOrderAmount;
    document.getElementById("couponUsageLimit").value = c.usageLimit;
    document.getElementById("couponExpiry").value = new Date(c.expiryDate).toISOString().split("T")[0];
    document.getElementById("couponIsActive").value = String(c.isActive);
  }
  couponModal.classList.add("active");
}

document.getElementById("couponForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const couponId = document.getElementById("couponId").value;
  const payload = {
    code: document.getElementById("couponCodeInput").value,
    discountType: document.getElementById("couponDiscountType").value,
    discountValue: Number(document.getElementById("couponDiscountValue").value),
    maxDiscountAmount: document.getElementById("couponMaxDiscount").value
      ? Number(document.getElementById("couponMaxDiscount").value)
      : null,
    minOrderAmount: Number(document.getElementById("couponMinOrder").value || 0),
    usageLimit: Number(document.getElementById("couponUsageLimit").value || 100),
    expiryDate: document.getElementById("couponExpiry").value,
    isActive: document.getElementById("couponIsActive").value === "true",
  };

  try {
    if (couponId) {
      await adminApi(`/admin/coupons/${couponId}`, { method: "PUT", body: payload });
      showGlobalAlert("Coupon updated successfully");
    } else {
      await adminApi("/admin/coupons", { method: "POST", body: payload });
      showGlobalAlert("Coupon created successfully");
    }
    couponModal.classList.remove("active");
    loadCoupons();
  } catch (err) {
    showGlobalAlert(err.message, "error");
  }
});

async function deleteCoupon(couponId) {
  if (!confirm("Are you sure you want to delete this coupon?")) return;
  try {
    await adminApi(`/admin/coupons/${couponId}`, { method: "DELETE" });
    showGlobalAlert("Coupon deleted successfully");
    loadCoupons();
  } catch (err) {
    showGlobalAlert(err.message, "error");
  }
}

// ---------------- Contact Messages ----------------
async function loadMessages() {
  const wrap = document.getElementById("messagesWrap");
  wrap.innerHTML = "Loading...";
  try {
    const messages = await adminApi("/admin/contact-messages");
    if (!messages.length) {
      wrap.innerHTML = `<div class="empty-state">No messages received yet.</div>`;
      return;
    }
    wrap.innerHTML = messages
      .map(
        (m) => `
      <div class="table-wrap" style="padding:16px;margin-bottom:12px;">
        <div class="flex between">
          <strong>${m.name}</strong>
          <span class="badge ${m.isRead ? "badge-success" : "badge-warning"}">${m.isRead ? "Read" : "New"}</span>
        </div>
        <div style="font-size:13px;color:var(--muted);">${m.email} • ${new Date(m.createdAt).toLocaleString()}</div>
        <div style="font-weight:600;margin-top:8px;">${m.subject || "General Inquiry"}</div>
        <p style="margin-top:4px;">${m.message}</p>
        <div class="flex" style="margin-top:10px;gap:8px;">
          ${!m.isRead ? `<button class="btn btn-outline btn-sm" onclick="markMessageRead('${m._id}')">Mark as Read</button>` : ""}
          <button class="btn btn-danger btn-sm" onclick="deleteMessage('${m._id}')">Delete</button>
        </div>
      </div>`
      )
      .join("");
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

async function markMessageRead(id) {
  try {
    await adminApi(`/admin/contact-messages/${id}/read`, { method: "PUT" });
    loadMessages();
  } catch (err) {
    showGlobalAlert(err.message, "error");
  }
}

async function deleteMessage(id) {
  if (!confirm("Delete this message?")) return;
  try {
    await adminApi(`/admin/contact-messages/${id}`, { method: "DELETE" });
    loadMessages();
  } catch (err) {
    showGlobalAlert(err.message, "error");
  }
}

// ---------------- Init ----------------
loadDashboardStats();
