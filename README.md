# Dokari - AI-Powered Technical Documentation Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-Powered-blue.svg)](https://ai.google.dev/)

Dokari is an intelligent, open-source technical documentation companion that uses artificial intelligence to automatically create codebase references, explain system structures, and answer natural language questions about your project files.

---

## Features

- **Dokari Companion**: Interactive offline Q&A chatbot that acts as an automated guide specifically for the Dokari system (features, setup, workspace usage) without requiring API key calls.
- **Doc Health Analyzer**: Calculates a coverage quality score (0-100) for your codebase and provides actionable AI-powered code-fix suggestions (docstrings and comments) powered by Google Gemini.
- **API Documentation**: Parses source files (Python, JavaScript, PHP) to generate complete technical references.
- **README Generator**: Analyzes project files and actual code contents to compose professional README markdown files.
- **Architecture Diagrams**: Evaluates project dependencies/imports to draw visual diagram flowchart blocks.
- **User Authentication**: Secure login/signup system with project isolation for private cloud storage.
- **Multi-format Exports**: Download generated documentation as Markdown files or export them directly as PDF documents.
- **Clean Solid UI**: Slate flat dashboard with light and dark mode toggles, built without glassmorphism.

---

## Tech Stack

- Frontend: Vite, React SPA, Nginx
- Backend: Apache, PHP, PDO PostgreSQL
- AI Service: Python, Flask, PIL, Google Gemini
- Database: PostgreSQL

---

## System Documentation

A comprehensive guide explaining the backend architecture, services, database schemas, full API endpoint references, and Gemini fallback quota architecture can be found in the workspace:

👉 **[System Documentation Guide](system_documentation.md)**

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Google Gemini API Key (starts with `AQ.`)

### Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/KewnsR/dokari-docforge.git
   cd dokari
   ```

2. Configure environment variables. Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
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

1. Open http://localhost:3000. By default, Dokari runs in Guest Mode, preloading a read-only Welcome & Demo project.
2. Sign in or register an account via the header buttons to unlock database-backed cloud workspaces.
3. Click the "+" button in the Projects sidebar to create a project.
4. Drag and drop your project files (.py, .js, .jsx, .php) into the file dropzone.
5. Review your Documentation Health Score and apply AI suggestions.
6. Use the Companion chatbot to learn how to navigate the workspace.
7. Click "AI Generate" on API Docs, README, or Architecture tabs to create technical documentation.