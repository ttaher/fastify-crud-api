const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return UUID_V4_REGEX.test(value);
}

function validateProductPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Request body must be a valid JSON object';
  }

  const requiredFields = ['name', 'description', 'price', 'category', 'inStock'];
  for (const field of requiredFields) {
    if (!(field in payload)) {
      return `Field \"${field}\" is required`;
    }
  }

  if (typeof payload.name !== 'string' || payload.name.trim() === '') {
    return 'Field "name" must be a non-empty string';
  }

  if (typeof payload.description !== 'string' || payload.description.trim() === '') {
    return 'Field "description" must be a non-empty string';
  }

  if (typeof payload.category !== 'string' || payload.category.trim() === '') {
    return 'Field "category" must be a non-empty string';
  }

  if (typeof payload.inStock !== 'boolean') {
    return 'Field "inStock" must be a boolean';
  }

  if (typeof payload.price !== 'number' || !Number.isFinite(payload.price) || payload.price <= 0) {
    return 'Field "price" must be a positive number';
  }

  return null;
}

function toProductData(payload) {
  return {
    name: payload.name.trim(),
    description: payload.description.trim(),
    price: payload.price,
    category: payload.category.trim(),
    inStock: payload.inStock
  };
}

module.exports = {
  isValidUuid,
  validateProductPayload,
  toProductData
};
