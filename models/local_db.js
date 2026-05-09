const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
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
        const data = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(data);
    }

    async write(data) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    _createQuery(executor) {
        const promise = executor();
        const query = {
            then: (onFullfilled, onRejected) => promise.then(onFullfilled, onRejected),
            catch: (onRejected) => promise.catch(onRejected),
            select: () => query, // Chaining select returns the query itself
            sort: () => query,
            limit: () => query,
            populate: () => query,
        };
        return query;
    }

    find(query = {}) {
        return this._createQuery(async () => {
            const data = await this.read();
            return data.filter(item => {
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
        });
    }

    findOne(query = {}) {
        return this._createQuery(async () => {
            const data = await this.read();
            const result = data.find(item => {
                if (query.$or) {
                    return query.$or.some(q => {
                        for (let key in q) {
                            const val = q[key];
                            if (val instanceof RegExp) {
                                if (val.test(item[key])) return true;
                            } else if (item[key] === val) {
                                return true;
                            }
                        }
                        return false;
                    });
                }
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
            if (result) this._attachMethods(result);
            return result;
        });
    }

    findById(id) {
        return this._createQuery(async () => {
            const data = await this.read();
            const result = data.find(item => item._id === id);
            if (result) this._attachMethods(result);
            return result;
        });
    }

    _attachMethods(result) {
        result.save = async () => {
            const dbData = await this.read();
            const index = dbData.findIndex(i => i._id === result._id);
            if (index !== -1) {
                const toSave = { ...result };
                delete toSave.save;
                delete toSave.select;
                dbData[index] = toSave;
                await this.write(dbData);
            }
            return result;
        };
        result.select = () => result;
    }

    async findByIdAndDelete(id) {
        const data = await this.read();
        const index = data.findIndex(item => item._id === id);
        if (index === -1) return null;
        const deleted = data.splice(index, 1);
        await this.write(data);
        return deleted[0];
    }

    // Support for const user = new User(data); await user.save();
    init(doc) {
        const newObj = { ...doc };
        newObj._isNew = true;
        newObj.save = async () => {
            const data = await fs.readFileSync(this.filePath, 'utf8');
            const dbData = JSON.parse(data);
            
            const docToSave = { ...newObj };
            delete docToSave._isNew;
            delete docToSave.save;

            if (newObj._isNew) {
                docToSave._id = uuidv4();
                docToSave.createdAt = new Date();
                dbData.push(docToSave);
                Object.assign(newObj, docToSave);
                newObj._isNew = false;
            } else {
                const index = dbData.findIndex(item => item._id === newObj._id);
                if (index !== -1) {
                    dbData[index] = docToSave;
                }
            }
            
            fs.writeFileSync(this.filePath, JSON.stringify(dbData, null, 2));
            return newObj;
        };
        return newObj;
    }

    async create(doc) {
        const data = await this.read();
        const newDoc = { ...doc, _id: uuidv4(), createdAt: new Date() };
        data.push(newDoc);
        await this.write(data);
        return newDoc;
    }

    async countDocuments() {
        const data = await this.read();
        return data.length;
    }

    findByIdAndUpdate(id, update, options = {}) {
        return this._createQuery(async () => {
            const data = await this.read();
            const index = data.findIndex(item => item._id === id);
            if (index === -1) return null;
            
            let updateData = update.$set ? { ...data[index], ...update.$set } : { ...data[index], ...update };
            data[index] = updateData;
            
            await this.write(data);
            if (data[index]) this._attachMethods(data[index]);
            return data[index];
        });
    }

    findOneAndUpdate(query, update) {
        return this._createQuery(async () => {
            const data = await this.read();
            const index = data.findIndex(item => {
                if (query.$or) {
                    return query.$or.some(q => {
                        for (let key in q) {
                            const val = q[key];
                            if (val instanceof RegExp) {
                                if (val.test(item[key])) return true;
                            } else if (item[key] === val) {
                                return true;
                            }
                        }
                        return false;
                    });
                }
                for (let key in query) {
                    // Support basic $exists: false check
                    if (typeof query[key] === 'object' && query[key].$exists === false) {
                        if (item[key] !== undefined) return false;
                    } else {
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
                }
                return true;
            });
            if (index === -1) return null;
            
            let updateData = update.$set ? { ...data[index], ...update.$set } : { ...data[index], ...update };
            data[index] = updateData;
            
            await this.write(data);
            if (data[index]) this._attachMethods(data[index]);
            return data[index];
        });
    }

    async updateOne(query, update) {
        const q = this.findOneAndUpdate(query, update);
        return await q;
    }
}

module.exports = LocalDB;
