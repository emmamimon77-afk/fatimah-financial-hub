/**
 * Islamic Finance Calculators Module
 * Integrates with Fatimah Financial Hub system
 * Murabaha vs Western Loan Comparison
 */

class IslamicCalculators {
    constructor() {
        console.log('IslamicCalculators initialized');
        this.config = window.FinancialConfig;
        this.calculators = window.FinancialCalculators ? 
            (typeof window.FinancialCalculators === 'function' ? new window.FinancialCalculators() : window.FinancialCalculators) : 
            null;
    }

    /**
     * MURABAHA CALCULATION (Islamic Cost-Plus Financing)
     * Formula: Total Price = Cost Price + (Cost Price × Profit Margin)
     */
    calculateMurabaha(params) {
        console.log('calculateMurabaha called:', params);
        
        try {
            const costPrice = params.costPrice || 250000;
            const profitMargin = (params.profitMargin || 12) / 100; // Convert percentage to decimal
            const tenureMonths = params.tenureMonths || 60;
            const downPayment = params.downPayment || 50000;
            const processingFee = params.processingFee || 1500;
            const insurancePerYear = params.insurancePerYear || 1200;
            const stampDuty = params.stampDuty || 800;
            
            // Core Murabaha calculations
            const bankProfit = costPrice * profitMargin;
            const totalPrice = costPrice + bankProfit;
            const financedAmount = totalPrice - downPayment;
            const monthlyPayment = financedAmount / tenureMonths;
            
            // Ancillary costs
            const years = tenureMonths / 12;
            const totalInsurance = insurancePerYear * years;
            const totalFees = processingFee + totalInsurance + stampDuty;
            
            // Grand totals
            const totalPaid = (monthlyPayment * tenureMonths) + downPayment + totalFees;
            const netCostToBuyer = totalPaid - costPrice;
            
            return {
                success: true,
                type: 'murabaha',
                country: params.country || 'US',
                costPrice: this.formatMoney(costPrice, params.country),
                profitMargin: (profitMargin * 100).toFixed(2) + '%',
                bankProfit: this.formatMoney(bankProfit, params.country),
                totalPrice: this.formatMoney(totalPrice, params.country),
                downPayment: this.formatMoney(downPayment, params.country),
                financedAmount: this.formatMoney(financedAmount, params.country),
                monthlyPayment: this.formatMoney(monthlyPayment, params.country),
                tenureMonths: tenureMonths,
                processingFee: this.formatMoney(processingFee, params.country),
                totalInsurance: this.formatMoney(totalInsurance, params.country),
                stampDuty: this.formatMoney(stampDuty, params.country),
                totalFees: this.formatMoney(totalFees, params.country),
                totalPaid: this.formatMoney(totalPaid, params.country),
                netCostToBuyer: this.formatMoney(netCostToBuyer, params.country),
                paymentSchedule: this.generateMurabahaSchedule(financedAmount, monthlyPayment, tenureMonths, downPayment)
            };
        } catch (error) {
            console.error('Murabaha calculation error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate Murabaha payment schedule
     */
    generateMurabahaSchedule(financedAmount, monthlyPayment, months, downPayment = 0) {
        const schedule = [];
        let remainingBalance = financedAmount;
        
        for (let i = 1; i <= months; i++) {
            remainingBalance -= monthlyPayment;
            if (remainingBalance < 0) remainingBalance = 0;
            
            schedule.push({
                month: i,
                payment: monthlyPayment,
                remaining: remainingBalance,
                totalPaid: monthlyPayment * i
            });
        }
        
        return schedule;
    }

    /**
     * WESTERN LOAN CALCULATION (for comparison)
     * Reuses existing mortgage calculator logic
     */
    calculateWesternLoan(params) {
        console.log('calculateWesternLoan called:', params);
        
        try {
            const principal = params.principal || 250000;
            const annualRate = params.interestRate || 6.0;
            const months = params.tenureMonths || 60;
            const downPayment = params.downPayment || 0;
            const originationFee = params.originationFee || 0;
            const insurancePerYear = params.insurancePerYear || 0;
            const stampDuty = params.stampDuty || 0;
            
            // Convert annual rate to monthly decimal
            const monthlyRate = (annualRate / 100) / 12;
            
            // Calculate monthly payment using PMT formula
            let monthlyPayment;
            if (monthlyRate === 0) {
                monthlyPayment = principal / months;
            } else {
                monthlyPayment = principal * 
                    (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                    (Math.pow(1 + monthlyRate, months) - 1);
            }
            
            // Calculate totals
            const totalPayments = monthlyPayment * months;
            const totalInterest = totalPayments - principal;
            
            // Total fees (insurance for full term)
            const totalInsurance = (insurancePerYear / 12) * months;
            const totalFees = originationFee + totalInsurance + stampDuty;
            
            const totalCost = totalPayments + totalFees;
            
            console.log('Western loan calculation:', {
                principal, annualRate, months, monthlyPayment,
                totalPayments, totalInterest, totalFees, totalCost
            });
            
            return {
                success: true,
                type: 'western',
                principal: this.formatMoney(principal, params.country),
                interestRate: annualRate.toFixed(2) + '%',
                tenureMonths: months,
                monthlyPayment: this.formatMoney(monthlyPayment, params.country),
                totalPaid: this.formatMoney(totalPayments, params.country),
                totalInterest: this.formatMoney(totalInterest, params.country),
                totalFees: this.formatMoney(totalFees, params.country),
                totalCost: this.formatMoney(totalCost, params.country),
                downPayment: this.formatMoney(downPayment, params.country),
                originationFee: this.formatMoney(originationFee, params.country),
                insurancePerYear: this.formatMoney(insurancePerYear, params.country),
                stampDuty: this.formatMoney(stampDuty, params.country),
                
                // Raw numbers for comparison
                raw: {
                    monthlyPayment,
                    totalCost,
                    totalInterest
                }
            };
            
        } catch (error) {
            console.error('Western loan calculation error:', error);
            return { 
                success: false, 
                error: error.message,
                totalCost: this.formatMoney(0, params.country),
                monthlyPayment: this.formatMoney(0, params.country)
            };
        }
    }        
  


    /**
     * Generate amortization schedule for Western loan
     */
    generateAmortizationSchedule(principal, annualRate, months) {
        const schedule = [];
        const monthlyRate = annualRate / 100 / 12;
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                              (Math.pow(1 + monthlyRate, months) - 1);
        
        let remainingBalance = principal;
        
        for (let i = 1; i <= months; i++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            remainingBalance -= principalPayment;
            if (remainingBalance < 0) remainingBalance = 0;
            
            schedule.push({
                month: i,
                payment: monthlyPayment,
                interest: interestPayment,
                principal: principalPayment,
                remaining: remainingBalance
            });
        }
        
        return schedule;
    }

    /**
     * COMPARE MURABAHA vs WESTERN LOAN
     */
    compareFinancing(options) {
        console.log('compareFinancing called:', options);
        
        const murabahaResult = this.calculateMurabaha(options.murabaha || {});
        const westernResult = this.calculateWesternLoan(options.western || {});
        
        if (!murabahaResult.success || !westernResult.success) {
            return {
                success: false,
                error: 'One or both calculations failed',
                murabahaResult,
                westernResult
            };
        }
        
        // Parse numeric values for comparison
        const murabahaTotal = parseFloat(murabahaResult.totalPaid.replace(/[^0-9.-]+/g, ""));
        const westernTotal = parseFloat(westernResult.totalPaid.replace(/[^0-9.-]+/g, ""));
        
        const difference = murabahaTotal - westernTotal;
        const percentageDiff = (difference / westernTotal) * 100;
        
        return {
            success: true,
            comparison: {
                murabahaTotal,
                westernTotal,
                difference,
                percentageDiff: percentageDiff.toFixed(2) + '%',
                cheaperOption: difference < 0 ? 'Murabaha' : 'Western Loan',
                costDifference: this.formatMoney(Math.abs(difference), params.country),  // ADD country parameter
                explanation: this.generateComparisonExplanation(difference, percentageDiff)
            },
            murabaha: murabahaResult,
            western: westernResult
        };
    }

    /**
     * Generate educational explanation of the comparison
     */
    generateComparisonExplanation(difference, percentageDiff) {
        if (Math.abs(percentageDiff) < 1) {
            return "Both financing methods have similar total costs in this scenario.";
        }
        
        if (difference < 0) {
            return `Murabaha is ${Math.abs(percentageDiff).toFixed(1)}% cheaper. Islamic finance avoids compound interest, providing a fixed, transparent cost.`;
        } else {
            return `Western loan is ${Math.abs(percentageDiff).toFixed(1)}% cheaper. However, Murabaha provides ethical certainty and no interest risk.`;
        }
    }

    /**
     * Format money with currency symbol
     */
    // Format money with dynamic currency symbol
    formatMoney(amount, countryCode = null) {
        console.log('🔍 formatMoney called with:', { 
            amount, 
            countryCode, 
            hasConfig: !!this.config,
            configData: this.config ? 'YES' : 'NO'
        });
        
        if (!this.config) {
            console.log('❌ No FinancialConfig available, returning $');
            return '$' + Number(amount).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        }
        
    
        // Get country code from config if not provided
        const country = countryCode || this.config.userSettings?.country || 'US';
        console.log('🌍 Using country code:', country, '(param was:', countryCode, ')');

        
        // Direct mapping for Islamic finance countries
        const islamicCountrySymbols = {
            'SAUDI_ARABIA': 'ر.س',
            'SA': 'ر.س',  // Add short code
            'UNITED_ARAB_EMIRATES': 'د.إ',
            'UAE': 'د.إ',  // Add short code
            'TURKIYE': '₺',
            'TR': '₺',     // Add short code
            'MALAYSIA': 'RM',
            'MY': 'RM',    // Add short code
            'QATAR': 'ر.ق',
            'QA': 'ر.ق',   // Add short code
            'KUWAIT': 'د.ك',
            'KW': 'د.ك',   // Add short code
            'BAHRAIN': '.د.ب',
            'BH': '.د.ب',  // Add short code
            'OMAN': 'ر.ع.',
            'OM': 'ر.ع.',  // Add short code
            'US': '$',
            'GB': '£',
            'EU': '€'
        };

        
        // Check direct mapping first
        if (islamicCountrySymbols[country]) {
            const symbol = islamicCountrySymbols[country];
            console.log('💰 Using direct mapping for:', country, 'symbol:', symbol);
            return symbol + Number(amount).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        }
        
        // Fallback to getCurrencySymbol
        if (this.config.getCurrencySymbol) {
            const symbol = this.config.getCurrencySymbol(country);
            console.log('💰 Using getCurrencySymbol, got:', symbol);
            
            return symbol + Number(amount).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        }        
        
        
        // Fallback to direct countryData access (shouldn't happen if config is properly initialized)
        const symbol = this.config.countryData[country]?.symbol || '$';
        console.log('💰 Fallback symbol:', symbol);
        
        return symbol + Number(amount).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }


    /**
     * Initialize the comparison UI
     */
    initComparisonUI() {
        console.log('Initializing Islamic finance comparison UI');
        
        // Check if we're on the Murabaha page
        if (document.getElementById('mCostPrice')) {
            this.setupEventListeners();
            this.initialCalculation();
        }
    }

    /**
     * Setup event listeners for the comparison page
     */
    setupEventListeners() {
        // Sync principal/cost price
        document.getElementById('mCostPrice')?.addEventListener('input', () => {
            const wPrincipal = document.getElementById('wPrincipal');
            if (wPrincipal) {
                wPrincipal.value = document.getElementById('mCostPrice').value;
            }
        });
        
        document.getElementById('wPrincipal')?.addEventListener('input', () => {
            const mCostPrice = document.getElementById('mCostPrice');
            if (mCostPrice) {
                mCostPrice.value = document.getElementById('wPrincipal').value;
            }
        });
        
        // Calculate buttons
        document.getElementById('calcMurabahaBtn')?.addEventListener('click', () => this.calcMurabahaUI());
        document.getElementById('calcWesternBtn')?.addEventListener('click', () => this.calcWesternUI());
        document.getElementById('compareBtn')?.addEventListener('click', () => this.compareUI());
    }

    /**
     * Perform initial calculation on page load
     */
    initialCalculation() {
        setTimeout(() => {
            this.calcMurabahaUI();
            this.calcWesternUI();
            this.compareUI();
        }, 500);
    }

    /**
     * UI calculation methods (to integrate with your HTML)
     */
    calcMurabahaUI() {
        const params = {
            costPrice: parseFloat(document.getElementById('mCostPrice').value) || 250000,
            profitMargin: parseFloat(document.getElementById('mProfitMargin').value) || 12,
            tenureMonths: parseFloat(document.getElementById('mTenure').value) || 60,
            downPayment: parseFloat(document.getElementById('mDownPayment').value) || 50000,
            processingFee: parseFloat(document.getElementById('mProcessingFee').value) || 1500,
            insurancePerYear: parseFloat(document.getElementById('mInsurance').value) || 1200,
            stampDuty: parseFloat(document.getElementById('mStampDuty').value) || 800
        };
        
        const result = this.calculateMurabaha(params);
        this.displayMurabahaResults(result);
    }

    calcWesternUI() {
        const params = {
            principal: parseFloat(document.getElementById('wPrincipal').value) || 250000,
            interestRate: parseFloat(document.getElementById('wRate').value) || 7.5,
            tenureMonths: parseFloat(document.getElementById('wTenure').value) || 60,
            downPayment: parseFloat(document.getElementById('wDownPayment').value) || 50000,
            originationFee: parseFloat(document.getElementById('wOriginationFee').value) || 2000,
            insurancePerYear: parseFloat(document.getElementById('wInsurance').value) || 1200,
            stampDuty: parseFloat(document.getElementById('wStampDuty').value) || 800
        };
        
        const result = this.calculateWesternLoan(params);
        this.displayWesternResults(result);
    }

    compareUI() {
        const murabahaParams = {
            costPrice: parseFloat(document.getElementById('mCostPrice').value) || 250000,
            profitMargin: parseFloat(document.getElementById('mProfitMargin').value) || 12,
            tenureMonths: parseFloat(document.getElementById('mTenure').value) || 60,
            downPayment: parseFloat(document.getElementById('mDownPayment').value) || 50000,
            processingFee: parseFloat(document.getElementById('mProcessingFee').value) || 1500,
            insurancePerYear: parseFloat(document.getElementById('mInsurance').value) || 1200,
            stampDuty: parseFloat(document.getElementById('mStampDuty').value) || 800
        };
        
        const westernParams = {
            principal: parseFloat(document.getElementById('wPrincipal').value) || 250000,
            interestRate: parseFloat(document.getElementById('wRate').value) || 7.5,
            tenureMonths: parseFloat(document.getElementById('wTenure').value) || 60,
            downPayment: parseFloat(document.getElementById('wDownPayment').value) || 50000,
            originationFee: parseFloat(document.getElementById('wOriginationFee').value) || 2000,
            insurancePerYear: parseFloat(document.getElementById('wInsurance').value) || 1200,
            stampDuty: parseFloat(document.getElementById('wStampDuty').value) || 800
        };
        
        const result = this.compareFinancing({
            murabaha: murabahaParams,
            western: westernParams
        });
        
        this.displayComparisonResults(result);
    }

    /**
     * Display methods (simplified - you can expand these)
     */
    displayMurabahaResults(result) {
        if (!result.success) return;
        
        // Update UI elements
        const monthlyElem = document.getElementById('mMonthlyDisp');
        const tenureElem = document.getElementById('mTenureDisp');
        const tableElem = document.getElementById('islamicDetailTable');
        
        if (monthlyElem) monthlyElem.textContent = result.monthlyPayment;
        if (tenureElem) tenureElem.textContent = `for ${result.tenureMonths} months`;
        
        // Show result panel
        const resultPanel = document.getElementById('islamicResult');
        if (resultPanel) resultPanel.classList.add('visible');
    }

    displayWesternResults(result) {
        if (!result.success) return;
        
        // Similar implementation for Western results
    }

    displayComparisonResults(result) {
        if (!result.success) return;
        
        // Show comparison section
        const comparisonSection = document.getElementById('comparisonSection');
        if (comparisonSection) comparisonSection.style.display = 'block';
    }
}

// Export to window
if (typeof window !== 'undefined') {
    window.IslamicCalculators = IslamicCalculators;
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.islamicCalculators) {
            window.islamicCalculators.initComparisonUI();
        }
    });
}
