/* CURSOR */
const cursorDot  = document.getElementById('cursor-dot');
const cursorGlow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', e => {
  cursorDot.style.left  = cursorGlow.style.left = e.clientX + 'px';
  cursorDot.style.top   = cursorGlow.style.top  = e.clientY + 'px';
});

/* DOT GRID: the brighter patch follows the cursor (dots themselves are pure CSS) */
const dotGrid = document.getElementById('dot-grid');
document.addEventListener('mousemove', e => {
  dotGrid.style.setProperty('--mx', e.clientX + 'px');
  dotGrid.style.setProperty('--my', e.clientY + 'px');
});

/* HERO NAMES: shrink the type until the (longer) last name clears the logo */
function fitHeroNames() {
  const row = document.querySelector('.hero-names');
  if (!row) return;
  if (window.innerWidth <= 768) { row.style.fontSize = ''; return; }   /* stacked layout, CSS handles it */
  const last = row.querySelector('.hero-last'), logo = row.querySelector('.hero-logo');
  const gap = parseFloat(getComputedStyle(row).columnGap) || 24;
  row.style.fontSize = '100px';
  const range = document.createRange();
  range.selectNodeContents(last);
  const w100 = range.getBoundingClientRect().width;
  const avail = (row.clientWidth - logo.offsetWidth) / 2 - gap;
  const size = Math.max(32, Math.min(96, (100 * avail) / w100));
  row.style.fontSize = size + 'px';
}
fitHeroNames();
window.addEventListener('resize', fitHeroNames);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeroNames);

/* HERO ORB — glows and grows the longer the cursor stays still */
const heroCanvas = document.getElementById('waveform-canvas');
const hctx = heroCanvas.getContext('2d');
let hmx = 0.5, hmy = 0.5, lastMx = 0.5, lastMy = 0.5, stillTime = 0, orbSize = 0;
function resizeHero() {
  const hero = document.getElementById('hero');
  heroCanvas.width = hero.offsetWidth;
  heroCanvas.height = hero.offsetHeight;
}
resizeHero();
window.addEventListener('resize', resizeHero);
window.addEventListener('load', resizeHero);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(resizeHero);
document.getElementById('hero').addEventListener('mousemove', e => {
  const rect = e.currentTarget.getBoundingClientRect();
  hmx = (e.clientX - rect.left) / rect.width;
  hmy = (e.clientY - rect.top) / rect.height;
});
function drawHeroWave() {
  const W = heroCanvas.width, H = heroCanvas.height;
  hctx.clearRect(0, 0, W, H);
  const moved = Math.hypot(hmx - lastMx, hmy - lastMy) > 0.0008;
  if (moved) { stillTime = 0; } else { stillTime += 1; }
  lastMx = hmx; lastMy = hmy;
  const targetSize = Math.min(40 + stillTime * 0.9, 260);
  orbSize += (targetSize - orbSize) * 0.08;
  const cx = hmx * W, cy = hmy * H;
  const pulse = 1 + Math.sin(stillTime * 0.05) * 0.04;
  const r = orbSize * pulse;
  const grad = hctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, 'rgba(34,197,94,0.45)');
  grad.addColorStop(0.4, 'rgba(34,197,94,0.18)');
  grad.addColorStop(0.75, 'rgba(196,176,187,0.08)');
  grad.addColorStop(1, 'rgba(196,176,187,0)');
  hctx.fillStyle = grad;
  hctx.beginPath();
  hctx.arc(cx, cy, r, 0, Math.PI * 2);
  hctx.fill();
  requestAnimationFrame(drawHeroWave);
}
drawHeroWave();

/* SCROLL REVEAL */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), i * 60); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* PIANO AUDIO */
let actx = null;
function getAudioCtx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function playNote(freq) {
  const ctx = getAudioCtx(), now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.55, now+.01);
  master.gain.exponentialRampToValueAtTime(0.35, now+.08);
  master.gain.exponentialRampToValueAtTime(0.001, now+1.6);
  master.connect(ctx.destination);
  const delay = ctx.createDelay(0.4); delay.delayTime.value = 0.22;
  const dGain = ctx.createGain(); dGain.gain.value = 0.18;
  delay.connect(dGain); dGain.connect(delay); delay.connect(master);
  [[freq,'triangle',1],[freq*2,'sine',.15],[freq*3,'sine',.06]].forEach(([f,t,g]) => {
    const osc = ctx.createOscillator(); osc.type = t; osc.frequency.value = f;
    const og = ctx.createGain(); og.gain.value = g;
    osc.connect(og); og.connect(master); osc.start(now); osc.stop(now+1.8);
  });
}

/* PIANO KEYS + SECTION SPY */
const keys = document.querySelectorAll('.piano-key');
keys.forEach(key => {
  key.addEventListener('click', e => {
    e.preventDefault();
    const freq = parseFloat(key.dataset.note);
    if (freq) playNote(freq);
    key.classList.add('pressing');
    setTimeout(() => key.classList.remove('pressing'), 160);
    checkTwinkle(key.getAttribute('href'));
    document.querySelector(key.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });
});
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      keys.forEach(k => k.classList.remove('active'));
      document.querySelector(`.piano-key[href="#${e.target.id}"]`)?.classList.add('active');
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('section[id]').forEach(s => spy.observe(s));

/* TWINKLE EASTER EGG */
const TWINKLE_SEQ = ['#hero','#hero','#works','#works','#pubcerts','#works'];
let twinkleProgress = 0, twinkleTimer = null;
function checkTwinkle(href) {
  if (href === TWINKLE_SEQ[twinkleProgress]) {
    twinkleProgress++;
    clearTimeout(twinkleTimer);
    if (twinkleProgress === TWINKLE_SEQ.length) { twinkleProgress = 0; launchTwinkle(); return; }
    twinkleTimer = setTimeout(() => { twinkleProgress = 0; }, 5000);
  } else {
    clearTimeout(twinkleTimer);
    twinkleProgress = href === TWINKLE_SEQ[0] ? 1 : 0;
    if (twinkleProgress > 0) twinkleTimer = setTimeout(() => { twinkleProgress = 0; }, 5000);
  }
}
function launchTwinkle() {
  const canvas = document.getElementById('twinkle-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  canvas.classList.add('active');
  const colors = ['#22c55e','#86efac','#bbf7d0','#4ade80','#c4b0bb','#ffffff'];
  const stars = Array.from({length:42}, (_,i) => {
    const a = (Math.random()*60-30)*Math.PI/180, sp = 6+Math.random()*8;
    return { x:Math.random()*canvas.width*.3, y:Math.random()*canvas.height, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, size:3+Math.random()*9, color:colors[Math.floor(Math.random()*colors.length)], alpha:.9+Math.random()*.1, trail:[], delay:i*38, twinklePhase:Math.random()*Math.PI*2 };
  });
  function drawStar(cx,cy,spikes,r,ir,color,alpha) {
    ctx.save(); ctx.globalAlpha=alpha; ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=14;
    ctx.beginPath(); let rot=(Math.PI/2)*3; const step=Math.PI/spikes; ctx.moveTo(cx,cy-r);
    for(let s=0;s<spikes;s++){ctx.lineTo(cx+Math.cos(rot)*r,cy+Math.sin(rot)*r);rot+=step;ctx.lineTo(cx+Math.cos(rot)*ir,cy+Math.sin(rot)*ir);rot+=step;}
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  let frame = 0;
  (function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let allDone = true;
    for(const s of stars) {
      if(frame < s.delay){allDone=false;continue;}
      s.trail.push({x:s.x,y:s.y});
      if(s.trail.length>10)s.trail.shift();
      s.trail.forEach((tr,t)=>drawStar(tr.x,tr.y,4,s.size*(t/s.trail.length)*.55,s.size*(t/s.trail.length)*.22,s.color,s.alpha*(t/s.trail.length)*.35));
      drawStar(s.x,s.y,5,s.size*(0.85+0.15*Math.sin(s.twinklePhase+frame*.18)),s.size*.4,s.color,s.alpha);
      s.x+=s.vx; s.y+=s.vy; s.alpha-=0.012;
      if(s.alpha>0&&s.x<canvas.width+50)allDone=false;
    }
    frame++;
    if(!allDone) requestAnimationFrame(animate);
    else { canvas.classList.remove('active'); ctx.clearRect(0,0,canvas.width,canvas.height); }
  })();
}

/* SLIDER (shared by My Everyday + Projects) */
function initSlider(slider, onUpdate) {
  const sc = slider.querySelector('.slider-scroller');
  const track = sc.firstElementChild;
  const bar = slider.querySelector('.slider-bar');
  const prev = slider.querySelector('[data-dir="-1"]');
  const next = slider.querySelector('[data-dir="1"]');

  function update() {
    const max = sc.scrollWidth - sc.clientWidth;
    const thumb = Math.max((sc.clientWidth / sc.scrollWidth) * 100, 10);
    const p = max > 0 ? sc.scrollLeft / max : 0;
    bar.style.width = thumb + '%';
    bar.style.left = p * (100 - thumb) + '%';
    prev.disabled = sc.scrollLeft <= 2;
    next.disabled = sc.scrollLeft >= max - 2;
    slider.classList.toggle('no-overflow', max <= 2);
    slider.classList.toggle('at-start', sc.scrollLeft <= 2);
    slider.classList.toggle('at-end', sc.scrollLeft >= max - 2);
    if (onUpdate) onUpdate(sc);
  }
  function step(dir) {
    const [a, b] = track.children;
    const w = b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
    sc.scrollBy({ left: dir * w, behavior: 'smooth' });
  }
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  sc.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(sc);
  new ResizeObserver(update).observe(track);

  /* mouse drag-to-scroll (touch already scrolls natively) */
  let down = false, moved = false, startX = 0, startL = 0;
  sc.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false; startX = e.clientX; startL = sc.scrollLeft;
  });
  window.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) { moved = true; sc.classList.add('dragging'); }
    if (moved) sc.scrollLeft = startL - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false; sc.classList.remove('dragging');
    setTimeout(() => { moved = false; }, 0);
  });
  /* a drag shouldn't count as a click (e.g. opening a project) */
  sc.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);

  update();
  return { update };
}

/* BUBBLE WRAP (My Everyday): click to pop, click again to re-inflate */
function playPop(rise) {
  const ctx = getAudioCtx(), now = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine';
  const f0 = rise ? 220 : 620 + Math.random() * 160, f1 = rise ? 440 : 110, dur = rise ? 0.12 : 0.07;
  o.frequency.setValueAtTime(f0, now);
  o.frequency.exponentialRampToValueAtTime(f1, now + dur);
  g.gain.setValueAtTime(rise ? 0.05 : 0.16, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.03);
  o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + dur + 0.05);
  if (!rise) { /* short noise crackle for the "plastic" snap */
    const len = Math.floor(ctx.sampleRate * 0.04), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const n = ctx.createBufferSource(), ng = ctx.createGain();
    n.buffer = buf; ng.gain.value = 0.10; n.connect(ng); ng.connect(ctx.destination); n.start(now);
  }
}
document.querySelectorAll('.bubble').forEach(b => {
  b.addEventListener('click', e => {
    const r = b.getBoundingClientRect();
    /* keyboard-triggered clicks report 0,0, so pop from the centre in that case */
    b.style.setProperty('--px', (e.detail ? e.clientX - r.left : r.width / 2) + 'px');
    b.style.setProperty('--py', (e.detail ? e.clientY - r.top : r.height / 2) + 'px');
    const popped = b.classList.toggle('popped');
    b.setAttribute('aria-pressed', popped);
    b.classList.remove('popping', 'inflating');
    void b.offsetWidth;
    b.classList.add(popped ? 'popping' : 'inflating');
    playPop(!popped);
  });
  b.addEventListener('animationend', e => {
    if (e.target === b) b.classList.remove('popping', 'inflating');
  });
});

/* PROJECT MODAL */
const projectData = [
  {
    title: "GIA Bot",
    meta: "FDE — NxtGen · 2026",
    img: "public/gia.png",
    desc: "<i>Internal affairs, handled.</i><br>An all-in-one assistant where employees do everything from applying for leave to resolving IT tickets, over chat or voice. Behind it sit seven specialised agents and 100+ tools, an LLM router that picks the right agent for each message, and integrations with SuccessFactors, the IT service desk and Microsoft 365.<ul><br><li><b>Built a performance review flow that is safe by design.</b> A guided chat walks employees through the review and saves each answer to SuccessFactors as a draft. The flow advances in code, so no model sits between a typed comment and the save. A web form version reuses the same save logic, and the server re-checks every request against the logged-in user's own form.</li><br><li><b>Building an IT support agent on the service desk.</b> It validates the model's pick against 300+ categories fetched from the API, checks the Microsoft Learn MCP for a fix first, and drafts an incident or work order that is filed only after the employee confirms.</li></ul>",
    tags: ["LangGraph", "SAP SuccessFactors", "MCP", "LiveKit"],
    link: null
  },
  {
    title: "Wayfarer",
    meta: "AI Engineer — NxtGen · 2026",
    img: "public/wayfarer.jpg",
    desc: "<i>Aentic flight booking platform.</i><br>I can show (book) you the world. This is an application being made in collaboration with a leading travel technology company. The goal is to create a chat-like interface to book a travel experience with ease.<ul><br><li><b>Built the first prototype solo in one week.</b> I developed the initial version for a client demo, which garnered enough interest to become the first step in the collaboration.</li><br><li><b>Reduced flight search latency from 60s to 3s.</b> The initial prototype relied on the LLM to reason over every travel option on each request, making searches painfully slow. I replaced that approach with a structured natural-language-to-SQL layer backed by Pandas DataFrames, increasing results from 10 to 40+ options per query.</li><br><li><b>Improved reliability with agent validation.</b> I proposed a multi-node architecture, adding a validation agent to the guardrailing process to account for typos and other oversights.</li></ul>",
    tags: ["Agentic AI", "Live APIs", "FastAPI", "React"],
    link: null
  },
  {
    title: "Spiel",
    meta: "Personal Project · 2025",
    img: "public/spiel.png",
    desc: "<i>AI-powered choose-your own adventure.</i><br>All Oregon Trails lead to Rome? Not really. But they could, in the world you make in Spiel, where every adventure is generated from a prompt.<ul><br><li><b>A planning agent keeps the story coherent.</b> The goal was to come up with a short story generation game. But I noticed abrupt endings when I tried to impose that as a rule. To overcome this, I created a planning agent to map out how the story might flow. Using this plan, the execution agent comes up with story and options. If the course of the story varies significantly, the plan is updated.</li><br><li><b>Reliability was a major focus.</b> I implemented server-owned sessions, defensive validation around LLM responses, and graceful fallbacks to ensure the game keeps running even when the model doesn't behave perfectly.</li></ul>",
    tags: ["FastAPI", "React", "LLM", "Planning Agent"],
    link: "https://spieltoo.vercel.app"
  },
  {
    title: "DecorAI",
    meta: "AI Engineer — NxtGen · 2025",
    img: "public/paint.png",
    desc: "<i>AI tool for visualizing new interiors inside your home.</i><br>This is the application where you paint and don't watch it dry. This proof of concept was developed for a hardware client to help customers visualize shades from the client's catalogue within photographs of their homes in vivid detail.<ul><br><li><b>Built the complete image generation pipeline.</b> I combined SAM2, OpenCV, Pillow, and Qwen Image Edit into a single workflow for segmentation, masking, and diffusion.</li><br><li><b>Made prompts adapt to every image.</b> Through extensive experimentation with prompting strategies and diffusion parameters, I found that no static prompt worked consistently across different interiors. I introduced VLM-generated prompts tailored to each image.</li><br><li><b>Delivered the production demo.</b> I assembled the final interior and exterior pipelines, integrated the application, and presented it at an AI conference, attracting interest from more than 30 companies.</li></ul>",
    tags: ["Diffusion", "Segmentation", "OpenCV", "VLM", "PyTorch"],
    link: null
  },
];

const projTrack = document.getElementById('projectsTrack');
const pmScreen  = document.getElementById('pmScreen');

projectData.forEach((p, i) => {
  const slide = document.createElement('div');
  slide.className = 'proj-slide';
  slide.innerHTML = `
    <div class="project-card" style="--i:${i}" tabindex="0" role="button" aria-label="Open ${p.title}">
      <div class="card-img-wrap"><img class="card-img" src="${p.img}" alt="${p.title}"/></div>
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <p class="card-desc">${p.desc.split('.')[0]}.</p>
        <div class="card-tags">${p.tags.slice(0,2).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
        <p class="card-click-hint">CLICK TO EXPLORE →</p>
      </div>
    </div>`;
  const card = slide.firstElementChild;
  card.addEventListener('click', () => openProjectModal(i));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProjectModal(i); }
  });
  projTrack.appendChild(slide);
});

/* subtle depth: cards drift slightly smaller and softer the further they are from the centre */
function projectDepth(sc) {
  const box = sc.getBoundingClientRect(), mid = box.left + box.width / 2;
  sc.querySelectorAll('.proj-slide').forEach(s => {
    const r = s.getBoundingClientRect();
    const d = Math.min(1, Math.abs(r.left + r.width / 2 - mid) / (box.width * 0.6));
    s.style.transform = `scale(${1 - 0.05 * d})`;
    s.style.opacity = 1 - 0.3 * d;
  });
}
initSlider(document.getElementById('projSlider'), projectDepth);

function openProjectModal(i) {
  const p = projectData[i];
  document.getElementById('pmImg').src   = p.img;
  document.getElementById('pmImg').alt   = p.title;
  document.getElementById('pmTitle').textContent = p.title;
  document.getElementById('pmMeta').textContent  = p.meta;
  document.getElementById('pmDesc').innerHTML  = p.desc;
  document.getElementById('pmTags').innerHTML    = p.tags.map(t=>`<span class="tag">${t}</span>`).join('');
  const pmLink = document.getElementById('pmLink');
  if (p.link) {
    pmLink.href = p.link;
    pmLink.style.display = 'inline-flex'; // or 'block'
  } else {
    pmLink.style.display = 'none';
  }
  pmScreen.style.display = 'flex';
  document.body.style.overflow = "hidden";
  pmScreen.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeProjectModal() {
  pmScreen.style.display = 'none';
  document.body.style.overflow = "";
}

document.getElementById('pmClose').addEventListener('click', closeProjectModal);

/* Tap/click outside the modal card to dismiss it — only close when the
   click actually lands on the scrim (pmScreen itself), not on anything
   nested inside .pm-modal, so clicks/taps on the content don't close it. */
pmScreen.addEventListener('click', e => {
  if (e.target === pmScreen) closeProjectModal();
});

/* Escape key closes it too, since that's the other half of "tap out to exit". */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && pmScreen.style.display === 'flex') closeProjectModal();
});