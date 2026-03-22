# ResumeRelevance AI

ResumeRelevance AI compares an uploaded resume against a job description and returns:

- `matchScore`
- `matchedSkills`
- `missingSkills`
- `aiAdvice`
- `recommendations` (section-aware improvement lines)
- `resumeText` (extracted text for live editing)

The project uses a free local vector database and optional Grok AI recommendations.

## Architecture

- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Vector DB: `vectra` (local, file-based)
- Resume parser: `pdf-parse`
- Embeddings: deterministic local embedding function (no paid API)

Vector data is persisted under `.resume-data/` and ignored from git.

## Why This Vector DB

`vectra` is free and local. It gives a Pinecone-like query interface, but stores everything on disk so there is no hosted dependency, no API key, and no cost to run.

## Run Locally

Install:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env
```

Set `GROK_API_KEY` in `.env`.

Run client + server together:

```bash
npm run dev
```

Backend only:

```bash
npm run dev:server
```

Build both:

```bash
npm run build
```

Start compiled server:

```bash
npm run start:server
```

## API

### Health

`GET /api/health`

Response example:

```json
{
  "status": "ok",
  "vectorStore": "vectra",
  "mode": "vector-analysis"
}
```

### Analyze Resume

`POST /api/analyze`

`multipart/form-data` fields:

- `resume`: PDF file
- `jobDescription`: string

Response example:

```json
{
  "matchScore": 74,
  "matchedSkills": ["React", "TypeScript", "Node.js"],
  "missingSkills": ["Docker", "AWS"],
  "aiAdvice": "Your resume already aligns well on React, TypeScript, Node.js...",
  "recommendations": [
    {
      "section": "skills",
      "text": "Add Docker to your skills list if you can support it with project evidence."
    },
    {
      "section": "experience",
      "text": "Add a bullet describing where you used AWS in production and what impact it delivered."
    }
  ],
  "resumeText": "... extracted resume text ..."
}
```

## Backend Notes

- The server currently supports PDF resume uploads.
- The index is reused across requests and filtered per analysis ID.
- If a PDF has very little extractable text, the API returns a validation error.
- The frontend includes a live editor where recommendations are inserted into the correct section (for example skills into Skills) and downloaded as an updated PDF resume draft.

## Commit Workflow

You asked for commit history after each milestone. This backend phase was committed in steps:

1. `feat: scaffold backend api`
2. `feat: implement local vectra analysis service`
3. `feat: connect frontend analyzer to backend api`
4. `docs: update readme for backend phase`

## Known Environment Note

Vite warns that Node 20.19+ is recommended. The project still builds on 20.17 in this workspace, but upgrading Node is recommended for full compatibility.
