from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import openai
import os
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

# Initialize DocForge services
openai.api_key = os.getenv('OPENAI_API_KEY')
ai_processor = AIProcessor()
diagram_generator = DiagramGenerator()
file_parser = FileParser()

@app.route('/', methods=['GET'])
def index():
    """Root endpoint showing service status and endpoints"""
    return jsonify({
        'status': 'online',
        'service': 'DocForge AI Service',
        'version': '1.0.0',
        'message': 'Welcome to the DocForge AI Service. API endpoints are operational.',
        'endpoints': [
            {'path': '/health', 'methods': ['GET'], 'description': 'Health status check'},
            {'path': '/generate/api', 'methods': ['POST'], 'description': 'Generate API documentation'},
            {'path': '/generate/readme', 'methods': ['POST'], 'description': 'Generate README.md'},
            {'path': '/generate/diagram', 'methods': ['POST'], 'description': 'Generate architecture diagram'},
            {'path': '/export', 'methods': ['POST'], 'description': 'Export markdown to PDF'}
        ]
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'DocForge AI Service',
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
            'service': 'DocForge'
        })
    except Exception as e:
        logger.error(f"Error generating API docs: {str(e)}")
        return jsonify({'error': str(e), 'service': 'DocForge'}), 500

@app.route('/generate/readme', methods=['POST'])
def generate_readme():
    """Generate README.md content"""
    data = request.json
    project_info = data.get('project_info', {})
    files_summary = data.get('files_summary', '')
    
    try:
        logger.info(f"Generating README for project {project_info.get('name', 'Unknown')}")
        readme = ai_processor.generate_readme(project_info, files_summary)
        return jsonify({
            'success': True,
            'readme': readme,
            'format': 'markdown',
            'service': 'DocForge'
        })
    except Exception as e:
        logger.error(f"Error generating README: {str(e)}")
        return jsonify({'error': str(e), 'service': 'DocForge'}), 500

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
            'service': 'DocForge'
        })
    except Exception as e:
        logger.error(f"Error generating diagram: {str(e)}")
        return jsonify({'error': str(e), 'service': 'DocForge'}), 500

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
            pdf_path = os.path.join(temp_dir, f"docforge_{abs(hash(content))}.pdf")
            pdfkit.from_string(content, pdf_path)
            
            return send_file(
                pdf_path,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='docforge_documentation.pdf'
            )
        else:
            return jsonify({
                'success': True,
                'content': content,
                'format': 'markdown',
                'service': 'DocForge'
            })
    except Exception as e:
        logger.error(f"Error exporting documentation: {str(e)}")
        return jsonify({'error': str(e), 'service': 'DocForge'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)