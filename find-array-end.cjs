const fs = require('fs');

const jsPath = '/tmp/test-original/index-8n3ZwdDs.js';
const js = fs.readFileSync(jsPath, 'utf-8');

const startMarker = 'const $g=[';
const startIndex = js.indexOf(startMarker);
console.log('Start index:', startIndex);
console.log('Start marker:', js.substring(startIndex, startIndex + 50));

let i = startIndex + startMarker.length;
let depth = 1;
let inString = false;
let stringType = '';
let inTemplate = false;
let escaped = false;

while (i < js.length && depth > 0) {
  const char = js[i];
  const prevChar = js[i-1];
  
  if (escaped) {
    escaped = false;
    i++;
    continue;
  }
  
  if (char === '\\') {
    escaped = true;
    i++;
    continue;
  }
  
  if (inTemplate) {
    if (char === '`') {
      inTemplate = false;
    }
    i++;
    continue;
  }
  
  if (inString) {
    if (char === stringType) {
      inString = false;
    }
    i++;
    continue;
  }
  
  if (char === '`') {
    inTemplate = true;
    i++;
    continue;
  }
  
  if (char === '"' || char === "'") {
    inString = true;
    stringType = char;
    i++;
    continue;
  }
  
  if (char === '[') {
    depth++;
    i++;
    continue;
  }
  
  if (char === ']') {
    depth--;
    if (depth === 0) {
      console.log('Array end found at index:', i);
      console.log('Next 100 chars:', js.substring(i, i + 100));
      const arrayContent = js.substring(startIndex, i + 1);
      const slugCount = (arrayContent.match(/slug:/g) || []).length;
      console.log('Slug count in array:', slugCount);
      break;
    }
    i++;
    continue;
  }
  
  // Also track braces to avoid confusion? No, we're only tracking array brackets
  
  i++;
}
