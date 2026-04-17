
import fs from 'fs';
const content = fs.readFileSync('c:/ABCDEERP/views/ViewSalesQuoteView.tsx', 'utf8');

let openDivs = 0;
let lineNum = 0;
const lines = content.split('\n');

for (let line of lines) {
    lineNum++;
    // Simple regex to match <div but not self-closing or other components
    const opens = (line.match(/<div(?![^>]*\/>)/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    openDivs += opens;
    openDivs -= closes;
    if (opens > 0 || closes > 0) {
        console.log(`Line ${lineNum}: ${opens} opens, ${closes} closes. Balance: ${openDivs} | ${line.trim().substring(0, 30)}`);
    }
}
console.log(`Final balance: ${openDivs}`);
