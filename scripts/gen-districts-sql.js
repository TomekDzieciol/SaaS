const fs = require('fs');
const path = require('path');
const wikiPath = path.join(__dirname, 'wiki-districts.txt');
const raw = fs.existsSync(wikiPath)
  ? fs.readFileSync(wikiPath, 'utf8')
  : '';
const regionMap = {
  'dolnośląskie': 'Dolnośląskie',
  'kujawsko-pomorskie': 'Kujawsko-pomorskie',
  'lubelskie': 'Lubelskie',
  'lubuskie': 'Lubuskie',
  'łódzkie': 'Łódzkie',
  'małopolskie': 'Małopolskie',
  'mazowieckie': 'Mazowieckie',
  'opolskie': 'Opolskie',
  'podkarpackie': 'Podkarpackie',
  'podlaskie': 'Podlaskie',
  'pomorskie': 'Pomorskie',
  'śląskie': 'Śląskie',
  'świętokrzyskie': 'Świętokrzyskie',
  'warmińsko-mazurskie': 'Warmińsko-mazurskie',
  'wielkopolskie': 'Wielkopolskie',
  'zachodniopomorskie': 'Zachodniopomorskie',
};
const lines = raw.split(/\r?\n/);
const rows = [];
for (let line of lines) {
  line = line.replace(/^\uFEFF/, '');
  if (!line.startsWith('| [') || line.includes('---') || /^\|\s*\[Powiat\]\(/.test(line.trim())) continue;
  const parts = line.split('|').map((s) => s.trim());
  if (parts.length < 3) continue;
  const first = parts[1];
  const match1 = first.match(/\[([^\]]+)\]/);
  if (!match1) continue;
  let distName = match1[1].trim();
  let regionName = null;
  for (let i = 2; i < parts.length; i++) {
    const m = parts[i].match(/\[([^\]]+)\]/);
    if (m && regionMap[m[1].trim().toLowerCase()]) {
      regionName = regionMap[m[1].trim().toLowerCase()];
      break;
    }
  }
  if (!regionName) continue;
  if (distName.toLowerCase().startsWith('powiat ')) {
    distName = distName.replace(/^powiat\s+/i, '').trim();
  }
  rows.push({ name: distName, region: regionName });
}
const byRegion = {};
for (const r of rows) {
  if (!byRegion[r.region]) byRegion[r.region] = [];
  byRegion[r.region].push(r.name);
}
const regionsOrder = [
  'Dolnośląskie', 'Kujawsko-pomorskie', 'Lubelskie', 'Lubuskie', 'Łódzkie',
  'Małopolskie', 'Mazowieckie', 'Opolskie', 'Podkarpackie', 'Podlaskie',
  'Pomorskie', 'Śląskie', 'Świętokrzyskie', 'Warmińsko-mazurskie',
  'Wielkopolskie', 'Zachodniopomorskie',
];
let out = '-- Pełna lista 380 powiatów (314 powiatów + 66 miast na prawach powiatu) w Polsce.\n';
out += '-- Wymaga wcześniejszego wypełnienia tabeli regions (16 województw).\n\n';
out += 'DO $$\nDECLARE\n  v_reg_id uuid;\nBEGIN\n';
for (const reg of regionsOrder) {
  const names = byRegion[reg];
  if (!names || names.length === 0) continue;
  out += "  SELECT id INTO v_reg_id FROM public.regions WHERE name = '" + reg.replace(/'/g, "''") + "';\n";
  for (const n of names) {
    const esc = n.replace(/'/g, "''");
    out += "  INSERT INTO public.districts (id, region_id, name) VALUES (gen_random_uuid(), v_reg_id, '" + esc + "');\n";
  }
  out += '\n';
}
out += 'END $$;\n';
fs.writeFileSync(path.join(__dirname, '../supabase/migrations/013_districts_all_380.sql'), out);
console.log('Total districts:', rows.length);
console.log('Written to supabase/migrations/013_districts_all_380.sql');
