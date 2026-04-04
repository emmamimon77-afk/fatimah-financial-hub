/**
 * ETHICAL TRADING SIMULATOR - DATA FEED
 * Handles all market data with Islamic compliance
 */

const DataFeed = (function() {
    // API Configuration
    const config = {
        apiKey: null,
        updateInterval: 5000,
        volatility: 0.02,
        useRealisticData: true
    };

    // Cache for API responses
    const cache = {
        prices: {},
        profiles: {},
        history: {},
        lastFetch: {}
    };

    // Storage for active stocks and intervals
    let stocks = {};
    let priceHistory = {};
    let intervals = {};

    // Commodity prices cache
    let cachedCommodityPrices = null;
    let lastCommodityFetch = 0;
    const COMMODITY_CACHE_TIME = 60000; // 1 minute

    // ========== API KEY MANAGEMENT ==========
    function setApiKey(key) {
        config.apiKey = key;
        console.log('🔑 API key set for commodity prices');
    }

    function getApiKey() {
        return config.apiKey;
    }

    // ========== LIVE COMMODITY API FUNCTIONS ==========
    
    // Fetch live commodity prices from our server endpoint
    async function fetchCommodityPrices() {
        try {
            const response = await fetch('/api/commodity-prices');
            if (response.ok) {
                const data = await response.json();
                return {
                    gold: data.gold,
                    silver: data.silver,
                    oil: data.oil,
                    brent: data.brent,
                    natgas: data.natgas,
                    gasoline: data.gasoline,
                    timestamp: data.timestamp
                };
            }
            throw new Error('API returned ' + response.status);
        } catch (error) {
            console.error('Error fetching commodity prices:', error);
            return null;
        }
    }

    // Fetch live gold price
    async function fetchGoldPrice() {
        if (cachedCommodityPrices && (Date.now() - lastCommodityFetch) < COMMODITY_CACHE_TIME) {
            return cachedCommodityPrices.gold;
        }
        
        const prices = await fetchCommodityPrices();
        if (prices) {
            cachedCommodityPrices = prices;
            lastCommodityFetch = Date.now();
            return prices.gold;
        }
        
        return getMockPrice('GOLD');
    }

    // Fetch live silver price
    async function fetchSilverPrice() {
        if (cachedCommodityPrices && (Date.now() - lastCommodityFetch) < COMMODITY_CACHE_TIME) {
            return cachedCommodityPrices.silver;
        }
        
        const prices = await fetchCommodityPrices();
        if (prices) {
            cachedCommodityPrices = prices;
            lastCommodityFetch = Date.now();
            return prices.silver;
        }
        
        return getMockPrice('SILVER');
    }

    // Fetch live oil price
    async function fetchOilPrice() {
        if (cachedCommodityPrices && (Date.now() - lastCommodityFetch) < COMMODITY_CACHE_TIME) {
            return cachedCommodityPrices.oil;
        }
        
        const prices = await fetchCommodityPrices();
        if (prices) {
            cachedCommodityPrices = prices;
            lastCommodityFetch = Date.now();
            return prices.oil;
        }
        
        return getMockPrice('OIL');
    }

    // Fetch live Brent price
    async function fetchBrentPrice() {
        if (cachedCommodityPrices && (Date.now() - lastCommodityFetch) < COMMODITY_CACHE_TIME) {
            return cachedCommodityPrices.brent;
        }
        
        const prices = await fetchCommodityPrices();
        if (prices) {
            cachedCommodityPrices = prices;
            lastCommodityFetch = Date.now();
            return prices.brent;
        }
        
        return getMockPrice('BRENT');
    }

    // Fetch live Natural Gas price
    async function fetchNatGasPrice() {
        if (cachedCommodityPrices && (Date.now() - lastCommodityFetch) < COMMODITY_CACHE_TIME) {
            return cachedCommodityPrices.natgas;
        }
        
        const prices = await fetchCommodityPrices();
        if (prices) {
            cachedCommodityPrices = prices;
            lastCommodityFetch = Date.now();
            return prices.natgas;
        }
        
        return getMockPrice('NATGAS');
    }

    // Mock prices for fallback (realistic current values)
    function getMockPrice(symbol) {
        const mockPrices = {
            'AAPL': { price: 255.92, change: 0.29, changePercent: 0.11, name: 'Apple Inc.' },
            'MSFT': { price: 420.00, change: 0.50, changePercent: 0.12, name: 'Microsoft Corporation' },
            'GOOGL': { price: 175.00, change: 0.30, changePercent: 0.17, name: 'Alphabet Inc.' },
            'TSLA': { price: 400.00, change: -2.00, changePercent: -0.50, name: 'Tesla Inc.' },
            'JNJ': { price: 156.00, change: 0.20, changePercent: 0.13, name: 'Johnson & Johnson' },
            'ADBE': { price: 500.00, change: 1.00, changePercent: 0.20, name: 'Adobe Inc.' },
            'CRM': { price: 250.00, change: 0.50, changePercent: 0.20, name: 'Salesforce Inc.' },
            'NVDA': { price: 850.00, change: 5.00, changePercent: 0.59, name: 'NVIDIA Corporation' },
            'AMD': { price: 169.11, change: 1.22, changePercent: 0.73, name: 'Advanced Micro Devices' } 
            'GOLD': { price: 4565.50, change: 12.50, changePercent: 0.27 },
            'SILVER': { price: 71.13, change: 0.32, changePercent: 0.45 },
            'OIL': { price: 82.34, change: -1.25, changePercent: -1.49 },
            'BRENT': { price: 86.12, change: -1.02, changePercent: -1.17 },
            'NATGAS': { price: 2.85, change: 0.08, changePercent: 2.89 }
        };
        return mockPrices[symbol] || { price: 100, change: 0, changePercent: 0 };
    }

    // ========== STOCK DATABASE ==========
    
    const stockDatabase = {
        // Technology Stocks
        'AAPL': { name: 'Apple Inc.', sector: 'Technology', halalStatus: 'controversial', basePrice: 175.34, volatility: 1.2 },
        'MSFT': { name: 'Microsoft Corporation', sector: 'Technology', halalStatus: 'controversial', basePrice: 378.85, volatility: 1.1 },
        'GOOGL': { name: 'Alphabet Inc.', sector: 'Technology', halalStatus: 'controversial', basePrice: 142.56, volatility: 1.3 },
        'TSLA': { name: 'Tesla Inc.', sector: 'Automotive', halalStatus: 'halal', basePrice: 245.67, volatility: 2.5 },
        'JNJ': { name: 'Johnson & Johnson', sector: 'Healthcare', halalStatus: 'halal', basePrice: 156.78, volatility: 0.8 },
        'ADBE': { name: 'Adobe Inc.', sector: 'Technology', halalStatus: 'halal', basePrice: 192.83, volatility: 1.4 },
        'CRM': { name: 'Salesforce Inc.', sector: 'Technology', halalStatus: 'halal', basePrice: 120.52, volatility: 1.5 },
        'NVDA': { name: 'NVIDIA Corporation', sector: 'Technology', halalStatus: 'halal', basePrice: 890.45, volatility: 2.0 },
        'AMD': { name: 'Advanced Micro Devices', sector: 'Technology', halalStatus: 'halal', basePrice: 167.89, volatility: 2.1 },
        'INTC': { name: 'Intel Corporation', sector: 'Technology', halalStatus: 'halal', basePrice: 43.21, volatility: 1.3 },
        // Commodities
        'GOLD': { name: 'Gold (XAU/USD)', sector: 'Commodity', halalStatus: 'halal', basePrice: 4565.50, volatility: 1.2, isCommodity: true },
        'SILVER': { name: 'Silver (XAG/USD)', sector: 'Commodity', halalStatus: 'halal', basePrice: 71.13, volatility: 1.4, isCommodity: true },
        'OIL': { name: 'WTI Crude Oil', sector: 'Commodity', halalStatus: 'halal', basePrice: 82.34, volatility: 1.8, isCommodity: true },
        'BRENT': { name: 'Brent Crude Oil', sector: 'Commodity', halalStatus: 'halal', basePrice: 86.12, volatility: 1.7, isCommodity: true },
        'NATGAS': { name: 'Natural Gas', sector: 'Commodity', halalStatus: 'halal', basePrice: 2.85, volatility: 2.0, isCommodity: true }
    };

    // ========== HELPER FUNCTIONS ==========
    
    function generatePrice(symbol, basePrice) {
        const stock = stockDatabase[symbol];
        const volatility = stock ? stock.volatility : 1.0;
        const change = (Math.random() - 0.5) * 2 * volatility;
        const changePercent = change / basePrice * 100;
        
        return {
            price: Number((basePrice + change).toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2))
        };
    }

    function initializeStock(symbol) {
        if (!stocks[symbol]) {
            const basePrice = stockDatabase[symbol]?.basePrice || 100;
            const priceData = generatePrice(symbol, basePrice);
            
            stocks[symbol] = {
                symbol: symbol,
                name: stockDatabase[symbol]?.name || `${symbol} Inc.`,
                ...priceData,
                ...stockDatabase[symbol],
                lastUpdated: new Date().toISOString(),
                volume: Math.floor(Math.random() * 10000000) + 1000000
            };
            
            if (!priceHistory[symbol]) {
                priceHistory[symbol] = [];
                let histPrice = basePrice;
                for (let i = 30; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    histPrice += (Math.random() - 0.5) * 4;
                    priceHistory[symbol].push({
                        date: date.toISOString().split('T')[0],
                        price: Number(histPrice.toFixed(2))
                    });
                }
            }
            
            startPriceUpdates(symbol);
        }
        return stocks[symbol];
    }

    function startPriceUpdates(symbol) {
        if (intervals[symbol]) clearInterval(intervals[symbol]);
        
        intervals[symbol] = setInterval(() => {
            if (stocks[symbol]) {
                const oldPrice = stocks[symbol].price;
                const newPriceData = generatePrice(symbol, oldPrice);
                stocks[symbol] = { ...stocks[symbol], ...newPriceData, lastUpdated: new Date().toISOString() };
                window.dispatchEvent(new CustomEvent('stockUpdate', { detail: { symbol, price: stocks[symbol] } }));
            }
        }, config.updateInterval);
    }

    // ========== PUBLIC API ==========
    
    return {
        setApiKey: setApiKey,
        getApiKey: getApiKey,
        
        getStockPrice: async function(symbol) {
            symbol = symbol.toUpperCase();
            
            // Check cache first
            if (cache.prices[symbol] && Date.now() - cache.lastFetch[symbol] < config.updateInterval) {
                return cache.prices[symbol];
            }
            
            // Handle commodities
            if (symbol === 'GOLD') {
                const livePrice = await fetchGoldPrice();
                const stockData = {
                    symbol: 'GOLD',
                    name: 'Gold (XAU/USD)',
                    price: livePrice.price,
                    change: livePrice.change,
                    changePercent: livePrice.changePercent,
                    currency: 'USD',
                    sector: 'Commodity',
                    industry: 'Precious Metals',
                    halalStatus: 'halal',
                    lastUpdated: new Date().toISOString()
                };
                cache.prices[symbol] = stockData;
                cache.lastFetch[symbol] = Date.now();
                return stockData;
            }
            
            if (symbol === 'SILVER') {
                const livePrice = await fetchSilverPrice();
                const stockData = {
                    symbol: 'SILVER',
                    name: 'Silver (XAG/USD)',
                    price: livePrice.price,
                    change: livePrice.change,
                    changePercent: livePrice.changePercent,
                    currency: 'USD',
                    sector: 'Commodity',
                    industry: 'Precious Metals',
                    halalStatus: 'halal',
                    lastUpdated: new Date().toISOString()
                };
                cache.prices[symbol] = stockData;
                cache.lastFetch[symbol] = Date.now();
                return stockData;
            }
            
            // Handle Oil (WTI)
            if (symbol === 'OIL') {
                const oilData = await fetchOilPrice();
                const stockData = {
                    symbol: 'OIL',
                    name: 'Crude Oil (WTI)',
                    price: oilData.price,
                    change: oilData.change,
                    changePercent: oilData.changePercent,
                    currency: 'USD',
                    sector: 'Commodity',
                    industry: 'Energy',
                    halalStatus: 'halal',
                    lastUpdated: new Date().toISOString()
                };
                cache.prices[symbol] = stockData;
                cache.lastFetch[symbol] = Date.now();
                return stockData;
            }
            
            if (symbol === 'BRENT') {
                const brentData = await fetchBrentPrice();
                const stockData = {
                    symbol: 'BRENT',
                    name: 'Brent Crude Oil',
                    price: brentData.price,
                    change: brentData.change,
                    changePercent: brentData.changePercent,
                    currency: 'USD',
                    sector: 'Commodity',
                    industry: 'Energy',
                    halalStatus: 'halal',
                    lastUpdated: new Date().toISOString()
                };
                cache.prices[symbol] = stockData;
                cache.lastFetch[symbol] = Date.now();
                return stockData;
            }
            
            if (symbol === 'NATGAS') {
                const natgasData = await fetchNatGasPrice();
                const stockData = {
                    symbol: 'NATGAS',
                    name: 'Natural Gas',
                    price: natgasData.price,
                    change: natgasData.change,
                    changePercent: natgasData.changePercent,
                    currency: 'USD',
                    sector: 'Commodity',
                    industry: 'Energy',
                    halalStatus: 'halal',
                    lastUpdated: new Date().toISOString()
                };
                cache.prices[symbol] = stockData;
                cache.lastFetch[symbol] = Date.now();
                return stockData;
            }
            
            // For regular stocks - call our server API
            try {
                const response = await fetch('/api/stock/' + symbol);
                if (response.ok) {
                    const data = await response.json();
                    const stockData = {
                        symbol: symbol,
                        name: data.name || symbol,
                        price: data.price,
                        change: data.change,
                        changePercent: data.changePercent,
                        currency: data.currency || 'USD',
                        lastUpdated: new Date().toISOString()
                    };
                    cache.prices[symbol] = stockData;
                    cache.lastFetch[symbol] = Date.now();
                    return stockData;
                } else {
                    throw new Error('API returned ' + response.status);
                }
            } catch (error) {
                console.error('Error fetching stock ' + symbol + ':', error);
                // Fallback to realistic mock data
                const fallbackStock = {
                    'AAPL': { price: 255.92, change: 0.29, changePercent: 0.11, name: 'Apple Inc.' },
                    'MSFT': { price: 420.00, change: 0.50, changePercent: 0.12, name: 'Microsoft Corporation' },
                    'GOOGL': { price: 175.00, change: 0.30, changePercent: 0.17, name: 'Alphabet Inc.' },
                    'TSLA': { price: 400.00, change: -2.00, changePercent: -0.50, name: 'Tesla Inc.' },
                    'JNJ': { price: 156.00, change: 0.20, changePercent: 0.13, name: 'Johnson & Johnson' },
                    'ADBE': { price: 500.00, change: 1.00, changePercent: 0.20, name: 'Adobe Inc.' },
                    'CRM': { price: 250.00, change: 0.50, changePercent: 0.20, name: 'Salesforce Inc.' },
                    'NVDA': { price: 850.00, change: 5.00, changePercent: 0.59, name: 'NVIDIA Corporation' },
                    'AMD': { price: 169.11, change: 1.22, changePercent: 0.73, name: 'Advanced Micro Devices' }
                };
                return fallbackStock[symbol] || { price: 100, change: 0, changePercent: 0, name: symbol };
            }
        },


        getMultiplePrices: async function(symbols) {
            const results = {};
            for (const symbol of symbols) results[symbol] = await this.getStockPrice(symbol);
            return results;
        },



        getHistoricalData: async function(symbol, days = 30) {
            symbol = symbol.toUpperCase();
            if (!priceHistory[symbol]) initializeStock(symbol);
            return priceHistory[symbol]?.slice(-days) || [];
        },

        searchStocks: async function(query) {
            query = query.toLowerCase();
            return Object.entries(stockDatabase)
                .filter(([symbol, data]) => symbol.toLowerCase().includes(query) || data.name.toLowerCase().includes(query))
                .map(([symbol, data]) => ({ symbol, name: data.name, sector: data.sector, halalStatus: data.halalStatus }));
        },

        getHalalStocks: function() {
            return Object.entries(stockDatabase)
                .filter(([_, data]) => data.halalStatus !== 'haram')
                .map(([symbol, data]) => ({ symbol, name: data.name, halalStatus: data.halalStatus }));
        },

        stopAllUpdates: function() {
            Object.keys(intervals).forEach(s => { clearInterval(intervals[s]); delete intervals[s]; });
        }
    };
})();

// Initialize and load API key
window.DataFeed = DataFeed;

async function loadApiKey() {
    // We're using the server proxy now, no API key needed
    console.log('✅ Using server proxy for commodity prices');
    // Optionally, you can still set a dummy key to satisfy the check
    DataFeed.setApiKey('proxy-mode');
}
