const canvas = document.getElementById('chemCanvas');
const ctx = canvas.getContext('2d');

const atomCountEl = document.getElementById('atomCount');
const bondCountEl = document.getElementById('bondCount');
const moleculeTypeEl = document.getElementById('moleculeType');
const toolLabelEl = document.getElementById('toolLabel');
const moleculeNameInput = document.getElementById('moleculeName');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');

const tools = document.querySelectorAll('.tool-btn');

const state = {
  tool: 'atom',
  atoms: [],
  bonds: [],
  selectedAtomId: null,
  pendingAtomId: null,
  dragAtomId: null,
  atomIdCounter: 1,
  bondIdCounter: 1,
};

function getMousePos(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function atomAtPosition(x, y, threshold = 18) {
  for (let i = state.atoms.length - 1; i >= 0; i--) {
    const atom = state.atoms[i];
    const dx = atom.x - x;
    const dy = atom.y - y;
    if (Math.hypot(dx, dy) <= threshold) return atom;
  }
  return null;
}

function bondBetween(aId, bId) {
  return state.bonds.find((bond) => {
    return (bond.a === aId && bond.b === bId) || (bond.a === bId && bond.b === aId);
  });
}

function addAtom(x, y, label = 'C', color = '#7dd3fc') {
  const atom = {
    id: state.atomIdCounter++,
    x,
    y,
    label,
    color,
  };
  state.atoms.push(atom);
  return atom;
}

function removeAtom(atomId) {
  state.atoms = state.atoms.filter((atom) => atom.id !== atomId);
  state.bonds = state.bonds.filter((bond) => bond.a !== atomId && bond.b !== atomId);

  if (state.pendingAtomId === atomId) {
    state.pendingAtomId = null;
  }

  if (state.selectedAtomId === atomId) {
    state.selectedAtomId = null;
  }
}

function addBond(aId, bId, order = 1) {
  if (aId === bId) return;
  if (bondBetween(aId, bId)) return;

  state.bonds.push({
    id: state.bondIdCounter++,
    a: aId,
    b: bId,
    order,
  });
}

function clearStructure() {
  state.atoms = [];
  state.bonds = [];
  state.selectedAtomId = null;
  state.pendingAtomId = null;
  state.dragAtomId = null;
  updateStats();
  render();
}

function createHexagon(centerX, centerY, radius = 70) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  return points;
}

function loadSampleByName(name) {
  const normalized = name.trim().toLowerCase();

  if (!normalized) {
    clearStructure();
    return;
  }

  if (normalized.includes('benzene') || normalized.includes('phenyl') || normalized.includes('c6h6')) {
    loadBenzeneSample();
    return;
  }

  if (normalized.includes('ethanol') || normalized.includes('c2h5oh')) {
    loadEthanolSample();
    return;
  }

  if (normalized.includes('methane') || normalized.includes('ch4')) {
    loadMethaneSample();
    return;
  }

  if (normalized.includes('water') || normalized.includes('h2o')) {
    loadWaterSample();
    return;
  }

  clearStructure();
  const fallback = addAtom(420, 300, 'C');
  state.selectedAtomId = fallback.id;
  updateStats();
  render();
}

function loadBenzeneSample() {
  clearStructure();
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const pts = createHexagon(centerX, centerY, 88);

  const atomIds = pts.map((pt) => addAtom(pt.x, pt.y, 'C').id);

  for (let i = 0; i < atomIds.length; i++) {
    const next = atomIds[(i + 1) % atomIds.length];
    addBond(atomIds[i], next, i % 2 === 0 ? 2 : 1);
  }

  state.selectedAtomId = atomIds[0];
  updateStats();
  render();
}

function loadEthanolSample() {
  clearStructure();
  const a1 = addAtom(300, 320, 'C');
  const a2 = addAtom(430, 300, 'C');
  const a3 = addAtom(560, 340, 'O');

  addBond(a1.id, a2.id, 1);
  addBond(a2.id, a3.id, 1);

  state.selectedAtomId = a2.id;
  updateStats();
  render();
}

function loadMethaneSample() {
  clearStructure();
  const center = addAtom(canvas.width / 2, canvas.height / 2, 'C');
  const offsets = [
    { x: 0, y: -90 },
    { x: 90, y: 0 },
    { x: 0, y: 90 },
    { x: -90, y: 0 },
  ];

  offsets.forEach((offset) => {
    const atom = addAtom(center.x + offset.x, center.y + offset.y, 'H');
    addBond(center.id, atom.id, 1);
  });

  state.selectedAtomId = center.id;
  updateStats();
  render();
}

function loadWaterSample() {
  clearStructure();
  const o = addAtom(canvas.width / 2, canvas.height / 2, 'O');
  const h1 = addAtom(canvas.width / 2 - 90, canvas.height / 2 - 35, 'H');
  const h2 = addAtom(canvas.width / 2 + 90, canvas.height / 2 - 35, 'H');

  addBond(o.id, h1.id, 1);
  addBond(o.id, h2.id, 1);

  state.selectedAtomId = o.id;
  updateStats();
  render();
}

function updateStats() {
  atomCountEl.textContent = String(state.atoms.length);
  bondCountEl.textContent = String(state.bonds.length);

  const atomType = state.atoms.length > 0 ? 'Molecule' : 'Empty';
  moleculeTypeEl.textContent = atomType;

  toolLabelEl.textContent = {
    atom: 'Atom Tool',
    'bond-single': 'Single Bond Tool',
    'bond-double': 'Double Bond Tool',
    'bond-triple': 'Triple Bond Tool',
    ring: 'Ring Tool',
    erase: 'Erase Tool',
    select: 'Move Tool',
  }[state.tool] || 'Tool';
}

function setTool(toolName) {
  state.tool = toolName;
  state.pendingAtomId = null;
  tools.forEach((button) => {
    button.classList.toggle('active', button.dataset.tool === toolName);
  });
  updateStats();
  render();
}

function drawBond(bond) {
  const a = state.atoms.find((atom) => atom.id === bond.a);
  const b = state.atoms.find((atom) => atom.id === bond.b);

  if (!a || !b) return;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const angle = Math.atan2(dy, dx);
  const normalX = Math.cos(angle + Math.PI / 2);
  const normalY = Math.sin(angle + Math.PI / 2);

  ctx.strokeStyle = '#dbeafe';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  if (bond.order === 1) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  if (bond.order === 2) {
    const offset = 6;
    ctx.beginPath();
    ctx.moveTo(a.x + normalX * offset, a.y + normalY * offset);
    ctx.lineTo(b.x + normalX * offset, b.y + normalY * offset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(a.x - normalX * offset, a.y - normalY * offset);
    ctx.lineTo(b.x - normalX * offset, b.y - normalY * offset);
    ctx.stroke();
  }

  if (bond.order === 3) {
    const offsets = [-8, 0, 8];
    offsets.forEach((shift) => {
      ctx.beginPath();
      ctx.moveTo(a.x + normalX * shift, a.y + normalY * shift);
      ctx.lineTo(b.x + normalX * shift, b.y + normalY * shift);
      ctx.stroke();
    });
  }
}

function drawAtom(atom) {
  const isSelected = state.selectedAtomId === atom.id;
  const isPending = state.pendingAtomId === atom.id;

  ctx.beginPath();
  ctx.fillStyle = atom.color || '#7dd3fc';
  ctx.strokeStyle = isSelected ? '#f8fafc' : '#dbeafe';
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.arc(atom.x, atom.y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (isPending) {
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.arc(atom.x, atom.y, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#06131d';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(atom.label, atom.x, atom.y + 1);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  state.bonds.forEach(drawBond);
  state.atoms.forEach(drawAtom);
}

canvas.addEventListener('click', (event) => {
  const pos = getMousePos(event);

  if (state.tool === 'atom') {
    const atom = atomAtPosition(pos.x, pos.y);
    if (!atom) {
      const newAtom = addAtom(pos.x, pos.y, 'C');
      state.selectedAtomId = newAtom.id;
      updateStats();
      render();
    }
    return;
  }

  if (state.tool === 'erase') {
    const atom = atomAtPosition(pos.x, pos.y);
    if (atom) {
      removeAtom(atom.id);
      updateStats();
      render();
    }
    return;
  }

  if (state.tool === 'ring') {
    const ringCenter = pos;
    const pts = createHexagon(ringCenter.x, ringCenter.y, 80);
    const ids = pts.map((pt) => addAtom(pt.x, pt.y, 'C').id);

    for (let i = 0; i < ids.length; i++) {
      const next = ids[(i + 1) % ids.length];
      addBond(ids[i], next, i % 2 === 0 ? 2 : 1);
    }

    updateStats();
    render();
    return;
  }

  const atom = atomAtPosition(pos.x, pos.y);
  if (!atom) return;

  if (state.tool.startsWith('bond-')) {
    if (!state.pendingAtomId) {
      state.pendingAtomId = atom.id;
      state.selectedAtomId = atom.id;
      render();
      return;
    }

    if (state.pendingAtomId !== atom.id) {
      const order = state.tool === 'bond-single' ? 1 : state.tool === 'bond-double' ? 2 : 3;
      addBond(state.pendingAtomId, atom.id, order);
      state.pendingAtomId = null;
      state.selectedAtomId = atom.id;
      updateStats();
      render();
    }
  }

  if (state.tool === 'select') {
    state.selectedAtomId = atom.id;
    render();
  }
});

canvas.addEventListener('pointerdown', (event) => {
  if (state.tool !== 'select') return;

  const pos = getMousePos(event);
  const atom = atomAtPosition(pos.x, pos.y);
  if (!atom) return;

  state.dragAtomId = atom.id;
  state.selectedAtomId = atom.id;
  render();
});

canvas.addEventListener('pointermove', (event) => {
  if (state.dragAtomId === null) return;

  const pos = getMousePos(event);
  const atom = state.atoms.find((item) => item.id === state.dragAtomId);
  if (!atom) return;

  atom.x = pos.x;
  atom.y = pos.y;
  render();
});

canvas.addEventListener('pointerup', () => {
  state.dragAtomId = null;
});

canvas.addEventListener('pointerleave', () => {
  state.dragAtomId = null;
});

tools.forEach((button) => {
  button.addEventListener('click', () => {
    setTool(button.dataset.tool);
  });
});

generateBtn.addEventListener('click', () => {
  loadSampleByName(moleculeNameInput.value);
});

moleculeNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    loadSampleByName(moleculeNameInput.value);
  }
});

clearBtn.addEventListener('click', () => {
  clearStructure();
});

saveBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'saif-draw-structure.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

setTool('atom');
updateStats();
loadBenzeneSample();
