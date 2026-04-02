# SP Humor Monitor

Um dashboard que monitora o nível de stress da cidade de São Paulo utilizando métricas de dados públicos em tempo real.

## Arquitetura

O projeto é dividido em duas partes independentes que se comunicam através de um arquivo JSON:

```
Backend (worker.py)  →  frontend/data.json  ←  Frontend (estático)
  a cada 10 min           arquivo compartilhado      apenas leitura
  coleta APIs externas
  calcula métricas
  grava no arquivo
```

- **Backend**: Worker standalone que coleta dados das APIs externas a cada 10 minutos e grava em `frontend/data.json`.
- **Frontend**: Site estático que lê `data.json` e apresenta os dados. Nenhuma chamada de API é feita por usuário.

Essa separação garante que milhares de usuários simultâneos não gerem requisições extras às APIs externas.

## Como Executar

### Pré-requisitos
- Python 3.8+
- pip
- Acesso à internet para APIs externas

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/wees-s/SpHumor.git
cd SpHumor
```

2. Instale as dependências:
```bash
cd backend
pip install -r requirements.txt
```

### Executando

São necessários **dois processos** rodando simultaneamente:

```bash
# Terminal 1 — Worker (coleta dados e grava data.json)
cd backend/src
python worker.py

# Terminal 2 — Servidor estático (serve o frontend)
cd backend/src
python api.py
```

Acesse no navegador: `http://localhost:5000`

> **Nota:** O `api.py` é apenas um servidor de arquivos estáticos. Você pode substituí-lo por qualquer servidor estático (nginx, `python -m http.server` na pasta `frontend/`, etc).

## Funcionalidades

### Medidor de Stress
- **Índice de 0 a 100%**: Baseado em 5 métricas de dados públicos
- **Atualização automática**: Dados coletados a cada 10 minutos pelo worker
- **Interface visual**: Termômetro animado com indicadores de emoji

### Pesos Personalizáveis
O usuário pode distribuir até **10 pontos** entre as 5 métricas, personalizando quais fatores de stress são mais relevantes para ele:

| Métrica | O que mede |
|---|---|
| **Trânsito** | km de congestionamento (CET SP) |
| **Chuva** | Probabilidade de precipitação (%) |
| **Horários de Pico** | Stress por horário (7-9h e 17-19h = máximo) |
| **Dia da Semana** | Segunda = 100%, Domingo = 0% |
| **Clima** | Temperatura fora da faixa confortável (20-25°C) |

Exemplo: Peso 5 em trânsito, 3 em chuva, 2 em clima, 0 nos demais = o índice reflete principalmente trânsito e chuva.

Os pesos são salvos no `localStorage` do navegador. O cálculo é feito no client-side usando os dados brutos do `data.json`.

### Recursos de Tempo
- **Relógio em tempo real**: Atualização a cada segundo
- **Status de horário de pico**: Indicadores visuais
- **Última atualização**: Timestamp dos dados coletados

### Interface
- **Design responsivo**: Desktop e mobile
- **Glassmorphism**: Efeitos de blur e transparência
- **Cores dinâmicas**: Indicadores visuais por severidade
- **Parallax**: Background com efeito de movimento do mouse

## Estrutura do Projeto

```
SpHumor/
├── backend/
│   ├── src/
│   │   ├── worker.py              # Worker standalone (coleta + grava JSON)
│   │   ├── api.py                 # Servidor estático para o frontend
│   │   ├── climate/
│   │   │   └── climate.py         # API Open-Meteo (clima)
│   │   ├── transit/
│   │   │   └── transit.py         # Scraper CET SP (trânsito)
│   │   └── actualdatetime/
│   │       └── actualdatetime.py  # Data/hora de São Paulo
│   └── requirements.txt
├── frontend/
│   ├── index.html                 # Interface principal
│   ├── style.css                  # Estilos visuais
│   ├── script.js                  # Lógica do dashboard + pesos
│   └── data.json                  # Dados gerados pelo worker (auto)
└── README.md
```

## APIs Utilizadas

### CET SP
- **Fonte**: Site da CET SP (scraping HTML)
- **Métrica**: Quilometragem total de congestionamento
- **Atualização**: A cada 10 minutos pelo worker

### Open-Meteo
- **Fonte**: API REST gratuita
- **Métricas**: Temperatura, probabilidade de chuva, precipitação
- **Localização**: São Paulo (-23.5475, -46.6361)
- **Cache**: Respostas cacheadas por 1 hora, 5 retries com backoff

## Cálculo de Stress

### Fórmula

```
Stress = Σ(stress_metrica × peso_usuario) / total_pontos_distribuidos
```

Cada métrica individual é calculada pelo worker (0-100%):

- **Trânsito**: `(km_congestionamento / 800) × 100`
- **Chuva**: Probabilidade de precipitação direta (0-100%)
- **Horários de Pico**: 100% em 7-9h e 17-19h, escala menor em outros horários, 0% nos fins de semana
- **Dia da Semana**: Segunda = 100%, Terça = 80%, ..., Domingo = 0%
- **Clima**: 0% entre 20-25°C, 60-65% em faixas próximas, 100% em extremos

### Escala
- **0-20%**: Stress baixo
- **21-40%**: Stress moderado
- **41-60%**: Stress elevado
- **61-80%**: Stress alto
- **81-100%**: Stress crítico

## Tecnologias

### Backend
- **Python 3.8+**
- **BeautifulSoup4**: Scraping da CET SP
- **openmeteo-requests**: Cliente da API Open-Meteo
- **requests-cache**: Cache de requisições HTTP
- **pytz**: Timezone de São Paulo

### Frontend
- **HTML5 / CSS3 / JavaScript ES6+**
- **Fontes**: Press Start 2P, Share Tech Mono, Orbitron
- **Armazenamento**: localStorage para pesos do usuário
- **Sem frameworks**: Vanilla JS

## Licença

Desenvolvido para fins educacionais. Uso permitido para aprendizado e desenvolvimento.

---

**© 2026 - SP Humor Monitor - Desenvolvido para fins educacionais**
