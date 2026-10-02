# Saif Draw

A lightweight web-based chemical structure drawing app inspired by ChemDraw-style interfaces.

## Features

- Draw atoms and chemical bonds
- Single, double, and triple bond tools
- Benzene ring generator
- Drag and move atoms
- Name-to-structure presets for benzene, ethanol, methane, and water
- Clear canvas and PNG export

## Run locally

Open `index.html` directly in a browser, or use a small local server:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Project files

- `index.html` — page layout
- `style.css` — interface styling
- `app.js` — drawing logic and sample molecule presets

## Notes

This is an MVP (minimal viable product) for a ChemDraw-like editor. It is intended as a foundation for future expansion into:

- chemical formula recognition
- reaction arrows
- search by SMILES
- advanced molecule validation
- backend structure parsing

