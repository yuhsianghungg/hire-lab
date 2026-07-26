import { readFile, writeFile } from "node:fs/promises";

const configPath = new URL("../dist/server/wrangler.json", import.meta.url);
const config = JSON.parse(await readFile(configPath, "utf8"));

config.name = "hire-lab";
config.compatibility_date = "2026-07-26";
config.d1_databases = [
  {
    binding: "DB",
    database_name: "hire-lab-production",
    database_id: "e882f79f-d920-478f-b918-4a237ba5d960",
    migrations_dir: "../../drizzle",
  },
];

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
