const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

window.addEventListener("scroll", () => {
  header.classList.toggle("compact", window.scrollY > 40);
}, { passive: true });

menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  mobileMenu.setAttribute("aria-hidden", String(open));
  mobileMenu.classList.toggle("open", !open);
  document.body.classList.toggle("menu-open", !open);
});

mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileMenu.classList.remove("open");
    document.body.classList.remove("menu-open");
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

const activityButtons = [...document.querySelectorAll(".activity-item")];
const activityStage = document.querySelector(".exhibit-stage");
const activityImage = document.querySelector("[data-activity-image] img");
const activityNumber = document.querySelector("[data-activity-number]");
const activityKey = document.querySelector("[data-activity-key]");

activityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList.contains("active")) return;
    activityButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activityStage.classList.add("changing");

    const update = () => {
      activityImage.src = button.dataset.image;
      activityImage.alt = button.dataset.alt;
      activityNumber.textContent = button.querySelector(":scope > span").textContent;
      activityKey.textContent = button.querySelector("strong").textContent;
      activityImage.onload = () => activityStage.classList.remove("changing");
    };

    reducedMotion ? update() : window.setTimeout(update, 180);
  });
});

if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  const object = document.querySelector("[data-parallax]");
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 18;
    const y = (event.clientY / window.innerHeight - 0.5) * 14;
    object.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${7 + x * 0.08}deg)`;
  }, { passive: true });
}
