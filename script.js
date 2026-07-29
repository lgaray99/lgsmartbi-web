const CONFIG = {
    whatsappNumber: "",
    email: "lgaray@lgsmartbi.com",
    linkedinUrl: "https://www.linkedin.com/in/luis-garay99/",
    githubUrl: "https://github.com/Diosnel99",
    siteUrl: "https://lgsmartbi.com"
};

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const emailLinks = document.querySelectorAll("[data-email-link]");
const contactForm = document.querySelector("#contactForm");
const year = document.querySelector("[data-year]");

function buildWhatsAppUrl(message) {
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function buildEmailUrl(subject, body = "") {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (body) params.set("body", body);
    const query = params.toString();

    return `mailto:${CONFIG.email}${query ? `?${query}` : ""}`;
}

function closeMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");
}

function updateHeaderState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
}

function updateActiveSection() {
    const current = [...document.querySelectorAll("main section[id]")]
        .filter((section) => section.getBoundingClientRect().top <= 140)
        .pop();

    if (!current) return;

    navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${current.id}`;
        link.classList.toggle("is-active", isActive);
    });
}

function hydrateContactLinks() {
    emailLinks.forEach((link) => {
        link.href = buildEmailUrl(link.dataset.subject || "Consulta LG Smart BI");
    });

    document.querySelectorAll("[data-social='linkedin']").forEach((link) => {
        link.href = CONFIG.linkedinUrl;
    });

    document.querySelectorAll("[data-social='github']").forEach((link) => {
        link.href = CONFIG.githubUrl;
    });

    document.querySelectorAll("[data-contact='email']").forEach((item) => {
        item.textContent = CONFIG.email;
    });

    if (contactForm) {
        contactForm.action = `mailto:${CONFIG.email}`;
    }
}

function setupRevealAnimation() {
    const revealItems = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.14 });

    revealItems.forEach((item) => observer.observe(item));
}

if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });
}

navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");
        const target = targetId ? document.querySelector(targetId) : null;

        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", targetId);
    });
});

if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const name = formData.get("name") || "";
        const company = formData.get("company") || "";
        const email = formData.get("email") || "";
        const message = formData.get("message") || "";

        const text = [
            "Hola, quiero solicitar una consulta con LG Smart BI.",
            `Nombre: ${name}`,
            company ? `Empresa: ${company}` : "",
            `Correo: ${email}`,
            `Mensaje: ${message}`
        ].filter(Boolean).join("\n");

        window.location.href = buildEmailUrl("Consulta LG Smart BI", text);
    });
}

if (year) {
    year.textContent = new Date().getFullYear();
}

hydrateContactLinks();
setupRevealAnimation();
updateHeaderState();
updateActiveSection();

window.addEventListener("scroll", () => {
    updateHeaderState();
    updateActiveSection();
}, { passive: true });
