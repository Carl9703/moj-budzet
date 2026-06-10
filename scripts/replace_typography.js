const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('d:/Apps/QuantumBudget/app');
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const replaced = content.replace(/text-\[(?:9|10|11)px\]/g, 'text-xs');
    if (content !== replaced) {
        fs.writeFileSync(f, replaced);
        console.log('Updated', f);
    }
});
