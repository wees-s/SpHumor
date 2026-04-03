"""
Coleta status das linhas metroferroviárias via API da ARTESP.
Fonte: https://ccm.artesp.sp.gov.br/metroferroviario/api/status/
"""

import requests


API_URL = "https://ccm.artesp.sp.gov.br/metroferroviario/api/status/"


def get_metro_lines():
    """
    Retorna lista de linhas com seus status atuais.

    Cada item:
        nome          (str)  – ex: "Linha 7-Rubi"
        codigo        (str)  – ex: "7"
        empresa       (str)  – ex: "TIC Trens"
        situacao      (str)  – ex: "Operação Normal"
        operacao_normal (bool)
        classificacao (str)  – ex: "operacional"
        descricao     (str)  – mensagem extra (vazia quando normal)

    Retorna lista vazia em caso de falha.
    """
    try:
        response = requests.get(API_URL, timeout=10)
        response.raise_for_status()
        data = response.json()

        lines = []
        for empresa in data.get("empresas", []):
            empresa_nome = empresa.get("nome", "")
            for linha in empresa.get("linhas", []):
                if not linha.get("ativa", True):
                    continue
                status = linha.get("status", {})
                lines.append({
                    "nome": linha.get("nome", ""),
                    "codigo": str(linha.get("codigo", "")),
                    "empresa": empresa_nome,
                    "situacao": status.get("situacao", ""),
                    "operacao_normal": bool(status.get("operacao_normal", False)),
                    "classificacao": status.get("classificacao", ""),
                    "descricao": status.get("descricao", ""),
                })

        return lines

    except Exception as e:
        print(f"[metro] Erro ao coletar status das linhas: {e}")
        return []
