/* Vantage contracts: fixed engineering recipes, generated as the mine opens. */
globalThis.MinerContracts=({S,minerals,inBuyZone,syncCargo,stats,sound,say})=>{
  const recipes=[
    ['relay','Emergency relay','Copper carries the signal; coal powers the field generator. Dispatch wants the next shift connected before it lands.','coal','copper'],
    ['oscillator','Survey oscillator','Copper windings drive a quartz timing core. Survey Division needs stable depth readings, even when the rock will not sit still.','copper','quartz'],
    ['scanner','Seismic scanner','Quartz sensors sit inside an iron pressure frame. Vantage wants a clearer picture of what lies below its property.','quartz','iron'],
    ['contacts','Heavy-duty contactor','Iron braces hold the switch together; silver contacts carry the current without overheating. Equipment gets maintenance. Contractors get reminders.','iron','silver'],
    ['beacon','Deep-shaft beacon','Silver conductors feed a lumen emitter. Navigation wants a light that can survive where daylight cannot.','silver','lumen'],
    ['optics','Optical telemetry unit','Lumen provides the light source; gold-coated contacts protect the signal from corrosion. The data goes directly to headquarters.','lumen','gold'],
    ['regulator','Thermal regulator','Cobalt forms the heat-resistant core; gold provides reliable sensor contacts. Management has approved cooling for its machinery.','gold','cobalt'],
    ['stabilizer','Field stabilizer','Cobalt supports the magnetic assembly; xenite supplies its field-active core. Research says the vibration is within acceptable limits.','cobalt','xenite'],
    ['cutter','Precision core cutter','A xenite actuator drives diamond cutting edges. Vantage would like smaller samples, cleaner cuts, and larger profit margins.','xenite','diamond']
  ];
  const expeditions=[250,500,800,1100,1450,1800,2150,2400];
  const jobs=[],finished=new Set();let signature='';
  const ore=id=>minerals.find(m=>m.id===id);
  const near=()=>inBuyZone(8)&&!S.gameOver&&!S.ending;
  function generate(){
    if(!jobs.some(j=>j.kind==='delivery')){
      const choices=recipes.filter(r=>!finished.has(r[0])&&ore(r[4]).minDepth*9<=S.depth+300);
      const recipe=choices[choices.length-1];
      if(recipe){const [id,title,lore,a,b]=recipe,requirements={[a]:2,[b]:3},value=2*ore(a).value+3*ore(b).value;
        jobs.push({id,kind:'delivery',title,lore,requirements,value,reward:Math.ceil(value*(1.35+(recipes.indexOf(recipe)%3)*.05)),accepted:false});}
    }
    if(!jobs.some(j=>j.kind==='explore')){
      const target=expeditions.find(d=>d>S.depth&&!finished.has('depth-'+d));
      if(target){const survey=[800,1450,2150].includes(target),x=target===1450?-8:8;
        const tier=minerals.filter(m=>m.value>0&&m.minDepth*9<=target).at(-1);
        jobs.push({id:'depth-'+target,kind:'explore',target,x:survey?x:null,title:survey?'Lateral geological survey':'Depth certification',lore:survey?'Survey Division needs a reading away from the main shaft. Reach the marked coordinates; return with the data and your own transport.':'Reach a new depth and return to the garage. Vantage will certify the reading, update its reserves, and pay your survey allowance.',reward:Math.max(60,Math.round(tier.value*2.5)),accepted:false,reached:false});}
    }
    signature='';
  }
  function ready(job){return job.accepted&&(job.kind==='explore'?job.reached:Object.entries(job.requirements).every(([id,n])=>(S.inventory[id]||0)>=n))}
  function claim(id){
    const j=jobs.find(j=>j.id===id);if(!near()||!j||!ready(j))return false;
    if(j.kind==='delivery'){for(const [id,n]of Object.entries(j.requirements)){S.inventory[id]-=n;if(!S.inventory[id])delete S.inventory[id]}syncCargo()}
    S.money+=j.reward;finished.add(j.id);jobs.splice(jobs.indexOf(j),1);sound.effect('upgrade');say('CONTRACT COMPLETE · +$'+j.reward.toLocaleString());signature='';stats();return true;
  }
  function render(){
    for(const j of jobs)if(j.accepted&&j.kind==='explore'&&!j.reached){const depth=Math.max(0,(S.y-2.04)*9);if(depth>=j.target&&(j.x===null||Math.abs(S.x-j.x)<=1.5))j.reached=true}
    const next=JSON.stringify([jobs,S.inventory,near(),Math.floor(S.depth)]);if(next===signature)return;signature=next;
    const root=document.querySelector('#contracts');if(!root)return;
    root.innerHTML=jobs.map(j=>{
      const requirement=j.kind==='delivery'?Object.entries(j.requirements).map(([id,n])=>'<span class="contract-ore"><img alt="" src="'+MinerArt.sprite({x:7,y:20,m:ore(id)}).toDataURL()+'">'+ore(id).name+' <b>'+Math.min(n,S.inventory[id]||0)+' / '+n+'</b></span>').join(''):'<p>Reach <b>'+j.target+' m</b>'+(j.x===null?'':' · <b>'+Math.abs(j.x*9)+' m '+(j.x<0?'west':'east')+' of the ore exchange</b>')+(j.reached?' · SURVEY RECORDED':'')+'</p>';
      return '<article class="quest-card"><small>'+j.kind.toUpperCase()+' · '+(j.accepted?'ACCEPTED':'AVAILABLE')+'</small><h3>'+j.title+'</h3><p>'+j.lore+'</p><div class="quest-requirements">'+requirement+'</div><p class="quest-pay">Reward $'+j.reward.toLocaleString()+(j.kind==='delivery'?' · ore value $'+j.value.toLocaleString()+' · +'+Math.round((j.reward/j.value-1)*100)+'%':'')+'</p><button class="btn" data-job="'+j.id+'" '+(!near()||j.accepted&&!ready(j)?'disabled':'')+'>'+(j.accepted?(ready(j)?'CLAIM REWARD':'IN PROGRESS'):'ACCEPT CONTRACT')+'</button></article>';
    }).join('')||'<p class="small">Generate contracts to check for new assignments. Explore deeper to unlock more work.</p>';
    document.querySelector('#generateContracts').disabled=!near();
  }
  document.querySelector('#contracts').onclick=e=>{const button=e.target.closest('[data-job]');if(!button||!near())return;const j=jobs.find(j=>j.id===button.dataset.job);if(!j)return;if(j.accepted)claim(j.id);else{j.accepted=true;signature='';render()}};
  document.querySelector('#generateContracts').onclick=()=>{if(near()){generate();render()}};
  generate();
  return {render};
};
