/* V6 interaction enhancements — D3 and Member 3/4 chart modules are retained. */
(() => {
 const $=id=>document.getElementById(id);
 let refreshTimer=0;
 function smoothJump(id){$(id)?.scrollIntoView({behavior:'smooth',block:'start'})}
 function options(select, items, selected){
  if(!select)return;
  const current=String(selected ?? '');
  const sig=items.map(o=>`${o.value}:${o.label}`).join('|');
  if(select.dataset.signature!==sig){select.replaceChildren(...items.map(o=>{let opt=document.createElement('option');opt.value=String(o.value);opt.textContent=o.label;return opt}));select.dataset.signature=sig}
  select.value=current;
 }
 function syncQuick(){
  if(!summary.length)return;
  const yrs=[2023,2024,2025].map(v=>({value:v,label:String(v)}));
  const eligible=rows().filter(d=>neighbors(d.community).length).sort((x,y)=>x.name.localeCompare(y.name));
  const ns=neighbors(a).map(id=>get(year,id)).filter(Boolean).sort((x,y)=>x.name.localeCompare(y.name));
  document.querySelectorAll('[data-sync="year"]').forEach(el=>options(el,yrs,year));
  document.querySelectorAll('[data-sync="community"]').forEach(el=>options(el,eligible.map(d=>({value:d.community,label:d.name})),a));
  document.querySelectorAll('[data-sync="partner"]').forEach(el=>options(el,ns.map(d=>({value:d.community,label:d.name})),b));
 }
 function budgetCandidates(){
  // Historical sales only. No claim about current listings.
  const byCommunity=d3.group(sales.filter(d=>d.year===year&&d.worth<=budget),d=>d.community);
  return [...byCommunity].map(([id,ss])=>{
   const stat=get(year,id);return stat?{id,name:stat.name,n:ss.length,median:stat.price,area:stat.area}:null
  }).filter(Boolean).sort((x,y)=>y.n-x.n||x.name.localeCompare(y.name));
 }
 function refreshBudget(){
  if(!sales.length)return;
  const candidates=budgetCandidates();
  const ids=new Set(candidates.map(x=>x.id));
  if(!ids.has(window.budgetCommunityA))window.budgetCommunityA=ids.has(a)?a:candidates[0]?.id;
  if(!ids.has(window.budgetCommunityB)||window.budgetCommunityB===window.budgetCommunityA)window.budgetCommunityB=ids.has(b)&&b!==window.budgetCommunityA?b:candidates.find(x=>x.id!==window.budgetCommunityA)?.id;
  const opts=candidates.map(c=>({value:c.id,label:`${c.name} · ${c.n} sale${c.n===1?'':'s'} ≤ budget`}));
  options($('budgetCommunityA'),opts,window.budgetCommunityA);
  options($('budgetCommunityB'),opts,window.budgetCommunityB);
  $('budgetMarketCount').textContent=`${candidates.length} COMMUNITIES WITH RECORDED SALES`; 
  const list=$('budgetCommunityList');
  const preview=[]; // Ranked budget atlas below displays every qualifying community without a duplicate scrolling list.
  d3.select(list).selectAll('button.market-item').data(preview,d=>d.id).join(
   enter=>enter.append('button').attr('type','button').attr('class','market-item').style('opacity',0).call(s=>s.transition().duration(400).style('opacity',1)),
   update=>update,
   exit=>exit.transition().duration(200).style('opacity',0).remove()
  ).attr('aria-label',d=>`Use ${d.name} as budget comparison community B`)
   .classed('chosen',d=>d.id===window.budgetCommunityA||d.id===window.budgetCommunityB)
   .html(d=>`<span class="market-name"></span><span class="market-count"></span>`)
   .each(function(d){this.querySelector('.market-name').textContent=d.name;this.querySelector('.market-count').textContent=`${d.n} recorded sale${d.n===1?'':'s'}`})
   .on('click',(event,d)=>{if(d.id===window.budgetCommunityA){window.budgetCommunityA=window.budgetCommunityB;window.budgetCommunityB=d.id}else{window.budgetCommunityB=d.id}refreshBudget();redrawBudget()});
  drawBudgetLandscape(candidates);
  $('budgetMarketCount').title=`Count of communities with at least one eligible recorded transaction at or below ${money(budget)} in ${year}.`;
 }
 function drawBudgetLandscape(candidates){
  // Budget atlas: a readable responsive ranked-card grid, no overlapping marks.
  const el=$('budgetLandscape'); if(!el)return;
  const eligible=candidates.slice().sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name));
  const chosenA=window.budgetCommunityA,chosenB=window.budgetCommunityB;
  const cards=d3.select(el).selectAll('button.budget-atlas-card').data(eligible,d=>d.id).join(
    enter=>enter.append('button').attr('type','button').attr('class','budget-atlas-card'),
    update=>update,
    exit=>exit.remove());
  cards.classed('selected-a',d=>d.id===chosenA).classed('selected-b',d=>d.id===chosenB)
    .attr('aria-pressed',d=>d.id===chosenA||d.id===chosenB?'true':'false')
    .attr('aria-label',d=>`Compare ${d.name}, ${d.n} recorded sales within budget`)
    .html(d=>`<span class="atlas-top"><span class="atlas-name"></span><span class="atlas-count"></span></span><span class="atlas-meter"><span class="atlas-meter-fill"></span></span><span class="atlas-bottom"><span class="atlas-price"></span><span class="atlas-area"></span></span>`)
    .each(function(d){
      this.querySelector('.atlas-name').textContent=d.name;
      this.querySelector('.atlas-count').textContent=`${d.n} sale${d.n===1?'':'s'}`;
      this.querySelector('.atlas-price').textContent=`Median ${money(d.median)}/m²`;
      {const m2=budget/d.median;this.querySelector('.atlas-area').textContent=m2>100?`≈ ${m2.toFixed(0)} m² · beyond the 55–100 m² flats in the data`:`≈ ${m2.toFixed(1)} m² at this budget`;}
      this.querySelector('.atlas-meter-fill').style.width=`${Math.max(3,Math.min(100,100*d.n/Math.max(1,eligible[0]?.n||1)))}%`;
    })
    .on('click',(e,d)=>{
      if(d.id===window.budgetCommunityA){window.budgetCommunityA=window.budgetCommunityB;window.budgetCommunityB=d.id;}
      else window.budgetCommunityB=d.id;
      refreshBudget();redrawBudget();
    });
  el.setAttribute('aria-label',`${eligible.length} communities with historical sales within selected budget; choose a card to compare`);
 }
 function redrawBudget(){
  if(window.budgetCommunityA==null||window.budgetCommunityB==null||window.budgetCommunityA===window.budgetCommunityB)return;
  budgetView();building('budget','budget');
  const x=get(year,window.budgetCommunityA),y=get(year,window.budgetCommunityB);
  if(x&&y){$('budgetInsight').textContent+=` Historical budget coverage: ${obs(x.community).filter(d=>d.worth<=budget).length} sales in ${x.name}, ${obs(y.community).filter(d=>d.worth<=budget).length} in ${y.name}. These are not currently available homes.`}
 }
 function update(){syncQuick();refreshBudget();redrawBudget()}
 // Wrap original render to synchronize secondary selectors with the primary selection.
 const previousRender=renderAll;
 renderAll=function(){previousRender();update()};
 const previousOpenInfo=openInfo;
 openInfo=function(key){
  previousOpenInfo(key);
  const body=$('modalBody');
  if(key==='budget'){
   body.innerHTML=`<div class="method-steps"><p><b>Step 1.</b> Choose a budget, such as AED 1,000,000.</p><p><b>Step 2.</b> Find the median price per m² for each selected community.</p><p><b>Step 3.</b> Divide the same budget by each median.</p><div class="formula">Budget ÷ median AED/m² = theoretical m²</div><p><b>Example:</b> AED 1,000,000 ÷ AED 20,000/m² = <b>50 m²</b>.</p><p><b>Explore more:</b> The list below the slider includes communities with historical recorded sales priced at or below your budget. It does not show available listings. Fees and other costs are excluded.</p></div>`;
  } else if(key==='sources'){
   body.innerHTML=`<div class="method-steps"><p><b>Source.</b> CS333 course transaction CSV and Dubai community boundaries. <a href="https://github.com/sharios/CS333" target="_blank" rel="noopener noreferrer">Open the course repository ↗</a></p><p><b>Sample.</b> 2,072 recorded existing residential one-bedroom flat sales, 55–100 m², 2023–2025, AED 1,000–60,000 per m².</p><p><b>Matching.</b> At least 12 eligible sales per community-year. Median floor areas within 10%. Price is not used to select matches.</p><p><b>Limits.</b> Historical transactions are not current listings. Building quality, amenities and homeowner satisfaction are not measured. A separate Kaggle short-term rental dataset provides guest ratings, which are not ratings of the sold apartments. Differences do not establish causes.</p></div>`;
  } else if(key==='match'){
   body.innerHTML=`<div class="method-steps"><p><b>1. Compare like with like.</b> We select existing one-bedroom flats of 55–100 m² from the same year.</p><p><b>2. Require enough data.</b> Each community needs at least 12 eligible sales that year.</p><p><b>3. Match by typical size.</b> The two median floor areas must be within 10% of each other.</p><p><b>4. Reveal the price.</b> We calculate the price gap <em>after</em> finding eligible matches. A match is not proof that the buildings are identical.</p></div>`;
  }
 };
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-jump]').forEach(el=>el.addEventListener('click',()=>smoothJump(el.dataset.jump)));
  document.querySelectorAll('[data-focus]').forEach(el=>el.addEventListener('click',()=>{
   smoothJump('investigate');setTimeout(()=>{$(el.dataset.focus)?.focus({preventScroll:true});$(el.dataset.focus)?.classList.add('focus-pulse');setTimeout(()=>$(el.dataset.focus)?.classList.remove('focus-pulse'),1100)},550);
  }));
  document.querySelectorAll('[data-sync]').forEach(el=>el.addEventListener('change',()=>{
   const type=el.dataset.sync;
   if(type==='year')year=+el.value;
   else if(type==='community')a=+el.value;
   else b=+el.value;
   renderAll();
  }));
  ['budgetCommunityA','budgetCommunityB'].forEach((id,i)=>$(id)?.addEventListener('change',e=>{
   if(i===0)window.budgetCommunityA=+e.target.value;else window.budgetCommunityB=+e.target.value;
   if(window.budgetCommunityA===window.budgetCommunityB){
    const c=budgetCandidates().find(x=>x.id!==window.budgetCommunityA);
    if(c){if(i===0)window.budgetCommunityB=c.id;else window.budgetCommunityA=c.id}
   }
   refreshBudget();redrawBudget();
  }));
  $('budgetUsePair')?.addEventListener('click',()=>{
   const ids=new Set(budgetCandidates().map(d=>d.id));
   if(ids.has(a))window.budgetCommunityA=a;
   if(ids.has(b))window.budgetCommunityB=b;
   refreshBudget();redrawBudget();
  });
  $('budgetRange')?.addEventListener('input',()=>{
   clearTimeout(refreshTimer);
   refreshTimer=setTimeout(()=>{refreshBudget();redrawBudget()},90);
  });
  ['year','community','partner'].forEach(id=>$(id)?.addEventListener('change',()=>setTimeout(update,50)));
  document.querySelectorAll('[data-info]').forEach(el=>el.setAttribute('aria-label',`Open explanation: ${el.textContent.trim()}`));
 });
})();
