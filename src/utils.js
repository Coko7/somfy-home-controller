import fs from "fs/promises";

export async function readCsv(path, delim = ",") {
  const csv = await fs.readFile(path, "utf8");

  const lines = csv.split("\n");
  const heads = lines[0].split(delim);
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const item = {};
    const vals = lines[i].split(delim);

    for (let j = 0; j < heads.length; j++) {
      item[heads[j]] = vals[j] ?? null;
    }
    results.push(item);
  }

  return results;
}
