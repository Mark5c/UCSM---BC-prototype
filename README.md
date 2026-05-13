# UCMS — Use Case Management System

A collaborative web application for creating, editing, and validating UML use cases. Built as a bachelor's thesis prototype.

**Stack:** FastAPI + SQLite (backend) · React 18 + TypeScript + Vite + Tailwind CSS (frontend)

---

## Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Mark5c/UCSM---BC-prototype.git
cd UCSM---BC-prototype
```

### 2. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Start the server (creates the SQLite database automatically on first run)
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive API docs: `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. First run

The database is created automatically on first startup — no migration needed. Open `http://localhost:5173` and register a new account to get started.

---

### Network access (optional)

To make the app accessible to other devices on the same local network, start the backend with:

```bash
uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

The `host: true` option is already set in `frontend/vite.config.ts`. Other devices can then access the app at `http://<your-ip>:5173`.

---

## Features

### Projects
- Create and manage multiple projects
- Three visibility levels: private, link-share, public
- Per-project change history log

### Use Case Board
- Kanban-style board with customisable column groups
- Drag-and-drop reordering of use cases within and between groups
- Predefined board templates (e.g. Authentication) that auto-populate columns and use cases

### Use Case Editor
- Two supported templates: **Cockburn** (structured, with level/scope fields) and **Jacobson** (basic flow + subflows)
- Fields: primary actor, supporting actors, goal, preconditions, postconditions, main flow, alternative flows
- Alternative flows linked to specific main-flow steps
- Auto-save with 600ms debounce

### Relationships
- `«include»` and `«extend»` relationships between use cases
- Visualised as a list inside the editor

### Real-time Collaboration
- WebSocket connection per project — changes made by one user appear instantly for all others
- Optimistic locking via a `version` integer: if two users edit the same use case simultaneously, the second save is rejected with a conflict warning
- Live user presence indicator (connection badge, user count)

### Validation
- Validates actor/verb structure in each step (Slovak verb dictionary, diacritic-aware)
- Detects UI-language phrases ("klikne na tlačidlo") that should not appear in use case steps
- Checks that included use cases are mentioned by name in the source use case's steps
- Issues shown inline in the editor, grouped by severity (error / warning)

### Authentication
- JWT-based login and registration
- Tokens stored in `localStorage`, validated on every app load

---

## Project Structure

```
backend/
  main.py            # FastAPI app, WebSocket endpoint, CORS, lifespan
  database.py        # SQLite connection, schema creation (init_db)
  auth.py            # JWT encode/decode, password hashing
  models.py          # Pydantic request/response models
  validation.py      # Server-side use case validation logic
  ws/
    manager.py       # In-memory WebSocket room manager
  routers/
    auth.py          # /api/auth/* — register, login, me
    projects.py      # /api/projects/* — CRUD + sharing
    use_cases.py     # /api/use-cases/* — CRUD + versioned save
    relationships.py # /api/relationships/*
    groups.py        # /api/groups/* — board columns

frontend/src/
  api/
    client.ts        # Axios instance (base URL, JWT header injection)
  context/
    AuthContext.tsx       # Login state, token management
    ProjectContext.tsx    # Active project
    UseCaseContext.tsx    # Active use case, use case list
    WebSocketContext.tsx  # WS connection, incoming event handling
  components/
    layout/          # AppShell, TopBar, Sidebar, ConnectionBadge
    projects/        # ProjectList, ProjectCard, ProjectForm
    board/           # UseCaseBoard, BoardColumn, drag-and-drop logic
    useCases/        # UseCaseEditor, all field sub-editors
    flows/           # MainFlowEditor, AlternativeFlowEditor, StepRow
    relationships/   # RelationshipPanel
    validation/      # ValidationPanel, issue display
    history/         # HistoryPanel, change log
  data/
    boardTemplates.ts  # Predefined board/group/use case templates
  utils/
    validation.ts    # Client-side validation (mirrors backend logic)
    format.ts        # Date formatting, label maps
```

---

## Key Implementation Notes

- **Whole-word actor matching** uses Unicode tokenisation (`/[\p{L}\p{N}]+/gu`) instead of `\b` because JavaScript's `\b` does not handle Slovak diacritics correctly.
- **Include validation** checks for consecutive token sequences (`containsPhrase`) so multi-word use case names match correctly against step text.
- **Optimistic locking**: every use case save sends the current `version`; the backend rejects the save if the stored version is higher.
- **Dead WebSocket cleanup** happens lazily during broadcast — a failed send removes the connection from the room rather than keeping a background ping loop.
- **`init_db()`** uses `CREATE TABLE IF NOT EXISTS` throughout and is called on every server startup, so no separate migration step is needed for a fresh install.
