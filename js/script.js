// ============================================================
// SCRIPT.JS – Dark Mode, Mobile Menu, Animations, etc.
// ============================================================

// ---------- DARK MODE TOGGLE (now in navbar) ----------
const themeToggle = document.getElementById('theme-toggle-nav');
const body = document.body;
let sunIcon, moonIcon;

if (themeToggle) {
    sunIcon = themeToggle.querySelector('.bx-sun');
    moonIcon = themeToggle.querySelector('.bx-moon');

    // Load saved preference
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'inline-block';
    } else {
        if (sunIcon) sunIcon.style.display = 'inline-block';
        if (moonIcon) moonIcon.style.display = 'none';
    }

    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent menu from closing if inside mobile nav
        body.classList.toggle('dark');
        const isDark = body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = isDark ? 'none' : 'inline-block';
            moonIcon.style.display = isDark ? 'inline-block' : 'none';
        }
    });
}

// ---------- MOBILE MENU TOGGLE ----------
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

// ---------- ACTIVE NAV LINK ON SCROLL ----------
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
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}
window.addEventListener('scroll', updateActiveLink);
window.addEventListener('load', updateActiveLink);

// ---------- SMOOTH SCROLL & CLOSE MOBILE MENU ----------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId === '') return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // close mobile menu
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

// ---------- SCROLL REVEAL (Intersection Observer) ----------
const revealElements = document.querySelectorAll(
    '.skill-card, .service-card, .portfolio-card, .blog-card, .about-grid, .hero-content, .highlight-card, .section-header'
);

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0px)';
            }
        });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
);

revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1), transform 0.6s ease';
    observer.observe(el);
});

// ---------- CONTACT FORM FEEDBACK ----------
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function () {
        const btn = contactForm.querySelector('button[type="submit"]');
        const original = btn.innerHTML;
        btn.innerHTML = 'Sending... <i class="bx bx-loader-alt bx-spin"></i>';
        setTimeout(() => {
            btn.innerHTML = original;
        }, 1500);
    });
}

// ---------- RESTART PULSE RING ----------
const ring = document.querySelector('.pulse-ring');
if (ring) {
    setInterval(() => {
        ring.style.animation = 'none';
        ring.offsetHeight;
        ring.style.animation = 'pulse 2.5s infinite';
    }, 4500);
}

// ---------- DYNAMIC FOOTER YEAR ----------
const yearSpan = document.querySelector('.footer-copyright');
if (yearSpan) {
    const currentYear = new Date().getFullYear();
    yearSpan.textContent = yearSpan.textContent.replace('2025', currentYear);
}