import threading
import time
from datetime import datetime as dt
from time import sleep
import climate.climate as climate
import actualdatetime.actualdatetime as actualdatetime
import transit.transit as transit

#global variable to store transit data
actual_transit = 0

class DataCache:
    def __init__(self):
        self.cache = {
            'stress': 0,
            'transit': 0,
            'rain': 0,
            'temperature': 0,
            'day': '',
            'time': '',
            'transit_stress': 0,
            'rain_stress': 0,
            'peak_hours_stress': 0,
            'days_week_stress': 0,
            'temperature_stress': 0,
            'last_update': None
        }
        self.lock = threading.Lock()
        self.running = True
        self.update_thread = threading.Thread(target=self.update_loop, daemon=True)
        self.update_thread.start()

    def calc_transit(self):
        actual_transit = transit.get_transit()
        max_transit = 800
        result = (actual_transit / max_transit) * 100
        return round(result, 2)

    def calc_rain(self):
        actual_rain = climate.get_rain()
        result = actual_rain
        return round(result, 2)

    def days_of_week(self):
        actual_day = actualdatetime.get_day()
        result = 0
        if actual_day == 'Segunda-feira':
            result = 100
        elif actual_day == 'Terça-feira':
            result = 80
        elif actual_day == 'Quarta-feira':
            result = 60
        elif actual_day == 'Quinta-feira':
            result = 30
        elif actual_day == 'Sexta-feira':
            result = 10
        elif actual_day == 'Sábado':
            result = 5
        elif actual_day == 'Domingo':
            result = 0
        return result

    def calc_temperature(self):
        actual_temperature = climate.get_temperature()
        if actual_temperature > 25 and actual_temperature < 29:
            result = 65
        elif actual_temperature < 20 and actual_temperature > 18:
            result = 60
        elif actual_temperature >= 20 and actual_temperature <= 25:
            result = 0
        else:
            result = 100
        return result

    def peak_hours(self):
        actual_time = actualdatetime.get_hour()
        hour = int(actual_time.split(':')[0])
        result = 0
        if hour >= 7 and hour <= 9:
            result = 100
        elif hour >= 17 and hour <= 19:
            result = 100
        elif hour >= 10 and hour <= 11:
            result = 60
        elif hour >= 12 and hour <= 13:
            result = 40
        elif hour >= 14 and hour <= 16:
            result = 30
        elif hour >= 20 and hour <= 21:
            result = 50
        else:
            result = 0
        return result

    def calc_stress(self):
        transit_stress = self.calc_transit()
        rain_stress = self.calc_rain()
        peak_hours_stress = self.peak_hours()
        days_week_stress = self.days_of_week()
        temperature_stress = self.calc_temperature()
        
        # Stress calc with weights
        # transit: 30%, rain: 20%, peak hours: 30%, day of week: 10%, temperature: 10%
        if (days_week_stress <= 5):
            peak_hours_stress = 0;
        
        result = (transit_stress * 0.3) + (rain_stress * 0.2) + (peak_hours_stress * 0.3) + (days_week_stress * 0.1) + (temperature_stress * 0.1)
        
        return round(result, 2)

    sleep(1)
    
    def update_data(self):
        try:
            with self.lock:
                # Obter dados brutos primeiro
                new_transit = transit.get_transit()
                new_rain = climate.get_rain()
                new_temperature = climate.get_temperature()
                new_day = actualdatetime.get_day()
                new_time = actualdatetime.get_hour()
                
                # Atualizar cache com novos dados
                self.cache['transit'] = new_transit
                self.cache['rain'] = new_rain
                self.cache['temperature'] = new_temperature
                self.cache['day'] = new_day
                self.cache['time'] = new_time
                
                # Recalcular stress com novos dados
                self.cache['transit_stress'] = self.calc_transit()
                self.cache['rain_stress'] = self.calc_rain()
                self.cache['peak_hours_stress'] = self.peak_hours()
                self.cache['days_week_stress'] = self.days_of_week()
                self.cache['temperature_stress'] = self.calc_temperature()
                self.cache['stress'] = self.calc_stress()
                self.cache['last_update'] = dt.now().strftime('%H:%M:%S')
                
                print(f"[{self.cache['last_update']}] Dados atualizados com sucesso!")
                print(f"Stress: {self.cache['stress']}%, Trânsito: {self.cache['transit']}km, Chuva: {self.cache['rain']}%, Temp: {self.cache['temperature']}°C")
                
        except Exception as e:
            print(f"Erro ao atualizar dados: {e}")
            # Em caso de erro, apenas atualizar o timestamp para indicar tentativa
            with self.lock:
                self.cache['last_update'] = dt.now().strftime('%H:%M:%S')
                print(f"[{self.cache['last_update']}] Falha na atualização, mantendo dados anteriores")

    def update_loop(self):
        # Atualizar imediatamente ao iniciar
        self.update_data()
        
        while self.running:
            # Esperar 10 minutos (600 segundos)
            time.sleep(600)
            if self.running:
                self.update_data()

    def get_data(self):
        with self.lock:
            return self.cache.copy()

    def stop(self):
        self.running = False
        if self.update_thread.is_alive():
            self.update_thread.join(timeout=5)

# Instância global do cache
data_cache = DataCache()
