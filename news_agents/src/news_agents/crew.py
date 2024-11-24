from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

# Uncomment the following line to use an example of a custom tool
# from news_agents.tools.custom_tool import MyCustomTool

# Check our tools documentations for more information on how to use them
# from crewai_tools import SerperDevTool

from tools.custom_tool import ParseRSSTool, ScrapeArticleContentTool, FeedSpotScraperTool
from crewai_tools import SerperDevTool

@CrewBase
class NewsAgents():
	"""NewsAgents crew"""

	agents_config = 'config/agents.yaml'
	tasks_config = 'config/tasks.yaml'

	@agent
	def rss_reader_scraper(self) -> Agent:
		return Agent(
			config=self.agents_config['rss_reader_scraper'],
			tools=[ParseRSSTool(), ScrapeArticleContentTool()], # Example of custom tool, loaded on the beginning of file
			verbose=True
		)

	@agent
	def information_aggregator(self) -> Agent:
		return Agent(
			config=self.agents_config['information_aggregator'],
			verbose=True,
            tools=[SerperDevTool(), ScrapeArticleContentTool()]
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
		)

	@task
	def information_gathering_task(self) -> Task:
		return Task(
			config=self.tasks_config['information_gathering_task'],
		)

	@task
	def quality_evaluation_task(self) -> Task:
		return Task(
			config=self.tasks_config['quality_evaluation_task'],
		)

	@task
	def news_writing_task(self) -> Task:
		return Task(
			config=self.tasks_config['news_writing_task'],
		)

	@crew
	def crew(self) -> Crew:
		"""Creates the NewsAgents crew"""
		return Crew(
			agents=self.agents, # Automatically created by the @agent decorator
			tasks=self.tasks, # Automatically created by the @task decorator
			process=Process.sequential,
			verbose=True,
			# process=Process.hierarchical, # In case you wanna use that instead https://docs.crewai.com/how-to/Hierarchical/
		)
