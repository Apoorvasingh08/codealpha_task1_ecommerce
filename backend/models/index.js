const db = require('./db');

function createModelProxy(modelName) {
  return new Proxy(
    class {}, // Target class shell for construct trap support
    {
      get(target, prop, receiver) {
        const models = db.getModels();
        const model = models[modelName];
        if (!model) {
          throw new Error(`Model "${modelName}" is not initialized yet. Ensure connectDb() is called first.`);
        }

        // Handle class prototype reference
        if (prop === 'prototype') {
          return model.prototype;
        }

        const value = Reflect.get(model, prop);
        if (typeof value === 'function') {
          return value.bind(model);
        }
        return value;
      },
      construct(target, argumentsList, newTarget) {
        const models = db.getModels();
        const model = models[modelName];
        if (!model) {
          throw new Error(`Model "${modelName}" is not initialized yet.`);
        }
        return Reflect.construct(model, argumentsList);
      }
    }
  );
}

module.exports = {
  User: createModelProxy('User'),
  Product: createModelProxy('Product'),
  Order: createModelProxy('Order'),
  Post: createModelProxy('Post'),
  Project: createModelProxy('Project'),
  connectDb: db.connectDb,
  isMock: db.isMock
};
