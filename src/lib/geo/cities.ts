/**
 * Slovak Cities with GPS Coordinates
 * Used for geo search functionality in Algolia
 */

interface CityCoordinates {
  name: string;
  lat: number;
  lng: number;
  district?: string;
}

// Major Slovak cities with their coordinates
export const SLOVAK_CITIES: Record<string, CityCoordinates> = {
  // Bratislavský kraj
  Bratislava: {
    name: "Bratislava",
    lat: 48.1486,
    lng: 17.1077,
    district: "Bratislavský",
  },
  Malacky: {
    name: "Malacky",
    lat: 48.4361,
    lng: 17.0219,
    district: "Bratislavský",
  },
  Pezinok: {
    name: "Pezinok",
    lat: 48.2892,
    lng: 17.2675,
    district: "Bratislavský",
  },
  Senec: { name: "Senec", lat: 48.2194, lng: 17.4, district: "Bratislavský" },

  // Trnavský kraj
  Trnava: { name: "Trnava", lat: 48.3775, lng: 17.5883, district: "Trnavský" },
  "Dunajská Streda": {
    name: "Dunajská Streda",
    lat: 47.9931,
    lng: 17.6183,
    district: "Trnavský",
  },
  Galanta: {
    name: "Galanta",
    lat: 48.1903,
    lng: 17.7256,
    district: "Trnavský",
  },
  Hlohovec: {
    name: "Hlohovec",
    lat: 48.4317,
    lng: 17.8028,
    district: "Trnavský",
  },
  Piešťany: {
    name: "Piešťany",
    lat: 48.5947,
    lng: 17.8256,
    district: "Trnavský",
  },
  Senica: { name: "Senica", lat: 48.6794, lng: 17.3669, district: "Trnavský" },
  Skalica: { name: "Skalica", lat: 48.845, lng: 17.2281, district: "Trnavský" },

  // Trenčiansky kraj
  Trenčín: {
    name: "Trenčín",
    lat: 48.8944,
    lng: 18.0444,
    district: "Trenčiansky",
  },
  "Bánovce nad Bebravou": {
    name: "Bánovce nad Bebravou",
    lat: 48.7189,
    lng: 18.2578,
    district: "Trenčiansky",
  },
  Ilava: { name: "Ilava", lat: 48.9972, lng: 18.2319, district: "Trenčiansky" },
  Myjava: {
    name: "Myjava",
    lat: 48.7556,
    lng: 17.5697,
    district: "Trenčiansky",
  },
  "Nové Mesto nad Váhom": {
    name: "Nové Mesto nad Váhom",
    lat: 48.7572,
    lng: 17.83,
    district: "Trenčiansky",
  },
  Partizánske: {
    name: "Partizánske",
    lat: 48.6283,
    lng: 18.3756,
    district: "Trenčiansky",
  },
  "Považská Bystrica": {
    name: "Považská Bystrica",
    lat: 49.1219,
    lng: 18.4375,
    district: "Trenčiansky",
  },
  Prievidza: {
    name: "Prievidza",
    lat: 48.7744,
    lng: 18.6247,
    district: "Trenčiansky",
  },
  Púchov: {
    name: "Púchov",
    lat: 49.1194,
    lng: 18.3261,
    district: "Trenčiansky",
  },

  // Nitriansky kraj
  Nitra: { name: "Nitra", lat: 48.3069, lng: 18.0864, district: "Nitriansky" },
  Komárno: {
    name: "Komárno",
    lat: 47.7631,
    lng: 18.1286,
    district: "Nitriansky",
  },
  Levice: {
    name: "Levice",
    lat: 48.2158,
    lng: 18.6008,
    district: "Nitriansky",
  },
  "Nové Zámky": {
    name: "Nové Zámky",
    lat: 47.9856,
    lng: 18.1614,
    district: "Nitriansky",
  },
  Šaľa: { name: "Šaľa", lat: 48.1517, lng: 17.8744, district: "Nitriansky" },
  Topoľčany: {
    name: "Topoľčany",
    lat: 48.5608,
    lng: 18.1772,
    district: "Nitriansky",
  },
  "Zlaté Moravce": {
    name: "Zlaté Moravce",
    lat: 48.3856,
    lng: 18.4003,
    district: "Nitriansky",
  },

  // Žilinský kraj
  Žilina: { name: "Žilina", lat: 49.2231, lng: 18.7394, district: "Žilinský" },
  Bytča: { name: "Bytča", lat: 49.2231, lng: 18.5583, district: "Žilinský" },
  Čadca: { name: "Čadca", lat: 49.4381, lng: 18.7894, district: "Žilinský" },
  "Dolný Kubín": {
    name: "Dolný Kubín",
    lat: 49.2097,
    lng: 19.2983,
    district: "Žilinský",
  },
  "Kysucké Nové Mesto": {
    name: "Kysucké Nové Mesto",
    lat: 49.2997,
    lng: 18.7867,
    district: "Žilinský",
  },
  "Liptovský Mikuláš": {
    name: "Liptovský Mikuláš",
    lat: 49.0836,
    lng: 19.6119,
    district: "Žilinský",
  },
  Martin: { name: "Martin", lat: 49.0636, lng: 18.9214, district: "Žilinský" },
  Námestovo: {
    name: "Námestovo",
    lat: 49.4069,
    lng: 19.4786,
    district: "Žilinský",
  },
  Ružomberok: {
    name: "Ružomberok",
    lat: 49.0778,
    lng: 19.3064,
    district: "Žilinský",
  },
  Tvrdošín: {
    name: "Tvrdošín",
    lat: 49.3378,
    lng: 19.5561,
    district: "Žilinský",
  },
  "Turčianske Teplice": {
    name: "Turčianske Teplice",
    lat: 48.865,
    lng: 18.8611,
    district: "Žilinský",
  },

  // Banskobystrický kraj
  "Banská Bystrica": {
    name: "Banská Bystrica",
    lat: 48.7361,
    lng: 19.1461,
    district: "Banskobystrický",
  },
  "Banská Štiavnica": {
    name: "Banská Štiavnica",
    lat: 48.4586,
    lng: 18.8925,
    district: "Banskobystrický",
  },
  Brezno: {
    name: "Brezno",
    lat: 48.8058,
    lng: 19.6369,
    district: "Banskobystrický",
  },
  Detva: {
    name: "Detva",
    lat: 48.5575,
    lng: 19.4197,
    district: "Banskobystrický",
  },
  Krupina: {
    name: "Krupina",
    lat: 48.3544,
    lng: 19.0681,
    district: "Banskobystrický",
  },
  Lučenec: {
    name: "Lučenec",
    lat: 48.3306,
    lng: 19.6672,
    district: "Banskobystrický",
  },
  Poltár: {
    name: "Poltár",
    lat: 48.4306,
    lng: 19.7919,
    district: "Banskobystrický",
  },
  Revúca: {
    name: "Revúca",
    lat: 48.6831,
    lng: 20.1156,
    district: "Banskobystrický",
  },
  "Rimavská Sobota": {
    name: "Rimavská Sobota",
    lat: 48.3825,
    lng: 20.0208,
    district: "Banskobystrický",
  },
  "Veľký Krtíš": {
    name: "Veľký Krtíš",
    lat: 48.2089,
    lng: 19.3456,
    district: "Banskobystrický",
  },
  Zvolen: {
    name: "Zvolen",
    lat: 48.5756,
    lng: 19.1236,
    district: "Banskobystrický",
  },
  Žarnovica: {
    name: "Žarnovica",
    lat: 48.4844,
    lng: 18.7181,
    district: "Banskobystrický",
  },
  "Žiar nad Hronom": {
    name: "Žiar nad Hronom",
    lat: 48.5889,
    lng: 18.8569,
    district: "Banskobystrický",
  },

  // Prešovský kraj
  Prešov: { name: "Prešov", lat: 48.9986, lng: 21.2392, district: "Prešovský" },
  Bardejov: {
    name: "Bardejov",
    lat: 49.2925,
    lng: 21.2767,
    district: "Prešovský",
  },
  Humenné: {
    name: "Humenné",
    lat: 48.9356,
    lng: 21.9067,
    district: "Prešovský",
  },
  Kežmarok: {
    name: "Kežmarok",
    lat: 49.1361,
    lng: 20.4294,
    district: "Prešovský",
  },
  Levoča: { name: "Levoča", lat: 49.025, lng: 20.5872, district: "Prešovský" },
  Medzilaborce: {
    name: "Medzilaborce",
    lat: 49.2711,
    lng: 21.9044,
    district: "Prešovský",
  },
  Poprad: { name: "Poprad", lat: 49.0583, lng: 20.2972, district: "Prešovský" },
  Sabinov: {
    name: "Sabinov",
    lat: 49.1028,
    lng: 21.0975,
    district: "Prešovský",
  },
  Snina: { name: "Snina", lat: 48.9878, lng: 22.1525, district: "Prešovský" },
  "Stará Ľubovňa": {
    name: "Stará Ľubovňa",
    lat: 49.3044,
    lng: 20.6856,
    district: "Prešovský",
  },
  Stropkov: {
    name: "Stropkov",
    lat: 49.2022,
    lng: 21.6511,
    district: "Prešovský",
  },
  Svidník: {
    name: "Svidník",
    lat: 49.3061,
    lng: 21.5681,
    district: "Prešovský",
  },
  "Vranov nad Topľou": {
    name: "Vranov nad Topľou",
    lat: 48.8858,
    lng: 21.6842,
    district: "Prešovský",
  },

  // Košický kraj
  Košice: { name: "Košice", lat: 48.7164, lng: 21.2611, district: "Košický" },
  Gelnica: { name: "Gelnica", lat: 48.855, lng: 20.9336, district: "Košický" },
  Michalovce: {
    name: "Michalovce",
    lat: 48.7544,
    lng: 21.9181,
    district: "Košický",
  },
  "Moldava nad Bodvou": {
    name: "Moldava nad Bodvou",
    lat: 48.6111,
    lng: 20.9978,
    district: "Košický",
  },
  Rožňava: { name: "Rožňava", lat: 48.6606, lng: 20.5278, district: "Košický" },
  Sobrance: {
    name: "Sobrance",
    lat: 48.7453,
    lng: 22.1792,
    district: "Košický",
  },
  "Spišská Nová Ves": {
    name: "Spišská Nová Ves",
    lat: 48.9464,
    lng: 20.5617,
    district: "Košický",
  },
  Trebišov: {
    name: "Trebišov",
    lat: 48.6289,
    lng: 21.7175,
    district: "Košický",
  },
};

// Get coordinates for a city name (case-insensitive lookup)
export function getCityCoordinates(cityName: string): CityCoordinates | null {
  // Exact match first
  if (SLOVAK_CITIES[cityName]) {
    return SLOVAK_CITIES[cityName];
  }

  // Case-insensitive search
  const normalizedInput = cityName.toLowerCase().trim();
  for (const [key, city] of Object.entries(SLOVAK_CITIES)) {
    if (key.toLowerCase() === normalizedInput) {
      return city;
    }
  }

  return null;
}

// Get all cities as array (for dropdowns)
function getAllCities(): CityCoordinates[] {
  return Object.values(SLOVAK_CITIES).sort((a, b) =>
    a.name.localeCompare(b.name, "sk"),
  );
}

// Get cities by district
function getCitiesByDistrict(district: string): CityCoordinates[] {
  return Object.values(SLOVAK_CITIES)
    .filter((city) => city.district === district)
    .sort((a, b) => a.name.localeCompare(b.name, "sk"));
}

// Distance options for filter (in km)
export const DISTANCE_OPTIONS = [
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
  { value: 50, label: "50 km" },
  { value: 100, label: "100 km" },
  { value: 200, label: "200 km" },
  { value: 0, label: "Celé Slovensko" }, // 0 = no filter
];
