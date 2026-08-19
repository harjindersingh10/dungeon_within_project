from dotenv import load_dotenv; load_dotenv()
import os
from urllib.parse import quote_plus
from sqlalchemy import create_engine, text

odbc = (
    f"DRIVER={{{os.getenv('AZURE_SQL_DRIVER', 'ODBC Driver 18 for SQL Server')}}};"
    f"SERVER=tcp:{os.getenv('AZURE_SQL_SERVER')},1433;"
    f"DATABASE={os.getenv('AZURE_SQL_DATABASE')};"
    f"UID={os.getenv('AZURE_SQL_USERNAME')};PWD={os.getenv('AZURE_SQL_PASSWORD')};"
    "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"
)
engine = create_engine("mssql+pyodbc:///?odbc_connect=" + quote_plus(odbc))

with engine.connect() as c:
    print("=== RECENT SESSIONS ===")
    rows = c.execute(text("""
        SELECT TOP 5 session_id, status, current_question, final_character_id
        FROM game_sessions ORDER BY start_time DESC
    """)).fetchall()
    for r in rows:
        print(f"  id={r[0][:8]}... status={r[1]} q={r[2]} char={r[3]}")

    print("\n=== RESPONSE COUNTS PER SESSION ===")
    rows = c.execute(text("""
        SELECT TOP 5 session_id, COUNT(*) as cnt
        FROM player_responses
        GROUP BY session_id
        ORDER BY cnt DESC
    """)).fetchall()
    for r in rows:
        print(f"  session={r[0][:8]}... answers={r[1]}")
