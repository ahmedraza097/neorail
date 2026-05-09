const LocalDB = require('./local_db');

const db = new LocalDB('tickets');

function Ticket(data) {
    return db.init(data);
}

// Copy all methods from db to Ticket function
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(db));
methods.forEach(method => {
    if (typeof db[method] === 'function' && method !== 'constructor') {
        Ticket[method] = db[method].bind(db);
    }
});

module.exports = Ticket;