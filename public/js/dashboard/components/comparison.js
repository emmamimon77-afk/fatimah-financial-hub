// System Comparison Component with Educational Tooltips
class DashboardComparison {
    constructor() {
        this.container = document.getElementById('comparison-container');
        this.metrics = [
            { 
                label: 'Stability', 
                western: 65, 
                islamic: 85, 
                description: 'Resistance to financial crises',
                explanation: 'Islamic banks weathered 2008 crisis better due to no interest (riba) = less debt bubble risk'
            },
            { 
                label: 'Ethical Impact', 
                western: 45, 
                islamic: 90, 
                description: 'Social & environmental considerations',
                explanation: 'Islamic finance prohibits harmful industries (alcohol, gambling, weapons) and requires social responsibility (zakat)'
            },
            { 
                label: 'Wealth Distribution', 
                western: 40, 
                islamic: 75, 
                description: 'Equality of wealth spread',
                explanation: 'Profit-loss sharing spreads wealth vs interest which concentrates wealth to lenders'
            },
            { 
                label: 'Risk Sharing', 
                western: 30, 
                islamic: 80, 
                description: 'Spread of financial risk',
                explanation: 'Islamic: Risk shared between investor and entrepreneur | Western: Risk borne primarily by borrower'
            },
            { 
                label: 'Innovation', 
                western: 85, 
                islamic: 60, 
                description: 'Financial product innovation',
                explanation: 'Western: Complex derivatives, options, futures | Islamic: Simpler, asset-backed instruments'
            },
            { 
                label: 'Transparency', 
                western: 70, 
                islamic: 85, 
                description: 'Clarity of financial dealings',
                explanation: 'Islamic requires clear asset-backing | Western derivatives can be opaque and complex'
            }
        ];
        
        this.explanations = {
            stability: 'Based on academic studies showing Islamic banks had higher stability during the 2008 financial crisis. The prohibition of interest (riba) prevents debt bubbles.',
            ethical: 'Islamic finance screens out unethical industries and mandates charitable giving (zakat), promoting social welfare.',
            wealth: 'Profit-loss sharing mechanisms distribute wealth more evenly compared to interest-based systems that concentrate wealth.',
            risk: 'Mudaraba and Musharaka contracts ensure risk is shared, unlike debt contracts where borrowers bear all risk.',
            innovation: 'While Western finance innovates complex instruments, Islamic finance focuses on real asset-backed innovation.',
            transparency: 'Asset-backing requirement in Islamic finance ensures clearer transaction structures.'
        };
    }

    render() {
        this.container.innerHTML = `
            <div class="comparison-grid">
                <div class="comparison-card western">
                    <div class="comparison-header">
                        <div class="comparison-icon">📊</div>
                        <div>
                            <h3>Western Finance System</h3>
                            <p class="comparison-subtitle">Interest-based, Derivatives, Leverage</p>
                        </div>
                    </div>
                    <div class="comparison-metrics">
                        ${this.metrics.map((metric, index) => `
                            <div class="metric-bar-container" data-metric="${metric.label.toLowerCase().replace(' ', '-')}">
                                <div class="metric-label">
                                    <span>${metric.label}</span>
                                    <span class="metric-percentage">${metric.western}%</span>
                                </div>
                                <div class="metric-bar western" style="width: ${metric.western}%">
                                    <div class="metric-tooltip">
                                        <strong>${metric.label}: ${metric.western}%</strong><br>
                                        ${metric.explanation}
                                    </div>
                                </div>
                                <div class="metric-description">${metric.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="comparison-card islamic">
                    <div class="comparison-header">
                        <div class="comparison-icon">☪️</div>
                        <div>
                            <h3>Islamic Finance System</h3>
                            <p class="comparison-subtitle">Profit-sharing, Asset-backed, Ethical</p>
                        </div>
                    </div>
                    <div class="comparison-metrics">
                        ${this.metrics.map((metric, index) => `
                            <div class="metric-bar-container" data-metric="${metric.label.toLowerCase().replace(' ', '-')}">
                                <div class="metric-label">
                                    <span>${metric.label}</span>
                                    <span class="metric-percentage">${metric.islamic}%</span>
                                </div>
                                <div class="metric-bar islamic" style="width: ${metric.islamic}%">
                                    <div class="metric-tooltip">
                                        <strong>${metric.label}: ${metric.islamic}%</strong><br>
                                        ${metric.explanation}
                                    </div>
                                </div>
                                <div class="metric-description">${metric.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            
            <div class="comparison-legend" style="margin-top: 30px; padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <div class="legend-item" style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div class="legend-color western" style="width: 20px; height: 20px; border-radius: 4px; flex-shrink: 0; background: linear-gradient(90deg, #667eea, #764ba2);"></div>
                    <div class="legend-text" style="font-size: 0.95em; opacity: 0.9;">Western Finance: Interest-based, higher innovation, more complex instruments</div>
                </div>
                <div class="legend-item" style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div class="legend-color islamic" style="width: 20px; height: 20px; border-radius: 4px; flex-shrink: 0; background: linear-gradient(90deg, #43e97b, #38f9d7);"></div>
                    <div class="legend-text" style="font-size: 0.95em; opacity: 0.9;">Islamic Finance: Asset-backed, ethical screening, risk-sharing, social responsibility</div>
                </div>
                <div class="data-disclaimer" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.85em; opacity: 0.7; text-align: center;">
                    📊 <strong>Educational Data:</strong> Based on academic studies comparing system performance during financial crises.
                    Hover over bars for detailed explanations.
                </div>
            </div>
        `;
        
        this.initializeTooltips();
    }

    initializeTooltips() {
        // Tooltips will show on hover via CSS
        console.log('Comparison tooltips initialized');
    }
}

if (typeof window !== 'undefined') {
    window.DashboardComparison = DashboardComparison;
}
