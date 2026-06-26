const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db.json');
let useMock = false;

// Initialize mock DB file if it doesn't exist
function initMockDb() {
  if (!fs.existsSync(dbPath)) {
    const defaultData = {
      users: [],
      products: [],
      orders: [],
      posts: [],
      projects: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
  }
}

function readData() {
  initMockDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Custom Mock Model class simulating Mongoose
class MockModel {
  constructor(collection, data) {
    this._collection = collection;
    Object.assign(this, data);
    if (!this._id) {
      this._id = Math.random().toString(36).substring(2, 11);
    }
    if (!this.createdAt) {
      this.createdAt = new Date().toISOString();
    }
    this.updatedAt = new Date().toISOString();
  }

  async save() {
    const data = readData();
    const list = data[this._collection] || [];
    const index = list.findIndex(item => item._id === this._id);
    const selfData = { ...this };
    delete selfData._collection;

    if (index >= 0) {
      list[index] = { ...list[index], ...selfData, updatedAt: new Date().toISOString() };
    } else {
      list.push(selfData);
    }
    data[this._collection] = list;
    writeData(data);
    return selfData;
  }
}

function createMockModel(collectionName) {
  return class extends MockModel {
    constructor(data) {
      super(collectionName, data);
    }

    static getCollectionName() {
      return collectionName;
    }

    static async find(query = {}) {
      const data = readData();
      const list = data[collectionName] || [];
      return list.filter(item => {
        for (let key in query) {
          const val = query[key];
          if (val && typeof val === 'object') {
            if (val.$in) {
              if (Array.isArray(item[key])) {
                if (!val.$in.some(v => item[key].includes(v))) return false;
              } else {
                if (!val.$in.includes(item[key])) return false;
              }
            } else if (val.$all) {
              if (!Array.isArray(item[key]) || !val.$all.every(v => item[key].includes(v))) return false;
            }
          } else {
            if (Array.isArray(item[key])) {
              if (!item[key].includes(val)) return false;
            } else if (item[key] !== val) {
              return false;
            }
          }
        }
        return true;
      });
    }

    static async findOne(query = {}) {
      const list = await this.find(query);
      return list[0] ? new this(list[0]) : null;
    }

    static async findById(id) {
      return this.findOne({ _id: id });
    }

    static async create(data) {
      const inst = new this(data);
      return inst.save();
    }

    static async findByIdAndUpdate(id, update, options = {}) {
      const data = readData();
      const list = data[collectionName] || [];
      const index = list.findIndex(item => item._id === id);
      if (index < 0) return null;

      let item = { ...list[index] };

      // Handle MongoDB update operators like $push, $pull, $set
      if (update.$push) {
        for (let key in update.$push) {
          if (!item[key]) item[key] = [];
          item[key].push(update.$push[key]);
        }
      }
      if (update.$pull) {
        for (let key in update.$pull) {
          if (Array.isArray(item[key])) {
            item[key] = item[key].filter(v => v !== update.$pull[key]);
          }
        }
      }
      const sets = update.$set || update;
      for (let key in sets) {
        if (key !== '$push' && key !== '$pull' && key !== '$set') {
          item[key] = sets[key];
        }
      }

      item.updatedAt = new Date().toISOString();
      list[index] = item;
      data[collectionName] = list;
      writeData(data);
      return new this(item);
    }

    static async findByIdAndDelete(id) {
      const data = readData();
      const list = data[collectionName] || [];
      const index = list.findIndex(item => item._id === id);
      if (index < 0) return null;
      const deleted = list.splice(index, 1)[0];
      data[collectionName] = list;
      writeData(data);
      return deleted;
    }

    static async deleteOne(query = {}) {
      const data = readData();
      const list = data[collectionName] || [];
      const index = list.findIndex(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      });
      if (index >= 0) {
        list.splice(index, 1);
        data[collectionName] = list;
        writeData(data);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    }
  };
}

// Defining mongoose schemas for real DB
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  followers: [{ type: String }],
  following: [{ type: String }],
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  title: String,
  price: Number,
  description: String,
  image: String,
  category: String,
  rating: {
    rate: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  userId: String,
  items: [{
    productId: String,
    title: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalAmount: Number,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  userId: String,
  username: String,
  avatar: String,
  caption: String,
  image: String,
  likes: [{ type: String }],
  comments: [{
    _id: { type: String, default: () => Math.random().toString(36).substring(2, 11) },
    userId: String,
    username: String,
    avatar: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  name: String,
  description: String,
  members: [String],
  columns: [{
    id: String,
    title: String,
    tasks: [{
      _id: { type: String, default: () => Math.random().toString(36).substring(2, 11) },
      title: String,
      description: String,
      priority: { type: String, default: 'Medium' }, // Low, Medium, High
      dueDate: String,
      assignee: String,
      comments: [{
        userId: String,
        username: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
      }]
    }]
  }]
}, { timestamps: true });

let models = {};

// Connection function
async function connectDb() {
  if (process.env.FORCE_MOCK_DB === 'true') {
    console.log('⚠️ Forced Mock Database Mode enabled.');
    setupMockModels();
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️ No MONGODB_URI found in env. Falling back to local JSON database.');
    setupMockModels();
    return;
  }

  try {
    // Try to connect to Mongo with 3 second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('🚀 Connected to MongoDB successfully.');
    models.User = mongoose.model('User', UserSchema);
    models.Product = mongoose.model('Product', ProductSchema);
    models.Order = mongoose.model('Order', OrderSchema);
    models.Post = mongoose.model('Post', PostSchema);
    models.Project = mongoose.model('Project', ProjectSchema);
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.log('⚠️ Falling back to local JSON database (db.json).');
    setupMockModels();
  }
}

function setupMockModels() {
  useMock = true;
  initMockDb();
  models.User = createMockModel('users');
  models.Product = createMockModel('products');
  models.Order = createMockModel('orders');
  models.Post = createMockModel('posts');
  models.Project = createMockModel('projects');
}

module.exports = {
  connectDb,
  getModels: () => models,
  isMock: () => useMock
};
