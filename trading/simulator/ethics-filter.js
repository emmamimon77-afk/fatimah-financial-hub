// ethics-filter.js - Shariah Compliance Engine
// Fatimah Financial Hub - Ethical Trading Simulator

const EthicsFilter = {
    // Haram industries list
    haramIndustries: [
        'alcohol', 'wine', 'beer', 'spirits', 'liquor', 'brewery', 'distillery',
        'gambling', 'casino', 'betting', 'lottery', 'poker',
        'weapons', 'defense', 'military', 'firearms', 'ammunition', 'arms',
        'pork', 'ham', 'bacon', 'swine', 'meat processing',
        'conventional bank', 'interest', 'riba', 'mortgage', 'lending',
        'insurance', 'conventional insurance', 'takaful' // conventional insurance is haram
    ],
    
    // Shariah-compliant sectors (examples)
    halalSectors: [
        'technology', 'healthcare', 'education', 'halal food', 
        'renewable energy', 'telecommunications', 'utilities',
        'consumer goods', 'retail', 'transportation', 'logistics'
    ],
    
    // Check if company is in haram industry
    isHaramIndustry: function(companyName, sector, industry) {
        const searchText = `${companyName} ${sector} ${industry}`.toLowerCase();
        
        for (let term of this.haramIndustries) {
            if (searchText.includes(term.toLowerCase())) {
                return {
                    isHaram: true,
                    reason: `Company appears to be involved in: ${term}`,
                    term: term
                };
            }
        }
        return { isHaram: false };
    },
    
    // Check debt level (should be <33% for Shariah compliance)
    checkDebtLevel: function(totalDebt, marketCap) {
        if (!totalDebt || !marketCap || marketCap === 0) {
            return { 
                compliant: false, 
                message: 'Insufficient data to check debt levels' 
            };
        }
        
        const debtRatio = (totalDebt / marketCap) * 100;
        
        if (debtRatio < 33) {
            return {
                compliant: true,
                ratio: debtRatio.toFixed(2),
                message: `Debt ratio: ${debtRatio.toFixed(2)}% - Within Shariah limits (<33%)`
            };
        } else {
            return {
                compliant: false,
                ratio: debtRatio.toFixed(2),
                message: `⚠️ Debt ratio: ${debtRatio.toFixed(2)}% - Exceeds Shariah limit of 33%`
            };
        }
    },
    
    // Comprehensive Shariah check
    checkShariahCompliance: function(companyData) {
        const {
            companyName,
            symbol,
            sector,
            industry,
            totalDebt,
            marketCap,
            businessActivities = []
        } = companyData;
        
        let issues = [];
        let warnings = [];
        let isCompliant = true;
        
        // 1. Check industry
        const industryCheck = this.isHaramIndustry(companyName, sector, industry);
        if (industryCheck.isHaram) {
            isCompliant = false;
            issues.push(industryCheck.reason);
        }
        
        // 2. Check business activities
        for (let activity of businessActivities) {
            const activityCheck = this.isHaramIndustry(activity, '', '');
            if (activityCheck.isHaram) {
                isCompliant = false;
                issues.push(`Company engages in: ${activityCheck.term}`);
            }
        }
        
        // 3. Check debt level (warning, not automatic disqualification)
        if (totalDebt && marketCap) {
            const debtCheck = this.checkDebtLevel(totalDebt, marketCap);
            if (!debtCheck.compliant) {
                warnings.push(debtCheck.message);
                // Still compliant if debt >33% but other factors okay
                // Scholars differ on this - we'll warn but not block
            }
        }
        
        return {
            symbol,
            companyName,
            isCompliant,
            issues,
            warnings,
            canTrade: isCompliant, // Allow trade even with warnings
            timestamp: new Date().toISOString()
        };
    },
    
    // Predefined list of common halal stocks (for demo purposes)
    halalStockSuggestions: [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
        { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology' },
        { symbol: 'ADBE', name: 'Adobe', sector: 'Technology' },
        { symbol: 'CRM', name: 'Salesforce', sector: 'Technology' },
        { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
        { symbol: 'PFE', name: 'Pfizer', sector: 'Healthcare' },
        { symbol: 'MRK', name: 'Merck', sector: 'Healthcare' },
        { symbol: 'ABT', name: 'Abbott', sector: 'Healthcare' },
        { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare' }
    ],
    
    // Common haram stocks (for demo/education)
    haramStockExamples: [
        { symbol: 'BUD', name: 'Anheuser-Busch', reason: 'Alcohol production' },
        { symbol: 'TAP', name: 'Molson Coors', reason: 'Alcohol production' },
        { symbol: 'LVS', name: 'Las Vegas Sands', reason: 'Gambling/Casinos' },
        { symbol: 'WYNN', name: 'Wynn Resorts', reason: 'Gambling/Casinos' },
        { symbol: 'LMT', name: 'Lockheed Martin', reason: 'Weapons manufacturing' },
        { symbol: 'NOC', name: 'Northrop Grumman', reason: 'Weapons manufacturing' },
        { symbol: 'JPM', name: 'JPMorgan Chase', reason: 'Conventional banking (riba)' },
        { symbol: 'BAC', name: 'Bank of America', reason: 'Conventional banking (riba)' }
    ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EthicsFilter;
}
