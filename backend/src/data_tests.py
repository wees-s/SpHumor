import climate.climate as climate
import actualdatetime.actualdatetime as actualdatetime
import transit.transit as transit

print(f"Porcentagem de chuva em São Paulo: {round(climate.get_rain(), 2)} %")
print(f"Temperatura: {round(climate.get_temperature(), 1)} °C")
print(f"Precipitação: {climate.get_precipitation()}")
print(f"Apparente: {climate.get_apparent_temperature()}")
print(f"Data: {actualdatetime.get_date()}")
print(f"Dia da semana: {actualdatetime.get_day()}")
print(f"Horário: {actualdatetime.get_hour()}")
print(f"Transito: {transit.get_transit()} km")

def calc_transit():
    actual_transit = transit.get_transit()
    max_transit = 800;
    result = (actual_transit / max_transit) * 100
    print(f"Transito: {round(result, 2)} %")
    return round(result, 2)

def calc_rain():
    actual_rain = climate.get_rain()
    result = actual_rain
    print(f"Chuva: {round(result, 2)} %")
    return round(result, 2)

def days_of_week():
    actual_day = actualdatetime.get_day();
    result = 0;
    if actual_day == 'Segunda-feira':
        result = 100;
    elif actual_day == 'Terça-feira':
        result = 80;
    elif actual_day == 'Quarta-feira':
        result = 60;
    elif actual_day == 'Quinta-feira':
        result = 30;
    elif actual_day == 'Sexta-feira':
        result = 10;
    elif actual_day == 'Sábado':
        result = 5;
    elif actual_day == 'Domingo':
        result = 0;
    print(f"Dia da semana: {result} %")
    return result

def calc_temperature():
    actual_temperature = climate.get_temperature()
    if actual_temperature > 25 and actual_temperature < 29:
        result = 65;
    elif actual_temperature < 20 and actual_temperature > 18:
        result = 60;
    elif actual_temperature >= 20 and actual_temperature <= 25:
        result = 0;
    else:
        result = 100;
    print(f"Temperatura: {result} %")
    return result
 
def peak_hours():
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
    print(f"Horário de pico: {result} %")
    return result

def calc_stress():
    transit_stress = calc_transit()
    rain_stress = calc_rain()
    peak_hours_stress = peak_hours()
    days_week_stress = days_of_week()
    temperature_stress = calc_temperature()
    
    # Stress calc with weights
    # transit: 30%, rain: 20%, peak hours: 30%, day of week: 10%, temperature: 10%
    if (days_week_stress <= 5):
        peak_hours_stress = 0;
        
    result = (transit_stress * 0.3) + (rain_stress * 0.2) + (peak_hours_stress * 0.3) + (days_week_stress * 0.1) + (temperature_stress * 0.1)
        
    print(f"Stress geral: {round(result, 2)} %")
    return round(result, 2)

calc_temperature()
calc_transit()
calc_rain()
days_of_week()
peak_hours()
calc_stress()