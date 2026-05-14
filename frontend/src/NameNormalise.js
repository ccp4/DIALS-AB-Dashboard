export function normalizeName(fileName, traceName) {
  const cleanFile = fileName
    .replace("dials.estimate_resolution-", "")
    .replace(".json", "")
    .replace("xia2.compare_merging_stats", "");

  const cleanTrace = traceName
    .replace("<sub>", "")
    .replace("</sub>", "");

  return `${cleanFile}-${cleanTrace}`;
}