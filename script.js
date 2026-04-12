/* ============================================================
   PORTFOLIO — script.js
   - i18n (EN / PT)
   - Dark mode toggle
   - Mobile menu toggle
   - Scroll reveal for project cards
   - Smooth scroll for nav links
   - Contact form handler (Formspree-ready)
   - Dynamic year in footer
   ============================================================ */

// ── TRANSLATIONS ────────────────────────────────────────────
const translations = {
  en: {
    "nav-about": "About",
    "nav-skills": "Skills",
    "nav-projects": "Projects",
    "nav-contact": "Contact",
    "hero-badge": "Available for work",
    "hero-hi": "Hi, I'm",
    "hero-role": "Front-End Developer",
    "hero-desc": "I create modern, responsive and high-quality web interfaces with clean code and great user experience.",
    "hero-btn": "See my work",
    "hero-btn2": "Get in touch",
    "about-label": "About me",
    "about-title": "Passionate about building things for the web",
    "about-text": "I am passionate about technology and web development. I enjoy transforming ideas into real projects using HTML, CSS and JavaScript, always focusing on performance, accessibility and design. Currently studying Software Engineering and constantly evolving as a developer.",
    "stat-projects": "Projects",
    "stat-techs": "Technologies",
    "stat-passion": "Passion",
    "skills-label": "What I work with",
    "skills-title": "Skills",
    "projects-label": "What I've built",
    "projects-title": "My Projects",
    "view-project": "View Project",
    "desc-android": "Educational page about the history of the Android operating system, with rich visual content.",
    "desc-cordel": "A tribute to Brazilian Cordel literature with a creative and typographic layout.",
    "desc-hambur": "Landing page for a burger restaurant with premium visual design and mobile-first approach.",
    "desc-solar": "Institutional landing page for a solar energy company, focused on clean design and clarity.",
    "desc-cafe": "Website for a coffee shop with a warm atmosphere, structured layout and menu presentation.",
    "desc-jogo": "Classic Tic-Tac-Toe game built with pure JavaScript, featuring win detection and score tracking.",
    "contact-label": "Let's talk",
    "contact-title": "Get in touch",
    "contact-desc": "Have a project in mind or just want to say hi? My inbox is always open.",
    "label-name": "Your name",
    "label-email": "Your email",
    "label-message": "Your message",
    "contact-btn": "Send Message",
    "footer-text": "Designed & built by",
  },
  pt: {
    "nav-about": "Sobre",
    "nav-skills": "Habilidades",
    "nav-projects": "Projetos",
    "nav-contact": "Contato",
    "hero-badge": "Disponível para trabalhar",
    "hero-hi": "Olá, eu sou",
    "hero-role": "Desenvolvedora Front-End",
    "hero-desc": "Crio interfaces web modernas, responsivas e de alta qualidade com código limpo e ótima experiência do usuário.",
    "hero-btn": "Ver meus projetos",
    "hero-btn2": "Entrar em contato",
    "about-label": "Sobre mim",
    "about-title": "Apaixonada por criar coisas para a web",
    "about-text": "Sou apaixonada por tecnologia e desenvolvimento web. Gosto de transformar ideias em projetos reais usando HTML, CSS e JavaScript, sempre focando em performance, acessibilidade e design. Curso Engenharia de Software e estou em constante evolução como desenvolvedora.",
    "stat-projects": "Projetos",
    "stat-techs": "Tecnologias",
    "stat-passion": "Paixão",
    "skills-label": "Com o que trabalho",
    "skills-title": "Habilidades",
    "projects-label": "O que já construí",
    "projects-title": "Meus Projetos",
    "view-project": "Ver Projeto",
    "desc-android": "Página educativa sobre a história do sistema operacional Android, com conteúdo visual rico.",
    "desc-cordel": "Uma homenagem à literatura de cordel brasileira com layout criativo e tipográfico.",
    "desc-hambur": "Landing page para uma hamburgueria com design visual premium e abordagem mobile-first.",
    "desc-solar": "Landing page institucional para uma empresa de energia solar, focada em design limpo e clareza.",
    "desc-cafe": "Site para uma cafeteria com atmosfera aconchegante, layout estruturado e apresentação do menu.",
    "desc-jogo": "Jogo da Velha clássico desenvolvido com JavaScript puro, com detecção de vitória e placar.",
    "contact-label": "Vamos conversar",
    "contact-title": "Entre em contato",
    "contact-desc": "Tem um projeto em mente ou quer apenas dizer oi? Minha caixa de entrada está sempre aberta.",
    "label-name": "Seu nome",
    "label-email": "Seu e-mail",
    "label-message": "Sua mensagem",
    "contact-btn": "Enviar mensagem",
    "footer-text": "Desenvolvido por",
  }
};

//  STATE ────────────────────────────────────────────────────
let currentLang = "en";

// LANGUAGE TOGGLE ─────────────────────────────────────────
function toggleLanguage() {
  currentLang = currentLang === "en" ? "pt" : "en";
  const btn = document.getElementById("lang-btn");
  btn.textContent = currentLang === "en" ? "PT" : "EN";
  applyTranslations();
}

function applyTranslations() {
  const t = translations[currentLang];
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (!t[key]) return;

    // Special case: footer "Designed & built by" needs to keep the <strong> tag
    if (key === "footer-text") {
      const strong = el.querySelector("strong");
      if (strong) {
        el.childNodes[0].textContent = t[key] + " ";
        return;
      }
    }

    // For inputs/textareas used as placeholders (handled via floating label)
    const tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") {
      el.setAttribute("placeholder", " "); // keep placeholder blank for floating label
      return;
    }

    el.textContent = t[key];
  });

  // Update placeholders separately via label data-i18n
  // (labels already translated above — floating label handles display)
  document.documentElement.lang = currentLang;
}

// ── DARK MODE ────────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "" : "dark");
  document.querySelector(".theme-icon").textContent = isDark ? "🌙" : "☀️";
  localStorage.setItem("theme", isDark ? "light" : "dark");
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.querySelector(".theme-icon").textContent = "☀️";
  }
}

// ── MOBILE MENU ──────────────────────────────────────────────
function toggleMenu() {
  document.getElementById("mobile-menu").classList.toggle("open");
}

// ── SCROLL REVEAL ────────────────────────────────────────────
function initScrollReveal() {
  const cards = document.querySelectorAll(".project.reveal");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Staggered delay based on position
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, i * 100);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  cards.forEach(card => observer.observe(card));
}

// ── SMOOTH SCROLL ────────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// ── HEADER SHADOW ON SCROLL ──────────────────────────────────
function initHeaderScroll() {
  const header = document.getElementById("header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 10) {
      header.style.boxShadow = "0 2px 20px rgba(0,0,0,0.08)";
    } else {
      header.style.boxShadow = "none";
    }
  });
}

// ── CONTACT FORM ─────────────────────────────────────────────
// To make the form actually send emails, sign up at https://formspree.io
// and replace YOUR_FORM_ID below with your real ID.
// Example: https://formspree.io/f/xpwzgkjq
const FORMSPREE_ID = "xvzdpdbp";

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("contact-btn");
  const feedback = document.getElementById("form-feedback");
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) return;

  btn.disabled = true;
  btn.querySelector("span").textContent = currentLang === "en" ? "Sending…" : "Enviando…";
  feedback.textContent = "";

  // If Formspree is not configured, simulate success
  if (FORMSPREE_ID === "YOUR_FORM_ID") {
    await new Promise(r => setTimeout(r, 1000));
    feedback.textContent = currentLang === "en"
      ? "✓ Message sent! (Configure Formspree to enable real sending)"
      : "✓ Mensagem enviada! (Configure o Formspree para envio real)";
    document.getElementById("contact-form").reset();
    btn.disabled = false;
    btn.querySelector("span").textContent = translations[currentLang]["contact-btn"];
    return;
  }

  try {
    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    if (res.ok) {
      feedback.textContent = currentLang === "en" ? "✓ Message sent! I'll get back to you soon." : "✓ Mensagem enviada! Retornarei em breve.";
      document.getElementById("contact-form").reset();
    } else {
      throw new Error();
    }
  } catch {
    feedback.style.color = "#e53e3e";
    feedback.textContent = currentLang === "en" ? "Something went wrong. Try emailing directly." : "Algo deu errado. Tente enviar por e-mail diretamente.";
  } finally {
    btn.disabled = false;
    btn.querySelector("span").textContent = translations[currentLang]["contact-btn"];
  }
}

// ── FOOTER YEAR ──────────────────────────────────────────────
function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initScrollReveal();
  initSmoothScroll();
  initHeaderScroll();
  setYear();
});