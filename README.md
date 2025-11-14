# Course Design Application

Microservices-based web application for course design with AI-assisted content annotation and semantic recommendation.

## Prerequisites

- Docker and Docker Compose
- Node.js (for annotation scripts)
- Ollama (for content annotation)

## Quick Start

### 1. Start Application

```bash
docker-compose up -d
```

Services will be available at:
- Client: http://localhost:3000
- API Gateway: http://localhost:8080
- MongoDB: localhost:27017

### 2. Verify Services

```bash
curl http://localhost:8080/health
```

## Semi-Automatic Content Annotation Pipeline

This system implements a **human-in-the-loop** annotation pipeline for creating pedagogically rich microcontents. The pipeline uses LLM-assisted metadata generation followed by manual validation to ensure accuracy.

### Prerequisites for Annotation

1. **Install Ollama:** https://ollama.ai
2. **Pull the annotation model:**
   ```bash
   ollama pull deepseek-r1:1.5b
   ```
3. **Verify Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

### Pipeline Workflow

#### Stage 1: Automated Metadata Generation

1. **Install dependencies:**
   ```bash
   cd annotation-scripts
   npm install
   ```

2. **Prepare content transcripts** in `transcripts/{type}/`:
   - `transcripts/videos/` - Video transcripts (use Whisper ASR)
   - `transcripts/pdfs/` - Extracted text from PDFs
   - `transcripts/audios/` - Audio transcripts
   - `transcripts/images/` - Transcribed text from infographics

3. **Run automated annotation:**
   ```bash
   node batch-annotate.js
   ```
   
   This processes all `.txt` files and generates structured JSON metadata in `output/{type}/` using the LLM.

#### Stage 2: Human-in-the-Loop Validation

4. **Manually review and validate** the generated JSON files in `output/{type}/`:
   - Check `learningOutcomes` for accuracy
   - Verify `primaryLevel` and `secondaryLevels` (SA taxonomy)
   - Correct any hallucinations or contextual errors
   - Refine `semanticKeywords` if needed

   **Important:** This validation step is critical for annotation quality and semantic embedding accuracy.

5. **Import validated content** to database:
   ```bash
   node import-to-db.js output/{type}/{validated-file}.json
   ```
   
   Or import all from a consolidated file:
   ```bash
   node import-to-db.js output/microcontents-real.json
   ```

6. **Calculate semantic embeddings:**
   ```bash
   curl -X POST http://localhost:8080/api/microcontents/embeddings/calculate
   ```
   
   The system uses SBERT to generate vector embeddings based on the validated metadata.

### Quick Start (Using Existing Microcontents)

The repository includes pre-validated microcontents about cognitive bias. To use them:

```bash
cd annotation-scripts
npm install
node import-to-db.js output/microcontents-real.json
curl -X POST http://localhost:8080/api/microcontents/embeddings/calculate
```

## Architecture

```
Preprocessing (Host):
  Ollama → annotation-scripts → JSON files
                                    ↓
Runtime (Docker):
  Client → API Gateway → Microservices → MongoDB
```

- Preprocessing: Offline, uses Ollama for LLM-based annotation
- Runtime: Always available, uses SBERT for semantic similarity

## Environment Variables

Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

Default values work for Docker setup.

## Stopping

```bash
docker-compose down
```

To remove volumes:

```bash
docker-compose down -v
```
