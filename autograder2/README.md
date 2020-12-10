
# API Documentation
These are the available API calls in the autograder.

Note that the autograder API is Python, so you also have access to many Python
libraries that you can import.

## Load the autograder API

```python
import autograder
```

## Get the script to grade and the language

```python
# The script to pass to autograder functions. Returns the raw source code
# of the script.
script = autograder.get_script()
# The language to pass to autograder functions. Returns 'python' or 'javascript'.
language = autograder.get_language()
```

## Send a report to the autograder output. 

You can send as many reports as you want.
A report should be a shallow dictionary containing only Python primitives
(ints, floats, strings, etc.) with strings as the dictionary keys. 
Do not try to report any objects or complex types in the autograder.

```python
# Create two reports to send to the autograder output
report1 = {
    "score1": 50,
    "score2": 15
}
report2 = {
    "score1": 11,
    "score2": 12
}
# Send the reports to the autograder
autograder.report("report1", report1)
autograder.report("report2", report2)
```

## Compile a script and store the output.

```python
# Return the result object and a list of console output strings.
result, console = autograder.compile(script, language)

if result['error']:
    # There was a compilation error!
    error = 1
    success = 0
    prints = 0
    length = 0
else:
    # There were no compilation errors
    error = 0
    success = 1
    # If the console output contains something, then the user printed!
    prints = 1 if result else 0
    # Get the total length of the script in measures
    length = result['length']

autograder.report("result", {
    "success": success, 
    "error": error, 
    "prints": prints,
    "length": length
})
```

## Hijack calls to readInput() to programatically inject user input.

```python
# Inject as many inputs as you expect there to be prompts.
autograder.set_input(["input1", "input2"])
# Run the script and readInputs() will be automatically filled!
result, console = autograder.compile(script, language)
```

## Manual input

Manually inspect the source code of the script and assign variables with a
dialog prompt. This will show you the source code of the script, and any
number of input prompts that you can fill manually. The values are returned
so you can use them elsewhere in your script.

```python
# Create as many inputs as you want in a list
input1, input2 = autograder.prompt(["Prompt 1", "Prompt 2"])
# Hijack the readInputs() by using the above prompts from the grader
autograder.set_input([input1, input2])
# Run the script and readInputs() will be automatically filled!
result, console = autograder.compile(script, language)
```

## Measure script complexity.

```python
# Use the EarSketch complexity measure to score the complexity of a script.
complexity = autograder.complexity(script, language, 'earsketch')
# It is already in a format to be reported to the autograder!
autograder.report("complexity", complexity)
```