/*
 * DUBAI'S INVISIBLE TWINS — twin-insights.js (final version)
 *
 * Four small D3 additions. All of them read the shared state from app.js
 * (year, a, b, summary, pairs, sales) and are redrawn by renderAll():
 *
 *   1. gapInset()    — View 1: how common is this gap among ALL size-matched pairs?
 *   2. interval()    — View 2: 95% bootstrap interval for the median gap + overlap
 *   3. ladder()      — View 3: Twin DNA ladder, five sale measures ranked city-wide
 *   4. guestFinding()— View 5: plain-language result of the price vs rating check
 *
 * Every chart keeps its SVG between updates and uses keyed joins with
 * transitions, so changing the pair or year animates instead of redrawing.
 */
(() => {
  const DUR = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
  const ease = d3.easeCubicInOut;
  const el = id => document.getElementById(id);
  let ladderData = null, guestData = null, ladderPick = null;

  // ---------- helpers ----------
  const pairGap = (p) => (Math.max(p.median_ppsqm_a, p.median_ppsqm_b) / Math.min(p.median_ppsqm_a, p.median_ppsqm_b) - 1) * 100;
  const median = arr => { const s = [...arr].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  function rng(seed) { // mulberry32: same seed -> same interval every time
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function svgFor(id, h) {
    const node = el(id); if (!node) return null;
    const w = Math.max(300, node.clientWidth);
    const svg = d3.select(node).selectAll('svg.ti').data([null]).join('svg')
      .attr('class', 'ti').attr('viewBox', `0 0 ${w} ${h}`).attr('width', '100%').attr('role', 'img');
    return { svg, w, h, node };
  }
  const t = () => d3.transition().duration(DUR).ease(ease);

  // ======================================================================
  // 1. GAP INSET — histogram of price gaps for every size-matched pair
  // ======================================================================
  const bootCache = new Map();
  function gapInset() {
    const node = el('gapInset'); if (!node) return;
    const yp = pairs.filter(p => p.year === year);
    if (!yp.length) { node.innerHTML = ''; return; }
    const gaps = yp.map(pairGap);
    const sel = yp.find(p => (p.comm_a === a && p.comm_b === b) || (p.comm_a === b && p.comm_b === a));
    const g0 = sel ? pairGap(sel) : null;
    const share30 = gaps.filter(g => g >= 30).length / gaps.length;
    const below = g0 == null ? 0 : gaps.filter(g => g < g0).length / gaps.length;

    let head = node.querySelector('.ti-text');
    if (!head) { node.insertAdjacentHTML('afterbegin', '<p class="ti-kicker">IS YOUR GAP UNUSUAL? · ALL SIZE-MATCHED PAIRS IN THE YEAR</p><p class="ti-text"></p>'); head = node.querySelector('.ti-text'); }
    head.innerHTML = `In ${year}, <b>${Math.round(share30 * 100)}% of the ${yp.length} size-matched pairs</b> differ by 30% or more (median gap ${Math.round(median(gaps))}%).` +
      (g0 != null ? ` Your pair (<b>+${g0.toFixed(1)}%</b>) is larger than ${Math.round(below * 100)}% of them.` : '');

    const c = svgFor('gapInset', 150); if (!c) return;
    const { svg, w, h } = c, m = { l: 40, r: 18, t: 31, b: 32 };
    const max = Math.max(100, Math.ceil(d3.max(gaps) / 20) * 20);
    const x = d3.scaleLinear().domain([0, max]).range([m.l, w - m.r]);
    const bins = d3.bin().domain([0, max]).thresholds(d3.range(0, max + 1, 20))(gaps);
    const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.length) || 1]).nice().range([h - m.b, m.t]);

    svg.selectAll('.ti-x').data([null]).join('g').attr('class', 'ti-x axis')
      .attr('transform', `translate(0,${h - m.b})`)
      .transition(t()).call(d3.axisBottom(x).ticks(Math.min(8, max / 20)).tickFormat(d => d + '%').tickSizeOuter(0));
    svg.selectAll('.ti-y').data([null]).join('g').attr('class', 'ti-y axis')
      .attr('transform', `translate(${m.l},0)`)
      .transition(t()).call(d3.axisLeft(y).ticks(3).tickSizeOuter(0));
    svg.selectAll('.ti-ref').data([30]).join('line').attr('class', 'ti-ref')
      .attr('y1', m.t).attr('y2', h - m.b).attr('stroke', '#163443').attr('stroke-dasharray', '3 3').attr('opacity', .45)
      .transition(t()).attr('x1', d => x(d)).attr('x2', d => x(d));
    svg.selectAll('.ti-ref-l').data([30]).join('text').attr('class', 'ti-ref-l ti-small')
      .attr('y', 14).text('30%').transition(t()).attr('x', d => x(d) + 4);

    svg.selectAll('.ti-bar').data(bins, d => d.x0).join(
      enter => enter.append('rect').attr('class', 'ti-bar').attr('y', h - m.b).attr('height', 0).attr('rx', 3),
      update => update,
      exit => exit.transition(t()).attr('height', 0).attr('y', h - m.b).remove())
      .attr('fill', d => g0 != null && g0 >= d.x0 && g0 < d.x1 ? B : '#b7cfcc')
      .transition(t())
      .attr('x', d => x(d.x0) + 1).attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 2))
      .attr('y', d => y(d.length)).attr('height', d => y(0) - y(d.length));

    const mark = svg.selectAll('.ti-mark').data(g0 != null ? [g0] : []).join(
      enter => { const g = enter.append('g').attr('class', 'ti-mark'); g.append('line'); g.append('text'); return g; });
    mark.select('line').attr('y1', m.t - 4).attr('y2', h - m.b).attr('stroke', B).attr('stroke-width', 2.5);
    mark.select('text').attr('y', 14).attr('class', 'ti-small ti-strong').attr('fill', B).text('your pair');
    mark.transition(t()).attr('transform', d => `translate(${x(Math.min(d, max))},0)`);
    mark.select('text').attr('x', d => x(d) > w - 90 ? -60 : 6);
    svg.selectAll('.ti-cap').data([null]).join('text').attr('class', 'ti-cap ti-small')
      .attr('x', w - m.r).attr('y', h - 4).attr('text-anchor', 'end').text('PRICE GAP VS THE LOWER MEDIAN · BARS = NUMBER OF PAIRS');

    // City-wide sentence for the conclusion
    const all = pairs.map(pairGap);
    const cf = el('cityFinding');
    if (cf) cf.innerHTML = `Across all ${pairs.length} size-matched community pairs from 2023 to 2025, <b>${Math.round(all.filter(g => g >= 30).length / all.length * 100)}% differ by 30% or more</b> in median price per m². Large median price gaps occur frequently among the size-matched community pairs in this dataset; this does not identify their causes.`;
  }

  // ======================================================================
  // 2. INTERVAL — bootstrap 95% interval of the median gap + overlap
  // ======================================================================
  function bootstrap(xs, ys, seed) {
    const key = seed + ':' + xs.length + ':' + ys.length;
    if (bootCache.has(key)) return bootCache.get(key);
    const r = rng(seed), out = [];
    const draw = arr => { const s = new Array(arr.length); for (let i = 0; i < arr.length; i++) s[i] = arr[(r() * arr.length) | 0]; return median(s); };
    for (let i = 0; i < 1000; i++) out.push((draw(xs) / draw(ys) - 1) * 100);
    out.sort((p, q) => p - q);
    const res = [out[24], out[974]];
    bootCache.set(key, res); return res;
  }
  function interval() {
    const node = el('saleInterval'); if (!node) return;
    const sa = get(year, a), sb = get(year, b); if (!sa || !sb) return;
    const hi = sa.price >= sb.price ? sa : sb, lo = hi === sa ? sb : sa;
    const ph = obs(hi.community).map(d => d.price), pl = obs(lo.community).map(d => d.price);
    const est = (hi.price / lo.price - 1) * 100;
    const [ciL, ciH] = bootstrap(ph, pl, year * 1000003 + hi.community * 1009 + lo.community);
    const hiBelow = ph.filter(p => p < lo.price).length / ph.length;
    const loAbove = pl.filter(p => p > hi.price).length / pl.length;
    const flagged = [...obs(a), ...obs(b)].filter(d => d.flag).length;
    const cHi = hi === sa ? A : B;

    let head = node.querySelector('.ti-text');
    if (!head) { node.insertAdjacentHTML('afterbegin', '<p class="ti-kicker">HOW SURE ARE WE? · 1,000 BOOTSTRAP RESAMPLES</p><p class="ti-text"></p>'); head = node.querySelector('.ti-text'); }
    head.innerHTML = `<b style="color:${cHi}">${hi.name}</b>'s median is <b>${est.toFixed(1)}% higher</b> (95% interval ${ciL.toFixed(0)}% to ${ciH.toFixed(0)}%). ` +
      (ciL > 0 ? 'In this resampling model, the interval excludes zero; it describes uncertainty in the estimated median gap, not why the communities differ. ' : '<b>The interval includes zero; these samples do not clearly separate the median prices under this resampling model.</b> ') +
      `${Math.round(hiBelow * 100)}% of ${hi.name}'s sales were cheaper than ${lo.name}'s median, and ${Math.round(loAbove * 100)}% of ${lo.name}'s sales were dearer than ${hi.name}'s median.` +
      (flagged ? ` <span class="ti-muted">${flagged} hollow dot${flagged > 1 ? 's' : ''} above: unusually low-priced sale${flagged > 1 ? 's' : ''} (below 25% of its community-year median); transaction type is unknown, and all remain included.</span>` : '');

    const c = svgFor('saleInterval', 92); if (!c) return;
    const { svg, w, h } = c, m = { l: 40, r: 30 };
    const x = d3.scaleLinear().domain([Math.min(0, ciL) - 5, Math.max(ciH, est) * 1.12 + 5]).nice().range([m.l, w - m.r]);
    const cy = 38;
    svg.selectAll('.ti-x').data([null]).join('g').attr('class', 'ti-x axis').attr('transform', `translate(0,${h - 26})`)
      .transition(t()).call(d3.axisBottom(x).ticks(6).tickFormat(d => (d > 0 ? '+' : '') + d + '%').tickSizeOuter(0));
    svg.selectAll('.ti-zero').data([0]).join('line').attr('class', 'ti-zero').attr('y1', 10).attr('y2', h - 26)
      .attr('stroke', '#163443').attr('stroke-dasharray', '3 3').attr('opacity', .5)
      .transition(t()).attr('x1', x(0)).attr('x2', x(0));
    svg.selectAll('.ti-zero-l').data([0]).join('text').attr('class', 'ti-zero-l ti-small').attr('y', 12)
      .text('no difference').transition(t()).attr('x', x(0) + 5);
    svg.selectAll('.ti-ci').data([[ciL, ciH]]).join('line').attr('class', 'ti-ci')
      .attr('y1', cy).attr('y2', cy).attr('stroke', cHi).attr('stroke-width', 6).attr('stroke-linecap', 'round').attr('opacity', .35)
      .transition(t()).attr('x1', d => x(d[0])).attr('x2', d => x(d[1]));
    svg.selectAll('.ti-est').data([est]).join('circle').attr('class', 'ti-est').attr('cy', cy).attr('r', 8)
      .attr('fill', cHi).attr('stroke', '#fff').attr('stroke-width', 2).transition(t()).attr('cx', d => x(d));
    svg.selectAll('.ti-est-l').data([est]).join('text').attr('class', 'ti-est-l ti-small ti-strong').attr('y', cy - 14)
      .attr('text-anchor', 'middle').attr('fill', cHi).text(d => `+${d.toFixed(1)}%`).transition(t()).attr('x', d => x(d));
  }

  // ======================================================================
  // 3. TWIN DNA LADDER — five sale measures, each ranked across eligible communities
  // ======================================================================
  const FMT = {
    price: v => 'AED ' + num(v) + '/m²', area: v => v.toFixed(1) + ' m²', worth: v => money(v),
    iqr: v => 'AED ' + num(v) + '/m²', n: v => num(v) + ' sales', offplan: v => v.toFixed(0) + '%',
    mortgage: v => v.toFixed(0) + '%', metro_km: v => v.toFixed(1) + ' km', venues_km2: v => v.toFixed(1) + '/km²',
    pop_km2: v => num(v) + '/km²'
  };
  const fmt = (k, r) => r[k] == null ? 'n/a' : FMT[k](r[k]) + (k === 'venues_km2' && r.venues_capped ? '+' : '');
  const SHORT = { price: 'Sale price', area: 'Flat area', worth: 'Sale value', iqr: 'Price spread', n: 'Sales count', offplan: 'Off-plan share', mortgage: 'Mortgage share', metro_km: 'Metro distance', venues_km2: 'Venues per km²', pop_km2: 'Pop. density' };
  const DETAIL_TAB = { area: 'area', worth: 'worth', iqr: 'iqr', n: 'n' };

  function ladder() {
    if (!ladderData) return;
    const yr = ladderData.rows.filter(r => r.year === year);
    const ra = yr.find(r => r.community === a), rb = yr.find(r => r.community === b);
    if (!ra || !rb) return;
    el('ladderCount').textContent = `${yr.length} ELIGIBLE COMMUNITIES IN ${year}`;
    const metrics = ladderData.metrics
      .filter(mt => ra[mt.key + '_pct'] != null && rb[mt.key + '_pct'] != null)
      .map(mt => ({ ...mt, pa: ra[mt.key + '_pct'], pb: rb[mt.key + '_pct'], diff: Math.abs(ra[mt.key + '_pct'] - rb[mt.key + '_pct']) }))
      .sort((p, q) => q.diff - p.diff);

    const rowH = 40, top = 36;
    const c = svgFor('dnaLadder', top + rowH * metrics.length + 30); if (!c) return;
    const { svg, w, h } = c;
    const narrow = w < 640, labW = narrow ? 120 : 250, valW = narrow ? 0 : 230;
    const x = d3.scaleLinear().domain([0, 100]).range([labW + 12, w - valW - 16]);

    svg.selectAll('.ld-head').data(['LOWEST', 'HIGHEST']).join('text').attr('class', 'ld-head ti-small')
      .attr('y', 18).attr('text-anchor', (d, i) => i ? 'end' : 'start').attr('x', (d, i) => i ? x(100) : x(0)).text(d => d);
    if (!narrow) svg.selectAll('.ld-vhead').data([null]).join('text').attr('class', 'ld-vhead ti-small')
      .attr('x', w - valW).attr('y', 18).text('A · B (REAL VALUES)');

    const row = svg.selectAll('.ld-row').data(metrics, d => d.key).join(enter => {
      const g = enter.append('g').attr('class', 'ld-row').attr('transform', (d, i) => `translate(0,${top + i * rowH})`).attr('opacity', 0);
      g.append('rect').attr('class', 'ld-hit').attr('x', 0).attr('y', 0).attr('height', rowH - 4).attr('rx', 8);
      g.append('text').attr('class', 'ld-label');
      g.append('line').attr('class', 'ld-axis');
      g.append('g').attr('class', 'ld-ticks');
      g.append('line').attr('class', 'ld-link');
      g.append('circle').attr('class', 'ld-a').attr('r', 7).attr('fill', A);
      g.append('circle').attr('class', 'ld-b').attr('r', 7).attr('fill', B);
      g.append('text').attr('class', 'ld-val');
      return g;
    });
    row.classed('is-picked', d => d.key === ladderPick)
      .transition(t()).attr('opacity', 1).attr('transform', (d, i) => `translate(0,${top + i * rowH})`);

    const mid = (rowH - 4) / 2;
    row.select('.ld-hit').attr('width', w);
    row.select('.ld-label').attr('x', 8).attr('y', mid + 4).text(d => narrow ? SHORT[d.key] : d.label);
    row.select('.ld-axis').attr('x1', x(0)).attr('x2', x(100)).attr('y1', mid).attr('y2', mid);
    row.select('.ld-ticks').each(function (mt) {
      d3.select(this).selectAll('line').data(yr.filter(r => r[mt.key + '_pct'] != null), r => r.community).join(
        enter => enter.append('line').attr('x1', r => x(r[mt.key + '_pct'])).attr('x2', r => x(r[mt.key + '_pct'])).attr('opacity', 0))
        .attr('y1', mid - 8).attr('y2', mid + 8)
        .attr('stroke-dasharray', r => mt.key === 'venues_km2' && r.venues_capped ? '2 2' : null)
        .transition(t()).attr('opacity', 1).attr('x1', r => x(r[mt.key + '_pct'])).attr('x2', r => x(r[mt.key + '_pct']));
    });
    row.select('.ld-link').attr('y1', mid).attr('y2', mid).transition(t()).attr('x1', d => x(d.pa)).attr('x2', d => x(d.pb));
    row.select('.ld-a').attr('cy', mid).transition(t()).attr('cx', d => x(d.pa));
    row.select('.ld-b').attr('cy', mid).transition(t()).attr('cx', d => x(d.pb));
    row.select('.ld-val').attr('x', w - valW).attr('y', mid + 4)
      .html(d => narrow ? '' : `<tspan fill="${A}">${fmt(d.key, ra)}</tspan><tspan fill="#8aa0a3"> · </tspan><tspan fill="${B}">${fmt(d.key, rb)}</tspan>`);

    const tip = (e, d) => {
      let extra = '';
      tooltip(`<b>${d.label}</b><br><span style="color:#7fe0da">${ra.name}: ${fmt(d.key, ra)}</span> (rank ${Math.round(d.pa)}/100)<br><span style="color:#ffb59c">${rb.name}: ${fmt(d.key, rb)}</span> (rank ${Math.round(d.pb)}/100)${extra}`, e);
    };
    row.on('mousemove', tip).on('mouseleave', hideTip).on('click', (e, d) => {
      ladderPick = d.key; describe(d, ra, rb, metrics, yr.length);
      row.classed('is-picked', r => r.key === ladderPick);
      const tab = DETAIL_TAB[d.key];
      if (tab) document.querySelector(`[data-metric="${tab}"]`)?.click();
    });

    svg.selectAll('.ld-foot').data([null]).join('text').attr('class', 'ld-foot ti-small').attr('x', x(0)).attr('y', h - 6)
      .text(narrow ? 'SORTED BY DIFFERENCE' : 'GREY TICKS = OTHER COMMUNITIES · ROWS SORTED BY HOW FAR APART YOUR TWO COMMUNITIES ARE');
    const pick = metrics.find(m => m.key === ladderPick) || metrics.find(m => m.key !== 'price') || metrics[0];
    describe(pick, ra, rb, metrics, yr.length);
  }
  function describe(d, ra, rb, metrics, n) {
    const top = metrics.filter(m => m.key !== 'price')[0];
    const lead = d === top || !ladderPick
      ? `Apart from price, the biggest difference is <b>${top.label.split(' (')[0].replace(/^./, c => c.toLowerCase())}</b>`
      : `<b>${d.label}</b>`;
    el('ladderInsight').innerHTML = `${lead}: ${ra.name} ${fmt(d.key, ra)} vs ${rb.name} ${fmt(d.key, rb)}` +
      `. Ranked among ${n} eligible communities. These measures describe each community as a whole and show associations, not causes.`;
  }

  // ======================================================================
  // 4. GUEST FINDING — does a higher sale price go with higher guest ratings?
  // ======================================================================
  function spearman(xs, ys) {
    // Midranks handle tied ratings correctly; Spearman is Pearson on ranks.
    const rank = values => {
      const ordered = values.map((value, i) => ({value, i})).sort((a,b)=>a.value-b.value);
      const result = Array(values.length);
      for(let i=0;i<ordered.length;){
        let j=i+1; while(j<ordered.length && ordered[j].value===ordered[i].value) j++;
        const mid=(i+j-1)/2+1;
        for(let k=i;k<j;k++) result[ordered[k].i]=mid;
        i=j;
      }
      return result;
    };
    const a=rank(xs), b=rank(ys), n=a.length;
    const ma=d3.mean(a), mb=d3.mean(b);
    const numerator=d3.sum(a.map((v,i)=>(v-ma)*(b[i]-mb)));
    const denominator=Math.sqrt(d3.sum(a,v=>(v-ma)**2)*d3.sum(b,v=>(v-mb)**2));
    return denominator ? numerator/denominator : NaN;
  }
  function guestFinding() {
    const node = el('guestFinding'); if (!node || !guestData) return;
    const pts = guestData.filter(r => r.year === year && r.n >= 5 && get(year, r.community));
    if (pts.length < 5) { node.innerHTML = `<b>Too little data in ${year}:</b> only ${pts.length} communities have five or more rated listings, so no pattern can be judged this year. Try 2024 or 2025.`; return; }
    const rho = spearman(pts.map(p => get(year, p.community).price), pts.map(p => p.rating));
    const [lo, hi] = d3.extent(pts, p => p.rating);
    const verdict = Math.abs(rho) < 0.3 ? 'no clear relationship' : rho > 0 ? 'a moderate tendency for pricier communities to rate higher' : 'a moderate tendency for pricier communities to rate lower';
    node.innerHTML = `<b>What the chart shows in ${year}:</b> across ${pts.length} communities, mean guest ratings range only from ${lo.toFixed(2)} to ${hi.toFixed(2)} stars. ` +
      `Sale price and rating show ${verdict} (rank correlation ${rho.toFixed(2)})` + (pts.length < 15 ? `, based on just ${pts.length} communities, so treat it with caution.` : '.') +
      (Math.abs(rho) < 0.3 ? ' These observations do not establish whether sale prices predict guest ratings.' : ' Compare other years: the pattern is not stable from year to year.');
  }

  function render() {
    try { gapInset(); } catch (e) { console.error('gap inset', e); }
    try { interval(); } catch (e) { console.error('interval', e); }
    try { ladder(); } catch (e) { console.error('ladder', e); }
    try { guestFinding(); } catch (e) { console.error('guest finding', e); }
  }
  window.TwinInsights = { render };

  Promise.all([d3.json('data/dna_ladder.json'), d3.json('data/guest_ratings.json')])
    .then(([l, g]) => { ladderData = l; guestData = g; if (summary.length) render(); })
    .catch(e => console.error('Twin insights data unavailable', e));
  let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 250); });
})();
