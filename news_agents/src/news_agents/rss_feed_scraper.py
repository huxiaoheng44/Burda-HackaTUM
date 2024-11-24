import requests
from bs4 import BeautifulSoup

def scrape_rss_feeds(url):
    try:
        # Send a GET request to the webpage
        response = requests.get(url)
        response.raise_for_status()  # Raise HTTPError for bad responses
    except requests.exceptions.RequestException as e:
        print(f"Error fetching the webpage: {e}")
        return []

    # Parse the webpage content
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find all links on the page
    links = soup.find_all('a', href=True)

    # Filter out the RSS feed URLs
    rss_feeds = [
        link['href']
        for link in links
        if ('rss' in link['href'].lower() or link['href'].lower().endswith('.xml') or 'feed' in link['href'].lower())
        and 'feedspot' not in link['href'].lower()
    ]
    
    # Return the unique RSS feed URLs
    return list(set(rss_feeds))

# URL of the target webpage
url = "https://rss.feedspot.com/uk_car_rss_feeds/"

# Scrape the RSS feeds
rss_feed_urls = scrape_rss_feeds(url)

# Save the results to a text file
output_file = "rss_feeds.txt"
with open(output_file, 'w') as file:
    for feed_url in rss_feed_urls:
        file.write(feed_url + '\n')

print(f"RSS feed URLs have been saved to {output_file}")
