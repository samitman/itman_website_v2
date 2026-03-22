/* ============================================
   DIGITAL CIRCUIT BACKGROUND
   Channel-routed PCB traces with clean bends,
   parallel bundles, and no overlapping.
   ============================================ */
(function() {
  var canvas = document.getElementById('particles-canvas');
  var ctx = canvas.getContext('2d');
  var mouse = { x: null, y: null };
  var isMobile = window.innerWidth < 768;
  var MOUSE_RADIUS = 300;
  var routes = [];
  var junctions = [];
  var chips = [];
  var pulses = [];
  var frameCount = 0;
  var MAX_PULSES = isMobile ? 8 : 20;

  // Colors
  var CR = 13, CG = 177, CB = 159;
  var HR = 74, HG = 234, HB = 219;

  // Seeded PRNG
  var _seed = 42;
  function srand(s) { _seed = s; }
  function rand() {
    _seed = (_seed * 16807 + 0) % 2147483647;
    return (_seed - 1) / 2147483646;
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    buildCircuit();
  }

  /* ------------------------------------------
     CHANNEL-BASED TRACE ROUTING
     Traces snap to grid channels and route with
     clean horizontal/vertical segments + 45° chamfered bends.
     ------------------------------------------ */
  function buildCircuit() {
    routes = [];
    junctions = [];
    chips = [];

    var W = canvas.width;
    var H = canvas.height;
    var SPACING = isMobile ? 18 : 14;  // min spacing between parallel traces
    var cx = W / 2, cy = H / 2;        // convergence center

    srand(7919);

    // Occupied channel tracker — prevents traces from sharing segments
    var occupied = {};
    function channelKey(x1, y1, x2, y2) {
      // Normalize direction so A→B and B→A are the same
      if (x1 > x2 || (x1 === x2 && y1 > y2)) {
        var t = x1; x1 = x2; x2 = t;
        t = y1; y1 = y2; y2 = t;
      }
      return Math.round(x1) + ',' + Math.round(y1) + '-' + Math.round(x2) + ',' + Math.round(y2);
    }
    function isOccupied(x1, y1, x2, y2) {
      return !!occupied[channelKey(x1, y1, x2, y2)];
    }
    function markOccupied(x1, y1, x2, y2) {
      occupied[channelKey(x1, y1, x2, y2)] = true;
    }

    // Generate traces from each edge, converging toward center
    // Each trace: start at edge → horizontal/vertical run → 45° chamfer bend → perpendicular run → endpoint
    var numTraces = isMobile ? 30 : 60;
    var chamferSize = isMobile ? 20 : 16;

    for (var i = 0; i < numTraces; i++) {
      var edge = rand();   // which edge to start from
      var points = [];
      var startX, startY, endX, endY;
      var hFirst;          // horizontal-first or vertical-first routing

      if (edge < 0.3) {
        // LEFT edge → route right toward center
        startX = -10;
        startY = Math.round((40 + rand() * (H - 80)) / SPACING) * SPACING;
        endX = cx * (0.3 + rand() * 0.9);
        endY = startY + (rand() - 0.5) * H * 0.5;
        endY = Math.round(endY / SPACING) * SPACING;
        endY = Math.max(40, Math.min(H - 40, endY));
        hFirst = true;
      } else if (edge < 0.6) {
        // RIGHT edge → route left toward center
        startX = W + 10;
        startY = Math.round((40 + rand() * (H - 80)) / SPACING) * SPACING;
        endX = cx * (0.5 + rand() * 1.0);
        endY = startY + (rand() - 0.5) * H * 0.5;
        endY = Math.round(endY / SPACING) * SPACING;
        endY = Math.max(40, Math.min(H - 40, endY));
        hFirst = true;
      } else if (edge < 0.8) {
        // TOP edge → route down toward center
        startX = Math.round((40 + rand() * (W - 80)) / SPACING) * SPACING;
        startY = -10;
        endX = startX + (rand() - 0.5) * W * 0.4;
        endX = Math.round(endX / SPACING) * SPACING;
        endX = Math.max(40, Math.min(W - 40, endX));
        endY = cy * (0.3 + rand() * 0.9);
        hFirst = false;
      } else {
        // BOTTOM edge → route up toward center
        startX = Math.round((40 + rand() * (W - 80)) / SPACING) * SPACING;
        startY = H + 10;
        endX = startX + (rand() - 0.5) * W * 0.4;
        endX = Math.round(endX / SPACING) * SPACING;
        endX = Math.max(40, Math.min(W - 40, endX));
        endY = cy * (0.5 + rand() * 1.0);
        hFirst = false;
      }

      // Snap end coords to grid
      endX = Math.round(endX / SPACING) * SPACING;
      endY = Math.round(endY / SPACING) * SPACING;

      // Build polyline with chamfered 90° bend
      var midX, midY, cham;
      if (hFirst) {
        // Horizontal first → vertical second
        midX = endX;
        midY = startY;
        // Add 45° chamfer at the bend
        cham = Math.min(chamferSize, Math.abs(endX - startX) * 0.3, Math.abs(endY - startY) * 0.3);
        if (cham < 4) cham = 0;
        var dirX = midX > startX ? 1 : -1;
        var dirY = endY > midY ? 1 : -1;
        if (cham > 0 && Math.abs(endX - startX) > cham * 2 && Math.abs(endY - startY) > cham * 2) {
          points = [
            { x: startX, y: startY },
            { x: midX - dirX * cham, y: startY },
            { x: midX, y: startY + dirY * cham },
            { x: midX, y: endY }
          ];
        } else {
          points = [
            { x: startX, y: startY },
            { x: midX, y: startY },
            { x: midX, y: endY }
          ];
        }
      } else {
        // Vertical first → horizontal second
        midX = startX;
        midY = endY;
        cham = Math.min(chamferSize, Math.abs(endY - startY) * 0.3, Math.abs(endX - startX) * 0.3);
        if (cham < 4) cham = 0;
        var dirY2 = midY > startY ? 1 : -1;
        var dirX2 = endX > midX ? 1 : -1;
        if (cham > 0 && Math.abs(endY - startY) > cham * 2 && Math.abs(endX - startX) > cham * 2) {
          points = [
            { x: startX, y: startY },
            { x: startX, y: midY - dirY2 * cham },
            { x: startX + dirX2 * cham, y: midY },
            { x: endX, y: midY }
          ];
        } else {
          points = [
            { x: startX, y: startY },
            { x: startX, y: midY },
            { x: endX, y: midY }
          ];
        }
      }

      // Check if any segment overlaps an existing trace
      var overlaps = false;
      for (var p = 0; p < points.length - 1; p++) {
        if (isOccupied(points[p].x, points[p].y, points[p + 1].x, points[p + 1].y)) {
          overlaps = true;
          break;
        }
      }

      // If overlapping, try offsetting by one channel
      if (overlaps) {
        var offset = SPACING * (rand() > 0.5 ? 1 : -1);
        for (var p = 0; p < points.length; p++) {
          if (hFirst) points[p].y += offset;
          else points[p].x += offset;
        }
        // Re-check
        overlaps = false;
        for (var p = 0; p < points.length - 1; p++) {
          if (isOccupied(points[p].x, points[p].y, points[p + 1].x, points[p + 1].y)) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) continue; // skip this trace entirely
      }

      // Mark segments as occupied
      for (var p = 0; p < points.length - 1; p++) {
        markOccupied(points[p].x, points[p].y, points[p + 1].x, points[p + 1].y);
      }

      // Route properties — subtle alpha variation
      var routeAlpha = 0.12 + rand() * 0.28;
      var routeWidth = 0.7 + rand() * 0.8;

      // Pre-compute segment lengths for pulse animation
      var segs = [];
      var totalLen = 0;
      for (var p = 0; p < points.length - 1; p++) {
        var dx = points[p + 1].x - points[p].x;
        var dy = points[p + 1].y - points[p].y;
        var len = Math.sqrt(dx * dx + dy * dy);
        segs.push({ from: points[p], to: points[p + 1], len: len });
        totalLen += len;
      }

      routes.push({
        points: points,
        segs: segs,
        totalLen: totalLen,
        alpha: routeAlpha,
        width: routeWidth,
        phase: rand() * Math.PI * 2
      });

      // Junction nodes at endpoints and bends (only if on-screen)
      for (var p = 0; p < points.length; p++) {
        var pt = points[p];
        if (pt.x < -30 || pt.x > W + 30 || pt.y < -30 || pt.y > H + 30) continue;
        var isEnd = (p === 0 || p === points.length - 1);
        var jt = rand();
        junctions.push({
          x: pt.x,
          y: pt.y,
          radius: isEnd ? 1.5 : 2 + rand() * 1.5,
          type: isEnd ? 'end' : (jt < 0.4 ? 'glow' : 'dot'),
          baseAlpha: routeAlpha * (isEnd ? 0.7 : 1.1),
          alpha: 0,
          phase: rand() * Math.PI * 2
        });
      }
    }

    // IC chip blocks — small rectangular components placed at some junction clusters
    var numChips = isMobile ? 4 : 10;
    for (var c = 0; c < numChips; c++) {
      var chipX = 80 + rand() * (W - 160);
      var chipY = 80 + rand() * (H - 160);
      chipX = Math.round(chipX / SPACING) * SPACING;
      chipY = Math.round(chipY / SPACING) * SPACING;
      var chipW = 2 + Math.floor(rand() * 3); // in grid cells
      var chipH = 2 + Math.floor(rand() * 3);
      chips.push({
        x: chipX,
        y: chipY,
        w: chipW * SPACING,
        h: chipH * SPACING,
        baseAlpha: 0.15 + rand() * 0.2,
        alpha: 0,
        phase: rand() * Math.PI * 2,
        pins: chipW + chipH // number of pin dots
      });
    }
  }

  /* ------------------------------------------
     PULSE SPAWNING & POSITION
     ------------------------------------------ */
  function spawnPulse() {
    if (routes.length === 0) return;
    var route = routes[Math.floor(Math.random() * routes.length)];
    if (route.totalLen < 30) return;

    pulses.push({
      route: route,
      progress: 0,
      // Slower, calmer speed range: 0.001 – 0.003
      speed: (0.001 + Math.random() * 0.002) * (isMobile ? 0.8 : 1),
      reverse: Math.random() > 0.5,
      alpha: 0.5 + Math.random() * 0.35,
      size: 1.5 + Math.random() * 1.5
    });
  }

  function getPulsePos(route, t) {
    var dist = t * route.totalLen;
    var acc = 0;
    var segs = route.segs;
    for (var i = 0; i < segs.length; i++) {
      if (acc + segs[i].len >= dist || i === segs.length - 1) {
        var local = segs[i].len > 0 ? (dist - acc) / segs[i].len : 0;
        local = Math.max(0, Math.min(1, local));
        return {
          x: segs[i].from.x + (segs[i].to.x - segs[i].from.x) * local,
          y: segs[i].from.y + (segs[i].to.y - segs[i].from.y) * local
        };
      }
      acc += segs[i].len;
    }
    var last = segs[segs.length - 1];
    return { x: last.to.x, y: last.to.y };
  }

  /* ------------------------------------------
     DRAWING
     ------------------------------------------ */
  function drawRoutes() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    var mouseActive = mouse.x !== null;

    routes.forEach(function(route) {
      if (route.points.length < 2) return;

      // Mouse proximity boost
      var proxBoost = 0;
      if (mouseActive) {
        for (var i = 0; i < route.points.length; i++) {
          var dx = mouse.x - route.points[i].x;
          var dy = mouse.y - route.points[i].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < MOUSE_RADIUS) {
            var p = 1 - d / MOUSE_RADIUS;
            if (p > proxBoost) proxBoost = p;
          }
        }
      }

      var a = route.alpha + Math.sin(frameCount * 0.006 + route.phase) * 0.03;
      a = Math.min(a + proxBoost * 0.35, 0.75);

      // Outer glow
      ctx.beginPath();
      ctx.moveTo(route.points[0].x, route.points[0].y);
      for (var i = 1; i < route.points.length; i++) {
        ctx.lineTo(route.points[i].x, route.points[i].y);
      }
      ctx.strokeStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.1) + ')';
      ctx.lineWidth = route.width + 3.5;
      ctx.stroke();

      // Core trace
      ctx.beginPath();
      ctx.moveTo(route.points[0].x, route.points[0].y);
      for (var i = 1; i < route.points.length; i++) {
        ctx.lineTo(route.points[i].x, route.points[i].y);
      }
      ctx.strokeStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.5) + ')';
      ctx.lineWidth = route.width;
      ctx.stroke();
    });
  }

  function drawJunctions() {
    junctions.forEach(function(j) {
      var a = j.alpha;
      if (a < 0.03) return;

      if (j.type === 'glow') {
        if (!isMobile) {
          ctx.shadowColor = 'rgba(' + HR + ',' + HG + ',' + HB + ',' + (a * 0.4) + ')';
          ctx.shadowBlur = 8;
        }
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + HR + ',' + HG + ',' + HB + ',' + (a * 0.7) + ')';
        ctx.fill();
        ctx.shadowBlur = 0;
        // Ring
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.radius + 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.2) + ')';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else if (j.type === 'end') {
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.6) + ')';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.45) + ')';
        ctx.fill();
      }
    });
  }

  function drawChips() {
    chips.forEach(function(chip) {
      var a = chip.alpha;
      if (a < 0.03) return;

      // Chip body
      ctx.fillStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.08) + ')';
      ctx.fillRect(chip.x, chip.y, chip.w, chip.h);
      ctx.strokeStyle = 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (a * 0.3) + ')';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(chip.x, chip.y, chip.w, chip.h);

      // Internal grid dots (like pin pads)
      var dotSpacing = Math.min(chip.w, chip.h) / (chip.pins > 4 ? 3 : 2);
      for (var dx = dotSpacing; dx < chip.w; dx += dotSpacing) {
        for (var dy = dotSpacing; dy < chip.h; dy += dotSpacing) {
          ctx.beginPath();
          ctx.arc(chip.x + dx, chip.y + dy, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + HR + ',' + HG + ',' + HB + ',' + (a * 0.5) + ')';
          ctx.fill();
        }
      }
    });
  }

  function drawPulses() {
    pulses.forEach(function(p) {
      var t = p.reverse ? 1 - p.progress : p.progress;
      var pos = getPulsePos(p.route, t);

      // Glow halo
      var grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size * 7);
      grad.addColorStop(0, 'rgba(' + HR + ',' + HG + ',' + HB + ',' + (p.alpha * 0.25) + ')');
      grad.addColorStop(0.4, 'rgba(' + CR + ',' + CG + ',' + CB + ',' + (p.alpha * 0.08) + ')');
      grad.addColorStop(1, 'rgba(' + CR + ',' + CG + ',' + CB + ',0)');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 7, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core dot
      if (!isMobile) {
        ctx.shadowColor = 'rgba(' + HR + ',' + HG + ',' + HB + ',' + p.alpha + ')';
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255,' + (p.alpha * 0.8) + ')';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Trail
      var trailT = p.reverse ? Math.min(t + 0.025, 1) : Math.max(t - 0.025, 0);
      var trailPos = getPulsePos(p.route, trailT);
      ctx.beginPath();
      ctx.moveTo(trailPos.x, trailPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = 'rgba(' + HR + ',' + HG + ',' + HB + ',' + (p.alpha * 0.3) + ')';
      ctx.lineWidth = p.size * 0.6;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
  }

  /* ------------------------------------------
     ANIMATION LOOP
     ------------------------------------------ */
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameCount++;

    var spawnRate = isMobile ? 30 : 15;
    if (frameCount % spawnRate === 0 && pulses.length < MAX_PULSES) spawnPulse();

    var mouseActive = mouse.x !== null;

    // Update junction alphas
    junctions.forEach(function(j) {
      var target = j.baseAlpha + Math.sin(frameCount * 0.008 + j.phase) * 0.05;
      if (mouseActive) {
        var dx = mouse.x - j.x, dy = mouse.y - j.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          target = Math.min(target + (1 - dist / MOUSE_RADIUS) * 0.5, 0.8);
        }
      }
      j.alpha += (target - j.alpha) * 0.05;
    });

    // Update chip alphas
    chips.forEach(function(chip) {
      var target = chip.baseAlpha + Math.sin(frameCount * 0.006 + chip.phase) * 0.04;
      if (mouseActive) {
        var dx = mouse.x - (chip.x + chip.w / 2);
        var dy = mouse.y - (chip.y + chip.h / 2);
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          target = Math.min(target + (1 - dist / MOUSE_RADIUS) * 0.4, 0.7);
        }
      }
      chip.alpha += (target - chip.alpha) * 0.05;
    });

    // Update pulses
    for (var i = pulses.length - 1; i >= 0; i--) {
      pulses[i].progress += pulses[i].speed;
      if (pulses[i].progress >= 1) pulses.splice(i, 1);
    }

    drawRoutes();
    drawChips();
    drawJunctions();
    drawPulses();

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', function() {
    isMobile = window.innerWidth < 768;
    MAX_PULSES = isMobile ? 8 : 20;
    resize();
  });
  window.addEventListener('mousemove', function(e) { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', function() { mouse.x = null; mouse.y = null; });

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
