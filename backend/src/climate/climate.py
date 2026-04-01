import openmeteo_requests
import requests_cache
from retry_requests import retry

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

url = "https://api.open-meteo.com/v1/forecast"
params = {
    "latitude": -23.5475,
    "longitude": -46.6361,
    "current": ["precipitation_probability", "temperature_2m", "precipitation", "apparent_temperature", "is_day"],
    "timezone": "America/Sao_Paulo",
}


def _fetch_current():
    """Busca dados climáticos frescos da API Open-Meteo."""
    try:
        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]
        current = response.Current()
        return {
            'rain': current.Variables(0).Value(),
            'temperature': current.Variables(1).Value(),
            'precipitation': current.Variables(2).Value(),
            'apparent_temperature': current.Variables(3).Value(),
            'is_day': current.Variables(4).Value(),
        }
    except Exception as e:
        print(f"Erro ao buscar dados climáticos: {e}")
        return {
            'rain': 0,
            'temperature': 0,
            'precipitation': 0,
            'apparent_temperature': 0,
            'is_day': 0,
        }


def get_rain():
    return _fetch_current()['rain']


def get_temperature():
    return _fetch_current()['temperature']


def get_precipitation():
    return _fetch_current()['precipitation']


def get_apparent_temperature():
    return _fetch_current()['apparent_temperature']


def get_is_day():
    return _fetch_current()['is_day']


def get_all():
    """Retorna todos os dados climáticos em uma única chamada (mais eficiente)."""
    return _fetch_current()
