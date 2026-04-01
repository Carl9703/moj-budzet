
const symbols = ["IUSQ.DE", "VWCE.DE", "EURPLN=X", "USDPLN=X"];

async function test() {
    console.log("Testing Yahoo Finance Batch API...");
    try {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;
        console.log(`Fetching ${url}...`);
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            return;
        }
        const data = await res.json();
        const results = data?.quoteResponse?.result;

        results.forEach(r => {
            console.log(`Symbol: ${r.symbol}, Price: ${r.regularMarketPrice}, Currency: ${r.currency}`);
        });

    } catch (e) {
        console.error(`Exception:`, e);
    }
}

test();
