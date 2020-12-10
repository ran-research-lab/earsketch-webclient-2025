"""Demonstrates how to use the autograder to manually assign scores."""
import autograder

# get the script and language to grade
script = autograder.get_script()
language = autograder.get_language()

# List of inputs that are difficult/impossible to autograde
# Can add as many as you want
inputs = ['Creativity', 'Use of Loops', 'Algorithmic Complexity']
scores = autograder.prompt(inputs, script, language)

report = {
    'Creativity': inputs[0],
    'Use of Loops': inputs[1],
    'Algorithmic Complexity': inputs[2]
}

# Send the report to the autograder
autograder.report("manual", report)
