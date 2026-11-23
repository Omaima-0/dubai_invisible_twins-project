/* Guided tour. Step 1 is centred only while the visitor is at the top of the page;
   after any scroll, or from step 2, it docks as a small card in the bottom-right corner
   so it never covers a chart. No screen-darkening overlay. */
(() => {
 const $ = id => document.getElementById(id);
 const steps = [
  {name:'WELCOME', text:'Welcome to Dubai’s Invisible Twins. Explore how recorded prices differ between comparable one-bedroom apartments in Dubai. This is a story you control. You do not need to know anything about charts. Select SHOW ME to begin, or close this guide to explore by yourself.',target:'top'},
  {name:'THE STORY',text:'Scroll through Dubai to learn the question. The map starts in 3D and moves between Dubai locations as you scroll. Use the next button to move forward.',target:'top'},
  {name:'MAKE A GUESS',text:'Guess the price gap using one of four percentages. The correct recorded gap is fixed; your choice changes the feedback, not the data.',target:'guess'},
  {name:'CHOOSE A PAIR',text:'First choose the year. Next choose your starting community. Finally choose one of the available comparable communities. The dropdowns only show eligible pairs.',target:'investigate'},
  {name:'READ THE DOTS',text:'Each dot in the first chart is a community. Hover over it to see the numbers. Click a highlighted dot to change your comparison. The HOW TO READ panel explains the axes.',target:'find'},
  {name:'EXPLORE THE EVIDENCE',text:'Scroll to Every Sale and Twin DNA. Each chart has a HOW TO READ panel and a small comparison selector above it, so you can change the communities without going back.',target:'evidence'},
  {name:'TWIN DNA',text:'Twin DNA ranks five verified property transaction measures. The longest connecting line shows where your two communities differ most. Click a row to inspect it.',target:'dna'},
  {name:'TRY A BUDGET',text:'Drag the budget slider, then explore the historical sales within that budget. You can choose two other communities here without changing your main investigation.',target:'budget'},
  {name:'GUEST RATINGS',text:'Finally, compare sale prices with short-term rental guest ratings from a separate dataset. Hover a circle to see how many listings it is based on.',target:'guest'}
 ];
 let index=0;
 function render(){
  const g=$('tourHelper'); if(!g||g.hidden)return;
  g.classList.toggle('is-intro',index===0&&scrollY<innerHeight*.35);
  $('tourCount').textContent=`GUIDED TOUR · ${index+1} OF ${steps.length} · ${steps[index].name}`;
  $('tourText').textContent=steps[index].text;
  $('tourBack').disabled=index===0;
  $('tourNext').textContent=index===steps.length-1?'FINISH TOUR ✓':'SHOW ME →';
 }
 function close(){ $('tourHelper').hidden=true;$('tourReopen').hidden=false; }
 function open(){ $('tourHelper').hidden=false;$('tourReopen').hidden=true;index=0;render(); }
 function move(target){document.getElementById(target)?.scrollIntoView({behavior:'smooth',block:'start'});}
 document.addEventListener('DOMContentLoaded',()=>{
  $('tourNext')?.addEventListener('click',()=>{
   if(index===steps.length-1){close();return}
   index++;render();requestAnimationFrame(()=>move(steps[index].target));
  });
  $('tourBack')?.addEventListener('click',()=>{index=Math.max(0,index-1);render();move(steps[index].target)});
  $('tourClose')?.addEventListener('click',close);
  $('tourReopen')?.addEventListener('click',open);
  render();
  addEventListener('scroll',()=>{const g=$('tourHelper');if(g&&!g.hidden&&g.classList.contains('is-intro')&&scrollY>=innerHeight*.35)g.classList.remove('is-intro')},{passive:true});
 });
})();
