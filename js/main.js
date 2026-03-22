/* ============================================
   DIGITAL CIRCUIT BACKGROUND
   ============================================ */
(function() {
  var canvas = document.getElementById('particles-canvas');
  var ctx = canvas.getContext('2d');
  var mouse = { x: null, y: null };
  var isMobile = window.innerWidth < 768;
  var MOUSE_RADIUS = 300;
  var GRID = isMobile ? 70 : 50;
  var nodes = [];
  var traces = [];
  var pulses = [];
  var frameCount = 0;
  var MAX_PULSES = isMobile ? 8 : 25;

  // Color
  var CR = 13, CG = 177, CB = 159;
  // Brighter highlight for glow
  var HR = 74, HG = 234, HB = 219;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    buildCircuit();
  }

  function seed(s) {
    var x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function buildCircuit() {
    nodes = [];
    traces = [];

    var cols = Math.ceil(canvas.width / GRID) + 2;
    var rows = Math.ceil(canvas.height / GRID) + 2;
    var grid = {};

    // Place nodes — higher density (~40%)
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var s = r * 1000 + c;
        // More nodes near edges for that border-heavy look
        var edgeBias = (c < 4 || c > cols - 5 || r < 4 || r > rows - 5) ? 0.55 : 0.35;
        if (seed(s) < edgeBias) {
          var node = {
            x: c * GRID,
            y: r * GRID,
            col: c, row: r,
            radius: seed(s + 3) < 0.12 ? 3.5 : seed(s + 3) < 0.3 ? 2.5 : 1.5,
            isJunction: seed(s + 4) < 0.15,
            isChip: seed(s + 4) >= 0.15 && seed(s + 4) < 0.2,
            baseAlpha: 0.25 + seed(s + 5) * 0.25,
            alpha: 0,
            phase: seed(s + 6) * Math.PI * 2
          };
          nodes.push(node);
          grid[r + ',' + c] = node;
        }
      }
    }

    // Build traces — strictly orthogonal (horizontal + vertical)
    var traceSet = {};
    nodes.forEach(function(n) {
      // Connect right (try up to 5 cells away for longer traces)
      for (var dc = 1; dc <= 5; dc++) {
        var nb = grid[n.row + ',' + (n.col + dc)];
        if (nb) {
          var key = n.row + ',' + n.col + '-' + nb.row + ',' + nb.col;
          if (!traceSet[key]) {
            traces.push({ from: n, to: nb, horizontal: true });
            traceSet[key] = true;
          }
          break;
        }
      }
      // Connect down
      for (var dr = 1; dr <= 5; dr++) {
        var nb2 = grid[(n.row + dr) + ',' + n.col];
        if (nb2) {
          var key2 = n.row + ',' + n.col + '-' + nb2.row + ',' + nb2.col;
          if (!traceSet[key2]) {
            traces.push({ from: n, to: nb2, horizontal: false });
            traceSet[key2] = true;
          }
          break;
        }
      }
      // Some L-shaped traces for complexity
      if (seed(n.row * 997 + n.col * 113) < 0.12) {
        var cornerCol = n.col + (seed(n.row * 53 + n.col) > 0.5 ? 2 : 3);
        var cornerRow = n.row + (seed(n.col * 71 + n.row) > 0.5 ? 2 : 3);
        var corner = grid[n.row + ',' + cornerCol];
        var end = grid[cornerRow + ',' + cornerCol];
        if (corner && end) {
          var lk = n.row + ',' + n.col + '-L-' + cornerRow + ',' + cornerCol;
          if (!traceSet[lk]) {
            traces.push({ from: n, to: { x: cornerCol * GRID, y: n.y }, horizontal: true, isSegment: true });
            traces.push({ from: { x: cornerCol * GRID, y: n.y }, to: end, horizontal: false, isSegment: true });
            traceSet[lk] = true;
          }
        }
      }
    });
  }

  function spawnPulse() {
    if (traces.length === 0) return;
    var trace = traces[Math.floor(Math.random() * traces.length)];
    pulses.push({
      trace: trace,
      progress: 0,
      speed: 0.004 + Math.random() * 0.012,
      reverse: Math.random() > 0.5,
      alpha: 0.6 + Math.random() * 0.4,
      size: 2 + Math.random() * 2.5
    });
  }

  function getTraceAlpha(trace) {
    if (trace.from.alpha !== undefined && trace.to.alpha !== undefined) {
      return (trace.from.alpha + trace.to.alpha) / 2;
    }
    return 0.3;
  }

  function drawTraces() {
    // Draw all traces with glow
    // First pass: outer glow (thicker, more transparent)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    traces.forEach(function(t) {
      var a = getTraceAlpha(t);
      if (a < 0.05) return;

      ctx.beginPath();
      ctx.moveTo(t.from.x, t.from.y);
      ctx.lineTo(t.to.x, t.to.y);

      // Outer glow
      ctx.strokeStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.15) + ')';
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // Second pass: core line (thinner, brighter)
    traces.forEach(function(t) {
      var a = getTraceAlpha(t);
      if (a < 0.05) return;

      ctx.beginPath();
      ctx.moveTo(t.from.x, t.from.y);
      ctx.lineTo(t.to.x, t.to.y);

      // Core bright line
      ctx.strokeStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.5) + ')';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
  }

  function drawNodes() {
    nodes.forEach(function(node) {
      var a = node.alpha;
      if (a < 0.03) return;

      if (node.isChip) {
        // IC chip: small filled rect with glow
        var sz = 10;
        if (!isMobile) {
          ctx.shadowColor = 'rgba(' + HR + ',' + HG + ',' + HB + ',' + (a * 0.5) + ')';
          ctx.shadowBlur = 8;
        }
        ctx.fillStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.3) + ')';
        ctx.fillRect(node.x - sz / 2, node.y - sz / 2, sz, sz);
        ctx.strokeStyle = 'rgba(' + HR + ',' + HG + ',' + HB + ',' + (a * 0.7) + ')';
        ctx.lineWidth = 1;
        ctx.strokeRect(node.x - sz / 2, node.y - sz / 2, sz, sz);
        ctx.shadowBlur = 0;
      } else if (node.isJunction) {
        // Bright junction node with glow ring
        if (!isMobile) {
          ctx.shadowColor = 'rgba(' + HR + ',' + HG + ',' + HB + ',' + (a * 0.6) + ')';
          ctx.shadowBlur = 12;
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + HR + ',' + HG + ',' + HB + ',' + (a * 0.8) + ')';
        ctx.fill();
        ctx.shadowBlur = 0;
        // Outer ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.3) + ')';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else {
        // Small dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.7) + ')';
        ctx.fill();
      }
    });
  }

  function drawPulses() {
    pulses.forEach(function(p) {
      var t = p.reverse ? 1 - p.progress : p.progress;
      var tr = p.trace;
      var px = tr.from.x + (tr.to.x - tr.from.x) * t;
      var py = tr.from.y + (tr.to.y - tr.from.y) * t;

      // Bright glow halo
      var grad = ctx.createRadialGradient(px, py, 0, px, py, p.size * 8);
      grad.addColorStop(0, 'rgba(' + HR + ',' + HG + ',' + HB + ',' + (p.alpha * 0.35) + ')');
      grad.addColorStop(0.4, 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (p.alpha * 0.12) + ')');
      grad.addColorStop(1, 'rgba(' + CR + ',' + CG + ',' + CB + ',0)');
      ctx.beginPath();
      ctx.arc(px, py, p.size * 8, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Bright core
      if (!isMobile) {
        ctx.shadowColor = 'rgba(' + HR + ',' + HG + ',' + HB + ',' + p.alpha + ')';
        ctx.shadowBlur = 15;
      }
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255,' + (p.alpha * 0.9) + ')';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Trail effect — dim line behind pulse
      var trailLen = 0.08;
      var tStart = p.reverse ? Math.min(t + trailLen, 1) : Math.max(t - trailLen, 0);
      var sx = tr.from.x + (tr.to.x - tr.from.x) * tStart;
      var sy = tr.from.y + (tr.to.y - tr.from.y) * tStart;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(px, py);
      ctx.strokeStyle = 'rgba(' + HR + ',' + HG + ',' + HB + ',' + (p.alpha * 0.4) + ')';
      ctx.lineWidth = p.size * 0.8;
      ctx.stroke();
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameCount++;

    // Spawn pulses (throttled on mobile)
    var spawnRate = isMobile ? 25 : 12;
    if (frameCount % spawnRate === 0 && pulses.length < MAX_PULSES) spawnPulse();

    var mouseActive = mouse.x !== null;

    // Update node alphas
    nodes.forEach(function(node) {
      var target = node.baseAlpha;
      target += Math.sin(frameCount * 0.012 + node.phase) * 0.06;

      if (mouseActive) {
        var dx = mouse.x - node.x;
        var dy = mouse.y - node.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          var prox = 1 - dist / MOUSE_RADIUS;
          target = Math.min(target + prox * 0.6, 0.9);
        }
      }

      node.alpha += (target - node.alpha) * 0.05;
    });

    // Update pulses
    for (var i = pulses.length - 1; i >= 0; i--) {
      pulses[i].progress += pulses[i].speed;
      if (pulses[i].progress >= 1) pulses.splice(i, 1);
    }

    // Draw order: traces → nodes → pulses
    drawTraces();
    drawNodes();
    drawPulses();

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', function() {
    isMobile = window.innerWidth < 768;
    GRID = isMobile ? 70 : 50;
    MAX_PULSES = isMobile ? 8 : 25;
    resize();
  });
  window.addEventListener('mousemove', function(e) { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', function() { mouse.x = null; mouse.y = null; });

  // Touch support for mobile
  window.addEventListener('touchmove', function(e) {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });
  window.addEventListener('touchend', function() { mouse.x = null; mouse.y = null; });

  resize();
  animate();
})();

/* ============================================
   CURSOR GLOW (follows mouse)
   ============================================ */
(function() {
  var glow = document.getElementById('cursorGlow');
  if (!glow) return;

  var isTouch = 'ontouchstart' in window;
  if (isTouch) { glow.style.display = 'none'; return; }

  var targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  var active = false;

  document.addEventListener('mousemove', function(e) {
    targetX = e.clientX;
    targetY = e.clientY;
    if (!active) {
      active = true;
      glow.classList.add('active');
    }
  });

  document.addEventListener('mouseleave', function() {
    active = false;
    glow.classList.remove('active');
  });

  function updateGlow() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    glow.style.left = currentX + 'px';
    glow.style.top = currentY + 'px';
    requestAnimationFrame(updateGlow);
  }

  updateGlow();
})();

/* ============================================
   NAVIGATION
   ============================================ */
var nav = document.getElementById('nav');
var navToggle = document.getElementById('navToggle');
var navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', function() {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

navToggle.addEventListener('click', function() {
  navToggle.classList.toggle('active');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(function(link) {
  link.addEventListener('click', function() {
    navToggle.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

/* ============================================
   SCROLL PROGRESS BAR
   ============================================ */
var scrollProgress = document.getElementById('scrollProgress');
window.addEventListener('scroll', function() {
  var scrollTop = window.scrollY;
  var docHeight = document.documentElement.scrollHeight - window.innerHeight;
  var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = progress + '%';
});

/* ============================================
   SCROLL REVEAL
   ============================================ */
var revealElements = document.querySelectorAll('.reveal');
var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

revealElements.forEach(function(el) { revealObserver.observe(el); });

/* ============================================
   SECTION DIVIDER LINES
   ============================================ */
var allSections = document.querySelectorAll('section');
var sectionLineObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('section-visible');
    }
  });
}, { threshold: 0.2 });

allSections.forEach(function(s) { sectionLineObserver.observe(s); });

/* ============================================
   TIMELINE ANIMATION
   ============================================ */
var timelineContainer = document.querySelector('.timeline-container');
if (timelineContainer) {
  var timelineObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('timeline-active');
      }
    });
  }, { threshold: 0.15 });

  timelineObserver.observe(timelineContainer);
}

/* ============================================
   CARD GLOW EFFECT (mouse-follow)
   ============================================ */
(function() {
  var cards = document.querySelectorAll('.expertise-card');

  cards.forEach(function(card) {
    var glowEl = document.createElement('div');
    glowEl.className = 'card-glow';
    card.appendChild(glowEl);

    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      glowEl.style.left = x + 'px';
      glowEl.style.top = y + 'px';
    });
  });
})();

/* ============================================
   3D TILT ON PHOTO
   ============================================ */
var photoFrame = document.getElementById('photoFrame');
if (photoFrame) {
  var photoContainer = photoFrame.closest('.photo-container');

  photoContainer.addEventListener('mousemove', function(e) {
    var rect = photoContainer.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width - 0.5;
    var y = (e.clientY - rect.top) / rect.height - 0.5;
    photoFrame.style.transform = 'perspective(800px) rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 12) + 'deg)';
  });

  photoContainer.addEventListener('mouseleave', function() {
    photoFrame.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
    photoFrame.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
  });

  photoContainer.addEventListener('mouseenter', function() {
    photoFrame.style.transition = 'none';
  });
}

/* ============================================
   SMOOTH ANCHOR SCROLLING
   ============================================ */
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    var href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    var target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ============================================
   ACTIVE NAV LINK HIGHLIGHT
   ============================================ */
var sections = document.querySelectorAll('section[id], footer[id], .hero[id]');
var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

var sectionObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      var id = entry.target.getAttribute('id');
      navAnchors.forEach(function(a) {
        a.style.color = '';
        a.style.background = '';
        if (a.getAttribute('href') === '#' + id) {
          if (!a.classList.contains('nav-cta')) {
            a.style.color = 'var(--primary-light)';
            a.style.background = 'rgba(13, 177, 159, 0.08)';
          }
        }
      });
    }
  });
}, { threshold: 0.3 });

sections.forEach(function(s) { sectionObserver.observe(s); });

/* ============================================
   STAGGERED SKILL TAG ANIMATION
   ============================================ */
(function() {
  var skillCategories = document.querySelectorAll('.skill-category');

  var skillObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var tags = entry.target.querySelectorAll('.skill-tag');
        tags.forEach(function(tag, i) {
          tag.style.opacity = '0';
          tag.style.transform = 'translateY(8px) scale(0.95)';
          tag.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ' + (i * 0.05) + 's';
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              tag.style.opacity = '1';
              tag.style.transform = 'translateY(0) scale(1)';
            });
          });
        });
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  skillCategories.forEach(function(cat) { skillObserver.observe(cat); });
})();

/* ============================================
   MAGNETIC BUTTON EFFECT
   ============================================ */
(function() {
  var buttons = document.querySelectorAll('.btn, .footer-social, .nav-cta');

  buttons.forEach(function(btn) {
    btn.addEventListener('mousemove', function(e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px)';
    });

    btn.addEventListener('mouseleave', function() {
      btn.style.transform = '';
      btn.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    btn.addEventListener('mouseenter', function() {
      btn.style.transition = 'all 0.15s ease';
    });
  });
})();
