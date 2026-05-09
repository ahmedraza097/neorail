const LocalDB = require('./local_db');

const db = new LocalDB('users');

function User(data) {
    return db.init(data);
}

// Copy all methods from db to User function
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(db));
methods.forEach(method => {
    if (typeof db[method] === 'function' && method !== 'constructor') {
        User[method] = db[method].bind(db);
    }
});

module.exports = User;
