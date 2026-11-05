import request from "supertest";
import { app } from "../../src/app.js";

describe("STS-UI single-page web interface", () => {
  test("STS-UI-001: root serves the single-page index", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/html/);
    expect(response.text).toContain("Inventory and Borrowing System");
  });

  test("STS-UI-002: static styles and script are served", async () => {
    const styles = await request(app).get("/styles.css");
    const script = await request(app).get("/app.js");

    expect(styles.status).toBe(200);
    expect(styles.headers["content-type"]).toMatch(/css/);
    expect(script.status).toBe(200);
    expect(script.headers["content-type"]).toMatch(/javascript/);
  });

  test("STS-UI-003: page and script include top-level HTTP error alert handling", async () => {
    const page = await request(app).get("/");
    const script = await request(app).get("/app.js");

    expect(page.text).toContain('id="httpAlert"');
    expect(script.text).toContain("HTTP ");
    expect(script.text).toContain("showHttpAlert(response.status, message)");
  });
});
