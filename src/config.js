import CONFIG from '../shc-config.json' assert { type: "json" };

// export async function reloadConfig() {
//   const rawConfig = await fs.readFile('./config.json', 'utf-8');
//   CONFIG = JSON.parse(rawConfig);
// }

export function getConfig() {
  return CONFIG;
}
