const test = require('node:test');
const assert = require('node:assert/strict');

const { buildApp } = require('../src/app');
const { ProductDb } = require('../src/db');

function createPayload(overrides = {}) {
  return {
    name: 'Laptop',
    description: '14 inch ultrabook',
    price: 1299,
    category: 'electronics',
    inStock: true,
    ...overrides
  };
}

test('CRUD lifecycle scenario', async () => {
  const app = buildApp({ db: new ProductDb() });

  const allInitial = await app.inject({ method: 'GET', url: '/api/products' });
  assert.equal(allInitial.statusCode, 200);
  assert.deepEqual(JSON.parse(allInitial.body), []);

  const createResponse = await app.inject({
    method: 'POST',
    url: '/api/products',
    payload: createPayload()
  });

  assert.equal(createResponse.statusCode, 201);
  const created = JSON.parse(createResponse.body);
  assert.equal(created.name, 'Laptop');
  assert.ok(created.id);

  const byIdResponse = await app.inject({
    method: 'GET',
    url: `/api/products/${created.id}`
  });
  assert.equal(byIdResponse.statusCode, 200);
  assert.equal(JSON.parse(byIdResponse.body).id, created.id);

  const updateResponse = await app.inject({
    method: 'PUT',
    url: `/api/products/${created.id}`,
    payload: createPayload({
      name: 'Laptop Pro',
      price: 1499,
      inStock: false
    })
  });

  assert.equal(updateResponse.statusCode, 200);
  const updated = JSON.parse(updateResponse.body);
  assert.equal(updated.id, created.id);
  assert.equal(updated.name, 'Laptop Pro');
  assert.equal(updated.inStock, false);

  const deleteResponse = await app.inject({
    method: 'DELETE',
    url: `/api/products/${created.id}`
  });
  assert.equal(deleteResponse.statusCode, 204);

  const deletedRead = await app.inject({
    method: 'GET',
    url: `/api/products/${created.id}`
  });
  assert.equal(deletedRead.statusCode, 404);

  await app.close();
});

test('returns 400 for invalid UUID', async () => {
  const app = buildApp({ db: new ProductDb() });

  const response = await app.inject({
    method: 'GET',
    url: '/api/products/not-a-uuid'
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.body, /Invalid productId/i);

  await app.close();
});

test('returns 400 for invalid POST payload', async () => {
  const app = buildApp({ db: new ProductDb() });

  const missingField = await app.inject({
    method: 'POST',
    url: '/api/products',
    payload: {
      name: 'Book',
      description: 'A nice book',
      category: 'books',
      inStock: true
    }
  });

  assert.equal(missingField.statusCode, 400);
  assert.match(missingField.body, /required/i);

  const invalidPrice = await app.inject({
    method: 'POST',
    url: '/api/products',
    payload: createPayload({ price: 0 })
  });

  assert.equal(invalidPrice.statusCode, 400);
  assert.match(invalidPrice.body, /positive number/i);

  await app.close();
});

test('returns 404 for non-existing endpoint', async () => {
  const app = buildApp({ db: new ProductDb() });

  const response = await app.inject({
    method: 'GET',
    url: '/some-non/existing/resource'
  });

  assert.equal(response.statusCode, 404);
  assert.match(response.body, /not found/i);

  await app.close();
});
