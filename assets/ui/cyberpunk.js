/* Procedural Sentinel exhibit. No network, external renderer, or live telemetry. */
(() => {
  'use strict';
  const canvas = document.getElementById('sentinelCanvas');
  const stage = document.getElementById('sentinelStage');
  if (!canvas || !stage) return;
  const ctx = canvas.getContext('2d');
  const controls = document.querySelector('.sentinel-controls');
  const status = document.getElementById('sentinelStatus');
  if (!ctx) {
    canvas.hidden = true;
    controls.querySelectorAll('button').forEach(button => { button.disabled = true; });
    status.textContent = 'STATIC PREVIEW // 3D VIEW UNAVAILABLE';
    return;
  }

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pause = document.getElementById('sentinelPause');
  const scanButton = document.getElementById('sentinelScan');
  const bearing = document.getElementById('sentinelBearing');
  let paused = motion.matches;
  let wireframe = false;
  let visible = false;
  let frame = 0;
  let lastFrame = 0;
  let time = 0;
  let yaw = .44;
  let width = 1;
  let height = 1;
  let scale = 1;
  let scanStart = null;
  let scanTimer = 0;
  let dragging = null;
  let pitch = .43;
  const tau = Math.PI * 2;
  const acid = [216, 235, 70];
  const cyan = [0, 245, 223];
  const rgba = (rgb, alpha) => `rgba(${rgb.join(',')},${alpha})`;
  const faces = [];
  const rotors = [];
  const face = (vertices, type = 'armor', shade = 1) => faces.push({ vertices, type, shade });

  // Extruded polygon armor with a beveled upper deck.
  const hull = [[-.55, -1.22], [.55, -1.22], [.83, -.68], [.72, .7], [.39, 1], [-.39, 1], [-.72, .7], [-.83, -.68]];
  const upper = hull.map(([x, z]) => [x * .82, .44, z * .88]);
  const middle = hull.map(([x, z]) => [x, .08, z]);
  const lower = hull.map(([x, z]) => [x * .66, -.38, z * .78]);
  face(upper, 'deck', 1.4);
  face(lower, 'armor', .6);
  hull.forEach((_, i) => {
    const j = (i + 1) % hull.length;
    face([upper[i], upper[j], middle[j], middle[i]], 'armor', i % 2 ? 1.5 : 1.1);
    face([middle[i], middle[j], lower[j], lower[i]], 'armor', i % 2 ? .85 : 1.1);
  });

  const box = (x, y, z, sx, sy, sz, type = 'armor') => {
    const p = [[x-sx,y-sy,z-sz],[x+sx,y-sy,z-sz],[x+sx,y+sy,z-sz],[x-sx,y+sy,z-sz],
      [x-sx,y-sy,z+sz],[x+sx,y-sy,z+sz],[x+sx,y+sy,z+sz],[x-sx,y+sy,z+sz]];
    [[0,1,2,3],[4,7,6,5],[3,2,6,7],[0,4,5,1],[0,3,7,4],[1,5,6,2]].forEach((indices, i) => face(indices.map(n => p[n]), type, .8 + i * .12));
  };

  // Four ducted rotors, connected with swept, faceted arms.
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const x = side * 1.94, z = end * 1.04;
      const a = [side * .55, .12, end * .43];
      const b = [x, .05, z];
      const top = [[a[0],a[1],a[2]-.17],[b[0],b[1],b[2]-.2],[b[0],b[1],b[2]+.2],[a[0],a[1],a[2]+.17]];
      const bottom = top.map(([px, py, pz]) => [px, py-.19, pz]);
      face(top, 'deck', 1.7);
      top.forEach((p, i) => face([p,top[(i+1)%4],bottom[(i+1)%4],bottom[i]], 'armor', 1));
      face([[side*.83,.135,end*.52],[side*1.73,.075,z-.025],[side*1.73,.075,z+.025],[side*.83,.135,end*.59]], 'acid');
      const segments = 20;
      for (let i = 0; i < segments; i++) {
        const angle = i / segments * tau, next = (i + 1) / segments * tau;
        const point = (r, y, t) => [x + Math.cos(t)*r, y, z + Math.sin(t)*r];
        face([point(.69,.13,angle),point(.69,.13,next),point(.53,.13,next),point(.53,.13,angle)], 'deck', 1.4);
        face([point(.69,.13,angle),point(.69,.13,next),point(.69,-.12,next),point(.69,-.12,angle)], 'armor', 1.1);
        face([point(.54,.14,angle),point(.54,.14,next),point(.51,.14,next),point(.51,.14,angle)], i % 5 === 0 ? 'cyan' : 'acid');
        face([point(.66,-.12,angle),point(.66,-.12,next),point(.66,-.16,next),point(.66,-.16,angle)], 'cyan-dim');
      }
      box(x, .01, z, .11, .11, .11, 'deck');
      rotors.push({ x, z, direction: side * end });
    }
  }

  // Bright chevrons, vents, optical assembly and an antenna complete the model.
  face([[-.37,.45,-.65],[0,.45,-.89],[.37,.45,-.65],[.3,.45,-.56],[0,.45,-.74],[-.3,.45,-.56]], 'acid');
  for (let i = 0; i < 5; i++) {
    box(0, .45, .08 + i*.12, .23-i*.017, .012, .022, 'vent');
  }
  box(0,-.14,-1.09,.3,.2,.17,'armor');
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * tau, b = (i+1) / 16 * tau;
    const lens = (r, t) => [Math.cos(t)*r, -.14+Math.sin(t)*r, -1.275];
    face([lens(.18,a),lens(.18,b),lens(.12,b),lens(.12,a)], 'cyan');
  }
  face(Array.from({length:16}, (_,i) => [Math.cos(i/16*tau)*.085,-.14+Math.sin(i/16*tau)*.085,-1.285]), 'lens');
  box(0,.67,.51,.024,.24,.025,'armor');
  box(0,.93,.51,.04,.025,.04,'acid');

  const project = ([x, y, z]) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const rx = x*cy-z*sy, rz = x*sy+z*cy;
    const py = y*Math.cos(pitch)+rz*Math.sin(pitch);
    const depth = -y*Math.sin(pitch)+rz*Math.cos(pitch);
    const perspective = 8.5/(8.5+depth);
    return { x: width*.5+rx*scale*perspective, y: height*.49-py*scale*perspective, z: depth };
  };
  const path = points => {
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
    ctx.closePath();
  };
  const ground = () => {
    for (const radius of [1.1, 2.35, 2.8, 3.05]) {
      const points = Array.from({length:80},(_,i) => project([Math.cos(i/80*tau)*radius,-1.2,Math.sin(i/80*tau)*radius]));
      path(points);
      ctx.strokeStyle = rgba(radius===2.8 ? cyan : acid, radius===2.8 ? .19 : .12);
      ctx.lineWidth = .7;
      ctx.setLineDash(radius===3.05 ? [2,8] : []);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let i=0;i<12;i++) {
      const a=i/12*tau;
      const p=project([Math.cos(a)*2.65,-1.2,Math.sin(a)*2.65]);
      const q=project([Math.cos(a)*2.86,-1.2,Math.sin(a)*2.86]);
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
      ctx.strokeStyle=rgba(acid,.3);ctx.stroke();
    }
  };
  const draw = () => {
    ctx.clearRect(0,0,width,height);
    ground();
    const bob = motion.matches || paused ? 0 : Math.sin(time*.95)*.065;
    const renderFaces = faces.map(f => ({...f, points:f.vertices.map(([x,y,z]) => project([x,y+bob,z]))}));
    rotors.forEach(({x,z,direction}) => {
      for(let i=0;i<3;i++) {
        const angle=i/3*tau+time*direction*1.8;
        const vertices=[[x,0,z],[x+Math.cos(angle)*.49,0,z+Math.sin(angle)*.49],[x+Math.cos(angle+.38)*.43,0,z+Math.sin(angle+.38)*.43]];
        renderFaces.push({type:'rotor',shade:1,points:vertices.map(([px,py,pz])=>project([px,py+bob,pz]))});
      }
    });
    renderFaces.forEach(f => { f.depth=f.points.reduce((sum,p)=>sum+p.z,0)/f.points.length; });
    renderFaces.sort((a,b)=>b.depth-a.depth);
    renderFaces.forEach(f => {
      path(f.points);
      const emissive = ['acid','cyan','cyan-dim','lens'].includes(f.type);
      if(emissive) {
        const color=f.type==='acid'?acid:cyan;
        ctx.fillStyle=rgba(color,f.type==='cyan-dim'?.3:f.type==='lens'?.95:.8);
        ctx.strokeStyle=rgba(color,.8);
        ctx.lineWidth=.7;
      } else if(wireframe) {
        ctx.fillStyle='rgba(4,16,13,.26)';
        ctx.strokeStyle=rgba(cyan,.22+Math.max(0,3-f.depth)*.035);
        ctx.lineWidth=.75;
      } else {
        const shade=f.shade||1;
        ctx.fillStyle=f.type==='vent'?'#070c09':`rgb(${Math.round(16*shade)},${Math.round(24*shade)},${Math.round(18*shade)})`;
        ctx.strokeStyle=rgba(acid,f.type==='rotor'?.22:f.type==='deck'?.4:.26);
        ctx.lineWidth=.8;
      }
      ctx.fill();ctx.stroke();
    });

    // Particles stay inside the exhibit rather than adding a full-page canvas.
    for(let i=0;i<19;i++) {
      const phase=(time*.055+i*.137)%1;
      const x=width*(.12+(i*.173)% .76);
      const y=height*(.82-phase*.63);
      ctx.fillStyle=rgba(i%3===0?cyan:acid,Math.sin(phase*Math.PI)*.32);
      ctx.fillRect(x,y,i%4===0?2:1,2);
    }

    if(scanStart!==null) {
      const progress=Math.min(1,(performance.now()-scanStart)/1800);
      const y=1.1-progress*2.25;
      path([[-2.9,y,-1.95],[2.9,y,-1.95],[2.9,y,1.95],[-2.9,y,1.95]].map(project));
      ctx.fillStyle=rgba(cyan,.045);ctx.fill();
      ctx.strokeStyle=rgba(cyan,.65);ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle=rgba(cyan,.85);ctx.font='8px Consolas, monospace';
      ctx.fillText(`OPTICAL PASS / ${String(Math.round(progress*100)).padStart(3,'0')}%`,22,55);
    }
    const degrees=((Math.round(yaw*180/Math.PI)%360)+360)%360;
    bearing.textContent=`YAW / ${String(degrees).padStart(3,'0')}°`;
    stage.classList.add('is-rendered');
  };

  // At most 30 frames per second; stop scheduling outside the viewport or in a hidden tab.
  const shouldAnimate = () => visible && !document.hidden && !motion.matches && (!paused || scanStart!==null);
  const loop = now => {
    frame=0;
    if(!shouldAnimate()) return;
    const elapsed=now-lastFrame;
    if(elapsed>=1000/30) {
      const dt=Math.min(elapsed/1000,.06);
      lastFrame=now;
      if(!paused && !dragging){time+=dt;yaw+=dt*.14;}
      draw();
    }
    frame=requestAnimationFrame(loop);
  };
  const refresh = () => {
    if(frame)cancelAnimationFrame(frame);
    frame=0;
    draw();
    if(shouldAnimate()){lastFrame=performance.now();frame=requestAnimationFrame(loop);}
  };
  const syncPause = () => {
    pause.textContent=motion.matches?'REDUCED MOTION':paused?'RESUME ROTATION':'PAUSE ROTATION';
    pause.disabled=motion.matches;
    pause.setAttribute('aria-pressed',String(paused));
  };
  const resize = () => {
    const rect=stage.getBoundingClientRect();
    width=rect.width;height=rect.height;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    scale=Math.min(width/7.7,height/5.4);
    refresh();
  };

  controls.querySelectorAll('[data-sentinel-mode]').forEach(button => button.addEventListener('click',()=>{
    wireframe=button.dataset.sentinelMode==='wireframe';
    controls.querySelectorAll('[data-sentinel-mode]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    status.textContent=wireframe?'WIREFRAME // STRUCTURE EXPOSED':'ARMORED // SHELL RESTORED';
    refresh();
  }));
  pause.addEventListener('click',()=>{
    if(motion.matches){status.textContent='REDUCED MOTION // USE ARROWS TO ROTATE';return;}
    paused=!paused;syncPause();refresh();
    status.textContent=paused?'ROTATION HELD // MANUAL CONTROL':'AUTO ROTATION // RESUMED';
  });
  const turn = direction => {
    yaw+=direction*Math.PI/12;paused=true;syncPause();refresh();
    status.textContent='MANUAL BEARING // ROTATION HELD';
  };
  document.getElementById('sentinelLeft').addEventListener('click',()=>turn(-1));
  document.getElementById('sentinelRight').addEventListener('click',()=>turn(1));
  scanButton.addEventListener('click',()=>{
    if(scanStart!==null)return;
    if(motion.matches){status.textContent='SCAN COMPLETE // 4 ROTORS + OPTICAL CORE';return;}
    scanStart=performance.now();scanButton.disabled=true;
    status.textContent='OPTICAL SCAN // READING GEOMETRY';
    refresh();
    scanTimer=window.setTimeout(()=>{
      scanStart=null;scanButton.disabled=false;
      status.textContent='SCAN COMPLETE // 4 ROTORS + OPTICAL CORE';
      refresh();
    },1800);
  });

  // Mouse/pen dragging is optional; touch retains natural scrolling and has arrow controls.
  canvas.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'||event.button!==0)return;
    dragging={x:event.clientX,y:event.clientY};
    canvas.setPointerCapture(event.pointerId);
    paused=true;syncPause();refresh();
  });
  canvas.addEventListener('pointermove',event=>{
    if(!dragging)return;
    yaw+=(event.clientX-dragging.x)*.008;
    pitch=Math.max(.12,Math.min(.85,pitch+(event.clientY-dragging.y)*.004));
    dragging={x:event.clientX,y:event.clientY};
    refresh();
  });
  const release=()=>{if(dragging){dragging=null;status.textContent='MANUAL BEARING // ROTATION HELD';}};
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  document.addEventListener('visibilitychange',refresh);
  motion.addEventListener('change',()=>{
    paused=motion.matches;
    if(motion.matches){clearTimeout(scanTimer);scanStart=null;scanButton.disabled=false;}
    syncPause();refresh();
    status.textContent=motion.matches?'REDUCED MOTION // MANUAL CONTROLS READY':'UNIT READY // AWAITING INPUT';
  });
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;refresh();},{threshold:.05}).observe(stage);
  }else visible=true;
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize',resize,{passive:true});
  document.querySelector('.sentinel-fallback').setAttribute('aria-hidden','true');
  syncPause();resize();
})();
