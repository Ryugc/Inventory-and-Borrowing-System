process.env.NODE_ENV = "test";
try { (process as unknown as { loadEnvFile?: () => void }).loadEnvFile?.(); } catch { /* no .env file (CI sets variables directly) */ }

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL must be set to a separate test database");
if (!/test/i.test(new URL(url).pathname)) throw new Error("TEST_DATABASE_URL must point to a database whose name contains 'test'");
process.env.DATABASE_URL = url;
