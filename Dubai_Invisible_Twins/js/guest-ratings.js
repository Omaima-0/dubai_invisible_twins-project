/* Guest Experience: independently sourced short-term rental snapshots, spatially matched to DLD community polygons. */
(() => {
  const el = id => document.getElementById(id);
  let ratings = [], loaded = false;
  const MIN = 5;
  const fmt = n => Number(n).toLocaleString('en-US',{maximumFractionDigits:0});
  const selected = (y,id) => ratings.find(d=>d.year===y&&d.community===id&&d.n>=MIN);
  const all = () => ratings.filter(d=>d.year===year&&d.n>=MIN&&get(year,d.community)).map(d=>({...d,sale:get(year,d.community)}));
  const tooltip = el('tooltip');
  function plot(){
    const root=el('guestChart'); if(!root || !loaded || !summary.length)return;
    const data=all(), W=Math.max(440,root.clientWidth||720), H=440, margin={top:32,right:30,bottom:65,left:88};
    d3.select(root).selectAll('svg').remove();
    const svg=d3.select(root).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('role','img').attr('aria-label',`Guest star ratings versus residential sale prices for ${year}`);
    if(!data.length){root.insertAdjacentHTML('beforeend','<p>No communities have five rated listings this year.</p>');return}
    const x=d3.scaleLinear().domain([0,d3.max(data,d=>d.sale.price)*1.12]).range([margin.left,W-margin.right]);
    const y=d3.scaleLinear().domain([3.5,5]).range([H-margin.bottom,margin.top]);
    const r=d3.scaleSqrt().domain([1,d3.max(data,d=>d.n)]).range([6,22]);
    svg.append('g').attr('transform',`translate(0,${H-margin.bottom})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>fmt(d))).selectAll('text').attr('font-size',11);
    svg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(d=>d.toFixed(1)+' ★'));
    svg.append('g').attr('class','guest-grid').selectAll('line').data(y.ticks(6)).join('line').attr('x1',margin.left).attr('x2',W-margin.right).attr('y1',d=>y(d)).attr('y2',d=>y(d)).attr('stroke','#ccd8d7').attr('stroke-dasharray','3 6');
    svg.append('text').attr('x',W/2).attr('y',H-12).attr('text-anchor','middle').attr('fill','#163443').attr('font-size',13).text('Median recorded sale price (AED / m²) →');
    svg.append('text').attr('transform',`translate(20,${H/2}) rotate(-90)`).attr('text-anchor','middle').attr('fill','#163443').attr('font-size',13).text('Mean guest rating / 5 →');
    const dots=svg.append('g').selectAll('circle').data(data,d=>d.community).join('circle')
      .attr('cx',d=>x(d.sale.price)).attr('cy',d=>y(d.rating)).attr('r',0)
      .attr('fill',d=>d.community===a?'#008e99':d.community===b?'#ed805e':'#7f9eb0')
      .attr('fill-opacity',.74).attr('stroke',d=>d.community===a||d.community===b?'#163443':'white')
      .attr('stroke-width',d=>d.community===a||d.community===b?3:1.5)
      .attr('tabindex',0).attr('role','button')
      .attr('aria-label',d=>`${d.name}, ${d.rating.toFixed(2)} out of five, ${d.n} rental listings, AED ${fmt(d.sale.price)} per square metre`)
      .style('cursor','pointer');
    dots.transition().duration(650).attr('r',d=>r(d.n));
    function show(event,d){
      tooltip.hidden=false;
      tooltip.textContent=`${d.name} · ${d.rating.toFixed(2)}/5 guest stars · ${d.n} unique rated rental listings · ${fmt(d.reviews)} reported reviews · AED ${fmt(d.sale.price)}/m² sale median`;
      const px=event.clientX??window.innerWidth/2, py=event.clientY??window.innerHeight/2;
      tooltip.style.left=Math.min(px+14,window.innerWidth-300)+'px';tooltip.style.top=Math.max(8,py-72)+'px';
    }
    dots.on('mousemove',show).on('focus',show).on('mouseleave',()=>tooltip.hidden=true).on('blur',()=>tooltip.hidden=true)
      .on('click',(event,d)=>{if(d.community===a)return;if(neighbors(a).includes(d.community)){b=d.community;renderAll()}else{el('guestInsight').textContent=`${d.name} does not meet the same-year apartment-size matching rule with ${get(year,a)?.name}. Choose a highlighted eligible comparison in Twin Constellation.`}})
      .on('keydown',(event,d)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.currentTarget.dispatchEvent(new MouseEvent('click',{bubbles:true}))}});
    const pair=el('guestPair');pair.replaceChildren();
    for(const [id,color] of [[a,'#008e99'],[b,'#ed805e']]){
      const s=get(year,id),g=selected(year,id);
      const box=document.createElement('div');box.className='guest-rating-card';box.style.borderLeft=`5px solid ${color}`;
      const title=document.createElement('strong');title.textContent=s?.name||'Select a community';box.append(title);
      const val=document.createElement('div');val.className='guest-star-value';val.textContent=g?`${g.rating.toFixed(2)} / 5 ★`:'Insufficient guest data';box.append(val);
      const detail=document.createElement('small');detail.textContent=g?`${g.n} unique rated listings · ${fmt(g.reviews)} reported reviews`:'Fewer than 5 rated listings for this year';box.append(detail);pair.append(box);
    }
    const ga=selected(year,a),gb=selected(year,b);
    el('guestInsight').textContent=ga&&gb?`The mean guest rating differs by ${Math.abs(ga.rating-gb.rating).toFixed(2)} stars between these two communities in ${year}. This is descriptive and is not a comparison of the sold flats.`:'At least one selected community has fewer than five rated rental listings in this year. No rating comparison is shown for that pair.';
    el('guestLegend').textContent=`${data.length} communities with ≥ ${MIN} uniquely rated listings in ${year}. Circle area encodes listing count.`;
  }
  // Keep budget selections independent from the main investigation throughout chart and illustration updates.
  const originalBudgetView=budgetView;
  budgetView=function(){
    const aa=a,bb=b;
    if(window.budgetCommunityA!=null&&window.budgetCommunityB!=null&&get(year,window.budgetCommunityA)&&get(year,window.budgetCommunityB)){a=window.budgetCommunityA;b=window.budgetCommunityB}
    try {originalBudgetView()}finally{a=aa;b=bb}
  };
  const originalBuilding=building;
  building=function(id,mode){
    if(mode!=='budget')return originalBuilding(id,mode);
    const aa=a,bb=b;
    if(window.budgetCommunityA!=null&&window.budgetCommunityB!=null&&get(year,window.budgetCommunityA)&&get(year,window.budgetCommunityB)){a=window.budgetCommunityA;b=window.budgetCommunityB}
    try{return originalBuilding(id,mode)}finally{a=aa;b=bb}
  };
  const originalRender=renderAll;
  renderAll=function(){originalRender();plot()};
  d3.json('data/guest_ratings.json').then(d=>{ratings=d;loaded=true;plot()}).catch(e=>{console.error('Guest ratings unavailable',e);el('guestInsight').textContent='Guest rating dataset could not be loaded.'});
})();
