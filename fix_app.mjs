import { readFileSync, writeFileSync } from 'fs';

let app = readFileSync('src/App.tsx', 'utf8');

// Remove dummy nav links and FR/EN toggle and replace with single CTA
app = app.replace(/
  'navReplace',
  'navNew'
);
