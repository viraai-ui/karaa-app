import type { ImageSourcePropType } from "react-native";
import { verticalDetails } from "./vertical-detail";

export type PortfolioStatus = "On Track" | "In Progress";
export type PortfolioProject = {
  id: string;
  name: string;
  location: string;
  status: PortfolioStatus;
  progress: number;
  update: string;
  currentMilestone: string;
  currentYear: string;
  stages: readonly string[];
  completedActivity: string;
  openingYear: string;
  image: ImageSourcePropType;
};
export type SubverticalPortfolio = {
  id: string;
  verticalId: string;
  verticalNumber: string;
  verticalTitle: string;
  pathwayNumber: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchCategory: string;
  horizon: string;
  hero: ImageSourcePropType;
  projects: readonly PortfolioProject[];
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const imagePool = [
  require("../../assets/verticals/conceptual-urban-district.webp"),
  require("../../assets/verticals/conceptual-logistics-port.webp"),
  require("../../assets/verticals/conceptual-clean-energy.webp"),
  require("../../assets/verticals/conceptual-healthcare-campus.webp"),
  require("../../assets/verticals/conceptual-hospitality-resort.webp"),
  require("../../assets/verticals/conceptual-real-estate-district.webp"),
  require("../../assets/verticals/conceptual-advanced-manufacturing.webp"),
  require("../../assets/verticals/conceptual-spiritual-heritage.webp"),
  require("../../assets/verticals/conceptual-education-innovation.webp"),
] as const;
const cities = [
  ["Pune", "Maharashtra"],
  ["Hyderabad", "Telangana"],
  ["Indore", "Madhya Pradesh"],
  ["Ahmedabad", "Gujarat"],
  ["Bengaluru", "Karnataka"],
  ["Jaipur", "Rajasthan"],
  ["Kochi", "Kerala"],
  ["Bhubaneswar", "Odisha"],
  ["Lucknow", "Uttar Pradesh"],
] as const;
const prefixes = ["Aarohan", "Sanjeevani", "Narmada"];
const nouns = ["Gateway", "Commons", "District"];
const updates = [
  "Primary works advancing to schedule",
  "Core delivery package is taking shape",
  "Foundation package progressing across the site",
];
const milestones = ["Core Works", "Main Package", "Foundations"];
const completed = [
  "Site preparation complete",
  "Enabling works complete",
  "Site mobilised",
];

function genericProjects(
  title: string,
  verticalIndex: number,
  pathwayIndex: number,
  image: ImageSourcePropType,
): PortfolioProject[] {
  const subject = title.split(/[:&,]/)[0].trim();
  return [0, 1, 2].map((index) => {
    const place =
      cities[(verticalIndex * 2 + pathwayIndex + index) % cities.length];
    const progress = [44, 58, 31][index] + ((verticalIndex + pathwayIndex) % 4);
    return {
      id: `${slugify(title)}-${index + 1}`,
      name: `${prefixes[index]} ${subject} ${nouns[index]}`,
      location: `${place[0]}, ${place[1]}`,
      status: index === 2 ? "In Progress" : "On Track",
      progress,
      update: updates[index],
      currentMilestone: milestones[index],
      currentYear: index === 0 ? "2026" : "2025",
      stages:
        index === 0
          ? ["Planning ✓", "Core Works", "Commissioning", "Opening 2030"]
          : index === 1
            ? ["Design ✓", "Main Package", "Systems", "Opening 2030"]
            : ["Approvals ✓", "Foundations", "Delivery", "Opening 2030"],
      completedActivity: completed[index],
      openingYear: "2030",
      image,
    };
  });
}

const healthcareProjects: PortfolioProject[] = [
  {
    id: "aarohan-medical-city-pune",
    name: "Aarohan Medical City",
    location: "Pune, Maharashtra",
    status: "On Track",
    progress: 42,
    update: "Structural frame underway",
    currentMilestone: "Structure",
    currentYear: "2026",
    stages: ["Planning ✓", "Site Preparation ✓", "Structure NOW", "Building Envelope Next", "Clinical Fit-out", "Opening 2030"],
    completedActivity: "Site preparation complete",
    openingYear: "2030",
    image: require("../../assets/subverticals/multi-specialty-hospitals/aarohan-medical-city.webp"),
  },
  {
    id: "sanjeevani-advanced-care-hospital",
    name: "Sanjeevani Advanced Care Hospital",
    location: "Hyderabad, Telangana",
    status: "On Track",
    progress: 56,
    update: "Main hospital block rising",
    currentMilestone: "Main Block",
    currentYear: "2026",
    stages: ["Concept Design ✓", "Detailed Design ✓", "Substructure ✓", "Main Block NOW", "Façade & MEP Next", "Opening 2030"],
    completedActivity: "Substructure complete",
    openingYear: "2030",
    image: require("../../assets/subverticals/multi-specialty-hospitals/sanjeevani-advanced-care-hospital.webp"),
  },
  {
    id: "narmada-integrated-health-campus",
    name: "Narmada Integrated Health Campus",
    location: "Indore, Madhya Pradesh",
    status: "In Progress",
    progress: 28,
    update: "Foundation phase in progress",
    currentMilestone: "Foundations",
    currentYear: "2026",
    stages: ["Land & Approvals ✓", "Site Mobilisation ✓", "Foundations NOW", "Superstructure Next", "Services & Fit-out", "Opening 2030"],
    completedActivity: "Site mobilised",
    openingYear: "2030",
    image: require("../../assets/subverticals/multi-specialty-hospitals/narmada-integrated-health-campus.webp"),
  },
];

export const subverticalPortfolios: readonly SubverticalPortfolio[] =
  verticalDetails.flatMap((vertical, verticalIndex) =>
    vertical.pathways.map((pathway, pathwayIndex) => {
      // A display-title polish must not break existing deep links.
      const id = pathway.routeId ?? slugify(pathway.title);
      const healthcare =
        vertical.id === "healthcare-life-sciences" && pathwayIndex === 0;
      const category = pathway.title.toLowerCase().includes("hospital")
        ? "hospitals"
        : pathway.title.toLowerCase().split(/[,:&]/)[0].trim();
      return {
        id,
        verticalId: vertical.id,
        verticalNumber: vertical.number,
        verticalTitle: vertical.title,
        pathwayNumber: String(pathwayIndex + 1).padStart(2, "0"),
        title: pathway.title,
        subtitle: pathway.description,
        searchPlaceholder: `Search ${category}`,
        searchCategory: category,
        horizon: "2030",
        hero: healthcare
          ? require("../../assets/subverticals/multi-specialty-hospitals/hero.webp")
          : pathway.image,
        projects: healthcare
          ? healthcareProjects
          : genericProjects(
              pathway.title,
              verticalIndex,
              pathwayIndex,
              imagePool[verticalIndex],
            ),
      };
    }),
  );

export function subverticalPortfolioForId(id: string): SubverticalPortfolio {
  const result = subverticalPortfolios.find((item) => item.id === id);
  if (!result) throw new Error(`Unknown sub-vertical portfolio: ${id}`);
  return result;
}
export function portfolioProjectForId(id: string): PortfolioProject {
  const project = subverticalPortfolios.flatMap((page) => page.projects).find((item) => item.id === id);
  if (!project) throw new Error(`Unknown portfolio project: ${id}`);
  return project;
}
export function portfolioForProjectId(id: string): SubverticalPortfolio {
  const page = subverticalPortfolios.find((item) => item.projects.some((project) => project.id === id));
  if (!page) throw new Error(`Unknown portfolio project: ${id}`);
  return page;
}
export function subverticalPortfolioForPathway(
  verticalId: string,
  pathwayTitle: string,
): SubverticalPortfolio {
  const result = subverticalPortfolios.find(
    (item) => item.verticalId === verticalId && item.title === pathwayTitle,
  );
  if (!result)
    throw new Error(`Unknown pathway: ${verticalId} / ${pathwayTitle}`);
  return result;
}
