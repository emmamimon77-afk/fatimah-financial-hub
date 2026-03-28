/**
 * Global Financial Configuration
 * Country-specific rates and defaults
 * Updated: Q1 2024
 */

class FinancialConfig {
    constructor() {
        this.countryData = {
            'US': {
                name: 'United States',
                currency: 'USD',
                symbol: '$',
                centralBankRate: 5.50,
                inflation: 3.4,
                tax: {
                    income: [10, 12, 22, 24, 32, 35, 37],
                    capitalGains: 15,
                    corporate: 21,
                    vat: 0
                },
                mortgage: {
                    avg30yrFixed: 7.23,
                    avg15yrFixed: 6.49,
                    avg5yrARM: 6.35
                },
                retirement: {
                    socialSecurity: true,
                    avgReturn: 7.0,
                    safeWithdrawalRate: 4.0
                }
            },
            'UK': {
                name: 'United Kingdom',
                currency: 'GBP',
                symbol: '£',
                centralBankRate: 5.25,
                inflation: 4.0,
                tax: {
                    income: [20, 40, 45],
                    capitalGains: 20,
                    corporate: 25,
                    vat: 20
                },
                mortgage: {
                    avg30yrFixed: 5.5,
                    avg15yrFixed: 5.0,
                    avg5yrARM: 4.8
                },
                retirement: {
                    socialSecurity: true,
                    avgReturn: 6.5,
                    safeWithdrawalRate: 3.5
                }
            },
            'EU': {
                name: 'European Union',
                currency: 'EUR',
                symbol: '€',
                centralBankRate: 4.50,
                inflation: 2.9,
                tax: {
                    income: [25, 40, 50],
                    capitalGains: 25,
                    corporate: 21,
                    vat: 21
                },
                mortgage: {
                    avg30yrFixed: 4.2,
                    avg15yrFixed: 3.8,
                    avg5yrARM: 3.5
                },
                retirement: {
                    socialSecurity: true,
                    avgReturn: 5.5,
                    safeWithdrawalRate: 3.0
                }
            },
            'JP': {
                name: 'Japan',
                currency: 'JPY',
                symbol: '¥',
                centralBankRate: 0.10,
                inflation: 2.8,
                tax: {
                    income: [5, 10, 20, 23, 33, 40, 45],
                    capitalGains: 20,
                    corporate: 30,
                    vat: 10
                },
                mortgage: {
                    avg30yrFixed: 1.5,
                    avg15yrFixed: 1.2,
                    avg5yrARM: 1.0
                },
                retirement: {
                    socialSecurity: true,
                    avgReturn: 4.0,
                    safeWithdrawalRate: 2.5
                }
            },
            'IN': {
                name: 'India',
                currency: 'INR',
                symbol: '₹',
                centralBankRate: 6.50,
                inflation: 5.6,
                tax: {
                    income: [5, 10, 20, 30],
                    capitalGains: 15,
                    corporate: 30,
                    vat: 18
                },
                mortgage: {
                    avg30yrFixed: 8.5,
                    avg15yrFixed: 8.0,
                    avg5yrARM: 7.5
                },
                retirement: {
                    socialSecurity: false,
                    avgReturn: 10.0,
                    safeWithdrawalRate: 5.0
                }
            },
            'AU': {
                name: 'Australia',
                currency: 'AUD',
                symbol: 'A$',
                centralBankRate: 4.35,
                inflation: 4.1,
                tax: {
                    income: [19, 32.5, 37, 45],
                    capitalGains: 25,
                    corporate: 30,
                    vat: 10
                },
                mortgage: {
                    avg30yrFixed: 6.5,
                    avg15yrFixed: 6.0,
                    avg5yrARM: 5.8
                },
                retirement: {
                    socialSecurity: true,
                    avgReturn: 7.5,
                    safeWithdrawalRate: 4.0
                }
            },
            'CN': {
                name: 'China',
                currency: 'CNY',
                symbol: '¥',
                centralBankRate: 3.45,
                inflation: 2.5,
                tax: {
                    income: [3, 10, 20, 25, 30, 35, 45],
                    capitalGains: 20,
                    corporate: 25,
                    vat: 13
                },
                mortgage: {
                    avg30yrFixed: 4.2,
                    avg15yrFixed: 3.9,
                    avg5yrARM: 3.7
                },
                retirement: {
                    socialSecurity: true,
                    avgReturn: 6.0,
                    safeWithdrawalRate: 3.0
                },
                specialFeatures: {
                    capitalControls: true,
                    stateOwnedBanks: true,
                    yuanInternationalization: true
                }
            },
            'RU': {
                name: 'Russia',
                currency: 'RUB',
                symbol: '₽',
                centralBankRate: 16.00,
                inflation: 7.8,
                tax: {
                    income: [13],
                    capitalGains: 13,
                    corporate: 20,
                    vat: 20
                },
                mortgage: {
                    avg30yrFixed: 15.5,
                    avg15yrFixed: 14.0,
                    avg5yrARM: 13.5
                },
                retirement: {
                    socialSecurity: true,
                    avgReturn: 12.0,
                    safeWithdrawalRate: 6.0
                },
                specialFeatures: {
                    sanctionsImpact: true,
                    rubleVolatility: true,
                    sovereignWealthFund: true
                }
            },
            'UAE': {
                name: 'United Arab Emirates',
                currency: 'AED',
                symbol: 'د.إ',
                centralBankRate: 5.65,
                inflation: 2.1,
                tax: {
                    income: [0], // No income tax in UAE
                    capitalGains: 0,
                    corporate: 0,
                    vat: 5
                },
                mortgage: {
                    avg30yrFixed: 4.5,
                    avg15yrFixed: 4.0,
                    avg5yrARM: 3.8
                },
                retirement: {
                    socialSecurity: false,
                    avgReturn: 8.5,
                    safeWithdrawalRate: 4.5
                },
                specialFeatures: {
                    islamicBanking: true,
                    noIncomeTax: true,
                    expatFriendly: true
                }
            },
            'SA': {
                name: 'Saudi Arabia',
                currency: 'SAR',
                symbol: 'ر.س',
                centralBankRate: 6.0,
                inflation: 1.6,
                tax: {
                    income: [0], // No personal income tax
                    capitalGains: 0,
                    corporate: 20, // Corporate tax
                    vat: 15
                },
                mortgage: {
                    avg30yrFixed: 6.0,
                    avg15yrFixed: 5.5,
                    avg5yrARM: 5.2
                },
                retirement: {
                    socialSecurity: true,
                    avgReturn: 9.0,
                    safeWithdrawalRate: 5.0
                },
                specialFeatures: {
                    islamicBanking: true,
                    oilEconomy: true,
                    vision2030: true
                }
            },
            'MY': {
                name: 'Malaysia',
                currency: 'MYR',
                symbol: 'RM',
                centralBankRate: 3.0,
                inflation: 2.5,
                tax: {
                    income: [0, 1, 3, 8, 14, 21, 24, 24.5, 25, 26, 28, 30],
                    capitalGains: 10,
                    corporate: 24,
                    vat: 6
                },
                mortgage: {
                    avg30yrFixed: 3.9,
                    avg15yrFixed: 3.5,
                    avg5yrARM: 3.2
                },
                retirement: {
                    socialSecurity: true,
                    avgReturn: 7.5,
                    safeWithdrawalRate: 4.0
                },
                specialFeatures: {
                    islamicBanking: true,
                    dualBankingSystem: true, // Both conventional and Islamic
                    sukukMarket: true  // Islamic bonds
                }
            },
        };

        // ... REST OF YOUR EXISTING CODE ...
        // Keep all your other methods exactly as they are
        this.assetReturns = {
            'stocks': {
                'US': 9.8,
                'global': 8.5,
                'emerging': 11.0
            },
            'bonds': {
                'government': 4.5,
                'corporate': 5.8,
                'highYield': 7.2
            },
            'realEstate': 6.5,
            'commodities': 7.0,
            'crypto': 15.0,
            'cash': 3.5
        };

        this.taxBrackets = {
            'low': { rate: 10, threshold: 20000 },
            'medium': { rate: 22, threshold: 50000 },
            'high': { rate: 35, threshold: 100000 },
            'veryHigh': { rate: 45, threshold: 200000 }
        };

        this.userSettings = {
            country: 'US',
            currency: 'USD',
            customRates: {},
            taxProfile: 'medium',
            riskTolerance: 'moderate'
        };
    }

    // ... ALL YOUR EXISTING METHODS ...
    async getRate(rateType, countryCode = null, useRealTime = true) {
        const country = countryCode || this.userSettings.country;
        
        // Try real-time rates first for US
        if (useRealTime && country === 'US' && window.RealTimeRates) {
            const realTimeRate = await window.RealTimeRates.getRate(rateType, country);
            
            if (realTimeRate && realTimeRate.value !== null && realTimeRate.value !== undefined) {
                // Return the numeric value for backward compatibility
                return realTimeRate.value;
            }
        }
        
        // Fallback to static data
        const countryInfo = this.countryData[country];
        
        if (!countryInfo) return this.getDefaultRate(rateType);
        
        switch(rateType) {
            case 'inflation': return countryInfo.inflation;
            case 'centralBank': return countryInfo.centralBankRate;
            case 'mortgage30yr': return countryInfo.mortgage.avg30yrFixed;
            case 'mortgage15yr': return countryInfo.mortgage.avg15yrFixed;
            case 'mortgageARM': return countryInfo.mortgage.avg5yrARM;
            case 'taxIncome': return countryInfo.tax.income[1];
            case 'taxCapitalGains': return countryInfo.tax.capitalGains;
            case 'retirementReturn': return countryInfo.retirement.avgReturn;
            case 'withdrawalRate': return countryInfo.retirement.safeWithdrawalRate;
            default: return this.getDefaultRate(rateType);
        }
    }
    
    // Get rate with detailed info (including source)
    async getRateWithInfo(rateType, countryCode = null) {
        const country = countryCode || this.userSettings.country;
        
        // Try real-time first for US
        if (country === 'US' && window.RealTimeRates) {
            const realTimeRate = await window.RealTimeRates.getRate(rateType, country);
            
            if (realTimeRate && realTimeRate.value !== null) {
                return {
                    value: realTimeRate.value,
                    source: realTimeRate.source || 'Real-Time API',
                    date: realTimeRate.date || new Date().toISOString().split('T')[0],
                    isLive: realTimeRate.isLive || false,
                    country: country
                };
            }
        }
        
        // Fallback to static data
        const countryInfo = this.countryData[country];
        let value = this.getDefaultRate(rateType);
        let source = 'Default Rate';
        
        if (countryInfo) {
            switch(rateType) {
                case 'inflation': 
                    value = countryInfo.inflation;
                    source = 'Static Database (Q1 2024)';
                    break;
                case 'centralBank': 
                    value = countryInfo.centralBankRate;
                    source = 'Static Database (Q1 2024)';
                    break;
                case 'mortgage30yr': 
                    value = countryInfo.mortgage.avg30yrFixed;
                    source = 'Static Database (Q1 2024)';
                    break;
                case 'retirementReturn':
                    value = countryInfo.retirement.avgReturn;
                    source = 'Static Database (Q1 2024)';
                    break;
                // Add other cases as needed
            }
        }
        
        return {
            value: value,
            source: source,
            date: '2024-01-01', // Static data date
            isLive: false,
            country: country
        };
    }


    getDefaultRate(rateType) {
        const defaults = {
            'inflation': 3.0,
            'centralBank': 4.0,
            'mortgage30yr': 6.0,
            'mortgage15yr': 5.5,
            'mortgageARM': 5.0,
            'taxIncome': 22,
            'taxCapitalGains': 15,
            'retirementReturn': 7.0,
            'withdrawalRate': 4.0,
            'stockReturn': 9.0,
            'bondReturn': 4.5,
            'realEstateReturn': 6.0
        };
        return defaults[rateType] || 5.0;
    }

    getCurrencySymbol(currencyCode = null) {
        const currency = currencyCode || this.userSettings.currency;
        const country = Object.values(this.countryData).find(c => c.currency === currency);
        return country ? country.symbol : '$';
    }

    getCountries() {
        return Object.entries(this.countryData).map(([code, data]) => ({
            code,
            name: data.name,
            currency: data.currency,
            symbol: data.symbol
        }));
    }

    updateSettings(settings) {
        this.userSettings = { ...this.userSettings, ...settings };
        this.saveToLocalStorage();
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('financialConfig');
        if (saved) {
            this.userSettings = JSON.parse(saved);
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('financialConfig', JSON.stringify(this.userSettings));
    }

    getUserRate(rateType) {
        return this.userSettings.customRates[rateType] || this.getRate(rateType);
    }

    calculateTax(income, countryCode = null) {
        const country = countryCode || this.userSettings.country;
        const brackets = this.countryData[country]?.tax?.income;
        
        if (!brackets || brackets.length === 0) {
            return income * (this.getRate('taxIncome', country) / 100);
        }
        
        let tax = 0;
        let remainingIncome = income;
        
        for (let i = brackets.length - 1; i >= 0; i--) {
            const bracketRate = brackets[i];
            const bracketThreshold = 10000 * (i + 1);
            
            if (remainingIncome > bracketThreshold) {
                const taxableInBracket = remainingIncome - bracketThreshold;
                tax += taxableInBracket * (bracketRate / 100);
                remainingIncome = bracketThreshold;
            }
        }
        
        return tax;
    }
}

// Create global instance
window.FinancialConfig = new FinancialConfig();

