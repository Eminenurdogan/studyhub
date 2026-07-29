const resetForm = document.querySelector("#forgotPasswordForm");
const resetEmail = document.querySelector("#resetEmail");
const resetEmailError = document.querySelector("#resetEmailError");
const resetFeedback = document.querySelector("#resetFeedback");
const resetButton = resetForm.querySelector('button[type="submit"]');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

resetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = resetEmail.value.trim();
  resetEmailError.textContent = "";
  resetFeedback.hidden = true;
  resetEmail.classList.remove("input-error", "input-success");

  if (!emailPattern.test(email)) {
    resetEmailError.textContent = "Geçerli bir e-posta adresi girin.";
    resetEmail.classList.add("input-error");
    resetEmail.focus();
    return;
  }

  resetEmail.classList.add("input-success");
  resetButton.disabled = true;
  resetFeedback.textContent =
    "Talebin alındı. E-posta gönderimi backend bağlantısı tamamlandığında etkinleşecek.";
  resetFeedback.hidden = false;
});

resetEmail.addEventListener("input", () => {
  resetEmailError.textContent = "";
  resetEmail.classList.remove("input-error");
});
