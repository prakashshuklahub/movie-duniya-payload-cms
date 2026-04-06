## Movie Approval CMS

Payload CMS project for **reviewing and publishing movies**. Editors submit entries for approval; admins approve or reject; approved titles are created in the **Movies** collection.

- **Stack:** Payload CMS 3, Next.js (admin + API), MongoDB  
- **Database:** MongoDB (connection string in `.env`)

### Features

- **Movie approvals** — submit, review, approve/reject, request changes  
- **Movies** — published records created when an approval is approved  
- **Users** — roles (e.g. admin / editor) for who can submit vs review  
- **REST / GraphQL** — standard Payload APIs for integrations (separate clients are outside this repo)

---

## Developer quick start

### 1) Clone

```bash
git clone <YOUR_REPO_URL> movie-duniya-admin
cd movie-duniya-admin
```

### 2) Environment

```bash
cp .env.example .env
```

Set at least:

- `DATABASE_URL` (or `MONGODB_URL`) — MongoDB connection string  
- `PAYLOAD_SECRET` — long random secret for Payload

### 3) MongoDB

Run MongoDB locally (or point `DATABASE_URL` at Atlas). Example on macOS:

```bash
brew services start mongodb-community
```

### 4) Install and run

```bash
npm install
npm run dev
```

Open **Admin:** `http://localhost:3000/admin` — create the first user on first visit.

### 5) After changing collections or globals

```bash
npm run generate:types
npm run generate:importmap
```

Use when you add or change fields so `payload-types.ts` and the admin import map stay in sync.
