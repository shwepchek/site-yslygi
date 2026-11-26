const menuButton = document.getElementById("menuButton");
const nav = document.getElementById("nav");

menuButton.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuButton.classList.toggle("open", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Открыть меню");
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 3, 2) * 80}ms`;
  observer.observe(element);
});

const form = document.getElementById("briefForm");
const status = document.getElementById("formStatus");
const submitButton = form.querySelector(".submit-button");
const packageSelect = form.elements.package;

const BRIEF_ENDPOINT = "";

document.querySelectorAll("[data-package]").forEach((link) => {
  link.addEventListener("click", () => {
    packageSelect.value = link.dataset.package;
  });
});

form.querySelectorAll("[required]").forEach((field) => {
  field.addEventListener("input", () => field.classList.remove("invalid"));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const requiredFields = [...form.querySelectorAll("[required]")];
  const invalidFields = requiredFields.filter((field) => !field.value.trim());
  requiredFields.forEach((field) => field.classList.toggle("invalid", !field.value.trim()));
  if (invalidFields.length) {
    status.style.color = "#bf3048";
    status.textContent = "Заполните имя и контакт.";
    invalidFields[0].focus();
    return;
  }

  if (!BRIEF_ENDPOINT) {
    status.style.color = "#bf3048";
    status.textContent = "Отправка заявок ещё не настроена. Попробуйте позже.";
    return;
  }

  const data = new FormData(form);
  const brief = {
    name: data.get("name").trim(),
    contact: data.get("contact").trim(),
    package: data.get("package"),
    budget: data.get("budget"),
    message: data.get("message").trim()
  };

  submitButton.disabled = true;
  status.style.color = "#5e5d58";
  status.textContent = "Отправляем бриф в Telegram...";

  try {
    const response = await fetch(BRIEF_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brief)
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error("Brief delivery failed");
    status.style.color = "#27824b";
    status.textContent = "Готово! Бриф отправлен.";
    form.reset();
  } catch (error) {
    console.error("Не удалось отправить бриф:", error);
    status.style.color = "#bf3048";
    status.textContent = "Не удалось отправить бриф. Попробуйте ещё раз позже.";
  } finally {
    submitButton.disabled = false;
  }
});
