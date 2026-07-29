const AUTH_STORAGE_KEY = "studyhub.auth.v1";
const PROFILE_STORAGE_KEY = "studyhub.profile.v1";

const registerForm = document.querySelector("#registerForm");
const nameInput = document.querySelector("#registerName");
const emailInput = document.querySelector("#registerEmail");
const passwordInput = document.querySelector("#registerPassword");
const confirmationInput = document.querySelector(
  "#registerPasswordConfirmation",
);
const nameError = document.querySelector("#registerNameError");
const emailError = document.querySelector("#registerEmailError");
const passwordError = document.querySelector("#registerPasswordError");
const confirmationError = document.querySelector(
  "#registerPasswordConfirmationError",
);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clearErrors = () => {
  [nameError, emailError, passwordError, confirmationError].forEach(
    (element) => {
      element.textContent = "";
    },
  );
  [nameInput, emailInput, passwordInput, confirmationInput].forEach((input) => {
    input.classList.remove("input-error");
  });
};

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLocaleLowerCase("tr-TR");
  const password = passwordInput.value;
  let firstInvalidInput = null;

  if (!name) {
    nameError.textContent = "Lütfen adınızı ve soyadınızı girin.";
    nameInput.classList.add("input-error");
    firstInvalidInput ??= nameInput;
  }
  if (!emailPattern.test(email)) {
    emailError.textContent = "Geçerli bir e-posta adresi girin.";
    emailInput.classList.add("input-error");
    firstInvalidInput ??= emailInput;
  }
  if (password.length < 8) {
    passwordError.textContent = "Şifreniz en az 8 karakter olmalıdır.";
    passwordInput.classList.add("input-error");
    firstInvalidInput ??= passwordInput;
  }
  if (!confirmationInput.value || confirmationInput.value !== password) {
    confirmationError.textContent = "Şifreler birbiriyle eşleşmelidir.";
    confirmationInput.classList.add("input-error");
    firstInvalidInput ??= confirmationInput;
  }

  if (firstInvalidInput) {
    firstInvalidInput.focus();
    return;
  }

  const now = new Date().toISOString();
  const username =
    email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9_.-]/g, "")
      .slice(0, 30) || "kullanici";

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      isLoggedIn: true,
      user: { name, email },
      authenticatedAt: now,
    }),
  );
  localStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify({
      fullName: name,
      username,
      email,
      joinedAt: now,
      bio: "",
      photo: "",
      goals: {
        career: "",
        program: "",
        dailyMinutes: 0,
        weeklyMinutes: 0,
        monthlyMinutes: 0,
      },
    }),
  );
  window.location.href = "index.html";
});
