/* Original procedural dragon. Native WebGL, with a projected-canvas fallback. */
((root) => {
  'use strict';
  const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const mul=(a,s)=>a.map(v=>v*s),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>mul(a,1/(Math.hypot(...a)||1));
  function geometry(){
    const faces=[],edges=[],parts={};
    const cyan=[.23,.87,.88],ice=[.72,.95,.92],gold=[.89,.98,.32],pink=[1,.20,.42];
    const edge=(a,b,color,part)=>edges.push({a,b,color,part});
    const tri=(a,b,c,part)=>faces.push(...a,part,...b,part,...c,part);
    const fin=(a,b,c,color)=>{tri(a,b,c,0);edge(a,b,color,0);edge(b,c,color,0);edge(c,a,color,0);};
    function patch(name,fn,nu,nv,color,part=0){
      const grid=Array.from({length:nu+1},(_,i)=>Array.from({length:nv+1},(_,j)=>fn(i/nu,j/nv)));
      for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){
        const a=grid[i][j],b=grid[i+1][j],c=grid[i+1][j+1],d=grid[i][j+1];
        tri(a,b,c,part);tri(a,c,d,part);edge(a,b,color,part);edge(a,d,color,part);
      }
      for(let i=0;i<nu;i++)edge(grid[i][nv],grid[i+1][nv],color,part);
      for(let j=0;j<nv;j++)edge(grid[nu][j],grid[nu][j+1],color,part);
      parts[name]=(parts[name]||0)+(nu+1)*(nv+1);
    }
    const ellipsoid=(name,center,radii,color=cyan,nu=18,nv=10,part=0)=>patch(name,(u,v)=>{
      const a=u*Math.PI*2,b=v*Math.PI;
      return add(center,[Math.cos(a)*Math.sin(b)*radii[0],Math.cos(b)*radii[1],Math.sin(a)*Math.sin(b)*radii[2]]);
    },nu,nv,color,part);
    function curve(points,t){
      const f=Math.min(.999999,Math.max(0,t))*(points.length-1),i=Math.floor(f),s=f-i;
      const p=[points[Math.max(0,i-1)],points[i],points[Math.min(i+1,points.length-1)],points[Math.min(i+2,points.length-1)]];
      return [0,1,2].map(k=>.5*((2*p[1][k])+(-p[0][k]+p[2][k])*s+(2*p[0][k]-5*p[1][k]+4*p[2][k]-p[3][k])*s*s+(-p[0][k]+3*p[1][k]-3*p[2][k]+p[3][k])*s*s*s));
    }
    function tube(name,points,radius,color=cyan,length=24,around=8,part=0){
      patch(name,(u,v)=>{
        const p=curve(points,u),t=unit(sub(curve(points,Math.min(1,u+.001)),curve(points,Math.max(0,u-.001))));
        const b=unit(cross(t,Math.abs(t[1])<.9?[0,1,0]:[0,0,1])),n=cross(b,t),a=v*Math.PI*2;
        const r=typeof radius==='function'?radius(u):radius;
        return add(p,mul(add(mul(b,Math.cos(a)),mul(n,Math.sin(a))),r));
      },length,around,color,part);
    }
    ellipsoid('torso',[0,.08,0],[.38,.65,.30],cyan,20,12);
    ellipsoid('breast',[.05,.30,.12],[.31,.39,.27],gold,16,9);
    tube('neck',[[0,.48,0],[.08,.86,.03],[.36,1.16,.07],[.67,1.29,.10]],t=>.24-.09*t,ice,26,10);
    ellipsoid('head',[.78,1.34,.1],[.33,.22,.21],ice,18,10);
    ellipsoid('muzzle',[1.06,1.27,.11],[.32,.105,.155],cyan,16,7);
    ellipsoid('jaw',[1.01,1.10,.11],[.30,.065,.135],ice,14,6);
    tube('tail',[[0,-.48,0],[-.35,-.92,.12],[-.88,-1.05,.23],[-1.22,-.70,.27],[-1.25,-.20,.25],[-1.54,.04,.15],[-1.76,-.18,.02],[-1.64,-.50,-.05]],t=>.235*Math.pow(1-t,1.2)+.008,cyan,64,8,4);
    for(const side of [-1,1]){
      tube('horns',[[.62,1.48,.1+side*.15],[.43,1.71,.1+side*.27],[.18,1.89,.1+side*.38]],t=>.085*(1-t)+.003,gold,16,6);
      ellipsoid('eyes',[.89,1.43,.1+side*.195],[.048,.030,.026],pink,10,6,2);
      fin([.62,1.43,.1+side*.2],[.24,1.56,.1+side*.36],[.45,1.14,.1+side*.25],ice);
      tube('brows',[[.74,1.48,.1+side*.19],[.91,1.49,.1+side*.22],[1.01,1.43,.1+side*.17]],.024,gold,12,5);
      tube('arms',[[.1,.37,side*.23],[.43,.13,side*.42],[.36,-.18,side*.53],[.61,-.30,side*.56]],t=>.105-.055*t,cyan,20,7);
      tube('legs',[[.03,-.26,side*.20],[.33,-.49,side*.37],[.19,-.83,side*.48],[.46,-.99,side*.50]],t=>.155-.095*t,ice,22,8);
      for(let toe=-1;toe<=1;toe++){
        tube('claws',[[.57,-.29,side*.56+toe*.065],[.75,-.33,side*.56+toe*.08],[.82,-.42,side*.56+toe*.08]],t=>.03*(1-t)+.003,gold,7,4);
        tube('claws',[[.43,-.98,side*.50+toe*.075],[.63,-1.01,side*.50+toe*.09],[.70,-1.08,side*.50+toe*.09]],t=>.035*(1-t)+.003,gold,7,4);
      }
      const hinge=[side*.27,.46,-.16],knuckle=[side*1.04,1.31,-.36];
      const tips=[[side*2.15,1.44,-.44],[side*1.90,.75,-.58],[side*1.57,.07,-.48],[side*.72,-.24,-.23]];
      tube('wing-bones',[hinge,[side*.67,1.03,-.27],knuckle,tips[0]],t=>.045*(1-t)+.016,ice,25,5,1);
      for(let k=0;k<tips.length-1;k++){
        const a=knuckle,b=tips[k],c=tips[k+1];
        patch('wings',(u,v)=>{
          let outside=add(mul(b,1-v),mul(c,v));
          outside=add(outside,mul(sub(a,outside),.20*Math.sin(v*Math.PI)));
          const p=add(mul(a,1-u),mul(outside,u));
          p[2]-=Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*.24;
          return p;
        },9,7,[.14,.66,.72],1);
        tube('wing-fingers',[knuckle,mul(add(knuckle,tips[k+1]),.5),tips[k+1]],t=>.03-.018*t,cyan,15,4,1);
      }
      tube('wing-root',[hinge,[side*.47,-.08,-.21],tips[3]],.035,cyan,14,4,1);
      for(let tooth=0;tooth<4;tooth++)tube('teeth',[[.9+tooth*.105,1.22,.1+side*.12],[.93+tooth*.105,1.14,.1+side*.12]],t=>.022*(1-t)+.001,ice,3,4);
    }
    for(let i=0;i<9;i++){
      const y=.53-i*.13;
      tube('spines',[[-.18,y,-.21],[-.37,y+.13,-.31],[-.22,y-.10,-.24]],t=>.055*(1-t)+.002,gold,6,4);
    }
    for(let i=0;i<72;i++){
      const a=i/72*Math.PI*2,b=(i+1)/72*Math.PI*2;
      edge([Math.cos(a)*2.25,-1.30,Math.sin(a)*2.25],[Math.cos(b)*2.25,-1.30,Math.sin(b)*2.25],[.08,.25,.29],3);
    }
    return {faces:new Float32Array(faces),edges,parts};
  }
  root.DragonGeometry=geometry;
  if(typeof document==='undefined')return;
  root.createDragonSculpture=canvas=>{
    const model=geometry();
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
    let width=1,height=1,dpr=1;
    const rotate=(p,time,yaw,pitch)=>{
      let [x,y,z]=p;
      x*=1+.015*Math.sin(time*1.6);y-=.25;
      const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);
      return [xx,y*Math.cos(pitch)-zz*Math.sin(pitch),y*Math.sin(pitch)+zz*Math.cos(pitch)];
    };
    if(!gl){
      const c=canvas.getContext('2d');if(!c)return null;
      return {kind:'canvas',resize(w,h,r){width=w;height=h;dpr=r;canvas.width=w*r;canvas.height=h*r;c.setTransform(r,0,0,r,0,0);},render(time,state){
        c.clearRect(0,0,width,height);
        const distance=Math.max(5.5,4.8/(width/height))/state.zoom;
        const project=p=>{const v=rotate(p,time,state.yaw,state.pitch),s=height*1.06/(distance-v[2]);return [width*.5+v[0]*s,height*.51-v[1]*s,v[2]];};
        const lines=model.edges.map(e=>({...e,a:project(e.a),b:project(e.b)})).sort((a,b)=>a.a[2]+a.b[2]-b.a[2]-b.b[2]);
        c.lineWidth=.7;c.shadowBlur=3;
        for(const e of lines){const col=e.color.map(v=>Math.round(v*255));c.strokeStyle=`rgba(${col},${.25+(e.a[2]+e.b[2]+2)*.10})`;c.shadowColor=`rgb(${col})`;c.beginPath();c.moveTo(...e.a.slice(0,2));c.lineTo(...e.b.slice(0,2));c.stroke();}
        c.shadowBlur=0;
      }};
    }
    const common=`precision highp float;
      uniform float uTime,uYaw,uPitch,uDistance,uAspect,uBass;
      vec3 world(vec3 p,float part){
        if(part<2.5||part>3.5){p.x*=1.0+(.015+uBass*.018)*sin(uTime*1.6);p.y+=sin(uTime*1.2)*.025;}
        if(part>.5&&part<1.5){p.z+=sin(uTime*1.35+abs(p.x)*.2)*abs(p.x)*(.28+uBass*.17);}
        if(part>3.5){p.z+=sin(uTime*1.1+p.y*2.0)*.10;}
        p.y-=.25;
        p=vec3(cos(uYaw)*p.x+sin(uYaw)*p.z,p.y,-sin(uYaw)*p.x+cos(uYaw)*p.z);
        return vec3(p.x,cos(uPitch)*p.y-sin(uPitch)*p.z,sin(uPitch)*p.y+cos(uPitch)*p.z);
      }
      vec4 project(vec3 p){p.z-=uDistance;return vec4(p.x*2.12/uAspect,p.y*2.12,-1.002*p.z-.2002,-p.z);}`;
    function program(vertex,fragment){
      const p=gl.createProgram();
      for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
        const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
        if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);
      }
      gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
      const uniforms={};for(const name of ['uTime','uYaw','uPitch','uDistance','uAspect','uBass','uResolution','uThickness','uPass'])uniforms[name]=gl.getUniformLocation(p,name);
      return {p,uniforms};
    }
    const solid=program(common+`attribute vec4 aVertex;void main(){gl_Position=project(world(aVertex.xyz,aVertex.w));}`,
      `precision mediump float;void main(){gl_FragColor=vec4(.006,.014,.022,1.0);}`);
    const wire=program(common+`attribute vec3 aA,aB,aColor;attribute float aPart;attribute vec2 aCorner;
      uniform vec2 uResolution;uniform float uThickness;varying vec3 vColor;varying float vSide,vPulse;
      void main(){vec4 a=project(world(aA,aPart)),b=project(world(aB,aPart));
        vec2 direction=(b.xy/b.w-a.xy/a.w)*uResolution;float segmentLength=max(length(direction),.001);
        vec2 normal=vec2(-direction.y,direction.x)/segmentLength;
        vec4 p=mix(a,b,aCorner.x);p.xy+=normal*aCorner.y*uThickness/uResolution*p.w;p.z-=.0002*p.w;
        gl_Position=p;vColor=aColor;vSide=aCorner.y;
        vPulse=pow(max(0.0,sin(aA.y*2.7+aA.x*1.7-uTime*2.2)),14.0);
      }`, `precision highp float;varying vec3 vColor;varying float vSide,vPulse;uniform float uPass,uBass;
      void main(){float alpha=uPass<.5?.12*exp(-vSide*vSide*3.5):.82*(1.0-smoothstep(.22,1.0,abs(vSide)));
        vec3 color=mix(vColor,vec3(.94,1.0,.91),vPulse*.72);gl_FragColor=vec4(color*(1.0+uBass*.45),alpha);}`);
    const faceBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,faceBuffer);gl.bufferData(gl.ARRAY_BUFFER,model.faces,gl.STATIC_DRAW);
    const data=[];
    for(const e of model.edges)for(const [along,side] of [[0,-1],[1,-1],[1,1],[0,-1],[1,1],[0,1]])data.push(...e.a,...e.b,...e.color,e.part,along,side);
    const wireBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,wireBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
    function attribute(p,name,size,stride,offset){const i=gl.getAttribLocation(p,name);if(i<0)return;gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,stride*4,offset*4);}
    function uniforms(p,time,state){
      gl.useProgram(p.p);const u=p.uniforms;
      for(const [key,value] of Object.entries({uTime:time,uYaw:state.yaw,uPitch:state.pitch,uDistance:Math.max(5.5,4.8/(width/height))/state.zoom,uAspect:width/height,uBass:state.low||0}))if(u[key]!==null)gl.uniform1f(u[key],value);
    }
    let lost=false;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});
    return {kind:'webgl',resize(w,h,r){width=w;height=h;dpr=r;canvas.width=Math.round(w*r);canvas.height=Math.round(h*r);gl.viewport(0,0,canvas.width,canvas.height);},render(time,state){
      if(lost)return;
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.BLEND);
      uniforms(solid,time,state);gl.bindBuffer(gl.ARRAY_BUFFER,faceBuffer);attribute(solid.p,'aVertex',4,4,0);gl.drawArrays(gl.TRIANGLES,0,model.faces.length/4);
      uniforms(wire,time,state);gl.bindBuffer(gl.ARRAY_BUFFER,wireBuffer);
      attribute(wire.p,'aA',3,12,0);attribute(wire.p,'aB',3,12,3);attribute(wire.p,'aColor',3,12,6);attribute(wire.p,'aPart',1,12,9);attribute(wire.p,'aCorner',2,12,10);
      gl.uniform2f(wire.uniforms.uResolution,canvas.width,canvas.height);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);
      gl.uniform1f(wire.uniforms.uThickness,7*dpr);gl.uniform1f(wire.uniforms.uPass,0);gl.drawArrays(gl.TRIANGLES,0,data.length/12);
      gl.uniform1f(wire.uniforms.uThickness,1.15*dpr);gl.uniform1f(wire.uniforms.uPass,1);gl.drawArrays(gl.TRIANGLES,0,data.length/12);gl.depthMask(true);
    }};
  };
})(typeof window==='object'?window:globalThis);
