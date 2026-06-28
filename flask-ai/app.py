from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import os
import sys
import google.generativeai as genai

# Load .env file automatically on app launch
possible_env_paths = [
    os.path.join(os.path.dirname(__file__), '..', '.env'),
    os.path.join(os.path.dirname(__file__), '.env'),
    '.env'
]
for env_path in possible_env_paths:
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        k, v = k.strip(), v.strip().strip('"\'')
                        os.environ[k] = v
        except Exception:
            pass
        break

api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY') or os.getenv('OPENAI_API_KEY')
if api_key:
    os.environ['GOOGLE_API_KEY'] = api_key
    os.environ['GEMINI_API_KEY'] = api_key
    genai.configure(api_key=api_key)

from ai_processor import AIProcessor
from diagram_generator import DiagramGenerator
from utils.file_parser import FileParser
import json
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize Dokari services
ai_processor = AIProcessor()
diagram_generator = DiagramGenerator()
file_parser = FileParser()

@app.route('/', methods=['GET'])
def index():
    """Root endpoint showing service status and endpoints"""
    return jsonify({
        'status': 'online',
        'service': 'Dokari AI Service',
        'version': '1.0.0',
        'message': 'Welcome to the Dokari AI Service. API endpoints are operational.',
        'endpoints': [
            {'path': '/health', 'methods': ['GET'], 'description': 'Health status check'},
            {'path': '/generate/api', 'methods': ['POST'], 'description': 'Generate API documentation'},
            {'path': '/generate/readme', 'methods': ['POST'], 'description': 'Generate README.md'},
            {'path': '/generate/diagram', 'methods': ['POST'], 'description': 'Generate architecture diagram'},
            {'path': '/generate/chat', 'methods': ['POST'], 'description': 'Interactive code Q&A chat'},
            {'path': '/generate/health', 'methods': ['POST'], 'description': 'Documentation health rating'},
            {'path': '/export', 'methods': ['POST'], 'description': 'Export markdown to PDF'}
        ]
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Dokari AI Service',
        'version': '1.0.0'
    })

@app.route('/generate/api', methods=['POST'])
def generate_api_docs():
    """Generate API documentation from code files"""
    data = request.json
    project_id = data.get('project_id')
    files_content = data.get('files_content', [])
    
    try:
        logger.info(f"Generating API docs for project {project_id}")
        api_docs = ai_processor.generate_api_documentation(files_content)
        return jsonify({
            'success': True,
            'documentation': api_docs,
            'format': 'markdown',
            'service': 'Dokari'
        })
    except Exception as e:
        logger.error(f"Error generating API docs: {str(e)}")
        return jsonify({'error': str(e), 'service': 'Dokari'}), 500

@app.route('/generate/readme', methods=['POST'])
def generate_readme():
    """Generate README.md content"""
    data = request.json
    project_info = data.get('project_info', {})
    files_content = data.get('files_content', [])
    
    try:
        logger.info(f"Generating README for project {project_info.get('name', 'Unknown')}")
        readme = ai_processor.generate_readme(project_info, files_content)
        return jsonify({
            'success': True,
            'readme': readme,
            'format': 'markdown',
            'service': 'Dokari'
        })
    except Exception as e:
        logger.error(f"Error generating README: {str(e)}")
        return jsonify({'error': str(e), 'service': 'Dokari'}), 500

@app.route('/generate/diagram', methods=['POST'])
def generate_diagram():
    """Generate architecture diagram"""
    data = request.json
    code_structure = data.get('code_structure', {})
    
    try:
        logger.info("Generating architecture diagram")
        diagram_path = diagram_generator.create_architecture_diagram(code_structure)
        return jsonify({
            'success': True,
            'diagram_url': f'http://localhost:5000/diagrams/{diagram_path}',
            'format': 'png',
            'service': 'Dokari'
        })
    except Exception as e:
        logger.error(f"Error generating diagram: {str(e)}")
        return jsonify({'error': str(e), 'service': 'Dokari'}), 500

@app.route('/generate/chat', methods=['POST'])
def generate_chat():
    """Answer questions about the codebase"""
    data = request.json
    files_content = data.get('files_content', [])
    question = data.get('question', '')
    history = data.get('chat_history', [])
    
    try:
        logger.info(f"Generating chat answer for question: {question[:50]}")
        answer = ai_processor.generate_chat_answer(files_content, question, history)
        return jsonify({
            'success': True,
            'answer': answer,
            'service': 'Dokari'
        })
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': str(e), 'service': 'Dokari'}), 500

@app.route('/generate/health', methods=['POST'])
def generate_health():
    """Analyze documentation coverage and quality score"""
    data = request.json
    files_content = data.get('files_content', [])
    
    try:
        logger.info("Analyzing documentation health")
        health = ai_processor.analyze_doc_health(files_content)
        return jsonify({
            'success': True,
            'score': health['score'],
            'suggestions': health['suggestions'],
            'service': 'Dokari'
        })
    except Exception as e:
        logger.error(f"Error in health endpoint: {str(e)}")
        return jsonify({'error': str(e), 'service': 'Dokari'}), 500

@app.route('/diagrams/<path:filename>', methods=['GET'])
def serve_diagram(filename):
    """Serve dynamically generated architecture diagrams"""
    return send_from_directory('diagrams', filename)

@app.route('/export', methods=['POST'])
def export_documentation():
    """Export documentation to various formats"""
    data = request.json
    content = data.get('content')
    format_type = data.get('format', 'markdown')
    
    try:
        if format_type == 'pdf':
            import pdfkit
            import tempfile
            temp_dir = tempfile.gettempdir()
            pdf_path = os.path.join(temp_dir, f"dokari_{abs(hash(content))}.pdf")
            pdfkit.from_string(content, pdf_path)
            
            return send_file(
                pdf_path,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='dokari_documentation.pdf'
            )
        else:
            return jsonify({
                'success': True,
                'content': content,
                'format': 'markdown',
                'service': 'Dokari'
            })
    except Exception as e:
        logger.error(f"Error exporting documentation: {str(e)}")
        return jsonify({'error': str(e), 'service': 'Dokari'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)