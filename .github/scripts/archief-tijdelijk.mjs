// Tijdelijk: tarievenpagina's van leveranciers in 2025 uit het webarchief, alleen regels met bedragen.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
const extra = {
  energyzero: ['https://www.energyzero.nl/tarieven', 'https://www.energyzero.nl/dynamisch-contract'],
  frank: ['https://www.frankenergie.nl/nl/tarieven', 'https://www.frankenergie.nl/nl/dynamisch-energiecontract'],
  tibber: ['https://tibber.com/nl/energiecontract', 'https://tibber.com/nl/prijzen'],
  zonneplan: ['https://www.zonneplan.nl/energie/dynamisch-energiecontract', 'https://www.zonneplan.nl/energie/tarieven'],
};
const slaap = (ms) => new Promise((r) => setTimeout(r, ms));
async function haal(url, pogingen = 3) {
  for (let i = 0; i < pogingen; i++) {
    try { const r = await fetch(url, { headers: { 'user-agent': 'energieprijzen-nl archiefonderzoek' } }); if (r.ok) return await r.text(); } catch {}
    await slaap(3000 * (i + 1));
  }
  return null;
}
const tekst = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '\n').replace(/&nbsp;|&#160;/g, ' ').replace(/&euro;/g, '€').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ');
await mkdir('archief', { recursive: true });
for (const f of (await readdir('leveranciers')).filter((f) => f.endsWith('.json'))) {
  const cfg = JSON.parse(await readFile(`leveranciers/${f}`, 'utf8'));
  const urls = [...new Set([cfg.tariefUrl, ...(extra[cfg.id] ?? [])])];
  let uit = `# ${cfg.naam}\n`;
  for (const url of urls) {
    const cdx = await haal(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&from=2024&to=2026&output=json&filter=statuscode:200&collapse=timestamp:6&fl=timestamp,original`);
    let rijen = [];
    try { rijen = JSON.parse(cdx ?? '[]').slice(1); } catch {}
    uit += `\n## ${url}: ${rijen.length} snapshots (1 per maand)\n`;
    for (const [ts, orig] of rijen) {
      const h = await haal(`https://web.archive.org/web/${ts}id_/${orig}`, 2);
      await slaap(1500);
      if (!h) { uit += `\n### ${ts}: niet opgehaald\n`; continue; }
      const regels = tekst(h).split('\n').map((r) => r.trim()).filter(Boolean);
      const keep = new Set();
      regels.forEach((r, i) => { if (/€|\bct\b|cent|per kwh|per maand|vaste|opslag|inkoop|terug|verkoop|vergoeding/i.test(r)) for (let j = Math.max(0, i - 1); j <= Math.min(regels.length - 1, i + 1); j++) keep.add(j); });
      const sel = [...keep].sort((a, b) => a - b).map((i) => regels[i]).filter((r) => r.length < 300);
      uit += `\n### ${ts}\n${sel.slice(0, 120).join('\n')}\n`;
    }
  }
  await writeFile(`archief/${cfg.id}.md`, uit);
  console.log(cfg.id, uit.length);
}
