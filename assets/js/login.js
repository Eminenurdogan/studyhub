const emailError = document.querySelector("#emailError");
const passwordError = document.querySelector("#passwordError");

const loginForm = document.querySelector(".login-form");
const emailInput = document.querySelector("#email");

const passwordInput = document.querySelector("#password");
const toggleButton = document.querySelector("#togglePassword");

const loginButton = document.querySelector(".login-button");

toggleButton.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";

    toggleButton.innerHTML = '<i data-lucide="eye-off"></i>';
  } else {
    passwordInput.type = "password";

    toggleButton.innerHTML = '<i data-lucide="eye"></i>';
  }

  lucide.createIcons();
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  emailError.textContent = "";
  passwordError.textContent = "";

  emailInput.classList.remove("input-error", "input-success");
  passwordInput.classList.remove("input-error", "input-success");

  if (emailInput.value.trim() === "") {
    emailError.textContent = "Lütfen e-posta adresinizi girin.";
    emailInput.classList.add("input-error");
    emailInput.focus();
    return;
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(emailInput.value.trim())) {
    emailError.textContent = "Geçerli bir e-posta adresi girin.";
    emailInput.classList.add("input-error");
    emailInput.focus();
    return;
  }

  if (passwordInput.value.trim() === "") {
    passwordError.textContent = "Lütfen şifrenizi girin.";
    passwordInput.classList.add("input-error");
    passwordInput.focus();
    return;
  }

  if (passwordInput.value.trim().length < 8) {
    passwordError.textContent = "Şifreniz en az 8 karakter olmalıdır.";
    passwordInput.classList.add("input-error");
    passwordInput.focus();
    return;
  }

  emailInput.classList.add("input-success");
  passwordInput.classList.add("input-success");

  loginButton.disabled = true;
  loginButton.textContent = "Giriş Yapılıyor...";

  console.log("Giriş başarılı.");

  setTimeout(() => {
    loginButton.textContent = "✓ Giriş Başarılı";
    loginButton.style.background = "#22c55e";
  }, 1500);

  setTimeout(() => {
    window.location.href = "index.html";
  }, 2500);
});
emailInput.addEventListener("input", () => {
  emailError.textContent = "";
  emailInput.classList.remove("input-error");
});
passwordInput.addEventListener("input", () => {
  passwordError.textContent = "";
  passwordInput.classList.remove("input-error");
});
lucide.createIcons();
// Ana Sayfa Butonları

const startButton = document.querySelector("#startButton");
const discoverButton = document.querySelector("#discoverButton");
const featuresSection = document.querySelector("#features");

if (startButton) {
  startButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

if (discoverButton) {
  discoverButton.addEventListener("click", () => {
    featuresSection.scrollIntoView({
      behavior: "smooth",
    });
  });
}
