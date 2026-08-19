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
    s_count = c.execute(text("SELECT COUNT(*) FROM scenarios")).scalar()
    o_count = c.execute(text("SELECT COUNT(*) FROM scenario_options")).scalar()
    ch_count = c.execute(text("SELECT COUNT(*) FROM characters")).scalar()
    print(f"scenarios      : {s_count} rows")
    print(f"scenario_options: {o_count} rows")
    print(f"characters     : {ch_count} rows")
    if s_count > 0:
        rows = c.execute(text("SELECT TOP 2 scenario_id, chapter, scenario_text FROM scenarios")).fetchall()
        for r in rows:
            print(f"  -> id={r[0]} chapter={r[1]} text={r[2][:60]}")
