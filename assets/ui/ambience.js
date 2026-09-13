/* FM.09: one audio element, actual FFT data, and an original projected sculpture. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Keep a real custom pointer as the precise target; the reticle is only a trailing accent.
  const reticle = $('#cursorReticle');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  let cursorFrame = 0, x = 0, y = 0, tx = 0, ty = 0, cursorReady = false;
  const moveCursor = () => {
    cursorFrame = 0;
    x += (tx-x)*.28; y += (ty-y)*.28;
    reticle.style.transform = `translate3d(${x-21}px,${y-21}px,0)`;
    if (Math.abs(tx-x)+Math.abs(ty-y)>.3) cursorFrame=requestAnimationFrame(moveCursor);
  };
  document.addEventListener('pointermove', event => {
    if(!fine.matches || reduced.matches || event.pointerType==='touch')return;
    tx=event.clientX;ty=event.clientY;
    if(!cursorReady){x=tx;y=ty;cursorReady=true;}
    const target=event.target.closest('a,button,[role="button"],input[type="range"]');
    const text=event.target.closest('input:not([type="range"]),textarea,[contenteditable="true"]');
    reticle.classList.toggle('is-visible',!text);
    reticle.classList.toggle('is-target',Boolean(target));
    if(!cursorFrame)cursorFrame=requestAnimationFrame(moveCursor);
  },{passive:true});
  const hideCursor=()=>{reticle.classList.remove('is-visible');cursorReady=false;if(cursorFrame)cancelAnimationFrame(cursorFrame);cursorFrame=0;};
  document.documentElement.addEventListener('pointerleave',hideCursor);
  window.addEventListener('blur',hideCursor);
  document.addEventListener('pointerdown',()=>{
    if(fine.matches&&!reduced.matches)reticle.animate([{scale:'1'},{scale:'.65'},{scale:'1'}],{duration:240,easing:'ease-out'});
  },{passive:true});

  const audio=$('#backgroundMusic');
  if(!audio)return;
  const trackButtons=$$('[data-track]');
  const toggles=$$('[data-music-toggle]');
  const notice=$('#musicNotice'), seek=$('#musicSeek'), volume=$('#musicVolume');
  const visual=$('#frequencyCanvas'), stage=$('#frequencyStage'), hold=$('#visualHold');
  const ctx=visual.getContext('2d');
  const miniBars=$$('.dock-spectrum i');
  let audioContext, analyser, gain, source, bins, waveform;
  let current=0, volumeLevel=.12, requestId=0, autoArmed=true, loading=false, soundLocked=true;
  let visualHeld=false, onScreen=false, frame=0, lastFrame=0, phase=0;
  let width=1,height=1,scale=1;
  let low=0,mid=0,high=0;
  audio.volume=volumeLevel;
  audio.autoplay=true;
  audio.loop=true;
  const formatTime=seconds=>Number.isFinite(seconds)?`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`:'--:--';

  const graph=()=>{
    if(audioContext)return;
    const AudioEngine=window.AudioContext||window.webkitAudioContext;
    if(!AudioEngine)return;
    audioContext=new AudioEngine();
    analyser=audioContext.createAnalyser();
    analyser.fftSize=512;
    analyser.smoothingTimeConstant=.82;
    bins=new Uint8Array(analyser.frequencyBinCount);
    waveform=new Uint8Array(analyser.fftSize);
    gain=audioContext.createGain();gain.gain.value=volumeLevel;
    source=audioContext.createMediaElementSource(audio);
    source.connect(analyser);analyser.connect(gain);gain.connect(audioContext.destination);
    audio.volume=1;
    audioContext.addEventListener('statechange',()=>{
      if(audioContext.state==='running'&&!audio.paused){soundLocked=false;disarmAuto();notice.textContent='TRANSMISSION ONLINE // SELECTED TRACK LOOPS';}
      sync();
    });
  };
  const disarmAuto=()=>{
    autoArmed=false;
    document.removeEventListener('click',unlock,true);
    document.removeEventListener('keydown',unlock,true);
  };
  const soundPlaying=()=>!audio.paused&&!audio.ended&&(!audioContext||audioContext.state==='running');
  const sync=()=>{
    const playing=soundPlaying();
    document.body.classList.toggle('music-is-playing',playing);
    toggles.forEach(button=>button.setAttribute('aria-label',playing?'Pause background music':'Play background music'));
    $$('[data-play-icon]').forEach(icon=>{icon.textContent=playing?'Ⅱ':'▶';});
    $('#musicState').textContent=loading?'CONNECTING':playing?'NOW PLAYING':soundLocked?'CLICK PLAY TO ENABLE SOUND':'TRANSMISSION PAUSED';
    $('#dockState').textContent=loading?'CONNECTING // FM.09':playing?'NOW PLAYING // FM.09':soundLocked?'ENABLE SOUND // FM.09':'RESUME AUDIO // FM.09';
    $('#frequencyState').textContent=visualHeld||reduced.matches?'VISUAL HELD':playing&&analyser?'SIGNAL ACTIVE':playing?'AUDIO ONLINE':'SIGNAL STANDBY';
    hold.textContent=reduced.matches?'REDUCED MOTION':visualHeld?'RESUME VISUAL':'HOLD VISUAL';
    hold.disabled=reduced.matches;
    hold.setAttribute('aria-pressed',String(visualHeld||reduced.matches));
    if(!playing){low=mid=high=0;$('#frequencyBands').textContent='LOW / MID / HIGH';miniBars.forEach(bar=>{bar.style.transform='scaleY(.12)';});}
    refresh();
  };
  const start=async(automatic=false)=>{
    const id=++requestId;
    loading=true;sync();
    try {
      try { graph(); } catch { /* Native playback remains available without the visualizer. */ }
      // Start both inside the gesture: a blocked resume promise must not stall the play control.
      if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{});
      if(id!==requestId)return;
      await audio.play();
      if(id!==requestId)return;
      loading=false;
      if(soundPlaying()){soundLocked=false;disarmAuto();notice.textContent='TRANSMISSION ONLINE // SELECTED TRACK LOOPS';}
      else{soundLocked=true;notice.textContent='SOUND NEEDS A TAP // PRESS PLAY TO ENABLE AUDIO';}
      sync();
    } catch(error) {
      if(id!==requestId)return;
      loading=false;
      if(error.name==='NotAllowedError'){soundLocked=true;notice.textContent='AUTOPLAY BLOCKED // CLICK PLAY OR TAP ANYWHERE TO ENABLE SOUND';}
      else if(error.name!=='AbortError')notice.textContent='SIGNAL INTERRUPTED // PRESS PLAY TO RETRY';
      sync();
    }
  };
  const stop=()=>{disarmAuto();++requestId;loading=false;soundLocked=false;audio.pause();notice.textContent='TRANSMISSION PAUSED // RESUME WHEN READY';sync();};
  const toggle=()=>{if(soundPlaying()||loading)stop();else start();};
  function unlock(event){
    if(!autoArmed||event.target.closest('[data-audio-ui] button,[data-audio-ui] input,[data-audio-ui] a,dialog,input,textarea,select'))return;
    if(event.type==='keydown'&&(event.ctrlKey||event.metaKey||event.altKey||['Shift','Control','Alt','Meta','Escape','Tab'].includes(event.key)))return;
    start();
  }
  toggles.forEach(button=>button.addEventListener('click',toggle));
  $$('.music-dock a').forEach(link=>link.addEventListener('click',()=>{if(autoArmed)start();}));
  trackButtons.forEach((button,index)=>button.addEventListener('click',()=>{
    if(current===index){if(!soundPlaying())start();return;}
    ++requestId;audio.pause();current=index;
    audio.src=button.dataset.src;audio.load();audio.loop=true;
    trackButtons.forEach((item,i)=>item.setAttribute('aria-pressed',String(i===index)));
    $('#musicTitle').textContent=button.dataset.title;
    $('#dockTitle').textContent=button.dataset.title;
    $('#musicArtist').textContent=`${button.dataset.artist} // ${index===0?'DEFAULT TRANSMISSION':'ALTERNATE TRANSMISSION'}`;
    seek.value='0';seek.disabled=true;$('#musicElapsed').textContent='0:00';$('#musicDuration').textContent='--:--';
    updateMediaSession();start();
  }));
  volume.addEventListener('input',()=>{
    volumeLevel=Number(volume.value)/100;
    if(gain&&audioContext)gain.gain.setTargetAtTime(volumeLevel,audioContext.currentTime,.035);
    else audio.volume=volumeLevel;
    $('#musicVolumeValue').textContent=`${volume.value}%`;
  });
  seek.addEventListener('input',()=>{
    if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=audio.duration*Number(seek.value)/1000;
    updateTime();
  });
  function updateTime(){
    const duration=audio.duration;
    $('#musicElapsed').textContent=formatTime(audio.currentTime);
    $('#musicDuration').textContent=formatTime(duration);
    seek.disabled=!Number.isFinite(duration)||duration<=0;
    if(!seek.disabled){seek.value=String(Math.round(audio.currentTime/duration*1000));seek.setAttribute('aria-valuetext',`${formatTime(audio.currentTime)} of ${formatTime(duration)}`);}
  }
  ['timeupdate','durationchange','loadedmetadata'].forEach(event=>audio.addEventListener(event,updateTime));
  audio.addEventListener('play',()=>{loading=false;sync();if('mediaSession' in navigator)navigator.mediaSession.playbackState='playing';});
  audio.addEventListener('pause',()=>{sync();if('mediaSession' in navigator)navigator.mediaSession.playbackState='paused';});
  audio.addEventListener('waiting',()=>{if(!audio.paused)$('#musicState').textContent='BUFFERING';});
  audio.addEventListener('playing',()=>{loading=false;sync();});
  audio.addEventListener('error',()=>{loading=false;notice.textContent='TRACK UNAVAILABLE // RETRY PLAY OR SELECT ANOTHER TRANSMISSION';sync();});
  function updateMediaSession(){
    if(!('mediaSession' in navigator)||!('MediaMetadata' in window))return;
    const track=trackButtons[current];
    navigator.mediaSession.metadata=new MediaMetadata({title:track.dataset.title,artist:track.dataset.artist,album:'Aaryash // Acid Frequencies'});
  }
  if('mediaSession' in navigator){
    for(const [action,handler] of [['play',()=>start()],['pause',stop],['stop',stop]]){
      try{navigator.mediaSession.setActionHandler(action,handler);}catch{/* Unsupported OS media key. */}
    }
  }
  updateMediaSession();

  // Monochrome projected architecture. Each tower samples a different part of the real spectrum.
  const color=(a)=>`rgba(246,255,0,${a})`;
  const project=([x,y,z])=>{
    const angle=-.36+Math.sin(phase*.13)*.055,cos=Math.cos(angle),sin=Math.sin(angle);
    const rx=x*cos-z*sin,rz=x*sin+z*cos;
    const depth=rz*.91-y*.41,py=y*.91+rz*.41;
    const perspective=13/(13+depth);
    return{x:width*.5+rx*scale*perspective,y:height*.7-py*scale*perspective,z:depth};
  };
  const line=(vertices,alpha=.2,lineWidth=.7,close=false)=>{
    ctx.beginPath();vertices.map(project).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    if(close)ctx.closePath();ctx.strokeStyle=color(alpha);ctx.lineWidth=lineWidth;ctx.stroke();
  };
  const energy=index=>bins&&!audio.paused?(bins[Math.min(bins.length-1,index)]||0)/255:0;
  const average=(from,to)=>{
    if(!bins||audio.paused)return 0;
    let value=0;for(let i=from;i<to;i++)value+=bins[i]||0;return value/((to-from)*255);
  };
  const draw=()=>{
    if(!ctx||visualHeld)return;
    ctx.clearRect(0,0,width,height);
    // Narrow viewports use fewer towers so the sculpture retains its scale.
    const half=width<600?4.5:6,columns=width<600?3:5;
    for(let i=-Math.floor(half);i<=half;i++)line([[i,0,-3.7],[i,0,3.7]],.09);
    for(let i=-4;i<=4;i++)line([[-half,0,i],[half,0,i]],.09);
    line([[-half,0,-3.6],[half,0,-3.6],[half,0,3.6],[-half,0,3.6]],.25,1,true);
    const faces=[];
    const addTower=(x,z,h,brightness)=>{
      const r=.22;
      const p=[[x-r,0,z-r],[x+r,0,z-r],[x+r,h,z-r],[x-r,h,z-r],[x-r,0,z+r],[x+r,0,z+r],[x+r,h,z+r],[x-r,h,z+r]];
      [[0,1,2,3],[1,5,6,2],[4,7,6,5],[0,3,7,4],[3,2,6,7]].forEach((indices,i)=>{
        const points=indices.map(n=>project(p[n]));
        faces.push({points,depth:points.reduce((sum,p)=>sum+p.z,0)/4,top:i===4,brightness});
      });
    };
    for(const side of [-1,1])for(let row=0;row<4;row++)for(let col=0;col<columns;col++){
      const e=energy(2+Math.floor(Math.pow((row*columns+col)/(4*columns),1.65)*115));
      const baseline=.18+((row*7+col*3)%8)*.105;
      addTower(side*(2.15+col*.66),-2.3+row*1.32,baseline+e*(1.5+row*.22),e);
    }
    faces.sort((a,b)=>b.depth-a.depth).forEach(f=>{
      ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
      ctx.fillStyle=f.top?`rgba(${Math.round(50+f.brightness*95)},${Math.round(56+f.brightness*105)},4,.94)`:'rgba(10,15,3,.94)';
      ctx.fill();ctx.strokeStyle=color((f.top?.48:.23)+f.brightness*.4);ctx.lineWidth=.7;ctx.stroke();
    });
    // Concentric stepped plinth beneath a levitating octahedral core.
    for(let n=0;n<4;n++){
      const r=1.8-n*.22,y=n*.12;
      line([[-r,y,-r],[r,y,-r],[r,y,r],[-r,y,r]],.2+n*.07,1,true);
    }
    const coreY=2.12,coreSize=.8+low*.34;
    const rotate=([x,y,z])=>{const a=phase*.32;return[x*Math.cos(a)-z*Math.sin(a),y+coreY,x*Math.sin(a)+z*Math.cos(a)];};
    const core=[[0,coreSize*1.6,0],[coreSize,0,0],[0,0,coreSize],[-coreSize,0,0],[0,0,-coreSize],[0,-coreSize*1.6,0]].map(rotate);
    for(let i=1;i<=4;i++){
      line([core[0],core[i],core[5]],.65+low*.3,1.1);
      line([core[i],core[i===4?1:i+1]],.5,1);
    }
    for(let ring=0;ring<3;ring++){
      const points=[];
      for(let i=0;i<=90;i++){
        const a=i/90*Math.PI*2,r=1.4+ring*.23+(ring===0?low:mid)*.2;
        const x=Math.cos(a)*r,y=Math.sin(a)*r;
        const tilt=ring*Math.PI/3+phase*.06;
        points.push([x*Math.cos(tilt),coreY+y,x*Math.sin(tilt)]);
      }
      line(points,.2+ring*.09+mid*.25,ring===1?1.1:.65);
    }
    // Two real time-domain waveform ribbons connect the architecture.
    for(const side of [-1,1]){
      const points=[];
      for(let i=0;i<100;i++){
        const wave=waveform&&!audio.paused?(waveform[Math.floor(i/100*waveform.length)]-128)/128:0;
        points.push([-(half-.5)+i/99*(half-.5)*2,.2+wave*.75,side*3.25]);
      }
      line(points,.38+high*.45,1.1);
    }
    // Suspension axis and orbit nodes are geometry, not random fake spectrum values.
    line([[0,.45,0],[0,.9,0]],.4,1);
    for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2+phase*.08;
      const p=project([Math.cos(a)*1.87,.1,Math.sin(a)*1.87]);
      ctx.fillStyle=color(.7);ctx.fillRect(p.x-1.5,p.y-1.5,3,3);
    }
  };
  const animate=now=>{
    frame=0;
    if(!soundPlaying()||document.hidden||reduced.matches)return;
    if(now-lastFrame>=1000/24){
      phase+=Math.min((now-lastFrame)/1000,.07);lastFrame=now;
      if(analyser){analyser.getByteFrequencyData(bins);analyser.getByteTimeDomainData(waveform);}
      low=average(1,8);mid=average(8,55);high=average(55,150);
      miniBars.forEach((bar,i)=>{bar.style.transform=`scaleY(${.12+energy(2+i*9)*.88})`;});
      if(onScreen){draw();$('#frequencyBands').textContent=`LOW ${Math.round(low*100)} / MID ${Math.round(mid*100)} / HIGH ${Math.round(high*100)}`;}
    }
    frame=requestAnimationFrame(animate);
  };
  function refresh(){
    if(frame)cancelAnimationFrame(frame);frame=0;
    if(onScreen||audio.paused)draw();
    if(soundPlaying()&&!document.hidden&&!reduced.matches){lastFrame=performance.now();frame=requestAnimationFrame(animate);}
  }
  const resize=()=>{
    const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;
    const dpr=Math.min(devicePixelRatio||1,2);visual.width=Math.round(width*dpr);visual.height=Math.round(height*dpr);
    if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);
    scale=Math.min(width/(width<600?10.7:13.8),height/6.7);
    const wasHeld=visualHeld;visualHeld=false;draw();visualHeld=wasHeld;
  };
  hold.addEventListener('click',()=>{visualHeld=!visualHeld;sync();});
  reduced.addEventListener('change',()=>{hideCursor();sync();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hideCursor();refresh();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;refresh();},{threshold:.05}).observe(stage);
  else onScreen=true;
  // The floating player steps aside when the full transport is already available.
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
    $('.music-dock').classList.toggle('is-inline-visible',entries[0].isIntersecting);
  },{threshold:.3}).observe($('.music-transport'));
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize',resize,{passive:true});
  resize();sync();updateTime();
  // A click occurs after touch release and is an activation gesture on mobile browsers too.
  document.addEventListener('click',unlock,true);
  document.addEventListener('keydown',unlock,true);
  // Attempt default playback, then let the first eligible gesture unlock browser audio policy.
  start(true);
})();
