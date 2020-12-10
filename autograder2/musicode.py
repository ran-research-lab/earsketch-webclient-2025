"""Demonstration for autograding the Musicode assignment."""
import autograder
import re

# create a rubric to score the script
rubric = {
    "has_song_list": 0, # 1 or 0
    "songs_valid": 0, # 0-3
    "random_works": 0, # 1 or 0
    "song_lengths": '', # space-separated list
    "handles_bad_input": 0, # 1 or 0
    "complexity80": 0 # 1 or 0
}

def prompt_for_song_names(script, language):
    """Prompt the grader for song names in the case that the autograder fails
    to successfully parse them."""
    # shows the grader the source code and asks to provide the 4 inputs
    inputs = ['Song 1', 'Song 2', 'Song 3', 'Random']
    return autograder.prompt(inputs, script, language)

def check_songs(script, language, song_names):
    """Check the list of song names against the script and update the rubric
    accordingly. Returns the number that sucessfully ran."""
    num_valid = 0
    lengths = []
    # check the four inputs
    for i,song_name in enumerate(song_names):
        # hijack user input prompt
        autograder.set_input([song_name])
        result, console = autograder.compile(script, language)
        # check if the script passed
        if not result["error"] and result["length"] >= 16: num_valid += 1
        if not result["error"]: lengths.append(str(result["length"]))
        else: lengths.append('0')
    return num_valid, lengths

def check_random(script, language, inputs):
    """Check if a random input does not return an error."""
    # check the four inputs
    for i,song_name in enumerate(song_names):
        # hijack user input prompt
        autograder.set_input([song_name])
        result, _ = autograder.compile(script, language)
        # check if the script passed
        if not result["error"] and result["length"] > 0: return True

    return False

# get the script object from the autograder
script = autograder.get_script()
language = autograder.get_language()

# search for a list of 3 strings, or return an error
regex = '''['"]([^'"]+)['"]?\s?,\s?['"]?([^'"]+)['"]?\s?(?:,|or)\s?['"]([^'"]+)['"]'''

match = re.search(regex, script)

# The autograder only works if there is exactly 1 readInput() call.
if script.count("readInput(") > 1:
    raise "Too many readInput() calls found. Cannot be autograded."
elif script.count("readInput(") == 0:
    raise "No readInput() call found. Cannot be autograded."

if not match or len(match.groups()) < 3 or len(match.groups()) > 4:
    inputs = prompt_for_song_names(script, language)
    song_names = inputs[:3]
    # check random
    random_works = check_random(script, language, [inputs[3]])
else:
    song_names = list(match.groups())
    # autograder passed song list check
    rubric["has_song_list"] += 1
    # check random
    random_works = check_random(script, language, ["random", "Random"] + song_names[3:])

# check that each song compiles correctly
num_valid, lengths = check_songs(script, language, song_names[:3])

# Backup case if the student did not use the song names as inputs, prompt
# the grader to manually input the prompts
if rubric["has_song_list"] and num_valid == 0:
    inputs = prompt_for_song_names(script, language)
    song_names = inputs[:3]
    # check random
    random_works = check_random(script, language, [inputs[3]])
    # check that each song compiles correctly
    num_valid, lengths = check_songs(script, language, song_names)
# Backup case if 3 songs validated automatically, but random input failed
elif rubric["has_song_list"] and num_valid == 3 and random_works == 0:
    inputs = prompt_for_song_names(script, language)
    song_names = inputs[:3]
    # check random
    random_works = check_songs(script, language, [inputs[3]])
    # check that each song compiles correctly
    num_valid, lengths = check_songs(script, language, song_names)

rubric["songs_valid"] = num_valid
rubric["song_lengths"] = ' '.join(lengths)
rubric["random_works"] = 1 if random_works else 0

# check bad input
autograder.set_input(["r4nd0m-s0ng-name1234"])
result, console = autograder.compile(script)
if not result["error"] and result["length"] == 0 and len(console) > 0:
    # script meets requirements for bad input
    rubric["handles_bad_input"] += 1

# check if it scores at least 80 using the EarSketch complexity measure
score = autograder.complexity(script, language, 'earsketch')
if score["total"] >= 80: rubric["complexity80"] += 1

# report as many things as you want about a script
autograder.report("rubric", rubric)
autograder.report("complexity", score)
