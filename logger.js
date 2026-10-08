const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.pasta = path.join(__dirname, '/logs');
        this.arquivo = path.join(this.pasta, 'errors.log');
        fs.mkdirSync(this.pasta, { recursive: true });
    }

    erro(mensagem, detalhe) {
        let linha = `[${new Date().toISOString()}] ${mensagem}: ${detalhe}\n`;
        fs.appendFileSync(this.arquivo, linha);
        console.error(mensagem, detalhe);
    }
}

module.exports = Logger;