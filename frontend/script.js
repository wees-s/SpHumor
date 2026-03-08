class StressDashboard {
    constructor() {
        this.currentData = {
            stress: 0,
            transit: 0,
            rain: 0,
            temperature: 0,
            day: '',
            time: '',
            last_update: null
        };
        this.init();
        this.initParallaxBackground();
    }

    initParallaxBackground() {
        // Animação de background parallax com mouse
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;
            
            // Calcula movimento oposto e suave
            const moveX = mouseX * 20; // Até 20px de movimento
            const moveY = mouseY * 20;
            
            // Aplica transformação ao pseudo-elemento ::before
            const body = document.body;
            body.style.setProperty('--bg-x', `${moveX}px`);
            body.style.setProperty('--bg-y', `${moveY}px`);
        });
    }

    // Funções para abrir Terms e Privacy Policy
    showTerms() {
        event.preventDefault();
        window.location.href = 'terms.html';
    }

    showPrivacy() {
        event.preventDefault();
        window.location.href = 'privacy.html';
    }

    async init() {
        await this.fetchData();
        this.updateUI();
        this.startClock();
        this.startAutoUpdate();
    }

    async fetchData() {
        try {
            // Buscar dados da API real
            const response = await fetch('/api/stress');
            if (response.ok) {
                const data = await response.json();
                this.currentData = data;
            } else {
                throw new Error('Falha ao buscar dados da API');
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            // Dados simulados para fallback
            this.currentData = this.generateMockData();
        }
    }

    generateMockData() {
        const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const now = new Date();
        const dayName = days[now.getDay()];
        const hour = now.getHours();
        
        // Lógica de stress baseada no horário e dia
        let stress = 0;
        if (dayName === 'Segunda-feira') stress += 30;
        else if (dayName === 'Terça-feira') stress += 25;
        else if (dayName === 'Quarta-feira') stress += 20;
        else if (dayName === 'Quinta-feira') stress += 15;
        else if (dayName === 'Sexta-feira') stress += 10;
        else if (dayName === 'Sábado') stress += 5;
        
        if (hour >= 7 && hour <= 9) stress += 40;
        else if (hour >= 17 && hour <= 19) stress += 40;
        else if (hour >= 10 && hour <= 11) stress += 20;
        else if (hour >= 12 && hour <= 13) stress += 15;
        else if (hour >= 14 && hour <= 16) stress += 10;
        else if (hour >= 20 && hour <= 21) stress += 15;
        
        stress = Math.min(stress + Math.random() * 20, 100);

        return {
            stress: Math.round(stress),
            transit: Math.round(Math.random() * 800),
            rain: Math.random() * 100, // Agora é porcentagem
            temperature: 20 + Math.random() * 10,
            day: dayName,
            time: `${hour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
            last_update: now.toLocaleTimeString('pt-BR')
        };
    }

    updateUI() {
        // Atualizar termômetro de stress
        this.updateStressMeter(this.currentData.stress);
        
        // Atualizar cards
        document.getElementById('transitValue').textContent = `${this.currentData.transit} KM`;
        document.getElementById('rainValue').textContent = `${this.currentData.rain.toFixed(1)} %`;
        document.getElementById('temperatureValue').textContent = `${this.currentData.temperature.toFixed(1)} °C`;
        
        // Atualizar descrições
        this.updateTransitDescription(this.currentData.transit);
        this.updateTemperatureDescription(this.currentData.temperature);
        
        // Atualizar última atualização no bloco de stress
        if (this.currentData.last_update) {
            document.getElementById('lastUpdate').textContent = `Última atualização: ${this.currentData.last_update}`;
        }
        
        // Atualizar mensagem
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
        
        // Atualizar texto
        percentage.textContent = `${stress}%`;
        
        // Calcular rotação da agulha (-90 a +90 graus)
        const rotation = -90 + (stress * 1.8);
        needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
        
        // Atualizar emojis
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
            
            // Atualizar status de horário de pico
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
                if (this.currentData.day === 'Sábado' || this.currentData.day === 'Domingo'){
                    peakStatus.textContent = 'Fim de semana: relaxe e aproveite!';
                    peakStatus.style.color = '#4ecdc4';
                } else {
                    peakStatus.textContent = 'Fora do horário de pico';
                    peakStatus.style.color = '#4ecdc4';
                }
            }
        };
        
        // Atualizar imediatamente
        updateTime();
        
        // Atualizar a cada segundo
        setInterval(updateTime, 1000);
    }

    startAutoUpdate() {
        // Atualizar a cada 5 minutos (para verificar se há novos dados)
        setInterval(async () => {
            await this.fetchData();
            this.updateUI();
        }, 5 * 60 * 1000);
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new StressDashboard();
});