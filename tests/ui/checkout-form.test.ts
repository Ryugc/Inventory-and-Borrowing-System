import { readFileSync } from "node:fs";
import path from "node:path";

const html = readFileSync(path.join(process.cwd(), "public", "index.html"), "utf8");
const form = html.match(/<form id="checkoutForm"[\s\S]*?<\/form>/)?.[0] ?? "";

describe("Issue 37: checkout form labels sit with their own inputs", () => {
  test("the checkout form exists", () => {
    expect(form).toContain('id="checkoutForm"');
  });

  test.each([["requestId"], ["dueAt"]])("label and input for %s share one field wrapper", (id) => {
    const pair = new RegExp('<div class="field">\\s*<label for="' + id + '">[^<]+</label>\\s*<input id="' + id + '"[^>]*>\\s*</div>');
    expect(form).toMatch(pair);
  });
});
