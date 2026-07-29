const startButton = document.getElementById("startButton");
const discoverButton = document.getElementById("discoverButton");
const featuresSection = document.getElementById("productFeatures");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const restoreLandingStart = () => {
  document.body.classList.remove("is-auth-navigating");
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
};

window.addEventListener("pageshow", () => {
  restoreLandingStart();
  window.requestAnimationFrame(restoreLandingStart);
});

// Hemen Başla butonu
if (startButton) {
  startButton.addEventListener("click", () => {
    navigateTo("register.html");
  });
}

// Özellikleri Keşfet butonu
if (discoverButton && featuresSection) {
  discoverButton.addEventListener("click", () => {
    featuresSection.scrollIntoView({
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
  });
}

document
  .querySelectorAll(
    ".landing-navigation a[href^='#'], .hero-mockup[href^='#'], .studyhub-unified__tools a[href^='#'], .footer a[href^='#']",
  )
  .forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    });
  });

const navigationLinks = Array.from(
  document.querySelectorAll(".landing-navigation a[href^='#']"),
);
const navigationSections = navigationLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const updateActiveNavigation = (activeSection) => {
  navigationLinks.forEach((link) => {
    const isActive =
      activeSection && link.getAttribute("href") === `#${activeSection.id}`;
    link.classList.toggle("is-active", Boolean(isActive));
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const visibleNavigationSections = new Map();
const navigationObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        visibleNavigationSections.set(entry.target, entry.intersectionRatio);
      } else {
        visibleNavigationSections.delete(entry.target);
      }
    });

    const activeSection = Array.from(visibleNavigationSections.entries()).sort(
      (first, second) => second[1] - first[1],
    )[0]?.[0];
    updateActiveNavigation(activeSection);
  },
  {
    rootMargin: "-18% 0px -58% 0px",
    threshold: [0.05, 0.2, 0.45],
  },
);

navigationSections.forEach((section) => navigationObserver.observe(section));
const header = document.getElementById("header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// Scroll Animations

const hiddenElements = document.querySelectorAll(".hidden");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      } else {
        entry.target.classList.remove("show");
      }
    });
  },
  {
    threshold: 0.2,
  },
);
hiddenElements.forEach((element) => {
  observer.observe(element);
});

const AUTH_STORAGE_KEY = "studyhub.auth.v1";
const PROFILE_STORAGE_KEY = "studyhub.profile.v1";
const guestNavigation = document.querySelector("#guestNavigation");
const landingLoginButton = document.querySelector("#landingLoginButton");
const landingRegisterButton = document.querySelector("#landingRegisterButton");
const ctaRegisterButton = document.querySelector("#ctaRegisterButton");
const userNavigation = document.querySelector("#userNavigation");
const userMenuTrigger = document.querySelector("#userMenuTrigger");
const userMenu = document.querySelector("#userMenu");
const userName = document.querySelector("#landingUserName");
const userEmail = document.querySelector("#landingUserEmail");
const userPhoto = document.querySelector("#landingUserPhoto");
const userInitial = document.querySelector("#landingUserInitial");
const logoutButton = document.querySelector("#logoutButton");

const readStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch (error) {
    console.error(`${key} okunamadı.`, error);
    return null;
  }
};

const navigateTo = (path) => {
  const destination = new URL(path, document.baseURI).href;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.location.assign(destination);
    return;
  }

  document.body.classList.add("is-auth-navigating");
  window.setTimeout(() => {
    window.location.assign(destination);
  }, 180);
};

landingLoginButton.addEventListener("click", () => {
  navigateTo("login.html");
});

landingRegisterButton.addEventListener("click", () => {
  navigateTo("register.html");
});

ctaRegisterButton.addEventListener("click", () => {
  navigateTo("register.html");
});

const closeUserMenu = ({ restoreFocus = false } = {}) => {
  userMenu.hidden = true;
  userMenuTrigger.setAttribute("aria-expanded", "false");
  userNavigation.classList.remove("is-open");
  if (restoreFocus) {
    userMenuTrigger.focus();
  }
};

const openUserMenu = () => {
  userMenu.hidden = false;
  userMenuTrigger.setAttribute("aria-expanded", "true");
  userNavigation.classList.add("is-open");
};

const renderAuthenticationNavigation = () => {
  const authentication = readStorage(AUTH_STORAGE_KEY);
  const profile = readStorage(PROFILE_STORAGE_KEY);
  const loggedIn = authentication?.isLoggedIn === true;

  guestNavigation.hidden = loggedIn;
  userNavigation.hidden = !loggedIn;
  if (!loggedIn) {
    closeUserMenu();
    return;
  }

  const name =
    profile?.fullName?.trim() ||
    authentication.user?.name?.trim() ||
    "Kullanıcı";
  const email = profile?.email || authentication.user?.email || "";
  const photo = profile?.photo || "";

  userName.textContent = name;
  userEmail.textContent = email;
  userInitial.textContent =
    name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "K";

  if (photo) {
    userPhoto.src = photo;
    userPhoto.alt = `${name} profil fotoğrafı`;
    userPhoto.hidden = false;
    userInitial.hidden = true;
  } else {
    userPhoto.removeAttribute("src");
    userPhoto.hidden = true;
    userInitial.hidden = false;
  }
};

userMenuTrigger.addEventListener("click", () => {
  if (userMenu.hidden) {
    openUserMenu();
  } else {
    closeUserMenu();
  }
});

userMenuTrigger.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowDown") return;
  event.preventDefault();
  openUserMenu();
  userMenu.querySelector('[role="menuitem"]')?.focus();
});

userMenu.addEventListener("keydown", (event) => {
  const items = Array.from(userMenu.querySelectorAll('[role="menuitem"]'));
  const currentIndex = items.indexOf(document.activeElement);

  if (event.key === "Escape") {
    event.preventDefault();
    closeUserMenu({ restoreFocus: true });
  } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (currentIndex + direction + items.length) % items.length;
    items[nextIndex].focus();
  }
});

document.addEventListener("click", (event) => {
  if (!userNavigation.contains(event.target)) {
    closeUserMenu();
  }
});

logoutButton.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

window.addEventListener("storage", renderAuthenticationNavigation);
renderAuthenticationNavigation();
