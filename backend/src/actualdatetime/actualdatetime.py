from datetime import datetime
import pytz

# Define the timezone of São Paulo
tz_sp = pytz.timezone('America/Sao_Paulo')

# Dictionary to translate the name of the day in English to Portuguese
days_of_week = {
    'Monday': 'Segunda-feira',
    'Tuesday': 'Terça-feira',
    'Wednesday': 'Quarta-feira',
    'Thursday': 'Quinta-feira',
    'Friday': 'Sexta-feira',
    'Saturday': 'Sábado',
    'Sunday': 'Domingo'
}

def get_date():
    now_sp = datetime.now(tz_sp)
    return now_sp.strftime('%d/%m/%Y')

def get_day():
    now_sp = datetime.now(tz_sp)
    day_en = now_sp.strftime('%A')
    return days_of_week[day_en]

def get_hour():
    now_sp = datetime.now(tz_sp)
    return now_sp.strftime('%H:%M')
