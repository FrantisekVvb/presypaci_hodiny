const FRAMES = {
  FALL1_START: 0,
  FALL1_END: 236,
  FLIP_START: 238,
  FLIP_END: 274,
  FALL2_START: 274,
  FALL2_END: 509,
};

const FLIP_SPEED = 3.375;

const SAND_ORIGINAL = {
  primary: [1, 0.506, 0.345, 1],
  accent: [0.941, 0.231, 0.314, 1],
};

const SAND_PALETTES = {
  xlarge: {
    primary: [0.29, 0.56, 0.86, 1],
    accent: [0.18, 0.42, 0.74, 1],
  },
  small: {
    primary: [0.58, 0.76, 0.28, 1],
    accent: [0.42, 0.62, 0.16, 1],
  },
};

function colorsMatch(a, b) {
  return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 0.001);
}

function replaceSandColorsInLayer(layer, primary, accent) {
  if (!layer.nm || !/^sand/i.test(layer.nm)) return;

  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if ((obj.ty === 'fl' || obj.ty === 'st') && obj.c?.a === 0 && Array.isArray(obj.c.k)) {
      if (colorsMatch(obj.c.k, SAND_ORIGINAL.primary)) obj.c.k = [...primary];
      else if (colorsMatch(obj.c.k, SAND_ORIGINAL.accent)) obj.c.k = [...accent];
    }
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) value.forEach(walk);
      else walk(value);
    }
  }

  walk(layer);
}

function cloneWithSandPalette(animationData, palette) {
  const data = structuredClone(animationData);
  for (const asset of data.assets) {
    for (const layer of asset.layers) {
      replaceSandColorsInLayer(layer, palette.primary, palette.accent);
    }
  }
  return data;
}

function createHourglass(unitEl, { fallSpeed, flipSpeed, sandPalette }) {
  const lottieEl = unitEl.querySelector('.lottie');
  const flipBtn = unitEl.querySelector('.flip-btn');
  let mode = 'idle';
  let playSecondFall = false;
  let anim = null;

  function showButton() {
    flipBtn.classList.add('visible');
    flipBtn.disabled = false;
  }

  function hideButton() {
    flipBtn.classList.remove('visible');
    flipBtn.disabled = true;
  }

  function playSegment(from, to, speed = 1) {
    return new Promise((resolve) => {
      const onFrame = () => {
        if (anim.currentFrame >= to - 0.5) {
          anim.removeEventListener('enterFrame', onFrame);
          anim.pause();
          anim.setSpeed(1);
          anim.goToAndStop(to, true);
          resolve();
        }
      };
      anim.setSpeed(speed);
      anim.goToAndPlay(from, true);
      anim.addEventListener('enterFrame', onFrame);
    });
  }

  async function runFall() {
    mode = 'animating';
    hideButton();
    const fallFrames = playSecondFall
      ? [FRAMES.FALL2_START, FRAMES.FALL2_END]
      : [FRAMES.FALL1_START, FRAMES.FALL1_END];
    await playSegment(fallFrames[0], fallFrames[1], fallSpeed);
    mode = 'idle';
    showButton();
  }

  async function onFlip() {
    if (mode === 'animating') return;

    mode = 'animating';
    hideButton();

    await playSegment(FRAMES.FLIP_START, FRAMES.FLIP_END, flipSpeed);
    playSecondFall = !playSecondFall;
    await runFall();
  }

  function init(animationData) {
    const data = sandPalette ? cloneWithSandPalette(animationData, sandPalette) : animationData;

    anim = lottie.loadAnimation({
      container: lottieEl,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: data,
    });

    flipBtn.addEventListener('click', onFlip);

    anim.addEventListener('DOMLoaded', () => {
      anim.goToAndStop(FRAMES.FALL1_END, true);
      showButton();
    });
  }

  return { init };
}

function formatStopwatchTime(ms) {
  const totalCentiseconds = Math.floor(ms / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const pad2 = (n) => String(n).padStart(2, '0');
  return `${pad2(minutes)} : ${pad2(seconds)},${pad2(centiseconds)}`;
}

function createStopwatch(containerEl) {
  const timeMainEl = containerEl.querySelector('#time-main');
  const lapsListEl = containerEl.querySelector('#stopwatch-laps');
  const btnStart = containerEl.querySelector('#btn-start');
  const btnStartLabel = containerEl.querySelector('#btn-start-label');
  const btnStopLabel = containerEl.querySelector('#btn-stop-label');
  const btnLap = containerEl.querySelector('#btn-lap');
  const btnReset = containerEl.querySelector('#btn-reset');

  let running = false;
  let elapsedMs = 0;
  let startedAt = 0;
  let rafId = null;
  const laps = [];

  function currentElapsed() {
    return running ? elapsedMs + (performance.now() - startedAt) : elapsedMs;
  }

  function renderLaps() {
    lapsListEl.replaceChildren();

    laps.slice().reverse().forEach((lap) => {
      const row = document.createElement('div');
      row.className = 'stopwatch-lap';
      row.textContent = lap;
      lapsListEl.appendChild(row);
    });
  }

  function renderTimes() {
    timeMainEl.textContent = formatStopwatchTime(currentElapsed());
  }

  function tick() {
    renderTimes();
    if (running) rafId = requestAnimationFrame(tick);
  }

  function updateStartButton() {
    btnStart.setAttribute('stroke', running ? '#CC0000' : '#66C904');
    btnStartLabel.setAttribute('visibility', running ? 'hidden' : 'visible');
    btnStopLabel.setAttribute('visibility', running ? 'visible' : 'hidden');
  }

  function setRunning(next) {
    if (running && !next) {
      elapsedMs += performance.now() - startedAt;
    }

    running = next;
    containerEl.classList.toggle('stopwatch--running', running);
    updateStartButton();

    if (running) {
      startedAt = performance.now();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafId);
      renderTimes();
    }
  }

  function onStart() {
    setRunning(!running);
  }

  function onLap() {
    if (!running) return;
    laps.push(formatStopwatchTime(currentElapsed()));
    renderLaps();
  }

  function onReset() {
    if (running) setRunning(false);
    elapsedMs = 0;
    laps.length = 0;
    renderLaps();
    renderTimes();
  }

  btnStart.addEventListener('click', onStart);
  btnLap.addEventListener('click', onLap);
  btnReset.addEventListener('click', onReset);
  renderTimes();
}

function initModeSwitch() {
  const hourglassStage = document.querySelector('.stage--hourglass');
  const stopwatchStage = document.querySelector('.stage--stopwatch');
  const buttons = document.querySelectorAll('.mode-switch__btn');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
      hourglassStage.classList.toggle('hidden', mode !== 'hourglass');
      stopwatchStage.classList.toggle('hidden', mode !== 'stopwatch');
    });
  });
}

function initStopwatch() {
  const container = document.getElementById('stopwatch');

  fetch('./assets/stopwatch.svg')
    .then((r) => {
      if (!r.ok) throw new Error('Soubor assets/stopwatch.svg nenalezen');
      return r.text();
    })
    .then((svg) => {
      container.innerHTML = `<div class="stopwatch-face">${svg}</div><div class="stopwatch-laps" id="stopwatch-laps"></div>`;
      createStopwatch(container);
    })
    .catch((e) => {
      console.error(e);
    });
}

initModeSwitch();
initStopwatch();

fetch('./assets/hourglass.json')
  .then((r) => {
    if (!r.ok) throw new Error('Soubor assets/hourglass.json nenalezen');
    return r.json();
  })
  .then((animationData) => {
    createHourglass(document.querySelector('.hourglass-unit--xlarge'), {
      fallSpeed: 0.5,
      flipSpeed: FLIP_SPEED,
      sandPalette: SAND_PALETTES.xlarge,
    }).init(animationData);

    createHourglass(document.querySelector('.hourglass-unit--large'), {
      fallSpeed: 1,
      flipSpeed: FLIP_SPEED,
    }).init(animationData);

    createHourglass(document.querySelector('.hourglass-unit--small'), {
      fallSpeed: 2,
      flipSpeed: FLIP_SPEED,
      sandPalette: SAND_PALETTES.small,
    }).init(animationData);
  })
  .catch((e) => {
    console.error(e);
  });
