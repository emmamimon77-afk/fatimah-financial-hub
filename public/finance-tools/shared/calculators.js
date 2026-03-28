// Financial Calculators - ENHANCED VERSION with Flexible Rates
class FinancialCalculators {
    constructor() {
        console.log('FinancialCalculators constructor');
        this.config = window.FinancialConfig;
        console.log('Config loaded:', !!this.config);
    }

    // ============================================
    // ENHANCED CALCULATORS WITH FLEXIBLE RATES
    // ============================================

    // Enhanced mortgage calculator - user rate OR config default
    calculateMortgage(params) {
        console.log('calculateMortgage called:', params);
        try {
            const principal = params.principal || 300000;
            const years = params.years || 30;
            const country = params.country || 'US';
            
            // USER CAN INPUT RATE OR USE CONFIG DEFAULT
            const rate = params.rate || params.annualRate || this.config.getRate('mortgage30yr', country);
            console.log('Rate sources - rate:', params.rate, 'annualRate:', params.annualRate, 'config default:', this.config.getRate('mortgage30yr', country));
            console.log('Using rate:', rate, '%', params.rate ? '(User provided)' : '(Config default)');
            
            const monthlyRate = rate / 100 / 12;
            const payments = years * 12;
            
            // Calculate monthly payment
            const monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, payments)) / 
                           (Math.pow(1 + monthlyRate, payments) - 1);
            
            console.log('Monthly payment:', monthly);
            
            // Calculate totals
            const totalPaid = monthly * payments;
            const totalInterest = totalPaid - principal;
            
            // Return detailed result
            return {
                success: true,
                monthly: this.formatMoney(monthly, country),
                rate: rate.toFixed(2) + '%',
                country: country,
                totalPayment: this.formatMoney(totalPaid, country),
                totalInterest: this.formatMoney(totalInterest, country),
                principal: this.formatMoney(principal, country)
            };
        } catch (error) {
            console.error('Mortgage error:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // Enhanced investment calculator - user rate OR config default
    calculateInvestment(params) {
        try {
            const initial = params.initial || 10000;
            const monthly = params.monthly || 500;
            const years = params.years || 20;
            const country = params.country || 'US';
            
            // USER CAN INPUT RATE OR USE CONFIG DEFAULT
            const rate = params.rate || this.config.getRate('retirementReturn', country);
            
            const monthlyRate = rate / 100 / 12;
            const months = years * 12;
            
            // Future value calculations
            const futureValueInitial = initial * Math.pow(1 + monthlyRate, months);
            const futureValueContributions = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
            const future = futureValueInitial + futureValueContributions;
            
            // Totals
            const totalContributed = initial + (monthly * months);
            const totalEarnings = future - totalContributed;

            // Calculate annual return percentage
            const annualReturnPct = ((Math.pow(future / totalContributed, 1/years) - 1) * 100).toFixed(2);
    
            // DEBUG: Log what we're returning
            console.log('calculateInvestment returning:', {
                future: this.formatMoney(future, country),
                totalContributed: this.formatMoney(totalContributed, country),
                totalEarnings: this.formatMoney(totalEarnings, country),
                annualReturn: annualReturnPct + '%'
            });
        
            return {
                success: true,
                future: this.formatMoney(future, country),
                rate: rate.toFixed(2) + '%',
                totalContributed: this.formatMoney(totalContributed, country),
                totalEarnings: this.formatMoney(totalEarnings, country),
                annualReturn: annualReturnPct + '%',
                source: params.rate ? 'User rate' : 'Country default'
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // Enhanced retirement calculator
    calculateRetirement(params) {
        try {
            const currentAge = params.currentAge || 35;
            const retirementAge = params.retirementAge || 65;
            const currentSavings = params.currentSavings || 50000;
            const monthlySave = params.monthlySave || 1000;
            const desiredIncome = params.desiredIncome || 60000;
            const country = params.country || 'US';
            
            // USER CAN INPUT RATE OR USE CONFIG DEFAULT
            const rate = params.rate || this.config.getRate('retirementReturn', country);
            
            const years = retirementAge - currentAge;
            
            // Calculate savings at retirement
            const investment = this.calculateInvestment({
                initial: currentSavings,
                monthly: monthlySave,
                years: years,
                country: country,
                rate: rate // Pass the rate
            });
            
            if (!investment.success) {
                throw new Error(investment.error);
            }
            
            const savings = this.parseMoney(investment.future);

            // DEBUG: Check ALL values for retirement calculation
            console.log('Retirement calculation DEBUG for', country, ':', {
                investmentFuture: investment.future,
                savingsParsed: savings,
                safeWithdrawalRaw: savings * 0.04,
                investmentObject: investment,
                parseMoneyResult: this.parseMoney(investment.future)
            }); 

            const safeWithdrawal = savings * 0.04;
            const yearsCovered = savings / (desiredIncome || safeWithdrawal * 25);
            
            return {
                success: true,
                country: country,
                savingsAtRetirement: investment.future,
                safeWithdrawal: this.formatMoney(safeWithdrawal, country) + '/year',
                yearsCovered: yearsCovered.toFixed(1),
                readiness: yearsCovered >= 30 ? 'On track' : 'Need to save more',
                rateUsed: rate.toFixed(2) + '%',
                source: params.rate ? 'User rate' : 'Country default'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Enhanced loan payoff calculator
    calculateLoanPayoff(params) {
        try {
            const amount = params.amount || 25000;
            const country = params.country || 'US';
            
            // USER CAN INPUT RATE OR USE CONFIG DEFAULT
            const rate = params.rate || this.config.getRate('mortgage30yr', country);
            
            const minPayment = params.minPayment || 300;
            const extraPayment = params.extraPayment || 100;
            
            const monthlyRate = rate / 100 / 12;
            
            // Calculate with minimum payment
            let balanceMin = amount;
            let monthsMin = 0;
            let interestMin = 0;
            
            while (balanceMin > 0 && monthsMin < 600) {
                const interest = balanceMin * monthlyRate;
                interestMin += interest;
                const principal = minPayment - interest;
                balanceMin -= principal;
                monthsMin++;
            }
            
            // Calculate with extra payment
            let balanceExtra = amount;
            let monthsExtra = 0;
            let interestExtra = 0;
            const totalPayment = minPayment + extraPayment;
            
            while (balanceExtra > 0 && monthsExtra < 600) {
                const interest = balanceExtra * monthlyRate;
                interestExtra += interest;
                const principal = totalPayment - interest;
                balanceExtra -= principal;
                monthsExtra++;
            }
            
            return {
                success: true,
                country: country,
                rateUsed: rate.toFixed(2) + '%',
                withMinimum: {
                    months: monthsMin,
                    years: (monthsMin / 12).toFixed(1),
                    totalInterest: this.formatMoney(interestMin, country),
                    totalPaid: this.formatMoney(amount + interestMin, country)
                },
                withExtra: {
                    months: monthsExtra,
                    years: (monthsExtra / 12).toFixed(1),
                    totalInterest: this.formatMoney(interestExtra, country),
                    totalPaid: this.formatMoney(amount + interestExtra, country),
                    timeSaved: ((monthsMin - monthsExtra) / 12).toFixed(1) + ' years',
                    interestSaved: this.formatMoney(interestMin - interestExtra, country)
                },
                source: params.rate ? 'User rate' : 'Country default'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // NEW CALCULATORS FROM YOUR DRAFT
    // ============================================

    // Auto Loan Calculator (NEW)
    calculateAutoLoan(params) {
        try {
            const vehiclePrice = params.vehiclePrice || 30000;
            const downPayment = params.downPayment || 5000;
            const tradeInValue = params.tradeInValue || 0;
            const years = params.years || 5;
            const country = params.country || 'US';
            
            // USER CAN INPUT RATE OR USE CONFIG DEFAULT
            const rate = params.rate || this.config.getRate('autoLoan', country) || 6.5;
            
            // Sales tax and fees
            const salesTax = params.salesTax || this.config.getTaxRate(country) || 7;
            const fees = params.fees || 500;
            
            const taxAmount = vehiclePrice * (salesTax / 100);
            const totalCost = vehiclePrice + taxAmount + fees;
            const loanAmount = totalCost - downPayment - tradeInValue;
            
            if (loanAmount <= 0) {
                return {
                    success: true,
                    message: "No financing needed - you've covered the full cost!",
                    totalCost: this.formatMoney(totalCost, country)
                };
            }
            
            const monthlyRate = rate / 100 / 12;
            const numPayments = years * 12;
            
            // Monthly payment formula
            const monthlyPayment = loanAmount * 
                (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                (Math.pow(1 + monthlyRate, numPayments) - 1);
            
            const totalPaid = monthlyPayment * numPayments;
            const totalInterest = totalPaid - loanAmount;
            
            return {
                success: true,
                vehiclePrice: this.formatMoney(vehiclePrice, country),
                totalCost: this.formatMoney(totalCost, country),
                loanAmount: this.formatMoney(loanAmount, country),
                monthlyPayment: this.formatMoney(monthlyPayment, country),
                totalPaid: this.formatMoney(totalPaid, country),
                totalInterest: this.formatMoney(totalInterest, country),
                rate: rate.toFixed(2) + '%',
                years: years,
                country: country
            };
        } catch (error) {
            console.error('Auto loan error:', error);
            return { success: false, error: error.message };
        }
    }

    // Education Savings Calculator (NEW)
    calculateEducationSavings(params) {
        try {
            const currentAge = params.currentAge || 5;
            const collegeAge = params.collegeAge || 18;
            const currentCost = params.currentCost || 30000;
            const currentSavings = params.currentSavings || 5000;
            const monthlyContribution = params.monthlyContribution || 300;
            const country = params.country || 'US';
            
            // USER CAN INPUT RATES OR USE CONFIG DEFAULTS
            const inflationRate = params.inflationRate || 5.0;
            const expectedReturn = params.expectedReturn || this.config.getRate('retirementReturn', country) || 7.0;
            
            const yearsUntilCollege = collegeAge - currentAge;
            const collegeDuration = 4; // 4-year degree
            
            // Future cost of college (accounting for inflation)
            const futureCostPerYear = currentCost * Math.pow(1 + inflationRate / 100, yearsUntilCollege);
            
            // Total college cost (sum of 4 years with inflation)
            let totalCollegeCost = 0;
            for (let year = 0; year < collegeDuration; year++) {
                totalCollegeCost += currentCost * Math.pow(1 + inflationRate / 100, yearsUntilCollege + year);
            }
            
            // Calculate future value of savings
            const monthlyReturn = expectedReturn / 100 / 12;
            const monthsUntilCollege = yearsUntilCollege * 12;
            
            const futureValueCurrentSavings = currentSavings * Math.pow(1 + monthlyReturn, monthsUntilCollege);
            const futureValueContributions = monthlyContribution * 
                ((Math.pow(1 + monthlyReturn, monthsUntilCollege) - 1) / monthlyReturn);
            
            const totalSavingsAtCollege = futureValueCurrentSavings + futureValueContributions;
            const shortfall = Math.max(0, totalCollegeCost - totalSavingsAtCollege);
            
            // Calculate recommended monthly contribution
            let recommendedMonthly = monthlyContribution;
            if (shortfall > 0) {
                recommendedMonthly = (totalCollegeCost - futureValueCurrentSavings) / 
                    ((Math.pow(1 + monthlyReturn, monthsUntilCollege) - 1) / monthlyReturn);
            }
            
            const percentageCovered = (totalSavingsAtCollege / totalCollegeCost) * 100;
            
            return {
                success: true,
                yearsUntilCollege: yearsUntilCollege,
                currentCostPerYear: this.formatMoney(currentCost, country),
                futureCostPerYear: this.formatMoney(futureCostPerYear, country),
                totalCollegeCost: this.formatMoney(totalCollegeCost, country),
                totalSavingsAtCollege: this.formatMoney(totalSavingsAtCollege, country),
                shortfall: this.formatMoney(shortfall, country),
                percentageCovered: percentageCovered.toFixed(1) + '%',
                recommendedMonthly: this.formatMoney(recommendedMonthly, country),
                currentMonthly: this.formatMoney(monthlyContribution, country),
                onTrack: shortfall === 0,
                country: country,
                investmentReturn: expectedReturn.toFixed(2) + '%',
                inflationRate: inflationRate.toFixed(2) + '%'
            };
        } catch (error) {
            console.error('Education savings error:', error);
            return { success: false, error: error.message };
        }
    }


    // ============================================
    // GLOBAL CALCULATORS (FLEXIBLE RATES)
    // ============================================

    // Currency Converter with user rates OR defaults
    convertCurrency(params) {
        try {
            const amount = params.amount || 100;
            const fromCurrency = params.fromCurrency || 'USD';
            const toCurrency = params.toCurrency || 'EUR';
            
            // USER CAN PROVIDE CUSTOM RATES OR USE DEFAULTS
            const userRates = params.exchangeRates || null;
            
            // Default rates (fallback if user doesn't provide)
            const defaultRates = {
                'USD': 1.0, 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0,
                'CAD': 1.25, 'AUD': 1.35, 'CHF': 0.92, 'CNY': 6.45,
                'INR': 74.5, 'MXN': 20.0, 'BRL': 5.25, 'ZAR': 15.0
            };
            
            // Use user rates if provided, otherwise defaults
            const rates = userRates || defaultRates;
            
            // Check if currencies exist in rates
            if (!rates[fromCurrency] || !rates[toCurrency]) {
                return {
                    success: false,
                    error: `Currency not supported. Available: ${Object.keys(rates).join(', ')}`
                };
            }
            
            // Convert via USD (base)
            const amountInUSD = amount / rates[fromCurrency];
            const convertedAmount = amountInUSD * rates[toCurrency];
            const exchangeRate = rates[toCurrency] / rates[fromCurrency];
            
            return {
                success: true,
                originalAmount: amount,
                fromCurrency: fromCurrency,
                toCurrency: toCurrency,
                exchangeRate: exchangeRate.toFixed(6),
                convertedAmount: convertedAmount.toFixed(2),
                ratesUsed: userRates ? 'User-provided' : 'Default',
                message: `1 ${fromCurrency} = ${exchangeRate.toFixed(6)} ${toCurrency}`,
                availableCurrencies: Object.keys(rates)
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }


    // NPV Calculator for business investments
    calculateNPV(params) {
        try {
            const initialInvestment = params.initialInvestment || 10000;
            const cashFlows = params.cashFlows || [3000, 4000, 5000, 6000];
            const discountRate = params.discountRate || 10;
            
            let npv = -Math.abs(initialInvestment); // Initial investment is negative
            const yearlyPV = [];
            
            cashFlows.forEach((cashFlow, index) => {
                const year = index + 1;
                const discountFactor = Math.pow(1 + discountRate / 100, year);
                const presentValue = cashFlow / discountFactor;
                npv += presentValue;
                
                yearlyPV.push({
                    year: year,
                    cashFlow: cashFlow,
                    presentValue: presentValue.toFixed(2),
                    cumulativeNPV: npv.toFixed(2)
                });
            });
            
            // Profitability Index
            const totalPVInflows = yearlyPV.reduce((sum, y) => sum + parseFloat(y.presentValue), 0);
            const profitabilityIndex = totalPVInflows / Math.abs(initialInvestment);
            
            return {
                success: true,
                initialInvestment: initialInvestment.toFixed(2),
                discountRate: discountRate.toFixed(2),
                npv: npv.toFixed(2),
                profitabilityIndex: profitabilityIndex.toFixed(2),
                decision: npv > 0 ? 'Accept Project' : 'Reject Project',
                yearlyBreakdown: yearlyPV,
                interpretation: npv > 0 ? 
                    `Positive NPV: Project adds value` :
                    `Negative NPV: Project destroys value`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // IRR Calculator
    calculateIRR(params) {
        try {
            const initialInvestment = params.initialInvestment || 10000;
            const cashFlows = params.cashFlows || [3000, 4000, 5000, 6000];
            
            // Newton-Raphson method to find IRR
            let irr = 0.1; // Start with 10% guess
            const maxIterations = 1000;
            const tolerance = 0.00001;
            
            for (let i = 0; i < maxIterations; i++) {
                let npv = -Math.abs(initialInvestment);
                let dnpv = 0; // Derivative of NPV
                
                cashFlows.forEach((cashFlow, index) => {
                    const year = index + 1;
                    npv += cashFlow / Math.pow(1 + irr, year);
                    dnpv -= year * cashFlow / Math.pow(1 + irr, year + 1);
                });
                
                const newIRR = irr - npv / dnpv;
                
                if (Math.abs(newIRR - irr) < tolerance) {
                    irr = newIRR;
                    break;
                }
                
                irr = newIRR;
            }
            
            // Calculate payback period
            let cumulativeCashFlow = -Math.abs(initialInvestment);
            let paybackPeriod = 0;
            
            for (let i = 0; i < cashFlows.length; i++) {
                cumulativeCashFlow += cashFlows[i];
                if (cumulativeCashFlow >= 0) {
                    paybackPeriod = i + 1 - (cumulativeCashFlow - cashFlows[i]) / cashFlows[i];
                    break;
                }
            }
            
            return {
                success: true,
                irr: (irr * 100).toFixed(2),
                initialInvestment: initialInvestment.toFixed(2),
                totalCashFlows: cashFlows.reduce((a, b) => a + b, 0).toFixed(2),
                paybackPeriod: paybackPeriod.toFixed(2),
                interpretation: `Project returns ${(irr * 100).toFixed(2)}% annually`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Break-Even Analysis
    calculateBreakEven(params) {
        try {
            const fixedCosts = params.fixedCosts || 10000;
            const pricePerUnit = params.pricePerUnit || 100;
            const variableCostPerUnit = params.variableCostPerUnit || 40;
            
            // Break-even formula
            const contributionMargin = pricePerUnit - variableCostPerUnit;
            const contributionMarginRatio = (contributionMargin / pricePerUnit) * 100;
            const breakEvenUnits = fixedCosts / contributionMargin;
            const breakEvenRevenue = breakEvenUnits * pricePerUnit;
            
            // Analysis at different sales levels
            const analysis = [
                { label: '50% of Break-even', units: Math.round(breakEvenUnits * 0.5) },
                { label: 'Break-even', units: Math.round(breakEvenUnits) },
                { label: '120% of Break-even', units: Math.round(breakEvenUnits * 1.2) },
                { label: '150% of Break-even', units: Math.round(breakEvenUnits * 1.5) },
                { label: '200% of Break-even', units: Math.round(breakEvenUnits * 2) }
            ].map(level => {
                const revenue = level.units * pricePerUnit;
                const totalVariableCosts = level.units * variableCostPerUnit;
                const totalCosts = fixedCosts + totalVariableCosts;
                const profit = revenue - totalCosts;
                const profitMargin = (profit / revenue) * 100;
                
                return {
                    label: level.label,
                    units: level.units,
                    revenue: revenue.toFixed(2),
                    totalCosts: totalCosts.toFixed(2),
                    profit: profit.toFixed(2),
                    profitMargin: profitMargin.toFixed(2)
                };
            });
            
            return {
                success: true,
                fixedCosts: fixedCosts.toFixed(2),
                pricePerUnit: pricePerUnit.toFixed(2),
                variableCostPerUnit: variableCostPerUnit.toFixed(2),
                contributionMargin: contributionMargin.toFixed(2),
                contributionMarginRatio: contributionMarginRatio.toFixed(2),
                breakEvenUnits: Math.ceil(breakEvenUnits),
                breakEvenRevenue: breakEvenRevenue.toFixed(2),
                analysis: analysis,
                interpretation: `Sell ${Math.ceil(breakEvenUnits)} units to break even`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }


        // Cash Flow Projector
    calculateCashFlow(params) {
        try {
            const startingCash = params.startingCash || 50000;
            const monthlyRevenue = params.monthlyRevenue || Array(12).fill(10000);
            const monthlyExpenses = params.monthlyExpenses || Array(12).fill(8000);
            const accountsReceivableDays = params.accountsReceivableDays || 30;
            const accountsPayableDays = params.accountsPayableDays || 30;
            
            let cashBalance = startingCash;
            const projections = [];
            
            // Calculate collection and payment delays
            const collectionDelay = Math.floor(accountsReceivableDays / 30);
            const paymentDelay = Math.floor(accountsPayableDays / 30);
            
            for (let month = 0; month < 12; month++) {
                // Cash collections (from sales made N months ago)
                const collectionsMonth = month - collectionDelay;
                const cashIn = collectionsMonth >= 0 ? 
                    monthlyRevenue[collectionsMonth] : 
                    (collectionsMonth === -1 ? monthlyRevenue[0] * 0.5 : 0);
                
                // Cash payments (for expenses from N months ago)
                const paymentsMonth = month - paymentDelay;
                const cashOut = paymentsMonth >= 0 ? 
                    monthlyExpenses[paymentsMonth] : 
                    (paymentsMonth === -1 ? monthlyExpenses[0] * 0.5 : 0);
                
                const netCashFlow = cashIn - cashOut;
                cashBalance += netCashFlow;
                
                projections.push({
                    month: month + 1,
                    revenue: monthlyRevenue[month].toFixed(2),
                    expenses: monthlyExpenses[month].toFixed(2),
                    cashIn: cashIn.toFixed(2),
                    cashOut: cashOut.toFixed(2),
                    netCashFlow: netCashFlow.toFixed(2),
                    endingBalance: cashBalance.toFixed(2),
                    status: cashBalance < 0 ? 'Deficit' : 'Surplus'
                });
            }
            
            // Summary statistics
            const totalRevenue = monthlyRevenue.reduce((a, b) => a + b, 0);
            const totalExpenses = monthlyExpenses.reduce((a, b) => a + b, 0);
            const totalCashFlow = totalRevenue - totalExpenses;
            const minBalance = Math.min(...projections.map(p => parseFloat(p.endingBalance)));
            const maxBalance = Math.max(...projections.map(p => parseFloat(p.endingBalance)));
            
            return {
                success: true,
                startingCash: startingCash.toFixed(2),
                endingCash: cashBalance.toFixed(2),
                totalRevenue: totalRevenue.toFixed(2),
                totalExpenses: totalExpenses.toFixed(2),
                netCashFlow: totalCashFlow.toFixed(2),
                minBalance: minBalance.toFixed(2),
                maxBalance: maxBalance.toFixed(2),
                monthsInDeficit: projections.filter(p => p.status === 'Deficit').length,
                projections: projections,
                warning: minBalance < 0 ? `Warning: Cash deficit in ${projections.filter(p => p.status === 'Deficit').length} months` : null
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }


    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    // Format money with country symbol
    formatMoney(amount, country) {
        if (!this.config || !this.config.countryData) {
            return '$' + amount.toFixed(2);
        }
        
        const countryInfo = this.config.countryData[country];
        const symbol = countryInfo ? countryInfo.symbol : '$';
        return symbol + amount.toFixed(2);
    }

    // Helper: Parse money string back to number - FINAL FIX
    parseMoney(moneyString) {
        if (typeof moneyString !== 'string') {
            return parseFloat(moneyString) || 0;
        }
        
        // Remove ALL non-numeric characters except digits, dots, commas, and minus signs
        let numericString = moneyString.replace(/[^\d.,-]/g, '');
        
        // If string is empty, return 0
        if (!numericString) return 0;
        
        // FIX: Handle currency symbols that contain dots (like Arabic "د.إ")
        // If the string starts with a dot, remove it (it's part of currency symbol, not number)
        if (numericString.startsWith('.')) {
            numericString = numericString.substring(1);
        }
        
        // Remove ALL commas (they're thousand separators in our format)
        const cleanString = numericString.replace(/,/g, '');
        
        const result = parseFloat(cleanString);
        return isNaN(result) ? 0 : result;
    }


    // Get all available countries
    getAvailableCountries() {
        if (!this.config || !this.config.getCountries) {
            return ['US', 'UK', 'CN', 'RU'];
        }
        return this.config.getCountries();
    }

    // Update country settings
    setCountry(countryCode) {
        if (this.config && this.config.updateSettings) {
            this.config.updateSettings({ country: countryCode });
            return true;
        }
        return false;
    }
}

// Make available in browser
if (typeof window !== 'undefined') {
    window.FinancialCalculators = FinancialCalculators;
    console.log('FinancialCalculators registered to window');
}
