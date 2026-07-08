/* THEME */
const root = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
let dark = (localStorage.getItem('aria-theme') ?? 'dark') === 'dark';
applyTheme();
function toggleTheme() { dark = !dark; applyTheme(); localStorage.setItem('aria-theme', dark ? 'dark' : 'light'); }
function applyTheme()  { root.setAttribute('data-theme', dark ? 'dark' : 'light'); themeBtn.textContent = dark ? '☀️' : '🌙'; }

/* CURSOR */
const cursorDot  = document.getElementById('cursor-dot');
const cursorGlow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', e => {
  cursorDot.style.left  = cursorGlow.style.left = e.clientX + 'px';
  cursorDot.style.top   = cursorGlow.style.top  = e.clientY + 'px';
});

/* WAVY CANVAS */
const wavyCanvas = document.getElementById('wavy-canvas');
const wctx = wavyCanvas.getContext('2d');
let wt = 0, wmx = 0, wmy = 0;
function resizeWavy() { wavyCanvas.width = window.innerWidth; wavyCanvas.height = window.innerHeight; }
resizeWavy();
window.addEventListener('resize', resizeWavy);
document.addEventListener('mousemove', e => { wmx = e.clientX / window.innerWidth; wmy = e.clientY / window.innerHeight; });
function drawWavy() {
  wctx.clearRect(0, 0, wavyCanvas.width, wavyCanvas.height);
  const W = wavyCanvas.width, H = wavyCanvas.height;
  const a = root.getAttribute('data-theme') === 'dark' ? 0.22 : 0.15;
  const sp = 52;
  for (let row = 0; row * sp < H + sp; row++) {
    const baseY = row * sp;
    wctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const d = Math.sqrt(Math.pow(x/W - wmx, 2) + Math.pow(baseY/H - wmy, 2));
      const y = baseY + Math.sin(x/90 + wt*.5 + row*.3)*6 + Math.sin(x/45 - wt*.3 + row*.5)*3 + Math.sin(d*12 - wt*1.2)*4;
      x === 0 ? wctx.moveTo(x, y) : wctx.lineTo(x, y);
    }
    const t = row / (H / sp);
    wctx.strokeStyle = `rgba(${Math.round(169+(196-169)*t)},${Math.round(172+(176-172)*t)},${Math.round(169+(187-169)*t)},${a})`;
    wctx.lineWidth = 0.75; wctx.stroke();
  }
  for (let col = 0; col * sp < W + sp; col++) {
    const baseX = col * sp;
    wctx.beginPath();
    for (let y = 0; y <= H; y += 2) {
      const d = Math.sqrt(Math.pow(baseX/W - wmx, 2) + Math.pow(y/H - wmy, 2));
      const x = baseX + Math.sin(y/90 + wt*.4 + col*.3)*6 + Math.sin(y/55 - wt*.25 + col*.4)*3 + Math.sin(d*12 - wt*1.2)*4;
      y === 0 ? wctx.moveTo(x, y) : wctx.lineTo(x, y);
    }
    const t = col / (W / sp);
    wctx.strokeStyle = `rgba(${Math.round(34+(196-34)*(1-t))},${Math.round(100+76*t)},${Math.round(94+93*t)},${a*.65})`;
    wctx.lineWidth = 0.5; wctx.stroke();
  }
  wt += 0.018;
  requestAnimationFrame(drawWavy);
}
drawWavy();

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

/* PROJECT MODAL */
const projectData = [
  {
    title: "Spiel",
    meta: "Personal Project · 2025",
    img: "public/spiel.png",
    desc: "All Oregon Trails lead to Rome? Not really. But they could, in the world you make in Spiel: a fun and completely personalized journey through the world generated by the user's prompt. <br>⁍ The goal was to come up with a short story generation game. But, I noticed abrupt endings when I tried to impose that as a rule. To overcome this, I created a planning agent to map out how the story might flow. Using this, the execution agent comes up with story and options. If the course of the story changes significantly, the plan is updated. <br> ⁍ Beyond story generation, I focused on reliability through server-owned sessions, defensive validation around LLM responses, and graceful fallbacks to ensure the game keeps running even when the model doesn't behave perfectly.",
    tags: ["FastAPI", "React", "LLM", "Planning Agent"],
    link: "https://spieltoo.vercel.app"
  },
  {
    title: "pAInt",
    meta: "AI Engineer — NxtGen · 2025",
    img: "public/paint.png",
    desc: "This proof of concept was developed for a hardware client to help customers visualize products from the client's catalogue within photographs of their homes in vivid detail. My contributions: <ul><li>Architected the application and project structure.</li><li>Built the interior segmentation, masking, and diffusion pipeline.</li><li>Optimized diffusion with VLM-based prompting after extensive experimentation.</li><li>Integrated the application and presented it at an AI conference, attracting interest from 30+ companies.</li></ul>",
    tags: ["Diffusion", "Segmentation", "OpenCV", "VLM", "PyTorch"],
    link: "#"
  },
  {
    title: "Wayfarer",
    meta: "AI Engineer — NxtGen · 2026",
    img: "public/wayfarer.jpg",
    desc: "",
    tags: ["Agentic AI", "Live APIs", "FastAPI", "React"],
    link: "#"
  }
];

const pgGrid  = document.getElementById('projectsGrid');
const pmScreen = document.getElementById('pmScreen');
const pmNavDots = document.getElementById('pmNavDots');

projectData.forEach((p, i) => {
  const card = document.createElement('div');
  card.className = 'project-card reveal';
  card.innerHTML = `
    <div class="card-img-wrap"><img class="card-img" src="${p.img}" alt="${p.title}"/></div>
    <div class="card-body">
      <h3 class="card-title">${p.title}</h3>
      <p class="card-desc">${p.desc.split('.')[0]}.</p>
      <div class="card-tags">${p.tags.slice(0,2).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <p class="card-click-hint">CLICK TO EXPLORE →</p>
    </div>`;
  card.addEventListener('click', () => openProjectModal(i));
  pgGrid.appendChild(card);
  revealObs.observe(card);

  const dot = document.createElement('div');
  dot.className = 'pm-dot';
  dot.addEventListener('click', () => openProjectModal(i));
  pmNavDots.appendChild(dot);
});

function openProjectModal(i) {
  const p = projectData[i];
  document.getElementById('pmImg').src   = p.img;
  document.getElementById('pmImg').alt   = p.title;
  document.getElementById('pmTitle').textContent = p.title;
  document.getElementById('pmMeta').textContent  = p.meta;
  document.getElementById('pmDesc').innerHTML  = p.desc;
  document.getElementById('pmTags').innerHTML    = p.tags.map(t=>`<span class="tag">${t}</span>`).join('');
  document.getElementById('pmLink').href         = p.link;
  pmScreen.style.display = 'flex';
  document.body.style.overflow = "hidden";
  document.querySelectorAll('.pm-dot').forEach((d,j) => d.classList.toggle('active', j===i));
  pmScreen.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeProjectModal() {
  pmScreen.style.display = 'none';
  document.body.style.overflow = "";
  document.querySelectorAll('.pm-dot').forEach(d => d.classList.remove('active'));
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