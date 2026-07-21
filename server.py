import os
import json
import re
import http.server
import socketserver
import urllib.parse
from datetime import datetime

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
PDFS_DIR = os.path.join(DIRECTORY, "pdfs")
DB_FILE = os.path.join(DIRECTORY, "db.json")

# Ensure pdfs directory exists
if not os.path.exists(PDFS_DIR):
    os.makedirs(PDFS_DIR)

def extract_pdf_page_count(filepath):
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
            text = content.decode('latin1', errors='ignore')
            
            # 1. Search for PDF dictionary objects << ... >>
            for dict_match in re.finditer(r'<<([^>]*?)>>', text):
                dict_content = dict_match.group(1)
                if '/Type' in dict_content and '/Pages' in dict_content:
                    count_match = re.search(r'/Count\s*(\d+)', dict_content)
                    if count_match:
                        return int(count_match.group(1))
            
            # 2. Fallback search for any /Count key near /Pages
            matches = re.finditer(r'/Type\s*/Pages', text)
            for match in matches:
                start = max(0, match.start() - 150)
                end = min(len(text), match.end() + 150)
                window = text[start:end]
                count_match = re.search(r'/Count\s*(\d+)', window)
                if count_match:
                    return int(count_match.group(1))
                    
            # 3. Last resort: largest count values
            count_matches = re.findall(r'/Count\s*(\d+)', text)
            if count_matches:
                try:
                    vals = [int(v) for v in count_matches if 0 < int(v) < 10000]
                    if vals:
                        return max(vals)
                except ValueError:
                    pass
    except Exception as e:
        print(f"Error reading page count from {filepath}: {e}")
    return 1

def extract_pdf_metadata(filepath):
    filename = os.path.basename(filepath)
    name_without_ext = os.path.splitext(filename)[0]
    
    metadata = {
        "title": "",
        "authors": "",
        "year": datetime.now().year,
        "pageCount": 1
    }
    
    metadata["pageCount"] = extract_pdf_page_count(filepath)
    
    try:
        with open(filepath, 'rb') as f:
            # Read first 16KB and last 16KB where PDF metadata streams typically reside
            content = f.read(16384)
            try:
                f.seek(-16384, 2)
                content += f.read(16384)
            except IOError:
                # File might be smaller than 16KB
                pass
            
            # Decode to safely search binary string (latin1 maps byte-for-byte)
            text = content.decode('latin1', errors='ignore')
            
            # 1. Search for metadata keys in the PDF Info Dictionary
            title_match = re.search(r'/Title\s*\((.*?)\)', text)
            if title_match:
                try:
                    raw_title = title_match.group(1)
                    metadata["title"] = raw_title.encode('latin1').decode('utf-8', errors='ignore')
                except Exception:
                    pass
            
            author_match = re.search(r'/Author\s*\((.*?)\)', text)
            if author_match:
                try:
                    raw_author = author_match.group(1)
                    metadata["authors"] = raw_author.encode('latin1').decode('utf-8', errors='ignore')
                except Exception:
                    pass
            
            # Search CreationDate (Format: D:YYYYMMDD...)
            date_match = re.search(r'/CreationDate\s*\(D:(\d{4})', text)
            if date_match:
                metadata["year"] = int(date_match.group(1))
    except Exception as e:
        print(f"Error reading PDF metadata for {filename}: {e}")
        
    # Clean up and normalize extracted title
    # Remove octal characters or other escape characters if present in raw string
    if metadata["title"]:
        # Simple cleanup of PDF text escapes
        metadata["title"] = re.sub(r'\\([0-7]{3})', '', metadata["title"])
        metadata["title"] = metadata["title"].replace('\\(', '(').replace('\\)', ')')
        metadata["title"] = metadata["title"].strip()

    if metadata["authors"]:
        metadata["authors"] = re.sub(r'\\([0-7]{3})', '', metadata["authors"])
        metadata["authors"] = metadata["authors"].replace('\\(', '(').replace('\\)', ')')
        metadata["authors"] = metadata["authors"].strip()

    # Fallback to filename if title is empty or invalid
    if not metadata["title"] or len(metadata["title"].strip()) < 3 or '\x00' in metadata["title"]:
        # Clean title from filename (replace dashes/underscores with spaces)
        clean_title = name_without_ext.replace('_', ' ').replace('-', ' ')
        # Capitalize words
        metadata["title"] = ' '.join(word.capitalize() for word in clean_title.split())
        
    if metadata["authors"] and ('\x00' in metadata["authors"] or len(metadata["authors"]) < 2):
        metadata["authors"] = ""
        
    return metadata

def load_and_sync_db():
    data = {
        "papers": [],
        "projects": [],
        "topics": [],
        "deletedPdfFiles": [],
        "goals": []
    }
    
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print("Error loading db.json:", e)
            
    # Ensure standard lists exist
    if "papers" not in data: data["papers"] = []
    if "projects" not in data: data["projects"] = []
    if "topics" not in data: data["topics"] = []
    if "deletedPdfFiles" not in data: data["deletedPdfFiles"] = []
    if "goals" not in data: data["goals"] = []
    
    # Scan pdfs directory and direct subdirectories
    pdf_files_mapping = {} # relative_path -> project_name
    all_pdf_rel_paths = []
    
    if os.path.exists(PDFS_DIR):
        for entry in os.listdir(PDFS_DIR):
            full_path = os.path.join(PDFS_DIR, entry)
            if os.path.isfile(full_path) and entry.lower().endswith('.pdf'):
                pdf_files_mapping[entry] = "Otomatik PDF"
                all_pdf_rel_paths.append(entry)
            elif os.path.isdir(full_path):
                project_name = entry
                if project_name.startswith('.'):
                    continue
                try:
                    for sub_entry in os.listdir(full_path):
                        sub_path = os.path.join(full_path, sub_entry)
                        if os.path.isfile(sub_path) and sub_entry.lower().endswith('.pdf'):
                            rel_path = f"{project_name}/{sub_entry}"
                            pdf_files_mapping[rel_path] = project_name
                            all_pdf_rel_paths.append(rel_path)
                except Exception as e:
                    print(f"Error scanning subdirectory '{project_name}': {e}")
    
    # Map existing papers by their pdfFile reference
    existing_pdfs = {p["pdfFile"] for p in data["papers"] if p.get("pdfFile")}
    deleted_pdfs = set(data["deletedPdfFiles"])
    
    changes_made = False
    
    for rel_path, project_name in pdf_files_mapping.items():
        if rel_path in existing_pdfs or rel_path in deleted_pdfs:
            continue
            
        print(f"New PDF detected: {rel_path} (Project: {project_name}). Analyzing metadata...")
        filepath = os.path.join(PDFS_DIR, rel_path.replace('/', os.sep))
        metadata = extract_pdf_metadata(filepath)
        
        # Calculate new importance order
        max_importance = max([p["importanceOrder"] for p in data["papers"]] + [0])
        
        # Build new paper record
        filename_only = os.path.splitext(os.path.basename(rel_path))[0]
        new_paper = {
            "id": f"pdf-{int(datetime.now().timestamp())}-{len(data['papers'])}",
            "title": metadata["title"] if metadata["title"] != "Adsız Doküman" else filename_only,
            "authors": metadata["authors"],
            "year": metadata["year"],
            "month": None,
            "project": project_name,
            "topic": "PDF",
            "importanceOrder": max_importance + 1,
            "isRead": False,
            "notes": f"# Notlar: {metadata['title']}\n\n[Otomatik Eklenen PDF]\nKategori/Proje: {project_name}\nDosya Yolu: {rel_path}\nEklenme Tarihi: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "pdfFile": rel_path,
            "pageCount": metadata["pageCount"],
            "readPagesCount": 0,
            "createdAt": datetime.now().isoformat() + "Z",
            "updatedAt": datetime.now().isoformat() + "Z"
        }
        
        # Add project to projects list if not there
        if not any(p["name"] == project_name for p in data["projects"]):
            data["projects"].append({"id": f"project-{int(datetime.now().timestamp())}", "name": project_name})
            
        # Add 'PDF' to topics lists if not there
        if not any(t["name"] == "PDF" for t in data["topics"]):
            data["topics"].append({"id": f"topic-{int(datetime.now().timestamp())}", "name": "PDF"})
            
        data["papers"].append(new_paper)
        existing_pdfs.add(rel_path)
        changes_made = True

    # Migration/backfill logic for existing papers
    migration_needed = False
    for p in data["papers"]:
        if "pageCount" not in p:
            migration_needed = True
            pdf_file = p.get("pdfFile")
            if pdf_file:
                filepath = os.path.normpath(os.path.join(PDFS_DIR, pdf_file.replace('/', os.sep)))
                if os.path.exists(filepath):
                    p["pageCount"] = extract_pdf_page_count(filepath)
                else:
                    p["pageCount"] = 1
            else:
                p["pageCount"] = 1
                
        if "readPagesCount" not in p:
            migration_needed = True
            progress = p.get("progress", 0)
            if progress == 100:
                p["readPagesCount"] = p["pageCount"]
            elif p.get("isRead", False):
                p["readPagesCount"] = p["pageCount"]
                p["progress"] = 100
            else:
                p["readPagesCount"] = int(round((progress / 100.0) * p["pageCount"]))
                
    if migration_needed:
        changes_made = True
        
    if changes_made:
        save_db(data)
        
    data["pdfFiles"] = all_pdf_rel_paths
    return data

def save_db(data):
    # Strip pdfFiles from data to save clean db
    clean_data = {k: v for k, v in data.items() if k != "pdfFiles"}
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(clean_data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print("Error saving db.json:", e)

class PaperListRequestHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Translate URL path to local file path relative to root directory
        return super().translate_path(path)

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        # API - Fetch database (synchronized with folders)
        if path == "/api/data":
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            data = load_and_sync_db()
            self.wfile.write(json.dumps(data, indent=2, ensure_ascii=False).encode('utf-8'))
            
        # Serve PDF files securely from pdfs/ subfolder
        elif path.startswith("/pdfs/"):
            filename = urllib.parse.unquote(path[6:])
            filepath = os.path.join(PDFS_DIR, filename)
            
            # Secure path traversal check
            normalized_filepath = os.path.abspath(filepath)
            normalized_pdf_dir = os.path.abspath(PDFS_DIR)
            
            if normalized_filepath.startswith(normalized_pdf_dir) and os.path.exists(filepath) and os.path.isfile(filepath):
                self.send_response(200)
                self.send_header('Content-Type', 'application/pdf')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                with open(filepath, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "PDF file not found")
        else:
            # Default static file handler for index.html, styles.css, app.js
            super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        # API - Save database
        if path == "/api/data":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Delete PDF files physically on disk if they are in deletedPdfFiles list
                deleted_pdfs = data.get("deletedPdfFiles", [])
                for pdf_file in deleted_pdfs:
                    if pdf_file:
                        filepath = os.path.normpath(os.path.join(PDFS_DIR, pdf_file.replace('/', os.sep)))
                        normalized_filepath = os.path.abspath(filepath)
                        normalized_pdf_dir = os.path.abspath(PDFS_DIR)
                        if normalized_filepath.startswith(normalized_pdf_dir) and os.path.exists(filepath) and os.path.isfile(filepath):
                            try:
                                os.remove(filepath)
                                print(f"Deleted PDF file from folder: {filepath}")
                                
                                # Clean up empty parent directory
                                parent_dir = os.path.dirname(filepath)
                                if parent_dir != normalized_pdf_dir and os.path.exists(parent_dir) and not os.listdir(parent_dir):
                                    os.rmdir(parent_dir)
                                    print(f"Cleaned up empty parent directory: {parent_dir}")
                            except Exception as e:
                                print(f"Error deleting PDF file {filepath}: {e}")
                
                # Automatically organize PDF files into project subdirectories
                papers = data.get("papers", [])
                for paper in papers:
                    pdf_file = paper.get("pdfFile")
                    project = paper.get("project")
                    
                    if pdf_file and project:
                        # Clean project name for valid folder name
                        proj_dir_name = "".join(c for c in project if c not in r'\/:*?"<>|').strip()
                        if not proj_dir_name:
                            proj_dir_name = "Otomatik PDF"
                            
                        filename = os.path.basename(pdf_file)
                        target_rel_path = f"{proj_dir_name}/{filename}"
                        
                        if pdf_file != target_rel_path:
                            source_full_path = os.path.normpath(os.path.join(PDFS_DIR, pdf_file.replace('/', os.sep)))
                            target_full_dir = os.path.normpath(os.path.join(PDFS_DIR, proj_dir_name))
                            target_full_path = os.path.normpath(os.path.join(target_full_dir, filename))
                            
                            if os.path.exists(source_full_path):
                                if not os.path.exists(target_full_dir):
                                    os.makedirs(target_full_dir)
                                    
                                # If target already exists, generate a unique filename
                                final_filename = filename
                                base, ext = os.path.splitext(filename)
                                counter = 1
                                while os.path.exists(os.path.join(target_full_dir, final_filename)):
                                    final_filename = f"{base}_{counter}{ext}"
                                    counter += 1
                                    
                                final_target_path = os.path.join(target_full_dir, final_filename)
                                target_rel_path = f"{proj_dir_name}/{final_filename}"
                                
                                try:
                                    import shutil
                                    shutil.move(source_full_path, final_target_path)
                                    print(f"Moved PDF file: {source_full_path} -> {final_target_path}")
                                    
                                    # Update paper pdfFile reference to the new relative path
                                    paper["pdfFile"] = target_rel_path
                                    
                                    # Clean up empty parent directory
                                    source_dir = os.path.dirname(source_full_path)
                                    if source_dir != os.path.abspath(PDFS_DIR) and os.path.exists(source_dir) and not os.listdir(source_dir):
                                        os.rmdir(source_dir)
                                except Exception as e:
                                    print(f"Error organizing PDF file: {e}")
                                    
                # Ensure all papers have correct page counts and read page counts
                for paper in papers:
                    pdf_file = paper.get("pdfFile")
                    if pdf_file:
                        filepath = os.path.normpath(os.path.join(PDFS_DIR, pdf_file.replace('/', os.sep)))
                        if os.path.exists(filepath):
                            paper["pageCount"] = extract_pdf_page_count(filepath)
                            
                    if "pageCount" not in paper:
                        paper["pageCount"] = 1
                    if "readPagesCount" not in paper:
                        progress = paper.get("progress", 0)
                        paper["readPagesCount"] = int(round((progress / 100.0) * paper["pageCount"]))
                        
                save_db(data)
                
                # Perform a load and sync to return the updated database list of pdfFiles
                synced_data = load_and_sync_db()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(synced_data, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            self.send_error(404)
            
    def do_OPTIONS(self):
        # Support CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server():
    # Allow socket address reuse to avoid address already in use errors
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.ThreadingTCPServer(("", PORT), PaperListRequestHandler) as httpd:
        print(f"=========================================================")
        print(f"PaperList Local Server is running!")
        print(f"Address: http://localhost:{PORT}")
        print(f"PDFs Watch Directory: {PDFS_DIR}")
        print(f"Database File: {DB_FILE}")
        print(f"=========================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()
