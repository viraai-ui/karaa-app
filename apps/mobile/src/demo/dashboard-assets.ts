import type { ImageSourcePropType } from 'react-native';

/** Canonical dashboard artwork. Keep this keyed by vertical id so filtering can never
 * change the image associated with a card. */
export const dashboardAssets: Readonly<Record<string, ImageSourcePropType>> = {
  'infrastructure-urban-development': require('../../assets/dashboard/01-infrastructure.webp'),
  'ports-airports-logistics': require('../../assets/dashboard/02-ports-logistics.webp'),
  'energy-utilities': require('../../assets/dashboard/03-energy-utilities.webp'),
  'healthcare-life-sciences': require('../../assets/dashboard/04-healthcare-life-sciences.webp'),
  'hospitality-tourism-leisure': require('../../assets/dashboard/05-hospitality-tourism.webp'),
  'real-estate-asset-development': require('../../assets/dashboard/06-real-estate.webp'),
  'manufacturing-industrial-solutions': require('../../assets/dashboard/07-manufacturing.webp'),
  'spiritual-renaissance-for-bharat': require('../../assets/dashboard/08-spiritual-renaissance.webp'),
  'education-technology-innovation': require('../../assets/dashboard/09-education-technology.webp'),
};

export const dashboardAssetFiles: Readonly<Record<string, string>> = {
  'infrastructure-urban-development': '01-infrastructure.webp',
  'ports-airports-logistics': '02-ports-logistics.webp',
  'energy-utilities': '03-energy-utilities.webp',
  'healthcare-life-sciences': '04-healthcare-life-sciences.webp',
  'hospitality-tourism-leisure': '05-hospitality-tourism.webp',
  'real-estate-asset-development': '06-real-estate.webp',
  'manufacturing-industrial-solutions': '07-manufacturing.webp',
  'spiritual-renaissance-for-bharat': '08-spiritual-renaissance.webp',
  'education-technology-innovation': '09-education-technology.webp',
};
