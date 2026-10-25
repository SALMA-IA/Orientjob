from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="OrientJob IA")

MODE = "tfidf"
model = None
try:
    from sentence_transformers import SentenceTransformer, util
    model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    MODE = "embeddings"
except Exception as e:
    print("Sentence-Transformers indisponible, mode TF-IDF :", e)


class Item(BaseModel):
    id: int
    text: str


class MatchReq(BaseModel):
    query: str
    items: list[Item]


class FraudeReq(BaseModel):
    titre: str
    description: str


@app.get("/health")
def health():
    return {"status": "ok", "mode": MODE}


@app.post("/match")
def match(req: MatchReq):
    if not req.items:
        return {"mode": MODE, "scores": []}
    textes = [i.text for i in req.items]
    if model is not None:
        q = model.encode(req.query, convert_to_tensor=True)
        d = model.encode(textes, convert_to_tensor=True)
        sims = util.cos_sim(q, d)[0].tolist()
    else:
        v = TfidfVectorizer().fit([req.query] + textes)
        sims = cosine_similarity(v.transform([req.query]), v.transform(textes))[0].tolist()
    scores = [
        {"id": i.id, "score": round(max(0.0, min(1.0, s)), 4)}
        for i, s in zip(req.items, sims)
    ]
    return {"mode": MODE, "scores": scores}


SUSPECTS = [
    "frais de dossier", "payer", "paiement", "virement", "western union", "mandat",
    "carte bancaire", "whatsapp uniquement", "gagner facilement", "argent rapide",
    "investissement", "caution", "100% garanti", "sans entretien",
]

TRAIN = [
    ("frais de dossier à payer avant embauche gagner facilement 20000 dh par semaine", 1),
    ("envoyez un virement western union pour valider votre dossier", 1),
    ("travail à domicile sans experience argent rapide contactez whatsapp uniquement", 1),
    ("investissement garanti 100% caution demandée urgent", 1),
    ("payer une caution par carte bancaire pour recevoir le contrat", 1),
    ("gagnez de l'argent facilement sans diplôme paiement initial requis", 1),
    ("salaire énorme sans entretien envoyez vos coordonnées bancaires", 1),
    ("recrutement immédiat sans entretien versement de frais d'inscription", 1),
    ("stage développement web react node.js encadrement par un ingénieur senior à Casablanca", 0),
    ("ingénieur data scientist python machine learning cdi Rabat entretien technique", 0),
    ("stage en cybersécurité analyse de logs SOC convention de stage fournie", 0),
    ("développeur mobile react native équipe agile télétravail partiel Marrakech", 0),
    ("administrateur réseaux cisco support niveau 2 contrat cdd Tanger", 0),
    ("stage assistant chef de projet informatique planification suivi reporting", 0),
    ("technicien support informatique helpdesk cdi Fès avantages mutuelle", 0),
    ("stage en analyse de données sql power bi tableaux de bord", 0),
]

vec = TfidfVectorizer(ngram_range=(1, 2))
X = vec.fit_transform([t for t, _ in TRAIN])
clf = LogisticRegression(max_iter=1000).fit(X, [y for _, y in TRAIN])


@app.post("/fraude")
def fraude(r: FraudeReq):
    texte = f"{r.titre} {r.description}".lower()
    raisons = [m for m in SUSPECTS if m in texte]
    risque_regles = min(1.0, len(raisons) * 0.3)
    risque_ml = float(clf.predict_proba(vec.transform([texte]))[0][1])
    risque = 0.6 * risque_regles + 0.4 * risque_ml
    return {
        "score_fiabilite": round(1 - risque, 2),
        "raisons": raisons,
        "risque_ml": round(risque_ml, 2),
        "mode": "hybride",
    }