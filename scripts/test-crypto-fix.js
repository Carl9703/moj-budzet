/* eslint-disable @typescript-eslint/no-require-imports */
const fetch = require('node-fetch');


async function checkPrice(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`❌ ${symbol} -> Status ${res.status}`);
            return;
        }
        const data = await res.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        const currency = data?.chart?.result?.[0]?.meta?.currency;

        if (price) {
            console.log(`✅ ${symbol} -> ${price} ${currency}`);
        } else {
            console.log(`⚠️  ${symbol} -> No price found in response`);
        }
    } catch (e) {
        console.error(`❌ ${symbol} -> Error: ${e.message}`);
    }
}

async function run() {
    console.log('--- Testing Raw Symbols ---');
    await checkPrice('BNB');
    await checkPrice('CRO');

    console.log('\n--- Testing -USD Suffix ---');
    await checkPrice('BNB-USD');
    await checkPrice('CRO-USD');
}

run();
