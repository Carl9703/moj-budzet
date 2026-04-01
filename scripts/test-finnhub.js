
const apiKey = "d5l3ri1r01qgqufk3ulgd5l3ri1r01qgqufk3um0";
const symbols = ["IUSQ.DE", "VWCE.DE"];

async function test() {
    console.log("Testing Finnhub API...");
    for (const sym of symbols) {
        try {
            const url = `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${apiKey}`;
            console.log(`Fetching ${url}...`);
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`Error: ${res.status} ${res.statusText}`);
                continue;
            }
            const data = await res.json();
            console.log(`Data for ${sym}:`, data);
        } catch (e) {
            console.error(`Exception for ${sym}:`, e);
        }
    }
}

test();
