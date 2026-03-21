const { randomUUID } = require('node:crypto');

class ProductDb {
  constructor() {
    this.products = new Map();
  }

  async getAll() {
    return Array.from(this.products.values());
  }

  async getById(id) {
    return this.products.get(id) || null;
  }

  async create(data) {
    const product = {
      id: randomUUID(),
      ...data
    };

    this.products.set(product.id, product);
    return product;
  }

  async update(id, data) {
    if (!this.products.has(id)) {
      return null;
    }

    const updated = { id, ...data };
    this.products.set(id, updated);
    return updated;
  }

  async delete(id) {
    return this.products.delete(id);
  }
}

module.exports = {
  ProductDb
};
