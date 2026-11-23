/*
 * Member 3 — Visualization 2: Every Sale
 * Requires D3 v7 (global `d3`).
 *
 * Exposes: window.EverySale.render(ctx)
 *   ctx = {
 *     container, sales, summary, year, a, b,
 *     obs, get, nice, num, money,       // helpers
 *     tooltip, hideTip
 *   }
 *
 * Persists two UI controls inside the frame:
 *   - "Show medians" toggle
 *   - "Highlight IQR" toggle
 */
(function () {
  const A = '#008e99';
  const B = '#ed805e';
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DUR = REDUCED ? 0 : 700;

  // Per-container UI state survives updates.
  const state = new WeakMap();

  function ui(container) {
    let s = state.get(container);
    if (s) return s;
    s = { showMedians: true, showIQR: false };
    state.set(container, s);
    return s;
  }

  function ensureControls(container, s, onChange) {
    let bar = container.querySelector('.every-sale-controls');
    if (bar) {
      // refresh checked state in case another instance created it
      bar.querySelector('[data-act="medians"]').setAttribute('aria-pressed', s.showMedians);
      bar.querySelector('[data-act="iqr"]').setAttribute('aria-pressed', s.showIQR);
      return;
    }
    bar = document.createElement('div');
    bar.className = 'every-sale-controls';
    bar.style.cssText =
      'display:flex;gap:8px;padding:8px 12px;font-size:11px;font-weight:800;' +
      'letter-spacing:.06em;color:#217782;border-bottom:1px solid #dce6e3;';
    bar.innerHTML =
      `<button type="button" data-act="medians" aria-pressed="${s.showMedians}" ` +
      `style="border:1px solid #b6cac7;background:#fffdfa;padding:6px 10px;border-radius:20px;cursor:pointer">` +
      `SHOW MEDIANS</button>` +
      `<button type="button" data-act="iqr" aria-pressed="${s.showIQR}" ` +
      `style="border:1px solid #b6cac7;background:#fffdfa;padding:6px 10px;border-radius:20px;cursor:pointer">` +
      `HIGHLIGHT IQR</button>`;
    container.insertBefore(bar, container.firstChild);

    bar.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const key = btn.dataset.act;
      if (key === 'medians') s.showMedians = !s.showMedians;
      if (key === 'iqr') s.showIQR = !s.showIQR;
      btn.setAttribute('aria-pressed',
        key === 'medians' ? s.showMedians : s.showIQR);
      btn.style.background =
        (key === 'medians' ? s.showMedians : s.showIQR)
          ? '#167f89' : '#fffdfa';
      btn.style.color =
        (key === 'medians' ? s.showMedians : s.showIQR)
          ? '#fff' : '#217782';
      onChange();
    });

    // init styling for defaults
    requestAnimationFrame(() => {
      bar.querySelector('[data-act="medians"]').style.background =
        s.showMedians ? '#167f89' : '#fffdfa';
      bar.querySelector('[data-act="medians"]').style.color =
        s.showMedians ? '#fff' : '#217782';
    });
  }

  // Deterministic jitter layout so dots never overlap exactly.
  function layout(points, xScale, centerY, radius, up) {
    const n = points.length;
    const cols = Math.max(4, Math.ceil(Math.sqrt(n * 2)));
    const colW = radius * 2.4;
    // group by sorted price into columns
    const byCol = d3.group(points, (_, i) => i % cols);
    const out = [];
    points.forEach((p, i) => {
      const col = i % cols;
      const stack = byCol.get(col) || [];
      const row = stack.indexOf(p);
      const rowH = radius * 2.2;
      const dir = up ? -1 : 1;
      out.push({
        ...p,
        px: xScale(p.price),
        py: centerY + dir * (row - stack.length / 2) * rowH
      });
    });
    return out;
  }

  function iqrOf(group) {
    if (group.length < 4) return null;
    const prices = group.map(d => d.price).sort(d3.ascending);
    return {
      q1: d3.quantileSorted(prices, 0.25),
      q3: d3.quantileSorted(prices, 0.75)
    };
  }

  function render(ctx) {
    const {
      container, sales, year, a, b,
      obs, get, nice, num, money, tooltip, hideTip
    } = ctx;

    if (!container) return;
    const s = ui(container);

    const groupA = obs(a, year);
    const groupB = obs(b, year);
    const all = [...groupA, ...groupB];
    if (!all.length) return;

    const W = Math.max(300, container.clientWidth - 24);
    const H = Math.max(280, container.clientHeight - 24);
    const margin = { l: W < 520 ? 52 : 65, r: 25, t: 30, b: 62 };

    const maxPrice = d3.max(all, d => d.price) || 1;
    const x = d3.scaleLinear()
      .domain([0, maxPrice * 1.06]).nice()
      .range([margin.l, W - margin.r]);

    const svg = d3.select(container)
      .selectAll('svg.every-sale')
      .data([null])
      .join('svg')
      .attr('class', 'every-sale')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('role', 'img')
      .attr('aria-label',
        `Every Sale: ${groupA.length + groupB.length} transactions across two communities in ${year}`);

    // ---- gridlines ----
    svg.selectAll('.gridline').data(x.ticks(6))
      .join('line')
      .attr('class', 'gridline')
      .attr('x1', d => x(d)).attr('x2', d => x(d))
      .attr('y1', 25).attr('y2', H - margin.b);

    // ---- axis ----
    const axisG = svg.selectAll('.axis-x').data([null]).join('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0,${H - margin.b})`);
    axisG.transition().duration(DUR)
      .call(d3.axisBottom(x).ticks(W < 500 ? 4 : 7).tickSizeOuter(0));

    svg.selectAll('.cap-x').data([null]).join('text')
      .attr('class', 'chart-caption cap-x')
      .attr('x', W / 2).attr('y', H - 7)
      .attr('text-anchor', 'middle')
      .text('RECORDED SALE PRICE · AED PER m²');

    const centers = [H * 0.30, H * 0.69];

    // ---- per-community layers ----
    [a, b].forEach((id, i) => {
      const group = i === 0 ? groupA : groupB;
      const color = i === 0 ? A : B;
      const meta = get(year, id);
      const layer = svg.selectAll(`.layer-${i}`).data([null]).join('g')
        .attr('class', `layer layer-${i}`);
      const radius = W < 520 ? 2.8 : 3.8;

      // Header label
      layer.selectAll('.row-label').data([null]).join('text')
        .attr('class', 'plot-label row-label')
        .attr('x', margin.l)
        .attr('y', centers[i] - 58)
        .text(`${meta.name} · ${group.length} sales`);

      // ---- IQR band (optional) ----
      const iqr = iqrOf(group);
      const band = layer.selectAll('.iqr-band').data(iqr ? [iqr] : []);
      band.exit().transition().duration(DUR).attr('opacity', 0).remove();
      band.enter().append('rect')
        .attr('class', 'iqr-band')
        .attr('x', d => x(d.q1))
        .attr('y', centers[i] - 6)
        .attr('height', 12)
        .attr('fill', color)
        .attr('opacity', 0)
        .merge(band)
        .transition().duration(DUR)
        .attr('x', d => x(d.q1))
        .attr('width', d => Math.max(0, x(d.q3) - x(d.q1)))
        .attr('y', centers[i] - 6)
        .attr('height', 12)
        .attr('opacity', s.showIQR ? 0.18 : 0);

      // ---- median reference ----
      const med = meta ? meta.price : d3.median(group, d => d.price);
      const medG = layer.selectAll('.median').data([{ med }])
        .join('g')
        .attr('class', 'median');
      medG.selectAll('.med-line').data([null]).join('line')
        .attr('class', 'med-line')
        .attr('x1', x(med)).attr('x2', x(med))
        .attr('y1', centers[i] - 50).attr('y2', centers[i] + 48)
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '6,4')
        .attr('opacity', s.showMedians ? 1 : 0);
      medG.selectAll('.med-label').data([null]).join('text')
        .attr('class', 'med-label')
        .attr('x', Math.min(W - 150, x(med) + 6))
        .attr('y', centers[i] + 58)
        .attr('fill', color)
        .attr('font-size', 11)
        .attr('font-weight', 800)
        .attr('opacity', s.showMedians ? 1 : 0)
        .text('MEDIAN ' + num(med));

      // ---- dots, deterministic non-overlapping layout ----
      const positioned = layout(group, x, centers[i], radius, i === 1);

      const marks = layer.selectAll('.mark')
        .data(positioned, d => d.id ?? d.price + ':' + (d.area ?? 0) + ':' + (d.worth ?? 0));

      marks.exit().transition().duration(DUR)
        .attr('r', 0).attr('opacity', 0).remove();

      const enter = marks.enter().append('circle')
        .attr('class', 'mark')
        .attr('cx', d => d.px)
        .attr('cy', centers[i])
        .attr('r', 0)
        .attr('fill', d => d.flag ? '#fffdf8' : color)
        .attr('stroke', d => d.flag ? color : 'none')
        .attr('stroke-width', 1.6)
        .attr('opacity', 0)
        .on('mousemove', (event, d) => {
          // Never invent details not present in the record.
          const parts = [
            `<b>${meta.name}</b>`,
            `Transaction year: ${d.year ?? year}`,
            `Floor area: ${d.area != null ? d.area.toFixed(1) + ' m²' : 'n/a'}`,
            `Recorded sale value: ${d.worth != null ? money(d.worth) : 'n/a'}`,
            `Price per m²: ${money(d.price)}`
          ];
          if (d.flag) parts.push('<i>Hollow dot: below 25% of the community median. The transaction reason is unknown; this is a statistical flag only.</i>');
          tooltip(parts.join('<br>'), event);
        })
        .on('mouseleave', hideTip);

      enter.merge(marks)
        .transition().duration(DUR)
        .delay((d, j) => REDUCED ? 0 : Math.min(j * 4, 500))
        .attr('cx', d => d.px)
        .attr('cy', d => d.py)
        .attr('r', radius)
        .attr('opacity', d => d.flag ? 0.95 : 0.66);
    });

    // ---- control wiring (once) ----
    ensureControls(container, s, () => render(ctx));
  }

  window.EverySale = { render };
})();