# The Dungeon Within — Full Stack

Includes the playable frontend and FastAPI/Azure SQL backend scaffold.

## Frontend
```bash
python -m http.server 5500 --directory frontend
```
Open http://localhost:5500

## Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and add Azure SQL credentials.

Install Microsoft ODBC Driver 18 for SQL Server.

Run the Azure SQL script:
`database/schema.sql`

Start FastAPI:
```bash
uvicorn main:app --reload --port 8000
```

Swagger:
http://127.0.0.1:8000/docs

## Frontend → Backend
Open `frontend/js/api.js` and change:
```js
USE_API: false
```
to:
```js
USE_API: true
```

The current frontend remains playable with mock data when `false`. The API scaffold is ready for the next integration pass.

## Security
Never commit `.env`. Azure SQL credentials never belong in HTML or JavaScript. Hidden behavioural scores stay server/database-side once API mode is enabled.
