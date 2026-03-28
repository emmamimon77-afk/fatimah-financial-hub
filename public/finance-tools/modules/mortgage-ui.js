// modules/mortgage-ui.js
// Mortgage calculator UI

class MortgageUI {
    constructor() {
        this.ui = window.UIControls ? new window.UIControls() : null;
        this.calculators = window.FinancialCalculators ? new window.FinancialCalculators() : null;
    }

    // Initialize mortgage calculator
    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Mortgage container not found:', containerId);
            return;
        }

        // Create UI
        container.innerHTML = `
            <div class="calculator-card">
                <h3><i class="fas fa-home"></i> Mortgage Calculator</h3>
                
                <div class="current-rate">
                    Current <span class="country-name">US</span> rate: 
                    <span class="mortgage-rate">Loading...</span>
                </div>
                
                <div id="mortgage-inputs">
                    <!-- Inputs will be added here -->
                </div>
                
                <button id="calculate-mortgage" class="calculate-btn">
                    Calculate Mortgage <i class="fas fa-calculator"></i>
                </button>
                
                <div id="mortgage-results" class="results">
                    <!-- Results will appear here -->
                </div>
            </div>
        `;

        // Add inputs
        this.addInputs();
        
        // Add event listener
        document.getElementById('calculate-mortgage').addEventListener('click', () => {
            this.calculate();
        });

        // Update rate display - use setTimeout to ensure DOM is ready
        setTimeout(async () => {
            await  this.updateRateDisplay();
        }, 100);
    }

    // Add input fields
    addInputs() {
        const container = document.getElementById('mortgage-inputs');
        if (!container || !this.ui) return;

        container.innerHTML = '';
        
        const inputs = [
            this.ui.createInput('Loan Amount', 'mortgage-amount', '300000'),
            this.ui.createInput('Loan Term (years)', 'mortgage-years', '30'),
            this.ui.createInput('Interest Rate (%)', 'mortgage-rate-input', '', 'Leave empty for country default')
        ];

        inputs.forEach(input => {
            container.appendChild(input);
        });

        // Add note about using country default
        const note = document.createElement('div');
        note.className = 'input-note';
        note.innerHTML = '<small>Leave interest rate empty to use country default rate</small>';
        container.appendChild(note);
    }

    // Calculate mortgage
    calculate() {
        if (!this.calculators) {
            console.error('Calculators not available');
            return;
        }

        // Get values
        const amount = parseFloat(document.getElementById('mortgage-amount').value) || 0;
        const years = parseFloat(document.getElementById('mortgage-years').value) || 30;
        const customRate = document.getElementById('mortgage-rate-input').value;
        const country = this.ui.config.userSettings?.country || 'US';

        // Prepare params
        const params = {
            principal: amount,
            years: years,
            country: country
        };

        // Add custom rate if provided
        if (customRate && !isNaN(customRate)) {
            params.annualRate = parseFloat(customRate);
        }

        // Show loading
        this.ui.showLoading('mortgage-results');

        // Calculate
        setTimeout(() => {
            const result = this.calculators.calculateMortgage(params);
            this.displayResults(result);
        }, 300);
    }

    // Display results
    displayResults(result) {
        const container = document.getElementById('mortgage-results');
        if (!container) return;

        if (result.success) {
            container.innerHTML = `
                <div class="success">
                    <h4>Mortgage Results</h4>
                    <div class="result-item">
                        <strong>Monthly Payment:</strong> ${result.monthly}
                    </div>
                    <div class="result-item">
                        <strong>Interest Rate:</strong> ${result.rate}
                    </div>
                    <div class="result-item">
                        <strong>Total Payments:</strong> ${result.totalPayment || 'N/A'}
                    </div>
                    <div class="result-item">
                        <strong>Total Interest:</strong> ${result.totalInterest || 'N/A'}
                    </div>
                    ${result.affordability ? `
                    <div class="affordability">
                        <h5>Affordability</h5>
                        <div>Housing Ratio: ${result.affordability.housingRatio || 'N/A'}</div>
                        <div>Recommendation: ${result.affordability.recommendation || 'N/A'}</div>
                    </div>
                    ` : ''}
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="error">
                    <strong>Error:</strong> ${result.error}
                </div>
            `;
        }
    }


    // Get default rate for a country
    getDefaultRate(countryCode) {
        const defaults = {
            'US': 6.1,      // Current live rate
            'UK': 5.5,
            'EU': 4.2,
            'JP': 1.5,
            'IN': 8.5,
            'AU': 6.5,
            'CN': 4.2,
            'RU': 15.5
        };
        return defaults[countryCode] || 6.0;
    }
    
    // Update rate input field if empty
    updateRateInputField(rate) {
        const rateInput = document.getElementById('mortgage-rate-input');
        if (rateInput && !rateInput.value.trim()) {
            rateInput.value = rate.toFixed(2);
            rateInput.placeholder = `Default: ${rate.toFixed(2)}%`;
        }
    }


    // Update rate display - ASYNC version
    async updateRateDisplay() {
        if (!this.ui) return;
        
        const country = this.ui.config.userSettings?.country || 'US';
        const rateElement = document.querySelector('.mortgage-rate');
        
        if (!rateElement) return;
        
        // Show loading
        rateElement.textContent = 'Loading...';
        
        try {
            let rate;
            
            // For US, try to get live rate
            if (country === 'US' && window.RealTimeRates) {
                const rateInfo = await window.RealTimeRates.getUSRate('mortgage30yr');
                rate = rateInfo ? rateInfo.value : null;
                
                if (rate === null || rate === undefined) {
                    // Fallback to config rate if live rate fails
                    rate = await this.ui.config.getRate('mortgage30yr', country);
                }
            } else {
                // For non-US countries, use config rate
                rate = await this.ui.config.getRate('mortgage30yr', country);
            }
            
            // Update display with the rate
            const numericRate = parseFloat(rate) || this.getDefaultRate(country);
            rateElement.textContent = numericRate.toFixed(2) + '%';
            
            // Also update country name
            const countryNameElement = document.querySelector('.country-name');
            if (countryNameElement) {
                const countryData = this.ui.config.countryData[country];
                countryNameElement.textContent = countryData ? countryData.name : country;
            }
            
            // Update the input field if empty
            this.updateRateInputField(numericRate);
            
        } catch (error) {
            console.error('Error updating mortgage rate display:', error);
            // Fallback to default rate
            const defaultRate = this.getDefaultRate(country);
            rateElement.textContent = defaultRate.toFixed(2) + '%';
        }
    }


    // Handle country change
    async onCountryChange(countryCode) {
        await this.updateRateDisplay();
    } 
}

// Export
if (typeof window !== 'undefined') {
    window.MortgageUI = MortgageUI;
}
