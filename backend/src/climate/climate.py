import openmeteo_requests

import pandas as pd
import requests_cache
from retry_requests import retry

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)

# Make sure all required weather variables are listed here
# The order of variables in hourly or daily is important to assign them correctly below
url = "https://api.open-meteo.com/v1/forecast"
params = {
	"latitude": -23.5475,
	"longitude": -46.6361,
	"current": ["precipitation_probability", "temperature_2m", "precipitation", "apparent_temperature", "is_day"],
	"timezone": "America/Sao_Paulo",
}

try:
    responses = openmeteo.weather_api(url, params=params)

    # Process first location. Add a for-loop for multiple locations or weather models
    response = responses[0]

    # Process current data. The order of variables needs to be the same as requested.
    current = response.Current()
    current_rain = current.Variables(0).Value()
    current_temperature_2m = current.Variables(1).Value()
    current_precipitation = current.Variables(2).Value()
    current_apparent_temperature = current.Variables(3).Value()
    current_is_day = current.Variables(4).Value()
except:
    current_rain = 0
    current_temperature_2m = 0
    current_precipitation = 0
    current_apparent_temperature = 0
    current_is_day = 0

def get_rain():
    return current_rain  # Agora é precipitation_probability (0-100%)

def get_temperature():
    return current_temperature_2m

def get_precipitation():
    return current_precipitation

def get_apparent_temperature():
    return current_apparent_temperature

def get_is_day():
    return current_is_day
