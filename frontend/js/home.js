async function loadBooks() {
  const grid = document.getElementById("bookGrid");
  const search = document.getElementById("searchInput").value.trim();
  const category = document.getElementById("categoryFilter").value;

  grid.innerHTML = `<p class="text-center">Loading books...</p>`;

  try {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category && category !== "all") params.set("category", category);

    const books = await apiRequest(`/books?${params.toString()}`);

    if (!books.length) {
      grid.innerHTML = `<div class="empty-state">No books found. Try a different search.</div>`;
      return;
    }

    grid.innerHTML = books.map(renderBookCard).join("");
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Failed to load books. Please make sure the backend server is running.</div>`;
  }
}

function renderBookCard(book) {
  const hasDiscount = book.discountPrice && book.discountPrice < book.price;
  const finalPrice = hasDiscount ? book.discountPrice : book.price;
  const outOfStock = book.stock <= 0;

  return `
    <div class="book-card">
      <img class="book-cover" src="${book.coverImage}" alt="${book.title}" />
      <div class="book-info">
        <span class="book-category">${book.category}</span>
        <div class="book-title">${book.title}</div>
        <div class="book-author">by ${book.author}</div>
        <div class="book-price">
          <span class="price-current">${formatCurrency(finalPrice)}</span>
          ${hasDiscount ? `<span class="price-old">${formatCurrency(book.price)}</span>` : ""}
        </div>
        ${outOfStock ? `<span class="stock-badge">Out of stock</span>` : ""}
        <div class="book-actions">
          <button class="btn btn-outline btn-sm" style="flex:1" ${outOfStock ? "disabled" : ""} onclick="handleAddToCart('${book._id}')">Add to Cart</button>
          <button class="btn btn-accent btn-sm" style="flex:1" ${outOfStock ? "disabled" : ""} onclick="handleBuyNow('${book._id}')">Buy Now</button>
        </div>
      </div>
    </div>
  `;
}

async function handleAddToCart(bookId) {
  if (!getUserToken()) {
    window.location.href = "login.html";
    return;
  }
  try {
    await apiRequest("/cart", { method: "POST", body: { bookId, quantity: 1 } });
    updateNavCartBadge();
    alert("Added to cart!");
  } catch (err) {
    alert(err.message);
  }
}

function handleBuyNow(bookId) {
  if (!getUserToken()) {
    window.location.href = "login.html";
    return;
  }
  // Stash a "Buy Now" item and send the user directly to checkout
  localStorage.setItem("buyNowItem", JSON.stringify({ bookId, quantity: 1 }));
  window.location.href = "checkout.html?mode=buynow";
}

document.getElementById("contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById("contactName").value,
    email: document.getElementById("contactEmail").value,
    subject: document.getElementById("contactSubject").value,
    message: document.getElementById("contactMessage").value,
  };
  try {
    const res = await apiRequest("/contact", { method: "POST", body: payload });
    showAlert("contactAlert", res.message, "success");
    e.target.reset();
  } catch (err) {
    showAlert("contactAlert", err.message, "error");
  }
});

document.getElementById("searchInput").addEventListener("keyup", (e) => {
  if (e.key === "Enter") loadBooks();
});

loadBooks();
