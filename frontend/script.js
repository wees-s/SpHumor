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
        this.initParallaxBackground();
    }

    initParallaxBackground() {
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;
            const moveX = mouseX * 20;
            const moveY = mouseY * 20;
            const body = document.body;
            body.style.setProperty('--bg-x', `${moveX}px`);
            body.style.setProperty('--bg-y', `${moveY}px`);
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

    // --- Sistema de pesos ---

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
        // Renderizar valores iniciais
        this.updateWeightUI();

        // Event listeners nos botões
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

        // Atualizar valores de cada métrica
        Object.keys(this.weights).forEach(metric => {
            const el = document.getElementById(`weight-${metric}`);
            if (el) el.textContent = this.weights[metric];
        });

        // Atualizar pontos restantes
        const remainingEl = document.getElementById('remainingPoints');
        if (remainingEl) {
            remainingEl.textContent = remaining;
            if (remaining === 0) {
                remainingEl.style.color = '#ff4d6d';
            } else {
                remainingEl.style.color = '#00e5ff';
            }
        }

        // Atualizar barra de progresso
        const barFill = document.getElementById('weightsBarFill');
        if (barFill) {
            barFill.style.width = `${(total / this.maxPoints) * 100}%`;
        }

        // Desabilitar botões + quando sem pontos
        document.querySelectorAll('.weight-btn.plus').forEach(btn => {
            btn.disabled = remaining <= 0;
        });

        // Desabilitar botões - quando em 0
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

    // --- Fetch de dados ---

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
            last_update: now.toLocaleTimeString('pt-BR')
        };
    }

    // --- UI Updates ---

    updateUI() {
        this.updateStressMeter(this.currentData.stress);

        document.getElementById('transitValue').textContent = `${this.currentData.transit} KM`;
        document.getElementById('rainValue').textContent = `${this.currentData.rain.toFixed(1)} %`;
        document.getElementById('temperatureValue').textContent = `${this.currentData.temperature.toFixed(1)} °C`;

        this.updateTransitDescription(this.currentData.transit);
        this.updateTemperatureDescription(this.currentData.temperature);

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

        if (temperature >= 30) {
            description.textContent = 'Clima quente';
            description.style.color = '#ff6b6b';
        } else if (temperature >= 22) {
            description.textContent = 'Clima agradável';
            description.style.color = '#4ecdc4';
        } else if (temperature >= 15) {
            description.textContent = 'Clima ameno';
            description.style.color = '#4ecdc4';
        } else {
            description.textContent = 'Clima frio';
            description.style.color = '#00bfff';
        }
    }

    updateStressMeter(stress) {
        const needle = document.getElementById('stressNeedle');
        const percentage = document.getElementById('stressPercentage');
        const emojis = document.querySelectorAll('.emoji');

        percentage.textContent = `${stress}%`;

        const rotation = -90 + (stress * 1.8);
        needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;

        emojis.forEach((emoji, index) => {
            const level = index + 1;
            const threshold = level * 20;
            emoji.classList.toggle('active', stress >= threshold);
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

            if (hour >= 7 && hour <= 9 && !(this.currentData.day === 'Sábado' || this.currentData.day === 'Domingo')) {
                peakStatus.textContent = 'Horário de pico: se for possível, evite sair nesse horário';
                peakStatus.style.color = '#ff6b6b';
            } else if (hour >= 17 && hour <= 19 && !(this.currentData.day === 'Sábado' || this.currentData.day === 'Domingo')) {
                peakStatus.textContent = 'Horário de pico: se for possível, evite sair nesse horário';
                peakStatus.style.color = '#ff6b6b';
            } else if ((hour >= 6 && hour < 7) || (hour > 9 && hour <= 10) || (hour >= 16 && hour < 17) || (hour > 19 && hour <= 20) && !(this.currentData.day === 'Sábado' || this.currentData.day === 'Domingo')) {
                peakStatus.textContent = 'Próximo ao horário de pico';
                peakStatus.style.color = '#ffa500';
            } else {
                if (this.currentData.day === 'Sábado' || this.currentData.day === 'Domingo') {
                    peakStatus.textContent = 'Fim de semana: relaxe e aproveite!';
                    peakStatus.style.color = '#4ecdc4';
                } else {
                    peakStatus.textContent = 'Fora do horário de pico';
                    peakStatus.style.color = '#4ecdc4';
                }
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    startAutoUpdate() {
        // Verifica data.json a cada 5 minutos
        setInterval(async () => {
            await this.fetchData();
            this.updateUI();
        }, 5 * 60 * 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StressDashboard();
});
