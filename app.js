(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  let lastY = 0;

  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));

  const updateHeader = () => {
    const y = scrollY;
    header.classList.toggle('is-hidden', y > lastY && y > 160 && !document.body.classList.contains('menu-open'));
    header.classList.toggle('is-dark', y < innerHeight * .72 || y > document.body.scrollHeight - innerHeight * 1.15);
    lastY = y;
  };
  addEventListener('scroll', updateHeader, {passive:true});
  updateHeader();

  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach((el, index) => {
    el.style.setProperty('--reveal-order', index % 5);
    if (el.matches('.section-tag, .approach-head, .work-head')) el.classList.add('reveal-assemble');
    if (el.matches('.protocol-list li')) el.classList.add('reveal-route');
    if (el.matches('.case')) el.classList.add('reveal-check');
    if (el.matches('.work-map, .intro-statement, .closing-copy')) el.classList.add('reveal-fold');
  });
  if (reduced) reveals.forEach(el => el.classList.add('in-view'));
  else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    }), {threshold:.035, rootMargin:'0px 0px -3%'});
    reveals.forEach(el => observer.observe(el));
  }

  const filters = [...document.querySelectorAll('[data-filter]')];
  const cases = [...document.querySelectorAll('.case')];
  const workMap = document.querySelector('.work-map');
  filters.forEach(button => button.addEventListener('click', () => {
    const value = button.dataset.filter;
    if (workMap) workMap.dataset.active = value;
    filters.forEach(item => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
    cases.forEach(item => {
      const show = value === 'all' || item.dataset.category === value;
      item.hidden = !show;
      if (!show) item.open = false;
    });
  }));

  document.querySelectorAll('.case').forEach(item => item.addEventListener('toggle', () => {
    if (item.open) document.querySelectorAll('.case[open]').forEach(other => { if (other !== item) other.open = false; });
  }));

  document.querySelectorAll('.case').forEach(item => {
    const data = item.querySelector('.case-data');
    if (!data || item.querySelector('.outcome-signature')) return;
    const signature = document.createElement('div');
    signature.className = 'outcome-signature';
    signature.setAttribute('aria-hidden', 'true');
    signature.innerHTML = '<div class="outcome-signature-head"><span>What changed</span><b>After launch</b></div><div class="outcome-lanes"></div>';
    const lanes = signature.querySelector('.outcome-lanes');
    [...data.querySelectorAll('div')].forEach((metric, metricIndex) => {
      const label = metric.querySelector('dt')?.textContent?.trim() || `Outcome ${metricIndex + 1}`;
      const value = metric.querySelector('dd')?.textContent?.trim() || '';
      const meaning = `${label} ${value}`.toLowerCase();
      const viz = /status|maintained|ongoing/.test(meaning) ? 'status' :
        value.includes('→') ? 'compare' :
        /down|cut|saved|none|zero|<1|reduced|fewer|0$/.test(meaning) ? 'reduce' :
        /up|\+|recovered|freed|capacity|value|cash|revenue/.test(meaning) ? 'grow' : 'checkpoint';
      const lane = document.createElement('span');
      lane.className = `outcome-lane outcome-${viz}`;
      lane.style.setProperty('--lane-order', metricIndex);
      lane.innerHTML = `<i class="outcome-viz"><b></b><b></b><b></b><b></b><b></b></i><small>${label}</small><strong>${value}</strong>`;
      lanes.appendChild(lane);
    });
    data.insertAdjacentElement('afterend', signature);
  });

  document.querySelectorAll('.flow-step').forEach((step, index) => step.style.setProperty('--flow-order', index));

  const heroRouting = document.querySelector('.hero-routing');
  const summaryRouting = document.querySelector('.summary-routing');
  const workSection = document.querySelector('.work');
  const approachSection = document.querySelector('.approach');
  const clarityLanes = [...document.querySelectorAll('.clarity-lanes i')];
  const clamp = value => Math.max(0, Math.min(1, value));
  const viewProgress = element => {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    return clamp((innerHeight - rect.top) / (innerHeight + rect.height));
  };
  let motionFrame = 0;
  const updateSystemMotion = () => {
    motionFrame = 0;
    const heroProgress = clamp(scrollY / Math.max(innerHeight, 1));
    heroRouting?.style.setProperty('--hero-turn', `${heroProgress * 4}deg`);
    heroRouting?.style.setProperty('--hero-shift-1', `${heroProgress * -54}px`);
    heroRouting?.style.setProperty('--hero-shift-2', `${heroProgress * 36}px`);
    heroRouting?.style.setProperty('--hero-shift-3', `${heroProgress * -24}px`);
    summaryRouting?.style.setProperty('--summary-turn', `${viewProgress(summaryRouting) * 145}deg`);
    workSection?.style.setProperty('--work-turn', `${viewProgress(workSection) * -125}deg`);
    const clarity = clamp((viewProgress(approachSection) - .08) / .68);
    const angles = [-13, 9, -7, 15, -4];
    clarityLanes.forEach((lane, index) => {
      const remaining = 1 - clarity;
      lane.style.transform = `translate3d(${remaining * (index - 2) * 22}px,${remaining * (index % 2 ? 18 : -15)}px,0) rotate(${angles[index] * remaining}deg)`;
    });
  };
  const queueSystemMotion = () => {
    if (!motionFrame) motionFrame = requestAnimationFrame(updateSystemMotion);
  };
  if (!reduced) {
    addEventListener('scroll', queueSystemMotion, {passive:true});
    addEventListener('resize', queueSystemMotion, {passive:true});
    updateSystemMotion();
  }

  const canvas = document.querySelector('[data-system-canvas]');
  if (!canvas || reduced) return;
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = 1, raf;
  const points = Array.from({length:34}, (_,i) => ({
    x: Math.random(), y: Math.random(), vx:(Math.random()-.5)*.00022, vy:(Math.random()-.5)*.00022,
    r:i%9===0?2.2:1, phase:Math.random()*Math.PI*2, speed:.025+Math.random()*.035
  }));
  const resize = () => { dpr = Math.min(devicePixelRatio,2); width = canvas.clientWidth; height = canvas.clientHeight; canvas.width=width*dpr; canvas.height=height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); };
  const draw = () => {
    ctx.clearRect(0,0,width,height);
    points.forEach(p => { p.x += p.vx; p.y += p.vy; p.phase += p.speed; if(p.x<0||p.x>1)p.vx*=-1; if(p.y<0||p.y>1)p.vy*=-1; });
    for(let i=0;i<points.length;i++) for(let j=i+1;j<points.length;j++) {
      const a=points[i], b=points[j], dx=(a.x-b.x)*width, dy=(a.y-b.y)*height, dist=Math.hypot(dx,dy);
      if(dist<190){ctx.strokeStyle=`rgba(10,29,48,${(1-dist/190)*.14})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(a.x*width,a.y*height);ctx.lineTo(b.x*width,b.y*height);ctx.stroke();}
    }
    points.forEach((p,i)=>{const pulse=.65+Math.sin(p.phase)*.5;ctx.fillStyle=p.r>2?(i%2?'#ff7459':'#19cdbb'):`rgba(10,29,48,${.25+pulse*.25})`;ctx.beginPath();ctx.arc(p.x*width,p.y*height,Math.max(.7,p.r+pulse),0,Math.PI*2);ctx.fill();});
    raf=requestAnimationFrame(draw);
  };
  resize(); draw(); addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else draw();});
})();
