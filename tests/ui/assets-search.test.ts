import { readFileSync } from "node:fs";
import path from "node:path";

const html = readFileSync(path.join(process.cwd(), "public", "index.html"), "utf8");
const script = readFileSync(path.join(process.cwd(), "public", "app.js"), "utf8");

describe("C-09 asset catalog filtering controls", () => {
  test("STS-SEARCH-004: controls update catalog results without changing existing IDs", () => {
    const controls = html.slice(html.indexOf('id="catalogFilters"'), html.indexOf('id="catalogGrid"'));

    expect(controls).toContain('id="assetSearchInput"');
    expect(controls).toContain('id="assetCategoryFilter"');
    expect(controls).toContain('id="assetStatusFilter"');
    expect(controls).toContain('id="clearAssetFiltersButton"');
    expect(html.indexOf('id="catalogFilters"')).toBeLessThan(html.indexOf('id="catalogGrid"'));
    expect(script).toContain("URLSearchParams");
    expect(script).toContain('$("#catalogGrid").innerHTML = assets.map');
    expect(script).toContain('$("#assetSearchInput").addEventListener("input", loadCatalog)');
    expect(script).toContain('$("#assetCategoryFilter").addEventListener("input", loadCatalog)');
    expect(script).toContain('$("#assetStatusFilter").addEventListener("change", loadCatalog)');
    expect(script).toContain('$("#catalogFilters").reset()');
    for (const id of ["catalogGrid", "assetForm", "checkoutForm", "requestId", "dueAt"]) {
      expect(html).toContain(`id="${id}"`);
    }
  });
});
