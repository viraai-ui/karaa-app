// @ts-nocheck -- Jest runs in Node; the mobile package intentionally does not ship Node typings.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { subverticalPortfolios } from "../src/demo/subvertical-projects";
import { verticalDetails } from "../src/demo/vertical-detail";

const manifestPath = path.resolve(__dirname, "../src/demo/subvertical-project-assets.ts");
const projectsPath = path.resolve(__dirname, "../src/demo/subvertical-projects.ts");
const manifestSource = readFileSync(manifestPath, "utf8");
const projectsSource = readFileSync(projectsPath, "utf8");
const refs = [...manifestSource.matchAll(/require\("\.\.\/\.\.\/assets\/subverticals\/generated\/([^\"]+\.webp)"\)/g)].map((match) => match[1]);

function webpDimensions(buffer: Buffer): [number, number] {
  expect(buffer.toString("ascii", 0, 4)).toBe("RIFF");
  expect(buffer.toString("ascii", 8, 12)).toBe("WEBP");
  const kind = buffer.toString("ascii", 12, 16);
  if (kind === "VP8X") return [1 + buffer.readUIntLE(24, 3), 1 + buffer.readUIntLE(27, 3)];
  if (kind === "VP8 ") return [buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff];
  if (kind === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)];
  }
  throw new Error(`Unsupported WebP chunk ${kind}`);
}

describe("final non-Healthcare subvertical imagery", () => {
  const healthcare = subverticalPortfolios.filter((page) => page.verticalId === "healthcare-life-sciences");
  const nonHealthcare = subverticalPortfolios.filter((page) => page.verticalId !== "healthcare-life-sciences");

  it("covers exactly 32 pages and 96 unique project IDs without changing routes", () => {
    expect(healthcare).toHaveLength(4);
    expect(nonHealthcare).toHaveLength(32);
    const projects = nonHealthcare.flatMap((page) => page.projects);
    expect(projects).toHaveLength(96);
    expect(new Set(projects.map((project) => project.id)).size).toBe(96);
    expect(nonHealthcare.map((page) => page.id)).toEqual(
      verticalDetails.filter((vertical) => vertical.id !== "healthcare-life-sciences").flatMap((vertical) =>
        vertical.pathways.map((pathway) => pathway.routeId ?? pathway.title.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")),
      ),
    );
    expect(verticalDetails.find((vertical) => vertical.id === "healthcare-life-sciences")?.pathways[2].routeId).toBe("digital-health-telemedicine-emergency-response");
  });

  it("uses a Metro-safe manifest of 96 generated assets and no conceptual references", () => {
    expect(refs).toHaveLength(96);
    expect(new Set(refs).size).toBe(96);
    expect((projectsSource.match(/conceptual-healthcare-campus\.webp/g) ?? [])).toHaveLength(1);
    expect(projectsSource).not.toMatch(/conceptual-(urban|logistics|clean-energy|hospitality|real-estate|advanced-manufacturing|spiritual|education)/);
    for (const page of nonHealthcare) {
      expect(refs.filter((ref) => ref.includes(`-${page.id}/`)).map((ref) => path.basename(ref))).toEqual(
        page.projects.map((project) => `${project.id}.webp`),
      );
    }
  });

  it("ships valid 800px square 70–225KB WebPs with unique hashes", () => {
    const hashes = new Set<string>();
    for (const ref of refs) {
      const file = path.resolve(__dirname, "../assets/subverticals/generated", ref);
      expect(existsSync(file)).toBe(true);
      const bytes = statSync(file).size;
      expect(bytes).toBeGreaterThanOrEqual(70 * 1024);
      expect(bytes).toBeLessThanOrEqual(225 * 1024);
      const buffer = readFileSync(file);
      expect(webpDimensions(buffer)).toEqual([800, 800]);
      hashes.add(createHash("sha256").update(buffer).digest("hex"));
    }
    expect(hashes.size).toBe(96);
  });

  it("keeps all Healthcare projects and manual references excluded from generation", () => {
    expect(healthcare.flatMap((page) => page.projects).map((project) => project.id)).toEqual([
      "aarohan-medical-city-pune", "sanjeevani-advanced-care-hospital", "narmada-integrated-health-campus",
      "diagnostics-clinics-and-preventive-health-1", "diagnostics-clinics-and-preventive-health-2", "diagnostics-clinics-and-preventive-health-3",
      "digital-health-and-telemedicine-1", "digital-health-and-telemedicine-2", "digital-health-and-telemedicine-3",
      "medical-education-life-sciences-and-research-1", "medical-education-life-sciences-and-research-2", "medical-education-life-sciences-and-research-3",
    ]);
    expect(refs.some((ref) => ref.startsWith("04-healthcare-life-sciences/"))).toBe(false);
    expect(projectsSource).toContain("../../assets/subverticals/multi-specialty-hospitals/hero.webp");
    expect(projectsSource).toContain("../../assets/subverticals/multi-specialty-hospitals/aarohan-medical-city.webp");
  });
});
