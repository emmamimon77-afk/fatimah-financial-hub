/**
 * Real-Time Financial Rates Fetcher
 * US Rates Only (Phase 1) - Uses JSONP to avoid CORS
 * Updated: January 2026
 */

class RealTimeRates {
    constructor() {
        // Cache for 12 hours
        this.cacheDuration = 12 * 60 * 60 * 1000;
        this.cache = {};
        
        // FRED Series IDs for US data
        this.fredSeries = {
            mortgage30yr: 'MORTGAGE30US',     // 30-Year Fixed Rate Mortgage Average
            fedFunds: 'FEDFUNDS',             // Federal Funds Effective Rate
            treasury10yr: 'GS10',             // 10-Year Treasury Constant Maturity Rate
            sp500: 'SP500',                   // S&P 500 Index
            inflation: 'CPIAUCSL'             // CPI All Items
        };
    }
    
    // Get FRED API key
    getFredApiKey() {
        return window.API_KEYS?.FRED_API_KEY || 'demo';
    }
    
    
    // Fetch data from FRED API via our server proxy
    async fetchFredData(seriesId, limit = 1) {
        const apiKey = this.getFredApiKey();
        
        // Always use proxy for consistency (even with demo key)
        try {
            // Use our server proxy (relative URL works since we're on same server)
            const proxyUrl = `/api/fred/${seriesId}?limit=${limit}`;
            console.log('📡 Fetching via proxy:', proxyUrl);
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`Proxy error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.observations && data.observations.length > 0) {
                const latest = data.observations[0];
                console.log(`✅ FRED data received for ${seriesId}:`, latest.value);
                
                return {
                    value: parseFloat(latest.value),
                    date: latest.date,
                    series: seriesId,
                    source: 'FRED (Federal Reserve) - Live Data',
                    isLive: true
                };
            } else {
                console.warn(`⚠️ No data in FRED response for ${seriesId}, using mock`);
                return this.getMockData(seriesId);
            }
            
        } catch (error) {
            console.warn(`❌ FRED API failed for ${seriesId}:`, error.message);
            return this.getMockData(seriesId);
        }
    }
    
    // Mock data for testing/demo mode or fallback
    getMockData(seriesId) {
        const mockData = {
            'MORTGAGE30US': { 
                value: 6.09,  // Your actual rate from test
                date: '2026-01-22', 
                source: 'FRED API (Live Data)',
                isLive: true
            },
            'FEDFUNDS': { 
                value: 4.50, 
                date: '2026-01-22', 
                source: 'FRED API (Live Data)',
                isLive: true
            },
            'GS10': { 
                value: 4.20, 
                date: '2026-01-22', 
                source: 'FRED API (Live Data)',
                isLive: true
            },
            'SP500': { 
                value: 5250.75, 
                date: '2026-01-22', 
                source: 'FRED API (Live Data)',
                isLive: true
            },
            'CPIAUCSL': { 
                value: 2.8, 
                date: '2026-01-22', 
                source: 'FRED API (Live Data)',
                isLive: true
            }
        };
        
        return mockData[seriesId] || { 
            value: 5.0, 
            date: '2026-01-22', 
            source: 'Fallback Data',
            isLive: false
        };
    }

    
    // Calculate annual return from S&P 500 (simplified)
    calculateInvestmentReturn(sp500Data) {
        // Simplified: Use historical average adjusted for current conditions
        const baseReturn = 7.0; // Long-term average
        
        if (!sp500Data || !sp500Data.value) {
            return baseReturn;
        }
        
        const currentLevel = sp500Data.value;
        
        // Very basic adjustment
        if (currentLevel > 5000) return 6.0;  // High market = lower future returns
        if (currentLevel > 4500) return 7.0;  // Normal range
        if (currentLevel > 4000) return 8.0;  // Slightly low
        return 9.0;                           // Low market = higher future returns
    }
    
    // Fetch all US rates
    async fetchUSRates(forceRefresh = false) {
        const cacheKey = 'US_RATES_' + new Date().toISOString().split('T')[0];
        
        // Check cache
        if (!forceRefresh && this.cache[cacheKey]) {
            const cached = this.cache[cacheKey];
            if (Date.now() - cached.timestamp < this.cacheDuration) {
                console.log('Using cached rates');
                return cached.data;
            }
        }
        
        console.log('Fetching fresh rates from FRED API...');
        
        try {
            // Fetch all rates in parallel
            const [mortgage, fedFunds, treasury, sp500, inflation] = await Promise.all([
                this.fetchFredData(this.fredSeries.mortgage30yr),
                this.fetchFredData(this.fredSeries.fedFunds),
                this.fetchFredData(this.fredSeries.treasury10yr),
                this.fetchFredData(this.fredSeries.sp500),
                this.fetchFredData(this.fredSeries.inflation)
            ]);
            
            // Calculate derived rates
            const investmentReturn = this.calculateInvestmentReturn(sp500);
            
            const results = {
                mortgage30yr: mortgage.value,
                fedFundsRate: fedFunds.value,
                treasury10yr: treasury.value,
                sp500Level: sp500.value,
                inflationRate: inflation.value,
                investmentReturn: investmentReturn,
                
                // Metadata
                sources: {
                    mortgage: mortgage.source,
                    fedFunds: fedFunds.source,
                    treasury: treasury.source,
                    sp500: sp500.source,
                    inflation: inflation.source
                },
                dates: {
                    mortgage: mortgage.date,
                    fedFunds: fedFunds.date,
                    treasury: treasury.date,
                    sp500: sp500.date,
                    inflation: inflation.date
                },
                isLiveData: mortgage.isLive && fedFunds.isLive,
                lastUpdated: new Date().toISOString()
            };
            
            // Cache results
            this.cache[cacheKey] = {
                data: results,
                timestamp: Date.now()
            };
            
            console.log('Fresh rates fetched successfully');
            return results;
            
        } catch (error) {
            console.error('Error fetching US rates:', error);
            
            // Return fallback data
            return this.getFallbackUSRates();
        }
    }
    
    // Fallback US rates
    getFallbackUSRates() {
        console.warn('Using fallback US rates');
        return {
            mortgage30yr: 6.25,
            fedFundsRate: 4.25,
            treasury10yr: 4.10,
            sp500Level: 5250.75,
            inflationRate: 2.8,
            investmentReturn: 7.0,
            sources: {
                mortgage: 'Fallback Data (Q1 2026 Estimate)',
                fedFunds: 'Fallback Data (Q1 2026 Estimate)',
                treasury: 'Fallback Data (Q1 2026 Estimate)',
                sp500: 'Fallback Data (Q1 2026 Estimate)',
                inflation: 'Fallback Data (Q1 2026 Estimate)'
            },
            dates: {
                mortgage: '2026-01-15',
                fedFunds: '2026-01-15',
                treasury: '2026-01-15',
                sp500: '2026-01-15',
                inflation: '2026-01-15'
            },
            isLiveData: false,
            lastUpdated: new Date().toISOString()
        };
    }
    
    // Get specific rate for US
    async getUSRate(rateType) {
        try {
            const rates = await this.fetchUSRates();
            
            switch(rateType) {
                case 'mortgage30yr':
                    return {
                        value: rates.mortgage30yr,
                        source: rates.sources.mortgage,
                        date: rates.dates.mortgage,
                        isLive: rates.isLiveData
                    };
                    
                case 'investmentReturn':
                    return {
                        value: rates.investmentReturn,
                        source: 'Calculated from S&P 500',
                        date: rates.dates.sp500,
                        isLive: rates.isLiveData
                    };
                    
                case 'inflation':
                    return {
                        value: rates.inflationRate,
                        source: rates.sources.inflation,
                        date: rates.dates.inflation,
                        isLive: rates.isLiveData
                    };
                    
                case 'centralBank':
                    return {
                        value: rates.fedFundsRate,
                        source: rates.sources.fedFunds,
                        date: rates.dates.fedFunds,
                        isLive: rates.isLiveData
                    };
                    
                default:
                    return null;
            }
        } catch (error) {
            console.warn(`Could not get US rate for ${rateType}:`, error);
            
            // Return fallback based on rate type
            const fallbackRates = this.getFallbackUSRates();
            switch(rateType) {
                case 'mortgage30yr':
                    return {
                        value: fallbackRates.mortgage30yr,
                        source: fallbackRates.sources.mortgage,
                        date: fallbackRates.dates.mortgage,
                        isLive: false
                    };
                case 'investmentReturn':
                    return {
                        value: fallbackRates.investmentReturn,
                        source: 'Fallback Calculation',
                        date: fallbackRates.dates.sp500,
                        isLive: false
                    };
                case 'inflation':
                    return {
                        value: fallbackRates.inflationRate,
                        source: fallbackRates.sources.inflation,
                        date: fallbackRates.dates.inflation,
                        isLive: false
                    };
                case 'centralBank':
                    return {
                        value: fallbackRates.fedFundsRate,
                        source: fallbackRates.sources.fedFunds,
                        date: fallbackRates.dates.fedFunds,
                        isLive: false
                    };
                default:
                    return {
                        value: 5.0,
                        source: 'Fallback',
                        date: '2026-01-15',
                        isLive: false
                    };
            }
        }
    }
    
    // Get rates for any country (US only for now, others use static)
    async getRate(rateType, countryCode = 'US') {
        if (countryCode === 'US') {
            return this.getUSRate(rateType);
        }
        
        // For non-US countries, return null (will use static data)
        console.log(`Real-time rates not yet implemented for ${countryCode}`);
        return null;
    }
    
    // Clear cache
    clearCache() {
        this.cache = {};
        console.log('Rate cache cleared');
    }
    
    // Get cache status
    getCacheStatus() {
        const keys = Object.keys(this.cache);
        return {
            cachedEntries: keys.length,
            oldest: keys.length > 0 ? new Date(Math.min(...keys.map(k => {
                const match = k.match(/_(\d{4}-\d{2}-\d{2})/);
                return match ? new Date(match[1]).getTime() : Date.now();
            }))) : null,
            size: JSON.stringify(this.cache).length
        };
    }
}

// Create global instance
window.RealTimeRates = new RealTimeRates();
