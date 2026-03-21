{
    "name": "fastify-crud-api",
        "version": "1.0.0",
            "description": "Product CRUD API with Fastify",
                "main": "src/server.js",
                    "scripts": {
        "start:dev": "nodemon src/server.js",
            "build": "esbuild src/server.js --bundle --platform=node --target=node24 --outdir=dist",
                "start:prod": "npm run build && node dist/server.js",
                    "test": "node --test"
    },
    "engines": {
        "node": ">=24.10.0"
    },
    "keywords": [
        "fastify",
        "crud",
        "api"
    ],
        "license": "MIT",
            "dependencies": {
        "@fastify/swagger": "^9.7.0",
            "@fastify/swagger-ui": "^5.2.5",
                "dotenv": "^16.4.5",
                    "fastify": "^5.8.2"
    },
    "devDependencies": {
        "esbuild": "^0.27.4",
            "nodemon": "^3.1.7"
    }
}
