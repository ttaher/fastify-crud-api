require('dotenv').config();

const { buildApp } = require('./app');
const { ProductDb } = require('./db');

async function start() {
  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || '0.0.0.0';
  const db = new ProductDb();

  const app = buildApp({ db, logger: true });

  try {
    await app.listen({ port, host });
    app.log.info(`Server listening on http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
