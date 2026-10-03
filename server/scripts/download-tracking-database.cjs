const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { gunzipSync } = require('node:zlib');
const source = require('./tracking-database.json');

// Build-time download only. Visitor IPs never leave our server for this lookup.
async function main() {
  const response = await fetch(source.url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`Location database download failed (${response.status})`);
  const compressed = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(compressed).digest('hex') !== source.sha256) {
    throw new Error('Location database checksum did not match the reviewed release');
  }
  const dir = path.join(__dirname, '../data');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'tracking-city.mmdb'), gunzipSync(compressed));
  console.log(`Installed DB-IP City Lite ${source.release}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
