from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import SerperDevTool

from tools.custom_tool import ParseRSSTool, ScrapeArticleContentTool

@CrewBase
class EVNewsWriterCrew():
    """EV News Writer Crew"""

    @agent
    def rss_reader_scraper(self) -> Agent:
        return Agent(
            config=self.agents_config['rss_reader_scraper'],
            verbose=True,
            tools=[ParseRSSTool(), ScrapeArticleContentTool()]
        )

    @agent
    def information_aggregator(self) -> Agent:
        return Agent(
            config=self.agents_config['information_aggregator'],
            verbose=True,
            tools=[SerperDevTool()]
        )

    @agent
    def quality_evaluator(self) -> Agent:
        return Agent(
            config=self.agents_config['quality_evaluator'],
            verbose=True
        )

    @agent
    def news_writer(self) -> Agent:
        return Agent(
            config=self.agents_config['news_writer'],
            verbose=True
        )

    @task
    def rss_parsing_task(self) -> Task:
        return Task(
            config=self.tasks_config['rss_parsing_task'],
            output_file='output/ev_news_parsed.json'
        )

    @task
    def information_gathering_task(self) -> Task:
        return Task(
            config=self.tasks_config['information_gathering_task'],
            output_file='output/ev_news_enriched.json'
        )

    @task
    def quality_evaluation_task(self) -> Task:
        return Task(
            config=self.tasks_config['quality_evaluation_task'],
            output_file='output/ev_news_ranked.json'
        )

    @task
    def news_writing_task(self) -> Task:
        return Task(
            config=self.tasks_config['news_writing_task'],
            output_file='output/ev_news_final.md'
        )

    @crew
    def crew(self) -> Crew:
        """Creates the EV News Writer crew"""
        return Crew(
            agents=self.agents,  # Automatically created by the @agent decorator
            tasks=self.tasks,  # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True
        )
