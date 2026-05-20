const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, filelist);
    } else if (file.endsWith('.json')) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

function processFile(file) {
  let changed = false;
  const original = fs.readFileSync(file, 'utf8');
  const lines = original.split(/\r?\n/);
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(\s*)("[^"]+"\s*:\s*)\{/);
    if (m) {
      // keep the key: part on its line, then put the brace on its own line
      out.push(m[1] + m[2].trimRight());
      out.push(m[1] + '{');
      // append remainder of line after the brace if any
      const rest = line.slice(m[0].length);
      if (rest.trim().length) {
        out.push(m[1] + '  ' + rest.trim());
      }
      changed = true;
    } else {
      out.push(line);
    }
  }

  if (changed) {
    fs.writeFileSync(file, out.join('\n'));
  }
  return changed;
}

const root = path.resolve(__dirname, '..');
const jsonFiles = walk(root);
let count = 0;
jsonFiles.forEach(f => {
  try {
    if (processFile(f)) count++;
  } catch (e) {
    console.error('Failed processing', f, e.message);
  }
});
console.log('Processed', count, 'files');
process.exit(0);
