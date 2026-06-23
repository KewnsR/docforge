# DocForge - AI-Powered Documentation Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Powered-green.svg)](https://openai.com/)

DocForge is an intelligent, open-source documentation generator that uses artificial intelligence to automatically create comprehensive documentation, project README files, and visual architecture diagrams from your codebase.

---

## Features

- AI-Powered Documentation: Generates high-quality technical content utilizing OpenAI models.
- Auto API Documentation: Parses source files (Python, JavaScript, PHP) to generate complete API references.
- README Generator: Analyzes project files to compose professional README markdown files.
- Architecture Diagrams: Evaluates project structure to render structural diagrams.
- Solid Design Interface: Clean slate layout with user controls, quick copy-to-clipboard, and exports.
- Secure User Authentication: Multi-user support with custom project workspaces and credentials database isolation.
- Export Formats: Expose documentation outputs as Markdown or download them as PDF files.
- Containerized Setup: Deploys easily with Docker Compose for local development or hosting.

---

## Tech Stack

- Frontend: Vite, React SPA, Nginx
- Backend: Apache, PHP, PDO PostgreSQL
- AI Service: Python, Flask, pdfkit, Graphviz, OpenAI
- Database: PostgreSQL

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- OpenAI API Key

### Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/docforge.git
   cd docforge
   ```

2. Configure environment variables. Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   DB_HOST=db
   DB_NAME=docforge
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```

3. Build and launch the application using Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

4. Access the services in your browser:
   - Frontend Application: http://localhost:3000
   - PHP Backend API: http://localhost:8080
   - Flask AI Service: http://localhost:5000

---

## Usage

1. Open the application at http://localhost:3000. By default, the application runs in Guest Mode, loading a mock demo project.
2. Register an account or sign in using the buttons in the header to unlock custom database-backed projects.
3. Click the "+" button in the Projects sidebar to create a new project.
4. Drag and drop your project code files (e.g. .py, .js, .jsx, .php) into the dropzone to upload them.
5. Choose a tab (API Docs, README.md, or Architecture Diagram) and click "AI Generate".
6. View, copy, or export the generated technical documentation.