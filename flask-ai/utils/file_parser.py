import re

class FileParser:
    """Parses code files to extract structural metadata (imports, classes, functions)"""
    
    def parse_file(self, filename: str, content: str) -> dict:
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        if ext == 'py':
            return self._parse_python(content)
        elif ext in ['js', 'ts', 'jsx', 'tsx']:
            return self._parse_javascript(content)
        elif ext == 'php':
            return self._parse_php(content)
        else:
            return self._parse_generic(content)
            
    def _parse_python(self, content: str) -> dict:
        classes = re.findall(r'^\s*class\s+(\w+)', content, re.MULTILINE)
        functions = re.findall(r'^\s*def\s+(\w+)', content, re.MULTILINE)
        imports = re.findall(r'^\s*(?:import\s+(\w+)|from\s+(\w+)\s+import)', content, re.MULTILINE)
        import_list = []
        for imp in imports:
            import_list.extend([x for x in imp if x])
        return {
            'classes': classes,
            'functions': functions,
            'imports': list(set(import_list))
        }
        
    def _parse_javascript(self, content: str) -> dict:
        classes = re.findall(r'^\s*class\s+(\w+)', content, re.MULTILINE)
        # Find named functions and arrow functions
        functions = re.findall(r'(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>)', content)
        func_list = [f[0] or f[1] for f in functions if f[0] or f[1]]
        # Find imports and requires
        imports = re.findall(r'import\s+(?:.*?\s+from\s+)?[\'"]([^\'"]+)[\'"]|require\([\'"]([^\'"]+)[\'"]\)', content)
        import_list = [i[0] or i[1] for i in imports if i[0] or i[1]]
        # Filter path prefixes to just name
        import_list = [imp.split('/')[-1] for imp in import_list]
        return {
            'classes': classes,
            'functions': func_list,
            'imports': list(set(import_list))
        }
        
    def _parse_php(self, content: str) -> dict:
        classes = re.findall(r'^\s*class\s+(\w+)', content, re.MULTILINE)
        functions = re.findall(r'^\s*function\s+(\w+)', content, re.MULTILINE)
        imports = re.findall(r'(?:require|include)(?:_once)?\s*\(?[\'"]([^\'"]+)[\'"]', content)
        # Filter path prefixes to just file base name
        import_list = [imp.split('/')[-1] for imp in imports]
        return {
            'classes': classes,
            'functions': functions,
            'imports': list(set(import_list))
        }
        
    def _parse_generic(self, content: str) -> dict:
        return {'classes': [], 'functions': [], 'imports': []}
