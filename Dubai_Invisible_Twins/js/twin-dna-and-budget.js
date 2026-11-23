
/*
 * DUBAI'S INVISIBLE TWINS
 * MEMBER 4 — D3 VISUALIZATIONS
 *
 * 1. Twin DNA
 * 2. Same Budget, Different Home
 * 3. Linked animated apartment illustrations
 *
 * Requires the existing app.js to load first.
 */

// -----------------------------------------
// SHARED VISUALIZATION SETTINGS
// -----------------------------------------

const member4Duration = 750;

function member4ReduceMotion() {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}

function member4Transition(selection, duration = member4Duration) {
  return selection
    .interrupt()
    .transition()
    .duration(member4ReduceMotion() ? 0 : duration)
    .ease(d3.easeCubicInOut);
}

function member4Number(value, unit) {
  if (unit === "AED") {
    return money(value);
  }

  if (unit === "m²") {
    return value.toFixed(1) + " m²";
  }

  if (unit === "AED/m²") {
    return "AED " + num(value) + "/m²";
  }

  return num(value) + " " + unit;
}

function member4Chart(containerId, height = 390) {
  const node = document.getElementById(containerId);

  if (!node) return null;

  const width = Math.max(300, node.clientWidth - 24);

  // Preserve the SVG between interactions.
  const svg = d3.select(node)
    .selectAll("svg.member4-chart")
    .data([null])
    .join("svg")
    .attr("class", "member4-chart")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("role", "img");

  return { svg, width, height };
}

// -----------------------------------------
// VISUALIZATION 1 — TWIN DNA
// -----------------------------------------

function dna() {
  const first = get(year, a);
  const second = get(year, b);

  if (!first || !second) return;

  const [label, unit, getValue] = metricMap[metric];

  const data = [
    {
      id: "A",
      name: first.name,
      value: getValue(first),
      color: A
    },
    {
      id: "B",
      name: second.name,
      value: getValue(second),
      color: B
    }
  ];

  $("metricLabel").textContent = label;

  const chart = member4Chart("dnaChart");

  if (!chart) return;

  const { svg, width, height } = chart;

  svg.attr("aria-label", `${label}: ${first.name} compared with ${second.name}`);

  const left = 55;
  const right = width - 40;
  const axisY = height - 43;

  const maxValue = d3.max(data, d => d.value) || 1;

  const x = d3.scaleLinear()
    .domain([0, maxValue * 1.25])
    .nice()
    .range([left, right]);

  const y = d3.scalePoint()
    .domain(["A", "B"])
    .range([115, 280]);

  // -------------------------------
  // AXIS
  // -------------------------------

  svg.selectAll(".m4-axis")
    .data([null])
    .join("g")
    .attr("class", "m4-axis axis")
    .attr("transform", `translate(0,${axisY})`)
    .transition()
    .duration(member4ReduceMotion() ? 0 : 600)
    .call(
      d3.axisBottom(x)
        .ticks(width < 500 ? 4 : 6)
        .tickFormat(value =>
          metric === "worth"
            ? (value / 1000000).toFixed(1) + "M"
            : num(value)
        )
    );

  // -------------------------------
  // COMMUNITY LABELS
  // -------------------------------

  svg.selectAll(".m4-label")
    .data(data, d => d.id)
    .join("text")
    .attr("class", "m4-label")
    .attr("x", left)
    .attr("y", d => y(d.id) - 36)
    .attr("font-size", width < 500 ? 12 : 15)
    .attr("font-weight", 700)
    .attr("fill", ink)
    .text(d => d.name);

  // -------------------------------
  // ANIMATED BARS
  // -------------------------------

  const bars = svg.selectAll(".m4-bar")
    .data(data, d => d.id)
    .join(
      enter => enter.append("rect")
        .attr("class", "m4-bar")
        .attr("x", left)
        .attr("width", 0)
        .attr("height", 28)
        .attr("rx", 8),
      update => update,
      exit => exit.remove()
    )
    .attr("y", d => y(d.id) - 14)
    .attr("fill", d => d.color)
    .attr("opacity", 0.9)
    .style("cursor", "pointer")
    .on("mousemove", (event, d) => {
      tooltip(
        `<b>${d.name}</b><br>
         ${label}<br>
         ${member4Number(d.value, unit)}`,
        event
      );
    })
    .on("mouseleave", hideTip);

  member4Transition(bars)
    .attr("x", left)
    .attr("width", d =>
      Math.max(0, x(d.value) - left)
    );

  // -------------------------------
  // VALUE LABELS
  // -------------------------------

  const valueLabels = svg.selectAll(".m4-value")
    .data(data, d => d.id)
    .join("text")
    .attr("class", "m4-value")
    .attr("y", d => y(d.id) + 28)
    .attr("font-size", 13)
    .attr("font-weight", 700)
    .attr("fill", d => d.color);

  member4Transition(valueLabels)
    .attr("x", d => Math.min(
      width - 135,
      Math.max(left, x(d.value) - 40)
    ))
    .text(d => member4Number(d.value, unit));

  // -------------------------------
  // AUTOMATIC INTERPRETATION
  // -------------------------------

  const difference = Math.abs(
    data[0].value - data[1].value
  );

  const larger = data[0].value >= data[1].value
    ? data[0]
    : data[1];

  $("dnaInsight").textContent =
    `${first.name}: ${member4Number(data[0].value, unit)}. ` +
    `${second.name}: ${member4Number(data[1].value, unit)}. ` +
    `${larger.name} has the higher recorded value, ` +
    `with an absolute difference of ` +
    `${member4Number(difference, unit)}. ` +
    `This comparison is descriptive and does not establish a cause.`;
}

// -----------------------------------------
// VISUALIZATION 2 — BUDGET EXPLORER
// -----------------------------------------

function budgetView() {
  const first = get(year, window.budgetCommunityA ?? a);
  const second = get(year, window.budgetCommunityB ?? b);

  if (!first || !second) return;

  // Theoretical area based on median AED/m².
  const areaA = budget / first.price;
  const areaB = budget / second.price;

  const data = [
    {
      id: "A",
      name: first.name,
      value: areaA,
      color: A
    },
    {
      id: "B",
      name: second.name,
      value: areaB,
      color: B
    }
  ];

  $("budgetAmount").textContent = money(budget);

  const chart = member4Chart("budgetChart");

  if (!chart) return;

  const { svg, width, height } = chart;

  svg.attr(
    "aria-label",
    `Theoretical floor area for a budget of ${money(budget)}`
  );

  const left = 55;
  const right = width - 40;

  // Fixed maximum for the selected communities.
  // As budget increases, the bars visibly grow.
  const maximumBudget = Number(
    $("budgetRange").max
  );

  const maximumArea =
    maximumBudget / Math.min(first.price, second.price);

  const x = d3.scaleLinear()
    .domain([0, maximumArea * 1.08])
    .range([left, right]);

  const y = d3.scalePoint()
    .domain(["A", "B"])
    .range([120, 285]);

  // -------------------------------
  // REFERENCE BAND: the 55–100 m² flats that exist in the data.
  // Areas outside it are arithmetic only, not flats anyone sold.
  // -------------------------------

  const band = svg.selectAll(".m4-data-range")
    .data([null])
    .join(enter => {
      const g = enter.append("g").attr("class", "m4-data-range");
      g.append("rect").attr("fill", "#163443").attr("opacity", 0.06);
      g.append("text").attr("font-size", 10.5).attr("font-weight", 800)
        .attr("letter-spacing", ".08em").attr("fill", "#5a7477");
      return g;
    });
  band.select("rect").transition().duration(member4ReduceMotion() ? 0 : 500)
    .attr("x", x(55)).attr("width", Math.max(0, x(100) - x(55)))
    .attr("y", 70).attr("height", height - 113);
  band.select("text").attr("x", x(55) + 6).attr("y", 84)
    .text("1-BED FLATS IN THE DATA · 55–100 m²");

  // -------------------------------
  // AXIS
  // -------------------------------

  svg.selectAll(".m4-budget-axis")
    .data([null])
    .join("g")
    .attr("class", "m4-budget-axis axis")
    .attr("transform", `translate(0,${height - 43})`)
    .call(
      d3.axisBottom(x)
        .ticks(width < 500 ? 4 : 6)
        .tickFormat(d => num(d))
    );

  // -------------------------------
  // COMMUNITY LABELS
  // -------------------------------

  svg.selectAll(".m4-budget-label")
    .data(data, d => d.id)
    .join("text")
    .attr("class", "m4-budget-label")
    .attr("x", left)
    .attr("y", d => y(d.id) - 38)
    .attr("font-size", width < 500 ? 12 : 15)
    .attr("font-weight", 700)
    .attr("fill", ink)
    .text(d => d.name);

  // -------------------------------
  // ANIMATED BARS
  // -------------------------------

  const bars = svg.selectAll(".m4-budget-bar")
    .data(data, d => d.id)
    .join(
      enter => enter.append("rect")
        .attr("class", "m4-budget-bar")
        .attr("x", left)
        .attr("width", 0)
        .attr("height", 34)
        .attr("rx", 9),
      update => update,
      exit => exit.remove()
    )
    .attr("y", d => y(d.id) - 17)
    .attr("fill", d => d.color)
    .style("cursor", "pointer")
    .on("mousemove", (event, d) => {
      tooltip(
        `<b>${d.name}</b><br>
         Budget: ${money(budget)}<br>
         Median price: ${money(
           d.id === "A" ? first.price : second.price
         )}/m²<br>
         Theoretical area: ${d.value.toFixed(1)} m²`,
        event
      );
    })
    .on("mouseleave", hideTip);

  member4Transition(bars, 350)
    .attr("width", d =>
      Math.max(0, x(d.value) - left)
    );

  // -------------------------------
  // ANIMATED AREA LABELS
  // -------------------------------

  const labels = svg.selectAll(".m4-budget-value")
    .data(data, d => d.id)
    .join("text")
    .attr("class", "m4-budget-value")
    .attr("y", d => y(d.id) + 34)
    .attr("font-size", 14)
    .attr("font-weight", 700)
    .attr("fill", d => d.color);

  member4Transition(labels, 350)
    .attr("x", d =>
      Math.min(width - 95, Math.max(left, x(d.value) - 20))
    )
    .text(d => d.value.toFixed(1) + " m²");

  // -------------------------------
  // INTERPRETATION
  // -------------------------------

  const extraArea = Math.abs(areaA - areaB);

  const moreAreaCommunity = areaA >= areaB
    ? first.name
    : second.name;

  $("budgetInsight").textContent =
    `With a theoretical budget of ${money(budget)}, ` +
    `${first.name} corresponds to ${areaA.toFixed(1)} m², ` +
    `while ${second.name} corresponds to ${areaB.toFixed(1)} m². ` +
    `${moreAreaCommunity} offers ${extraArea.toFixed(1)} m² ` +
    `more theoretical floor area at the recorded median price. ` +
    `These are estimates, not actual available properties.`;
}

// -----------------------------------------
// LINKED APARTMENT ILLUSTRATIONS
// -----------------------------------------

function building(id, mode) {
  const container = $("building-" + id);

  const first = get(year, mode === "budget" ? (window.budgetCommunityA ?? a) : a);
  const second = get(year, mode === "budget" ? (window.budgetCommunityB ?? b) : b);

  if (!container || !first || !second) return;

  let values;

  if (mode === "budget") {
    values = [
      budget / first.price,
      budget / second.price
    ];
  } else if (mode === "dna") {
    const getValue = metricMap[metric][2];

    values = [
      getValue(first),
      getValue(second)
    ];
  } else {
    values = [first.price, second.price];
  }

  const maximum = Math.max(...values, 0.0001);

  const heights = values.map(value =>
    45 + (value / maximum) * 100
  );

  // Preserve the SVG to animate existing buildings.
  const svg = d3.select(container)
    .selectAll("svg.m4-apartments")
    .data([null])
    .join("svg")
    .attr("class", "m4-apartments")
    .attr("viewBox", "0 0 330 245")
    .attr("width", "100%")
    .attr("role", "img")
    .attr("aria-label",
      "Illustrative apartment blocks comparing two communities"
    );

  // Ground shadow.
  svg.selectAll(".m4-shadow")
    .data([null])
    .join("ellipse")
    .attr("class", "m4-shadow")
    .attr("cx", 165)
    .attr("cy", 205)
    .attr("rx", 145)
    .attr("ry", 14)
    .attr("fill", "#d5e3de");

  const blocks = [
    { id: "A", x: 42, value: values[0], height: heights[0], color: A },
    { id: "B", x: 192, value: values[1], height: heights[1], color: B }
  ];

  const groups = svg.selectAll(".m4-tower")
    .data(blocks, d => d.id)
    .join(enter => {
      const group = enter.append("g")
        .attr("class", "m4-tower");

      group.append("path")
        .attr("class", "m4-side");

      group.append("rect")
        .attr("class", "m4-front");

      group.append("path")
        .attr("class", "m4-roof");

      group.append("g")
        .attr("class", "m4-windows");

      group.append("text")
        .attr("class", "m4-tower-label");

      group.append("text")
        .attr("class", "m4-tower-value");

      return group;
    });

  groups.each(function(d) {
    const group = d3.select(this);

    const top = 192 - d.height;
    const x = d.x;

    member4Transition(
      group.select(".m4-front"),
      mode === "budget" ? 350 : 750
    )
      .attr("x", x)
      .attr("y", top)
      .attr("width", 75)
      .attr("height", d.height)
      .attr("rx", 2)
      .attr("fill", d.color);

    member4Transition(
      group.select(".m4-side"),
      mode === "budget" ? 350 : 750
    )
      .attr(
        "d",
        `M${x + 75},${top}
         l19,-12
         v${d.height}
         l-19,12 Z`
      )
      .attr("fill", d3.color(d.color).darker(0.8));

    member4Transition(
      group.select(".m4-roof"),
      mode === "budget" ? 350 : 750
    )
      .attr(
        "d",
        `M${x},${top}
         l19,-12
         h75
         l-19,12 Z`
      )
      .attr("fill", d3.color(d.color).brighter(0.7));

    const windows = d3.range(12).map(i => ({
      x: x + 12 + (i % 3) * 20,
      y: top + 15 + Math.floor(i / 3) *
        ((d.height - 30) / 4)
    }));

    const windowMarks = group.select(".m4-windows")
      .selectAll("rect")
      .data(windows)
      .join("rect")
      .attr("width", 10)
      .attr("height", 7)
      .attr("rx", 1)
      .attr("fill", "#fffdf6")
      .attr("opacity", 0.8);

    member4Transition(
      windowMarks,
      mode === "budget" ? 350 : 750
    )
      .attr("x", window => window.x)
      .attr("y", window => window.y);

    group.select(".m4-tower-label")
      .attr("x", x + 37)
      .attr("y", 225)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("font-weight", 800)
      .attr("fill", ink)
      .text(d.id);

    let valueLabel;

    if (mode === "budget") {
      valueLabel = d.value.toFixed(1) + " m²";
    } else if (mode === "dna") {
      valueLabel = metric === "worth"
        ? (d.value / 1000000).toFixed(2) + "M AED"
        : metric === "area"
          ? d.value.toFixed(1) + " m²"
          : metric === "iqr"
            ? num(d.value) + " AED/m²"
            : num(d.value) + " sales";
    } else {
      valueLabel = num(d.value) + " AED/m²";
    }

    group.select(".m4-tower-value")
      .attr("x", x + 37)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-weight", 700)
      .attr("fill", ink)
      .text(valueLabel);

    member4Transition(
      group.select(".m4-tower-value"),
      mode === "budget" ? 350 : 750
    ).attr("y", top - 25);
  });

  // Keep the explanation synchronized.
  const explanation = $("side-" + id);

  if (explanation) {
    let measured;

    if (mode === "budget") {
      measured = "theoretical equivalent floor area";
    } else if (mode === "dna") {
      measured = metricMap[metric][0].toLowerCase();
    } else {
      measured = "median price per square metre";
    }

    explanation.textContent =
      `A: ${first.name}. B: ${second.name}. ` +
      `Illustration height represents ${measured}. ` +
      `These are not actual buildings or building heights.`;
  }
}
