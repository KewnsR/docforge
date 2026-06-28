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
            filename = f if isinstance(f, str) else f.get('filename', '')
            content = '' if isinstance(f, str) else f.get('content', '')
            if filename:
                parsed_files[filename] = self.file_parser.parse_file(filename, content)
            
        num_files = max(1, len(parsed_files))
        width = 900
        height = max(550, 160 + num_files * 140)
        
        # Create canvas (clean slate theme)
        img = Image.new('RGB', (width, height), color='#0f172a')
        draw = ImageDraw.Draw(img)
        
        # Draw Header Banner
        draw.rectangle([(0, 0), (width, 85)], fill='#4f46e5')
        draw.text((30, 28), f"Dokari Architecture Map — {project_name}", fill='#ffffff')
        draw.text((30, 56), f"Extracted from {num_files} active source file(s)", fill='#cbd5e1')
        
        # Draw component blocks
        y_offset = 120
        box_width = 360
        box_height = 105
        
        file_positions = {}
        for filename, info in parsed_files.items():
            x_pos = 50
            # Outer shadow & inner card
            draw.rectangle([(x_pos - 2, y_offset - 2), (x_pos + box_width + 2, y_offset + box_height + 2)], fill='#334155')
            draw.rectangle([(x_pos, y_offset), (x_pos + box_width, y_offset + box_height)], fill='#1e293b', outline='#6366f1', width=2)
            
            # File Title
            draw.text((x_pos + 16, y_offset + 12), f"File: {filename}", fill='#f8fafc')
            
            # File Breakdown
            summary = []
            if info['classes']:
                classes_str = ", ".join(info['classes'])
                summary.append(f"Classes ({len(info['classes'])}): {classes_str[:45]}")
            if info['functions']:
                funcs_str = ", ".join(info['functions'])
                summary.append(f"Funcs ({len(info['functions'])}): {funcs_str[:50]}")
            
            summary_text = "\n".join(summary) if summary else "Config / Script / Asset"
            draw.text((x_pos + 16, y_offset + 38), summary_text, fill='#94a3b8')
            
            file_positions[filename] = (x_pos + box_width, y_offset + box_height / 2)
            y_offset += 140
            
        # Draw dependency links on the right side
        for filename, info in parsed_files.items():
            imports = info['imports']
            if imports and filename in file_positions:
                x_start = file_positions[filename][0]
                y_start = file_positions[filename][1]
                
                clean_imports = [imp.split('.')[0] for imp in imports]
                rel_text = f"Dependencies: {', '.join(clean_imports[:4])}"
                
                # Connector lines & text
                draw.line([(x_start, y_start), (x_start + 40, y_start)], fill='#10b981', width=2)
                draw.polygon([(x_start + 34, y_start - 5), (x_start + 34, y_start + 5), (x_start + 42, y_start)], fill='#10b981')
                draw.text((x_start + 50, y_start - 8), rel_text, fill='#34d399')
            
        # Save image
        filename = f"diagram_{uuid.uuid4().hex[:10]}.png"
        img.save(os.path.join(self.diagrams_dir, filename))
        return filename
