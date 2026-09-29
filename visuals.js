/* Deterministic, locally generated pixel art. Rendering never changes the world or physics. */
globalThis.MinerArt=(()=>{
  const tiles=new Map(),buildings=new Map(),icons=new Map();let craft=null,craftKey='';
  const palettes={
    dirt:['#49362e','#624637','#72513c','#805b40','#946b48','#a47a52'],
    coal:['#403834','#51443b','#625040','#705b46','#847057','#938063'],
    copper:['#453a31','#5e4938','#725540','#836149','#967052','#a17e5b'],
    iron:['#373b3b','#494b47','#5c5950','#6b6456','#807461','#91816a'],
    lumen:['#323c3c','#424c47','#53594e','#626655','#777966','#899078'],
    xenite:['#37333e','#49414b','#5b5056','#6b5b5e','#7c6b68','#8b7a73'],
    bedrock:['#252a30','#32373c','#40464a','#4c5254','#596164','#697173']
  };
  const ores={coal:['#34312c','#252b2c','#131c21','#4c514d'],copper:['#785c41','#ae6b43','#c48a53','#769780','#425f55'],quartz:['#9c927b','#c6bba2','#e0d8c2','#f0ead7'],iron:['#6d5a46','#7d8684','#a3aaa6','#baaa8b','#886047'],silver:['#728283','#9fafb9','#cad8df','#e3edef'],lumen:['#446e66','#66a898','#92cebb','#c2e5c8'],gold:['#9b7437','#c59b45','#e4b953','#f4d585'],cobalt:['#3e536c','#4a709e','#6089bf','#97b2d2'],xenite:['#705570','#9778a3','#bea0cc','#e0c5e3']};
  function rockPalette(y){
    const deep=['#333331','#49473f','#595446','#69604d','#7c7058','#8d8063'],t=Math.max(0,Math.min(1,(y-3)/150));
    return palettes.dirt.map((color,i)=>{const a=parseInt(color.slice(1),16),b=parseInt(deep[i].slice(1),16);return '#'+[16,8,0].map(s=>Math.round(((a>>s)&255)*(1-t)+((b>>s)&255)*t).toString(16).padStart(2,'0')).join('')});
  }
  ores.diamond=['#789ca2','#b3d6da','#e4f4ed','#ffffff'];
  function hash(x,y){let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0}
  function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
  function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
  function poly(c,color,p){c.fillStyle=color;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
  function text(c,str,x,y,size=7,color='#e3d4ad'){c.fillStyle=color;c.font=`bold ${size}px monospace`;c.textAlign='center';c.fillText(str,x,y);c.textAlign='start'}
  function sprite(b){
    const id=b.m.id,cacheKey=`${id}:${b.x}:${b.y}`;if(tiles.has(cacheKey))return tiles.get(cacheKey);
    const image=canvas(32,32),c=image.getContext('2d'),rng=random(hash(b.x,b.y)),p=id==='whiteSeal'?['#9ca8a6','#bac3bd','#d1d7cc','#e4e5d7','#f2f0df','#ffffef']:id==='bedrock'?palettes.bedrock:rockPalette(b.y);
    rect(c,p[2],0,0,32,32);
    // Sedimentary bands follow world coordinates, while grit and inclusions vary per block.
    for(let y=0;y<32;y++)for(let x=0;x<32;x++){
      const band=Math.sin((y+b.y*32)*.21+Math.sin((x+b.x*32)*.065)*1.4);
      const n=rng(),v=n<.025?0:n>.985?5:Math.max(1,Math.min(4,2+(band>.55?1:band<-.6?-1:0)+(n>.84?1:0)));
      rect(c,p[v],x,y,1,1);
    }
    for(let i=0;i<12;i++){const x=rng()*30,y=rng()*30,w=2+rng()*5,h=1+rng()*3;rect(c,p[(rng()*5)|0],x,y,w,h);if(i%3===0)rect(c,p[4],x,y,w-1,1)}
    // Irregular deposits are embedded in the host rock, with oxide and mineral facets.
    if(ores[id]){
      const q=ores[id],variant=hash(b.x+177,b.y-83)%6,angle=rng()*Math.PI*2;
      const centerX=10+rng()*12,centerY=10+rng()*12,count=variant===3?13:19;
      for(let i=0;i<count;i++){
        const u=(i/(count-1)-.5)*22,wave=Math.sin(i*.7)*3;
        let x,y;
        // Six deposit families: seams, forks, scattered grains, nodules, lenses, paired veins.
        if(variant===2){x=4+rng()*24;y=4+rng()*24}
        else if(variant===3){const group=i%3;x=8+group*8+(rng()-.5)*5;y=9+(group%2)*12+(rng()-.5)*6}
        else if(variant===4){const a=rng()*Math.PI*2,r=Math.sqrt(rng())*9;x=centerX+Math.cos(a)*r;y=centerY+Math.sin(a)*r*.55}
        else{const lateral=variant===1?(i%2?1:-1)*Math.abs(u)*.5:variant===5?(i%2?3:-3):wave;x=centerX+Math.cos(angle)*u-Math.sin(angle)*lateral;y=centerY+Math.sin(angle)*u+Math.cos(angle)*lateral}
        x=Math.max(3,Math.min(28,x));y=Math.max(3,Math.min(28,y));
        const radius=(id==='coal'?2.2:id==='gold'?1.1:1.4)+rng()*1.5,crystal=['quartz','lumen','xenite','diamond'].includes(id);
        const rx=radius*(id==='silver'?.55:crystal?.7:1),ry=radius*(id==='silver'?1.5:crystal?1.4:.8);
        // The same host rock surrounds all deposits; silhouettes and mineral facets identify ore.
        for(let oy=-Math.ceil(ry);oy<=ry;oy++)for(let ox=-Math.ceil(rx);ox<=rx;ox++){
          const edge=Math.abs(ox/rx)+Math.abs(oy/ry);
          if(edge>1.35+rng()*.22)continue;
          const shade=oy<-ry*.4?q[3]:edge>1.15?q[0]:q[1+(i%2)];rect(c,shade,x+ox,y+oy,1,1);
        }
      }
      for(let i=0;i<9;i++)rect(c,q[(rng()*q.length)|0],rng()*30,rng()*30,1+rng()*2,1);
      if(id==='diamond')for(let i=0;i<3;i++){const x=7+i*8,y=8+(hash(b.x+i,b.y)%16);poly(c,'#bdd8db',[[x,y-4],[x+4,y],[x,y+4],[x-3,y]]);poly(c,'#f4fff8',[[x,y-4],[x,y+2],[x-3,y]]);rect(c,'#ffffff',x,y-1,2,1)}
    }
    if(id==='bedrock'||id==='whiteSeal')for(let i=0;i<4;i++){let x=rng()*32,y=rng()*32;for(let j=0;j<9;j++){rect(c,p[0],x,y,2,1);x+=2;y+=(rng()>.5?1:-1)}}
    // Recessed lower edge is only one source pixel; the full tile remains visibly solid.
    rect(c,'#211e1b15',0,31,32,1);
    // A continuous, eased fade over all 258 underground rows, never abrupt layer bands.
    const depth=Math.max(0,Math.min(1,(b.y-3)/278)),shade=id==='whiteSeal'?0:.38*depth*depth*(3-2*depth);
    c.fillStyle=`rgba(0,0,0,${shade})`;c.fillRect(0,0,32,32);
    if(tiles.size>=512)tiles.delete(tiles.keys().next().value);tiles.set(cacheKey,image);return image;
  }
  function terrain(c,b,x,y,tile){
    c.drawImage(sprite(b),x,y,tile,tile);
    const unit=tile/32;
    if(b.hit>0){c.save();c.translate(x,y);c.scale(unit,unit);const rng=random(hash(b.x+99,b.y-7));for(let i=0;i<Math.ceil(b.hit*5);i++){let px=16,py=16;for(let j=0;j<8;j++){rect(c,'#201e20',px,py,2,1);px+=(rng()-.5)*6;py+=(rng()-.5)*6}}c.restore()}
    if(b.gasRisk){c.save();c.translate(x,y);c.scale(unit,unit);for(let i=0;i<5;i++)rect(c,i%2?'#80bbb0':'#45696c',7+i*3,8+(i%3),2,1);c.restore()}
  }
  function disk(c,x,y,r){for(let iy=-r;iy<=r;iy+=3){const span=Math.sqrt(Math.max(0,r*r-iy*iy));rect(c,'#bcad99',x-span,y+iy,span*2,3);rect(c,'#9e9185',x+span*.25,y+iy,span*.7,3)}rect(c,'#9a8c81',x-15,y-8,10,4);rect(c,'#d0bea2',x-5,y+9,18,3)}
  function mix(a,b,t){const aa=parseInt(a.slice(1),16),bb=parseInt(b.slice(1),16);return '#'+[16,8,0].map(s=>Math.round(((aa>>s)&255)*(1-t)+((bb>>s)&255)*t).toString(16).padStart(2,'0')).join('')}
  function cycle(state){
    const phase=((state.worldTime??120)%360)/360,solar=Math.cos((phase-.5)*Math.PI*2),light=Math.max(0,Math.min(1,(solar+.22)/.75));
    const minutes=Math.floor(phase*1440),clock=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
    return {phase,light,night:1-light,clock,label:phase<.21||phase>=.8?'NIGHT':phase<.3?'DAWN':phase<.7?'DAY':'DUSK'};
  }
  function background(c,w,h,cameraX,cameraY,tile,state,time){
    const ground=cameraY+2.5*tile;
    c.fillStyle='#1c2025';c.fillRect(0,0,w,h);
    // Exposed cavern walls stay dark and textured below the actual surface.
    for(let y=Math.floor(-cameraY/(tile*2))-1;y<Math.ceil((h-cameraY)/(tile*2))+1;y++){
      const py=cameraY+y*tile*2;
      if(py<ground-2*tile)continue;
      for(let x=-1;x<w/(tile*2)+1;x++){const n=hash(x+Math.floor(-cameraX/(tile*2)),y);rect(c,n%2?'#21262a':'#262a2b',x*tile*2+cameraX%(tile*2),py+(n%23),tile*1.7,3+n%9)}
    }
    if(ground<=0)return;
    c.save();c.beginPath();c.rect(0,0,w,Math.min(h,ground));c.clip();
    const light=cycle(state),sky=c.createLinearGradient(0,ground-500,0,ground);sky.addColorStop(0,mix('#080e20','#262d41',light.light));sky.addColorStop(.45,mix('#161d36','#706076',light.light));sky.addColorStop(.8,mix('#293044','#bc8b7b',light.light));sky.addColorStop(1,mix('#3e3a50','#d2af82',light.light));c.fillStyle=sky;c.fillRect(0,0,w,Math.min(h,ground));
    c.save();c.globalAlpha=light.night*.85;for(let i=0;i<75;i++){const n=hash(i,746);rect(c,i%4?'#aabfcd':'#ecdbb4',n%Math.ceil(w),(ground-390+n%300),i%9===0?2:1,1)}c.restore();
    if(light.phase>.23&&light.phase<.77){const progress=(light.phase-.23)/.54,sx=w*(.1+progress*.8)-state.x*tile*.012,sy=ground-35-Math.sin(progress*Math.PI)*210;rect(c,'#ebc295',sx-9,sy-12,18,24);rect(c,'#ebc295',sx-12,sy-9,24,18);rect(c,'#f6ddb0',sx-7,sy-8,13,14)}
    const moonX=w*.75-state.x*tile*.035,moonY=ground-220;disk(c,moonX,moonY,44);disk(c,w*.24-state.x*tile*.018,ground-260,12);
    for(let i=0;i<16;i++){const n=hash(i,921);rect(c,'#e5cba326',(n%1200)-state.x*tile*.045,ground-250+n%180,25+n%110,2+n%4)}
    const layers=[{color:'#756276',height:112,scale:.10},{color:'#625769',height:76,scale:.19},{color:'#504c57',height:40,scale:.30}];
    for(const [index,l] of layers.entries()){
      c.fillStyle=mix(['#22283e','#1c2637','#172331'][index],l.color,light.light);c.beginPath();c.moveTo(0,ground);
      for(let x=-12;x<=w+12;x+=9){const wx=x+state.x*tile*l.scale;const ridge=Math.sin(wx*.011+index*2)*.4+Math.sin(wx*.026)*.19+Math.sin(wx*.055+2)*.12;const py=Math.round((ground-24-l.height*(.45+ridge))/3)*3;c.lineTo(x,py);c.lineTo(x+9,py)}
      c.lineTo(w+12,ground+1);c.closePath();c.fill();
    }
    // Distant basalt spires and deserted industrial silhouettes.
    for(let i=-3;i<10;i++){const n=hash(i,172),x=i*183-state.x*tile*.32+60,base=ground-7;poly(c,'#44434b',[[x-12,base],[x-7,base-22-n%37],[x+1,base-38-n%40],[x+9,base-18],[x+13,base]]);if(i%3===0){rect(c,'#55505a',x+45,base-14,30,12);rect(c,'#55505a',x+50,base-22,2,8)}}
    for(let i=0;i<28;i++){const n=hash(i,909),x=((n%10000)/10000*w+time*(4+n%7))%(w+50)-25;rect(c,'#efd4a73b',x,ground-12-n%82,2+n%4,1)}
    c.restore();
  }
  function weather(c,seed,w,h){const r=random(seed);for(let i=0;i<65;i++){const x=5+r()*(w-9),y=29+r()*(h-32);rect(c,i%3?'#6d493b':'#ad8559',x,y,1+r()*3,1);if(i%7===0)rect(c,'#735240',x,y+1,2,2+r()*4)}}
  function building(type){
    if(buildings.has(type))return buildings.get(type);
    const image=canvas(96,70),c=image.getContext('2d');
    // All doors and equipment terminate on the same bedrock surface at row 70.
    rect(c,'#2c2d2e',5,28,86,42);rect(c,'#625e55',7,29,82,39);
    for(let x=9;x<89;x+=5)rect(c,'#4c4d49',x,30,1,37);
    poly(c,'#3e4140',[[3,28],[9,22],[82,20],[93,27],[93,31],[3,31]]);rect(c,'#94745b',8,23,73,2);
    rect(c,'#333839',70,12,6,11);rect(c,'#756653',69,11,9,3);
    rect(c,'#5d6459',12,7,1,16);rect(c,'#777364',9,7,7,1);rect(c,'#403f3b',9,5,1,3);
    weather(c,type==='garage'?351:type==='fuel'?471:632,90,70);
    rect(c,'#282b2c',18,13,51,12);rect(c,'#9e8259',19,14,49,1);
    text(c,type==='garage'?'REPAIRS':type==='fuel'?'FUEL':'ORE / BUY',44,22,7);
    if(type==='garage'){
      rect(c,'#282c30',21,33,50,37);rect(c,'#131e22',25,36,42,34);
      // Raised roller door, warm work lamp, bench, crane, and spare tires.
      for(let y=34;y<43;y+=3){rect(c,'#777369',22,y,47,2);rect(c,'#383d3e',22,y+2,47,1)}
      rect(c,'#a09a7c',46,43,1,5);rect(c,'#dbb96d',42,47,9,2);rect(c,'#ffdda0',44,49,5,1);
      rect(c,'#705d44',31,60,28,3);rect(c,'#525149',33,63,2,7);rect(c,'#525149',56,63,2,7);
      rect(c,'#8e5240',37,55,11,5);rect(c,'#c29864',37,55,11,1);rect(c,'#566666',51,56,5,4);
      rect(c,'#a07a44',62,46,2,24);rect(c,'#a07a44',53,46,11,2);rect(c,'#778886',53,48,1,5);rect(c,'#656d68',50,52,7,5);
      rect(c,'#222b2e',9,58,10,11);rect(c,'#77786c',12,61,4,5);rect(c,'#252d2e',75,56,11,14);rect(c,'#73796a',78,60,5,6);
      rect(c,'#d0a956',21,68,50,2);for(let x=23;x<70;x+=8)rect(c,'#383837',x,68,4,2);
    }else if(type==='fuel'){
      rect(c,'#333a39',10,41,26,29);rect(c,'#837f68',12,39,22,28);rect(c,'#b2a185',14,40,18,2);rect(c,'#555d54',12,48,22,3);rect(c,'#555d54',12,59,22,3);
      rect(c,'#8e6842',21,45,5,11);rect(c,'#434741',22,48,3,4);
      rect(c,'#9e7b49',46,48,13,22);rect(c,'#c4a365',47,47,11,2);rect(c,'#263c3c',49,51,7,5);rect(c,'#9fa77d',50,52,5,1);
      rect(c,'#252d2e',60,50,2,16);rect(c,'#252d2e',58,65,4,2);rect(c,'#79817b',59,49,4,2);
      rect(c,'#363c3c',73,42,10,28);rect(c,'#879078',75,44,6,7);rect(c,'#d1b66b',75,59,2,2);
    }else{
      rect(c,'#222e30',13,37,23,24);rect(c,'#5d7371',15,39,19,13);rect(c,'#9dada0',16,40,7,2);rect(c,'#313a38',25,39,1,13);
      rect(c,'#706951',11,57,28,4);rect(c,'#403e34',12,62,26,8);
      rect(c,'#313a39',42,59,39,11);rect(c,'#848674',43,58,37,3);for(let x=45;x<80;x+=5)rect(c,'#494f48',x,62,3,3);
      poly(c,'#968b70',[[47,58],[51,51],[57,53],[62,48],[69,54],[73,52],[78,58]]);
      rect(c,'#655a43',73,40,12,14);rect(c,'#b28e55',74,41,10,2);rect(c,'#9d834d',74,48,10,1);
    }
    // Scattered salvage and anchors, contained within the three-block landing pad.
    rect(c,'#252d30',2,67,7,3);rect(c,'#78725d',3,65,4,2);rect(c,'#3b4140',88,64,6,6);
    poly(c,'#7d6952',[[88,56],[92,54],[95,69],[90,69]]);rect(c,'#a58d63',89,58,1,5);
    buildings.set(type,image);return image;
  }
  function stations(c,cameraX,cameraY,tile,state,time){
    const gy=cameraY+2.5*tile;
    if(gy<-tile||gy>c.canvas.height+tile*3)return;
    for(const [wx,type,label] of [[-8,'fuel','FUEL DEPOT'],[0,'ore','ORE EXCHANGE'],[8,'garage','UPGRADE GARAGE']]){
      const x=cameraX+(wx-1.5)*tile;
      rect(c,'#6a6860',x,gy,3*tile,5);rect(c,'#313b3c',x,gy+5,3*tile,5);
      for(let k=0;k<12;k++)rect(c,k%2?'#bb9957':'#303638',x+k*tile/4,gy,Math.ceil(tile/4),3);
      c.drawImage(building(type),x,gy-70*tile/32,3*tile,70*tile/32);
      const night=cycle(state).night;if(night>.05){const u=tile/32,lampX=cameraX+wx*tile,lampY=gy-28*u;c.save();c.globalAlpha=night;rect(c,'#ecc68212',lampX-20*u,lampY-4*u,40*u,30*u);rect(c,'#ecc68218',lampX-12*u,lampY,24*u,24*u);rect(c,'#f5d293',lampX-2*u,lampY,4*u,u*2);c.restore()}
      const near=state.y<2.6&&Math.abs(state.x-wx)<=.55;
      c.font='bold 9px monospace';c.textAlign='center';c.fillStyle=near?'#f4cc75':'#d7c4a6';c.fillText(label,cameraX+wx*tile,gy-70*tile/32-7);c.textAlign='start';
      if(near){c.fillStyle='#f4cb73';c.fillRect(cameraX+wx*tile-3,gy-70*tile/32-20,6,3)}
    }
  }
  function tier(level){return Math.min(3,Math.floor((level||0)/3))}
  function drillFinish(level){return ['#a6b4af','#d2b574','#91c9ba','#bdd1ed'][tier(level)]}
  function shipSprite(up={}){
    const signature=['drill','engine','tank','radiator','hull','cargo'].map(id=>up[id]||0).join(':');
    if(craft&&craftKey===signature)return craft;craftKey=signature;craft=canvas(32,32);const c=craft.getContext('2d');
    const hull=tier(up.hull),armor=['#ad7b3d','#a29c78','#6e9589','#677f9e'][hull],light=['#d3a252','#d0c5a0','#a1c3a3','#b3c7d5'][hull];
    poly(c,'#252f34',[[10,4],[23,4],[27,10],[29,16],[28,24],[22,29],[9,29],[3,22],[3,13]]);
    rect(c,'#4d5858',3,13,5,11);rect(c,'#809084',4,14,2,6);rect(c,'#4d5858',25,13,4,11);rect(c,'#809084',26,14,2,6);
    poly(c,armor,[[10,5],[22,5],[26,12],[24,25],[9,25],[7,16]]);
    rect(c,light,10,5,12,3);rect(c,'#e6bf74',11,5,10,1);
    poly(c,'#293d43',[[12,8],[22,8],[25,15],[9,15]]);poly(c,'#5c8991',[[13,9],[21,9],[23,13],[11,13]]);rect(c,'#a7c0b4',13,9,7,1);rect(c,'#395760',18,10,2,3);
    rect(c,light,8,17,17,7);rect(c,armor,9,17,14,1);rect(c,'#886538',8,23,17,2);
    rect(c,'#3b494d',11,19,8,4);rect(c,'#7d8680',12,19,6,1);for(let x=12;x<19;x+=2)rect(c,'#1c2e35',x,20,1,2);
    rect(c,'#ffe0a0',8,16,3,2);rect(c,'#ffe0a0',23,16,2,2);
    rect(c,'#485758',10,25,13,3);rect(c,'#9b9f8a',12,25,9,1);rect(c,'#596663',13,28,6,2);
    rect(c,'#403d32',8,18,2,1);rect(c,'#f0c56e',21,21,2,1);rect(c,'#715034',21,6,1,2);rect(c,'#9eab96',15,3,1,2);
    for(const [x,y] of [[8,13],[24,13],[10,24],[23,24]])rect(c,'#bfc4ab',x,y,1,1);
    // Separate fitted modules; each purchase changes its part even within a material tier.
    if(up.engine){const color=['#a2a999','#c5a46a','#87b9b1','#acbce3'][tier(up.engine)];for(const x of [3,25]){rect(c,color,x,14,4,9);for(let i=0;i<up.engine;i++)rect(c,'#273d45',x+(i%2)*2,15+Math.floor(i/2),1,1);rect(c,'#20343e',x,23,4,2)}}
    if(up.tank){const length=5+Math.floor(up.tank/2),color=['#ad945e','#aa7654','#819e75','#94b3bb'][tier(up.tank)];rect(c,'#2c3e41',16-length/2-1,2,length+2,5);rect(c,color,16-length/2,3,length,3);rect(c,'#dbd2a4',16-length/2,3,length,1);for(let i=0;i<up.tank;i++)rect(c,'#42554f',11+i,5,1,1)}
    if(up.radiator){rect(c,'#233b40',10,19,11,5);const color=['#adab82','#acbeae','#87c4c1','#b5c5e5'][tier(up.radiator)];for(let i=0;i<up.radiator;i++)rect(c,color,10+i,19+(i%2),1,4-(i%2))}
    if(up.hull){for(let i=0;i<up.hull;i++){const side=i%2?23:8;rect(c,'#32464b',side,16+Math.floor(i/2),2,1);rect(c,light,side,16+Math.floor(i/2),1,1)}if(up.hull>=6){rect(c,armor,9,14,3,3);rect(c,armor,22,14,3,3)}}
    if(up.cargo){const wide=12+Math.min(4,Math.floor(up.cargo/2)),color=['#9b8358','#bab087','#86a49a','#a4b6cf'][tier(up.cargo)];rect(c,'#253a3f',16-wide/2,24,wide,5);rect(c,color,16-wide/2,24,wide,1);rect(c,color,16-wide/2,28,wide,1);for(let i=0;i<up.cargo;i++)rect(c,color,11+i,25,1,2)}
    // Stowed cutter stays visible at rest; the moving drill deploys from this assembly.
    rect(c,'#283b42',13,27,6,3);rect(c,drillFinish(up.drill),14,27,4,2);
    if(up.drill){rect(c,'#273d45',11,26,10,1);for(let i=0;i<up.drill;i++)rect(c,drillFinish(up.drill),11+i,26,1,1)}
    // The painted body stays inside the existing circular collider, including its corners.
    const pixels=c.getImageData(0,0,32,32);for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(Math.hypot(x+.5-16,y+.5-16)>14.65)pixels.data[(y*32+x)*4+3]=0;c.putImageData(pixels,0,0);
    return craft;
  }
  function ship(c,x,y,tile,state,time){
    const u=tile/32;const up=state.keys.has('w')||state.keys.has('arrowup')||state.joystick.y<-.15;
    c.save();c.translate(x,y);c.scale(u,u);
    const engine=state.up?.engine||0,flame=['#c69a55','#69c4ba','#79aaf0','#c6a7ef'][tier(engine)],core=['#f3d69b','#d9f4c3','#d9efff','#f0e3ff'][tier(engine)];
    if(up){const flicker=2+Math.floor((Math.sin(time*33)+1)*2)+Math.floor(engine/2);rect(c,flame,-11,7,4,8+flicker);rect(c,core,-10,7,2,5+flicker);rect(c,flame,8,7,4,8+flicker);rect(c,core,9,7,2,5+flicker)}
    const sideInput=(state.keys.has('d')||state.keys.has('arrowright')?1:0)-(state.keys.has('a')||state.keys.has('arrowleft')?1:0)+(state.joystick.active?state.joystick.x:0);
    if(Math.abs(sideInput)>.15){const side=sideInput>0?-1:1,length=4+Math.floor(engine/2);rect(c,flame,side>0?13:-13-length,-1,length,2);rect(c,core,side>0?13:-15,-1,2,2)}
    if(state.keys.has('s')||state.keys.has('arrowdown')||state.joystick.y>.15){const length=5+Math.floor(engine/3)+Math.floor((Math.sin(time*33)+1)*1.5);for(const nozzle of [-6,4]){rect(c,flame,nozzle,-13-length,2,length);rect(c,core,nozzle,-13-Math.max(2,length-2),1,Math.max(2,length-2))}}
    c.restore();c.drawImage(shipSprite(state.up),x-tile/2,y-tile/2,tile,tile);
  }
  function drill(c,x,y,tile,d,level=0){
    if(d.extension<.005)return;c.save();c.translate(x,y);c.rotate(d.direction==='right'?0:d.direction==='left'?Math.PI:Math.PI/2);c.scale(tile/32,tile/32);
    const tip=5+Math.round(d.extension*15),base=tip-6;
    const width=3+level*.18,metal=drillFinish(level);
    rect(c,'#26363d',4,-width,Math.max(1,base-4),width*2);rect(c,metal,4,-1,Math.max(1,base-4),2);rect(c,'#e1e3ce',5,-1,Math.max(0,base-6),1);rect(c,metal,base-1,-width,2,width*2);
    for(let i=0;i<6;i++){const radius=Math.max(1,width-Math.floor(i/2));rect(c,(Math.floor(d.spin*2)+i)%3===0?metal:'#566c74',base+i,-radius,1,radius*2)}
    if(d.active&&d.extension>.75)for(let i=0;i<3;i++)rect(c,i%2?'#b18045':'#f6d18a',tip+1+(Math.floor(d.spin*3)+i)%4,Math.round(Math.sin(d.spin+i*2)*4),1,1);
    c.restore();
  }
  function explosion(c,x,y,tile,life){const p=1-life/.42;c.save();c.globalAlpha=Math.max(0,life/.42);for(let i=0;i<16;i++){const a=i*Math.PI/8,r=(.1+p*.8)*tile;rect(c,i%3?'#cb8851':'#efd2a0',x+Math.cos(a)*r,y+Math.sin(a)*r,3+p*4,3+p*4)}c.restore()}
  function icon(id){
    if(icons.has(id))return icons.get(id);const image=canvas(32,32),c=image.getContext('2d');
    rect(c,'#222e31',0,0,32,32);
    if(id==='drill'){rect(c,'#a77c43',4,12,9,8);rect(c,'#7c9291',10,14,7,4);for(let x=17;x<28;x++){const h=Math.max(1,5-Math.floor((x-17)/2));rect(c,x%3?'#90a4a0':'#d4d2b0',x,16-h,1,2*h)}}
    if(id==='engine'){rect(c,'#566c6c',6,8,16,16);rect(c,'#b48c49',9,9,11,3);rect(c,'#1b2b30',8,14,13,7);rect(c,'#96c3ba',22,14,4,6);rect(c,'#edd38c',26,15,3,4)}
    if(id==='tank'){rect(c,'#344649',9,5,15,23);rect(c,'#a68e5f',10,7,13,19);rect(c,'#d3b778',12,6,9,2);rect(c,'#6d7668',9,11,15,3);rect(c,'#6d7668',9,22,15,3);rect(c,'#9eafa0',15,3,4,3)}
    if(id==='radiator'){rect(c,'#849b91',5,7,23,20);rect(c,'#364a4b',7,9,19,16);for(let x=9;x<25;x+=3)rect(c,'#b0b8a0',x,9,1,16);rect(c,'#a57b45',4,11,2,11)}
    if(id==='hull'){poly(c,'#516367',[[7,5],[26,5],[25,20],[16,29],[7,21]]);poly(c,'#b69350',[[10,8],[23,8],[22,18],[16,25],[10,19]]);rect(c,'#e1bd76',10,8,13,2);rect(c,'#626e66',15,13,3,7)}
    if(id==='cargo'){rect(c,'#524b3b',5,8,23,21);rect(c,'#a18551',7,9,19,18);rect(c,'#d0af70',7,9,19,2);rect(c,'#585d4c',10,10,2,17);rect(c,'#585d4c',21,10,2,17);rect(c,'#d2b87b',14,16,5,4)}
    const url=image.toDataURL();icons.set(id,url);return url;
  }
  function renewal(c,w,h,cameraX,cameraY,tile,time){
    if(time<16)return;
    const ground=cameraY+2.5*tile,sourceX=cameraX+3*tile,age=time-16,grow=Math.max(0,Math.min(1,(age-1)/9));
    const plume=Math.min(1,age/1.2),jetHeight=tile*(1.6+.12*Math.sin(age*5))*plume;
    poly(c,'#6ec5c1a8',[[sourceX-tile*.32,ground],[sourceX-tile*.2,ground-jetHeight*.7],[sourceX-tile*.4,ground-jetHeight],[sourceX+tile*.15,ground-jetHeight*.95],[sourceX+tile*.22,ground-jetHeight*.55],[sourceX+tile*.32,ground]]);
    rect(c,'#c9efe1b0',sourceX-tile*.05,ground-jetHeight*.75,tile*.12,jetHeight*.75);
    // Water shoots out of the new spillway and returns as a wide, sparkling rain.
    for(let i=0;i<90;i++){
      const n=hash(i,703),life=((age*(.45+(n%7)*.015)+i*.071)%1),direction=i%2?1:-1,reach=(2+n%15)*tile;
      const x=sourceX+direction*reach*life,y=ground-Math.sin(life*Math.PI)*(2+(n%4))*tile;
      rect(c,i%3?'#99dcca':'#d6f5de',x,y,2+(n%2),4);
      if(life>.93)rect(c,'#c1edcf',x-3,ground-2,7,2);
    }
    if(!grow)return;
    for(let wx=-39;wx<40;wx+=.5){
      if([-9,-8,-7,-1,0,1,7,8,9].some(p=>Math.abs(wx-p)<.5))continue;
      const seed=hash(Math.floor(wx*2),617),x=cameraX+wx*tile;
      rect(c,'#4f8050',x,ground-3*grow,tile/2+1,4*grow);
      for(let j=0;j<3;j++)rect(c,j%2?'#9eb76b':'#68975a',x+j*tile/7,ground-(5+seed%8)*grow,2,(5+seed%8)*grow);
      if(seed%4===0)rect(c,'#d8b47e',x+tile/5,ground-9*grow,3,3);
      if(seed%7===0){rect(c,'#527f4e',x-tile*.12,ground-tile*.25*grow,tile*.42,tile*.25*grow);rect(c,'#87a96a',x,ground-tile*.3*grow,tile*.25,tile*.12*grow)}
    }
    for(const wx of [-33,-26,-19,-14,-5,6,13,19,26,34]){
      const n=hash(wx,82),x=cameraX+wx*tile,tree=Math.max(0,Math.min(1,grow*1.3-(n%4)*.08));if(tree<=0)continue;
      c.save();c.translate(x,ground);c.scale(tree,tree);
      const height=(1.5+(n%5)*.24)*tile;
      rect(c,'#665440',-tile*.08,-height,tile*.16,height);rect(c,'#9c8b58',-tile*.05,-height,tile*.04,height);
      for(let k=0;k<3;k++){const y=-height+tile*.2*k,width=tile*(.75-k*.12);poly(c,k%2?'#56885a':'#3c6c50',[[-width,y],[ -width*.8,y-tile*.35],[-tile*.2,y-tile*.52],[tile*.55,y-tile*.4],[width,y],[width*.65,y+tile*.25],[-width*.65,y+tile*.2]]);rect(c,'#9eb675',-width*.5,y-tile*.22,width*.7,tile*.08)}
      c.restore();
    }
  }
  const previews=new Map();
  function upgradePreview(id,up,level){
    const fitted={...up,[id]:level},key=id+':'+['drill','engine','tank','radiator','hull','cargo'].map(k=>fitted[k]||0).join(':');
    if(previews.has(key))return previews.get(key);
    const image=canvas(64,64),c=image.getContext('2d');c.imageSmoothingEnabled=false;rect(c,'#19282d',0,0,64,64);
    const state={up:fitted,keys:new Set(id==='engine'?['w']:[]),joystick:{x:0,y:0,active:false},vx:0};
    ship(c,30,29,48,state,0);
    if(id==='drill')drill(c,30,29,48,{extension:1,spin:1,active:false,direction:'right'},level);
    const url=image.toDataURL();if(previews.size>=64)previews.delete(previews.keys().next().value);previews.set(key,url);return url;
  }
  return {terrain,background,stations,ship,drill,explosion,icon,sprite,building,shipSprite,cycle,upgradePreview,renewal};
})();
