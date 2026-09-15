// -------- Register --------
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      password: document.getElementById("password").value,
    };
    try {
      const res = await apiRequest("/auth/register", { method: "POST", body: payload });
      setUserSession(res.token, res.user);
      window.location.href = "index.html";
    } catch (err) {
      showAlert("registerAlert", err.message, "error");
    }
  });
}

// -------- Login --------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    };
    try {
      const res = await apiRequest("/auth/login", { method: "POST", body: payload });
      setUserSession(res.token, res.user);
      window.location.href = "index.html";
    } catch (err) {
      showAlert("loginAlert", err.message, "error");
    }
  });
}

// -------- Forgot Password --------
const forgotForm = document.getElementById("forgotForm");
if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    try {
      const res = await apiRequest("/auth/forgot-password", { method: "POST", body: { email } });
      let msg = res.message;
      if (res.devResetToken) {
        msg += `<br><br><strong>Dev mode (no SMTP configured):</strong><br>Reset token: <code>${res.devResetToken}</code><br><a href="reset-password.html?token=${res.devResetToken}&email=${encodeURIComponent(email)}">Click here to reset now</a>`;
      }
      showAlert("forgotAlert", msg, "success");
    } catch (err) {
      showAlert("forgotAlert", err.message, "error");
    }
  });
}

// -------- Reset Password --------
const resetForm = document.getElementById("resetForm");
if (resetForm) {
  // Pre-fill from query params if the user came via an emailed link
  const params = new URLSearchParams(window.location.search);
  if (params.get("email")) document.getElementById("email").value = params.get("email");
  if (params.get("token")) document.getElementById("token").value = params.get("token");

  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      email: document.getElementById("email").value,
      token: document.getElementById("token").value,
      newPassword: document.getElementById("newPassword").value,
    };
    try {
      const res = await apiRequest("/auth/reset-password", { method: "POST", body: payload });
      showAlert("resetAlert", res.message + " Redirecting to login...", "success");
      setTimeout(() => (window.location.href = "login.html"), 2000);
    } catch (err) {
      showAlert("resetAlert", err.message, "error");
    }
  });
}
