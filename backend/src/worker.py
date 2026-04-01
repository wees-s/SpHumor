"""
Worker standalone - Coleta dados das APIs externas e grava em frontend/data.json.
Roda independentemente do frontend, atualizando a cada 10 minutos.

Uso: python worker.py
"""

import json
import os
import time
from datetime import datetime

import climate.climate as climate
import actualdatetime.actualdatetime as actualdatetime
import transit.transit as transit

# Caminho do arquivo JSON compartilhado com o frontend
DATA_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'frontend', 'data.json'
)

UPDATE_INTERVAL = 600  # 10 minutos em segundos


def calc_transit_stress(transit_km):
    max_transit = 800
    result = (transit_km / max_transit) * 100
    return round(min(result, 100), 2)


def calc_rain_stress(rain_probability):
    return round(rain_probability, 2)


def calc_temperature_stress(temperature):
    if temperature >= 20 and temperature <= 25:
        return 0
    elif temperature > 25 and temperature < 29:
        return 65
    elif temperature < 20 and temperature > 18:
        return 60
    else:
        return 100


def calc_days_week_stress(day):
    stress_map = {
        'Segunda-feira': 100,
        'Terça-feira': 80,
        'Quarta-feira': 60,
        'Quinta-feira': 30,
        'Sexta-feira': 10,
        'Sábado': 5,
        'Domingo': 0,
    }
    return stress_map.get(day, 0)


def calc_peak_hours_stress(hour_str, day):
    # Fim de semana não tem horário de pico
    if day in ('Sábado', 'Domingo'):
        return 0

    hour = int(hour_str.split(':')[0])
    if 7 <= hour <= 9:
        return 100
    elif 17 <= hour <= 19:
        return 100
    elif 10 <= hour <= 11:
        return 60
    elif 12 <= hour <= 13:
        return 40
    elif 14 <= hour <= 16:
        return 30
    elif 20 <= hour <= 21:
        return 50
    else:
        return 0


def collect_and_save():
    """Coleta dados de todas as fontes e salva no arquivo JSON."""
    try:
        # Coleta dados brutos
        climate_data = climate.get_all()
        transit_km = transit.get_transit()
        day = actualdatetime.get_day()
        hour = actualdatetime.get_hour()

        # Calcula stress individual de cada métrica
        transit_stress = calc_transit_stress(transit_km)
        rain_stress = calc_rain_stress(climate_data['rain'])
        temperature_stress = calc_temperature_stress(climate_data['temperature'])
        days_week_stress = calc_days_week_stress(day)
        peak_hours_stress = calc_peak_hours_stress(hour, day)

        now = datetime.now()
        last_update = now.strftime('%H:%M:%S')

        data = {
            # Dados brutos
            'transit': transit_km,
            'rain': round(climate_data['rain'], 2),
            'temperature': round(climate_data['temperature'], 2),
            'day': day,
            'time': hour,
            # Stress individual (0-100 cada)
            'transit_stress': transit_stress,
            'rain_stress': rain_stress,
            'peak_hours_stress': peak_hours_stress,
            'days_week_stress': days_week_stress,
            'temperature_stress': temperature_stress,
            # Metadados
            'last_update': last_update,
        }

        # Grava no arquivo JSON (atômico com escrita temporária)
        tmp_file = DATA_FILE + '.tmp'
        with open(tmp_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_file, DATA_FILE)

        print(f"[{last_update}] Dados atualizados com sucesso!")
        print(f"  Trânsito: {transit_km}km | Chuva: {data['rain']}% | Temp: {data['temperature']}°C")
        print(f"  Stress - Trânsito: {transit_stress}% | Chuva: {rain_stress}% | "
              f"Pico: {peak_hours_stress}% | Dia: {days_week_stress}% | Temp: {temperature_stress}%")

    except Exception as e:
        print(f"[ERRO] Falha ao atualizar dados: {e}")


def main():
    print("=" * 60)
    print("SP HUMOR - Worker de coleta de dados")
    print(f"Arquivo de saída: {DATA_FILE}")
    print(f"Intervalo de atualização: {UPDATE_INTERVAL}s ({UPDATE_INTERVAL // 60} min)")
    print("=" * 60)

    # Atualiza imediatamente ao iniciar
    collect_and_save()

    # Loop de atualização
    while True:
        time.sleep(UPDATE_INTERVAL)
        collect_and_save()


if __name__ == '__main__':
    main()
