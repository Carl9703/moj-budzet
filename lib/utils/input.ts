export const handleMoneyInput = (
    value: string,
    setter: (val: string) => void
) => {
    const normalized = value.replace(',', '.');
    
    if (normalized === '') {
        setter('');
        return;
    }

    // Wyrażenie regularne: opcjonalny minus, cyfry, opcjonalnie jedna kropka i max 2 cyfry po kropce
    const regex = /^-?\d+(\.\d{0,2})?$/;
    
    if (regex.test(normalized)) {
        setter(normalized);
    }
};

export const handleCalculatorInput = (
    value: string,
    setter: (val: string) => void
) => {
    const normalized = value.replace(',', '.');
    
    // Pozwalamy tylko na liczby i proste operatory matematyczne
    const regex = /^[0-9+\-*/.()\s]*$/;
    
    if (regex.test(normalized)) {
        setter(normalized);
    }
};

export const blockInvalidDecimals = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const val = target.value;
    if (val.includes('.') && val.split('.')[1].length > 2) {
        target.value = val.slice(0, val.indexOf('.') + 3);
    }
};
