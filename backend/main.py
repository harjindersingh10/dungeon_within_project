
import os, uuid
from datetime import datetime, timezone
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text

SERVER = os.getenv("AZURE_SQL_SERVER", "")
DATABASE = os.getenv("AZURE_SQL_DATABASE", "")
USERNAME = os.getenv("AZURE_SQL_USERNAME", "")
PASSWORD = os.getenv("AZURE_SQL_PASSWORD", "")
DRIVER = os.getenv("AZURE_SQL_DRIVER", "ODBC Driver 18 for SQL Server")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500,https://dungeon-within-game.web.app,https://dungeon-within-game.firebaseapp.com").split(",")

def make_engine():
    if not all([SERVER, DATABASE, USERNAME, PASSWORD]):
        return None
    odbc = (
        f"DRIVER={{{DRIVER}}};SERVER=tcp:{SERVER},1433;"
        f"DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD};"
        "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"
    )
    return create_engine(
        "mssql+pyodbc:///?odbc_connect=" + quote_plus(odbc),
        pool_pre_ping=True, pool_size=5, max_overflow=10
    )

engine = make_engine()

app = FastAPI(title="The Dungeon Within API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, allow_methods=["*"], allow_headers=["*"]
)

class CustomerCreate(BaseModel):
    fantasy_name: str = Field(min_length=1, max_length=24)
    age_group: str = Field(min_length=1, max_length=40)
    adventure_style: str = Field(min_length=1, max_length=40)
    self_description: str = Field(min_length=1, max_length=50)

class SessionCreate(BaseModel):
    customer_id: str

class ResponseCreate(BaseModel):
    session_id: str
    customer_id: str
    scenario_id: int
    option_id: str
    question_number: int = Field(ge=1, le=10)
    time_taken_ms: int = Field(ge=0, le=3600000)

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "the-dungeon-within-api"}

@app.get("/api/health/db")
def db_health():
    if engine is None:
        return {"status": "not_configured", "message": "Azure SQL credentials are not configured."}
    try:
        with engine.connect() as c:
            c.execute(text("SELECT 1"))
        return {"status": "ok", "database": "azure-sql"}
    except Exception:
        return {"status": "error", "message": "The dungeon spirits are currently confused."}

@app.post("/api/customers", status_code=201)
def create_customer(payload: CustomerCreate):
    if engine is None:
        raise HTTPException(503, "Azure SQL is not configured.")
    customer_id = str(uuid.uuid4())
    try:
        with engine.begin() as c:
            c.execute(text("""
                INSERT INTO customers
                (customer_id,fantasy_name,age_group,adventure_style,self_description)
                VALUES (:id,:name,:age,:style,:description)
            """), {"id":customer_id, "name":payload.fantasy_name,
                   "age":payload.age_group, "style":payload.adventure_style,
                   "description":payload.self_description})
        return {"customer_id":customer_id, **payload.model_dump()}
    except Exception:
        raise HTTPException(500, "The dungeon spirits are currently confused.")

@app.post("/api/sessions", status_code=201)
def create_session(payload: SessionCreate):
    if engine is None:
        raise HTTPException(503, "Azure SQL is not configured.")
    session_id = str(uuid.uuid4())
    try:
        with engine.begin() as c:
            exists = c.execute(text("SELECT 1 FROM customers WHERE customer_id=:id"),
                               {"id":payload.customer_id}).first()
            if not exists:
                raise HTTPException(404, "Customer not found")
            c.execute(text("""
                INSERT INTO game_sessions(session_id,customer_id,status,current_question)
                VALUES (:sid,:cid,'ACTIVE',1)
            """), {"sid":session_id, "cid":payload.customer_id})
        return {"session_id":session_id, "customer_id":payload.customer_id,
                "status":"ACTIVE", "current_question":1}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(500, "The dungeon spirits are currently confused.")

@app.get("/api/scenarios/next")
def next_scenario(session_id: str = Query(...)):
    if engine is None:
        raise HTTPException(503, "Azure SQL is not configured.")
    try:
        with engine.connect() as c:
            session = c.execute(text("""
                SELECT session_id,current_question,status FROM game_sessions
                WHERE session_id=:sid
            """), {"sid":session_id}).mappings().first()
            if not session:
                raise HTTPException(404, "Session not found")
            if session["status"] != "ACTIVE":
                raise HTTPException(409, "This adventure is complete.")

            row = c.execute(text("""
                SELECT TOP 1 s.scenario_id,s.chapter,s.scenario_text,s.difficulty
                FROM scenarios s
                WHERE s.active=1
                  AND NOT EXISTS (
                    SELECT 1 FROM player_responses r
                    WHERE r.session_id=:sid AND r.scenario_id=s.scenario_id
                  )
                ORDER BY s.scenario_id
            """), {"sid":session_id}).mappings().first()
            if not row:
                raise HTTPException(404, "No more scenarios available")

            opts = c.execute(text("""
                SELECT option_id,option_text FROM scenario_options
                WHERE scenario_id=:scenario_id ORDER BY option_id
            """), {"scenario_id":row["scenario_id"]}).mappings().all()

            return {**dict(row), "question_number":session["current_question"],
                    "options":[dict(x) for x in opts]}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(500, "The dungeon spirits are currently confused.")

@app.post("/api/responses", status_code=201)
def save_response(payload: ResponseCreate):
    if engine is None:
        raise HTTPException(503, "Azure SQL is not configured.")
    try:
        with engine.begin() as c:
            session = c.execute(text("""
                SELECT customer_id,status,current_question
                FROM game_sessions WHERE session_id=:sid
            """), {"sid":payload.session_id}).mappings().first()
            if not session:
                raise HTTPException(404, "Session not found")
            if session["customer_id"] != payload.customer_id:
                raise HTTPException(403, "Session ownership mismatch")
            if session["status"] != "ACTIVE":
                raise HTTPException(409, "This adventure is already complete")
            if session["current_question"] != payload.question_number:
                raise HTTPException(409, "Unexpected question number")

            valid = c.execute(text("""
                SELECT 1 FROM scenario_options
                WHERE option_id=:oid AND scenario_id=:sid
            """), {"oid":payload.option_id,"sid":payload.scenario_id}).first()
            if not valid:
                raise HTTPException(400, "Invalid option for this scenario")

            duplicate = c.execute(text("""
                SELECT 1 FROM player_responses
                WHERE session_id=:session AND scenario_id=:scenario
            """), {"session":payload.session_id,"scenario":payload.scenario_id}).first()
            if duplicate:
                raise HTTPException(409, "This scenario was already answered")

            response_id = str(uuid.uuid4())
            c.execute(text("""
                INSERT INTO player_responses
                (response_id,session_id,customer_id,scenario_id,option_id,question_number,time_taken_ms)
                VALUES (:rid,:session,:customer,:scenario,:option,:question,:time)
            """), {"rid":response_id,"session":payload.session_id,"customer":payload.customer_id,
                   "scenario":payload.scenario_id,"option":payload.option_id,
                   "question":payload.question_number,"time":payload.time_taken_ms})

            answered = c.execute(text("""
                SELECT COUNT(*) FROM player_responses WHERE session_id=:sid
            """), {"sid":payload.session_id}).scalar()

            completed = answered >= 10
            next_question = None if completed else payload.question_number + 1

            if completed:
                scores = c.execute(text("""
                    SELECT
                      COALESCE(SUM(o.courage_score),0) courage,
                      COALESCE(SUM(o.logic_score),0) logic,
                      COALESCE(SUM(o.empathy_score),0) empathy,
                      COALESCE(SUM(o.leadership_score),0) leadership,
                      COALESCE(SUM(o.risk_score),0) risk,
                      COALESCE(SUM(o.creativity_score),0) creativity,
                      COALESCE(SUM(o.loyalty_score),0) loyalty,
                      COALESCE(SUM(o.chaos_score),0) chaos
                    FROM player_responses r
                    JOIN scenario_options o ON o.option_id=r.option_id
                    WHERE r.session_id=:sid
                """), {"sid":payload.session_id}).mappings().one()

                candidates = c.execute(text("""
                    SELECT character_id,character_name,COALESCE(image_url,'') image_url
                    FROM characters
                """)).mappings().all()

                def score(x):
                    n=x["character_name"].upper()
                    s=scores
                    if n=="TITAN": return s["courage"]*1.2+s["leadership"]*1.25+s["loyalty"]
                    if n=="CIPHER": return s["logic"]*1.3+s["creativity"]*1.1+s["empathy"]*.3-s["chaos"]*.5
                    if n=="LEVIAN": return s["risk"]*1.25+s["chaos"]*1.35+s["creativity"]*.9
                    if n=="NOCTIS": return s["empathy"]*1.3+s["loyalty"]*1.15+s["logic"]*.8-s["risk"]*.25
                    if n=="EMBERWRAITH": return s["empathy"]+s["courage"]*1.05+s["chaos"]*.9+s["creativity"]*.6
                    return sum(s.values())

                ranked=sorted([(x,score(x)) for x in candidates],key=lambda z:z[1],reverse=True)
                winner,wscore=ranked[0]
                second=ranked[1][1] if len(ranked)>1 else 0
                confidence=50 if wscore<=0 else min(99,max(50,50+(wscore-second)/wscore*50))

                assignment_id=str(uuid.uuid4())
                c.execute(text("""
                    UPDATE game_sessions SET status='COMPLETED',
                    end_time=SYSUTCDATETIME(),final_character_id=:cid
                    WHERE session_id=:sid
                """), {"cid":winner["character_id"],"sid":payload.session_id})
                c.execute(text("""
                    INSERT INTO character_assignments
                    (assignment_id,session_id,character_id,confidence_score)
                    VALUES (:aid,:sid,:cid,:confidence)
                """), {"aid":assignment_id,"sid":payload.session_id,
                       "cid":winner["character_id"],"confidence":float(confidence)})

            else:
                c.execute(text("""
                    UPDATE game_sessions SET current_question=:q WHERE session_id=:sid
                """), {"q":next_question,"sid":payload.session_id})

        return {"response_id":response_id,"next_question_number":next_question,"completed":completed}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(500, "The dungeon spirits are currently confused.")

@app.get("/api/sessions/{session_id}/progress")
def progress(session_id: str):
    if engine is None: raise HTTPException(503, "Azure SQL is not configured.")
    with engine.connect() as c:
        row=c.execute(text("""
            SELECT status,current_question FROM game_sessions WHERE session_id=:sid
        """),{"sid":session_id}).mappings().first()
        if not row: raise HTTPException(404,"Session not found")
        answered=c.execute(text("""
            SELECT COUNT(*) FROM player_responses WHERE session_id=:sid
        """),{"sid":session_id}).scalar()
        return {"session_id":session_id,"status":row["status"],
                "answered":answered,"total":10,
                "current_question":row["current_question"],
                "completed":row["status"]=="COMPLETED"}

@app.get("/api/sessions/{session_id}/result")
def result(session_id: str):
    if engine is None: raise HTTPException(503, "Azure SQL is not configured.")
    with engine.connect() as c:
        row=c.execute(text("""
            SELECT s.final_character_id,a.confidence_score
            FROM game_sessions s
            LEFT JOIN character_assignments a ON a.session_id=s.session_id
            WHERE s.session_id=:sid AND s.status='COMPLETED'
        """),{"sid":session_id}).mappings().first()
        if not row or not row["final_character_id"]:
            raise HTTPException(409,"This adventure is not complete yet")
        character=c.execute(text("""
            SELECT character_id,character_name,species,title,description,
                   strengths,weaknesses,special_ability,image_url
            FROM characters WHERE character_id=:cid
        """),{"cid":row["final_character_id"]}).mappings().first()
        return {"session_id":session_id,"character_id":row["final_character_id"],
                "confidence_score":row["confidence_score"],"character":dict(character)}

@app.get("/api/characters/{character_id}")
def character(character_id: str):
    if engine is None: raise HTTPException(503, "Azure SQL is not configured.")
    with engine.connect() as c:
        row=c.execute(text("""
            SELECT character_id,character_name,species,title,description,
                   strengths,weaknesses,special_ability,image_url
            FROM characters WHERE character_id=:cid
        """),{"cid":character_id}).mappings().first()
        if not row: raise HTTPException(404,"Character not found")
        return dict(row)
