from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import sys
import os
from data_cache import data_cache

app = Flask(__name__)
CORS(app)

@app.route('/api/stress')
def get_stress_data():
    try:
        data = data_cache.get_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def serve_frontend():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'frontend')
    return send_from_directory(frontend_path, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'frontend')
    return send_from_directory(frontend_path, path)

if __name__ == '__main__':
    print("Iniciando servidor SP❤HUMOR...")
    print("Frontend: http://localhost:5000")
    print("API: http://localhost:5000/api/stress")
    app.run(debug=True, host='0.0.0.0', port=5000)
