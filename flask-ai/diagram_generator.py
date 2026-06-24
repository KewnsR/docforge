import os
import uuid
from PIL import Image, ImageDraw
from utils.file_parser import FileParser

class DiagramGenerator:
    """Generates architecture diagram PNGs for projects using PIL"""
    
    def __init__(self):
        self.file_parser = FileParser()
        self.diagrams_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'diagrams')
        os.makedirs(self.diagrams_dir, exist_ok=True)
        
    def create_architecture_diagram(self, code_structure: dict) -> str:
        project_name = code_structure.get('project_name', 'Dokari Project')
        files = code_structure.get('files', [])
        
        # Analyze files
        parsed_files = {}
        for f in files:
            # files can be string names or dicts with content
            filename = f if isinstance(f, str) else f.get('filename', '')
            content = '' if isinstance(f, str) else f.get('content', '')
            parsed_files[filename] = self.file_parser.parse_file(filename, content)
            
        # Design image size based on number of files
        num_files = len(parsed_files)
        width = 800
        height = max(500, 150 + num_files * 130)
        
        # Create image
        img = Image.new('RGB', (width, height), color='#f9fafb')
        draw = ImageDraw.Draw(img)
        
        # Draw Header
        draw.rectangle([(0, 0), (width, 80)], fill='#4f46e5')
        
        # Draw Title (using fallback text if font is not found)
        draw.text((20, 30), f"Architecture Diagram: {project_name}", fill='#ffffff')
        
        # Draw component blocks
        y_offset = 120
        box_width = 320
        box_height = 90
        
        # Draw files and details
        file_positions = {}
        for filename, info in parsed_files.items():
            # Draw box for file
            x_pos = 50
            draw.rectangle([(x_pos - 2, y_offset - 2), (x_pos + box_width + 2, y_offset + box_height + 2)], 
                           fill='#e0e7ff') # shadow/border
            draw.rectangle([(x_pos, y_offset), (x_pos + box_width, y_offset + box_height)], 
                           fill='#ffffff', outline='#4f46e5', width=2)
            
            # Draw file title
            draw.text((x_pos + 15, y_offset + 10), f"File: {filename}", fill='#111827')
            
            # Draw summary of contents
            summary = []
            if info['classes']:
                summary.append(f"Classes: {', '.join(info['classes'][:2])}")
            if info['functions']:
                summary.append(f"Funcs: {', '.join(info['functions'][:3])}")
            
            summary_text = "\n".join(summary) if summary else "Config / Static Asset / Text"
            draw.text((x_pos + 15, y_offset + 32), summary_text, fill='#4b5563')
            
            file_positions[filename] = (x_pos + box_width, y_offset + box_height / 2)
            y_offset += 130
            
        # Draw relationships (e.g. imports) on the right side
        for filename, info in parsed_files.items():
            imports = info['imports']
            if imports:
                x_start = file_positions[filename][0]
                y_start = file_positions[filename][1]
                
                # Show imports
                clean_imports = []
                for imp in imports:
                    # strip extensions/paths
                    clean_name = imp.split('.')[0]
                    clean_imports.append(clean_name)
                    
                rel_text = f"Dependencies: {', '.join(clean_imports[:3])}"
                draw.text((x_start + 40, y_start - 8), rel_text, fill='#059669')
                
                # Draw connector line
                draw.line([(x_start, y_start), (x_start + 30, y_start)], fill='#10b981', width=2)
                # Draw arrow head
                draw.polygon([(x_start + 26, y_start - 5), (x_start + 26, y_start + 5), (x_start + 32, y_start)], fill='#10b981')
            
        # Save image
        filename = f"diagram_{uuid.uuid4().hex[:10]}.png"
        img.save(os.path.join(self.diagrams_dir, filename))
        return filename
