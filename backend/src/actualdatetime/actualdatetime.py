from datetime import datetime
import pytz

# Define the timezone of São Paulo
tz_sp = pytz.timezone('America/Sao_Paulo')

# Get the current date and time in SP
now_sp = datetime.now(tz_sp)

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

# Take the name of the day in English and translate it to Portuguese
day_en = now_sp.strftime('%A')
day_pt = days_of_week[day_en]

# Format the date (optional)
date_format = now_sp.strftime('%d/%m/%Y')
hora_sp = datetime.now(tz_sp)
hora_formatada = hora_sp.strftime('%H:%M')

def get_date():
    return date_format
def get_day():
    return day_pt
def get_hour():
    return hora_formatada
