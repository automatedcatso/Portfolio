(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;

  // Fast boot: enough theatre without blocking the portfolio.
  const boot = $('#boot');
  const bootLog = $('#bootLog');
  const bootProgress = $('#bootProgress');
  const bootPercent = $('#bootPercent');
  const bootSteps = [
    '[OK] mounting <b>operator-profile</b>',
    '[OK] indexing <b>project-artifacts</b>',
    '[OK] verifying <b>evidence-chain</b>',
    '[OK] loading <b>visual-overdrive</b>',
    '[OK] interface ready'
  ];
  let bootValue = 0;
  let bootLine = 0;
  const finishBoot = () => {
    bootValue = 100;
    if (bootProgress) bootProgress.style.width = '100%';
    if (bootPercent) bootPercent.textContent = '100%';
    setTimeout(() => boot?.classList.add('done'), reduceMotion ? 0 : 220);
    setTimeout(() => document.body.classList.remove('locked'), 230);
  };
  document.body.classList.add('locked');
  if (reduceMotion) finishBoot();
  else {
    const bootTimer = setInterval(() => {
      bootValue = Math.min(100, bootValue + 8 + Math.floor(Math.random() * 10));
      if (bootProgress) bootProgress.style.width = `${bootValue}%`;
      if (bootPercent) bootPercent.textContent = `${String(bootValue).padStart(2,'0')}%`;
      if (bootLine < bootSteps.length && bootValue >= (bootLine + 1) * 17) {
        bootLog.innerHTML += `${bootSteps[bootLine]}\n`;
        bootLine += 1;
      }
      if (bootValue >= 100) { clearInterval(bootTimer); finishBoot(); }
    }, 95);
    setTimeout(() => { if (!boot?.classList.contains('done')) finishBoot(); }, 1700);
  }

  // Reveal observer with hero safety fallback.
  const reveals = $$('.reveal');
  reveals.forEach(el => el.style.transitionDelay = `${Number(el.dataset.delay || 0)}ms`);
  const revealNow = el => el.classList.add('visible');
  if (reduceMotion || !('IntersectionObserver' in window)) reveals.forEach(revealNow);
  else {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { revealNow(entry.target); revealObserver.unobserve(entry.target); }
    }), { threshold: .08, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => revealObserver.observe(el));
    setTimeout(() => $$('.hero-reveal').forEach(revealNow), 500);
  }

  // Pointer glow + micro spark trail.
  const glow = $('#cursorGlow');
  if (finePointer && !reduceMotion) {
    let gx = innerWidth * .7, gy = innerHeight * .3, tx = gx, ty = gy;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const moveGlow = () => { gx += (tx-gx)*.12; gy += (ty-gy)*.12; if (glow) { glow.style.left=`${gx}px`; glow.style.top=`${gy}px`; } requestAnimationFrame(moveGlow); };
    moveGlow();
  } else if (glow) glow.style.display = 'none';

  // Particle constellation background.
  const canvas = $('#particleField');
  const ctx = canvas?.getContext('2d');
  let particles = [];
  const resizeParticles = () => {
    if (!canvas || !ctx) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(innerWidth*dpr); canvas.height = Math.floor(innerHeight*dpr);
    canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count = Math.min(110, Math.max(42, Math.floor(innerWidth/15)));
    particles = Array.from({length:count},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.2+.25,vx:(Math.random()-.5)*.09,vy:(Math.random()-.5)*.09,a:Math.random()*.55+.08}));
  };
  const drawParticles = () => {
    if (!ctx || reduceMotion) return;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    particles.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=innerWidth;if(p.x>innerWidth)p.x=0;if(p.y<0)p.y=innerHeight;if(p.y>innerHeight)p.y=0;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(246,255,0,${p.a})`;ctx.fill();
    });
    requestAnimationFrame(drawParticles);
  };
  resizeParticles(); if (!reduceMotion) drawParticles(); addEventListener('resize',resizeParticles,{passive:true});

  // Matrix rain only appears in easter-egg overdrive.
  const matrix = $('#matrixRain');
  const mctx = matrix?.getContext('2d');
  let drops=[];
  const resizeMatrix=()=>{if(!matrix||!mctx)return;const dpr=Math.min(devicePixelRatio||1,1.3);matrix.width=innerWidth*dpr;matrix.height=innerHeight*dpr;matrix.style.width=`${innerWidth}px`;matrix.style.height=`${innerHeight}px`;mctx.setTransform(dpr,0,0,dpr,0,0);drops=Array(Math.ceil(innerWidth/18)).fill(1)};
  const drawMatrix=()=>{if(!mctx||reduceMotion)return;mctx.fillStyle='rgba(5,6,5,.09)';mctx.fillRect(0,0,innerWidth,innerHeight);mctx.font='11px monospace';drops.forEach((y,i)=>{const c=Math.random()>.5?'1':'0';mctx.fillStyle='rgba(246,255,0,.36)';mctx.fillText(c,i*18,y*18);if(y*18>innerHeight&&Math.random()>.975)drops[i]=0;drops[i]++});requestAnimationFrame(drawMatrix)};
  resizeMatrix(); if (!reduceMotion) drawMatrix(); addEventListener('resize',resizeMatrix,{passive:true});

  // Animated red-team terminal demo. Everything shown targets the RFC 5737 TEST-NET lab range only.
  const terminalDynamic = $('#terminalDynamic');
  const terminalClock = $('#terminalClock');
  const terminalSequences = [
    {cmd:'nmap -Pn -sV --top-ports 12 198.51.100.24', out:'PORT   STATE SERVICE      VERSION\n22/tcp open  ssh          OpenSSH 9.x\n80/tcp open  http         nginx lab\n443/tcp open https        nginx lab\n445/tcp filt  microsoft-ds\n[+] 3 services surfaced // host: demo-web', cls:'ok'},
    {cmd:'nmap -O --osscan-limit 198.51.100.24', out:'[+] OS fingerprint: Linux 6.x family // confidence 94%\n[+] latency: 1.8ms // isolated virtual range', cls:'term-cyan'},
    {cmd:'whatweb http://198.51.100.24', out:'http://198.51.100.24 [200 OK] nginx, HTML5, X-Powered-By[demo-lab]', cls:'ok'},
    {cmd:'msfconsole -q -x "workspace -a portfolio-lab; hosts; services; exit"', out:'[*] Workspace: portfolio-lab\n[*] 198.51.100.24  demo-web  Linux\n[*] tcp/22 ssh · tcp/80 http · tcp/443 https\n[*] enumeration only // no exploit launched', cls:'term-cyan'},
    {cmd:'msfconsole -q -x "use auxiliary/scanner/http/http_version; set RHOSTS 198.51.100.24; run; exit"', out:'[+] 198.51.100.24:80 - HTTP server: nginx [demo]\n[*] auxiliary scan complete // 1 host', cls:'ok'},
    {cmd:'reconctl graph --target 198.51.100.24 --live', out:'[+] host → 3 services → 4 fingerprints → 0 exploit actions\n[+] recon loop complete // restarting passive sweep…', cls:'ok'}
  ];
  let sequenceIndex=0;
  const typeTerminal = async () => {
    if (!terminalDynamic || reduceMotion) return;
    const s=terminalSequences[sequenceIndex%terminalSequences.length]; sequenceIndex++;
    terminalDynamic.innerHTML='<span class="prompt2">└─$</span> <span class="term-cursor"></span>';
    const cursor=$('.term-cursor',terminalDynamic);
    let typed='';
    for (const ch of s.cmd) { typed+=ch; terminalDynamic.innerHTML=`<span class="prompt2">└─$</span> <span class="cmd">${typed.replace(/</g,'&lt;')}</span><span class="term-cursor"></span>`; await new Promise(r=>setTimeout(r,18+Math.random()*20)); }
    await new Promise(r=>setTimeout(r,320));
    terminalDynamic.innerHTML+=`<br><span class="output ${s.cls}">${s.out}</span>`;
    await new Promise(r=>setTimeout(r,1600));
    typeTerminal();
  };
  setTimeout(typeTerminal,1500);
  const tickClock=()=>{if(terminalClock)terminalClock.textContent=new Date().toLocaleTimeString('en-GB',{hour12:false});};tickClock();setInterval(tickClock,1000);

  // Scroll state, active nav, progress, header compression, mild parallax.
  const sections=$$('section[data-section-name]'); const railLinks=$$('.rail a[data-section]'); const navLinks=$$('.desktop-nav a'); const topbar=$('#topbar'); const progress=$('#scrollProgress');
  const updateScroll=()=>{
    const max=document.documentElement.scrollHeight-innerHeight; const ratio=max>0?scrollY/max:0; if(progress)progress.style.width=`${ratio*100}%`; topbar?.classList.toggle('compact',scrollY>40);
    let active='home';
    sections.forEach(sec=>{const r=sec.getBoundingClientRect();if(r.top<=innerHeight*.42)active=sec.id; if(!reduceMotion){const bg=sec.querySelector('.section-background'); if(bg){const d=(r.top+r.height/2-innerHeight/2)/innerHeight;bg.style.transform=`translate3d(0,${Math.max(-20,Math.min(20,d*-10))}px,0)`;}}});
    railLinks.forEach(a=>a.classList.toggle('active',a.dataset.section===active)); navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${active}`));
  }; addEventListener('scroll',updateScroll,{passive:true});updateScroll();

  // Counters.
  const counterObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,target=Number(el.dataset.count||0),start=performance.now();const run=now=>{const t=Math.min(1,(now-start)/850);el.textContent=Math.floor(target*(1-Math.pow(1-t,3)));if(t<1)requestAnimationFrame(run)};requestAnimationFrame(run);counterObs.unobserve(el)}),{threshold:.5});
  $$('[data-count]').forEach(el=>reduceMotion?el.textContent=el.dataset.count:counterObs.observe(el));

  // Tilt and magnetic interactions kept subtle so layout never jumps.
  if(finePointer&&!reduceMotion){
    $$('[data-tilt]').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(1200px) rotateX(${(-y*2.4).toFixed(2)}deg) rotateY(${(x*3.2).toFixed(2)}deg)`});card.addEventListener('pointerleave',()=>card.style.transform='')});
    $$('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)*.08,y=(e.clientY-r.top-r.height/2)*.08;el.style.transform=`translate3d(${x}px,${y}px,0)`});el.addEventListener('pointerleave',()=>el.style.transform='')});
  }

  // Credential lightbox.
  const lightbox=$('#lightbox'),lightboxImage=$('#lightboxImage');
  $$('[data-lightbox]').forEach(btn=>btn.addEventListener('click',()=>{if(!lightbox||!lightboxImage)return;lightboxImage.src=btn.dataset.lightbox;lightboxImage.alt=btn.querySelector('img')?.alt||'Credential';lightbox.showModal()}));
  $('#lightboxClose')?.addEventListener('click',()=>lightbox.close());lightbox?.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close()});

  // RadixOS gallery.
  const galleryItems=[
    ['assets/projects/radixos-workspace.png','Radix Nebula — Agent Workspace','Project-aware command surface with scope, provider routing, local search, Hydra intelligence and guarded execution.'],
    ['assets/projects/radixos-knowledge-map.png','Hydra Knowledge Map','Versioned local project intelligence exposing assets, code symbols, evidence relationships and source citations.'],
    ['assets/projects/radixos-repair-lab.png','Project Repair Lab','Diagnosis-first workflow that collects evidence and prepares bounded verification plans before modifications.'],
    ['assets/projects/radixos-control-layer.png','Control Layer','Unified capabilities for Time Machine, Decision Ledger, Memory, Agent Operations, system health and execution modes.'],
    ['assets/projects/radixos-approval-inbox.png','Approval Inbox','Human-control surface for high-risk side effects, scope, risk, tool and approval state before execution.']
  ];
  const gallery=$('#gallery'),galleryImage=$('#galleryImage'),galleryTitle=$('#galleryTitle'),galleryCaption=$('#galleryCaption'),galleryCounter=$('#galleryCounter');let galleryIndex=0;
  const renderGallery=()=>{const [src,title,cap]=galleryItems[galleryIndex];galleryImage.src=src;galleryTitle.textContent=title;galleryCaption.textContent=cap;galleryCounter.textContent=`${String(galleryIndex+1).padStart(2,'0')} / ${String(galleryItems.length).padStart(2,'0')}`};
  $$('.project-gallery-trigger').forEach(b=>b.addEventListener('click',()=>{galleryIndex=0;renderGallery();gallery.showModal()}));$('#galleryClose')?.addEventListener('click',()=>gallery.close());$('#galleryPrev')?.addEventListener('click',()=>{galleryIndex=(galleryIndex-1+galleryItems.length)%galleryItems.length;renderGallery()});$('#galleryNext')?.addEventListener('click',()=>{galleryIndex=(galleryIndex+1)%galleryItems.length;renderGallery()});gallery?.addEventListener('click',e=>{if(e.target===gallery)gallery.close()});

  // Full project dossiers. Each new entry is grounded in the shipped source pack,
  // while the original portfolio builds use the architecture already documented in this site.
  const projectDossiers={
    radixos:{
      verification:'SYSTEM DOSSIER',pack:'LOCAL CONTROL PLANE',boundary:'HUMAN-GATED EXECUTION',
      sourceMap:['Nebula workspace — project-aware operator surface','Hydra knowledge map — source-linked project intelligence','Approval Inbox — side-effect review and control','Project Repair Lab — evidence-first diagnosis path','Decision Ledger / Time Machine — persistent project history'],
      boundaries:['Project scope is explicit and local-first.','Reasoning is separated from side-effectful tool execution.','High-impact actions surface approval state instead of running invisibly.','Parallel agent work is isolated rather than sharing one uncontrolled workspace.','Evidence and source provenance stay visible through the control plane.'],      code:'03.01 // FLAGSHIP SYSTEM',kicker:'LOCAL-FIRST AI COMMAND ENVIRONMENT',title:'RADIXOS',status:'LOCAL // GUARDED',
      lead:'A Windows AI command environment designed around a simple rule: evidence before execution. It keeps project intelligence, memory, tools, approvals and parallel agent work inside an explicit local control plane.',
      what:'RadixOS turns a project workspace into an inspectable operating environment for AI-assisted engineering. Hydra indexes source-linked project knowledge; persistent memory and decision history preserve context; tools stay scoped; risky side effects pass through approval surfaces instead of being silently executed.',
      tags:['Electron','Node.js','SQLite / WAL','FTS5','MCP','Agent Mesh','Human Approval'],
      stats:[['40','DB TABLES'],['8','AGENT LANES'],['3','EXEC MODES'],['LOCAL','MEMORY']],
      capabilities:['Hydra source-linked project intelligence and evidence relationships.','Persistent memory, Decision Ledger and Time Machine-style project context.','Scoped MCP/tool access with explicit approval gates for high-impact actions.','Parallel agent workflows isolated with Git worktrees.','Repair and verification flows that gather evidence before proposing changes.'],
      architecture:['Nebula UI','Hydra Index','Local Memory','Guarded Tools','Agent Lanes','Approval Gate'],
      architectureText:'The interface sits above a local persistence and intelligence layer. Project context is indexed into Hydra, retrieved into bounded agent lanes, and passed to guarded tool adapters. Execution state and approvals are surfaced rather than hidden.',
      notes:['Local-first state is a product boundary, not just a visual theme.','The system distinguishes reasoning from execution and keeps side effects inspectable.','Agent isolation and approval state are visible in the interface so parallel work does not become invisible background automation.'],
      trace:['workspace scope → local project context','Hydra → source-linked symbols / evidence','agent lane → isolated worktree','tool request → policy + approval gate','verified action → persistent ledger'],
      images:[['assets/projects/deep/radixos-source-mark.svg','RADIXOS // MAIN BRAND MARK'],['assets/projects/radixos-workspace.png','NEBULA WORKSPACE'],['assets/projects/radixos-knowledge-map.png','HYDRA KNOWLEDGE MAP'],['assets/projects/radixos-repair-lab.png','PROJECT REPAIR LAB'],['assets/projects/radixos-control-layer.png','CONTROL LAYER'],['assets/projects/radixos-approval-inbox.png','APPROVAL INBOX']]
    },
    redjustice:{
      verification:'SYSTEM DOSSIER',pack:'INVESTIGATION PLATFORM',boundary:'ANALYST-IN-THE-LOOP',
      sourceMap:['Case intake and normalized entity layer','Money-flow graph and directional transaction relationships','Evidence-linked entity relationships','Tamper-evident integrity concepts','Analyst review surfaces and provenance views'],
      boundaries:['Graph links support investigation; they are not autonomous guilt determinations.','Evidence relationships remain traceable back to case artifacts.','Offline-first design reduces unnecessary movement of sensitive case material.','Final investigative conclusions remain with the human analyst.'],      code:'03.02 // NETWORK INTELLIGENCE',kicker:'OFFLINE-FIRST INVESTIGATION PLATFORM',title:'RED JUSTICE',status:'EVIDENCE // GRAPH',
      lead:'An offline-first criminal-network and evidence intelligence platform evolved from the original NCCRP fund-flow investigation utility.',
      what:'RED Justice expands transaction tracing into a broader investigation environment: entities can be resolved across evidence, money movement can be represented as a graph, and case material is handled with tamper-evident provenance instead of being reduced to disconnected rows.',
      tags:['Next.js','Prisma','SQLite','Graph Analysis','Cryptographic Integrity','DFIR'],
      stats:[['GRAPH','LINKS'],['LOCAL','DATA'],['TRACE','FUNDS'],['VERIFY','EVIDENCE']],
      capabilities:['Entity-centric investigation views that connect people, accounts, identifiers and evidence.','Fund-flow graphing for tracing transaction paths rather than reading isolated records.','Evidence-linked relationships so visual conclusions remain traceable to source material.','Tamper-evident handling concepts for preserving integrity across investigation artifacts.','Offline-first operation intended for controlled investigative environments.'],
      architecture:['Case Intake','Entity Resolve','Flow Graph','Evidence Store','Integrity Layer','Analyst Review'],
      architectureText:'The system concept separates case data, entity resolution, relationship analysis and evidence integrity. Graph views are an analyst surface over traceable source records, not an autonomous verdict engine.',
      notes:['This project grew from the narrower NCCRP Fund-Flow Tool shown later in the build index.','The portfolio presents RED Justice as investigation support; final conclusions stay with the analyst.','The visual language intentionally mirrors evidence provenance and network traversal.'],
      trace:['case evidence → normalized entities','transactions → directional money-flow edges','shared identifiers → relationship candidates','artifact → provenance + integrity state','graph insight → analyst verification'],
      images:[['assets/projects/red-justice-logo.png','RED JUSTICE // SYSTEM MARK'],['assets/projects/deep/nccrp-poster.png','ORIGIN // NCCRP FUND-FLOW']]
    },
    visiontrace:{
      verification:'SYSTEM DOSSIER',pack:'LOCAL VIDEO FORENSICS',boundary:'EVIDENCE-LINKED OUTPUT',
      sourceMap:['Video intake and frame pipeline','Deterministic object/track continuity','Transparent event logic','Scene-relationship reconstruction','Source timestamp/frame linkage'],
      boundaries:['Video processing is designed to stay local for sensitive evidence.','Reconstructed events are evidence-supported hypotheses rather than hidden model verdicts.','Tracks and relationships link back to timestamps/frames for analyst review.','Repeatable primitives are favored over opaque inference where possible.'],      code:'03.03 // VIDEO FORENSICS',kicker:'LOCAL-FIRST VIDEO EVIDENCE RECONSTRUCTION',title:'VISIONTRACE',status:'TRACE // RECONSTRUCT',
      lead:'A privacy-focused video-forensics system built around deterministic tracking, transparent event logic and evidence-linked scene reconstruction.',
      what:'VisionTrace is designed to turn video evidence into a reviewable sequence of tracked objects, events and scene relationships without hiding the reasoning path. The emphasis is on local processing, deterministic tracking primitives and links back to the original evidence.',
      tags:['Python','FastAPI','OpenCV','Computer Vision','DFIR','Scene Graphs'],
      stats:[['LOCAL','VIDEO'],['TRACK','OBJECTS'],['LINK','EVENTS'],['TRACE','SOURCE']],
      capabilities:['Video-evidence ingestion and frame-aware forensic processing.','Deterministic object/event tracking intended to remain reproducible.','Scene-graph style linking between observed objects, events and source evidence.','Transparent event logic so an analyst can inspect why a reconstruction exists.','Privacy-focused local processing for sensitive evidentiary material.'],
      architecture:['Video Intake','Frame Pipeline','Tracking','Event Logic','Scene Graph','Analyst Review'],
      architectureText:'A local processing pipeline turns video into frame-level observations, carries identity through deterministic tracking, then creates event and scene relationships that point back to evidence rather than replacing it.',
      notes:['The design prioritizes explainability over opaque “AI says so” conclusions.','Event reconstruction is presented as evidence-supported analysis, not ground truth.','Local-first operation reduces unnecessary movement of sensitive footage.'],
      trace:['video → frames + metadata','frames → detections / tracks','track continuity → event candidates','events → scene relationships','relationship → source timestamp / frame'],
      images:[['assets/projects/visiontrace-logo.png','VISIONTRACE // SYSTEM MARK']]
    },
    lowkie:{
      verification:'SYSTEM DOSSIER',pack:'LOCAL MODEL WORKBENCH',boundary:'ARTIFACT-FIRST EXPERIMENTS',
      sourceMap:['Dataset preparation pipeline','BPE/tokenization experiments','PyTorch training recipes','LoRA-style adapter path','Safetensors/checkpoint artifacts','Local evaluation and inference loop'],
      boundaries:['Training artifacts remain explicit and versionable.','Local inference reduces dependency on opaque hosted runtimes.','Dataset/tokenizer/training stages are separate so failures can be inspected.','Model output remains an experiment result, not an unquestioned authority.'],      code:'03.04 // LOCAL MODEL LAB',kicker:'SMALL-MODEL DEVELOPMENT WORKBENCH',title:'LOWKIE',status:'TRAIN // INFER',
      lead:'A local model-development workbench that connects dataset preparation, tokenization, training recipes, checkpoints and inference into one inspectable workflow.',
      what:'LOWKIE focuses on building and experimenting with smaller AI models locally. Instead of treating training as a black box, it exposes the path from raw examples and BPE/tokenization through PyTorch runs, LoRA-style adaptation, checkpoint artifacts and local inference.',
      tags:['PyTorch','LoRA','BPE','Safetensors','Local Inference','Datasets'],
      stats:[['DATA','BUILD'],['BPE','TOKENS'],['LORA','ADAPT'],['LOCAL','RUN']],
      capabilities:['Dataset preparation and repeatable training input workflows.','Tokenizer/BPE experimentation as part of the same project surface.','PyTorch training recipes with checkpoint-oriented iteration.','Parameter-efficient adaptation workflows such as LoRA.','Safetensors/checkpoint handling and local inference loops.'],
      architecture:['Dataset','Tokenizer','Training Recipe','Checkpoint','Adapter','Local Inference'],
      architectureText:'The workbench is organized as an artifact pipeline: training data and tokenization feed controlled runs; run outputs become versionable checkpoints/adapters; those artifacts then move into local evaluation and inference.',
      notes:['The project is positioned as a model-building lab, not a hosted black-box API wrapper.','Keeping artifacts explicit makes experiments easier to compare and reproduce.','The portfolio uses LOWKIE as the local-model layer alongside the security and agentic systems.'],
      trace:['examples → cleaned dataset','dataset → BPE/token stream','recipe → PyTorch training run','run → safetensor/checkpoint artifact','artifact → local inference / evaluation'],
      images:[['assets/projects/lowkie-logo.png','LOWKIE // MODEL LAB MARK']]
    },
    aureus:{
      verification:'SOURCE PACK // VERIFIED',pack:'43 PACK FILES // ELECTRON',boundary:'SANDBOX + HUMAN PUBLISH GATE',
      sourceMap:['electron/main.mjs — providers, persistence, Gemini gateway and publishing','electron/preload.cjs — narrow allowlisted renderer bridge','electron/provider-config.mjs — fixed provider definitions and limits','src/App.tsx — React operator surface','src/lib/trends.ts — trend and signal processing helpers','docs/ARCHITECTURE.md + docs/OPPORTUNITY_RADAR.md — documented runtime/data flow'],
      boundaries:['Renderer runs with context isolation, sandboxing and no Node integration.','Provider keys are encrypted through Electron safeStorage and stay out of renderer state.','Provider failures remain explicit; cached data is labeled instead of faked as live.','Files are size/signature/MIME validated before model or publishing workflows.','LinkedIn publication is separated behind exact final human approval.'],      code:'03.05 // REAL-DATA INTELLIGENCE',kicker:'WINDOWS DESKTOP // EVIDENCE-GROUNDED',title:'AUREUS INTELLIGENCE',status:'LIVE DATA // GROUNDED',
      lead:'A Windows-first desktop intelligence system that aggregates real technology, world, cybersecurity, research and career signals, then allows evidence-grounded analysis without fabricating fallback data.',
      what:'Aureus starts empty and earns every item through a real provider or an explicitly marked cache. Its connectors pull heterogeneous feeds into a normalized intelligence surface; Opportunity Radar combines vacancy and learning signals; Gemini analysis is bounded by retrieved evidence; LinkedIn achievement publishing is separated behind an exact approval step.',
      tags:['Electron 37','React 19','TypeScript','Gemini','safeStorage','RSS / APIs','Career Radar'],
      stats:[['REAL','DATA'],['19+','SOURCES'],['OS','SECRETS'],['GATED','PUBLISH']],
      capabilities:['Multi-provider synchronization across news, security, research, developer and career sources with partial-success handling.','Opportunity Radar that joins jobs, watchlists, learning signals, skill demand and rising-signal scoring.','Explicit live/cached/error source states instead of fake “success” data.','Evidence-grounded Gemini workflows with retrieved context kept distinct from executable actions.','Approval-gated LinkedIn achievement publishing plus attachment/file validation.','Credential storage through Electron safeStorage rather than putting provider keys into renderer state.'],
      architecture:['React Renderer','Allowlisted Preload','Electron Main','Provider Connectors','Atomic JSON State','safeStorage'],
      architectureText:'The sandboxed React renderer crosses a narrow preload bridge into Electron main. Main owns network providers, atomic persistence and OS-backed encrypted credentials. Provider responses are normalized before the UI or Gemini analysis consumes them.',
      notes:['contextIsolation and sandboxing are enabled; Node integration is not exposed to the renderer.','Chromium-backed networking follows the machine’s Windows proxy, DNS, VPN and certificate environment.','Provider failure remains visible; cached records are marked as cached instead of being passed off as current.','LinkedIn publication requires explicit final approval and does not infer publishing permission from analysis.'],
      trace:['provider connectors → raw external signal','normalizer → typed intelligence record','state layer → live / cached / error provenance','retrieval → bounded evidence packet','Gemini → grounded synthesis','publish intent → exact human approval'],
      images:[['assets/projects/deep/aureus-logo.png','AUREUS INTELLIGENCE // OFFICIAL MARK'],['assets/projects/deep/aureus-architecture.svg','AUREUS // SOURCE-LINKED ARCHITECTURE']]
    },
    contentstudio:{
      verification:'SOURCE PACK // VERIFIED',pack:'47 PACK FILES // PYTHON',boundary:'VALIDATE BEFORE PUBLISH',
      sourceMap:['native_app/app_shell.py — native application shell and page orchestration','native_app/services/generation_service.py — WYR, story and facts generation logic','native_app/services/tts_service.py — neural narration and word-boundary timing','native_app/services/render_service.py — FFmpeg composition and media timing','native_app/services/automation_service.py — queue, schedule and retention state machine','native_app/services/upload_service.py — YouTube OAuth upload path','native_app/services/validation_service.py — finished-render release gate'],
      boundaries:['Render output passes validation before it can enter the publishing flow.','YouTube publishing uses OAuth rather than embedded account credentials.','Duplicate hashes and recent-content memory reject repeated scripts/facts.','Entertainment percentages are generated presentation content, not represented as survey measurements.','Temporary artifacts are registered for controlled cleanup instead of ad-hoc deletion.'],      code:'03.06 // MEDIA AUTOMATION',kicker:'NATIVE WINDOWS // SHORT-FORM PRODUCTION',title:'AI CONTENT STUDIO',status:'GENERATE // VALIDATE',
      lead:'A native Windows production pipeline for automated 9:16 video formats with neural narration, media synchronization, FFmpeg rendering, validation, scheduling and YouTube publishing.',
      what:'The studio supports three distinct short-form pipelines: Would You Rather rounds, Reddit/Minecraft stories and Interesting Facts. Generation is not the final step: scripts are deduplicated, narration timing drives captions and scene duration, media is rendered through FFmpeg, output is validated, and approved jobs can enter a scheduled upload workflow.',
      tags:['Python','PySide6','FFmpeg','Edge TTS','SQLite','Gemini','YouTube OAuth'],
      stats:[['3','FORMATS'],['9:16','VIDEO'],['TTS','NEURAL'],['QUEUE','AUTO']],
      capabilities:['Would You Rather generation with A/B imagery, countdown/ticking, percentage reveal and narration-aware round timing.','Reddit/Minecraft story mode with neural narration, short word-boundary captions and chopped/muted gameplay backgrounds.','Interesting Facts mode with five subject-grounded images, narration-linked timing and memory to avoid reused facts.','Natural voice pipeline using Edge neural voices plus compression, EQ, limiting and music ducking, with Windows TTS fallback.','Full automation service that tracks ready-pool generation, scheduling slots, uploads, validation state and retention cleanup.','YouTube publishing through OAuth rather than embedded account credentials.'],
      architecture:['PySide6 UI','Generation Service','TTS + Media','FFmpeg Render','Validation','Scheduler / Upload'],
      architectureText:'The native UI orchestrates generation and state services backed by local SQLite. Content/script generation feeds voice and image/media acquisition; render_service composes the result through FFmpeg; validation gates finished media before automation/upload services schedule approved jobs.',
      notes:['Duplicate-script rejection and round/fact memory reduce repeated content.','Caption timing is tied to speech word boundaries instead of arbitrary fixed intervals.','The automation loop tracks generation, validation, approval, schedule and retention as separate states.','Generated audience percentages in the entertainment format are presentation content, not claimed survey measurements.'],
      trace:['format config → script generation','script → duplicate / memory checks','text → neural speech + word boundaries','media + timing → FFmpeg composition','render → validation','approved output → schedule → YouTube OAuth'],
      images:[['assets/projects/deep/content-studio-logo-white-transparent.png','AI CONTENT STUDIO // APPROVED LOGO'],['assets/projects/deep/content-studio-architecture.svg','CONTENT STUDIO // PRODUCTION PIPELINE']]
    },
    signaldesk:{
      verification:'SOURCE PACK // VERIFIED',pack:'118 PACK FILES // FLASK',boundary:'LOCAL DEFAULT // REVIEW REQUIRED',
      sourceMap:['portal.py — DispatcherMiddleware entrypoint mounting both applications','apps/notice-studio/notice_app/services/excel_parser.py — spreadsheet intake and aliasing','apps/notice-studio/notice_app/services/docx_engine.py — template-preserving notice generation','apps/investigation-engine/investigation_app/pipeline/extraction.py — evidence text extraction','apps/investigation-engine/investigation_app/pipeline/hashing.py — artifact hashing','apps/investigation-engine/investigation_app/pipeline/relationships.py — bounded relationship construction','apps/investigation-engine/investigation_app/services/report_service.py — reviewable exports'],
      boundaries:['Standard analysis is deterministic and local-first.','Generated email files are drafts; the system does not claim they were transmitted.','Model-assisted Smart/Deep analysis is optional and does not replace analyst verification.','Relationship edges are evidence/co-occurrence signals rather than autonomous conclusions.','Generated notices are neutral workflow artifacts, not legal orders or legal advice.'],      code:'03.07 // OPERATIONS + EVIDENCE',kicker:'LOCAL-FIRST // NOTICE + INVESTIGATION SUITE',title:'SIGNAL DESK',status:'LOCAL // REVIEWABLE',
      lead:'A local-first operations portal made of two Flask applications: Notice Studio for transaction-driven document work and Investigation Engine for evidence extraction, linking, search, timelines and reporting.',
      what:'Notice Studio imports spreadsheet transaction rows, validates and edits them, then produces neutral DOCX notices, unsent .eml drafts and a delivery manifest. Investigation Engine ingests mixed office files, PDFs, images, email, logs, CSV/XLSX, HTML/XML, archives and code-like text; it extracts indicators and entities, hashes/indexes artifacts, builds similarity/relationship views and exports analyst-reviewable reports.',
      tags:['Flask','SQLite','SQLAlchemy','DOCX','PDF','Entity Extraction','Gemini Optional'],
      stats:[['2','APPS'],['LOCAL','DEFAULT'],['HASH','EVIDENCE'],['DOCX','EXPORT']],
      capabilities:['Notice Studio spreadsheet intake with column aliasing, row validation, review/edit/filter and template-preserving DOCX generation.','Unsent EML drafting plus delivery_manifest.csv instead of pretending an email was transmitted.','Investigation evidence intake across common document, archive, structured-data and text formats.','Deterministic extraction of emails, IPs, URLs, UPI/IFSC, IMEI/ICCID, GPS, crypto addresses, hashes, MACs, social handles, UTRs, phones/accounts and dates.','Bounded co-occurrence relationship graphs, duplicate/similarity analysis, full-text search, timelines and summaries.','Report export to Markdown, JSON, PDF and DOCX; optional Smart/Deep analysis can use a local assistant or Gemini.'],
      architecture:['Flask Portal','/notices','/investigations','Extract + Hash','Entity / Graph Index','Report Export'],
      architectureText:'A DispatcherMiddleware portal mounts two separate Flask apps. Notice Studio follows spreadsheet → validated record → document/email-draft/manifest. Investigation Engine follows intake → extraction/hash/index → entities/transactions/communications → relationships/search/timeline → human-reviewed report.',
      notes:['Standard mode is deterministic and local-first; model-assisted Smart/Deep modes are optional.','Notice generation deliberately stays neutral and does not claim to create subpoenas, warrants or legal advice.','Relationship edges are bounded evidence/co-occurrence signals and should be reviewed by an analyst.','Template replacement handles split DOCX runs so placeholders can be filled without flattening the original document styling.'],
      trace:['xlsx row → alias + validation → notice record','record → DOCX / unsent EML / manifest','evidence → hash + extractor','entities → bounded relationship graph','search/timeline → analyst synthesis','reviewed case → MD / JSON / PDF / DOCX'],
      images:[['assets/projects/deep/signal-desk-logo-purple-transparent.png','SIGNAL DESK // APPROVED LOGO'],['assets/projects/deep/signal-desk-architecture.svg','SIGNAL DESK // OPERATIONS ARCHITECTURE']]
    },
    jacobian:{
      verification:'SOURCE PACK // VERIFIED',pack:'169 PACK FILES // TAURI',boundary:'RESOLVE → PREVIEW → CONFIRM',
      sourceMap:['apps/desktop/src-tauri/src/intent.rs — local intent handling','apps/desktop/src-tauri/src/resolver.rs — trusted target resolution','apps/desktop/src-tauri/src/permissions.rs — policy and one-use confirmation','apps/desktop/src-tauri/src/actions.rs — named native action adapters','apps/desktop/src-tauri/src/code_lab.rs — bounded coding-lab execution','apps/desktop/src/data/curriculum.ts — sequenced learning curriculum','apps/desktop/src/services/localTutor.ts — persistent Socratic tutor behavior'],
      boundaries:['Normal assistant operation does not expose a general-purpose shell.','Destructive requests and caller-supplied executable paths remain blocked.','Sensitive native actions require policy preview and one-use confirmation tokens.','Gemini cannot directly choose arbitrary filesystem paths, URLs or native adapters.','Learning state stays local; Gemini credentials are stored outside app SQLite in Windows Credential Manager.'],      code:'03.08 // LOCAL AI + TUTOR',kicker:'TAURI WINDOWS ASSISTANT // STRUCTURED LEARNING',title:'JACOBIAN',status:'LOCAL // PERMISSIONED',
      lead:'A local-first desktop AI assistant paired with a structured programming tutor: voice and desktop actions on one side, long-term learning plans, quizzes, notes and a bounded coding lab on the other.',
      what:'Jacobian supports wake phrases, typed/microphone/tray/overlay entry and trusted opening of local resources, while separating language understanding from execution. Its tutor contains 51 sequenced modules across Java-to-industry full stack, Python-to-AI/ML/RAG and C-to-comprehensive DSA, with persistent progress, quizzes, planning, notes and study-library material.',
      tags:['Tauri 2','Rust','React','TypeScript','SQLite','Vosk','Gemini Optional'],
      stats:[['51','MODULES'],['3','TRACKS'],['LOCAL','VOICE'],['1×','CONFIRM']],
      capabilities:['Offline wake phrases and Vosk-based voice path with typed, microphone, tray, overlay and Ctrl+Space entry points.','Trusted app/folder/file and validated HTTPS opening through fixed native adapters rather than free-form shell execution.','Three sequenced learning tracks totaling 51 modules, plus quizzes, notes, planner/reminders and Study Library document intake.','Bounded coding lab with predefined tests, time limits, input/output caps and heuristic complexity coaching.','Optional Gemini for ambiguity/assistant reasoning while keeping file resolution and action policy local.','One-use permission previews/confirmations for sensitive native actions.'],
      architecture:['React UI','Local Parser / Gemini','Resolver','Policy Preview','1× Confirmation','Rust Action Adapter'],
      architectureText:'Language understanding and native execution are deliberately separate. A proposal is interpreted, locally resolved, passed through policy/preview and one-time confirmation, then executed only through named Tauri/Rust commands. SQLite persists learning and local state; Vosk powers the voice sidecar.',
      notes:['Normal assistant operation does not expose a general shell.','Cloud model output cannot select arbitrary filesystem paths, URLs or native adapters on its own.','The coding lab is bounded, but it is not presented as a hostile-code security sandbox.','The Gemini key is stored in Windows Credential Manager rather than application SQLite, source or logs.'],
      trace:['voice / text → intent proposal','proposal → local resolver','resolved target → policy preview','sensitive action → one-use confirmation','confirmed proposal → named Rust adapter','result → local history / tutor state'],
      images:[['assets/projects/deep/jacobian-icon.svg','JACOBIAN // SOURCE ICON'],['assets/projects/deep/jacobian-architecture.svg','JACOBIAN // GUARDED ACTION FLOW'],['assets/projects/deep/jacobian-app-icon.png','WINDOWS APP ICON']]
    },
    jordan:{
      verification:'SOURCE PACK // VERIFIED',pack:'STATIC FRONTEND // LAB MODEL',boundary:'AUTHORIZED / SIMULATED ONLY',
      sourceMap:['index.html — single-page shell','app.js — seven-view command center and simulated assessment dataset','style.css — neon-yellow security-console visual system','app_server_check.py — local serving/runtime check','README.md — explicit frontend-only and no-real-scan scope'],
      boundaries:['The shipped UI uses simulated local assessment data and does not perform real scanning.','No exploitation, credential attacks or persistence are implemented.','Target authorization is represented before reconnaissance in the workflow.','Deterministic rule evidence stays labeled separately from ML anomaly signals.','ML metrics are demonstration telemetry and do not prove compromise or exploitability.'],      code:'03.09 // SECURITY COMMAND CENTER',kicker:'AUTHORIZED LAB // SENTINEL ML AUDIT UI',title:'JORDAN',status:'SIMULATED // AUDIT',
      lead:'A compact local-first frontend command center that visualizes an authorized security-assessment pipeline from target authorization through service inventory, deterministic rules, ML anomaly classification, findings and audit history.',
      what:'Jordan is intentionally a presentation/control layer rather than an offensive scanner. The shipped frontend uses simulated local assessment data for an authorized lab target and organizes it into Overview, Recon, Assets, Findings, ML Intelligence, Reports and Audit Log views. It demonstrates how evidence labels and model signals can stay visible throughout a security workflow.',
      tags:['Vanilla JavaScript','HTML','CSS','Nmap Model','Random Forest UI','Audit Trail'],
      stats:[['7','VIEWS'],['LAB','TARGET'],['10','ML FEATURES'],['0','EXPLOITS']],
      capabilities:['Target authorization surface before any reconnaissance stage is represented.','Normalized service inventory modeled from Nmap-style discovery and XML parsing.','Deterministic version-rule findings kept distinct from ML anomaly output.','Random-Forest demonstration panel using a compact ten-feature service vector.','Evidence-chain labels, reports and audit events exposed in a single operator UI.','No credential attacks, persistence, exploitation or real scanning implemented in the shipped frontend.'],
      architecture:['Authorization UI','Nmap Representation','Service Normalize','Version Rules','ML Classifier','Findings / Audit'],
      architectureText:'The static HTML/CSS/JavaScript interface models a pipeline of authorization → reconnaissance → normalized services → deterministic rules → anomaly classifier → findings/reports/audit. The current source intentionally feeds that pipeline simulated local-lab data.',
      notes:['The source uses an RFC1918-style lab target and labels the workflow as authorized.','Jordan is useful as a UI/interaction prototype for an eventual assessment backend, not as evidence that real scanning currently occurs.','Rule findings and ML signals remain separately labeled so model output does not masquerade as deterministic proof.'],
      trace:['operator → authorization gate','lab dataset → service inventory','service/version → deterministic rules','feature vector → RF anomaly score','evidence labels → finding','finding → report + audit event'],
      images:[['assets/projects/deep/jordan-logo-blue-orange-transparent.png','JORDAN // APPROVED LOGO'],['assets/projects/deep/jordan-architecture.svg','JORDAN // AUTHORIZED LAB PIPELINE']]
    },
    onyx:{
      verification:'SOURCE PACK // VERIFIED',pack:'49 PACK FILES // NEXT.JS',boundary:'RLS + HUMAN MODERATION',
      sourceMap:['app/onyx-app.tsx — marketplace product UI and real-data states','lib/marketplace.ts — public/private marketplace projection','lib/request-security.ts — same-origin and request controls','lib/image-safety.ts — metadata removal and image hardening','lib/content-safety.ts + lib/alias-safety.ts — deterministic abuse checks','supabase/migrations/0004_marketplace_workflow_and_moderation.sql — protected workflow RPCs','supabase/migrations/0005_account_enforcement_and_ai_moderation.sql — enforcement and moderation layer'],
      boundaries:['Supabase RLS/RPCs enforce authorization beyond client UI state.','Public projections exclude private contact details, precise location and internal identifiers.','Listing images are re-encoded to strip metadata and stored in a private bucket.','AI moderation is advisory; every new listing remains human-gated.','No analytics or advertising tracker is bundled into the application.'],      code:'03.10 // PRIVACY MARKETPLACE',kicker:'VERIFIED CAMPUS MARKETPLACE // PRIVACY-BY-DESIGN',title:'ONYX',status:'RLS // HUMAN GATE',
      lead:'A Vercel-ready campus marketplace for verified students that keeps public identity coarse, private interactions protected and moderation enforceable at the database boundary.',
      what:'ONYX supports sale and wanted listings, saved items, comparison, private offers, real-time messaging, reports, dashboard inventory and notifications. Public surfaces use aliases and coarse residence information; internal identifiers, precise location and direct contact are not projected publicly. New listings pass human approval, and AI moderation remains advisory rather than silently publishing or banning.',
      tags:['Next.js 16','React 19','TypeScript','Supabase','RLS','Realtime','Gemini Optional'],
      stats:[['RLS','DB'],['8MB','WEBP'],['HUMAN','APPROVAL'],['0','TRACKERS']],
      capabilities:['Alias-first public marketplace for sale and wanted listings with saved items and comparison.','Private offer lifecycle, messages, notifications and moderation threads backed by authenticated Supabase RPC/RLS boundaries.','Realtime messaging without exposing private contact information on public listing surfaces.','Image pipeline that decodes, resizes and re-encodes JPG/PNG/WebP uploads to strip EXIF/GPS metadata, then stores private WebP objects.','English and Romanized-Hindi abuse checks plus timed suspension/restoration and admin disablement enforced through database state.','Optional multimodal/Gemini pre-check and inventory-grounded read-only assistant; human approval still gates every new listing.'],
      architecture:['Next.js App','Supabase Auth','RPC + RLS','Realtime / Storage','Moderation Gate','Human Approval'],
      architectureText:'The Next.js app uses Supabase Postgres/Auth/Realtime/Storage as the trust boundary. Authenticated RPCs and RLS enforce data visibility and mutations. Listing images are sanitized before private storage and exposed through signed URLs. Optional model calls run server-side as advisory checks.',
      notes:['The app contains no sample-data fallback pretending the marketplace is populated.','Public projections exclude email, internal IDs, precise location and contact details.','Model-assisted moderation is advisory; every new listing still requires human approval.','The app intentionally ships without analytics/tracking.','Write flows are checked through session/origin/database rules rather than trusting client UI state.'],
      trace:['student session → Supabase auth','listing input → validation + image re-encode','record → RPC / RLS enforcement','optional AI precheck → advisory signal','moderation queue → human approval','approved listing → public alias projection'],
      images:[['assets/projects/deep/onyx-icon.svg','ONYX // SYSTEM ICON'],['assets/projects/deep/onyx-architecture.svg','ONYX // PRIVACY + MODERATION ARCHITECTURE'],['assets/projects/deep/onyx-wave.webp','ONYX WAVE'],['assets/projects/deep/onyx-cathedral.webp','CATHEDRAL COURTYARD'],['assets/projects/deep/onyx-alias.webp','ALIAS MANIFESTO'],['assets/projects/deep/onyx-red-sun.webp','RED SUN TEMPLE'],['assets/projects/deep/onyx-gothic.webp','GOTHIC MOON CATHEDRAL']]
    },
    nccrp:{
      verification:'SUPPLIED IDENTITY + SYSTEM HISTORY',pack:'ORIGIN SYSTEM',boundary:'INVESTIGATOR REVIEW',
      sourceMap:['Transaction rows / account identifiers','Normalization of sender and receiver entities','Directional fund-flow links','Investigator-facing trace path','Operational lessons carried into RED Justice'],
      boundaries:['The tool supports tracing; it does not make autonomous legal conclusions.','Fund-flow links remain reviewable against the original transaction records.','The portfolio keeps the origin system distinct from the later RED Justice expansion.'],      code:'03.11 // ORIGIN SYSTEM',kicker:'CYBER POLICE // FUND-FLOW INVESTIGATION UTILITY',title:'NCCRP FUND-FLOW TOOL',status:'ORIGIN // TRACE',
      lead:'The original internal investigation utility built to simplify bank-fraud transaction tracing during Cyber Police work, and the system seed that later expanded into RED Justice.',
      what:'The NCCRP Fund-Flow Tool was created around a practical investigator problem: transaction chains become hard to follow when case data is spread across rows and accounts. The tool focused the workflow on following money movement, mapping linked accounts and keeping the path understandable enough for day-to-day fraud investigation.',
      tags:['Cybercrime','Financial Fraud','Fund Flow','Investigation Support','Origin System'],
      stats:[['TRACE','FUNDS'],['MAP','LINKS'],['CASE','SUPPORT'],['→','RED JUSTICE']],
      capabilities:['Transaction-centric tracing for bank-fraud investigation workflows.','Linked-account/fund-flow mapping intended to reduce manual path following.','Investigator-facing presentation rather than opaque autonomous conclusions.','Served as the architectural and product seed for the broader RED Justice platform.'],
      architecture:['Case Rows','Normalize','Account Links','Fund Flow','Analyst Trace','RED Justice'],
      architectureText:'The origin system stays deliberately narrower than RED Justice: receive investigation transaction data, normalize the relevant identifiers, map directional account/fund relationships and present the trail for analyst review.',
      notes:['Built from a real operational need encountered during Cyber Police exposure.','The portfolio keeps this as a distinct origin artifact rather than rewriting history and pretending RED Justice appeared fully formed.','The supplied NCCRP visual is used directly as the project identity in this portfolio build.'],
      trace:['transaction rows → normalized records','sender / receiver → account nodes','movement → directional flow edge','linked flows → investigation path','operational lessons → RED Justice evolution'],
      images:[['assets/projects/deep/nccrp-poster.png','NCCRP FUND-FLOW // FULL SYSTEM ART'],['assets/projects/deep/nccrp-mark.jpg','NCCRP // CARD MARK']]
    },
    hydra:{
      verification:'SUPPLIED IDENTITY + SYSTEM DOSSIER',pack:'INTELLIGENCE LAYER',boundary:'SOURCE-LINKED CONTEXT',
      sourceMap:['Project sources and files','Asset / symbol extraction','Evidence and failure nodes','Relationship fabric','Retrieval packet','Bounded agent/model context'],
      boundaries:['Hydra augments rather than replaces the source repository.','Retrieved facts preserve source provenance for verification.','Relationship-aware retrieval is intended to reduce unsupported guesses, not create hidden truth.','Downstream agents receive bounded context rather than unconstrained project access.'],      code:'03.12 // INTELLIGENCE LAYER',kicker:'SOURCE-LINKED PROJECT INTELLIGENCE',title:'HYDRA FABRIC',status:'INDEX // CORRELATE',
      lead:'A project-intelligence layer for mapping source-linked assets, symbols, evidence, failures and relationships before deeper model reasoning occurs.',
      what:'Hydra Fabric is the intelligence concept behind giving an agent more than a flat pile of files. It organizes project facts into a relationship fabric with source linkage so later reasoning can retrieve the relevant symbols, evidence and failure context while preserving where each piece of knowledge came from.',
      tags:['Project Intelligence','Source Linking','Relationships','Evidence','Retrieval','Agent Context'],
      stats:[['MAP','ASSETS'],['LINK','SYMBOLS'],['TRACE','SOURCE'],['FEED','AGENTS']],
      capabilities:['Project asset and symbol mapping instead of unstructured file-only context.','Relationship links between source, evidence, failures and relevant project entities.','Source provenance retained so retrieved context can be verified.','Context selection before deeper model reasoning to reduce unsupported guesses.','Designed as an intelligence layer that can feed bounded agent workflows such as those in RadixOS.'],
      architecture:['Sources','Assets / Symbols','Evidence','Relationship Fabric','Retrieval','Model Context'],
      architectureText:'Hydra’s conceptual flow is ingest/index → entity/symbol extraction → source-linked relationship mapping → retrieval → bounded model context. The key design goal is preserving provenance while making project structure queryable.',
      notes:['Hydra is an intelligence layer, not a replacement for the source repository.','Retrieval should surface source-linked evidence so agent reasoning remains inspectable.','The supplied Hydra Fabric artwork is now used as the card identity and full dossier visual.'],
      trace:['source tree → indexed assets','symbols / facts → typed nodes','evidence / failures → linked context','query → relationship-aware retrieval','retrieved packet → deeper model reasoning'],
      images:[['assets/projects/deep/hydra-poster.png','HYDRA FABRIC // FULL SYSTEM ART'],['assets/projects/deep/hydra-mark.jpg','HYDRA // CARD MARK']]
    }
  };

  const projectAccents={
    radixos:['#f6ff00','#00f5df','RADIX // SOURCE ID'],
    redjustice:['#ff4852','#f6ff00','RED // INVESTIGATION'],
    visiontrace:['#00f5df','#f6ff00','VISION // FORENSICS'],
    lowkie:['#f6ff00','#00f5df','LOWKIE // MODEL LAB'],
    aureus:['#d2a643','#f6ff00','AUREUS // LIVE SIGNAL'],
    contentstudio:['#f1f3f4','#00f5df','CONTENT // MEDIA PIPELINE'],
    signaldesk:['#9f58ff','#d674ff','SIGNAL // EVIDENCE OPS'],
    jacobian:['#ff7e00','#f6ff00','JACOBIAN // GUARDED LOCAL'],
    jordan:['#238bff','#ff8c00','JORDAN // AUTH LAB'],
    onyx:['#cacaca','#f6ff00','ONYX // PRIVACY'],
    nccrp:['#f6ff00','#00f5df','NCCRP // ORIGIN'],
    hydra:['#f6ff00','#00f5df','HYDRA // INTELLIGENCE']
  };
  const projectDetail=$('#projectDetail');
  const detailEls={
    code:$('#projectDetailCode'),image:$('#projectDetailImage'),mediaLabel:$('#projectDetailMediaLabel'),status:$('#projectDetailStatus'),gallery:$('#projectDetailGallery'),trace:$('#projectDetailTrace'),kicker:$('#projectDetailKicker'),title:$('#projectDetailTitle'),lead:$('#projectDetailLead'),tags:$('#projectDetailTags'),stats:$('#projectDetailStats'),what:$('#projectDetailWhat'),capabilities:$('#projectDetailCapabilities'),architecture:$('#projectDetailArchitecture'),architectureText:$('#projectDetailArchitectureText'),notes:$('#projectDetailNotes'),verification:$('#projectDetailVerification'),pack:$('#projectDetailPack'),boundary:$('#projectDetailBoundary'),sourceMap:$('#projectDetailSourceMap'),boundaries:$('#projectDetailBoundaries'),accentLabel:$('#projectDetailAccentLabel')
  };
  let activeDossier=null;
  const fillList=(el,items)=>{if(!el)return;el.innerHTML='';items.forEach(text=>{const li=document.createElement('li');li.textContent=text;el.appendChild(li)})};
  const renderDetailImage=(d,index=0)=>{
    if(!d?.images?.length||!detailEls.image)return;
    const [src,label]=d.images[index];
    detailEls.image.style.opacity='0'; detailEls.image.style.transform='scale(.985)';
    setTimeout(()=>{detailEls.image.src=src;detailEls.image.alt=`${d.title} — ${label}`;detailEls.mediaLabel.textContent=label;detailEls.image.style.opacity='1';detailEls.image.style.transform='none'},90);
    $$('.detail-thumb',detailEls.gallery).forEach((b,i)=>b.classList.toggle('active',i===index));
  };
  const openProjectDetail=id=>{
    const d=projectDossiers[id];if(!d||!projectDetail)return;
    activeDossier=id;
    const accent=projectAccents[id]||['#f6ff00','#00f5df','SYSTEM IDENTITY'];
    projectDetail.style.setProperty('--project-accent',accent[0]);
    projectDetail.style.setProperty('--project-accent-2',accent[1]);
    projectDetail.dataset.activeProject=id;
    if(detailEls.accentLabel)detailEls.accentLabel.textContent=accent[2];
    detailEls.code.textContent=d.code;detailEls.kicker.textContent=d.kicker;detailEls.title.textContent=d.title;detailEls.lead.textContent=d.lead;detailEls.status.textContent=d.status;detailEls.what.textContent=d.what;detailEls.architectureText.textContent=d.architectureText;detailEls.verification.textContent=d.verification||'PROJECT DOSSIER';detailEls.pack.textContent=d.pack||'SYSTEM INDEX';detailEls.boundary.textContent=d.boundary||'BOUNDARY // EXPLICIT';
    detailEls.tags.innerHTML='';d.tags.forEach(text=>{const el=document.createElement('span');el.textContent=text;detailEls.tags.appendChild(el)});
    detailEls.stats.innerHTML='';d.stats.forEach(([value,label])=>{const el=document.createElement('div');el.className='detail-stat';const b=document.createElement('b'),s=document.createElement('span');b.textContent=value;s.textContent=label;el.append(b,s);detailEls.stats.appendChild(el)});
    fillList(detailEls.capabilities,d.capabilities);fillList(detailEls.notes,d.notes);fillList(detailEls.sourceMap,d.sourceMap||['System architecture documented in portfolio dossier.']);fillList(detailEls.boundaries,d.boundaries||['Human review remains the final control point.']);
    detailEls.architecture.innerHTML='';d.architecture.forEach(text=>{const el=document.createElement('span');el.className='architecture-node';el.textContent=text;detailEls.architecture.appendChild(el)});
    detailEls.trace.innerHTML='';d.trace.forEach((text,i)=>{const el=document.createElement('div');el.textContent=`${String(i+1).padStart(2,'0')} // ${text}`;detailEls.trace.appendChild(el)});
    detailEls.gallery.innerHTML='';d.images.forEach(([src,label],i)=>{const b=document.createElement('button');b.type='button';b.className=`detail-thumb${i===0?' active':''}`;b.setAttribute('aria-label',`Show ${label}`);const img=document.createElement('img');img.src=src;img.alt='';const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');b.append(img,n);b.addEventListener('click',e=>{e.stopPropagation();renderDetailImage(d,i)});detailEls.gallery.appendChild(b)});
    renderDetailImage(d,0);
    if(!projectDetail.open)projectDetail.showModal();
    projectDetail.querySelector('.project-detail-shell')?.scrollTo({top:0,behavior:'auto'});
    flashToast?.(`DOSSIER // ${d.title}`);
  };
  window.openProjectDetail=openProjectDetail;
  $$('[data-project]').forEach(card=>{
    card.addEventListener('click',e=>{if(e.target.closest('a,button'))return;openProjectDetail(card.dataset.project)});
    card.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('a,button')){e.preventDefault();openProjectDetail(card.dataset.project)}});
  });
  $('#projectDetailClose')?.addEventListener('click',()=>projectDetail.close());
  projectDetail?.addEventListener('click',e=>{if(e.target===projectDetail)projectDetail.close()});

  // Toast + overdrive easter eggs.
  const toast=$('#systemToast'),easterOverlay=$('#easterOverlay');let toastTimer;
  const flashToast=(message)=>{if(!toast)return;toast.querySelector('b').textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1900)};
  const toggleOverdrive=()=>{const active=document.body.classList.toggle('overdrive');flashToast(active?'OVERDRIVE // ARMED':'OVERDRIVE // DISARMED')};
  let brandClicks=[];$('#brandTrigger')?.addEventListener('click',()=>{const now=Date.now();brandClicks=brandClicks.filter(t=>now-t<2200);brandClicks.push(now);if(brandClicks.length>=5){brandClicks=[];toggleOverdrive()}});
  const konami=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];let ki=0;document.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;if(key===konami[ki]){ki++;if(ki===konami.length){ki=0;toggleOverdrive();easterOverlay?.classList.add('show');easterOverlay?.setAttribute('aria-hidden','false');setTimeout(()=>{easterOverlay?.classList.remove('show');easterOverlay?.setAttribute('aria-hidden','true')},2400)}}else ki=key===konami[0]?1:0});

  // Command palette.
  const commands=[
    ['Go // Sentinel Visual Lab','00.9',()=>location.hash='#sentinel'],
    ['Go // Music Visualizer','FM.09',()=>location.hash='#frequency'],
    ['Go // Profile','01',()=>location.hash='#profile'],['Go // Fieldwork','02',()=>location.hash='#experience'],['Go // Builds','03',()=>location.hash='#projects'],['Go // Research','04',()=>location.hash='#research'],['Go // Proof','05',()=>location.hash='#credentials'],['Go // Contact','06',()=>location.hash='#contact'],
    ['Inspect // RadixOS','03.01',()=>openProjectDetail('radixos')],['Inspect // RED Justice','03.02',()=>openProjectDetail('redjustice')],['Inspect // VisionTrace','03.03',()=>openProjectDetail('visiontrace')],['Inspect // LOWKIE','03.04',()=>openProjectDetail('lowkie')],
    ['Inspect // Aureus Intelligence','03.05',()=>openProjectDetail('aureus')],['Inspect // AI Content Studio','03.06',()=>openProjectDetail('contentstudio')],['Inspect // Signal Desk','03.07',()=>openProjectDetail('signaldesk')],['Inspect // Jacobian','03.08',()=>openProjectDetail('jacobian')],['Inspect // Jordan','03.09',()=>openProjectDetail('jordan')],['Inspect // ONYX','03.10',()=>openProjectDetail('onyx')],['Inspect // NCCRP Fund-Flow','03.11',()=>openProjectDetail('nccrp')],['Inspect // Hydra Fabric','03.12',()=>openProjectDetail('hydra')],
    ['Open // RadixOS Source','↗',()=>open('https://github.com/automatedcatso/RadixOS','_blank')],['Open // GitHub','↗',()=>open('https://github.com/automatedcatso','_blank')],['Open // LinkedIn','↗',()=>open('https://www.linkedin.com/in/aaryash-bhagankar-50079230a/','_blank')],['Toggle // OVERDRIVE','ROOT',toggleOverdrive]
  ];
  const palette=$('#commandPalette'),commandInput=$('#commandInput'),commandList=$('#commandList');let filtered=commands.slice(),selected=0;
  const renderCommands=()=>{commandList.innerHTML='';filtered.forEach((c,i)=>{const b=document.createElement('button');b.className=`command-item${i===selected?' active':''}`;b.innerHTML=`<span>${c[0]}</span><small>${c[1]}</small>`;b.onclick=()=>{c[2]();palette.close()};commandList.appendChild(b)})};
  const openPalette=()=>{filtered=commands.slice();selected=0;commandInput.value='';renderCommands();palette.showModal();setTimeout(()=>commandInput.focus(),0)};$('#commandButton')?.addEventListener('click',openPalette);
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();palette.open?palette.close():openPalette()}if(e.key==='Escape'){lightbox?.open&&lightbox.close();gallery?.open&&gallery.close();projectDetail?.open&&projectDetail.close();palette?.open&&palette.close()}});
  commandInput?.addEventListener('input',()=>{const q=commandInput.value.trim().toLowerCase();filtered=commands.filter(c=>c[0].toLowerCase().includes(q));selected=0;renderCommands()});commandInput?.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();selected=Math.min(filtered.length-1,selected+1);renderCommands()}if(e.key==='ArrowUp'){e.preventDefault();selected=Math.max(0,selected-1);renderCommands()}if(e.key==='Enter'&&filtered[selected]){e.preventDefault();filtered[selected][2]();palette.close()}});

  // Smooth internal anchors. Header offset handled by scroll-margin via browser + topbar gap.
  $$('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{const target=$(link.getAttribute('href'));if(!target)return;e.preventDefault();const y=target.getBoundingClientRect().top+scrollY-(innerWidth<650?62:70);scrollTo({top:y,behavior:reduceMotion?'auto':'smooth'});history.replaceState(null,'',link.getAttribute('href'))}));

  // MagicUI-style HyperText port for the hero lockup. Keeps the existing display font and outline treatment.
  const hyperChars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>[]{}';
  const runHyperText=(el)=>{
    if(!el||reduceMotion)return;
    const finalText=el.dataset.hyperText||el.textContent||'';
    if(el.dataset.hyperRunning==='1')return;
    el.dataset.hyperRunning='1';
    const duration=780;
    const start=performance.now();
    const tick=(now)=>{
      const progress=Math.min(1,(now-start)/duration);
      const reveal=Math.floor(progress*finalText.length);
      let next='';
      for(let i=0;i<finalText.length;i++){
        const ch=finalText[i];
        if(ch===' '){next+=' ';continue;}
        next+=i<reveal?ch:hyperChars[Math.floor(Math.random()*hyperChars.length)];
      }
      el.textContent=next;
      if(progress<1)requestAnimationFrame(tick);
      else{el.textContent=finalText;el.dataset.hyperRunning='0';}
    };
    requestAnimationFrame(tick);
  };
  $$('[data-hyper-text]').forEach(el=>{
    const delay=Number(el.dataset.hyperDelay||0);
    if(reduceMotion){el.textContent=el.dataset.hyperText||el.textContent;return;}
    setTimeout(()=>runHyperText(el),700+delay);
    el.addEventListener('pointerenter',()=>runHyperText(el));
    el.addEventListener('focus',()=>runHyperText(el));
  });

  // 3D dossier constellation: pause/resume and contextual core readout.
  const orbit=$('#projectOrbit');
  const orbitToggle=$('#orbitToggle');
  const orbitCoreName=$('#orbitCoreName');
  const orbitCoreRole=$('#orbitCoreRole');
  let orbitPaused=reduceMotion;
  const syncOrbitState=()=>{
    orbit?.classList.toggle('is-paused',orbitPaused);
    if(orbitToggle){orbitToggle.textContent=orbitPaused?'RESUME':'PAUSE';orbitToggle.setAttribute('aria-pressed',String(orbitPaused));}
  };
  syncOrbitState();
  orbitToggle?.addEventListener('click',()=>{orbitPaused=!orbitPaused;syncOrbitState()});
  $$('.orbit-project').forEach(card=>{
    const show=()=>{if(orbitCoreName)orbitCoreName.textContent=card.dataset.orbitName||'SYSTEM';if(orbitCoreRole)orbitCoreRole.textContent=card.dataset.orbitRole||'OPEN DOSSIER'};
    const reset=()=>{if(orbitCoreName)orbitCoreName.textContent='SOURCE-TRACED';if(orbitCoreRole)orbitCoreRole.textContent='08 SYSTEMS // LIVE INDEX'};
    card.addEventListener('pointerenter',show);card.addEventListener('focus',show);card.addEventListener('pointerleave',reset);card.addEventListener('blur',reset);
  });

})();
