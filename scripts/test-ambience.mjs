// Dependency-free audio state/renderer regression check: node scripts/test-ambience.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const created=[], observers=[], frames=new Map();
let nextFrame=0,now=1000,draws=0,plays=0,stageWidth=1100,stageHeight=620,resizeCallback,lastPose;
function element(id='') {
  const listeners={},attributes={};
  return { id,dataset:{},style:{},attributes,children:[],value:'0',textContent:'',
    classList:{toggle(){},add(){},remove(){}},
    addEventListener(type,handler){(listeners[type]??=[]).push(handler);},
    emit(type,event={}){for(const handler of listeners[type]||[])handler(event);},
    setAttribute(name,value){attributes[name]=String(value);},
    removeAttribute(name){delete attributes[name];},
    append(child){this.children.push(child);},
    querySelector(){return axis;},
    getBoundingClientRect(){return {left:0,top:0,width:stageWidth,height:stageHeight};},
  };
}
const ids=new Map();
for(const id of ['cursorReticle','backgroundMusic','musicNotice','musicSeek','musicVolume','frequencyCanvas',
  'frequencyStage','visualHold','musicState','dockState','frequencyState','frequencyBands','musicTitle',
  'dockTitle','musicArtist','musicElapsed','musicDuration','musicVolumeValue'])ids.set('#'+id,element(id));
const audio=ids.get('#backgroundMusic'),stage=ids.get('#frequencyStage'),hold=ids.get('#visualHold'),axis=element();
Object.assign(audio,{paused:true,ended:false,duration:180,currentTime:0,
  async play(){plays++;this.paused=false;this.emit('play');},
  pause(){this.paused=true;this.emit('pause');},load(){this.emit('loadedmetadata');},
});
const coordinates=(...values)=>values.forEach(value=>assert.ok(Number.isFinite(value),'Projected geometry must remain finite'));
const context=new Proxy({clearRect(){draws++;},createRadialGradient(){return {addColorStop(){}};},
  moveTo:coordinates,lineTo:coordinates,arc(x,y,r){coordinates(x,y,r);assert.ok(r>=0);}},
  {get(target,key){return key in target?target[key]:()=>{};}});
ids.get('#frequencyCanvas').getContext=()=>context;
const tracks=Array.from({length:3},(_,i)=>Object.assign(element(),{dataset:{src:`track-${i}.mp3`,title:`Track ${i}`,artist:'Artist'}}));
const toggles=[element(),element()],bars=Array.from({length:7},()=>element()),icons=[element(),element()];
const dock=element(),transport=element(),body=element();
const reduced=Object.assign(element(),{matches:false}),fine=Object.assign(element(),{matches:false});
const document=Object.assign(element(),{hidden:false,body,documentElement:element(),
  querySelector(selector){return ids.get(selector)||({'.music-dock':dock,'.music-transport':transport})[selector];},
  querySelectorAll(selector){return ({'[data-track]':tracks,'[data-music-toggle]':toggles,'.dock-spectrum i':bars,'[data-play-icon]':icons})[selector]||[];},
  createElement(){const node=element();created.push(node);return node;},
});
const sandbox={console,document,navigator:{},window:{addEventListener(){},createDragonSculpture(){return {kind:'test',resize:coordinates,render(time,state){coordinates(time,state.yaw,state.pitch,state.zoom,state.low);draws++;lastPose={time,...state};}};}},devicePixelRatio:1,
  matchMedia:query=>query.includes('prefers-reduced-motion')?reduced:fine,
  performance:{now:()=>now},requestAnimationFrame:callback=>{frames.set(++nextFrame,callback);return nextFrame;},
  cancelAnimationFrame:id=>frames.delete(id),
  IntersectionObserver:class {constructor(callback){this.callback=callback;observers.push(this);}observe(target){this.target=target;this.callback([{isIntersecting:true}]);}},
  ResizeObserver:class {constructor(callback){this.callback=callback;resizeCallback=callback;}observe(){this.callback();}},
};
sandbox.window.IntersectionObserver=sandbox.IntersectionObserver;
sandbox.window.ResizeObserver=sandbox.ResizeObserver;
vm.runInNewContext(readFileSync(new URL('../assets/ui/ambience.js',import.meta.url),'utf8'),sandbox);
assert.equal(plays,0,'Loading must not autoplay');
assert.equal(frames.size,1,'Dragon must animate before audio starts');
document.emit('click');assert.equal(plays,0,'Unrelated clicks must not start playback');
function tick(){const pending=[...frames.values()];frames.clear();now+=50;pending.forEach(callback=>callback(now));}
const idleDraws=draws;tick();assert.ok(draws>idleDraws);assert.ok(lastPose.time>0);assert.equal(plays,0);
assert.equal(stage.dataset.renderState,'idle');
const controls=created.filter(node=>node.attributes['aria-label']?.includes('dragon'));
assert.equal(controls.length,5,'One dragon has view controls, no form selector');
const cameraBefore=lastPose.yaw;controls[1].emit('click');assert.ok(lastPose.yaw>cameraBefore);
const zoomBefore=lastPose.zoom;controls[3].emit('click');assert.ok(lastPose.zoom>zoomBefore);
controls[4].emit('click');assert.equal(lastPose.zoom,1);
const canvas=ids.get('#frequencyCanvas'),beforeDrag=lastPose.yaw;
canvas.emit('pointerdown',{button:0,pointerId:7,clientX:100,clientY:100});
canvas.emit('pointermove',{pointerId:7,clientX:145,clientY:120});
canvas.emit('pointerup');assert.ok(lastPose.yaw>beforeDrag,'Dragging must orbit the dragon');
controls[4].emit('click');

toggles[0].emit('click');await new Promise(setImmediate);
assert.equal(plays,1);assert.equal(stage.dataset.renderState,'active');assert.equal(frames.size,1);
tick();hold.emit('click');const frozen=draws;tick();assert.equal(draws,frozen);assert.equal(frames.size,0);
ids.get('#musicVolume').value='23';ids.get('#musicVolume').emit('input');assert.equal(ids.get('#musicVolumeValue').textContent,'23%');
tracks[2].emit('click');await new Promise(setImmediate);
assert.equal(audio.src,'track-2.mp3');assert.equal(hold.attributes['aria-pressed'],'true');assert.equal(frames.size,0);
ids.get('#musicSeek').value='500';ids.get('#musicSeek').emit('input');assert.equal(audio.currentTime,90);
hold.emit('click');tick();assert.ok(draws>frozen);assert.equal(frames.size,1);
for(let i=0;i<25;i++)tick();
stageWidth=390;stageHeight=390;resizeCallback();
tick();
const visibility=observers.find(observer=>observer.target===stage);
visibility.callback([{isIntersecting:false}]);assert.equal(frames.size,0);assert.equal(stage.dataset.renderState,'offscreen');
visibility.callback([{isIntersecting:true}]);assert.equal(frames.size,1);
document.hidden=true;document.emit('visibilitychange');assert.equal(frames.size,0);
document.hidden=false;document.emit('visibilitychange');reduced.matches=true;reduced.emit('change');
assert.equal(frames.size,0);assert.equal(hold.disabled,true);assert.equal(stage.dataset.renderState,'reduced');
const reducedDraws=draws;tick();assert.equal(draws,reducedDraws);
console.log('PASS: explicit playback, idle flight/rotation/zoom, hold/resume, seek/volume/tracks, offscreen/hidden sleep, reduced motion.');
