import sqlite3
import os
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_db():
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
        
    with sqlite3.connect('reports.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                issue_type TEXT NOT NULL,
                description TEXT,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                image_filename TEXT,
                upvotes INTEGER DEFAULT 0
            )
        ''')
    print("Database initialized.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/reports', methods=['GET'])
def get_reports():
    with sqlite3.connect('reports.db') as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM reports ORDER BY upvotes DESC')
        reports = [dict(row) for row in cursor.fetchall()]
        return jsonify(reports)

@app.route('/api/reports', methods=['POST'])
def add_report():
    issue_type = request.form['issue_type']
    description = request.form['description']
    latitude = request.form['latitude']
    longitude = request.form['longitude']
    
    image_filename = None
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            image_filename = secure_filename(file.filename)
            file.path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
            file.save(file.path)

    with sqlite3.connect('reports.db') as conn:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO reports (issue_type, description, latitude, longitude, image_filename) VALUES (?, ?, ?, ?, ?)',
            (issue_type, description, latitude, longitude, image_filename)
        )
        conn.commit()
    return jsonify({"status": "success"}), 201

@app.route('/api/reports/<int:report_id>/upvote', methods=['POST'])
def upvote_report(report_id):
    with sqlite3.connect('reports.db') as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE reports SET upvotes = upvotes + 1 WHERE id = ?', (report_id,))
        conn.commit()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)