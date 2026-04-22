# SP❤HUMOR - Monitor de Stress de São Paulo

Um dashboard que monitora em tempo real o nível de stress da cidade de São Paulo utilizando métricas de dados públicos. O projeto combina dados de trânsito, clima e horários para criar um índice de stress urbano personalizável.

## 🚀 Como Executar

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

2. Instale as dependências do backend:
```bash
cd backend
pip install -r requirements.txt
```

### Executando a Aplicação

**Opção 1: Modo Completo (Backend + Frontend)**

1. Inicie o worker de coleta de dados (em um terminal):
```bash
cd backend/src
python worker.py
```

2. Inicie o servidor frontend (em outro terminal):
```bash
cd backend/src
python api.py
```

3. Acesse a aplicação: http://localhost:5000

**Opção 2: Apenas Frontend Estático**
```bash
cd frontend
# Abra index.html diretamente no navegador ou use um servidor local
python -m http.server 8000
```

## 🎯 Funcionalidades

### Medidor de Stress Personalizável
- **Cálculo em tempo real**: Baseado em 5 métricas ponderáveis pelo usuário
- **Atualização automática**: Dados atualizados a cada 10 minutos
- **Interface visual**: Termômetro animado com indicadores emoji
- **Personalização**: Usuário pode distribuir 10 pontos entre as métricas

### Métricas Monitoradas
1. **Trânsito** (variável): Dados da CET SP em km de congestionamento
2. **Chuva** (variável): Probabilidade de precipitação (%)
3. **Horário de Pico** (variável): Análise de horários críticos
4. **Dia da Semana** (variável): Ponderação por dia útil/fim de semana
5. **Temperatura** (variável): Impacto do clima no stress

### Recursos de Tempo
- **Relógio em tempo real**: Atualização a cada segundo
- **Status de horário de pico**: Indicadores contextuais
- **Última atualização**: Timestamp dos dados coletados

### Interface Avançada
- **Design responsivo**: Adaptável para desktop e mobile
- **Glassmorphism**: Estilo moderno com efeitos de blur e parallax
- **Tema claro/escuro**: Alternância de tema com persistência
- **Logo personalizado**: Imagem vetorial com efeitos glow
- **Animações suaves**: Transições e micro-interações

## 🏗️ Arquitetura do Projeto

```
SpHumor/
├── backend/
│   ├── src/
│   │   ├── api.py              # Servidor Flask estático
│   │   ├── worker.py           # Worker independente de coleta
│   │   ├── data_cache.py       # Cache concorrente (legado)
│   │   ├── data_tests.py       # Testes de dados
│   │   ├── climate/            # Módulo climático
│   │   │   └── climate.py
│   │   ├── transit/            # Módulo de trânsito
│   │   │   └── transit.py
│   │   └── actualdatetime/     # Módulo de data/hora
│   │       └── actualdatetime.py
│   └── requirements.txt
├── frontend/
│   ├── index.html             # Interface principal
│   ├── style.css             # Estilos com glassmorphism
│   ├── script.js             # Lógica JavaScript modular
│   ├── data.json             # Dados gerados pelo worker
│   └── logo/                 # Assets visuais
│       ├── LOGOSPHUMOR.png   # Logo principal
│       └── template.png
└── README.md
```

## 📊 APIs Utilizadas

### CET SP
- **Endpoint**: Dados de trânsito em tempo real
- **Métrica**: Quilometragem de congestionamento
- **Atualização**: A cada 10 minutos
- **Tratamento**: Timeout 30s, fallback para 0km

### Open-Meteo
- **Endpoint**: Dados climáticos de São Paulo
- **Métricas**: Temperatura e probabilidade de chuva
- **Atualização**: A cada 10 minutos
- **Cache**: Respostas cacheadas localmente

## 🧮 Cálculo de Stress

### Sistema Híbrido
O projeto utiliza dois sistemas de cálculo:

**1. Cálculo Base (Worker)**
```python
Stress Individual = f(métrica_bruta)
# Cada métrica tem sua própria função de normalização
```

**2. Personalização (Frontend)**
```javascript
Stress Final = Σ(Stress Individual × Peso Usuário) / Σ(Pesos)
# Usuário distribui 10 pontos entre as 5 métricas
```

### Funções de Normalização

#### Trânsito
```python
Stress = (km_transito / 800) × 100
# Máximo esperado: 800km de congestionamento
```

#### Chuva
```python
Stress = probabilidade_chuva
# Direto: 0-100%
```

#### Temperatura
- **Zona de conforto**: 22-24°C → 0% stress
- **Extremos**: <10°C ou >30°C → 75-100% stress
- **Interpolação linear** entre pontos de âncora

#### Horário de Pico
- **Dias úteis**: Picos às 8h e 18h (100%)
- **Fim de semana**: Picos menores e deslocados
- **Interpolação** baseada em âncoras horárias

#### Dia da Semana
```python
Segunda: 100% | Terça: 80% | Quarta: 60% | Quinta: 30%
Sexta: 10% | Sábado: 5% | Domingo: 0%
```

## 🎨 Design System

### Cores
- **Primária**: Gradiente roxo-azul (#00e5ff, #a050ff)
- **Stress**: Verde (#00c2a8) → Amarelo (#ffe066) → Vermelho (#ff4d6d)
- **Cards**: Glassmorphism com backdrop-filter blur
- **Fundo**: Gradiente escuro com efeitos parallax

### Tipografia
- **Principal**: Press Start 2P (ciberpunk)
- **Secundária**: Share Tech Mono (monoespaçada)
- **Métricas**: Orbitron (futurista)

### Efeitos Visuais
- **Glow**: Drop-shadows múltiplos para elementos importantes
- **Parallax**: Background responsivo ao mouse
- **Transições**: Suaves com CSS transitions
- **Animações**: Pulse em indicadores live

## 📱 Responsividade

### Desktop (≥1200px)
- Layout otimizado para 1920x1080
- Grid 3x2 para cards principais
- Espaçamento pixel-perfect

### Mobile (≤768px)
- Layout empilhado verticalmente
- Logo reduzido para 200px
- Interface otimizada para toque

## 🔧 Tecnologias

### Backend
- **Python 3.8+**: Linguagem principal
- **Flask 2.3.3**: Servidor web estático
- **Requests 2.31.0**: Client HTTP
- **BeautifulSoup4 4.12.2**: Parsing HTML
- **Open-Meteo**: API climática
- **pytz 2023.3**: Timezones

### Frontend
- **HTML5**: Semântico e acessível
- **CSS3**: Moderno com animações
- **JavaScript ES6+**: Modular e orientado a objetos
- **LocalStorage**: Persistência de preferências

## 💾 Sistema de Dados

### Arquitetura Atual (Worker + JSON)
- **Worker independente**: Coleta e grava em `frontend/data.json`
- **Frontend estático**: Consome JSON via fetch
- **Atualização**: A cada 10 minutos automaticamente
- **Fallback**: Mantém último dado válido

### Benefícios
- **Deploy simplificado**: Pode ser 100% estático
- **Performance**: Sem dependência de backend em tempo real
- **Confiabilidade**: Funciona offline com dados cacheados
- **Escalabilidade**: Fácil deploy em Vercel/Netlify

## 🚨 Tratamento de Erros

### API CET
- **Timeout**: 30 segundos
- **Fallback**: 0km em caso de falha
- **Retry**: Próxima tentativa em 10 minutos

### API Climática
- **Cache**: 10 minutos local
- **Fallback**: Valores padrão
- **Validação**: Verificação de integridade

### Worker
- **Escrita atômica**: Arquivo temporário + replace
- **Logging**: Detalhado no console
- **Recuperação**: Continua em caso de erro

## 🎮 Interface Interativa

### Personalização de Stress
- **Distribuição de pontos**: 10 pontos entre 5 métricas
- **Feedback visual**: Barras de progresso animadas
- **Reset**: Restaurar configuração padrão
- **Persistência**: Salvo em localStorage

### Temas
- **Tema escuro**: Padrão ciberpunk
- **Tema claro**: Alternativa acessível
- **Persistência**: Preferência salva
- **Transição**: Suave entre temas

### Animações
- **Termômetro**: Needle animada conforme stress
- **Emojis**: Indicadores com escala e glow
- **Cards**: Hover effects com elevação
- **Background**: Parallax sutil ao mouse

## 📈 Status Contextuais

### Trânsito
- **0km**: "Aguardando dados..."
- **<300km**: "Pouco trânsito"
- **300-499km**: "Trânsito moderado"
- **500-799km**: "Trânsito intenso"
- **≥800km**: "Trânsito caótico"

### Temperatura
- **<15°C**: "Clima frio"
- **15-21°C**: "Clima ameno"
- **22-29°C**: "Clima agradável"
- **≥30°C**: "Clima quente"

### Horário de Pico
- **Fora do pico**: "Fora do horário de pico"
- **Próximo ao pico**: "Próximo ao horário de pico"
- **Horário de pico**: "Horário de pico: evite se possível"

## 🚀 Deploy

### Produção (Estático)
1. Execute o worker uma vez para gerar `data.json`
2. Faça upload da pasta `frontend` para Vercel/Netlify/GitHub Pages
3. Configure webhook ou cron job para atualizar `data.json`

### Desenvolvimento
1. Execute `python worker.py` para dados em tempo real
2. Execute `python api.py` para servidor local
3. Acesse http://localhost:5000

## 🧪 Testes

### Testes de Dados
```bash
cd backend/src
python data_tests.py
```

### Validações
- **APIs**: Teste de conectividade
- **Cálculos**: Verificação de fórmulas
- **Cache**: Persistência de dados

## 📝 Licença

Desenvolvido para fins educacionais. Uso permitido para aprendizado e desenvolvimento.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:
1. Fork o repositório
2. Crie uma branch para sua feature
3. Abra um pull request

## 📞 Suporte

Para dúvidas e sugestões:
- Abra uma Issue no repositório
- **Desenvolvedor**: Wesley Alexandre
- **Cadete 42 São Paulo**: login: wedos-sa

---

**© 2026 - SP❤HUMOR - Desenvolvido para fins educacionais**
