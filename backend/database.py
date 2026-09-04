import os
import sqlite3
import logging
from datetime import datetime, timezone
from typing import List, Optional

logger = logging.getLogger("database")

_HERE   = os.path.dirname(os.path.abspath(__file__))

# On Render, mount a Disk at /var/data and set DATA_DIR=/var/data
# Locally it falls back to backend/data/
_DB_DIR = os.environ.get("DATA_DIR", os.path.join(_HERE, "data"))
DB_PATH = os.path.join(_DB_DIR, "history.db")

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS prediction_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp   TEXT    NOT NULL,
    age         REAL    NOT NULL,
    sex         INTEGER NOT NULL,
    cp          INTEGER NOT NULL,
    trestbps    REAL    NOT NULL,
    chol        REAL    NOT NULL,
    fbs         INTEGER NOT NULL,
    restecg     INTEGER NOT NULL,
    thalach     REAL    NOT NULL,
    exang       INTEGER NOT NULL,
    oldpeak     REAL    NOT NULL,
    slope       INTEGER NOT NULL,
    ca          INTEGER NOT NULL,
    thal        INTEGER NOT NULL,
    prediction  TEXT    NOT NULL,
    probability REAL    NOT NULL,
    risk_level  TEXT    NOT NULL,
    disclaimer  TEXT    NOT NULL
);
"""


def init_db():
    os.makedirs(_DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(CREATE_TABLE_SQL)
        conn.commit()
        logger.info("History database ready at %s", DB_PATH)
    finally:
        conn.close()


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def insert_prediction(patient_data: dict, result: dict) -> int:
    timestamp = datetime.now(timezone.utc).isoformat()

    sql = """
    INSERT INTO prediction_history (
        timestamp,
        age, sex, cp, trestbps, chol, fbs, restecg, thalach,
        exang, oldpeak, slope, ca, thal,
        prediction, probability, risk_level, disclaimer
    ) VALUES (
        :timestamp,
        :age, :sex, :cp, :trestbps, :chol, :fbs, :restecg, :thalach,
        :exang, :oldpeak, :slope, :ca, :thal,
        :prediction, :probability, :risk_level, :disclaimer
    )
    """
    params = {
        "timestamp":   timestamp,
        "age":         float(patient_data["age"]),
        "sex":         int(patient_data["sex"]),
        "cp":          int(patient_data["cp"]),
        "trestbps":    float(patient_data["trestbps"]),
        "chol":        float(patient_data["chol"]),
        "fbs":         int(patient_data["fbs"]),
        "restecg":     int(patient_data["restecg"]),
        "thalach":     float(patient_data["thalach"]),
        "exang":       int(patient_data["exang"]),
        "oldpeak":     float(patient_data["oldpeak"]),
        "slope":       int(patient_data["slope"]),
        "ca":          int(patient_data["ca"]),
        "thal":        int(patient_data["thal"]),
        "prediction":  result["prediction"],
        "probability": float(result["probability"]),
        "risk_level":  result["risk_level"],
        "disclaimer":  result["disclaimer"],
    }

    conn = _get_conn()
    try:
        cursor = conn.execute(sql, params)
        conn.commit()
        row_id = cursor.lastrowid
        logger.info("Saved prediction #%d to history.", row_id)
        return row_id
    finally:
        conn.close()


def fetch_all_predictions() -> List[dict]:
    sql = """
    SELECT id, timestamp,
           age, sex, cp, trestbps, chol, fbs, restecg, thalach,
           exang, oldpeak, slope, ca, thal,
           prediction, probability, risk_level, disclaimer
    FROM prediction_history
    ORDER BY id DESC
    """
    conn = _get_conn()
    try:
        rows = conn.execute(sql).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def fetch_prediction_by_id(record_id: int) -> Optional[dict]:
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM prediction_history WHERE id = ?", (record_id,)
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def delete_prediction(record_id: int) -> bool:
    conn = _get_conn()
    try:
        cursor = conn.execute(
            "DELETE FROM prediction_history WHERE id = ?", (record_id,)
        )
        conn.commit()
        deleted = cursor.rowcount > 0
        if deleted:
            logger.info("Deleted history record #%d.", record_id)
        return deleted
    finally:
        conn.close()


def delete_all_predictions() -> int:
    conn = _get_conn()
    try:
        cursor = conn.execute("DELETE FROM prediction_history")
        conn.commit()
        count = cursor.rowcount
        logger.info("Cleared %d history records.", count)
        return count
    finally:
        conn.close()


def fetch_history_stats() -> dict:
    conn = _get_conn()
    try:
        total    = conn.execute("SELECT COUNT(*) FROM prediction_history").fetchone()[0]
        low      = conn.execute("SELECT COUNT(*) FROM prediction_history WHERE risk_level = 'Low'").fetchone()[0]
        moderate = conn.execute("SELECT COUNT(*) FROM prediction_history WHERE risk_level = 'Moderate'").fetchone()[0]
        high     = conn.execute("SELECT COUNT(*) FROM prediction_history WHERE risk_level = 'High'").fetchone()[0]
        avg_prob = conn.execute("SELECT AVG(probability) FROM prediction_history").fetchone()[0]
        return {
            "total":           total,
            "low_risk":        low,
            "moderate_risk":   moderate,
            "high_risk":       high,
            "avg_probability": round(float(avg_prob), 4) if avg_prob else 0.0,
        }
    finally:
        conn.close()
