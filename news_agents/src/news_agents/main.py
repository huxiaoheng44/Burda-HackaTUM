#!/usr/bin/env python
import sys
import warnings

from crew import NewsAgents

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# This main file is intended to be a way for you to run your
# crew locally, so refrain from adding unnecessary logic into this file.
# Replace with inputs you want to test with, it will automatically
# interpolate any tasks and agents information

def run():
    """
    Run the crew.
    """
    inputs = {}
    NewsAgents().crew().kickoff(inputs=inputs)


def train():
    """
    Train the crew for a given number of iterations.
    """
    inputs = {}
    try:
        NewsAgents().crew().train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")

def replay():
    """
    Replay the crew execution from a specific task.
    """
    try:
        NewsAgents().crew().replay(task_id=sys.argv[1])

    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")

def test():
    """
    Test the crew execution and returns the results.
    """
    inputs = {}
    try:
        NewsAgents().crew().test(n_iterations=int(sys.argv[1]), openai_model_name=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")

rss_urls = [
    "https://rss.app/feeds/u6rcvfy6PTSf9vQ4.xml",
    "https://www.carblog.co.uk/feed/",
    "https://arrowcarhire.co.uk/feed/",
    "https://thedriversden.com/articles?format=rss",
    "https://www.carthrottle.com/rss",
    "https://www.fundmycarscotland.com/feed/",
    "https://carleasespecialoffers.co.uk/blog/feed/",
    "https://regcarcheck.co.uk/feed/",
    "https://carwitter.com/feed/",
    "https://www.autocar.co.uk/rss",
    "https://ottocar.co.uk/pco-blog/feed/",
    "http://www.theultimatefinish.co.uk/car-care-blog/feed/",
    "https://www.ecurie.co.uk/blog?format=rss",
    "https://www.carbuyer.co.uk/rss/news",
    "https://www.thedrive.co.uk/feed/",
    "https://www.whiterecovery.co.uk/feed/",
    "https://www.driving-news.co.uk/feed/",
    "https://www.splend.co.uk/blog/feed/",
    "https://cardealermagazine.co.uk/publish/category/latest-news/feed",
    "https://smart-motoring.com/feed/",
    "https://webloganycar.co.uk/feed/",
    "https://www.hiyacar.co.uk/blog/feed.xml",
    "https://www.actonservicecentre.co.uk/feed/",
    "https://petrolblog.com/feed",
    "https://www.fastcar.co.uk/feed/",
    "https://www.taketotheroad.co.uk/feed/",
    "https://www.motorverso.com/feed/",
    "https://classicmotorhub.com/category/blog/feed/",
    "https://carfinancegenie.co.uk/feed/",
    "https://www.eurocarparts.com/blog/feed",
    "https://rearviewprints.com/feed/",
    "https://dailycarblog.com/feed/",
    "http://automotiveblog.co.uk/feed/",
    "https://thecarscene.co.uk/feed",
    "https://co-cars.co.uk/feed/",
    "https://www.jct600.co.uk/blog/feed/",
    "https://www.thecarexpert.co.uk/feed/",
    "https://automotiveblog.co.uk/feed/",
    "https://www.hiltoncarsupermarket.co.uk/rss.php",
    "https://www.autoexpress.co.uk/feeds/all",
    "https://planetauto.co.uk/index.php?format=feed&type=rss"
]

run()