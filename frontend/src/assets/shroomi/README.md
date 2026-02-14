# Shroomi mascot poses

This folder keeps Shroomi pose documentation without committing binary files.
The UI currently reuses `frontend/src/assets/mascot.png` and applies pose variants via CSS transforms.

## Naming convention (when binary support is available)
- Use: `shroomi-<pose-name>.png`
- Examples: `shroomi-wave.png`, `shroomi-cheer.png`, `shroomi-point.png`

## How to add more poses later
1. Export PNG with transparent background.
2. Keep dimensions lightweight (recommended square around `256x256` to `512x512`).
3. Save with the naming convention above in this folder.
4. Import new files in `frontend/src/pages/HomePage.js` and map them in the pose list.
