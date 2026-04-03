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
import metro.metro as metro

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
    # Âncoras: (temperatura°C, stress%)
    # Zona de conforto ~20–24°C → stress 0
    # Frio ou calor extremo → stress 100
    anchors = [
        (-10, 100),
        (  0, 100),
        (  5,  90),
        ( 10,  75),
        ( 15,  50),
        ( 18,  25),
        ( 20,  10),
        ( 22,   0),  # conforto ideal começa
        ( 24,   0),  # conforto ideal termina
        ( 26,  20),
        ( 28,  50),
        ( 30,  75),
        ( 33,  90),
        ( 36, 100),
        ( 40, 100),
    ]

    # Abaixo ou acima dos extremos definidos
    if temperature <= anchors[0][0]:
        return 100.0
    if temperature >= anchors[-1][0]:
        return 100.0

    # Interpolação linear entre as âncoras
    for i in range(len(anchors) - 1):
        t0, s0 = anchors[i]
        t1, s1 = anchors[i + 1]
        if t0 <= temperature < t1:
            ratio = (temperature - t0) / (t1 - t0)
            return round(s0 + ratio * (s1 - s0), 1)

    return 0.0


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
    hour = int(hour_str.split(':')[0])
    minute = int(hour_str.split(':')[1]) if ':' in hour_str else 0
    time_decimal = hour + minute / 60  # ex: 7:30 → 7.5

    # Âncoras: (hora, stress%)
    # Fim de semana tem picos menores e deslocados
    if day in ('Sábado', 'Domingo'):
        anchors = [
            (0,  0), (9,  0), (11, 30), (13, 50),
            (15, 40), (18, 30), (20, 20), (23, 10), (24, 0)
        ]
    else:
        anchors = [
            (0,   0),
            (5,   5),
            (7,  70),   # pico manhã começa
            (8,  100),  # pico máximo manhã
            (9,  80),
            (10, 50),
            (11, 40),
            (12, 45),   # almoço
            (13, 35),
            (14, 25),
            (15, 30),
            (16, 60),   # pico tarde começa
            (17, 90),
            (18, 100),  # pico máximo tarde
            (19, 75),
            (20, 45),
            (21, 25),
            (22, 10),
            (23,  5),
            (24,  0),
        ]

    # Interpolação linear entre as âncoras
    for i in range(len(anchors) - 1):
        t0, s0 = anchors[i]
        t1, s1 = anchors[i + 1]
        if t0 <= time_decimal < t1:
            ratio = (time_decimal - t0) / (t1 - t0)
            return round(s0 + ratio * (s1 - s0), 1)

    return 0


def collect_and_save():
    """Coleta dados de todas as fontes e salva no arquivo JSON."""
    try:
        # Coleta dados brutos
        climate_data = climate.get_all()
        transit_km = transit.get_transit()
        day = actualdatetime.get_day()
        hour = actualdatetime.get_hour()
        metro_lines = metro.get_metro_lines()

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
            # Status das linhas metroferroviárias
            'metro_lines': metro_lines,
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
