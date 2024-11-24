#!/usr/bin/env python
import sys
import warnings

#from crew import EVNewsWriterCrew

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# This main file is intended to be a way for you to run your
# crew locally, so refrain from adding unnecessary logic into this file.
# Replace with inputs you want to test with, it will automatically
# interpolate any tasks and agents information

def run():
    """
    Run the crew.
    """
    inputs = {
        'rss_url1': 'https://rss.app/feeds/u6rcvfy6PTSf9vQ4.xml',
        'rss_url2': 'https://rss.feedspot.com/uk_car_rss_feeds/'
    }
    EVNewsWriterCrew().crew().kickoff(inputs=inputs)