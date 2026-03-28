// modules/ui-controls.js
// Country selector and shared UI components
// UPDATED: Now auto-fills calculator input fields when country changes

class UIControls {
    constructor() {
        this.config = window.FinancialConfig;
        this.calculators = window.FinancialCalculators ? 
            (typeof window.FinancialCalculators === 'function' ? new window.FinancialCalculators() : window.FinancialCalculators) : 
            null;
        this.onCountryChangeCallback = null;
    }

    // Create country selector dropdown
    createCountrySelector(containerId, onCountryChange = null) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        // Store callback for country change
        this.onCountryChangeCallback = onCountryChange;

        // Get countries from config
        const countries = this.config.getCountries ? this.config.getCountries() : [
            { code: 'US', name: 'United States', symbol: '$' },
            { code: 'CN', name: 'China', symbol: '¥' },
            { code: 'RU', name: 'Russia', symbol: '₽' },
            { code: 'UK', name: 'United Kingdom', symbol: '£' },
            { code: 'EU', name: 'European Union', symbol: '€' },
            { code: 'JP', name: 'Japan', symbol: '¥' },
            { code: 'IN', name: 'India', symbol: '₹' },
            { code: 'AU', name: 'Australia', symbol: 'A$' }
        ];

        // Create select element
        const select = document.createElement('select');
        select.id = 'country-selector';
        select.className = 'country-select';
        select.innerHTML = '<option value="">Select Country</option>';

        // Add country options
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.name} (${country.symbol})`;
            select.appendChild(option);
        });

        // Set current country
        const currentCountry = this.config.userSettings?.country || 'US';
        select.value = currentCountry;

        // Add change event - NOW ASYNC
        select.addEventListener('change', async (e) => {
            const countryCode = e.target.value;
            if (countryCode) {
                await this.setCountry(countryCode);
                if (this.onCountryChangeCallback) this.onCountryChangeCallback(countryCode);
            }
        });

        // Clear and append
        container.innerHTML = '';
        container.appendChild(select);

        // Initial display update
        setTimeout(async () => {
            await this.updateCountryDisplay(currentCountry);
        }, 100);

        return select;
    }

    // Set country in config - NOW ASYNC
    async setCountry(countryCode) {
        if (this.config.updateSettings) {
            this.config.updateSettings({ country: countryCode });
            console.log('Country set to:', countryCode);
            
            // Update UI to show selected country - NOW ASYNC
            await this.updateCountryDisplay(countryCode);
            return true;
        }
        return false;
    }

    // Update country display - NOW ASYNC
    async updateCountryDisplay(countryCode) {
        const country = this.config.countryData[countryCode];
        if (!country) return;

        // Update all currency symbols on page
        document.querySelectorAll('.currency-symbol').forEach(el => {
            el.textContent = country.symbol;
        });

        // Update country name display
        document.querySelectorAll('.country-name').forEach(el => {
            el.textContent = country.name;
        });

        // Update rate displays - NOW ASYNC
        await this.updateRateDisplays(countryCode);
    }

    // Update rate displays for current country - NOW ASYNC
    async updateRateDisplays(countryCode) {
        console.log(`updateRateDisplays called for ${countryCode}`);
        
        try {
            let mortgageRate, investmentRate, inflationRate, centralBankRate;
            
            // For US: Try to get live rates first
            if (countryCode === 'US' && window.RealTimeRates) {
                try {
                    const usRates = await window.RealTimeRates.fetchUSRates();
                    if (usRates) {
                        mortgageRate = usRates.mortgage30yr;
                        investmentRate = usRates.investmentReturn;
                        centralBankRate = usRates.fedFundsRate;
                        
                        // Convert CPI index to inflation percentage (simplified)
                        // CPI of 326.03 means 3.26x base, annual inflation roughly:
                        inflationRate = ((usRates.inflationRate / 100 - 1) * 100).toFixed(1);
                    }
                } catch (liveError) {
                    console.warn('Live rates failed, using config:', liveError);
                }
            }
            
            // If live rates failed or not US, use config rates
            if (mortgageRate === undefined) {
                mortgageRate = await this.config.getRate('mortgage30yr', countryCode);
            }
            if (investmentRate === undefined) {
                investmentRate = await this.config.getRate('retirementReturn', countryCode);
            }
            if (inflationRate === undefined) {
                inflationRate = await this.config.getRate('inflation', countryCode);
            }
            if (centralBankRate === undefined) {
                centralBankRate = await this.config.getRate('centralBank', countryCode);
            }
            
            console.log('Rates fetched:', { mortgageRate, investmentRate, inflationRate, centralBankRate });
            
            // Prepare rates object with safe numbers
            const rates = {
                'mortgage': parseFloat(mortgageRate) || 0,
                'investment': parseFloat(investmentRate) || 0,
                'inflation': parseFloat(inflationRate) || 0,
                'centralBank': parseFloat(centralBankRate) || 0
            };

            console.log('Processed rates:', rates);
            
            // ✅ FIXED: Don't try to update non-existent `.mortgage-rate` and `.investment-rate` class displays
            // Instead, we'll update them in updateCalculatorRateDisplays where we handle the actual HTML structure
            
            // Also update specific calculator displays
            await this.updateCalculatorRateDisplays(countryCode, rates);
            
        } catch (error) {
            console.error('Error updating rate displays:', error);
            // Don't show N/A - rates should always come from config
        }
    }
    
    // Update calculator-specific rate displays
    async updateCalculatorRateDisplays(countryCode, rates) {
        const country = this.config.countryData[countryCode];
        const countryName = country ? country.name : countryCode;
        
        console.log(`Updating calculator displays for ${countryName} with rates:`, rates);
        
        // ✅ FIXED: Update investment calculator display (class="investment-rate")
        const investmentRateElements = document.querySelectorAll('.investment-rate');
        investmentRateElements.forEach(el => {
            el.textContent = rates.investment.toFixed(2) + '%';
            
            // ✅ FIXED: Update the parent .current-rate text
            const parent = el.closest('.current-rate');
            if (parent) {
                // Check if this is an investment display
                if (parent.textContent.includes('Current') && parent.textContent.includes('return:')) {
                    parent.innerHTML = `Current <span class="country-name">${countryName}</span> return: <span class="investment-rate">${rates.investment.toFixed(2)}%</span>`;
                }
            }
        });
        
        // ✅ FIXED: Update retirement calculator display (class="retirement-rate")
        const retirementRateElements = document.querySelectorAll('.retirement-rate');
        retirementRateElements.forEach(el => {
            el.textContent = rates.investment.toFixed(2) + '%'; // Uses same rate as investment
            
            // ✅ FIXED: Update the parent .current-rate text
            const parent = el.closest('.current-rate');
            if (parent) {
                // Check if this is a retirement display
                if (parent.textContent.includes('average return:')) {
                    parent.innerHTML = `<span class="country-name">${countryName}</span> average return: <span class="retirement-rate">${rates.investment.toFixed(2)}%</span>`;
                }
            }
        });
        
        // ✅ FIXED: Update mortgage calculator display (look for .current-rate elements with "rate:" text)
        const currentRateElements = document.querySelectorAll('.current-rate');
        currentRateElements.forEach(el => {
            const currentText = el.textContent;
            // If it contains "Current" and "rate:" but NOT "return:" - it's a mortgage display
            if (currentText.includes('Current') && currentText.includes('rate:') && !currentText.includes('return:')) {
                el.innerHTML = `Current <span class="country-name">${countryName}</span> rate: <strong>${rates.mortgage.toFixed(2)}%</strong>`;
            }
        });
        
        // ✅ FIXED: AUTO-FILL INPUT FIELDS WHEN COUNTRY CHANGES
        // Update investment calculator input field
        const investmentRateInput = document.getElementById('investment-rate');
        if (investmentRateInput) {
            investmentRateInput.value = rates.investment.toFixed(2);
            investmentRateInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`Updated investment-rate input to: ${rates.investment.toFixed(2)}% for ${countryName}`);
        }
        
        // Update retirement calculator input field
        const retirementRateInput = document.getElementById('retirement-rate');
        if (retirementRateInput) {
            retirementRateInput.value = rates.investment.toFixed(2); // Same as investment rate
            retirementRateInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`Updated retirement-rate input to: ${rates.investment.toFixed(2)}% for ${countryName}`);
        }
        
        // Update loan calculator input field
        const loanRateInput = document.getElementById('loan-rate');
        if (loanRateInput) {
            loanRateInput.value = rates.mortgage.toFixed(2); // Use mortgage rate for loans
            loanRateInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`Updated loan-rate input to: ${rates.mortgage.toFixed(2)}% for ${countryName}`);
        }

        // ✅ SIMPLE FIX: Directly target the mortgage-rate-input
        const mortgageRateInput = document.getElementById('mortgage-rate-input');
        if (mortgageRateInput) {
            mortgageRateInput.value = rates.mortgage.toFixed(2);
            mortgageRateInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`Updated mortgage-rate-input to: ${rates.mortgage.toFixed(2)}% for ${countryName}`);
        } else {
            // Fallback to existing logic...
            const mortgageCalculatorDiv = document.getElementById('mortgage-calculator');
            if (mortgageCalculatorDiv) {
                const mortgageInputs = mortgageCalculatorDiv.querySelectorAll('input[type="number"]');
                // Usually pattern: 1st input = loan amount, 2nd = loan term, 3rd = interest rate
                if (mortgageInputs.length >= 3) {
                    const interestRateInput = mortgageInputs[2]; // Third input is usually interest rate
                    interestRateInput.value = rates.mortgage.toFixed(2);
                    interestRateInput.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`Updated mortgage input (position 3 in mortgage-calculator) to: ${rates.mortgage.toFixed(2)}% for ${countryName}`);
                }
            } else {
                // Method 2: Fallback - search all inputs for interest rate
                document.querySelectorAll('input[type="number"]').forEach((input, index) => {
                    if (input.placeholder && input.placeholder.includes('interest rate')) {
                        input.value = rates.mortgage.toFixed(2);
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log(`Updated mortgage input (by placeholder) to: ${rates.mortgage.toFixed(2)}% for ${countryName}`);
                    }
                });
            }
        }
        
        // ✅ FIXED: Find and update mortgage calculator input field - SIMPLIFIED RELIABLE METHOD
        // Method 1: Look for input in mortgage-calculator div by position
        const mortgageCalculatorDiv = document.getElementById('mortgage-calculator');
        if (mortgageCalculatorDiv) {
            const mortgageInputs = mortgageCalculatorDiv.querySelectorAll('input[type="number"]');
            // Usually pattern: 1st input = loan amount, 2nd = loan term, 3rd = interest rate
            if (mortgageInputs.length >= 3) {
                const interestRateInput = mortgageInputs[2]; // Third input is usually interest rate
                interestRateInput.value = rates.mortgage.toFixed(2);
                interestRateInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`Updated mortgage input (position 3 in mortgage-calculator) to: ${rates.mortgage.toFixed(2)}% for ${countryName}`);
            }
        } else {
            // Method 2: Fallback - search all inputs for interest rate
            document.querySelectorAll('input[type="number"]').forEach((input, index) => {
                if (input.placeholder && input.placeholder.includes('interest rate')) {
                    input.value = rates.mortgage.toFixed(2);
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`Updated mortgage input (by placeholder) to: ${rates.mortgage.toFixed(2)}% for ${countryName}`);
                }
            });
        }
    }

    // Create number input with label
    createInput(labelText, id, defaultValue = '', type = 'number') {
        const div = document.createElement('div');
        div.className = 'input-group';
        
        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = labelText;
        
        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.value = defaultValue;
        input.className = 'form-input';
        
        div.appendChild(label);
        div.appendChild(input);
        
        return div;
    }

    // Create result display
    createResultDisplay(title, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        container.innerHTML = `
            <div class="result-card">
                <h3>${title}</h3>
                <div class="result-content" id="${containerId}-content">
                    Select country and enter values
                </div>
            </div>
        `;
        
        return document.getElementById(`${containerId}-content`);
    }

    // Show loading spinner
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="loading">Calculating...</div>';
        }
    }

    // Show error
    showError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    // Show success results
    showResults(containerId, results) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let html = '<div class="success">';
        
        if (results.success) {
            Object.keys(results).forEach(key => {
                if (key !== 'success' && key !== 'country') {
                    html += `<div class="result-item"><strong>${this.formatKey(key)}:</strong> ${results[key]}</div>`;
                }
            });
        } else {
            html = `<div class="error">Error: ${results.error}</div>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    }

    // Format key for display (mortgageRate -> Mortgage Rate)
    formatKey(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
}

// Export
if (typeof window !== 'undefined') {
    window.UIControls = UIControls;
}
