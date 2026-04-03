class StressDashboard {
    constructor() {
        this.currentData = {
            stress: 0,
            transit: 0,
            rain: 0,
            temperature: 0,
            day: '',
            time: '',
            transit_stress: 0,
            rain_stress: 0,
            peak_hours_stress: 0,
            days_week_stress: 0,
            temperature_stress: 0,
            last_update: null
        };

        // Pesos do usuário (5 categorias, total máximo de 10)
        this.weights = {
            transit: 0,
            rain: 0,
            pico: 0,
            diasemana: 0,
            clima: 0
        };

        this.maxPoints = 10;
        this.init();
        this.initTheme();
        this.initCanvas();
        this.initParallaxBackground();
    }

    // ─── TEMA CLARO / ESCURO ──────────────────────────

    initTheme() {
        const saved = localStorage.getItem('sphumor_theme');
        if (saved === 'light') {
            document.body.classList.add('light-theme');
        }
        this.updateToggleLabel();

        document.getElementById('themeToggle').addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('sphumor_theme', isLight ? 'light' : 'dark');
            this.updateToggleLabel();
        });
    }

    updateToggleLabel() {
        const btn = document.getElementById('themeToggle');
        const isLight = document.body.classList.contains('light-theme');
        btn.querySelector('.theme-icon').textContent = isLight ? '🌙' : '☀';
        btn.querySelector('.theme-label').textContent = isLight ? 'ESCURO' : 'CLARO';
    }

    // ─── BACKGROUND DINÂMICO (canvas de partículas) ───

    initCanvas() {
        const canvas = document.getElementById('bgCanvas');
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Criar partículas
        const count = 65;
        const particles = Array.from({ length: count }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            r: Math.random() * 1.8 + 0.6,
            pulse: Math.random() * Math.PI * 2  // fase de pulsação individual
        }));

        let frame = 0;

        const animate = () => {
            frame++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const isLight = document.body.classList.contains('light-theme');

            // Cores adaptadas ao tema
            const dotAlpha  = isLight ? 0.30 : 0.45;
            const lineBase  = isLight ? '232, 74, 28' : '232, 74, 28';
            const lineAlphaFactor = isLight ? 0.10 : 0.18;

            particles.forEach(p => {
                // Movimento
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += 0.02;

                // Wrap
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Pulsação suave no raio
                const r = p.r * (1 + 0.3 * Math.sin(p.pulse));

                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${lineBase}, ${dotAlpha})`;
                ctx.fill();
            });

            // Linhas entre partículas próximas
            const maxDist = 130;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * lineAlphaFactor;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(${lineBase}, ${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    // ─── PARALLAX BACKGROUND (apenas tema escuro) ─────

    initParallaxBackground() {
        document.addEventListener('mousemove', (e) => {
            if (document.body.classList.contains('light-theme')) return;
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;
            document.body.style.setProperty('--bg-x', `${mouseX * 20}px`);
            document.body.style.setProperty('--bg-y', `${mouseY * 20}px`);
        });
    }

    showTerms() {
        event.preventDefault();
        window.location.href = 'terms.html';
    }

    showPrivacy() {
        event.preventDefault();
        window.location.href = 'privacy.html';
    }

    async init() {
        this.loadWeights();
        this.initWeightControls();
        await this.fetchData();
        this.updateUI();
        this.startClock();
        this.startAutoUpdate();
    }

    // ─── SISTEMA DE PESOS ─────────────────────────────

    loadWeights() {
        const saved = localStorage.getItem('sphumor_weights');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const expectedKeys = Object.keys(this.weights);
                const hasAllKeys = expectedKeys.every(k => k in parsed);
                const total = expectedKeys.reduce((sum, k) => sum + (parsed[k] || 0), 0);
                if (hasAllKeys && total <= this.maxPoints) {
                    this.weights = parsed;
                } else {
                    localStorage.removeItem('sphumor_weights');
                }
            } catch (e) {
                localStorage.removeItem('sphumor_weights');
            }
        }
    }

    saveWeights() {
        localStorage.setItem('sphumor_weights', JSON.stringify(this.weights));
    }

    getTotalWeight() {
        return Object.values(this.weights).reduce((a, b) => a + b, 0);
    }

    getRemainingPoints() {
        return this.maxPoints - this.getTotalWeight();
    }

    initWeightControls() {
        this.updateWeightUI();

        document.querySelectorAll('.weight-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const metric = e.target.dataset.metric;
                const action = e.target.dataset.action;

                if (action === 'plus' && this.getRemainingPoints() > 0 && this.weights[metric] < 10) {
                    this.weights[metric]++;
                } else if (action === 'minus' && this.weights[metric] > 0) {
                    this.weights[metric]--;
                }

                this.saveWeights();
                this.updateWeightUI();
                this.recalculateStress();
                this.updateStressMeter(this.currentData.stress);
            });
        });
    }

    updateWeightUI() {
        const remaining = this.getRemainingPoints();
        const total = this.getTotalWeight();

        Object.keys(this.weights).forEach(metric => {
            const el = document.getElementById(`weight-${metric}`);
            if (el) el.textContent = this.weights[metric];
        });

        const remainingEl = document.getElementById('remainingPoints');
        if (remainingEl) {
            remainingEl.textContent = remaining;
            remainingEl.style.color = remaining === 0 ? '#ff4d6d' : '#E84A1C';
        }

        const barFill = document.getElementById('weightsBarFill');
        if (barFill) {
            barFill.style.width = `${(total / this.maxPoints) * 100}%`;
        }

        document.querySelectorAll('.weight-btn.plus').forEach(btn => {
            btn.disabled = remaining <= 0;
        });

        Object.keys(this.weights).forEach(metric => {
            const minusBtn = document.querySelector(`.weight-btn.minus[data-metric="${metric}"]`);
            if (minusBtn) minusBtn.disabled = this.weights[metric] <= 0;
        });
    }

    recalculateStress() {
        const total = this.getTotalWeight();
        if (total === 0) {
            this.currentData.stress = 0;
            return;
        }

        const weightedSum =
            (this.currentData.transit_stress * this.weights.transit) +
            (this.currentData.rain_stress * this.weights.rain) +
            (this.currentData.peak_hours_stress * this.weights.pico) +
            (this.currentData.days_week_stress * this.weights.diasemana) +
            (this.currentData.temperature_stress * this.weights.clima);

        this.currentData.stress = Math.round(Math.min(weightedSum / total, 100));
    }

    // ─── FETCH DE DADOS ───────────────────────────────

    async fetchData() {
        try {
            const response = await fetch('data.json');
            if (response.ok) {
                const data = await response.json();
                this.currentData = { ...this.currentData, ...data };
                this.recalculateStress();
            } else {
                throw new Error('data.json não encontrado');
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            this.currentData = this.generateMockData();
            this.recalculateStress();
        }
    }

    generateMockData() {
        const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const now = new Date();
        const dayName = days[now.getDay()];
        const hour = now.getHours();

        let transit_stress = Math.round(Math.random() * 100);
        let rain_stress = Math.round(Math.random() * 100);
        let peak_hours_stress = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 100 : 30;
        let days_week_stress = dayName === 'Segunda-feira' ? 100 : 30;
        let temperature_stress = Math.round(Math.random() * 100);

        return {
            stress: 0,
            transit: Math.round(Math.random() * 800),
            rain: Math.round(Math.random() * 100),
            temperature: 20 + Math.random() * 10,
            day: dayName,
            time: `${hour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
            transit_stress,
            rain_stress,
            peak_hours_stress,
            days_week_stress,
            temperature_stress,
            last_update: now.toLocaleTimeString('pt-BR'),
            metro_lines: []
        };
    }

    // ─── UI UPDATES ───────────────────────────────────

    // Cores oficiais por código de linha
    getLineColor(codigo) {
        const colors = {
            '1': '#0055A5', '2': '#007A5E', '3': '#EE3124',
            '4': '#FFD400', '5': '#9B2990', '7': '#B01A1A',
            '8': '#97A0A9', '9': '#01A9A4', '10': '#007A5E',
            '11': '#F15A22', '12': '#0F4C9A', '13': '#00ADEF',
            '15': '#6E267B',
        };
        return colors[codigo] || '#555';
    }

    getStatusClass(linha) {
        if (linha.operacao_normal) return 'normal';
        const sit = (linha.situacao || '').toLowerCase();
        if (sit.includes('encerr') || sit.includes('interrup') || sit.includes('paralis')) return 'critico';
        return 'alerta';
    }

    renderMetroLines(lines) {
        const grid = document.getElementById('metroGrid');
        if (!grid) return;

        if (!lines || lines.length === 0) {
            grid.innerHTML = '<div class="metro-loading">Dados das linhas indisponíveis.</div>';
            return;
        }

        grid.innerHTML = lines.map(l => {
            const color = this.getLineColor(l.codigo);
            const statusClass = this.getStatusClass(l);
            const statusText = l.situacao || 'Sem informação';
            return `
            <div class="metro-card">
                <div class="metro-badge" style="background:${color}">${l.codigo}</div>
                <div class="metro-info">
                    <div class="metro-name">${l.nome}</div>
                    <div class="metro-status ${statusClass}">${statusText}</div>
                </div>
                <div class="metro-status-dot ${statusClass}"></div>
            </div>`;
        }).join('');
    }

    updateUI() {
        this.updateStressMeter(this.currentData.stress);

        document.getElementById('transitValue').textContent = `${this.currentData.transit} KM`;
        document.getElementById('rainValue').textContent = `${this.currentData.rain.toFixed(1)} %`;
        document.getElementById('temperatureValue').textContent = `${this.currentData.temperature.toFixed(1)} °C`;

        this.updateTransitDescription(this.currentData.transit);
        this.updateTemperatureDescription(this.currentData.temperature);
        this.renderMetroLines(this.currentData.metro_lines || []);

        if (this.currentData.last_update) {
            document.getElementById('lastUpdate').textContent = `Última atualização: ${this.currentData.last_update}`;
        }

        this.updateMessage();
    }

    updateTransitDescription(transit) {
        const description = document.getElementById('transitDescription');

        if (transit === 0) {
            description.textContent = 'Aguardando dados de trânsito. Espere a próxima atualização do site. (atualizações são feitas a cada 10 minutos)';
            description.style.color = '#ff6b6b';
            description.classList.add('long-message');
        } else if (transit >= 800) {
            description.textContent = 'Trânsito caótico, aguarde um tempo antes de sair!';
            description.style.color = '#ff6b6b';
            description.classList.remove('long-message');
        } else if (transit >= 500) {
            description.textContent = 'Trânsito intenso pela cidade';
            description.style.color = '#ffa500';
            description.classList.remove('long-message');
        } else if (transit >= 300) {
            description.textContent = 'Trânsito moderado';
            description.style.color = '#ffd700';
            description.classList.remove('long-message');
        } else {
            description.textContent = 'Pouco trânsito';
            description.style.color = '#4ecdc4';
            description.classList.remove('long-message');
        }
    }

    updateTemperatureDescription(temperature) {
        const description = document.getElementById('temperatureDescription');

        // Âncoras: [temp, label, [r, g, b]]
        const anchors = [
            [ -10, 'Frio extremo',    [100, 180, 255]],
            [   5, 'Muito frio',      [100, 180, 255]],
            [  10, 'Frio',            [100, 200, 230]],
            [  15, 'Clima frio',      [100, 210, 210]],
            [  18, 'Clima ameno',     [ 78, 205, 196]],
            [  22, 'Clima agradável', [ 78, 205, 196]],
            [  26, 'Clima quente',    [255, 180,  80]],
            [  30, 'Muito quente',    [255, 120,  60]],
            [  35, 'Calor extremo',   [255,  60,  60]],
            [  40, 'Calor extremo',   [255,  60,  60]],
        ];

        // Clamp nos extremos
        if (temperature <= anchors[0][0]) {
            description.textContent = anchors[0][1];
            description.style.color = `rgb(${anchors[0][2].join(',')})`;
            return;
        }
        if (temperature >= anchors.at(-1)[0]) {
            description.textContent = anchors.at(-1)[1];
            description.style.color = `rgb(${anchors.at(-1)[2].join(',')})`;
            return;
        }

        // Encontra o par de âncoras e interpola
        for (let i = 0; i < anchors.length - 1; i++) {
            const [t0, label0, color0] = anchors[i];
            const [t1, label1, color1] = anchors[i + 1];

            if (temperature >= t0 && temperature < t1) {
                const ratio = (temperature - t0) / (t1 - t0);

                // Label: usa o da âncora inferior (muda só ao cruzar a âncora)
                description.textContent = label0;

                // Cor: interpolação RGB suave
                const r = Math.round(color0[0] + ratio * (color1[0] - color0[0]));
                const g = Math.round(color0[1] + ratio * (color1[1] - color0[1]));
                const b = Math.round(color0[2] + ratio * (color1[2] - color0[2]));
                description.style.color = `rgb(${r}, ${g}, ${b})`;
                return;
            }
        }
    }

    updateStressMeter(stress) {
        const needle = document.getElementById('stressNeedle');
        const percentage = document.getElementById('stressPercentage');
        const emojis = document.querySelectorAll('.emoji');

        percentage.textContent = `${stress}%`;

        const rotation = -90 + (stress * 1.8);
        needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;

        // Determina o nível atual (1–5) com base no stress
        // Nível 1 = 0–20%, nível 2 = 21–40%, etc.
        // Sempre pelo menos nível 1 ativo (sem bug de todos apagados)
        const currentLevel = Math.max(1, Math.ceil(stress / 20));

        emojis.forEach((emoji, index) => {
            const level = index + 1;           // 1 a 5
            const isActive = level <= currentLevel;   // acende todos até o atual
            const isCurrent = level === currentLevel; // o atual pulsa/destaca

            emoji.classList.toggle('active', isActive);
            emoji.classList.toggle('current', isCurrent);
        });
    }

    updateMessage() {
        const dayMessage = document.getElementById('dayMessage');
        const motivationalMessage = document.getElementById('motivationalMessage');

        const messages = {
            'Domingo': {
                title: 'DOMINGO',
                message: 'Dia de descansar! A cidade está mais tranquila e o stress está baixo. Aproveite para recarregar as energias!'
            },
            'Segunda-feira': {
                title: 'SEGUNDA-FEIRA',
                message: 'O início da semana traz desafios! A cidade está em movimento e o stress pode estar elevado. Boa sorte!'
            },
            'Terça-feira': {
                title: 'TERÇA-FEIRA',
                message: 'A semana está a todo vapor! Mantenha a calma e enfrente os desafios com determinação.'
            },
            'Quarta-feira': {
                title: 'QUARTA-FEIRA',
                message: 'Meio de semana chegando! A cidade continua agitada, mas o fim já está próximo.'
            },
            'Quinta-feira': {
                title: 'QUINTA-FEIRA',
                message: 'Quase lá! A ansiedade pelo fim de semana começa, mas ainda há desafios pela frente.'
            },
            'Sexta-feira': {
                title: 'SEXTA-FEIRA',
                message: 'Final de semana chegando! A cidade está animada e o stress diminui. Celebre!'
            },
            'Sábado': {
                title: 'SÁBADO',
                message: 'Dia de relaxar! A cidade está mais calma e o stress está controlado. Aproveite!'
            }
        };

        const dayData = messages[this.currentData.day] || messages['Domingo'];
        dayMessage.textContent = dayData.title;
        motivationalMessage.textContent = dayData.message;
    }

    startClock() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('pt-BR', { hour12: false });
            document.getElementById('currentTime').textContent = timeString;

            const hour = now.getHours();
            const peakStatus = document.getElementById('peakStatus');
            const isWeekend = this.currentData.day === 'Sábado' || this.currentData.day === 'Domingo';

            if (!isWeekend && ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19))) {
                peakStatus.textContent = 'Horário de pico: se for possível, evite sair nesse horário';
                peakStatus.style.color = '#ff6b6b';
            } else if (!isWeekend && ((hour >= 6 && hour < 7) || (hour > 9 && hour <= 10) || (hour >= 16 && hour < 17) || (hour > 19 && hour <= 20))) {
                peakStatus.textContent = 'Próximo ao horário de pico';
                peakStatus.style.color = '#ffa500';
            } else {
                peakStatus.textContent = isWeekend ? 'Fim de semana: relaxe e aproveite!' : 'Fora do horário de pico';
                peakStatus.style.color = '#4ecdc4';
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    startAutoUpdate() {
        setInterval(async () => {
            await this.fetchData();
            this.updateUI();
        }, 5 * 60 * 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StressDashboard();
});
