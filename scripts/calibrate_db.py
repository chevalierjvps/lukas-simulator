import sqlite3
import json
import os

db_path = os.path.join(os.path.dirname(__file__), '../server/database.sqlite')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

slides = [
    {
        "id": "slide-1",
        "label": "Miocárdio Infartado (H&E)",
        "dzi": "remote:tiles/cardiac-infarct-he.dzi",
        "stain": "H&E",
        "tissue": "Myocardium",
        "nativeObjective": 40,
        "nativeMpp": 0.25,
        "downsample": 1,
        "slideWidthPx": 2220,
        "slideHeightPx": 2967
    },
    {
        "id": "slide-2",
        "label": "Miocárdio Normal de Controle (H&E)",
        "dzi": "remote:tiles/cardiac-normal-he.dzi",
        "stain": "H&E",
        "tissue": "Myocardium",
        "nativeObjective": 40,
        "nativeMpp": 0.25,
        "downsample": 1,
        "slideWidthPx": 15374,
        "slideHeightPx": 17497
    },
    {
        "id": "slide-3",
        "label": "Placa Aterosclerótica Coronária (Tricrômico de Masson)",
        "dzi": "remote:tiles/coronary-atheroma.dzi",
        "stain": "Masson Trichrome",
        "tissue": "Coronary Artery",
        "nativeObjective": 40,
        "nativeMpp": 0.25,
        "downsample": 1,
        "slideWidthPx": 6500,
        "slideHeightPx": 6500
    },
    {
        "id": "slide-4",
        "label": "Consolidação Pulmonar / Pneumonia Aguda (H&E)",
        "dzi": "remote:tiles/pulmonary-consolidation-he.dzi",
        "stain": "H&E",
        "tissue": "Lung",
        "nativeObjective": 40,
        "nativeMpp": 0.25,
        "downsample": 1,
        "slideWidthPx": 6500,
        "slideHeightPx": 6500
    },
    {
        "id": "slide-5",
        "label": "Microangiopatia Trombótica & Lesão Renal (H&E)",
        "dzi": "remote:tiles/renal-microangiopathy-he.dzi",
        "stain": "H&E",
        "tissue": "Kidney",
        "nativeObjective": 40,
        "nativeMpp": 0.25,
        "downsample": 1,
        "slideWidthPx": 6500,
        "slideHeightPx": 6500
    }
]

cur.execute("SELECT id, config FROM cases")
rows = cur.fetchall()

for row_id, config_raw in rows:
    try:
        config = json.loads(config_raw) if config_raw else {}
    except Exception:
        config = {}
    config["pathology"] = {
        "title": "Estudos Histopatológicos e Biópsias",
        "slides": slides
    }
    cur.execute("UPDATE cases SET config = ? WHERE id = ?", (json.dumps(config), row_id))

# Clear sessions for a fresh start
try:
    cur.execute("DELETE FROM sessions")
    cur.execute("DELETE FROM session_events")
except Exception as e:
    print("Session cleanup note:", e)

conn.commit()
conn.close()
print("🎉 Banco de dados SQLite calibrado com as 5 lâminas e sessões resetadas com sucesso!")
