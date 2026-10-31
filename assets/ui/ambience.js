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
  let current=0, volumeLevel=.12, requestId=0, loading=false, soundLocked=true;
  let visualHeld=false, onScreen=false, frame=0, lastFrame=0, phase=0;
  let width=1,height=1,scale=1;
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
    waveform=new Uint8Array(analyser.fftSize);
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
    $('#frequencyState').textContent=visualHeld||reduced.matches?'VISUAL HELD':playing&&analyser?'SIGNAL ACTIVE':playing?'AUDIO ONLINE':'SIGNAL STANDBY';
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

  // One bounded surface mesh morphs between three latent-space sculptures.
  const forms=['LATENT FIELD','NEURAL TORUS','PHASE HELIX'];
  let columns=48,rows=21;
  let form=1,morph=1,previousPoints=[],lastPoints=[],waveHistory=[];
  let lookX=0,lookY=0,targetX=0,targetY=0;
  const tint=(alpha,cyan=false)=>`rgba(${cyan?'83,225,238':'246,255,0'},${Math.max(0,Math.min(1,alpha))})`;
  const energy=index=>bins&&soundPlaying()?(bins[Math.min(bins.length-1,index)]||0)/255:0;
  const average=(from,to)=>{
    if(!bins||!soundPlaying())return 0;
    let value=0;for(let i=from;i<to;i++)value+=bins[i]||0;return value/((to-from)*255);
  };
  const project=([x,y,z])=>{
    const yaw=-.46+phase*.16+lookX*.35,pitch=-.4+lookY*.23;
    const rx=x*Math.cos(yaw)-z*Math.sin(yaw),rz=x*Math.sin(yaw)+z*Math.cos(yaw);
    const py=y*Math.cos(pitch)-rz*Math.sin(pitch),depth=y*Math.sin(pitch)+rz*Math.cos(pitch);
    const perspective=9/(9+depth);
    return{x:width*.5+rx*scale*perspective,y:height*.54-py*scale*perspective,z:depth,rx,py};
  };
  const line=(vertices,alpha=.2,lineWidth=.7,cyan=false)=>{
    ctx.beginPath();vertices.map(project).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.strokeStyle=tint(alpha,cyan);ctx.lineWidth=lineWidth;ctx.stroke();
  };
  function pointAt(row,column){
    const u=column/columns*Math.PI*2,v=row/(rows-1)*Math.PI;
    const e=energy(2+Math.floor(column/columns*110));
    if(form===1){
      const tube=.73+e*.18,radius=2.02+tube*Math.cos(v*2);
      return[Math.cos(u)*radius*1.08,Math.sin(v*2)*tube+Math.sin(u*3+phase*.3)*.16,Math.sin(u)*radius];
    }
    if(form===2){
      const t=(row/(rows-1)-.5)*2,twist=t*Math.PI*1.6+phase*.2,radius=.42+e*.14;
      return[Math.cos(twist)*1.28+Math.cos(u)*radius,t*2.08,Math.sin(twist)*1.08+Math.sin(u)*radius];
    }
    const radius=2+Math.sin(u*3+phase*.34)*Math.sin(v*2)*.22+e*.2+low*.12;
    return[Math.cos(u)*Math.sin(v)*radius*1.24,Math.cos(v)*radius,Math.sin(u)*Math.sin(v)*radius*.88];
  }
  const modeControls=document.createElement('div');
  modeControls.className='frequency-modes';modeControls.setAttribute('role','group');
  modeControls.setAttribute('aria-label','Audio sculpture form');
  const modeButtons=forms.map((name,index)=>{
    const button=document.createElement('button');button.type='button';button.textContent=name;
    button.setAttribute('data-visual-mode',String(index));button.setAttribute('aria-pressed',String(index===form));
    button.setAttribute('aria-label',`Show ${name.toLowerCase()} sculpture`);
    button.addEventListener('click',()=>{
      if(form===index)return;
      previousPoints=lastPoints.map(point=>point.slice());form=index;
      morph=canAnimate()&&previousPoints.length?0:1;
      modeButtons.forEach((item,i)=>item.setAttribute('aria-pressed',String(i===form)));
      stage.dataset.visualMode=name.toLowerCase().replaceAll(' ','-');
      visual.setAttribute('aria-label',`${name.toLowerCase()} sculpture. Translucent surfaces, luminous ribbons and light pulses respond to the selected song.`);
      const axis=stage.querySelector('.frequency-axis span');if(axis)axis.textContent=`${name}\n00${index+1}`;
      refresh(true);
    });
    modeControls.append(button);return button;
  });
  stage.append(modeControls);stage.dataset.visualMode='neural-torus';
  visual.setAttribute('aria-label','A sculpted three-dimensional neural torus with translucent facets, a luminous core and orbital ribbons. Choose a form or play a track.');
  stage.addEventListener('pointermove',event=>{
    if(reduced.matches||visualHeld||event.pointerType==='touch')return;
    const rect=stage.getBoundingClientRect();
    targetX=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1));
    targetY=Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));
    if(!canAnimate()&&onScreen&&!document.hidden){lookX=targetX;lookY=targetY;draw();}
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{targetX=targetY=0;});
  const draw=(force=false)=>{
    if(!ctx||(visualHeld&&!force))return;
    ctx.clearRect(0,0,width,height);
    const glow=ctx.createRadialGradient(width*.5,height*.52,0,width*.5,height*.52,Math.min(width*.42,height*.72));
    glow.addColorStop(0,'rgba(115,147,87,.2)');glow.addColorStop(.45,tint(.045+low*.1,true));glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    const floor=project([0,-2.5,0]);
    const shadow=ctx.createRadialGradient(floor.x,floor.y,0,floor.x,floor.y,scale*3.3);
    shadow.addColorStop(0,'rgba(101,136,90,.18)');shadow.addColorStop(.4,'rgba(31,65,55,.09)');shadow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=shadow;ctx.fillRect(0,height*.6,width,height*.4);
    for(let i=-3;i<=3;i++){
      line([[i,-2.55,-3],[i,-2.55,3]],.035,.55,true);
      line([[-3,-2.55,i],[3,-2.55,i]],.035,.55,true);
    }
    const blend=morph*morph*(3-2*morph),points=[];
    for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
      const next=pointAt(row,column),old=previousPoints[points.length];
      points.push(old&&morph<1?next.map((value,i)=>old[i]+(value-old[i])*blend):next);
    }
    lastPoints=points;
    const projected=points.map(project);
    // Depth-sorted glass facets give the sculpture mass, while normal-based lighting reveals its form.
    const facets=[];
    for(let row=0;row<rows-1;row++)for(let column=0;column<columns;column++){
      const i=row*columns+column,next=row*columns+(column+1)%columns;
      const vertices=[projected[i],projected[next],projected[next+columns],projected[i+columns]];
      const [a,b,c]=vertices,ab=[b.rx-a.rx,b.py-a.py,b.z-a.z],ac=[c.rx-a.rx,c.py-a.py,c.z-a.z];
      const normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
      const length=Math.hypot(...normal)||1;
      const facing=Math.abs(normal[2])/length;
      const light=Math.abs((normal[0]*-.35+normal[1]*.65+normal[2]*-.68)/length);
      const ribbon=Math.pow(Math.max(0,Math.cos(column/columns*Math.PI*4+row/(rows-1)*4.5-phase*.32)),18);
      facets.push({vertices,column,row,light,facing,ribbon,depth:vertices.reduce((sum,p)=>sum+p.z,0)/4});
    }
    facets.sort((a,b)=>b.depth-a.depth).forEach(face=>{
      const front=Math.max(0,Math.min(1,(2.8-face.depth)/5.6));
      const specular=Math.pow(face.light,24)*face.facing,rim=Math.pow(1-face.facing,4);
      const neutral=[23+face.light*39,36+face.light*47,31+face.light*39];
      const accent=face.column>columns*.55?[86,202,205]:[209,225,137];
      const stripeMix=face.ribbon*.48+low*.025,highlight=Math.min(.7,specular*.9+rim*.1);
      const ivory=[237,246,220];
      const shade=neutral.map((value,i)=>{
        const coated=value+(accent[i]-value)*stripeMix;
        return Math.round(coated+(ivory[i]-coated)*highlight);
      });
      ctx.beginPath();face.vertices.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
      ctx.fillStyle=`rgba(${shade.join(',')},${.36+front*.56})`;ctx.fill();
      ctx.strokeStyle=face.ribbon>.7?tint(.12+specular*.24,face.column>columns*.55):`rgba(${shade.join(',')},.16)`;
      ctx.lineWidth=.35;ctx.stroke();
    });
    const core=project([0,0,0]),coreRadius=scale*(.4+low*.13);
    const coreGlow=ctx.createRadialGradient(core.x,core.y,0,core.x,core.y,coreRadius);
    coreGlow.addColorStop(0,'rgba(251,255,226,.95)');coreGlow.addColorStop(.13,'rgba(228,245,160,.8)');
    coreGlow.addColorStop(.38,tint(.25+mid*.2));coreGlow.addColorStop(1,'rgba(211,240,132,0)');
    ctx.fillStyle=coreGlow;ctx.beginPath();ctx.arc(core.x,core.y,coreRadius,0,Math.PI*2);ctx.fill();
    const nodeStep=width<600?13:17;
    for(let index=0;index<projected.length;index+=nodeStep){
      const p=projected[index],e=energy(3+index%120),front=Math.max(.15,1-(p.z+2.5)/6);
      ctx.beginPath();ctx.arc(p.x,p.y,.8+front*.8+e*1.5,0,Math.PI*2);
      ctx.fillStyle=index%2===0?'rgba(230,247,215,.72)':tint(.3+front*.5+e*.2,true);ctx.fill();
    }
    // Broad luminous paths sit on the surface instead of turning every edge into a wireframe.
    for(let lane=0;lane<2;lane++){
      const path=[];
      for(let row=0;row<rows;row++)path.push(points[row*columns+(Math.floor(phase)+lane*14+row)%columns]);
      ctx.shadowBlur=12;ctx.shadowColor=tint(.45,lane===1);
      line(path,.16+mid*.34,6+low*3,lane===1);ctx.shadowBlur=0;
      line(path,.6+mid*.3,1.5,lane===1);
      const p=project(path[Math.floor(phase*3+lane*4)%path.length]);
      ctx.shadowBlur=9+high*10;ctx.shadowColor=tint(.9,lane===1);ctx.fillStyle=tint(.85,lane===1);
      ctx.beginPath();ctx.arc(p.x,p.y,2.5+high*2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    }
    for(let ring=0;ring<2;ring++){
      const orbit=[];
      for(let i=0;i<=64;i++){
        const a=i/64*Math.PI*2,r=3.02+ring*.18+low*.08;
        orbit.push([Math.cos(a)*r,Math.sin(a)*.61*(ring?1:-1),Math.sin(a)*r]);
      }
      line(orbit,.18+low*.18,ring?1:1.5,ring===1);
    }
    for(let i=0;i<32;i++){
      const a=i/32*Math.PI*2,r=2.8,e=energy(2+Math.floor(i/32*120));
      line([[Math.cos(a)*r,-2.55,Math.sin(a)*r],[Math.cos(a)*r,-2.5+e*.75,Math.sin(a)*r]],.12+e*.55,1.3,i%4===0);
    }
    if(waveform&&soundPlaying()&&!visualHeld&&!reduced.matches){
      waveHistory.unshift(Array.from({length:64},(_,i)=>(waveform[Math.floor(i/64*waveform.length)]-128)/128));
      waveHistory.length=Math.min(waveHistory.length,3);
    }
    (waveHistory.length?waveHistory:[Array(64).fill(0)]).forEach((samples,trail)=>{
      line(samples.map((wave,i)=>[-3.1+i/63*6.2,-2.14+wave*.43+trail*.06,1.6+trail*.2]),
        (.5-trail*.14)+high*.2,trail? .65:1.1,trail!==0);
    });
  };
  function canAnimate(){return soundPlaying()&&onScreen&&!document.hidden&&!reduced.matches&&!visualHeld;}
  const animate=now=>{
    frame=0;if(!canAnimate())return;
    if(now-lastFrame>=1000/24){
      const delta=Math.min((now-lastFrame)/1000,.08);phase+=delta;lastFrame=now;morph=Math.min(1,morph+delta/1.1);
      lookX+=(targetX-lookX)*.1;lookY+=(targetY-lookY)*.1;
      if(analyser){analyser.getByteFrequencyData(bins);analyser.getByteTimeDomainData(waveform);}
      low=average(1,8);mid=average(8,55);high=average(55,150);
      miniBars.forEach((bar,i)=>{bar.style.transform=`scaleY(${.12+energy(2+i*9)*.88})`;});
      draw();$('#frequencyBands').textContent=`LOW ${Math.round(low*100)} / MID ${Math.round(mid*100)} / HIGH ${Math.round(high*100)}`;
    }
    frame=requestAnimationFrame(animate);
  };
  function refresh(force=false){
    if(frame)cancelAnimationFrame(frame);frame=0;
    stage.dataset.renderState=document.hidden?'hidden':!onScreen?'offscreen':reduced.matches?'reduced':visualHeld?'held':soundPlaying()?'active':'paused';
    if((onScreen||audio.paused)&&!document.hidden)draw(force);
    if(canAnimate()){lastFrame=performance.now();frame=requestAnimationFrame(animate);}
  }
  const resize=()=>{
    const rect=stage.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);
    const nextColumns=width<650?32:48,nextRows=width<650?13:21;
    if(columns!==nextColumns||rows!==nextRows){columns=nextColumns;rows=nextRows;previousPoints=[];morph=1;}
    const dpr=Math.min(devicePixelRatio||1,2);visual.width=Math.round(width*dpr);visual.height=Math.round(height*dpr);
    if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);
    scale=Math.min(width/(width<600?7.15:7.7),height/5.7);draw(true);
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
  // Playback starts only from the transport, track selection or an OS media control.
})();
