from crewai.tools import BaseTool
from typing import Type, List
from pydantic import BaseModel, Field
import feedparser
import requests
from bs4 import BeautifulSoup

class ParseRSSToolInput(BaseModel):
    """Input schema for ParseRSSTool."""
    rss_url: str = Field(..., description="URL of the RSS feed to parse.")

class ParseRSSTool(BaseTool):
    name: str = "Parse RSS Feed"
    description: str = (
        "Parses an RSS feed from a given URL and extracts articles with title, "
        "link, publication date, and summary."
    )
    args_schema: Type[BaseModel] = ParseRSSToolInput

    def _run(self, rss_url: str) -> list:
        """Fetches and parses an RSS feed."""
        try:
            feed = feedparser.parse(rss_url)
            articles = []
            for entry in feed.entries:
                articles.append({
                    'title': entry.title,
                    'link': entry.link,
                    'published': entry.published if 'published' in entry else 'Unknown',
                    'summary': entry.summary if 'summary' in entry else ''
                })
            return articles
        except Exception as e:
            return {"error": f"Failed to parse RSS feed: {str(e)}"}

class ScrapeArticleContentToolInput(BaseModel):
    """Input schema for ScrapeArticleContentTool."""
    url: str = Field(..., description="The URL of the article to scrape.")

class ScrapeArticleContentTool(BaseTool):
    name: str = "Scrape Article Content"
    description: str = (
        "Scrapes the content of a webpage given its URL. Extracts the main title "
        "and the article content as plain text."
    )
    args_schema: Type[BaseModel] = ScrapeArticleContentToolInput

    def _run(self, url: str) -> dict:
        """Fetches and scrapes the content of a webpage."""
        try:
            # Fetch the webpage
            response = requests.get(url, timeout=10)
            response.raise_for_status()

            # Parse the HTML content
            soup = BeautifulSoup(response.text, 'html.parser')

            # Extract the title
            title = soup.find('title').get_text(strip=True) if soup.find('title') else None

            # Extract the main article content (customize selectors for specific sites)
            content = ' '.join(p.get_text(strip=True) for p in soup.find_all('p'))

            if not content:
                return {"error": f"No readable content found at {url}"}

            return {
                "url": url,
                "title": title,
                "content": content
            }
        except Exception as e:
            return {"error": f"Failed to scrape article at {url}: {str(e)}"}

class FeedSpotScraperInput(BaseModel):
    """Input schema for FeedSpotScraperTool."""
    url: str = Field(..., description="The URL of the FeedSpot page to scrape RSS feed links from.")


class FeedSpotScraperTool(BaseTool):
    name: str = "FeedSpotScraper"
    description: str = "Scrapes the RSS feed links from a FeedSpot page."
    args_schema: Type[BaseModel] = FeedSpotScraperInput

    def _run(self, url: str) -> list[str]:
        """
        Scrapes the RSS feed links from Top 60 UK Car RSS Feeds page.

        Args:
            url (str): The URL of the FeedSpot page to scrape.

        Returns:
            list[str]: A list of RSS feed links.
        """
        try:
            response = requests.get(url)
            if response.status_code != 200:
                return f"Failed to fetch the page. Status code: {response.status_code}"

            soup = BeautifulSoup(response.content, "html.parser")

            # Find all anchor tags containing RSS feed links
            rss_links = []
            for link in soup.find_all("a", href=True):
                href = link.get("href")
                if "rss" in href or "feed" in href:  # Look for 'rss' in the href to identify feed links
                    rss_links.append(href)

            if not rss_links:
                return "No RSS feed links found on the page."

            return rss_links

        except Exception as e:
            return f"An error occurred while scraping: {e}"

class MyCustomToolInput(BaseModel):
    """Input schema for MyCustomTool."""
    argument: str = Field(..., description="Description of the argument.")

class MyCustomTool(BaseTool):
    name: str = "Name of my tool"
    description: str = (
        "Clear description for what this tool is useful for, you agent will need this information to use it."
    )
    args_schema: Type[BaseModel] = MyCustomToolInput

    def _run(self, argument: str) -> str:
        # Implementation goes here
        return "this is an example of a tool output, ignore it and move along."
