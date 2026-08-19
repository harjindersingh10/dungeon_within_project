from dotenv import load_dotenv
load_dotenv()
import os
from urllib.parse import quote_plus
from sqlalchemy import create_engine, text

SERVER   = os.getenv("AZURE_SQL_SERVER")
DATABASE = os.getenv("AZURE_SQL_DATABASE")
USERNAME = os.getenv("AZURE_SQL_USERNAME")
PASSWORD = os.getenv("AZURE_SQL_PASSWORD")
DRIVER   = os.getenv("AZURE_SQL_DRIVER", "ODBC Driver 18 for SQL Server")

print(f"Server  : {SERVER}")
print(f"Database: {DATABASE}")
print(f"Driver  : {DRIVER}")

odbc = (
    f"DRIVER={{{DRIVER}}};SERVER=tcp:{SERVER},1433;"
    f"DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD};"
    "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"
)

try:
    engine = create_engine(
        "mssql+pyodbc:///?odbc_connect=" + quote_plus(odbc),
        pool_pre_ping=True
    )
    with engine.connect() as c:
        c.execute(text("SELECT 1"))
    print("STATUS: OK — Azure SQL connected successfully!")
except Exception as e:
    print(f"STATUS: FAILED — {e}")
