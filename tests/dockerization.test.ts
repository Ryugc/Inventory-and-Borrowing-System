import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Lab 5 Dockerization", () => {
  it("configures the required Docker ignore patterns without excluding source directories", () => {
    const ignore = read(".dockerignore");
    for (const pattern of [
      "**/node_modules",
      "**/dist",
      "**/build",
      "**/.env",
      "*.log",
      ".git",
      ".gitignore",
      "test-results",
      "*.db",
      "*.sqlite",
      "gha-creds-*.json",
    ]) {
      expect(ignore).toContain(pattern);
    }
    expect(ignore).not.toContain("\npublic/");
    expect(ignore).not.toContain("\nsrc/");
    expect(ignore).not.toContain("\nprisma/");
  });

  it("defines a PID-safe POSIX entrypoint with LF line endings", () => {
    const entrypointPath = path.join(root, "docker-entrypoint.sh");
    const entrypoint = read("docker-entrypoint.sh");
    expect(entrypoint.startsWith("#!/bin/sh\n")).toBe(true);
    expect(entrypoint).toContain("set -e\n");
    expect(entrypoint).toContain('exec "$@"');
    expect(entrypoint).not.toContain("\r");
    expect(existsSync(entrypointPath)).toBe(true);
  });

  it("defines the required multi-stage production Dockerfile", () => {
    const dockerfile = read("Dockerfile");
    expect(dockerfile).toContain("FROM node:20-alpine AS builder");
    expect(dockerfile).toContain("FROM node:20-alpine AS production");
    expect(dockerfile).toContain("RUN apk add --no-cache openssl");
    expect(dockerfile).toContain("RUN npx prisma generate");
    expect(dockerfile).toContain("COPY src ./src/");
    expect(dockerfile).toContain("COPY --from=builder /app/node_modules ./node_modules");
    expect(dockerfile).toContain("COPY --from=builder /app/dist ./dist");
    expect(dockerfile).toContain("COPY --from=builder /app/src ./src");
    expect(dockerfile).toContain("COPY --from=builder /app/prisma ./prisma");
    expect(dockerfile).toContain('USER node');
    expect(dockerfile).toContain('ENTRYPOINT ["./docker-entrypoint.sh"]');
    expect(dockerfile).toContain('CMD ["node", "dist/server.js"]');
  });

  it("defines database, migration, and application Compose services", () => {
    const compose = read("docker-compose.yml");
    expect(compose).toContain("postgres:16-alpine");
    expect(compose).toContain("container_name: inventory-db");
    expect(compose).toContain("service_completed_successfully");
    expect(compose).toContain("npx prisma db push --skip-generate");
    expect(compose).toContain("npx prisma db seed");
    expect(compose).toContain("ADMIN_PASSWORD:");
    expect(compose).toContain("DEMO_USER_PASSWORD:");
    expect(compose).toContain("SEED_DEMO_DATA:");
    expect(compose).toContain("JWT_SECRET:");
    expect(compose).toContain('"3000:3000"');
    expect(compose).toContain("postgres_data:");
  });

  it("compiles src/server.ts as dist/server.js and reports database readiness", () => {
    const tsconfig = read("tsconfig.json");
    const app = read("src/app.ts");
    expect(tsconfig).toContain('"rootDir": "src"');
    expect(tsconfig).toContain('"outDir": "dist"');
    expect(app).toContain('res.json({ status: "ready", db: "connected" })');
  });
});
