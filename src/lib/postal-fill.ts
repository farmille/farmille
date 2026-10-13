type PostalHit = { prefectureCode: number; city: string; town: string };

export type PostalFill =
  | { status: "many-cities" }
  | { status: "city"; prefectureCode: number; city: string }
  | { status: "town"; prefectureCode: number; city: string; town: string }
  | { status: "many-towns"; prefectureCode: number; city: string };

export function postalFill(addresses: readonly PostalHit[]): PostalFill {
  const cities = unique(addresses, (address) => `${address.prefectureCode}\u0000${address.city}`);
  const city = cities[0];
  if (city === undefined || cities.length !== 1) return { status: "many-cities" };
  const towns = unique(
    addresses.filter((address) => address.town !== ""),
    (address) => address.town,
  );
  const place = { prefectureCode: city.prefectureCode, city: city.city };
  if (towns.length === 1) return { status: "town", ...place, town: towns[0].town };
  if (towns.length === 0) return { status: "city", ...place };
  return { status: "many-towns", ...place };
}

function unique<T>(items: readonly T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const id = key(item);
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }
  return result;
}
