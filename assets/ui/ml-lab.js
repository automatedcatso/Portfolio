/* A small, local learning experiment. No project or resume metrics are used here. */
((global) => {
  'use strict';

  function random(seed) {
    let state = seed >>> 0;
    return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
  }

  function makeDataset(preset = 'linear', seed = 719) {
    if (!['linear', 'rings'].includes(preset)) throw new TypeError('Unknown toy dataset');
    const next = random(seed), points = [];
    for (let label = 0; label < 2; label++) {
      for (let i = 0; i < 36; i++) {
        if (preset === 'rings') {
          const angle = i / 36 * Math.PI * 2 + label * 0.09;
          const radius = (label ? 0.86 : 0.29) + (next() - 0.5) * 0.13;
          points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, label });
        } else {
          const direction = label ? 1 : -1;
          points.push({ x: direction * 0.54 + (next() - 0.5) * 0.66,
            y: direction * 0.32 + (next() - 0.5) * 0.85, label });
        }
      }
    }
    return points;
  }

  const features = (point, lifted) => lifted
    ? [point.x, point.y, point.x * point.x + point.y * point.y, 1]
    : [point.x, point.y, 1];
  const createModel = (lifted = false) => ({ lifted, weights: lifted ? [0.06, -0.04, 0, 0] : [0.06, -0.04, 0], iteration: 0 });
  const score = (model, point) => features(point, model.lifted).reduce((sum, value, i) => sum + value * model.weights[i], 0);
  const sigmoid = value => value >= 0 ? 1 / (1 + Math.exp(-value)) : Math.exp(value) / (1 + Math.exp(value));
  const predict = (model, point) => sigmoid(score(model, point));
  function loss(model, points) {
    if (!points.length) return 0;
    return points.reduce((sum, point) => {
      const z = score(model, point);
      return sum + Math.max(z, 0) - z * point.label + Math.log1p(Math.exp(-Math.abs(z)));
    }, 0) / points.length;
  }
  function step(model, points, count = 1) {
    if (!points.length) return model;
    for (let n = 0; n < count; n++) {
      const gradient = model.weights.map(() => 0);
      for (const point of points) {
        const values = features(point, model.lifted), error = predict(model, point) - point.label;
        for (let i = 0; i < gradient.length; i++) gradient[i] += error * values[i];
      }
      model.weights = model.weights.map((weight, i) => weight - 0.38 * gradient[i] / points.length);
      model.iteration++;
    }
    return model;
  }
  global.MLNeuralToy = Object.freeze({ makeDataset, createModel, predict, loss, step });
  if (typeof document === 'undefined' || document.getElementById('neuralLab')) return;

  const hero = document.querySelector('.hero'), footer = document.querySelector('#terminal .terminal-bottom');
  if (!hero || !footer) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motion.matches, heroVisible = false, meshHeld = false, running = false;
  let frame = 0, lastFrame = 0, dirty = true, heroTime = 0, returnFocus = null;
  let points = makeDataset(), model = createModel(), probe = { x: 0.4, y: 0.15 };
  const pointer = { x: -1000, y: -1000 };

  const mesh = document.createElement('canvas');
  mesh.className = 'ml-hero-mesh'; mesh.setAttribute('aria-hidden', 'true');
  hero.classList.add('ml-signal-host'); hero.prepend(mesh);
  const openButton = document.createElement('button');
  openButton.type = 'button'; openButton.className = 'ml-open-lab'; openButton.textContent = 'OPEN NEURAL LAB ↗';
  const holdButton = document.createElement('button');
  holdButton.type = 'button'; holdButton.className = 'ml-hold-signal';
  footer.classList.add('ml-terminal-footer'); footer.append(openButton, holdButton);

  const dialog = document.createElement('dialog');
  dialog.id = 'neuralLab'; dialog.className = 'ml-lab';
  dialog.setAttribute('aria-labelledby', 'mlLabTitle'); dialog.setAttribute('aria-describedby', 'mlLabDescription');
  dialog.innerHTML = `
    <div class="ml-lab-shell">
      <header class="ml-lab-head">
        <div><span class="ml-eyebrow">NEURAL LAB <b>TOY SIMULATION</b></span><h2 id="mlLabTitle" tabindex="-1">A small model.<br><em>A visible decision.</em></h2></div>
        <button type="button" class="ml-close" aria-label="Close Neural Lab">×</button>
      </header>
      <p id="mlLabDescription" class="ml-description">Train a logistic classifier on 72 synthetic points. Watch its boundary change, then try a dataset a straight line cannot separate.</p>
      <div class="ml-controls">
        <label class="ml-dataset-label" for="mlDataset">DATASET<select id="mlDataset"><option value="linear">Two clusters</option><option value="rings">Concentric rings</option></select></label>
        <div class="ml-actions"><button type="button" id="mlTrain" class="ml-primary">TRAIN</button><button type="button" id="mlPause" disabled>PAUSE</button><button type="button" id="mlReset">RESET</button></div>
      </div>
      <div class="ml-workbench">
        <section class="ml-plot-panel" aria-labelledby="mlPlotHeading">
          <div class="ml-panel-label"><h3 id="mlPlotHeading">DECISION FIELD</h3><span>p(CLASS B) / 0 → 1</span></div>
          <canvas id="mlDecision" role="img" aria-label="Toy points and the classifier decision boundary. Cyan circles are class A; yellow diamonds are class B."></canvas>
          <div class="ml-legend"><span><i class="ml-class-a"></i> Class A</span><span><i class="ml-class-b"></i> Class B</span><span class="ml-boundary-key">— 0.5 boundary</span></div>
          <p class="ml-probe" id="mlProbe">Move over the field to inspect a prediction.</p>
        </section>
        <aside class="ml-model-panel" aria-labelledby="mlModelHeading">
          <div class="ml-panel-label"><h3 id="mlModelHeading">FEATURE PATH</h3><span>LOGISTIC MODEL</span></div>
          <canvas id="mlNetwork" role="img" aria-label="Input features connect through learned weights to a sum and sigmoid output."></canvas>
          <dl class="ml-metrics"><div><dt>TRAINING LOSS</dt><dd id="mlLoss" aria-live="off">0.0000</dd></div><div><dt>ITERATION</dt><dd id="mlIteration" aria-live="off">0</dd></div></dl>
          <p class="ml-equation" id="mlEquation">p(B) = sigmoid(wₓx + wᵧy + b)</p>
          <div class="ml-feature-discovery"><span>LOOK BEYOND THE LINE</span><p id="mlFeatureHint">Try the rings preset. Can a straight line separate the two classes?</p><button type="button" id="mlLift" aria-pressed="false">REVEAL RADIAL FEATURE</button></div>
        </aside>
      </div>
      <footer class="ml-lab-foot"><p id="mlLabStatus" role="status" aria-live="polite">Ready. Select Train to update the model.</p><small>Full-batch gradient descent · fixed toy data · no project performance claims</small></footer>
    </div>`;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const plot = $('#mlDecision'), network = $('#mlNetwork'), train = $('#mlTrain'), pause = $('#mlPause');
  const dataset = $('#mlDataset'), lift = $('#mlLift'), status = $('#mlLabStatus');

  function fit(canvas, limit = 2) {
    const rect = canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, limit);
    if (!rect.width || !rect.height) return null;
    const width = Math.round(rect.width * ratio), height = Math.round(rect.height * ratio);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { context, width: rect.width, height: rect.height };
  }

  function drawMesh(now) {
    const view = fit(mesh, 1.5); if (!view) return;
    if (!meshHeld && !reduced) heroTime = now;
    const { context: c, width, height } = view;
    c.clearRect(0, 0, width, height);
    const layers = Array.from({ length: 6 }, (_, column) => Array.from({ length: 4 }, (_, row) => ({
      x: width * (0.08 + column * 0.17) + Math.sin(heroTime / 4300 + row + column) * 6,
      y: height * (0.2 + row * 0.18) + Math.cos(heroTime / 3900 + row * 2 + column) * 8
    })));
    for (let column = 0; column < layers.length - 1; column++) {
      for (let row = 0; row < 4; row++) for (let target = 0; target < 4; target++) {
        if (Math.abs(row - target) > 1) continue;
        const a = layers[column][row], b = layers[column + 1][target];
        const distance = Math.min(Math.hypot(pointer.x - a.x, pointer.y - a.y), Math.hypot(pointer.x - b.x, pointer.y - b.y));
        const reaction = Math.max(0, 1 - distance / 180);
        c.strokeStyle = `rgba(164,218,137,${0.045 + reaction * 0.2})`; c.lineWidth = 0.65 + reaction * 0.5;
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
        const t = (heroTime / 5900 + column * 0.17 + row * 0.11 + target * 0.13) % 1;
        c.fillStyle = `rgba(0,245,223,${0.13 + reaction * 0.4})`; c.beginPath();
        c.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 1.3 + reaction, 0, Math.PI * 2); c.fill();
      }
    }
    for (const layer of layers) for (const point of layer) {
      const reaction = Math.max(0, 1 - Math.hypot(pointer.x - point.x, pointer.y - point.y) / 150);
      c.fillStyle = `rgba(201,239,161,${0.19 + reaction * 0.5})`; c.beginPath();
      c.arc(point.x, point.y, 1.6 + reaction * 1.8, 0, Math.PI * 2); c.fill();
    }
  }

  function drawDecision() {
    const view = fit(plot); if (!view) return;
    const { context: c, width: w, height: h } = view;
    const pad = 19, width = w - pad * 2, height = h - pad * 2;
    const sx = x => pad + (x + 1.2) / 2.4 * width, sy = y => pad + (1.2 - y) / 2.4 * height;
    c.clearRect(0, 0, w, h); c.fillStyle = '#08100f'; c.fillRect(0, 0, w, h);
    const columns = 48, rows = 36;
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      const p = predict(model, { x: -1.2 + (column + 0.5) / columns * 2.4, y: 1.2 - (row + 0.5) / rows * 2.4 });
      c.fillStyle = `rgba(${Math.round(24 + 95 * p)},${Math.round(100 + 25 * p)},${Math.round(95 - 75 * p)},0.28)`;
      c.fillRect(pad + column / columns * width, pad + row / rows * height, width / columns + 1, height / rows + 1);
    }
    c.strokeStyle = 'rgba(177,208,170,.07)'; c.lineWidth = 1;
    for (let n = -1; n <= 1.01; n += 0.5) {
      c.beginPath(); c.moveTo(sx(n), pad); c.lineTo(sx(n), h - pad); c.stroke();
      c.beginPath(); c.moveTo(pad, sy(n)); c.lineTo(w - pad, sy(n)); c.stroke();
    }
    // A zero-logit contour is the actual p=0.5 boundary, including radial features.
    c.strokeStyle = 'rgba(234,241,215,.85)'; c.lineWidth = 1.2;
    const count = 42, delta = 2.4 / count;
    for (let row = 0; row < count; row++) for (let column = 0; column < count; column++) {
      const x = -1.2 + column * delta, y = -1.2 + row * delta;
      const corners = [{ x, y }, { x: x + delta, y }, { x: x + delta, y: y + delta }, { x, y: y + delta }];
      const crossings = [];
      for (let edge = 0; edge < 4; edge++) {
        const a = corners[edge], b = corners[(edge + 1) % 4], za = score(model, a), zb = score(model, b);
        if ((za < 0) === (zb < 0) || za === zb) continue;
        const t = za / (za - zb); crossings.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
      if (crossings.length === 2) { c.beginPath(); c.moveTo(sx(crossings[0].x), sy(crossings[0].y)); c.lineTo(sx(crossings[1].x), sy(crossings[1].y)); c.stroke(); }
    }
    for (const point of points) {
      const x = sx(point.x), y = sy(point.y), radius = w < 400 ? 3.6 : 4.5;
      c.fillStyle = point.label ? '#eaf28d' : '#6fe2d5'; c.strokeStyle = '#07100d'; c.lineWidth = 1.4; c.beginPath();
      if (point.label) { c.moveTo(x, y - radius - 1); c.lineTo(x + radius + 1, y); c.lineTo(x, y + radius + 1); c.lineTo(x - radius - 1, y); c.closePath(); }
      else c.arc(x, y, radius, 0, Math.PI * 2);
      c.fill(); c.stroke();
    }
    c.strokeStyle = 'rgba(255,255,242,.72)'; c.lineWidth = 1; c.setLineDash([3, 4]);
    c.beginPath(); c.moveTo(sx(probe.x), pad); c.lineTo(sx(probe.x), h - pad); c.moveTo(pad, sy(probe.y)); c.lineTo(w - pad, sy(probe.y)); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#f5f7e9'; c.font = '9px monospace'; c.fillText('x', w - 12, sy(0) - 5); c.fillText('y', sx(0) + 5, 12);
  }

  function drawNetwork(now) {
    const view = fit(network); if (!view) return;
    const { context: c, width: w, height: h } = view;
    c.clearRect(0, 0, w, h);
    const values = features(probe, model.lifted), labels = model.lifted ? ['x', 'y', 'r²', 'bias'] : ['x', 'y', 'bias'];
    const inputs = values.map((value, i) => ({ x: 34, y: 29 + i * (h - 57) / (values.length - 1), value, label: labels[i] }));
    const sum = { x: w * 0.55, y: h * 0.5 }, output = { x: w - 34, y: h * 0.5 };
    for (let i = 0; i < inputs.length; i++) {
      const node = inputs[i], weight = model.weights[i], strength = Math.min(1, Math.abs(weight) / 5);
      c.strokeStyle = weight >= 0 ? `rgba(126,220,196,${0.23 + strength * 0.57})` : `rgba(232,191,116,${0.23 + strength * 0.57})`;
      c.lineWidth = 0.8 + strength * 2.8; c.beginPath(); c.moveTo(node.x + 12, node.y); c.lineTo(sum.x - 16, sum.y); c.stroke();
      if (running && !reduced) {
        const t = (now / 1600 + i * 0.21) % 1; c.fillStyle = '#dbeab1'; c.beginPath();
        c.arc(node.x + 12 + (sum.x - 16 - node.x - 12) * t, node.y + (sum.y - node.y) * t, 2, 0, Math.PI * 2); c.fill();
      }
    }
    c.strokeStyle = '#a6c99a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(sum.x + 17, sum.y); c.lineTo(output.x - 15, output.y); c.stroke();
    const node = (x, y, label, radius = 13) => { c.fillStyle = '#101c16'; c.strokeStyle = 'rgba(188,220,157,.6)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); c.fill(); c.stroke(); c.fillStyle = '#deead1'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '11px monospace'; c.fillText(label, x, y); };
    for (const input of inputs) node(input.x, input.y, input.label);
    node(sum.x, sum.y, 'Σ', 17); node(output.x, output.y, 'σ', 15);
    c.fillStyle = '#9aa98e'; c.font = '9px monospace'; c.textAlign = 'center'; c.fillText(predict(model, probe).toFixed(2), output.x, output.y + 30);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  }

  function drawLab(now) {
    drawDecision(); drawNetwork(now);
    $('#mlLoss').textContent = loss(model, points).toFixed(4); $('#mlIteration').textContent = String(model.iteration);
    $('#mlProbe').textContent = `Probe x ${probe.x.toFixed(2)}, y ${probe.y.toFixed(2)} · p(Class B) ${predict(model, probe).toFixed(3)}`;
  }

  const wantsAnimation = () => !document.hidden && !reduced && (dialog.open ? running : heroVisible && !meshHeld);
  function tick(now) {
    frame = 0;
    if (document.hidden) return;
    if (dirty || now - lastFrame >= 33) {
      if (dialog.open) {
        if (running && !reduced) {
          step(model, points, 4);
          if (model.iteration >= 2400) { running = false; syncControls(); status.textContent = 'Iteration limit reached. Reset or try another feature space.'; }
        }
        drawLab(now);
      } else if (heroVisible) drawMesh(now);
      dirty = false; lastFrame = now;
    }
    if (wantsAnimation()) frame = requestAnimationFrame(tick);
  }
  function requestDraw() {
    dirty = true;
    if (!frame && !document.hidden && (dialog.open || heroVisible)) frame = requestAnimationFrame(tick);
  }
  function stopFrame() { if (frame) cancelAnimationFrame(frame); frame = 0; }
  function syncControls() {
    train.textContent = reduced ? 'TRAIN 25 STEPS' : 'TRAIN'; train.disabled = running;
    pause.disabled = !running;
    holdButton.disabled = reduced; holdButton.textContent = reduced ? 'SIGNAL: STILL' : meshHeld ? 'RESUME SIGNAL' : 'HOLD SIGNAL';
    holdButton.setAttribute('aria-pressed', String(meshHeld || reduced));
    lift.setAttribute('aria-pressed', String(model.lifted)); lift.textContent = model.lifted ? 'RADIAL FEATURE: ON' : 'REVEAL RADIAL FEATURE';
    dialog.classList.toggle('ml-feature-lifted', model.lifted);
    $('#mlEquation').textContent = model.lifted ? 'p(B) = sigmoid(wₓx + wᵧy + wᵣr² + b)' : 'p(B) = sigmoid(wₓx + wᵧy + b)';
    $('#mlFeatureHint').textContent = model.lifted ? 'Feature lift revealed: r² = x² + y². The same classifier can now learn a curved boundary.' : 'Try the rings preset. Can a straight line separate the two classes?';
  }
  function reset(lifted = model.lifted) {
    running = false; model = createModel(lifted); syncControls(); requestDraw();
    status.textContent = reduced ? 'Reset. Reduced motion is enabled; Train updates 25 steps at a time.' : 'Reset. Select Train to update the model.';
  }
  function openLab() {
    if (dialog.open) return;
    returnFocus = document.activeElement; running = false; syncControls(); dialog.showModal();
    $('#mlLabTitle').focus(); requestDraw();
    status.textContent = reduced ? 'Reduced motion: use Train for 25 manual updates at a time.' : 'Toy simulation ready. Select Train, or inspect the field with your pointer.';
  }
  global.openNeuralLab = openLab;
  document.getElementById('neuralLabButton')?.addEventListener('click', openLab);
  openButton.addEventListener('click', openLab);
  holdButton.addEventListener('click', () => { meshHeld = !meshHeld; syncControls(); if (meshHeld) stopFrame(); requestDraw(); });
  $('.ml-close').addEventListener('click', () => dialog.close());
  // Keep the site's global Escape handler from closing a dialog underneath this one.
  dialog.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    running = false; syncControls();
    const target = returnFocus?.isConnected && !returnFocus.closest('dialog:not([open])') ? returnFocus : openButton;
    target.focus(); requestDraw();
  });
  train.addEventListener('click', () => {
    if (reduced) { step(model, points, 25); status.textContent = `Updated to iteration ${model.iteration}. Training loss ${loss(model, points).toFixed(4)}.`; }
    else { running = true; status.textContent = 'Training on synthetic toy points. Pause at any time to inspect the boundary.'; }
    syncControls(); requestDraw();
  });
  pause.addEventListener('click', () => { running = false; syncControls(); status.textContent = `Paused at iteration ${model.iteration}.`; stopFrame(); requestDraw(); });
  $('#mlReset').addEventListener('click', () => reset());
  dataset.addEventListener('change', () => { points = makeDataset(dataset.value); reset(false); status.textContent = dataset.value === 'rings' ? 'Rings selected. A linear boundary underfits this pattern. Try training, then reveal the radial feature.' : 'Two clusters selected. A linear boundary can separate this toy dataset.'; });
  lift.addEventListener('click', () => { reset(!model.lifted); status.textContent = model.lifted ? 'Radial feature revealed. Select Train to learn in the lifted feature space.' : 'Returned to x and y only. Select Train to compare the linear boundary.'; });
  plot.addEventListener('pointermove', event => {
    const rect = plot.getBoundingClientRect();
    probe = { x: Math.max(-1.2, Math.min(1.2, (event.clientX - rect.left - 19) / (rect.width - 38) * 2.4 - 1.2)), y: Math.max(-1.2, Math.min(1.2, 1.2 - (event.clientY - rect.top - 19) / (rect.height - 38) * 2.4)) };
    requestDraw();
  });
  hero.addEventListener('pointermove', event => { const rect = hero.getBoundingClientRect(); pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; requestDraw(); }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.x = pointer.y = -1000; requestDraw(); });
  if ('IntersectionObserver' in global) new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
    if (!heroVisible && !dialog.open) stopFrame(); else requestDraw();
  }, { threshold: 0.01 }).observe(hero);
  else {
    const visibility = () => { const rect = hero.getBoundingClientRect(); heroVisible = rect.bottom > 0 && rect.top < innerHeight; if (!heroVisible && !dialog.open) stopFrame(); else requestDraw(); };
    addEventListener('scroll', visibility, { passive: true }); visibility();
  }
  if ('ResizeObserver' in global) { const observer = new ResizeObserver(requestDraw); observer.observe(hero); observer.observe(plot); observer.observe(network); }
  addEventListener('resize', requestDraw, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (running) status.textContent = 'Training paused while this tab is hidden.'; running = false; syncControls(); stopFrame(); }
    else requestDraw();
  });
  motion.addEventListener?.('change', event => { reduced = event.matches; running = false; syncControls(); stopFrame(); requestDraw(); });
  addEventListener('pagehide', stopFrame);
  syncControls();
})(typeof window === 'object' ? window : globalThis);
