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
  let renderer;
  const miniBars=$$('.dock-spectrum i');
  let audioContext, analyser, gain, source, bins;
  let current=0, volumeLevel=.12, requestId=0, loading=false, soundLocked=true;
  let visualHeld=false, onScreen=false, frame=0, lastFrame=0, phase=0;
  let width=1,height=1;
  let low=0,mid=0,high=0;
  audio.volume=volumeLevel;
  audio.autoplay=false;
  audio.removeAttribute('autoplay');
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
    gain=audioContext.createGain();gain.gain.value=volumeLevel;
    source=audioContext.createMediaElementSource(audio);
    source.connect(analyser);analyser.connect(gain);gain.connect(audioContext.destination);
    audio.volume=1;
    audioContext.addEventListener('statechange',()=>{
      if(audioContext.state==='running'&&!audio.paused){soundLocked=false;notice.textContent='TRANSMISSION ONLINE // SELECTED TRACK LOOPS';}
      sync();
    });
  };
  const soundPlaying=()=>!audio.paused&&!audio.ended&&(!audioContext||audioContext.state==='running');
  const sync=()=>{
    const playing=soundPlaying();
    document.body.classList.toggle('music-is-playing',playing);
    toggles.forEach(button=>button.setAttribute('aria-label',playing?'Pause background music':'Play background music'));
    $$('[data-play-icon]').forEach(icon=>{icon.textContent=playing?'Ⅱ':'▶';});
    $('#musicState').textContent=loading?'CONNECTING':playing?'NOW PLAYING':soundLocked?'CLICK PLAY TO ENABLE SOUND':'TRANSMISSION PAUSED';
    $('#dockState').textContent=loading?'CONNECTING // FM.09':playing?'NOW PLAYING // FM.09':soundLocked?'ENABLE SOUND // FM.09':'RESUME AUDIO // FM.09';
    $('#frequencyState').textContent=visualHeld||reduced.matches?'MOTION PAUSED':playing?'AUDIO REACTIVE':'IDLE FLIGHT';
    hold.textContent=reduced.matches?'REDUCED MOTION':visualHeld?'RESUME VISUAL':'HOLD VISUAL';
    hold.disabled=reduced.matches;
    hold.setAttribute('aria-pressed',String(visualHeld||reduced.matches));
    if(!playing){low=mid=high=0;$('#frequencyBands').textContent='LOW / MID / HIGH';miniBars.forEach(bar=>{bar.style.transform='scaleY(.12)';});}
    refresh();
  };
  const start=async()=>{
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
      if(soundPlaying()){soundLocked=false;notice.textContent='TRANSMISSION ONLINE // SELECTED TRACK LOOPS';}
      else{soundLocked=true;notice.textContent='SOUND NEEDS A TAP // PRESS PLAY TO ENABLE AUDIO';}
      sync();
    } catch(error) {
      if(id!==requestId)return;
      loading=false;
      if(error.name==='NotAllowedError'){soundLocked=true;notice.textContent='SOUND NEEDS A TAP // PRESS PLAY TO ENABLE AUDIO';}
      else if(error.name!=='AbortError')notice.textContent='SIGNAL INTERRUPTED // PRESS PLAY TO RETRY';
      sync();
    }
  };
  const stop=()=>{++requestId;loading=false;soundLocked=false;audio.pause();notice.textContent='TRANSMISSION PAUSED // RESUME WHEN READY';sync();};
  const toggle=()=>{if(soundPlaying()||loading)stop();else start();};
  toggles.forEach(button=>button.addEventListener('click',toggle));
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


  // One original wireframe dragon. Idle flight does not require audio playback.
  let yaw=-.34,pitch=-.10,zoom=1,drag=null;
  const average=(from,to)=>{
    if(!bins||!soundPlaying())return 0;
    let value=0;for(let i=from;i<to;i++)value+=bins[i]||0;return value/((to-from)*255);
  };
  renderer=window.createDragonSculpture?.(visual);
  stage.dataset.renderer=renderer?.kind||'unavailable';
  visual.setAttribute('aria-label','Interactive 3D cyberpunk wireframe dragon with wings, horns and a coiled tail. Drag to rotate, or use the view controls.');
  visual.tabIndex=0;
  const controls=document.createElement('div');controls.className='dragon-view-controls';
  controls.setAttribute('role','group');controls.setAttribute('aria-label','Dragon view controls');
  const redraw=()=>refresh(true);
  const actions=[
    ['↶','Rotate dragon left',()=>{yaw-=.25;}],['↷','Rotate dragon right',()=>{yaw+=.25;}],
    ['−','Zoom dragon out',()=>{zoom=Math.max(.65,zoom-.12);}],['+','Zoom dragon in',()=>{zoom=Math.min(1.45,zoom+.12);}],
    ['RESET','Reset dragon view',()=>{yaw=-.34;pitch=-.10;zoom=1;}]
  ];
  for(const [text,label,action] of actions){
    const button=document.createElement('button');button.type='button';button.textContent=text;button.setAttribute('aria-label',label);
    button.addEventListener('click',()=>{action();redraw();});controls.append(button);
  }
  stage.append(controls);
  const signature=document.createElement('div');signature.className='dragon-signature';
  signature.innerHTML='<span>ORIGINAL 3D STUDY</span><strong>NEON WYVERN<span>01</span></strong><p>Drag to orbit · wings move before the music starts</p>';
  stage.append(signature);
  visual.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY};visual.setPointerCapture?.(event.pointerId);visual.classList.add('is-dragging');
  });
  visual.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    yaw+=(event.clientX-drag.x)*.008;pitch=Math.max(-.7,Math.min(.6,pitch+(event.clientY-drag.y)*.005));
    drag.x=event.clientX;drag.y=event.clientY;redraw();
  });
  const endDrag=()=>{drag=null;visual.classList.remove('is-dragging');};
  visual.addEventListener('pointerup',endDrag);visual.addEventListener('pointercancel',endDrag);
  visual.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft')yaw-=.16;else if(event.key==='ArrowRight')yaw+=.16;
    else if(event.key==='ArrowUp')pitch=Math.max(-.7,pitch-.10);else if(event.key==='ArrowDown')pitch=Math.min(.6,pitch+.10);
    else if(event.key==='+'||event.key==='=')zoom=Math.min(1.45,zoom+.1);else if(event.key==='-')zoom=Math.max(.65,zoom-.1);else return;
    event.preventDefault();redraw();
  });
  const draw=()=>{
    if(!renderer||document.hidden)return;
    renderer.render(phase,{yaw:yaw+(!visualHeld&&!reduced.matches&&!drag?Math.sin(phase*.22)*.14:0),pitch,zoom,low,mid,high});
  };
  function canAnimate(){return Boolean(renderer)&&onScreen&&!document.hidden&&!reduced.matches&&!visualHeld;}
  const animate=now=>{
    frame=0;if(!canAnimate())return;
    if(now-lastFrame>=1000/30){
      phase+=Math.min((now-lastFrame)/1000,.08);lastFrame=now;
      if(analyser&&soundPlaying()){analyser.getByteFrequencyData(bins);}
      low=average(1,8);mid=average(8,55);high=average(55,150);
      miniBars.forEach((bar,i)=>{bar.style.transform=`scaleY(${.12+(soundPlaying()?(bins?.[2+i*9]||0)/255:0)*.88})`;});
      draw();$('#frequencyBands').textContent=soundPlaying()?`LOW ${Math.round(low*100)} / MID ${Math.round(mid*100)} / HIGH ${Math.round(high*100)}`:'DRAG TO ORBIT';
    }
    frame=requestAnimationFrame(animate);
  };
  function refresh(){
    if(frame)cancelAnimationFrame(frame);frame=0;
    stage.dataset.renderState=document.hidden?'hidden':!onScreen?'offscreen':reduced.matches?'reduced':visualHeld?'held':soundPlaying()?'active':'idle';
    if(!document.hidden)draw();
    if(canAnimate()){lastFrame=performance.now();frame=requestAnimationFrame(animate);}
  }
  const resize=()=>{
    const rect=stage.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);
    renderer?.resize(width,height,Math.min(devicePixelRatio||1,1.75));draw();
  };
  visual.addEventListener('webglcontextrestored',()=>{renderer=window.createDragonSculpture?.(visual);resize();refresh();});
  hold.addEventListener('click',()=>{visualHeld=!visualHeld;sync();});
  reduced.addEventListener('change',()=>{hideCursor();sync();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hideCursor();refresh();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;refresh();},{threshold:.05}).observe(stage);
  else onScreen=true;
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
    $('.music-dock').classList.toggle('is-inline-visible',entries[0].isIntersecting);
  },{threshold:.3}).observe($('.music-transport'));
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize',resize,{passive:true});
  resize();sync();updateTime();
})();
