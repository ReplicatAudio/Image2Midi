// import * as fs from 'fs';

const fs = require('fs');

function generateFibonacci(n) {
    let fib = [0, 1];
    for (let i = 2; i < n; i++) {
        fib[i] = fib[i - 1] + fib[i - 2];
    }
    return fib.join(',');
}

fs.writeFileSync('./rawData.csv', generateFibonacci(16));