"""
Servidor estático para o frontend.
Serve os arquivos da pasta frontend/ (incluindo data.json gerado pelo worker).

O worker.py é responsável por coletar dados e gravar em frontend/data.json.
Este servidor apenas serve arquivos estáticos - nenhuma API é exposta.

Uso: python api.py
"""

from flask import Flask, send_from_directory
import os

app = Flask(__name__)

FRONTEND_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'frontend'
)


@app.route('/')
def serve_frontend():
    return send_from_directory(FRONTEND_PATH, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(FRONTEND_PATH, path)


if __name__ == '__main__':
    print("SP HUMOR - Servidor Frontend (arquivos estáticos)")
    print(f"Servindo: {FRONTEND_PATH}")
    print("Acesse: http://localhost:5000")
    print()
    print("IMPORTANTE: Execute também o worker.py para coletar dados!")
    app.run(debug=True, host='0.0.0.0', port=5000)
