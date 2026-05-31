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
