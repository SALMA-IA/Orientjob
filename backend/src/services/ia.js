const IA_URL = process.env.IA_URL || 'http://localhost:8000';
async function appel(path, body) {
const r = await fetch(IA_URL + path, {
method: 'POST', headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
});
if (!r.ok) throw new Error('IA ' + r.status);
return r.json();
}
const SUSPECTS = ['frais de dossier', 'payer', 'paiement', 'virement', 'western union', 'mandat',
'carte bancaire', 'whatsapp uniquement', 'gagner facilement', 'argent rapide',
'investissement', 'caution', '100% garanti'];
function fraudeSecours(titre, description) {
const t = `${titre} ${description}`.toLowerCase();
const raisons = SUSPECTS.filter((m) => t.includes(m));
const risque = Math.min(1, raisons.length * 0.3);
return { score_fiabilite: +(1 - risque).toFixed(2), raisons, mode: 'secours' };
}
async function analyserFraude(titre, description) {
try { return await appel('/fraude', { titre, description }); }
catch (e) { return fraudeSecours(titre, description); }
}
const mots = (txt) => new Set((txt || '').toLowerCase()
.split(/[^a-zà-ÿ0-9+#]+/).filter((w) => w.length > 2));
function scoreSecours(query, items) {
const q = mots(query);
return items.map((i) => {
const d = mots(i.text);
const inter = [...q].filter((w) => d.has(w)).length;
return { id: i.id, score: +(inter / (q.size || 1)).toFixed(4) };
});
}
// query : texte du profil ; items : [{ id, text }] -> { mode, scores: [{ id, score }] }
async function scorer(query, items) {
if (!items.length) return { mode: 'vide', scores: [] };
try { return await appel('/match', { query, items }); }
catch (e) { return { mode: 'secours', scores: scoreSecours(query, items) }; }
}
module.exports = { analyserFraude, scorer };