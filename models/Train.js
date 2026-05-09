const LocalDB = require('./local_db');

const db = new LocalDB('trains');

function Train(data) {
    return db.init(data);
}

// Copy all methods from db to Train function
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(db));
methods.forEach(method => {
    if (typeof db[method] === 'function' && method !== 'constructor') {
        Train[method] = db[method].bind(db);
    }
});

module.exports = Train;
