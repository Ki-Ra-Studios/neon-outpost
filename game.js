(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha:false });
  const $ = id => document.getElementById(id);

  const state = {
    running:false, over:false, time:0, wave:1, score:0,
    hp:100, core:100, energy:100, waveTimer:0, spawnTimer:0,
    kills:0, shake:0, last:0, dpr:1
  };

  const player = {x:0,y:0,r:16,speed:260,fire:0,invuln:0};
  const enemies = [], bullets = [], particles = [], stars = [];
  const keys = new Set();
  const pointer = {active:false,id:null,x:0,y:0,baseX:0,baseY:0};

  function resize(){
    state.dpr = Math.min(devicePixelRatio || 1, 2);
    const w = innerWidth, h = innerHeight;
    canvas.width = Math.floor(w * state.dpr);
    canvas.height = Math.floor(h * state.dpr);
    ctx.setTransform(state.dpr,0,0,state.dpr,0,0);
    if (!player.x) { player.x = w/2; player.y = h*.72; }
    for(let i=stars.length;i<Math.ceil(w*h/9000);i++) stars.push({
      x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.5+.3,a:Math.random()*.6+.2
    });
  }
  addEventListener("resize",resize,{passive:true}); resize();

  function reset(){
    state.running=true; state.over=false; state.time=0; state.wave=1; state.score=0;
    state.hp=100; state.core=100; state.energy=100; state.waveTimer=0; state.spawnTimer=.3;
    state.kills=0; state.shake=0;
    enemies.length=bullets.length=particles.length=0;
    player.x=innerWidth/2; player.y=innerHeight*.72; player.fire=0; player.invuln=0;
    $("start-screen").classList.add("hidden");
    $("game-over").classList.add("hidden");
    toast("OUTPOST ONLINE");
  }

  $("start").onclick=reset;
  $("restart").onclick=reset;

  function toast(text){
    const el=$("toast"); el.textContent=text; el.classList.add("show");
    clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove("show"),1200);
  }

  addEventListener("keydown",e=>{
    keys.add(e.key.toLowerCase());
    if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase())) e.preventDefault();
  });
  addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));

  canvas.addEventListener("pointerdown",e=>{
    pointer.active=true; pointer.id=e.pointerId; pointer.x=e.clientX; pointer.y=e.clientY;
    pointer.baseX=e.clientX; pointer.baseY=e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener("pointermove",e=>{
    if(pointer.active && e.pointerId===pointer.id){ pointer.x=e.clientX; pointer.y=e.clientY; }
  });
  const endPointer=e=>{
    if(e.pointerId===pointer.id){pointer.active=false;pointer.id=null;}
  };
  canvas.addEventListener("pointerup",endPointer);
  canvas.addEventListener("pointercancel",endPointer);

  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function spawn(){
    const w=innerWidth,h=innerHeight;
    const side=Math.floor(Math.random()*4);
    let x,y;
    if(side===0){x=-30;y=Math.random()*h}
    if(side===1){x=w+30;y=Math.random()*h}
    if(side===2){x=Math.random()*w;y=-30}
    if(side===3){x=Math.random()*w;y=h+30}
    const elite = Math.random() < Math.min(.04 + state.wave*.008,.22);
    const hp = (elite?90:35) + state.wave*7;
    enemies.push({
      x,y,r:elite?19:13,hp,maxHp:hp,speed:(elite?42:62)+state.wave*2,
      elite,damage:elite?15:7,phase:Math.random()*6.28
    });
  }

  function shoot(){
    if(player.fire>0 || state.energy<2) return;
    let target=null,best=Infinity;
    for(const e of enemies){
      const d=dist(player,e); if(d<best){best=d;target=e;}
    }
    if(!target) return;
    const a=Math.atan2(target.y-player.y,target.x-player.x);
    bullets.push({x:player.x+Math.cos(a)*18,y:player.y+Math.sin(a)*18,
      vx:Math.cos(a)*600,vy:Math.sin(a)*600,r:4,life:.9});
    player.fire=.16; state.energy-=2;
  }

  function burst(x,y,n=8){
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2,s=40+Math.random()*170;
      particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25+Math.random()*.45,max:.7,r:1+Math.random()*3});
    }
  }

  function update(dt){
    state.time+=dt; state.waveTimer+=dt; state.spawnTimer-=dt;
    state.shake=Math.max(0,state.shake-dt*18);
    player.invuln=Math.max(0,player.invuln-dt);
    player.fire=Math.max(0,player.fire-dt);
    state.energy=clamp(state.energy+dt*18,0,100);

    const speed=player.speed;
    let dx=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
    let dy=(keys.has("s")||keys.has("arrowdown")?1:0)-(keys.has("w")||keys.has("arrowup")?1:0);
    if(pointer.active){
      const px=pointer.x-pointer.baseX, py=pointer.y-pointer.baseY;
      const len=Math.hypot(px,py);
      if(len>12){dx=px/Math.max(60,len);dy=py/Math.max(60,len);}
    }
    const len=Math.hypot(dx,dy);
    if(len>1){dx/=len;dy/=len}
    player.x=clamp(player.x+dx*speed*dt,22,innerWidth-22);
    player.y=clamp(player.y+dy*speed*dt,70,innerHeight-22);

    if(state.spawnTimer<=0){
      spawn();
      state.spawnTimer=Math.max(.22,1.05-state.wave*.045);
    }
    if(state.waveTimer>=22){
      state.wave++; state.waveTimer=0; state.energy=100;
      toast("WAVE "+state.wave);
    }
    shoot();

    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i]; b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      let hit=false;
      for(let j=enemies.length-1;j>=0;j--){
        const e=enemies[j];
        if(Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.r){
          e.hp-=25; hit=true; burst(b.x,b.y,3);
          if(e.hp<=0){
            state.kills++; state.score+=e.elite?100:25; state.energy=clamp(state.energy+8,0,100);
            burst(e.x,e.y,e.elite?18:9); enemies.splice(j,1);
          }
          break;
        }
      }
      if(hit||b.life<=0)bullets.splice(i,1);
    }

    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i], a=Math.atan2(player.y-e.y,player.x-e.x);
      e.phase+=dt*3;
      e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;
      if(dist(e,player)<e.r+player.r){
        if(player.invuln<=0){
          state.hp-=e.damage;player.invuln=.55;state.shake=10;burst(player.x,player.y,10);
        }
        enemies.splice(i,1);continue;
      }
      if(dist(e,{x:innerWidth/2,y:innerHeight*.72})<36){
        state.core-=e.damage; state.shake=8; burst(e.x,e.y,10); enemies.splice(i,1);
      }
    }

    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.94;p.vy*=.94;p.life-=dt;
      if(p.life<=0)particles.splice(i,1);
    }
    if(state.hp<=0||state.core<=0) gameOver();
    render(); hud();
  }

  function gameOver(){
    if(!state.running)return;
    state.running=false;state.over=true;
    $("final-wave").textContent=state.wave;
    $("final-score").textContent=state.score;
    $("game-over").classList.remove("hidden");
    const high=Math.max(Number(localStorage.getItem("neonHigh")||0),state.score);
    localStorage.setItem("neonHigh",high);
    toast("SIGNAL LOST");
  }

  function hud(){
    $("wave").textContent=state.wave;$("score").textContent=state.score;
    $("hp").textContent=Math.max(0,Math.ceil(state.hp));
    $("core").textContent=Math.max(0,Math.ceil(state.core));
    $("energy").textContent=Math.ceil(state.energy);
    $("hp-bar").style.width=clamp(state.hp,0,100)+"%";
    $("core-bar").style.width=clamp(state.core,0,100)+"%";
    $("energy-bar").style.width=clamp(state.energy,0,100)+"%";
  }

  function render(){
    const w=innerWidth,h=innerHeight;
    ctx.save();
    const sx=(Math.random()-.5)*state.shake,sy=(Math.random()-.5)*state.shake;
    ctx.translate(sx,sy);
    ctx.fillStyle="#070b12";ctx.fillRect(-20,-20,w+40,h+40);

    // subtle grid
    ctx.strokeStyle="#122033";ctx.lineWidth=1;
    const grid=44, off=(state.time*8)%grid;
    for(let x=-grid+off;x<w+grid;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
    for(let y=-grid+off;y<h+grid;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
    for(const s of stars){ctx.globalAlpha=s.a;ctx.fillStyle="#b9d7ff";ctx.fillRect(s.x,s.y,s.r,s.r)}ctx.globalAlpha=1;

    // core
    const cx=w/2,cy=h*.72;
    ctx.beginPath();ctx.arc(cx,cy,38,0,Math.PI*2);ctx.fillStyle="#0c1727";ctx.fill();
    ctx.beginPath();ctx.arc(cx,cy,29,0,Math.PI*2);ctx.strokeStyle="#b68cff66";ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,21+Math.sin(state.time*4)*2,0,Math.PI*2);ctx.fillStyle="#b68cff22";ctx.fill();
    ctx.fillStyle="#d7c7ff";ctx.font="900 8px system-ui";ctx.textAlign="center";ctx.fillText("CORE",cx,cy+3);

    // bullets
    for(const b of bullets){
      ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fillStyle="#ffe27a";ctx.shadowBlur=12;ctx.shadowColor="#ffe27a";ctx.fill();ctx.shadowBlur=0;
    }

    // enemies
    for(const e of enemies){
      ctx.save();ctx.translate(e.x,e.y);
      ctx.rotate(Math.atan2(player.y-e.y,player.x-e.x)+Math.PI/4);
      ctx.fillStyle=e.elite?"#ff6e9b":"#ff526d";
      ctx.shadowBlur=e.elite?18:10;ctx.shadowColor=e.elite?"#ff6e9b":"#ff526d";
      ctx.beginPath();ctx.moveTo(0,-e.r);ctx.lineTo(e.r,0);ctx.lineTo(0,e.r);ctx.lineTo(-e.r,0);ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;ctx.restore();
      ctx.fillStyle="#26354c";ctx.fillRect(e.x-e.r,e.y-e.r-8,e.r*2,3);
      ctx.fillStyle="#ff6e9b";ctx.fillRect(e.x-e.r,e.y-e.r-8,e.r*2*(e.hp/e.maxHp),3);
    }

    // player
    ctx.save();ctx.translate(player.x,player.y);
    const blink=player.invuln>0 && Math.floor(state.time*20)%2;
    ctx.globalAlpha=blink?.35:1;
    ctx.fillStyle="#6ee7ff";ctx.shadowBlur=22;ctx.shadowColor="#6ee7ff";
    ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(15,13);ctx.lineTo(0,8);ctx.lineTo(-15,13);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle="#07111b";ctx.beginPath();ctx.arc(0,1,5,0,7);ctx.fill();
    ctx.restore();

    // joystick
    if(pointer.active){
      ctx.globalAlpha=.65;ctx.strokeStyle="#6ee7ff55";ctx.lineWidth=2;ctx.beginPath();ctx.arc(pointer.baseX,pointer.baseY,42,0,7);ctx.stroke();
      const dx=pointer.x-pointer.baseX,dy=pointer.y-pointer.baseY,len=Math.hypot(dx,dy),m=Math.min(28,len);
      ctx.fillStyle="#6ee7ff44";ctx.beginPath();ctx.arc(pointer.baseX+(dx/(len||1))*m,pointer.baseY+(dy/(len||1))*m,15,0,7);ctx.fill();ctx.globalAlpha=1;
    }
    ctx.restore();
  }

  function loop(t){
    const dt=Math.min(.033,(t-state.last)/1000||0);state.last=t;
    if(state.running)update(dt);else render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
