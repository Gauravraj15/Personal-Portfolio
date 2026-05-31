// ========== SCRIPT.JS - Dark Mode, Animations, Hover Effects, Mobile Menu ==========

// ----- DARK / LIGHT MODE TOGGLE -----
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const sunIcon = themeToggle?.querySelector('.bx-sun');
const moonIcon = themeToggle?.querySelector('.bx-moon');

// Load saved preference
if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark');
    if (sunIcon) sunIcon.style.display = 'none';
    if (moonIcon) moonIcon.style.display = 'inline-block';
} else {
    if (sunIcon) sunIcon.style.display = 'inline-block';
    if (moonIcon) moonIcon.style.display = 'none';
}

themeToggle?.addEventListener('click', () => {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    if (isDark) {
        localStorage.setItem('theme', 'dark');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'inline-block';
    } else {
        localStorage.setItem('theme', 'light');
        if (sunIcon) sunIcon.style.display = 'inline-block';
        if (moonIcon) moonIcon.style.display = 'none';
    }
});

// ----- MOBILE MENU TOGGLE -----
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        if (navMenu.classList.contains('active')) {
            icon.classList.remove('bx-menu');
            icon.classList.add('bx-x');
        } else {
            icon.classList.remove('bx-x');
            icon.classList.add('bx-menu');
        }
    });
}

// ----- ACTIVE LINK ON SCROLL + SMOOTH SCROLL -----
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveLink() {
    let current = '';
    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
            current = section.getAttribute('id');
        }
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href').substring(1);
        if (href === current) link.classList.add('active');
    });
}

window.addEventListener('scroll', updateActiveLink);
window.addEventListener('load', updateActiveLink);

// Smooth scroll for all internal anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === "#" || targetId === "") return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // close mobile menu after click
            if (navMenu?.classList.contains('active')) {
                navMenu.classList.remove('active');
                const icon = hamburger?.querySelector('i');
                if (icon) {
                    icon.classList.remove('bx-x');
                    icon.classList.add('bx-menu');
                }
            }
        }
    });
});

// ----- SKILL CARDS "GLOAT" HOVER + FLOATING ANIMATION (enhanced with JS class, but CSS handles main effect) -----
// Additional: add small ripple or float effect via JS for extra engagement
const skillCards = document.querySelectorAll('.skill-card');
skillCards.forEach(card => {
    card.addEventListener('mouseenter', (e) => {
        // no extra action, css already does transform scale + shadow
        card.style.transition = 'all 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.2)';
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

// ----- SCROLL REVEAL (Intersection Observer for fade-up) -----
const revealElements = document.querySelectorAll('.skill-card, .service-card, .portfolio-card, .blog-card, .about-grid, .hero-content, .highlight-card, .section-header');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0px)';
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.55s cubic-bezier(0.2, 0.9, 0.4, 1.1), transform 0.55s ease';
    observer.observe(el);
});

// ----- CONTACT FORM SUBMIT FEEDBACK (no interference with Web3Forms) -----
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        const btn = contactForm.querySelector('button[type="submit"]');
        const original = btn.innerHTML;
        btn.innerHTML = 'Sending... <i class="bx bx-loader-alt bx-spin"></i>';
        setTimeout(() => {
            btn.innerHTML = original;
        }, 1500);
        // actual submit goes to web3forms
    });
}

// ----- PULSE RING ANIMATION RESTART (optional) -----
const ring = document.querySelector('.pulse-ring');
if (ring) {
    setInterval(() => {
        ring.style.animation = 'none';
        ring.offsetHeight;
        ring.style.animation = 'pulse 2s infinite';
    }, 4000);
}

// ----- Dynamic footer year update -----
const yearSpan = document.querySelector('.footer-copyright');
if (yearSpan) {
    const currentYear = new Date().getFullYear();
    yearSpan.textContent = yearSpan.textContent.replace('2025', currentYear);
}