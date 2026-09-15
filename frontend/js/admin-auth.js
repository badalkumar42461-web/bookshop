// -------- Admin Login --------
const adminLoginForm = document.getElementById("adminLoginForm");
if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    };
    try {
      const res = await apiRequest("/admin/auth/login", { method: "POST", body: payload, auth: "admin" });
      setAdminSession(res.token, res.admin);
      window.location.href = "admin-dashboard.html";
    } catch (err) {
      showAlert("adminLoginAlert", err.message, "error");
    }
  });
}

// -------- Admin Forgot Password --------
const adminForgotForm = document.getElementById("adminForgotForm");
if (adminForgotForm) {
  adminForgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    try {
      const res = await apiRequest("/admin/auth/forgot-password", { method: "POST", body: { email } });
      let msg = res.message;
      if (res.devResetToken) {
        msg += `<br><br><strong>Dev mode (no SMTP configured):</strong><br>Reset token: <code>${res.devResetToken}</code><br><a href="admin-reset-password.html?token=${res.devResetToken}&email=${encodeURIComponent(email)}">Click here to reset now</a>`;
      }
      showAlert("adminForgotAlert", msg, "success");
    } catch (err) {
      showAlert("adminForgotAlert", err.message, "error");
    }
  });
}

// -------- Admin Reset Password --------
const adminResetForm = document.getElementById("adminResetForm");
if (adminResetForm) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("email")) document.getElementById("email").value = params.get("email");
  if (params.get("token")) document.getElementById("token").value = params.get("token");

  adminResetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      email: document.getElementById("email").value,
      token: document.getElementById("token").value,
      newPassword: document.getElementById("newPassword").value,
    };
    try {
      const res = await apiRequest("/admin/auth/reset-password", { method: "POST", body: payload });
      showAlert("adminResetAlert", res.message + " Redirecting to login...", "success");
      setTimeout(() => (window.location.href = "admin-login.html"), 2000);
    } catch (err) {
      showAlert("adminResetAlert", err.message, "error");
    }
  });
}
