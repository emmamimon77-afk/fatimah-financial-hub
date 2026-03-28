const fs = require('fs');
try {
    const configText = fs.readFileSync('config.js', 'utf8');
    // Check for syntax by evaluating
    eval(configText);
    console.log('✅ config.js syntax is valid');
    console.log('✅ FinancialConfig defined:', typeof FinancialConfig !== 'undefined');
    console.log('✅ countryData exists:', FinancialConfig.countryData ? 'Yes' : 'No');
    console.log('✅ Countries:', Object.keys(FinancialConfig.countryData));
} catch (error) {
    console.log('❌ Error in config.js:', error.message);
    console.log('Line:', error.lineNumber);
}
