/* Original synthesized funk loop and machinery effects; no downloads or media dependencies. */
globalThis.MinerAudio=(()=>{
  const prefs={sound:true,music:true};try{const saved=JSON.parse(localStorage.getItem('deep-miner-audio')||'{}');for(const k of ['sound','music'])if(typeof saved[k]==='boolean')prefs[k]=saved[k]}catch{}
  let ctx,master,sfx,music,drillGain,jetGain,drillOsc,jetOsc,noiseBuffer,timer,nextNote=0,step=0,playing=false,hidden=false;
  function gain(parent,value=0){const g=ctx.createGain();g.gain.value=value;g.connect(parent);return g}
  function ramp(node,value){if(node)node.gain.setTargetAtTime(value,ctx.currentTime,.045)}
  function tone(freq,t,length,volume,type='triangle',bus=music,endFreq){
    const o=ctx.createOscillator(),g=gain(bus);o.type=type;o.frequency.setValueAtTime(freq,t);if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,t+length);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+length);o.connect(g);o.start(t);o.stop(t+length+.02);o.onended=()=>{o.disconnect();g.disconnect()};
  }
  function noise(t,length,volume,hz,bus=music){const n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=gain(bus);n.buffer=noiseBuffer;f.type='highpass';f.frequency.value=hz;n.connect(f);f.connect(g);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+length);n.start(t);n.stop(t+length);n.onended=()=>{n.disconnect();f.disconnect();g.disconnect()}}
  function machinery(bus,hz,frequency,type){const g=gain(bus),n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),o=ctx.createOscillator(),og=gain(g,.22);n.buffer=noiseBuffer;n.loop=true;f.type='bandpass';f.frequency.value=hz;f.Q.value=1.3;n.connect(f);f.connect(g);o.type=type;o.frequency.value=frequency;o.connect(og);n.start();o.start();return {g,o}}
  async function unlock(){
    try{
      if(!ctx){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;ctx=new Audio();master=gain(ctx.destination,.55);sfx=gain(master,prefs.sound?.45:0);music=gain(master,prefs.music?.24:0);
        noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=noiseBuffer.getChannelData(0);let n=19;for(let i=0;i<data.length;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;data[i]=(n/4294967296)*2-1}
        const drill=machinery(sfx,1500,94,'sawtooth'),jet=machinery(sfx,370,48,'triangle');drillGain=drill.g;drillOsc=drill.o;jetGain=jet.g;jetOsc=jet.o;timer=setInterval(schedule,25);
      }
      if(ctx.state==='suspended')await ctx.resume();
    }catch{/* Muted/unavailable audio never interrupts the game. */}
  }
  const note=n=>440*Math.pow(2,(n-69)/12);
  function schedule(){
    if(!ctx||ctx.state!=='running'||!playing||hidden||!prefs.music){nextNote=0;return}
    if(!nextNote||nextNote<ctx.currentTime-.1)nextNote=ctx.currentTime+.035;
    const sixteenth=60/112/4;
    while(nextNote<ctx.currentTime+.12){
      const p=step%16,bar=Math.floor(step/16)%8,root=[40,40,45,40,43,45,47,47][bar],t=nextNote+(p%2?.017:0);
      // Syncopated bass, backbeat, swung hats, short electric-keyboard chord stabs.
      const bass={0:0,3:12,6:7,7:10,10:0,12:12,14:7};if(p in bass)tone(note(root+bass[p]),t,p===0?.21:.105,.36,'triangle');
      if([0,6,8,11].includes(p))tone(120,t,.14,.55,'sine',music,38);
      if(p===4||p===12){noise(t,.13,.21,1350);tone(175,t,.075,.12,'triangle')}
      noise(t,p===14?.13:.035,p%2?.055:.085,6500);
      if([2,7,10,15].includes(p))for(const interval of [12,15,19,22])tone(note(root+interval),t,.11,.06,'triangle');
      if(bar===7&&[9,11,13,15].includes(p))tone(note(71-(p-9)),t,.10,.10,'sine');
      nextNote+=sixteenth;step=(step+1)%128;
    }
  }
  function set(name,on){if(!(name in prefs))return;prefs[name]=!!on;try{localStorage.setItem('deep-miner-audio',JSON.stringify(prefs))}catch{}if(ctx){ramp(sfx,prefs.sound?.45:0);ramp(music,prefs.music?.24:0)}if(name==='music'&&!on)nextNote=0;unlock()}
  function tick(state){
    if(!ctx)return;
    const active=!state.serviceOpen&&!state.paused&&!state.cargoOpen&&!state.quit&&!state.gameOver&&!state.tutorialOpen&&!state.ending&&!hidden;
    warnings(state,active&&!state.introOpen);
    playing=!state.quit&&!state.gameOver;
    const moving=active&&(state.keys.size>0||(state.joystick.active&&Math.hypot(state.joystick.x,state.joystick.y)>.15));
    ramp(master,hidden?0:.55);ramp(music,prefs.music?(state.paused||state.cargoOpen?.12:.24):0);
    ramp(drillGain,active&&state.drill.active?.22:0);ramp(jetGain,moving?.20:0);
    drillOsc.frequency.setTargetAtTime(94+(state.up.drill||0)*9,ctx.currentTime,.08);jetOsc.frequency.setTargetAtTime(48+(state.up.engine||0)*5,ctx.currentTime,.08);
    if(!playing)ramp(music,0);
  }
  let warningTime=null,lowSeconds=0,fuelWait=0,hullWait=null,lastBreak=-1;
  function brokenMachine(index,t){
    // Seven distinct failures: rattle, slipping belt, arc, knock, valve,
    // grinding bearing, and a motor struggling to turn over.
    if(index===0)for(let i=0;i<16;i++){const at=t+i*.12+(i%3)*.017;tone(160-i*4,at,.09,.10,'triangle',sfx,45);noise(at,.08,.12,1100,sfx)}
    if(index===1){tone(380,t,1.8,.055,'sawtooth',sfx,65);noise(t,1.9,.13,1700,sfx);for(let i=0;i<7;i++)noise(t+i*.24,.15,.08,2800,sfx)}
    if(index===2)for(let i=0;i<11;i++){const at=t+i*.18+(i%2)*.04;noise(at,.11,.15,2600,sfx);tone(62,at,.12,.08,'sawtooth',sfx,31)}
    if(index===3)for(let i=0;i<8;i++){const at=t+i*.27;tone(105,at,.2,.20,'triangle',sfx,28);noise(at,.10,.12,480,sfx)}
    if(index===4){noise(t,1.9,.17,850,sfx);noise(t+.6,1.3,.10,2100,sfx);tone(115,t,1.5,.04,'triangle',sfx,38)}
    if(index===5){tone(72,t,2.2,.10,'sawtooth',sfx,24);tone(109,t,2,.06,'triangle',sfx,39);noise(t,1.9,.12,600,sfx)}
    if(index===6)for(let i=0;i<10;i++){const at=t+i*.22;tone(48+(i%3)*17,at,.18,.14,'sawtooth',sfx,24);noise(at,.14,.08,400,sfx)}
  }
  function warnings(state,active){
    const now=ctx.currentTime,dt=warningTime===null?0:Math.max(0,Math.min(.1,now-warningTime));warningTime=now;
    const low=state.fuel<state.maxFuel*.15,damaged=state.hp>0&&state.hp<state.maxHp*.5;
    if(!low){lowSeconds=0;fuelWait=0}
    if(!damaged)hullWait=null;
    if(!active||!prefs.sound||ctx.state!=='running')return;
    if(low){
      lowSeconds+=dt;fuelWait-=dt;
      if(fuelWait<=0){tone(740,now,.18,.17,'square',sfx,1040);tone(1040,now+.24,.18,.15,'square',sfx,740);fuelWait=.65+3.35*Math.exp(-lowSeconds/22)}
    }
    if(damaged){
      if(hullWait===null)hullWait=4+Math.random()*3;
      hullWait-=dt;
      if(hullWait<=0){
        hullWait=4+Math.random()*3;
        if(Math.random()<1-state.hp/state.maxHp){let index=Math.floor(Math.random()*6);if(index>=lastBreak)index++;index%=7;lastBreak=index;brokenMachine(index,now)}
      }
    }
  }
  function effect(id){
    if(!ctx||ctx.state!=='running'||!prefs.sound||hidden)return;const t=ctx.currentTime;
    if(id==='refuel'){noise(t,.6,.10,500,sfx);for(let i=0;i<5;i++)tone(160+i*55,t+i*.09,.12,.15,'sine',sfx);tone(740,t+.55,.2,.13,'triangle',sfx)}
    if(id==='upgrade'){[52,59,64,71].forEach((n,i)=>tone(note(n),t+i*.075,.2,.20,'triangle',sfx));noise(t,.04,.1,2200,sfx)}
    if(id==='flood'){noise(t,1.8,.20,250,sfx);tone(55,t,1.5,.18,'sine',sfx,32)}
  }
  function silence(){hidden=true;if(ctx){ramp(master,0);ramp(drillGain,0);ramp(jetGain,0)}nextNote=0}
  function visible(){hidden=false;nextNote=0}
  return {prefs,unlock,set,tick,effect,silence,visible};
})();
