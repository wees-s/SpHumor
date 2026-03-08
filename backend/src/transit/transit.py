from typing import NotRequired
from bs4 import BeautifulSoup
import requests

def get_transit():
    try:
        # Fetch the HTML content from the URL.
        url = "https://www.cetsp.com.br/transito-agora/transito-nas-principais-vias.aspx"
        response = requests.get(url)

        # Below is the HTML content parsing.
        soup = BeautifulSoup(response.content, 'html.parser')

        result = []
        # Process the HTML content to extract the data.
        for i in soup.find_all('li'):
            for j in i.find_all('strong'):
                temp = j.text.strip()
                result.append(temp)

        total_km = 0
        # Final filter to calculate the total km.
        for i in result:
            for j in i.split():
                if j.isdigit():
                    total_km += int(j)

        return total_km
    except:
        return 0