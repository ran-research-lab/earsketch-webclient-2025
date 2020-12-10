"""Demonstration of how to score scripts based on complexity."""
import autograder

# get the script and language to grade
script = autograder.get_script()
language = autograder.get_language()

# score the script based on the EarSketch complexity measure
score = autograder.complexity(script, language, 'earsketch')

# report complexity score to the autograder
autograder.report("complexity", score)
