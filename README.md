# SP Humor Monitor

Um dashboard que monitora o nível de stress da cidade de São Paulo utilizando métricas de dados públicos em tempo real.

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

2. Instale as dependências do backend:
```bash
cd backend
pip install -r requirements.txt
```

### Executando a Aplicação

1. Inicie o servidor backend:
```bash
cd backend/src
python api.py
```

2. Acesse a aplicação no navegador:
```
Frontend (VISUALIZAÇÃO EM FUNCIONAMENTO): http://localhost:5000
API (APENAS DADOS): http://localhost:5000/api/stress
```

## Funcionalidades

### Medidor de Stress
- **Cálculo em tempo real**: Baseado em 5 métricas ponderadas
- **Atualização automática**: Dados atualizados a cada 10 minutos
- **Interface visual**: Termômetro animado com indicadores visuais

### Métricas Monitoradas
1. **Trânsito** (30%): Dados da CET SP em km de congestionamento
2. **Chuva** (20%): Probabilidade de precipitação (%)
3. **Horário de Pico** (30%): Análise de horários críticos
4. **Dia da Semana** (10%): Ponderação por dia útil/fim de semana
5. **Temperatura** (10%): Impacto do clima no stress

### Recursos de Tempo
- **Relógio em tempo real**: Atualização a cada segundo
- **Status de horário de pico**: Indicadores visuais
- **Última atualização**: Timestamp dos dados

### Interface
- **Design responsivo**: Adaptável para desktop e mobile
- **Glassmorphism**: Estilo moderno com efeitos de blur
- **Cores dinâmicas**: Indicadores visuais por severidade

## Estrutura do Projeto

```
SpHumor/
├── backend/
│   ├── src/
│   │   ├── api.py              # Servidor Flask
│   │   ├── data_cache.py       # Cache com agendamento
│   │   ├── main.py            # Cálculos de stress
│   │   ├── climate/           # API climática
│   │   ├── transit/           # API de trânsito
│   │   └── actualdatetime/    # Data/hora atual
│   └── requirements.txt
├── frontend/
│   ├── index.html            # Interface principal
│   ├── style.css            # Estilos visuais
│   └── script.js           # Lógica do frontend
└── README.md
```

## APIs Utilizadas

### CET SP
- **Endpoint**: Dados de trânsito em tempo real
- **Métrica**: Quilometragem de congestionamento
- **Atualização**: A cada 10 minutos

### Open-Meteo
- **Endpoint**: Dados climáticos de São Paulo
- **Métricas**: Temperatura e probabilidade de chuva
- **Atualização**: A cada 10 minutos

## Cálculo de Stress

### Fórmula
```
Stress Total = (Trânsito × 0.3) + (Chuva × 0.2) + 
             (Horário Pico × 0.3) + (Dia Semana × 0.1) + 
             (Temperatura × 0.1)
```

### Pesos
- **Trânsito**: 30% (maior impacto)
- **Chuva**: 20% (impacto moderado)
- **Horário de Pico**: 30% (maior impacto)
- **Dia da Semana**: 10% (impacto baixo)
- **Temperatura**: 10% (impacto baixo)

### Escala
- **0-20%**: Stress baixo
- **21-40%**: Stress moderado
- **41-60%**: Stress elevado
- **61-80%**: Stress alto
- **81-100%**: Stress crítico

## Status de Trânsito

- **0km**: "Aguardando dados de trânsito..."
- **< 300km**: "Pouco trânsito"
- **300-499km**: "Trânsito moderado"
- **500-799km**: "Trânsito intenso pela cidade"
- **≥ 800km**: "Trânsito caótico, aguarde um tempo antes de sair"

## Status de Temperatura

- **< 15°C**: "Clima frio"
- **15-21°C**: "Clima ameno"
- **22-29°C**: "Clima agradável"
- **≥ 30°C**: "Clima quente"

## Status de Horário de Pico

- **Fora do pico**: "Fora do horário de pico"
- **Próximo ao pico**: "Próximo ao horário de pico"
- **Horário de pico**: "Horário de pico: se for possível, evite sair nesse horário"

## Tecnologias

### Backend
- **Python 3.8+**: Linguagem principal
- **Flask**: Servidor web
- **Threading**: Cache concorrente
- **Requests**: Client HTTP
- **BeautifulSoup4**: Parsing HTML
- **pytz**: Timezones

### Frontend
- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos
- **JavaScript ES6+**: Lógica interativa
- **Responsive Design**: Mobile-first

## Sistema de Cache

### Funcionamento
- **Atualização automática**: Thread background a cada 10 minutos
- **Cache persistente**: Evita requisições desnecessárias
- **Fallback**: Mantém dados anteriores em caso de falha
- **Timestamp**: Registro de última atualização

### Benefícios
- **Performance**: Reduz load em APIs externas
- **Confiabilidade**: Funciona mesmo com falhas
- **Eficiência**: Economiza recursos

## Tratamento de Erros

### API CET
- **Timeout**: 30 segundos de espera
- **Fallback**: Valor 0 em caso de falha
- **Retry**: Tentativa automática

### API Climática
- **Cache**: Respostas cacheadas por 10 minutos
- **Fallback**: Valores padrão em caso de erro
- **Validação**: Verificação de dados recebidos

## Responsividade

### Desktop
- **Resolução mínima**: 1200px de largura
- **Layout**: Grid 3x2 para cards principais
- **Alinhamento**: Pixel-perfect

### Mobile
- **Resolução máxima**: 768px de largura
- **Layout**: Empilhamento vertical
- **Touch**: Interface otimizada para toque

## Design System

### Cores
- **Primária**: Gradiente roxo-azul
- **Stress**: Verde → Amarelo → Vermelho
- **Cards**: Glassmorphism com blur
- **Texto**: Branco sobre fundo escuro

### Tipografia
- **Fonte**: Inter (Google Fonts)
- **Pesos**: 400, 500, 600, 700
- **Hierarquia**: Tamanhos consistentes

## Licença

Desenvolvido para fins educacionais. Uso permitido para aprendizado e desenvolvimento.

## Contribuição

Contribuições são bem-vindas! Por favor:
1. Fork o repositório
2. Crie uma branch para sua feature
3. Abra um Pull Request

## Suporte

Para dúvidas e sugestões:
- Abra uma Issue no repositório
- Entre em contato

---

**© 2026 - SP Humor Monitor - Desenvolvido para fins educacionais**
