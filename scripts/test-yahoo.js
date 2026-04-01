
const symbols = ["IUSQ.DE", "VWCE.DE"];

async function test() {
    console.log("Testing Yahoo Finance API...");
    for (const sym of symbols) {
        try {
            // Using the chart endpoint which is often more open
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
            console.log(`Fetching ${url}...`);
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`Error: ${res.status} ${res.statusText}`);
                continue;
            }
            const data = await res.json();
            const meta = data?.chart?.result?.[0]?.meta;
            const price = meta?.regularMarketPrice;
            const currency = meta?.currency;
            console.log(`Data for ${sym}: Price=${price} ${currency}`);
        } catch (e) {
            console.error(`Exception for ${sym}:`, e);
        }
    }
}

test();
