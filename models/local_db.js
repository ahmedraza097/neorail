const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

class LocalDB {
    constructor(collectionName) {
        this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([]));
        }
    }

    async read() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(data || '[]');
        } catch (e) {
            return [];
        }
    }

    async write(data) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    _createQuery(executor) {
        const promise = executor();
        const query = {
            then: (onFullfilled, onRejected) => promise.then(onFullfilled, onRejected),
            catch: (onRejected) => promise.catch(onRejected),
            select: () => query,
            sort: () => query,
            limit: () => query,
            populate: () => query,
        };
        return query;
    }

    _attachMethods(doc) {
        if (!doc) return doc;
        
        doc.save = async () => {
            const data = await this.read();
            const index = data.findIndex(item => item._id === doc._id);
            
            const toSave = { ...doc };
            // Remove methods and internal flags
            const keysToRemove = ['save', 'select', 'then', 'catch', 'sort', 'limit', 'populate', '_isNew'];
            keysToRemove.forEach(k => delete toSave[k]);

            if (index === -1) {
                if (!toSave._id) toSave._id = uuidv4();
                if (!toSave.createdAt) toSave.createdAt = new Date().toISOString();
                data.push(toSave);
            } else {
                data[index] = toSave;
            }
            
            await this.write(data);
            return doc;
        };

        doc.select = () => doc;
        return doc;
    }

    init(data) {
        const doc = { ...data };
        doc._isNew = true;
        return this._attachMethods(doc);
    }

    find(query = {}) {
        return this._createQuery(async () => {
            const data = await this.read();
            const filtered = data.filter(item => {
                for (let key in query) {
                    const val = query[key];
                    if (val instanceof RegExp) {
                        if (!val.test(item[key])) return false;
                    } else if (typeof val === 'object' && val.$regex) {
                        const re = val.$regex instanceof RegExp ? val.$regex : new RegExp(val.$regex, 'i');
                        if (!re.test(item[key])) return false;
                    } else if (typeof val === 'object' && val.$in) {
                        if (!val.$in.includes(item[key])) return false;
                    } else if (item[key] !== val) {
                        return false;
                    }
                }
                return true;
            });
            return filtered.map(d => this._attachMethods(d));
        });
    }

    findOne(query = {}) {
        return this._createQuery(async () => {
            const data = await this.read();
            const result = data.find(item => {
                if (query.$or) {
                    return query.$or.some(q => {
                        for (let key in q) {
                            if (item[key] === q[key]) return true;
                        }
                        return false;
                    });
                }
                for (let key in query) {
                    if (item[key] !== query[key]) return false;
                }
                return true;
            });
            return result ? this._attachMethods(result) : null;
        });
    }

    findById(id) {
        return this._createQuery(async () => {
            const data = await this.read();
            const result = data.find(item => item._id === id);
            return result ? this._attachMethods(result) : null;
        });
    }

    async findByIdAndDelete(id) {
        const data = await this.read();
        const index = data.findIndex(item => item._id === id);
        if (index === -1) return null;
        const deleted = data.splice(index, 1);
        await this.write(data);
        return deleted[0];
    }

    async create(doc) {
        const d = this.init(doc);
        return await d.save();
    }

    async countDocuments() {
        const data = await this.read();
        return data.length;
    }

    findByIdAndUpdate(id, update) {
        return this._createQuery(async () => {
            const doc = await this.findById(id);
            if (!doc) return null;
            const updateData = update.$set ? update.$set : update;
            Object.assign(doc, updateData);
            return await doc.save();
        });
    }

    findOneAndUpdate(query, update) {
        return this._createQuery(async () => {
            const doc = await this.findOne(query);
            if (!doc) return null;
            const updateData = update.$set ? update.$set : update;
            Object.assign(doc, updateData);
            return await doc.save();
        });
    }
}

module.exports = LocalDB;
