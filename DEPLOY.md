# Deploy em Produção - SP❤HUMOR

Guia de deploy para **VM Google Cloud** + domínio **www.sphumor.com** (Hostgator).

## Arquitetura

```
┌──────────────────────────────────────────┐
│          Google Cloud VM                 │
│                                          │
│  ┌─────────────────┐  ┌───────────────┐  │
│  │  Worker (Python)│  │  Nginx        │  │
│  │  systemd service│  │  porta 80/443 │  │
│  │  coleta a cada  │  │  serve        │  │
│  │  10 minutos     │  │  frontend +   │  │
│  └────────┬────────┘  │  data.json    │  │
│           │           └───────┬───────┘  │
│           └──── data.json ────┘          │
└──────────────────────────────────────────┘
                    │
              IP externo da VM
                    │
           DNS Hostgator (registro A)
                    │
             www.sphumor.com
```

---

## Passo 1: Preparar a VM no Google Cloud

### 1.1 Verificar IP Externo Estático

No Google Cloud Console, certifique-se de que a VM tem um **IP externo estático** (não efêmero), senão o IP muda ao reiniciar.

```
GCP Console → VPC Network → IP addresses → Reserve Static Address
```

Anote o IP. Ele será usado na configuração do DNS.

### 1.2 Liberar Firewall no GCP

```
GCP Console → VPC Network → Firewall → Create Rule

Nome: allow-http-https
Targets: All instances in the network
Source IP ranges: 0.0.0.0/0
Protocols and ports: tcp:80, tcp:443
```

Ou via CLI do GCP:
```bash
gcloud compute firewall-rules create allow-http-https \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0
```

### 1.3 Conectar via SSH

```bash
# Via Google Cloud Console → VM instances → SSH
# Ou via gcloud CLI:
gcloud compute ssh NOME_DA_VM --zone=ZONA_DA_VM
```

---

## Passo 2: Configurar Ambiente na VM

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install python3 python3-pip python3-venv git nginx certbot python3-certbot-nginx -y

# Criar usuário dedicado
sudo adduser sphumor
sudo usermod -aG sudo sphumor
sudo su - sphumor
```

---

## Passo 3: Deploy do Projeto

```bash
# Como usuário sphumor
cd ~

# Clonar repositório
git clone https://github.com/wees-s/SpHumor.git
cd SpHumor

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências do backend
cd backend
pip install -r requirements.txt

# Testar worker manualmente
cd src
python worker.py
# Aguardar uma coleta e pressionar Ctrl+C para confirmar funcionamento
```

---

## Passo 4: Configurar Systemd Service

```bash
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
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar e iniciar
sudo systemctl daemon-reload
sudo systemctl enable sphumor-worker
sudo systemctl start sphumor-worker

# Verificar
sudo systemctl status sphumor-worker
```

---

## Passo 5: Configurar DNS no Hostgator

Acesse o painel do Hostgator → **cPanel** → **Zone Editor** (ou **DNS Zone Editor**).

Adicione/edite os registros:

| Tipo | Nome | Valor                  | TTL  |
|------|------|------------------------|------|
| A    | @    | IP_EXTERNO_DA_SUA_VM   | 3600 |
| A    | www  | IP_EXTERNO_DA_SUA_VM   | 3600 |

> Substitua `IP_EXTERNO_DA_SUA_VM` pelo IP estático reservado no Passo 1.1.
> A propagação DNS pode levar até 24h, mas costuma ser rápida (30min–2h).

Para verificar se já propagou:
```bash
# No seu computador local
nslookup www.sphumor.com
dig www.sphumor.com
```

---

## Passo 6: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/sphumor
```

```nginx
server {
    listen 80;
    server_name sphumor.com www.sphumor.com;

    root /home/sphumor/SpHumor/frontend;
    index index.html;

    # Cabeçalhos para data.json não ficar em cache no browser
    location /data.json {
        add_header Cache-Control "no-cache, must-revalidate";
        add_header Access-Control-Allow-Origin *;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Ativar site e desativar default
sudo ln -s /etc/nginx/sites-available/sphumor /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Iniciar nginx
sudo systemctl enable nginx
sudo systemctl restart nginx
```

---

## Passo 7: SSL com Let's Encrypt (HTTPS)

> Faça isso **após** o DNS já estar propagado apontando para a VM.

```bash
sudo certbot --nginx -d sphumor.com -d www.sphumor.com
```

Certbot vai:
1. Verificar que o domínio aponta para este servidor
2. Gerar o certificado
3. Atualizar automaticamente o nginx com HTTPS + redirect de HTTP

```bash
# Testar renovação automática
sudo certbot renew --dry-run

# O certbot instala timer systemd automático, verificar:
sudo systemctl status certbot.timer
```

---

## Passo 8: Verificar Tudo

```bash
# Worker rodando?
sudo systemctl status sphumor-worker

# Nginx rodando?
sudo systemctl status nginx

# data.json sendo atualizado?
ls -lh /home/sphumor/SpHumor/frontend/data.json

# Site acessível?
curl -I https://www.sphumor.com
```

Abra no browser: **https://www.sphumor.com**

---

## Manutenção

### Ver logs do worker
```bash
sudo journalctl -u sphumor-worker -f
```

### Reiniciar worker
```bash
sudo systemctl restart sphumor-worker
```

### Atualizar código
```bash
sudo su - sphumor
cd ~/SpHumor
git pull
sudo systemctl restart sphumor-worker
```

### Backup do data.json
```bash
# Adicionar ao crontab do usuário sphumor
crontab -e

# Backup diário às 2h
0 2 * * * mkdir -p ~/backups && cp ~/SpHumor/frontend/data.json ~/backups/data-$(date +\%Y\%m\%d).json

# Manter apenas os últimos 30 dias
5 2 * * * find ~/backups -name "data-*.json" -mtime +30 -delete
```

---

## Segurança Básica

```bash
# Firewall na VM (além do firewall do GCP)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Fail2ban contra força bruta SSH
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Desabilitar login root via SSH (opcional, se usar usuário dedicado)
sudo nano /etc/ssh/sshd_config
# Alterar: PermitRootLogin no
sudo systemctl restart sshd
```

---

## Checklist de Deploy

- [ ] IP estático reservado no GCP
- [ ] Firewall GCP liberado (80/443)
- [ ] Dependências instaladas na VM
- [ ] Repositório clonado e ambiente virtual criado
- [ ] Worker testado manualmente
- [ ] Systemd service configurado e ativo
- [ ] DNS no Hostgator apontando para o IP da VM
- [ ] Nginx configurado e ativo
- [ ] SSL instalado via Certbot
- [ ] Site acessível em https://www.sphumor.com
- [ ] data.json atualizando a cada 10 minutos

---

**© 2026 - SP❤HUMOR**
