const fs = require('fs');
const code = fs.readFileSync('calculators.js', 'utf8');
const lines = code.split('\n');

console.log('Checking for illegal return statements...\n');

let inFunction = false;
let functionDepth = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;
    
    // Check for function start
    if (line.includes('calculate') && line.includes('(') && line.includes(')') && line.includes('{')) {
        inFunction = true;
        console.log(`Line ${lineNum}: Function start: ${line.substring(0, 50)}...`);
    }
    
    // Check for return statement
    if (line.startsWith('return') && !inFunction) {
        console.log(`\n❌ ERROR Line ${lineNum}: Illegal return statement!`);
        console.log(`   Context: "${line}"`);
        console.log(`   Previous lines:`);
        for (let j = Math.max(0, i-3); j <= Math.min(lines.length-1, i+1); j++) {
            console.log(`   ${j+1}: ${lines[j]}`);
        }
        console.log('');
    }
    
    // Check for function end
    if (line.includes('}') && inFunction) {
        // Count braces to properly track nested functions
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        
        functionDepth += openBraces - closeBraces;
        if (functionDepth <= 0) {
            inFunction = false;
            functionDepth = 0;
            console.log(`Line ${lineNum}: Function end`);
        }
    }
}

console.log('\n✅ Scan complete.');
