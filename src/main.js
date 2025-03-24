const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// GUI elements
const guiPanel = document.getElementById('gui-panel');
const toggleGuiBtn = document.getElementById('toggle-gui');

// Parameter controls
const numParticlesInput = document.getElementById('num-particles');
const numParticlesValue = document.getElementById('num-particles-value');
const particleSizeInput = document.getElementById('particle-size');
const particleSizeValue = document.getElementById('particle-size-value');
const particleShapeSelect = document.getElementById('particle-shape');
const dampingInput = document.getElementById('damping');
const dampingValue = document.getElementById('damping-value');
const forceScaleInput = document.getElementById('force-scale');
const forceScaleValue = document.getElementById('force-scale-value');
const jitterScaleInput = document.getElementById('jitter-scale');
const jitterScaleValue = document.getElementById('jitter-scale-value');
const distanceScaleInput = document.getElementById('distance-scale');
const distanceScaleValue = document.getElementById('distance-scale-value');
const frictionInput = document.getElementById('friction');
const frictionValue = document.getElementById('friction-value');

// Text controls
const textInput = document.getElementById('text-input');
const fontSizeInput = document.getElementById('font-size');
const fontSizeValue = document.getElementById('font-size-value');
const textRepulsionInput = document.getElementById('text-repulsion');
const textRepulsionValue = document.getElementById('text-repulsion-value');
const textDraggableCheck = document.getElementById('text-draggable');

// Randomization controls
const randomizeBtn = document.getElementById('randomize-btn');
const sizeRandomCheck = document.getElementById('size-random');
const sizeMinInput = document.getElementById('size-min');
const sizeMaxInput = document.getElementById('size-max');
const dampingRandomCheck = document.getElementById('damping-random');
const dampingMinInput = document.getElementById('damping-min');
const dampingMaxInput = document.getElementById('damping-max');
const forceRandomCheck = document.getElementById('force-random');
const forceMinInput = document.getElementById('force-min');
const forceMaxInput = document.getElementById('force-max');
const jitterRandomCheck = document.getElementById('jitter-random');
const jitterMinInput = document.getElementById('jitter-min');
const jitterMaxInput = document.getElementById('jitter-max');

// Color controls
const bgColorInput = document.getElementById('bg-color');
const particleColorInput = document.getElementById('particle-color');
const colorModeSelect = document.getElementById('color-mode');
const colorPaletteContainer = document.getElementById('color-palette');
const addColorBtn = document.getElementById('add-color');

// Parameters
let numParticles = parseInt(numParticlesInput.value);
let particleSize = parseFloat(particleSizeInput.value);
let particleShape = particleShapeSelect.value;
let damping = parseFloat(dampingInput.value);
let friction = parseFloat(frictionInput.value);
let forceScale = parseFloat(forceScaleInput.value);
let jitterScale = parseFloat(jitterScaleInput.value);
let distanceScale = parseFloat(distanceScaleInput.value);
let textRepulsion = parseFloat(textRepulsionInput.value);
const pixelRatio = 3; // Pixel ratio élevé pour un rendu plus net

// Color parameters
let bgColor = '#ffffff';
let particleColor = '#000000';
let colorMode = 'uniform';
let colorPalette = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
let particleColors = []; // Will store color for each particle when using palette-random mode

// Randomization parameters
let useRandomSize = false;
let sizeMin = 1;
let sizeMax = 5;
let useRandomDamping = false;
let dampingMin = 0.8;
let dampingMax = 0.99;
let useRandomForce = false;
let forceMin = 0.01;
let forceMax = 0.1;
let useRandomJitter = false;
let jitterMin = 0;
let jitterMax = 0.5;

// Text parameters
let textX = null; // Position X du texte (sera initialisée au centre)
let textY = null; // Position Y du texte (sera initialisée au centre)
let isDraggingText = false; // Indique si le texte est en cours de déplacement
let dragOffsetX = 0; // Décalage X lors du début du déplacement
let dragOffsetY = 0; // Décalage Y lors du début du déplacement
let isTextDraggable = true; // Le texte peut-il être déplacé ?

// Create an offscreen canvas for the text mask
const textCanvas = document.createElement('canvas');
const textCtx = textCanvas.getContext('2d');
let textImageData = null;

// Resize and initialize canvas.
function resizeCanvas() {
  // Définit la taille d'affichage (pixels CSS)
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  
  // Définit la taille réelle du canvas en pixels, en tenant compte du pixel ratio
  canvas.width = window.innerWidth * pixelRatio;
  canvas.height = window.innerHeight * pixelRatio;
  
  // Applique le scaling à tout le dessin
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  
  // Resize the offscreen text canvas to match the main canvas in CSS pixels
  textCanvas.width = canvas.width / pixelRatio;
  textCanvas.height = canvas.height / pixelRatio;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Initialize color palette UI
function initColorPalette() {
  // Clear current palette
  while (colorPaletteContainer.firstChild) {
    if (colorPaletteContainer.firstChild === addColorBtn) {
      break;
    }
    colorPaletteContainer.removeChild(colorPaletteContainer.firstChild);
  }
  
  // Create a hidden color picker for palette management
  let hiddenColorPicker = document.getElementById('hidden-color-picker');
  if (!hiddenColorPicker) {
    hiddenColorPicker = document.createElement('input');
    hiddenColorPicker.type = 'color';
    hiddenColorPicker.id = 'hidden-color-picker';
    hiddenColorPicker.style.position = 'absolute';
    hiddenColorPicker.style.visibility = 'hidden';
    document.body.appendChild(hiddenColorPicker);
  }
  
  // Add color swatches
  colorPalette.forEach((color, index) => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    
    // Delete button
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'delete-color';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      colorPalette.splice(index, 1);
      initColorPalette();
      if (colorMode === 'palette-random') {
        randomizeParticleColors();
      }
    });
    
    swatch.appendChild(deleteBtn);
    swatch.addEventListener('click', () => {
      // Utiliser le color picker caché pour changer la couleur
      hiddenColorPicker.value = color;
      
      // Fonction qui sera appelée quand l'utilisateur choisit une couleur
      const onColorChange = () => {
        colorPalette[index] = hiddenColorPicker.value;
        initColorPalette();
        if (colorMode === 'palette-random') {
          randomizeParticleColors();
        }
        hiddenColorPicker.removeEventListener('change', onColorChange);
      };
      
      hiddenColorPicker.addEventListener('change', onColorChange);
      hiddenColorPicker.click(); // Ouvrir le sélecteur de couleur
    });
    
    colorPaletteContainer.insertBefore(swatch, addColorBtn);
  });
}

// Using a Float32Array to store particles: [x, y, vx, vy, size, damping, forceScale, jitterScale] for each.
let particles = new Float32Array(numParticles * 8);

// Initialize particles with random positions and velocities.
function initParticles() {
  particles = new Float32Array(numParticles * 8);
  for (let i = 0; i < numParticles; i++) {
    const idx = i * 8;
    particles[idx]     = Math.random() * (canvas.width / pixelRatio);  // x
    particles[idx + 1] = Math.random() * (canvas.height / pixelRatio); // y
    particles[idx + 2] = Math.random() * 2 - 1;           // vx
    particles[idx + 3] = Math.random() * 2 - 1;           // vy
    particles[idx + 4] = particleSize;                    // size
    particles[idx + 5] = damping;                         // damping
    particles[idx + 6] = forceScale;                      // forceScale
    particles[idx + 7] = jitterScale;                     // jitterScale
  }
  
  // Initialize particle colors if using palette-random mode
  if (colorMode === 'palette-random') {
    randomizeParticleColors();
  }
}

// Function to assign random colors from palette to particles
function randomizeParticleColors() {
  particleColors = [];
  for (let i = 0; i < numParticles; i++) {
    const randomIndex = Math.floor(Math.random() * colorPalette.length);
    particleColors.push(colorPalette[randomIndex]);
  }
}

// Randomize particle parameters based on settings
function randomizeParticles() {
  for (let i = 0; i < numParticles; i++) {
    const idx = i * 8;
    // Keep existing position and velocity
    // particles[idx] through particles[idx + 3] remain unchanged
    
    // Randomize size if enabled
    if (useRandomSize) {
      particles[idx + 4] = sizeMin + Math.random() * (sizeMax - sizeMin);
    } else {
      particles[idx + 4] = particleSize;
    }
    
    // Randomize damping if enabled
    if (useRandomDamping) {
      particles[idx + 5] = dampingMin + Math.random() * (dampingMax - dampingMin);
    } else {
      particles[idx + 5] = damping;
    }
    
    // Randomize force scale if enabled
    if (useRandomForce) {
      particles[idx + 6] = forceMin + Math.random() * (forceMax - forceMin);
    } else {
      particles[idx + 6] = forceScale;
    }
    
    // Randomize jitter scale if enabled
    if (useRandomJitter) {
      particles[idx + 7] = jitterMin + Math.random() * (jitterMax - jitterMin);
    } else {
      particles[idx + 7] = jitterScale;
    }
  }
  
  // Randomize colors if using palette-random mode
  if (colorMode === 'palette-random') {
    randomizeParticleColors();
  }
}

initParticles();

// Update the text mask offscreen canvas using the text and font size from the GUI.
function updateTextMask() {
  const currentText = textInput.value;
  const currentFontSize = parseInt(fontSizeInput.value);
  
  // Initialize text position to left side if not set yet
  if (textX === null) {
    textX = 20; // Position à 20px du bord gauche au lieu du centre
    textY = textCanvas.height / 2;
  }
  
  // Clear the offscreen canvas
  textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
  // Set font and alignment
  textCtx.font = `${currentFontSize}px Inter`;
  textCtx.textAlign = 'left'; // Changé de 'center' à 'left'
  textCtx.textBaseline = 'middle';
  // Draw the text in black (the text is only used as a mask)
  textCtx.fillStyle = 'black';
  textCtx.fillText(currentText, textX, textY);
  // Get the image data from the offscreen canvas
  textImageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
}

function updateParticles() {
  // Compute dynamic minimum distance.
  const dynamicMinDist = Math.sqrt((canvas.width / pixelRatio * canvas.height / pixelRatio) / numParticles) * distanceScale;
  const dynamicMinDistSq = dynamicMinDist * dynamicMinDist;

  // Use dynamicMinDist as the cell size for our uniform grid.
  const cellSize = dynamicMinDist;
  const cols = Math.ceil(canvas.width / pixelRatio / cellSize);
  const rows = Math.ceil(canvas.height / pixelRatio / cellSize);
  const grid = new Array(cols * rows);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = [];
  }

  // Place each particle in the grid.
  for (let i = 0; i < numParticles; i++) {
    const index = i * 8;
    let x = particles[index];
    let y = particles[index + 1];

    // Clamp particle positions within the canvas.
    if (x < 0) x = 0;
    else if (x > canvas.width / pixelRatio) x = canvas.width / pixelRatio;
    if (y < 0) y = 0;
    else if (y > canvas.height / pixelRatio) y = canvas.height / pixelRatio;
    particles[index] = x;
    particles[index + 1] = y;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    const gridIndex = row * cols + col;
    grid[gridIndex].push(i);
  }

  // Update each particle using neighbors from the grid.
  for (let i = 0; i < numParticles; i++) {
    const index = i * 8;
    let x = particles[index];
    let y = particles[index + 1];
    let vx = particles[index + 2];
    let vy = particles[index + 3];
    // Get individual particle properties
    const particleDamping = particles[index + 5];
    const particleForceScale = particles[index + 6];
    const particleJitterScale = particles[index + 7];

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    let fx = 0, fy = 0;

    // Check neighboring cells (including the cell itself).
    for (let iCol = -1; iCol <= 1; iCol++) {
      const ncol = col + iCol;
      if (ncol < 0 || ncol >= cols) continue;
      for (let iRow = -1; iRow <= 1; iRow++) {
        const nrow = row + iRow;
        if (nrow < 0 || nrow >= rows) continue;
        const cellIndex = nrow * cols + ncol;
        const cell = grid[cellIndex];
        for (let j = 0, len = cell.length; j < len; j++) {
          const id = cell[j];
          if (id === i) continue;
          const jIndex = id * 8;
          const dx = x - particles[jIndex];
          const dy = y - particles[jIndex + 1];
          const distSq = dx * dx + dy * dy;
          if (distSq > 0 && distSq < dynamicMinDistSq) {
            const dist = Math.sqrt(distSq);
            const invDist = 1 / dist;
            const repulse = (dynamicMinDist - dist) * invDist;
            fx += dx * repulse;
            fy += dy * repulse;
          }
        }
      }
    }

    // Update velocity and position with individual particle properties
    vx += fx * particleForceScale;
    vy += fy * particleForceScale;
    
    // Add a small random jitter to help particles fill empty spaces.
    vx += (Math.random() - 0.5) * particleJitterScale;
    vy += (Math.random() - 0.5) * particleJitterScale;
    
    // Appliquer la friction (opposition au mouvement proportionnelle à la vitesse)
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > 0) {
      const frictionFactor = Math.max(0, 1 - friction);
      vx *= frictionFactor;
      vy *= frictionFactor;
    }
    
    // Check if particle is on the invisible text mask and add repulsion if so.
    if (textImageData) {
      const tx = Math.floor(x);
      const ty = Math.floor(y);
      if (tx >= 0 && tx < textCanvas.width && ty >= 0 && ty < textCanvas.height) {
        const idxText = (ty * textCanvas.width + tx) * 4;
        const alpha = textImageData.data[idxText + 3];
        if (alpha > 128) { // if the particle is over drawn text
          // Utilisez la position actuelle du texte plutôt que le centre
          const dxText = x - textX;
          const dyText = y - textY;
          let distText = Math.sqrt(dxText * dxText + dyText * dyText);
          if (distText === 0) distText = 0.001;
          vx += (dxText / distText) * textRepulsion;
          vy += (dyText / distText) * textRepulsion;
        }
      }
    }
    
    vx *= particleDamping;
    vy *= particleDamping;
    x += vx;
    y += vy;

    // Bounce off the walls.
    if (x < 0) {
      x = 0;
      vx = -vx;
    } else if (x > canvas.width / pixelRatio) {
      x = canvas.width / pixelRatio;
      vx = -vx;
    }
    if (y < 0) {
      y = 0;
      vy = -vy;
    } else if (y > canvas.height / pixelRatio) {
      y = canvas.height / pixelRatio;
      vy = -vy;
    }

    particles[index]     = x;
    particles[index + 1] = y;
    particles[index + 2] = vx;
    particles[index + 3] = vy;
  }
}

function drawParticles() {
  // Set background color
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
  
  // Fonctions utilitaires pour la conversion et l'interpolation des couleurs
  function hexToRgb(hex) {
    // Supprimer le # si présent
    hex = hex.replace(/^#/, '');
    
    // Convertir en RGB
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    
    return [r, g, b];
  }
  
  function interpolateColors(normalizedValue) {
    if (colorPalette.length === 0) return particleColor;
    if (colorPalette.length === 1) return colorPalette[0];
    
    // Déterminer les deux couleurs à interpoler
    const segmentSize = 1 / (colorPalette.length - 1);
    const index = Math.min(Math.floor(normalizedValue / segmentSize), colorPalette.length - 2);
    const localValue = (normalizedValue - index * segmentSize) / segmentSize;
    
    const color1 = hexToRgb(colorPalette[index]);
    const color2 = hexToRgb(colorPalette[index + 1]);
    
    // Interpoler les composantes RGB
    const r = Math.round(color1[0] + localValue * (color2[0] - color1[0]));
    const g = Math.round(color1[1] + localValue * (color2[1] - color1[1]));
    const b = Math.round(color1[2] + localValue * (color2[2] - color1[2]));
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Helper function to get color based on particle velocity
  function getColorByVelocity(vx, vy) {
    if (colorPalette.length === 0) return particleColor;
    
    const speed = Math.sqrt(vx * vx + vy * vy);
    const normalizedSpeed = Math.min(1, speed / 2); // Normaliser à 0-1, en supposant une vitesse max de 2
    
    // Interpoler les couleurs de la palette
    return interpolateColors(normalizedSpeed);
  }
  
  if (particleShape === 'circle') {
    // Draw particles as circles with individual sizes and colors.
    for (let i = 0; i < numParticles; i++) {
      const idx = i * 8;
      const x = particles[idx];
      const y = particles[idx + 1];
      const vx = particles[idx + 2];
      const vy = particles[idx + 3];
      const size = particles[idx + 4];
      
      // Determine color based on selected color mode
      switch (colorMode) {
        case 'uniform':
          ctx.fillStyle = particleColor;
          break;
        case 'palette-random':
          ctx.fillStyle = particleColors[i];
          break;
        case 'velocity':
          ctx.fillStyle = getColorByVelocity(vx, vy);
          break;
        default:
          ctx.fillStyle = particleColor;
      }
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Draw particles as rectangles with individual sizes and colors
    for (let i = 0; i < numParticles; i++) {
      const idx = i * 8;
      const x = particles[idx];
      const y = particles[idx + 1];
      const vx = particles[idx + 2];
      const vy = particles[idx + 3];
      const size = particles[idx + 4];
      
      // Determine color based on selected color mode
      switch (colorMode) {
        case 'uniform':
          ctx.fillStyle = particleColor;
          break;
        case 'palette-random':
          ctx.fillStyle = particleColors[i];
          break;
        case 'velocity':
          ctx.fillStyle = getColorByVelocity(vx, vy);
          break;
        default:
          ctx.fillStyle = particleColor;
      }
      
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
  }
}

function animate() {
  // Update the text mask each frame so that it reflects any changes in the text or font size.
  updateTextMask();
  updateParticles();
  drawParticles();
  requestAnimationFrame(animate);
}

// GUI event listeners
toggleGuiBtn.addEventListener('click', () => {
  guiPanel.classList.toggle('hidden');
});

numParticlesInput.addEventListener('input', () => {
  numParticles = parseInt(numParticlesInput.value);
  numParticlesValue.textContent = numParticles;
  initParticles();
});

particleSizeInput.addEventListener('input', () => {
  particleSize = parseFloat(particleSizeInput.value);
  particleSizeValue.textContent = particleSize;
  
  // Update all particles if random size is not enabled
  if (!useRandomSize) {
    for (let i = 0; i < numParticles; i++) {
      particles[i * 8 + 4] = particleSize;
    }
  }
});

particleShapeSelect.addEventListener('change', () => {
  particleShape = particleShapeSelect.value;
});

dampingInput.addEventListener('input', () => {
  damping = parseFloat(dampingInput.value);
  dampingValue.textContent = damping;
  
  // Update all particles if random damping is not enabled
  if (!useRandomDamping) {
    for (let i = 0; i < numParticles; i++) {
      particles[i * 8 + 5] = damping;
    }
  }
});

forceScaleInput.addEventListener('input', () => {
  forceScale = parseFloat(forceScaleInput.value);
  forceScaleValue.textContent = forceScale;
  
  // Update all particles if random force is not enabled
  if (!useRandomForce) {
    for (let i = 0; i < numParticles; i++) {
      particles[i * 8 + 6] = forceScale;
    }
  }
});

jitterScaleInput.addEventListener('input', () => {
  jitterScale = parseFloat(jitterScaleInput.value);
  jitterScaleValue.textContent = jitterScale;
  
  // Update all particles if random jitter is not enabled
  if (!useRandomJitter) {
    for (let i = 0; i < numParticles; i++) {
      particles[i * 8 + 7] = jitterScale;
    }
  }
});

frictionInput.addEventListener('input', () => {
  friction = parseFloat(frictionInput.value);
  frictionValue.textContent = friction;
});

// Randomization event listeners
randomizeBtn.addEventListener('click', () => {
  randomizeParticles();
});

sizeRandomCheck.addEventListener('change', () => {
  useRandomSize = sizeRandomCheck.checked;
  sizeMinInput.disabled = !useRandomSize;
  sizeMaxInput.disabled = !useRandomSize;
  if (useRandomSize) {
    sizeMin = parseFloat(sizeMinInput.value);
    sizeMax = parseFloat(sizeMaxInput.value);
    randomizeParticles();
  } else {
    // Reset all particles to the global size
    for (let i = 0; i < numParticles; i++) {
      particles[i * 8 + 4] = particleSize;
    }
  }
});

dampingRandomCheck.addEventListener('change', () => {
  useRandomDamping = dampingRandomCheck.checked;
  dampingMinInput.disabled = !useRandomDamping;
  dampingMaxInput.disabled = !useRandomDamping;
  if (useRandomDamping) {
    dampingMin = parseFloat(dampingMinInput.value);
    dampingMax = parseFloat(dampingMaxInput.value);
    randomizeParticles();
  } else {
    // Reset all particles to the global damping
    for (let i = 0; i < numParticles; i++) {
      particles[i * 8 + 5] = damping;
    }
  }
});

forceRandomCheck.addEventListener('change', () => {
  useRandomForce = forceRandomCheck.checked;
  forceMinInput.disabled = !useRandomForce;
  forceMaxInput.disabled = !useRandomForce;
  if (useRandomForce) {
    forceMin = parseFloat(forceMinInput.value);
    forceMax = parseFloat(forceMaxInput.value);
    randomizeParticles();
  } else {
    // Reset all particles to the global force scale
    for (let i = 0; i < numParticles; i++) {
      particles[i * 8 + 6] = forceScale;
    }
  }
});

jitterRandomCheck.addEventListener('change', () => {
  useRandomJitter = jitterRandomCheck.checked;
  jitterMinInput.disabled = !useRandomJitter;
  jitterMaxInput.disabled = !useRandomJitter;
  if (useRandomJitter) {
    jitterMin = parseFloat(jitterMinInput.value);
    jitterMax = parseFloat(jitterMaxInput.value);
    randomizeParticles();
  } else {
    // Reset all particles to the global jitter scale
    for (let i = 0; i < numParticles; i++) {
      particles[i * 8 + 7] = jitterScale;
    }
  }
});

// Update min/max values when they change
sizeMinInput.addEventListener('input', () => {
  sizeMin = parseFloat(sizeMinInput.value);
  if (useRandomSize) randomizeParticles();
});

sizeMaxInput.addEventListener('input', () => {
  sizeMax = parseFloat(sizeMaxInput.value);
  if (useRandomSize) randomizeParticles();
});

dampingMinInput.addEventListener('input', () => {
  dampingMin = parseFloat(dampingMinInput.value);
  if (useRandomDamping) randomizeParticles();
});

dampingMaxInput.addEventListener('input', () => {
  dampingMax = parseFloat(dampingMaxInput.value);
  if (useRandomDamping) randomizeParticles();
});

forceMinInput.addEventListener('input', () => {
  forceMin = parseFloat(forceMinInput.value);
  if (useRandomForce) randomizeParticles();
});

forceMaxInput.addEventListener('input', () => {
  forceMax = parseFloat(forceMaxInput.value);
  if (useRandomForce) randomizeParticles();
});

jitterMinInput.addEventListener('input', () => {
  jitterMin = parseFloat(jitterMinInput.value);
  if (useRandomJitter) randomizeParticles();
});

jitterMaxInput.addEventListener('input', () => {
  jitterMax = parseFloat(jitterMaxInput.value);
  if (useRandomJitter) randomizeParticles();
});

// Ajout d'un écouteur d'événement pour le contrôle de force de répulsion du texte
textRepulsionInput.addEventListener('input', () => {
  textRepulsion = parseFloat(textRepulsionInput.value);
  textRepulsionValue.textContent = textRepulsion;
});

// Ajout d'un écouteur d'événement pour le nouveau contrôle de distance
distanceScaleInput.addEventListener('input', () => {
  distanceScale = parseFloat(distanceScaleInput.value);
  distanceScaleValue.textContent = distanceScale;
});

// Add color event listeners
bgColorInput.addEventListener('input', () => {
  bgColor = bgColorInput.value;
});

particleColorInput.addEventListener('input', () => {
  particleColor = particleColorInput.value;
});

colorModeSelect.addEventListener('change', () => {
  colorMode = colorModeSelect.value;
  if (colorMode === 'palette-random') {
    randomizeParticleColors();
  }
});

addColorBtn.addEventListener('click', () => {
  // Utiliser un sélecteur de couleur pour ajouter une nouvelle couleur
  let hiddenColorPicker = document.getElementById('hidden-color-picker');
  if (!hiddenColorPicker) {
    hiddenColorPicker = document.createElement('input');
    hiddenColorPicker.type = 'color';
    hiddenColorPicker.id = 'hidden-color-picker';
    hiddenColorPicker.style.position = 'absolute';
    hiddenColorPicker.style.visibility = 'hidden';
    document.body.appendChild(hiddenColorPicker);
  }
  
  // Générer une couleur aléatoire comme valeur initiale
  const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
  hiddenColorPicker.value = randomColor;
  
  // Fonction qui sera appelée quand l'utilisateur choisit une couleur
  const onColorChange = () => {
    const newColor = hiddenColorPicker.value;
    colorPalette.push(newColor);
    initColorPalette();
    if (colorMode === 'palette-random') {
      randomizeParticleColors();
    }
    hiddenColorPicker.removeEventListener('change', onColorChange);
  };
  
  hiddenColorPicker.addEventListener('change', onColorChange);
  hiddenColorPicker.click(); // Ouvrir le sélecteur de couleur
});

// Fonction pour déterminer si un point est sur le texte
function isPointOnText(x, y) {
  if (!textImageData) return false;
  
  // Convertir les coordonnées de l'événement pour correspondre à la taille du canvas de texte
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  
  if (tx >= 0 && tx < textCanvas.width && ty >= 0 && ty < textCanvas.height) {
    const idx = (ty * textCanvas.width + tx) * 4;
    return textImageData.data[idx + 3] > 128; // Alpha > 128 signifie que le point est sur le texte
  }
  return false;
}

// Gestionnaires d'événements de souris pour le déplacement du texte
canvas.addEventListener('mousedown', (e) => {
  if (!isTextDraggable || !textInput.value.trim()) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / (rect.width / canvas.width * pixelRatio);
  const y = (e.clientY - rect.top) / (rect.height / canvas.height * pixelRatio);
  
  if (isPointOnText(x, y)) {
    isDraggingText = true;
    dragOffsetX = textX - x;
    dragOffsetY = textY - y;
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / (rect.width / canvas.width * pixelRatio);
  const y = (e.clientY - rect.top) / (rect.height / canvas.height * pixelRatio);
  
  // Changer le curseur si on survole le texte
  if (isTextDraggable && textInput.value.trim() && isPointOnText(x, y)) {
    canvas.style.cursor = isDraggingText ? 'grabbing' : 'grab';
  } else {
    canvas.style.cursor = 'default';
  }
  
  if (isDraggingText) {
    textX = x + dragOffsetX;
    textY = y + dragOffsetY;
  }
});

canvas.addEventListener('mouseup', () => {
  if (isDraggingText) {
    isDraggingText = false;
    canvas.style.cursor = 'grab';
  }
});

canvas.addEventListener('mouseleave', () => {
  isDraggingText = false;
  canvas.style.cursor = 'default';
});

// Ajout d'un écouteur d'événement pour activer/désactiver le déplacement du texte
textDraggableCheck.addEventListener('change', () => {
  isTextDraggable = textDraggableCheck.checked;
});

// Initialize the color palette UI
initColorPalette();

animate();
