const startButton = document.getElementById("startButton");
const discoverButton = document.getElementById("discoverButton");
const featuresSection = document.getElementById("features");

// Hemen Başla butonu
if (startButton) {
  startButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

// Özellikleri Keşfet butonu
if (discoverButton && featuresSection) {
  discoverButton.addEventListener("click", () => {
    featuresSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}
const header = document.getElementById("header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});
