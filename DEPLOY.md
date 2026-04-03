# 🚀 Deploy em Produção - SP❤HUMOR

Guia completo para deploy do projeto SP❤HUMOR em produção no domínio **www.sphumor.com**

## 📋 Visão Geral

O SP❤HUMOR utiliza uma arquitetura híbrida ideal para produção:
- **Worker**: Coleta dados a cada 10 minutos
- **Frontend Estático**: Serve a interface via CDN
- **JSON**: Arquivo de dados compartilhado

## 🏗️ Arquitetura de Produção

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Worker VPS    │───▶│   Static Files   │───▶│   CDN/Edge      │
│  (Data Collection)│   │   (JSON Storage) │   │  (www.sphumor.com)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   User Browser  │
                                               │   (Frontend)    │
                                               └─────────────────┘
```

## 🎯 Estratégias de Deploy

### Opção 1: Híbrido Recomendado (VPS + CDN)
**Ideal para**: Controle total, performance, escalabilidade

### Opção 2: Serverless (GitHub Actions + CDN)
**Ideal para**: Baixo custo, manutenção mínima

### Opção 3: Container (Docker + Kubernetes)
**Ideal para**: Alta disponibilidade, escala enterprise

---

## 🚀 Opção 1: Híbrido Recomendado (VPS + CDN)

### Passo 1: Configurar VPS para Worker

#### 1.1 Escolha e Provisione VPS
```bash
# Recomendados:
- DigitalOcean Droplet ($5/mês)
- Linode ($5/mês)
- AWS EC2 t3.micro ($8/mês)
- Vultr ($6/mês)

# Especificações mínimas:
- 1 CPU core
- 1GB RAM
- 25GB SSD
- Ubuntu 22.04 LTS
```

#### 1.2 Configurar Ambiente
```bash
# SSH no servidor
ssh root@SEU_IP

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Python e dependências
apt install python3 python3-pip python3-venv git -y

# Criar usuário dedicado
adduser sphumor
usermod -aG sudo sphumor
su - sphumor
```

#### 1.3 Deploy do Worker
```bash
# Clonar repositório
git clone https://github.com/wees-s/SpHumor.git
cd SpHumor

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
cd backend
pip install -r requirements.txt

# Testar worker
cd src
python worker.py
# Ctrl+C após confirmar funcionamento
```

#### 1.4 Configurar Systemd Service
```bash
# Criar service file
sudo nano /etc/systemd/system/sphumor-worker.service
```

```ini
[Unit]
Description=SP Humor Data Collection Worker
After=network.target

[Service]
Type=simple
User=sphumor
WorkingDirectory=/home/sphumor/SpHumor/backend/src
Environment=PATH=/home/sphumor/SpHumor/venv/bin
ExecStart=/home/sphumor/SpHumor/venv/bin/python worker.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar e iniciar service
sudo systemctl daemon-reload
sudo systemctl enable sphumor-worker
sudo systemctl start sphumor-worker

# Verificar status
sudo systemctl status sphumor-worker
```

#### 1.5 Configurar Cron Backup
```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário
0 2 * * * cp /home/sphumor/SpHumor/frontend/data.json /home/sphumor/backup/data-$(date +\%Y\%m\%d).json
```

### Passo 2: Configurar CDN/Static Hosting

#### 2.1 Opção A: Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Na pasta frontend
cd /home/sphumor/SpHumor/frontend
vercel login
vercel link

# Configurar domínio
vercel domains add www.sphumor.com
vercel --prod
```

#### 2.2 Opção B: Netlify
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
cd frontend
netlify login
netlify link
netlify deploy --prod --dir .

# Configurar domínio no painel Netlify
```

#### 2.3 Opção C: GitHub Pages (Grátis)
```bash
# Criar repositório GitHub
# Fazer push do projeto
# Ativar GitHub Pages
# Configurar domínio customizado
```

### Passo 3: Configurar Domínio

#### 3.1 DNS Configuration
```
# No seu registrador de domínio

Tipo: A
Nome: www
Valor: IP_DO_SEU_VPS (se usar VPS próprio)
TTL: 3600

# OU para CDN services
Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com (Vercel)
Valor: your-site.netlify.app (Netlify)
```

#### 3.2 SSL Certificate
```bash
# Se usar VPS próprio - Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d www.sphumor.com

# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

### Passo 4: Sincronização Dados → CDN

#### 4.1 Script de Sync
```bash
# Criar script
nano /home/sphumor/sync-to-cdn.sh
```

```bash
#!/bin/bash

# Sync data.json to CDN
rsync -avz /home/sphumor/SpHumor/frontend/data.json \
  user@cdn-server:/path/to/cdn/data.json

# Notificar CDN para limpar cache
curl -X POST "https://api.vercel.com/v1/integrations/deploy" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -d '{"files":["data.json"]}'
```

#### 4.2 Configurar Sync Automático
```bash
# Adicionar ao worker.py após atualização
import subprocess

def sync_to_cdn():
    try:
        subprocess.run(['/home/sphumor/sync-to-cdn.sh'], check=True)
        print("[SYNC] Dados sincronizados com CDN")
    except Exception as e:
        print(f"[SYNC ERROR] {e}")

# Chamar após collect_and_save()
sync_to_cdn()
```

---

## 🪁 Opção 2: Serverless (GitHub Actions + CDN)

### Passo 1: GitHub Actions Workflow

```yaml
# .github/workflows/update-data.yml
name: Update Data and Deploy

on:
  schedule:
    - cron: '*/10 * * * *'  # A cada 10 minutos
  workflow_dispatch:

jobs:
  update-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        
    - name: Run data collection
      run: |
        cd backend/src
        python worker.py
        
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### Passo 2: Secrets no GitHub
```bash
# Adicionar secrets no repositório GitHub
VERCEL_TOKEN=seu_vercel_token
ORG_ID=seu_org_id
PROJECT_ID=seu_project_id
```

---

## 🐳 Opção 3: Docker Container

### Passo 1: Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/

CMD ["python", "src/worker.py"]
```

### Passo 2: Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  worker:
    build: ./backend
    restart: always
    volumes:
      - ./frontend:/app/frontend
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
```

---

## 🔧 Monitoramento e Manutenção

### Health Check
```bash
# Script de monitoramento
nano /home/sphumor/health-check.sh
```

```bash
#!/bin/bash

# Verificar se worker está rodando
if ! systemctl is-active --quiet sphumor-worker; then
    echo "Worker não está rodando!"
    systemctl restart sphumor-worker
fi

# Verificar se data.json foi atualizado (últimos 15min)
if [ $(find /home/sphumor/SpHumor/frontend/data.json -mmin -15) ]; then
    echo "Data.json atualizado recentemente"
else
    echo "ALERTA: Data.json não atualizado!"
    # Enviar notificação
    curl -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" \
      -d chat_id=$CHAT_ID \
      -d text="ALERTA: SP❤HUMOR - Worker não atualizando!"
fi
```

### Logs e Debugging
```bash
# Ver logs do worker
sudo journalctl -u sphumor-worker -f

# Logs em arquivo
tail -f /var/log/sphumor/worker.log

# Monitorar sistema
htop
df -h
free -h
```

### Performance Monitoring
```bash
# Instalar monitoramento básico
sudo apt install htop iotop nethogs

# Configurar alertas por email
sudo apt install mailutils
```

---

## 📊 Escalabilidade

### Load Balancer (se necessário)
```nginx
# nginx.conf
upstream sphumor_backend {
    server 127.0.0.1:5000;
    # Adicionar mais servers se necessário
}

server {
    listen 80;
    server_name www.sphumor.com;
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://sphumor_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Cache Strategy
```javascript
// No frontend - Cache inteligente
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function getData() {
    const cached = localStorage.getItem('sphumor_data');
    const timestamp = localStorage.getItem('sphumor_timestamp');
    
    if (cached && timestamp && (Date.now() - parseInt(timestamp)) < CACHE_DURATION) {
        return JSON.parse(cached);
    }
    
    const response = await fetch('/data.json');
    const data = await response.json();
    
    localStorage.setItem('sphumor_data', JSON.stringify(data));
    localStorage.setItem('sphumor_timestamp', Date.now().toString());
    
    return data;
}
```

---

## 🔐 Segurança

### Hardening do Servidor
```bash
# Firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# SSH hardening
sudo nano /etc/ssh/sshd_config
# Descomente e altere:
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes
```

### API Keys e Secrets
```bash
# Usar environment variables
export OPENWEATHER_API_KEY="sua_key"
export TELEGRAM_BOT_TOKEN="seu_token"

# No Python
import os
api_key = os.getenv('OPENWEATHER_API_KEY')
```

---

## 💰 Custos Estimados

### Opção 1: Híbrido (VPS + CDN)
- VPS DigitalOcean: $5/mês
- Vercel Pro: $20/mês (opcional)
- Domínio: $15/ano
- **Total: ~$85/ano**

### Opção 2: Serverless
- GitHub Actions: $0 (grátis)
- Vercel Pro: $20/mês (opcional)
- Domínio: $15/ano
- **Total: ~$35/ano**

### Opção 3: Enterprise
- 2x VPS: $10/mês
- Load Balancer: $10/mês
- Monitoring: $5/mês
- Domínio: $15/ano
- **Total: ~$180/ano**

---

## 🚨 Backup e Recovery

### Backup Automático
```bash
# Script de backup
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/sphumor/backups"

# Criar backup
tar -czf $BACKUP_DIR/sp_humor_$DATE.tar.gz \
  /home/sphumor/SpHumor/ \
  /etc/systemd/system/sphumor-worker.service

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Upload para cloud (opcional)
aws s3 cp $BACKUP_DIR/sp_humor_$DATE.tar.gz s3://backups/
```

### Recovery Plan
```bash
# Em caso de falha:
1. Restaurar backup mais recente
2. Reiniciar services: sudo systemctl restart sphumor-worker
3. Verificar logs: sudo journalctl -u sphumor-worker
4. Testar acesso: curl http://www.sphumor.com
```

---

## 📈 Analytics e Monitoramento

### Google Analytics
```html
<!-- Adicionar ao index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

### Performance Monitoring
```javascript
// Performance metrics
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Performance:', entry.name, entry.duration);
  }
});
observer.observe({entryTypes: ['measure', 'navigation']});
```

---

## 🎯 Checklist Final de Deploy

### Pré-Deploy
- [ ] Testar worker em ambiente local
- [ ] Verificar todas as APIs funcionando
- [ ] Configurar environment variables
- [ ] Testar frontend com dados mock

### Deploy
- [ ] Provisionar servidor
- [ ] Configurar domínio DNS
- [ ] Instalar SSL certificate
- [ ] Deploy worker service
- [ ] Configurar CDN
- [ ] Testar sincronização

### Pós-Deploy
- [ ] Configurar monitoramento
- [ ] Setup backup automático
- [ ] Testar recovery
- [ ] Configurar alertas
- [ ] Documentar processo

---

## 🆘 Suporte e Troubleshooting

### Problemas Comuns

#### Worker não atualiza
```bash
# Verificar service
sudo systemctl status sphumor-worker

# Verificar logs
sudo journalctl -u sphumor-worker -n 50

# Reiniciar
sudo systemctl restart sphumor-worker
```

#### CDN não atualiza
```bash
# Limpar cache manualmente
vercel --prod --force

# Verificar sincronização
ls -la frontend/data.json
```

#### Domínio não resolve
```bash
# Verificar DNS
dig www.sphumor.com
nslookup www.sphumor.com

# Verificar propagação (pode levar até 48h)
```

### Contato de Suporte
- **Documentação**: README.md do projeto
- **Issues**: GitHub Issues
- **Email**: [seu-email]
- **Monitoramento**: Dashboard de alertas

---

## 📋 Resumo do Deploy

1. **Provisionar VPS** para o worker
2. **Configurar domínio** www.sphumor.com
3. **Deploy worker** como systemd service
4. **Configurar CDN** (Vercel/Netlify)
5. **Setup sincronização** automática
6. **Configurar monitoramento** e backups
7. **Testar tudo** e ir ao ar!

Com essa configuração, o SP❤HUMOR ficará online 24/7 com atualizações automáticas a cada 10 minutos e performance otimizada via CDN.

---

**© 2026 - SP❤HUMOR - Guia de Deploy em Produção**
