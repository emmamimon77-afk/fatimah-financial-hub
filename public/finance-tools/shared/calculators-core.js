/**
 * Core Financial Calculators - Universal Formulas
 * Works for all countries with flexible rate inputs
 */

const FinancialCalculators = {
  
  // ============================================
  // PERSONAL FINANCE CALCULATORS
  // ============================================

  /**
   * 1. MORTGAGE CALCULATOR
   * Universal formula works for all countries
   * 
   * @param {number} principal - Loan amount
   * @param {number} annualRate - Annual interest rate (percentage, e.g., 5.5)
   * @param {number} years - Loan term in years
   * @param {number} downPayment - Down payment amount (optional)
   * @param {number} propertyTax - Annual property tax (optional, percentage)
   * @param {number} insurance - Annual insurance cost (optional)
   * @param {number} hoa - Monthly HOA/maintenance fee (optional)
   * @returns {object} Complete mortgage breakdown
   */
  calculateMortgage(principal, annualRate, years, downPayment = 0, propertyTax = 0, insurance = 0, hoa = 0) {
    const loanAmount = principal - downPayment;
    const monthlyRate = (annualRate / 100) / 12;
    const numPayments = years * 12;
    
    // Monthly payment formula: M = P[r(1+r)^n]/[(1+r)^n-1]
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Additional monthly costs
    const monthlyPropertyTax = (principal * propertyTax / 100) / 12;
    const monthlyInsurance = insurance / 12;
    const totalMonthlyPayment = monthlyPayment + monthlyPropertyTax + monthlyInsurance + hoa;
    
    // Total costs
    const totalPrincipalInterest = monthlyPayment * numPayments;
    const totalInterest = totalPrincipalInterest - loanAmount;
    const totalCost = totalPrincipalInterest + (monthlyPropertyTax + monthlyInsurance + hoa) * numPayments;
    
    // Amortization schedule
    let balance = loanAmount;
    const schedule = [];
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    
    for (let month = 1; month <= numPayments; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      
      totalInterestPaid += interestPayment;
      totalPrincipalPaid += principalPayment;
      
      // Save yearly summary
      if (month % 12 === 0 || month === numPayments) {
        schedule.push({
          year: Math.ceil(month / 12),
          month: month,
          monthlyPayment: monthlyPayment,
          principalPayment: principalPayment,
          interestPayment: interestPayment,
          remainingBalance: Math.max(0, balance),
          totalInterestPaid: totalInterestPaid,
          totalPrincipalPaid: totalPrincipalPaid
        });
      }
    }
    
    return {
      loanAmount: loanAmount.toFixed(2),
      monthlyPayment: monthlyPayment.toFixed(2),
      monthlyPropertyTax: monthlyPropertyTax.toFixed(2),
      monthlyInsurance: monthlyInsurance.toFixed(2),
      monthlyHOA: hoa.toFixed(2),
      totalMonthlyPayment: totalMonthlyPayment.toFixed(2),
      totalPrincipalInterest: totalPrincipalInterest.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      totalCost: totalCost.toFixed(2),
      downPayment: downPayment.toFixed(2),
      schedule: schedule
    };
  },

  /**
   * 2. LOAN PAYOFF CALCULATOR
   * Calculate time and interest saved with extra payments
   * 
   * @param {number} currentBalance - Current loan balance
   * @param {number} annualRate - Annual interest rate (percentage)
   * @param {number} minimumPayment - Minimum monthly payment
   * @param {number} extraPayment - Additional monthly payment
   * @returns {object} Payoff analysis
   */
  calculateLoanPayoff(currentBalance, annualRate, minimumPayment, extraPayment = 0) {
    const monthlyRate = (annualRate / 100) / 12;
    const totalPayment = minimumPayment + extraPayment;
    
    // Calculate with extra payments
    let balance = currentBalance;
    let months = 0;
    let totalInterest = 0;
    const payments = [];
    
    while (balance > 0 && months < 600) { // Max 50 years
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(totalPayment - interestPayment, balance);
      
      totalInterest += interestPayment;
      balance -= principalPayment;
      months++;
      
      if (months <= 12 || months % 12 === 0 || balance <= 0) {
        payments.push({
          month: months,
          payment: Math.min(totalPayment, balance + interestPayment),
          principal: principalPayment,
          interest: interestPayment,
          balance: Math.max(0, balance)
        });
      }
      
      if (balance <= 0) break;
    }
    
    // Calculate without extra payments
    let balanceMin = currentBalance;
    let monthsMin = 0;
    let totalInterestMin = 0;
    
    while (balanceMin > 0 && monthsMin < 600) {
      const interestPayment = balanceMin * monthlyRate;
      const principalPayment = Math.min(minimumPayment - interestPayment, balanceMin);
      
      totalInterestMin += interestPayment;
      balanceMin -= principalPayment;
      monthsMin++;
      
      if (balanceMin <= 0) break;
    }
    
    return {
      withExtraPayments: {
        months: months,
        years: (months / 12).toFixed(1),
        totalInterest: totalInterest.toFixed(2),
        totalPaid: (currentBalance + totalInterest).toFixed(2),
        monthlyPayment: totalPayment.toFixed(2)
      },
      withoutExtraPayments: {
        months: monthsMin,
        years: (monthsMin / 12).toFixed(1),
        totalInterest: totalInterestMin.toFixed(2),
        totalPaid: (currentBalance + totalInterestMin).toFixed(2),
        monthlyPayment: minimumPayment.toFixed(2)
      },
      savings: {
        months: monthsMin - months,
        years: ((monthsMin - months) / 12).toFixed(1),
        interest: (totalInterestMin - totalInterest).toFixed(2),
        total: (totalInterestMin - totalInterest).toFixed(2)
      },
      paymentSchedule: payments
    };
  },

  /**
   * 3. AUTO LOAN CALCULATOR
   * Calculate car loan payments with trade-in and fees
   * 
   * @param {number} vehiclePrice - Price of vehicle
   * @param {number} downPayment - Down payment amount
   * @param {number} tradeInValue - Trade-in vehicle value
   * @param {number} annualRate - Annual interest rate (percentage)
   * @param {number} years - Loan term in years
   * @param {number} salesTax - Sales tax rate (percentage)
   * @param {number} fees - Registration/documentation fees
   * @returns {object} Auto loan details
   */
  calculateAutoLoan(vehiclePrice, downPayment, tradeInValue, annualRate, years, salesTax = 0, fees = 0) {
    // Calculate total amount financed
    const taxAmount = vehiclePrice * (salesTax / 100);
    const totalCost = vehiclePrice + taxAmount + fees;
    const loanAmount = totalCost - downPayment - tradeInValue;
    
    if (loanAmount <= 0) {
      return {
        loanAmount: 0,
        monthlyPayment: 0,
        totalPaid: totalCost,
        totalInterest: 0,
        message: "No financing needed - you've covered the full cost!"
      };
    }
    
    const monthlyRate = (annualRate / 100) / 12;
    const numPayments = years * 12;
    
    // Monthly payment formula
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    const totalPaid = monthlyPayment * numPayments;
    const totalInterest = totalPaid - loanAmount;
    
    // Payment breakdown
    let balance = loanAmount;
    const schedule = [];
    
    for (let month = 1; month <= Math.min(numPayments, 60); month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      
      if (month <= 12 || month % 12 === 0) {
        schedule.push({
          month: month,
          payment: monthlyPayment,
          principal: principalPayment,
          interest: interestPayment,
          balance: Math.max(0, balance)
        });
      }
    }
    
    return {
      vehiclePrice: vehiclePrice.toFixed(2),
      salesTax: taxAmount.toFixed(2),
      fees: fees.toFixed(2),
      totalCost: totalCost.toFixed(2),
      downPayment: downPayment.toFixed(2),
      tradeInValue: tradeInValue.toFixed(2),
      loanAmount: loanAmount.toFixed(2),
      monthlyPayment: monthlyPayment.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      totalOutOfPocket: (downPayment + totalPaid).toFixed(2),
      schedule: schedule
    };
  },

  /**
   * 4. EDUCATION SAVINGS CALCULATOR (529/College Savings)
   * Plan for future education costs
   * 
   * @param {number} currentAge - Child's current age
   * @param {number} collegeAge - Age when starting college (typically 18)
   * @param {number} currentCost - Current annual college cost
   * @param {number} inflationRate - Education inflation rate (typically 5-6%)
   * @param {number} currentSavings - Current amount saved
   * @param {number} monthlyContribution - Monthly contribution amount
   * @param {number} expectedReturn - Expected annual investment return (percentage)
   * @returns {object} Education savings projection
   */
  calculateEducationSavings(currentAge, collegeAge, currentCost, inflationRate, currentSavings, monthlyContribution, expectedReturn) {
    const yearsUntilCollege = collegeAge - currentAge;
    const collegeDuration = 4; // Standard 4-year degree
    
    // Future cost of college (accounting for inflation)
    const futureCostPerYear = currentCost * Math.pow(1 + inflationRate / 100, yearsUntilCollege);
    
    // Total college cost (sum of 4 years with inflation)
    let totalCollegeCost = 0;
    for (let year = 0; year < collegeDuration; year++) {
      totalCollegeCost += currentCost * Math.pow(1 + inflationRate / 100, yearsUntilCollege + year);
    }
    
    // Calculate future value of current savings
    const monthlyReturn = expectedReturn / 100 / 12;
    const monthsUntilCollege = yearsUntilCollege * 12;
    
    const futureValueCurrentSavings = currentSavings * Math.pow(1 + monthlyReturn, monthsUntilCollege);
    
    // Future value of monthly contributions
    const futureValueContributions = monthlyContribution * 
      ((Math.pow(1 + monthlyReturn, monthsUntilCollege) - 1) / monthlyReturn);
    
    const totalSavingsAtCollege = futureValueCurrentSavings + futureValueContributions;
    const shortfall = Math.max(0, totalCollegeCost - totalSavingsAtCollege);
    const surplus = Math.max(0, totalSavingsAtCollege - totalCollegeCost);
    
    // Calculate monthly payment needed to cover shortfall
    let recommendedMonthly = monthlyContribution;
    if (shortfall > 0) {
      recommendedMonthly = (totalCollegeCost - futureValueCurrentSavings) / 
        ((Math.pow(1 + monthlyReturn, monthsUntilCollege) - 1) / monthlyReturn);
    }
    
    // Year-by-year projection
    let savingsBalance = currentSavings;
    const yearlyProjection = [];
    
    for (let year = 1; year <= yearsUntilCollege; year++) {
      for (let month = 1; month <= 12; month++) {
        savingsBalance = savingsBalance * (1 + monthlyReturn) + monthlyContribution;
      }
      
      yearlyProjection.push({
        year: year,
        age: currentAge + year,
        balance: savingsBalance,
        contributed: currentSavings + (monthlyContribution * 12 * year),
        earnings: savingsBalance - currentSavings - (monthlyContribution * 12 * year)
      });
    }
    
    return {
      yearsUntilCollege: yearsUntilCollege,
      currentCostPerYear: currentCost.toFixed(2),
      futureCostPerYear: futureCostPerYear.toFixed(2),
      totalCollegeCost: totalCollegeCost.toFixed(2),
      currentSavings: currentSavings.toFixed(2),
      monthlyContribution: monthlyContribution.toFixed(2),
      totalSavingsAtCollege: totalSavingsAtCollege.toFixed(2),
      shortfall: shortfall.toFixed(2),
      surplus: surplus.toFixed(2),
      recommendedMonthly: recommendedMonthly.toFixed(2),
      percentageCovered: ((totalSavingsAtCollege / totalCollegeCost) * 100).toFixed(1),
      yearlyProjection: yearlyProjection,
      onTrack: shortfall === 0
    };
  },

  /**
   * 5. RETIREMENT PLANNER
   * Comprehensive retirement planning calculator
   * 
   * @param {number} currentAge - Current age
   * @param {number} retirementAge - Target retirement age
   * @param {number} currentSavings - Current retirement savings
   * @param {number} monthlyContribution - Monthly contribution
   * @param {number} employerMatch - Employer match percentage (e.g., 50 for 50%)
   * @param {number} matchLimit - Employer match limit (percentage of salary)
   * @param {number} annualSalary - Current annual salary
   * @param {number} expectedReturn - Expected annual return (percentage)
   * @param {number} desiredAnnualIncome - Desired annual retirement income
   * @param {number} retirementDuration - Expected years in retirement
   * @param {number} inflationRate - Expected inflation rate (percentage)
   * @param {number} socialSecurity - Expected annual social security benefit
   * @returns {object} Complete retirement analysis
   */
  calculateRetirement(currentAge, retirementAge, currentSavings, monthlyContribution, 
                      employerMatch, matchLimit, annualSalary, expectedReturn, 
                      desiredAnnualIncome, retirementDuration, inflationRate, socialSecurity = 0) {
    const yearsToRetirement = retirementAge - currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyReturn = expectedReturn / 100 / 12;
    
    // Calculate employer match
    const matchAmount = Math.min(
      monthlyContribution * (employerMatch / 100),
      (annualSalary * matchLimit / 100) / 12
    );
    
    const totalMonthlyContribution = monthlyContribution + matchAmount;
    
    // Future value at retirement
    const fvCurrentSavings = currentSavings * Math.pow(1 + monthlyReturn, monthsToRetirement);
    const fvContributions = totalMonthlyContribution * 
      ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);
    
    const totalAtRetirement = fvCurrentSavings + fvContributions;
    
    // Adjust desired income for inflation
    const inflationAdjustedIncome = desiredAnnualIncome * 
      Math.pow(1 + inflationRate / 100, yearsToRetirement);
    
    // Net income needed (after social security)
    const netIncomeNeeded = inflationAdjustedIncome - socialSecurity;
    
    // Calculate how long savings will last in retirement
    // Using present value of annuity formula considering withdrawals and continued growth
    const retirementMonthlyReturn = (expectedReturn - inflationRate) / 100 / 12; // Real return
    const monthlyWithdrawal = netIncomeNeeded / 12;
    
    // Calculate if savings can sustain retirement
    let monthsSupported = 0;
    if (retirementMonthlyReturn > 0) {
      monthsSupported = -Math.log(1 - (monthlyWithdrawal * retirementMonthlyReturn) / (totalAtRetirement * retirementMonthlyReturn)) / 
                        Math.log(1 + retirementMonthlyReturn);
    } else {
      monthsSupported = totalAtRetirement / monthlyWithdrawal;
    }
    
    const yearsSupported = monthsSupported / 12;
    
    // Calculate savings needed for target retirement duration
    const savingsNeeded = monthlyWithdrawal * 
      ((1 - Math.pow(1 + retirementMonthlyReturn, -retirementDuration * 12)) / retirementMonthlyReturn);
    
    const shortfall = Math.max(0, savingsNeeded - totalAtRetirement);
    
    // Recommended monthly contribution to meet goal
    let recommendedMonthly = totalMonthlyContribution;
    if (shortfall > 0) {
      const neededFromContributions = savingsNeeded - fvCurrentSavings;
      recommendedMonthly = neededFromContributions / 
        ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);
      recommendedMonthly = recommendedMonthly / (1 + employerMatch / 100); // Account for match
    }
    
    // Year-by-year projection
    let balance = currentSavings;
    const yearlyProjection = [];
    
    for (let year = 1; year <= yearsToRetirement; year++) {
      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyReturn) + totalMonthlyContribution;
      }
      
      yearlyProjection.push({
        year: year,
        age: currentAge + year,
        balance: balance,
        totalContributed: currentSavings + (totalMonthlyContribution * 12 * year),
        earnings: balance - currentSavings - (totalMonthlyContribution * 12 * year)
      });
    }
    
    // Replacement ratio
    const replacementRatio = (desiredAnnualIncome / annualSalary) * 100;
    
    return {
      yearsToRetirement: yearsToRetirement,
      totalAtRetirement: totalAtRetirement.toFixed(2),
      currentSavings: currentSavings.toFixed(2),
      monthlyContribution: monthlyContribution.toFixed(2),
      employerMatch: matchAmount.toFixed(2),
      totalMonthlyContribution: totalMonthlyContribution.toFixed(2),
      desiredAnnualIncome: desiredAnnualIncome.toFixed(2),
      inflationAdjustedIncome: inflationAdjustedIncome.toFixed(2),
      socialSecurityBenefit: socialSecurity.toFixed(2),
      netIncomeNeeded: netIncomeNeeded.toFixed(2),
      savingsNeeded: savingsNeeded.toFixed(2),
      shortfall: shortfall.toFixed(2),
      surplus: Math.max(0, totalAtRetirement - savingsNeeded).toFixed(2),
      yearsSupported: yearsSupported.toFixed(1),
      recommendedMonthly: recommendedMonthly.toFixed(2),
      replacementRatio: replacementRatio.toFixed(1),
      onTrack: shortfall === 0 && yearsSupported >= retirementDuration,
      yearlyProjection: yearlyProjection
    };
  },

  // ============================================
  // INVESTMENT CALCULATORS
  // ============================================

  /**
   * 6. INVESTMENT GROWTH CALCULATOR
   * Calculate compound growth with regular contributions
   */
  calculateInvestmentGrowth(initial, monthlyContribution, annualReturn, years, taxRate = 0) {
    const monthlyReturn = annualReturn / 100 / 12;
    const months = years * 12;
    
    // Future value calculation
    const fvInitial = initial * Math.pow(1 + monthlyReturn, months);
    const fvContributions = monthlyContribution * 
      ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
    
    const totalValue = fvInitial + fvContributions;
    const totalContributed = initial + (monthlyContribution * months);
    const totalEarnings = totalValue - totalContributed;
    const taxOnEarnings = totalEarnings * (taxRate / 100);
    const afterTaxValue = totalValue - taxOnEarnings;
    
    // Year-by-year breakdown
    let balance = initial;
    const yearlyBreakdown = [];
    
    for (let year = 1; year <= years; year++) {
      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyReturn) + monthlyContribution;
      }
      
      const contributed = initial + (monthlyContribution * 12 * year);
      const earnings = balance - contributed;
      
      yearlyBreakdown.push({
        year: year,
        balance: balance,
        contributed: contributed,
        earnings: earnings,
        returnPercent: ((earnings / contributed) * 100).toFixed(2)
      });
    }
    
    return {
      initialInvestment: initial.toFixed(2),
      monthlyContribution: monthlyContribution.toFixed(2),
      years: years,
      annualReturn: annualReturn.toFixed(2),
      totalContributed: totalContributed.toFixed(2),
      totalEarnings: totalEarnings.toFixed(2),
      totalValue: totalValue.toFixed(2),
      taxOnEarnings: taxOnEarnings.toFixed(2),
      afterTaxValue: afterTaxValue.toFixed(2),
      totalReturnPercent: ((totalEarnings / totalContributed) * 100).toFixed(2),
      yearlyBreakdown: yearlyBreakdown
    };
  },

  /**
   * 7. STOCK VALUATION CALCULATOR
   * DCF and comparable analysis
   */
  calculateStockValuation(currentPrice, eps, growthRate, discountRate, terminalGrowthRate, peRatio, industryPE) {
    // Discounted Cash Flow (DCF) valuation
    const projectionYears = 5;
    let presentValue = 0;
    
    for (let year = 1; year <= projectionYears; year++) {
      const futureEPS = eps * Math.pow(1 + growthRate / 100, year);
      const discountFactor = Math.pow(1 + discountRate / 100, year);
      presentValue += futureEPS / discountFactor;
    }
    
    // Terminal value
    const terminalEPS = eps * Math.pow(1 + growthRate / 100, projectionYears) * 
                        (1 + terminalGrowthRate / 100);
    const terminalValue = terminalEPS / ((discountRate - terminalGrowthRate) / 100);
    const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate / 100, projectionYears);
    
    const intrinsicValue = presentValue + discountedTerminalValue;
    
    // P/E based valuation
    const fairValuePE = eps * peRatio;
    const fairValueIndustryPE = eps * industryPE;
    
    // Analysis
    const upside = ((intrinsicValue - currentPrice) / currentPrice) * 100;
    const margin = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;
    
    return {
      currentPrice: currentPrice.toFixed(2),
      eps: eps.toFixed(2),
      peRatio: peRatio.toFixed(2),
      intrinsicValueDCF: intrinsicValue.toFixed(2),
      fairValuePE: fairValuePE.toFixed(2),
      fairValueIndustryPE: fairValueIndustryPE.toFixed(2),
      upside: upside.toFixed(2),
      marginOfSafety: margin.toFixed(2),
      recommendation: upside > 20 ? 'Undervalued' : upside < -20 ? 'Overvalued' : 'Fairly Valued'
    };
  },

  /**
   * 8. REAL ESTATE INVESTMENT CALCULATOR
   * Calculate ROI, cash flow, and returns
   */
  calculateRealEstateInvestment(purchasePrice, downPayment, closingCosts, rehabCosts, 
                                 monthlyRent, vacancyRate, propertyTax, insurance, 
                                 maintenance, propertyManagement, annualRate, years) {
    // Initial investment
    const totalInitialInvestment = downPayment + closingCosts + rehabCosts;
    const loanAmount = purchasePrice - downPayment;
    
    // Mortgage calculation
    const mortgage = this.calculateMortgage(purchasePrice, annualRate, years, downPayment, 0, 0, 0);
    const monthlyMortgage = parseFloat(mortgage.monthlyPayment);
    
    // Monthly income
    const effectiveMonthlyRent = monthlyRent * (1 - vacancyRate / 100);
    
    // Monthly expenses
    const monthlyPropertyTax = (purchasePrice * propertyTax / 100) / 12;
    const monthlyInsurance = insurance / 12;
    const monthlyMaintenance = maintenance / 12;
    const monthlyManagement = effectiveMonthlyRent * (propertyManagement / 100);
    
    const totalMonthlyExpenses = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + 
                                 monthlyMaintenance + monthlyManagement;
    
    // Cash flow
    const monthlyCashFlow = effectiveMonthlyRent - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;
    
    // Returns
    const cashOnCashReturn = (annualCashFlow / totalInitialInvestment) * 100;
    const capRate = ((effectiveMonthlyRent * 12 - (totalMonthlyExpenses - monthlyMortgage) * 12) / purchasePrice) * 100;
    
    // 5-year projection
    const appreciationRate = 3; // Assume 3% annual appreciation
    const futureValue = purchasePrice * Math.pow(1 + appreciationRate / 100, 5);
    const equityBuilt = totalInitialInvestment + (annualCashFlow * 5);
    const totalReturn = ((futureValue - purchasePrice + annualCashFlow * 5) / totalInitialInvestment) * 100;
    
    return {
      purchasePrice: purchasePrice.toFixed(2),
      totalInitialInvestment: totalInitialInvestment.toFixed(2),
      loanAmount: loanAmount.toFixed(2),
      monthlyRent: monthlyRent.toFixed(2),
      effectiveMonthlyRent: effectiveMonthlyRent.toFixed(2),
      monthlyExpenses: {
        mortgage: monthlyMortgage.toFixed(2),
        propertyTax: monthlyPropertyTax.toFixed(2),
        insurance: monthlyInsurance.toFixed(2),
        maintenance: monthlyMaintenance.toFixed(2),
        management: monthlyManagement.toFixed(2),
        total: totalMonthlyExpenses.toFixed(2)
      },
      monthlyCashFlow: monthlyCashFlow.toFixed(2),
      annualCashFlow: annualCashFlow.toFixed(2),
      cashOnCashReturn: cashOnCashReturn.toFixed(2),
      capRate: capRate.toFixed(2),
      fiveYearProjection: {
        futureValue: futureValue.toFixed(2),
        equityBuilt: equityBuilt.toFixed(2),
        totalReturn: totalReturn.toFixed(2)
      },
      investmentQuality: cashOnCashReturn > 8 ? 'Excellent' : cashOnCashReturn > 5 ? 'Good' : 'Fair'
    };
  }

};

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinancialCalculators;
} else if (typeof window !== 'undefined') {
  window.FinancialCalculators = FinancialCalculators;
}
