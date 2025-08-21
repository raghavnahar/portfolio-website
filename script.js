// ============ Helpers ============
const $ = (s, scope = document) => scope.querySelector(s);
const $$ = (s, scope = document) => Array.from(scope.querySelectorAll(s));

// Year in footer
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Elements
const header = $(".site-header");
const burger = $("#burger");
const drawer = $("#navDrawer");
const scrim = $("#scrim");
const navLinksDesktop = $("#navLinks");

// ============ Drawer (Mobile Menu) ============
function openDrawer() {
  drawer.classList.add("open");
  scrim.classList.add("show");
  burger.classList.add("active");
  burger.setAttribute("aria-expanded", "true");
  drawer.setAttribute("aria-hidden", "false");
}
function closeDrawer() {
  drawer.classList.remove("open");
  scrim.classList.remove("show");
  burger.classList.remove("active");
  burger.setAttribute("aria-expanded", "false");
  drawer.setAttribute("aria-hidden", "true");
}

if (burger && drawer && scrim) {
  burger.addEventListener("click", () => {
    drawer.classList.contains("open") ? closeDrawer() : openDrawer();
  });
  scrim.addEventListener("click", closeDrawer);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
  });
  // Close drawer on link click
  $$(".drawer-link", drawer).forEach(a => a.addEventListener("click", closeDrawer));
}

// ============ Smooth Scroll (with header offset) ============
function initSmoothScrolling() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const headerHeight = document.getElementById('header').offsetHeight;
        const targetPosition = targetSection.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}


// Ensure footer “to top” always works even if something intercepts
const toTop = $("#toTop");
if (toTop) {
  toTop.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ============ Active Link Highlight on Scroll ============
const sections = ["#about", "#experience", "#projects", "#certs", "#contact"]
  .map(id => document.querySelector(id))
  .filter(Boolean);

if (sections.length && navLinksDesktop) {
  const options = { root: null, rootMargin: "0px 0px -55% 0px", threshold: 0 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = "#" + entry.target.id;
      const linkDesktop = navLinksDesktop.querySelector(`a[href='${id}']`);
      if (entry.isIntersecting) {
        $$(".nav-links a").forEach(l => l.classList.remove("active"));
        if (linkDesktop) linkDesktop.classList.add("active");
      }
    });
  }, options);
  sections.forEach(s => observer.observe(s));
}

// ============ Header shadow on scroll ============
let last = 0;
window.addEventListener("scroll", () => {
  const y = window.scrollY || window.pageYOffset;
  if (y > 8 && last <= 8) header && header.classList.add("scrolled");
  if (y <= 8 && last > 8) header && header.classList.remove("scrolled");
  last = y;
});

// ============ Reveal on scroll ============
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

$$(".reveal").forEach(el => revealObserver.observe(el));

/* =========================================================
   Subtle 3D Background — rotating “constellation orb”
   Lightweight canvas animation (no external libs)
   ========================================================= */
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

// Pick CSS variables for star/line colors (uses your chosen --primary / --accent)
const css = getComputedStyle(document.documentElement);
const PRIMARY = (css.getPropertyValue('--primary') || '#5b8def').trim();
const ACCENT = (css.getPropertyValue('--accent') || '#b7a6ff').trim();

// tiny helper: hex -> rgba
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '').trim();
  const b = h.length === 3
    ? h.split('').map(c => parseInt(c + c, 16))
    : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map(x => parseInt(x, 16));
  return `rgba(${b[0]}, ${b[1]}, ${b[2]}, ${alpha})`;
}
const STAR_COLOR = hexToRgba(ACCENT, 0.65); // dots
const LINE_COLOR = hexToRgba(PRIMARY, 0.18); // star-star lines
const MOUSE_LINE_COLOR = hexToRgba(PRIMARY, 0.35); // mouse-star line


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = [];
let mouse = { x: null, y: null, radius: 150 };

// star class
class Star {
  constructor(x, y, dx, dy, radius) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radius = radius;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = STAR_COLOR;
    ctx.fill();
  }

  update() {
    if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
      this.dx = -this.dx;
    }
    if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
      this.dy = -this.dy;
    }
    this.x += this.dx;
    this.y += this.dy;

    // connect stars
    for (let i = 0; i < stars.length; i++) {
      let dist = Math.hypot(this.x - stars[i].x, this.y - stars[i].y);
      if (dist < 120) {
        ctx.beginPath();
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 1;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(stars[i].x, stars[i].y);
        ctx.stroke();
        ctx.closePath();
      }
    }

    // connect with mouse
    let distToMouse = Math.hypot(this.x - mouse.x, this.y - mouse.y);
    if (distToMouse < mouse.radius) {
      ctx.beginPath();
      ctx.strokeStyle = MOUSE_LINE_COLOR;
      ctx.lineWidth = 1;
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.stroke();
      ctx.closePath();
    }

    this.draw();
  }
}

// create stars
function initStars() {
  stars = [];
  let starCount = (canvas.width * canvas.height) / 15000;
  for (let i = 0; i < starCount; i++) {
    let radius = Math.random() * 1.5;
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    let dx = (Math.random() - 0.5) * 0.5;
    let dy = (Math.random() - 0.5) * 0.5;
    stars.push(new Star(x, y, dx, dy, radius));
  }
}

// animate now
function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < stars.length; i++) {
    stars[i].update();
  }
}

// event listeners
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initStars();
});

window.addEventListener("mousemove", (e) => {
  mouse.x = e.x;
  mouse.y = e.y;
});

initStars();
animate();

// party  popper effect 
// Attach confetti effect on hover
document.querySelectorAll('.confetti-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  });
});

// script for contact 
document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault(); // prevent page refresh

  // Show popup
  document.getElementById("popup").style.display = "flex";
});

document.getElementById("closePopup").addEventListener("click", function () {
  document.getElementById("popup").style.display = "none";
});


// preloader script begin

// Simple RN particle preloader with progress bar
window.addEventListener("load", () => {
  const canvas = document.getElementById("preloaderCanvas");
  const ctx = canvas.getContext("2d");
  const width = canvas.width = 300;
  const height = canvas.height = 300;

  const particles = [];
  const logoText = "RN";

  ctx.font = "bold 120px Inter";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Draw text and get pixel data
  ctx.fillText(logoText, width / 2, height / 2);
  const imageData = ctx.getImageData(0, 0, width, height);
  ctx.clearRect(0, 0, width, height);

  // Create particles from text pixels
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const index = (y * width + x) * 4 + 3;
      if (imageData.data[index] > 128) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          tx: x,
          ty: y,
          vx: 0,
          vy: 0,
          size: 2
        });
      }
    }
  }

  const loadingBar = document.getElementById("loadingBar");
  const loadingPercent = document.getElementById("loadingPercent");
  let progress = 0;

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      p.vx += dx * 0.1;
      p.vy += dy * 0.1;
      p.vx *= 0.8;
      p.vy *= 0.8;
      p.x += p.vx;
      p.y += p.vy;

      ctx.fillStyle = "#7973e0";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  animate();

  // Simulate loading progress
  const loadingInterval = setInterval(() => {
    progress += 1;
    if (progress > 100) progress = 100;
    loadingBar.style.width = progress + "%";
    loadingPercent.textContent = progress + "%";

    if (progress === 100) {
      clearInterval(loadingInterval);
      const preloader = document.getElementById("preloader");
      preloader.style.transition = "opacity 1s ease";
      preloader.style.opacity = "0";
      setTimeout(() => preloader.style.display = "none", 1000);
    }
  }, 20); // total ~2 seconds
});


// preloader script end 
// Scroll reveal for hero elements
document.addEventListener('DOMContentLoaded', () => {
  const reveals = document.querySelectorAll('.reveal');

  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    reveals.forEach(el => {
      const elTop = el.getBoundingClientRect().top;
      if (elTop < windowHeight - 100) {
        el.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // trigger on page load
});

// Optional: emoji follow mouse
const emojis = document.querySelectorAll('.emoji');
document.addEventListener('mousemove', (e) => {
  const { clientX: x, clientY: y } = e;
  emojis.forEach((emoji, i) => {
    emoji.style.transform = `translate(${x * (0.01 * (i + 1))}px, ${y * (0.01 * (i + 1))}px)`;
  });
});

