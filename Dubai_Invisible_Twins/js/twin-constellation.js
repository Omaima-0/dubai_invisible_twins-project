/*
 * Member 3 — Visualization 1: Twin Constellation
 * Requires D3 v7 (global `d3`). No other globals.
 *
 * Exposes: window.Constellation.render(ctx)
 *   ctx = {
 *     container,                 // DOM node
 *     summary,                   // array of community-year rows
 *     year, a, b,                // selected year + community ids
 *     neighbors,                 // array of eligible partner ids for a
 *     get, nice, num, money,     // helpers from app.js
 *     tooltip, hideTip,          // tooltip helpers
 *     onSelectPartner            // callback(id)
 *   }
 */
(function () {
  const A = '#008e99';
  const B = '#ed805e';
  const NEUTRAL = '#b8c9c8';
  const CANDIDATE = '#9fc9c3';
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DUR = REDUCED ? 0 : 700;

  function render(ctx) {
    const {
      container, summary, year, a, b, neighbors,
      get, nice, num, money, tooltip, hideTip, onSelectPartner
    } = ctx;

    if (!container) return;

    // Only communities with >= 12 eligible sales this year.
    const data = summary.filter(d => d.year === year && d.n >= 12);
    if (!data.length) return;

    const selectedA = get(year, a);
    const selectedB = get(year, b);
    if (!selectedA) return;

    // ---- responsive sizing (work at small widths) ----
    const W = Math.max(300, container.clientWidth - 24);
    const H = Math.max(280, container.clientHeight - 24);
    const margin = { l: W < 520 ? 52 : 66, r: 24, t: 24, b: 60 };

    // ---- scales ----
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.area)).nice()
      .range([margin.l, W - margin.r]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.price) * 1.13])
      .nice()
      .range([H - margin.b, margin.t]);

    const r = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d.n)])
      .range([4, 16]);

    // ---- one SVG per container, reused across updates ----
    const svg = d3.select(container)
      .selectAll('svg.constellation')
      .data([null])
      .join('svg')
      .attr('class', 'constellation')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('role', 'img')
      .attr('aria-label',
        `Twin Constellation: median area versus median price for ${data.length} communities in ${year}`);

    // ---- gridlines (horizontal) ----
    svg.selectAll('.gridline').data(y.ticks(5))
      .join('line')
      .attr('class', 'gridline')
      .attr('x1', margin.l).attr('x2', W - margin.r)
      .attr('y1', d => y(d)).attr('y2', d => y(d));

    // ---- axes (persistent groups) ----
    const xAxis = svg.selectAll('.axis-x').data([null]).join('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0,${H - margin.b})`);

    xAxis.transition().duration(DUR)
      .call(d3.axisBottom(x)
        .ticks(W < 500 ? 4 : 7)
        .tickSizeOuter(0))
      .call(g => g.selectAll('text').attr('dy', '1.3em'));

    svg.selectAll('.axis-y').data([null]).join('g')
      .attr('class', 'axis axis-y')
      .attr('transform', `translate(${margin.l},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => num(d)));

    // ---- axis captions ----
    svg.selectAll('.cap-x').data([null]).join('text')
      .attr('class', 'chart-caption cap-x')
      .attr('x', W / 2).attr('y', H - 7)
      .attr('text-anchor', 'middle')
      .text('MEDIAN FLOOR AREA · m²');

    svg.selectAll('.cap-y').data([null]).join('text')
      .attr('class', 'chart-caption cap-y')
      .attr('transform', `translate(14,${H / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .text('MEDIAN PRICE · AED/m²');

    // ---- candidate connection lines (join so nothing duplicates) ----
    const candidates = data.filter(d => neighbors.includes(d.community));
    const lines = svg.selectAll('.link').data(candidates, d => d.community);
    lines.exit().transition().duration(DUR).attr('stroke-opacity', 0).remove();
    lines.enter().append('line')
      .attr('class', 'link')
      .attr('x1', x(selectedA.area)).attr('y1', y(selectedA.price))
      .attr('x2', x(selectedA.area)).attr('y2', y(selectedA.price))
      .attr('stroke', A).attr('stroke-opacity', 0).attr('stroke-width', 1.5)
      .merge(lines)
      .transition().duration(DUR)
      .attr('x1', x(selectedA.area)).attr('y1', y(selectedA.price))
      .attr('x2', d => x(d.area)).attr('y2', d => y(d.price))
      .attr('stroke-opacity', 0.22);

    // ---- dots (data join by community id) ----
    const dots = svg.selectAll('.mark')
      .data(data, d => d.community);

    const dotsEnter = dots.enter().append('circle')
      .attr('class', 'mark')
      .attr('cx', d => x(d.area))
      .attr('cy', d => y(d.price))
      .attr('r', 0)
      .attr('opacity', 0);

    dots.exit().transition().duration(DUR).attr('r', 0).attr('opacity', 0).remove();

    const dotsAll = dotsEnter.merge(dots);

    dotsAll
      .attr('fill', d =>
        d.community === a ? A :
        d.community === b ? B :
        neighbors.includes(d.community) ? CANDIDATE : NEUTRAL)
      .attr('stroke', d =>
        d.community === a || d.community === b ? 'white' : 'none')
      .attr('stroke-width', 3)
      .style('cursor', d => neighbors.includes(d.community) ? 'pointer' : 'default')
      .on('mousemove', (event, d) => {
        const eligible = d.community === a || neighbors.includes(d.community);
        const isSelected = d.community === a || d.community === b;
        tooltip(
          `<b>${d.name}</b><br>` +
          `Median apartment area: ${d.area.toFixed(1)} m²<br>` +
          `Median price: ${money(d.price)}/m²<br>` +
          `Eligible transactions: ${d.n}<br>` +
          `Match status: ${isSelected ? 'Selected' : eligible ? 'Eligible' : 'Not eligible'}` +
          (neighbors.includes(d.community) ? '<br><i>Click to compare</i>' : ''),
          event
        );
      })
      .on('mouseleave', hideTip)
      .on('click', (event, d) => {
        if (d.community === a) return;                 // can't compare to itself
        if (!neighbors.includes(d.community)) return;  // ignore ineligible silently-wrongly
        if (typeof onSelectPartner === 'function') onSelectPartner(d.community);
      });

    // animate position + radius (transition), staggered
    dotsAll.transition().duration(DUR)
      .delay((d, i) => REDUCED ? 0 : Math.min(i * 15, 400))
      .attr('cx', d => x(d.area))
      .attr('cy', d => y(d.price))
      .attr('r', d => r(d.n) + (d.community === a || d.community === b ? 3 : 0))
      .attr('opacity', d =>
        d.community === a || d.community === b ? 1 :
        neighbors.includes(d.community) ? 0.9 : 0.5);

    // ---- labels for A and B only (keyed) ----
    const labelData = [selectedA, selectedB].filter(Boolean);
    const labels = svg.selectAll('.plot-label-c').data(labelData, d => d.community);
    labels.exit().remove();
    labels.enter().append('text')
      .attr('class', 'plot-label plot-label-c')
      .merge(labels)
      .attr('fill', d => d.community === a ? A : B)
      .attr('x', d => x(d.area) + 15)
      .attr('y', (d, i) => y(d.price) + (i ? 18 : -12))
      .text(d => d.name.length > 23 ? d.name.slice(0, 22) + '…' : d.name);
  }

  window.Constellation = { render };
})();