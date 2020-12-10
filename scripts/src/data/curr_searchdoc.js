var ESCurr_SearchDoc = [
    {
        "text": "The first unit covers the fundamentals of making music in EarSketch, from writing your first line of code to creating entire songs. It begins with a walkthrough and example of using the EarSketch interface. We learn how to write code that makes music. By the end of the first chapter, you will be able to write your own code and make your own music!", 
        "id": "ch_u1_intro.html", 
        "title": "Unit 1 Introduction"
    }, 
    {
        "text": "This chapter covers the basic functionality of EarSketch. It explains the layout of the site and how to navigate through the various workspace panes. Most importantly, it provides tools for making a piece of music!", 
        "id": "ch_1.html", 
        "title": "Getting Started with EarSketch"
    }, 
    {
        "text": "Computers have greatly expanded the possibilities for getting involved in music. The musician\u2019s toolbox has grown, and new skills are needed to use these tools. Programming involves creativity, so it fits well with making music. You\u2019ll learn to think in both a structured and creative way, which is a valuable combination.", 
        "id": "ch_1.html#whylearnprogrammingformusic", 
        "title": "Why Learn Programming for Music?"
    }, 
    {
        "text": "The Digital Audio Workstation, or DAW, is the main tool for producing music on a computer. A DAW is specialized computer software for recording, editing, and playing digital audio files. In the context of a DAW, these audio files are called clips. The DAW allows you to edit and combine multiple clips simultaneously on a musical timeline, making it easy to synchronize and visualize different parts. DAWs are used in both professional recording studios and in home laptop-based studios. Some popular DAWs include Pro Tools and Logic Pro, GarageBand, and Reaper.", 
        "id": "ch_1.html#toolsofthetrade", 
        "title": "Tools of the Trade: DAWs and APIs"
    }, 
    {
        "text": "Here are the different sections of the EarSketch workspace:", 
        "id": "ch_1.html#ESworkspace", 
        "title": "The EarSketch Workspace"
    }, 
    {
        "text": "The basic workflow for making a song in EarSketch follows: type your musical code into the code editor, press the run button to execute the code and add the music to the DAW, and press play in the DAW to hear it.", 
        "id": "ch_1.html#runningascript", 
        "title": "Running a Script"
    }, 
    {
        "text": "Let\u2019s make a small modification to the current project. We\u2019ll add our name to the project. On lines 1-10, notice that each line starts with a pound sign: #. The computer does not execute a line of code that is preceded by #. This is called a comment. Comments are used by programmers to make notes on their code for them or other programmers to read later. On line 5 of the previous example, type your name to the right of \"author:\".", 
        "id": "ch_1.html#addingcomments", 
        "title": "Adding Comments"
    }, 
    {
        "text": "Take a look at the DAW. The DAW consists of several items:", 
        "id": "ch_1.html#thedawindetail", 
        "title": "The DAW in Detail"
    }, 
    {
        "text": "A computer program is a sequence of instructions that the computer executes. It is used to accomplish a specific task or set of tasks. Programming is the process of designing, writing, testing, debugging, and maintaining the code of computer programs. This code can be written in a wide variety of computer programming languages. Some of these languages include Java, C, Python, and JavaScript.", 
        "id": "ch_1.html#whatisprogramming", 
        "title": "What is Programming?"
    }, 
    {
        "text": "In EarSketch, we will structure all of our sample projects in roughly the same way: as 4 sections marked by comments, each with a different purpose:", 
        "id": "ch_1.html#sectionsofanearsketchscript", 
        "title": "Sections of an EarSketch Script"
    }, 
    {
        "text": "The following steps walk through how to create a new script in EarSketch.", 
        "id": "ch_1.html#creatinganewscript", 
        "title": "Creating a New Script"
    }, 
    {
        "text": "Let\u2019s make some music with the script we just created. If you missed how to make a new script, jump back a section. Otherwise, follow these steps:", 
        "id": "ch_1.html#composinginearsketch", 
        "title": "Composing In EarSketch"
    }, 
    {
        "text": "An algorithm is a set of instructions to be understood and carried out by the computer. Algorithms are written with computer code.", 
        "id": "ch_1.html#chapter1summary", 
        "title": "Chapter 1 Summary"
    }, 
    {
        "text": "The instructions given in a script allow the computer to process many types of information. This information is structured so that the music produced by EarSketch sounds pleasing. We will continue learning about rhythm, data types, and functions.", 
        "id": "ch_2.html", 
        "title": "The Building Blocks of a Program"
    }, 
    {
        "text": "When we refer to rhythm of a song, we are describing how sounds are arranged as music flows through time. Musicians use many words to describe rhythm, such as tempo, meter, measure, beat, and sub-beat. These terms are useful in DAWs like EarSketch because they help you to organize the elements of your music in time.", 
        "id": "ch_2.html#rhythm", 
        "title": "Rhythm"
    }, 
    {
        "text": "Computers store and process information. A set of information is called data. Many different kinds of data are used to construct a program. Programming languages can only work with certain kinds of data. The basic data types that most programming languages can understand are:", 
        "id": "ch_2.html#datatypes", 
        "title": "Data Types"
    }, 
    {
        "text": "You have seen code like setTempo(), fitMedia(), init(), and finish(), consisting of one or two words followed by parentheses. These are called functions. Functions tell the computer what to do based on information given, like setting the tempo or fitting media clips into a project. Their names often include verbs (initialize, set, finish, etc.); think of them as verbs of the programming language. To make music, we will use EarSketch API functions, standard Python functions, and later, functions that you will write yourself.", 
        "id": "ch_2.html#functions", 
        "title": "Functions"
    }, 
    {
        "text": "The fundamental data type in computing is the number. In EarSketch, numbers can be used to describe rhythm to the computer. Every EarSketch script must include a setTempo() function with a number in the parentheses. This tells the computer how fast to play the music.", 
        "id": "ch_2.html#numbers", 
        "title": "Numbers"
    }, 
    {
        "text": "A variable creates a space in the computer\u2019s memory to store data. The name you specify for a variable gives you an easy way to refer to that space and retrieve the stored data. Variables are useful because you can change what they store. You get to pick the name and the value of a variable. However, you should always give your variables names that describe what they will be storing. In EarSketch, variables are used to hold musical values like measureNumber or trackNumber.", 
        "id": "ch_2.html#variables", 
        "title": "Variables"
    }, 
    {
        "text": "A constant stores values that never change. In EarSketch, constants are used to refer to audio files that you can add to your project. The \"value\" that these constants refer to is the address for a specific sample. TECHNO_SYNTHPLUCK_001 is a constant. EarSketch assigns its file path, a unique location on the server, to a single value. By convention, constant names are capitalized and do not include spaces; instead they use underscores.", 
        "id": "ch_2.html#constants", 
        "title": "Constants"
    }, 
    {
        "text": "Rhythm is defined as the arrangement of sounds as music flows through time.", 
        "id": "ch_2.html#chapter2summary", 
        "title": "Chapter 2 Summary"
    }, 
    {
        "text": "Sometimes programmers make mistakes that cause code to work incorrectly, or not run at all. Strategies for overcoming these mistakes are presented in this chapter.", 
        "id": "ch_3.html", 
        "title": "Debugging and Documenting"
    }, 
    {
        "text": "All programmers encounter occasional flaws and unexpected results when running code; no one is immune to mistakes. In programming, coding faults are called errors, or bugs. The process of finding and fixing bugs is called debugging.", 
        "id": "ch_3.html#whatisdebugging", 
        "title": "What is Debugging?"
    }, 
    {
        "text": "Comments are added to programs to make the code easier to understand for programmers and collaborators. They can also be used to help organize code or to make notes for future use. In Python, comments are indicated by a line starting with a # symbol. This symbol tells the computer not to execute the statement on that line.", 
        "id": "ch_3.html#documentingcode", 
        "title": "Documenting Code"
    }, 
    {
        "text": "The following list of common errors can help you identify and prevent bugs in your scripts.", 
        "id": "ch_3.html#commonerrors", 
        "title": "Common Errors"
    }, 
    {
        "text": "Let\u2019s use knowledge of common errors to debug some example code. The two scripts that follow are supposed to produce the same code, but each contains an error. Paste the scripts into the Code Editor and try to correct each error. You may find that running the code is helpful.", 
        "id": "ch_3.html#debuggingexercise", 
        "title": "Debugging Exercise"
    }, 
    {
        "text": "Debugging is the process of finding and fixing bugs, errors made by the programmer.", 
        "id": "ch_3.html#chapter3summary", 
        "title": "Chapter 3 Summary"
    }, 
    {
        "text": "EarSketch lets the composer alter clips to produce new and unique sounds. This is achieved through the setEffect() function, the focus of this chapter. For a complete description of all the EarSketch API functions, see the EarSketch API tab.", 
        "id": "ch_4.html", 
        "title": "Effects in EarSketch: setEffect"
    }, 
    {
        "text": "fitMedia() let us compose music by arranging different audio clips in the DAW. As a composer and producer, you must also pay attention to the characteristics of those sounds. Effects allow us to change qualities of the sounds in a project. Similar to how adding a filter alters a photo, adding an audio effect to a track changes the sound in new and interesting ways. Listen to the reference clip, below, with no effects, and then compare it with the next clip that has a delay effect applied.", 
        "id": "ch_4.html#effectsinearsketch", 
        "title": "Using Effects in EarSketch"
    }, 
    {
        "text": "Effects change the qualities of a sound to make them more unique.", 
        "id": "ch_4.html#chapter4summary", 
        "title": "Chapter 4 Summary"
    }, 
    {
        "text": "Adding effects with setEffect() can completely transform a piece of music. This chapter introduces additional effects and time-varying effects.", 
        "id": "ch_5.html", 
        "title": "Effects and Envelopes"
    }, 
    {
        "text": "It is not always practical to add an effect to an entire track. Envelopes allow us to add effects to smaller portions of a track and define how an effect\u2019s parameters change over time. They can be used with any effect parameter.", 
        "id": "ch_5.html#envelopes", 
        "title": "Envelopes"
    }, 
    {
        "text": "The setEffect() function takes a variable number of arguments. Its full set of arguments is listed below.", 
        "id": "ch_5.html#envelopeswithseteffect", 
        "title": "Envelopes with setEffect"
    }, 
    {
        "text": "Volume is related to loudness, in which sounds are ordered on a scale from quiet to loud. The gradual increase or decrease in volume, like in the previous example, is called a fade. Fades can be used to start and end a piece, or even to transition between tracks, as detailed in Chapter 14. Fades are achieved by creating a VOLUME envelope with the GAIN parameter. The VOLUME effect can also be used to effectively mix a composition. Mixing is the process of balancing multiple audio tracks to sound cohesive when played together.", 
        "id": "ch_5.html#moreeffects", 
        "title": "More Effects"
    }, 
    {
        "text": "Envelopes define how an effect parameter changes over time. They are described with value-time pairs, like (value, time, value, time).", 
        "id": "ch_5.html#chapter5summary", 
        "title": "Chapter 5 Summary"
    }, 
    {
        "text": "It is often challenging to choose sounds that work together when composing in EarSketch. This chapter provides strategies for planning your composition, choosing sounds, and transitioning between musical ideas.", 
        "id": "ch_6.html", 
        "title": "Tempo and Pitch"
    }, 
    {
        "text": "Tempo is the speed at which a piece of music is played. It affects the duration of each beat. Tempo is specified in beats per minute (bpm) in Western music. In EarSketch, we set the tempo of our song at the top of each script with setTempo().", 
        "id": "ch_6.html#tempo", 
        "title": "Tempo"
    }, 
    {
        "text": "Pitch is a quality of sound that determines how high or low it sounds. Humans order relative musical tones on a scale, or set of musical notes, based on how they hear the frequency of the sound. This means pitch and frequency are related, but not synonymous. Pitch, duration, loudness, and timbre all factor into a complete musical tone.", 
        "id": "ch_6.html#pitch", 
        "title": "Pitch"
    }, 
    {
        "text": "Transitions are passages of music that combine neighboring musical sections. They can connect verse and chorus, build up to a drop, combine collaboratively written sections, mix between tracks (DJing), or change keys. The goal of a transition is to grab the listener\u2019s attention and let them know a change is about to occur. Following are some popular strategies for creating musical transitions:", 
        "id": "ch_6.html#transitionstrategies", 
        "title": "Transition Strategies"
    }, 
    {
        "text": "Tempo is the speed at which a piece of music is played, specified in beats per minute (bpm). Tempo is tied to genre; often different genres adhere to a particular tempo range.", 
        "id": "ch_6.html#chapter6summary", 
        "title": "Chapter 6 Summary"
    }, 
    {
        "text": "Ownership of compositions and recordings can be confusing. Basic copyright in music and tips for obtaining permission to use sounds are covered in this chapter.", 
        "id": "ch_7.html", 
        "title": "Copyright"
    }, 
    {
        "text": "How do we define ownership of things that are not concrete? Someone cannot steal a song that you wrote in the same way that they can steal your car, but that song still has value. Ownership of these things exists as well; we call this intellectual property. Copyright is the part of law that covers ownership of creative work. It tells us what other people can and can\u2019t do with creative works. As musicians, copyright is important because:", 
        "id": "ch_7.html#whatiscopyright", 
        "title": "What is Copyright?"
    }, 
    {
        "text": "The first thing you should know about copyright: you probably already have one! To get a copyright for something, you just have to create something original and substantial enough outside your head (maybe not that 140-character Twitter status). Generally, if you make something creative and new, you have a copyright automatically. In the United States, having a copyright gives you six exclusive rights over what you create:", 
        "id": "ch_7.html#copyrightbasics", 
        "title": "Copyright Basics"
    }, 
    {
        "text": "There are actually two copyrights involved with a song, rights to the song and rights to the sound recording. Rights to a song refers to ownership by the writer or composer. Conversely, rights to a sound recording refers to the record label. This means when someone needs permission to use a song, they might have to get permission twice.", 
        "id": "ch_7.html#copyrightinmusic", 
        "title": "Copyright in Music"
    }, 
    {
        "text": "Sampling means taking part of a sound recording and using it in a new piece of music. All of the sounds in the EarSketch library are samples. You are not creating sounds from scratch, but instead combining and using them in new ways.", 
        "id": "ch_7.html#legalissueswithsampling", 
        "title": "Legal Issues with Sampling"
    }, 
    {
        "text": "Copyright law has some exceptions. Copyright is important, but so is free speech and creativity. In the United States, fair use is the part of law that acts as a \"safety net\" to keep copyright from going too far. It allows for use of copyrighted content under certain conditions.", 
        "id": "ch_7.html#fairuse", 
        "title": "Fair Use"
    }, 
    {
        "text": "To license is to give permission. If you own a copyright for something and you want to let someone else use it, you typically do not just sign over your copyright. Instead, you give them permission. Permission can be given on an individual basis, like sampling licenses. You can also put a license on your work that lets anyone use it. For example, all of the samples in the EarSketch sound library are licensed so that you are allowed to use them however you like. This means that all the music you create in EarSketch is totally yours. You have the copyright, and you can do what you want with it.", 
        "id": "ch_7.html#licensingandfreeculture", 
        "title": "Licensing and Free Culture"
    }, 
    {
        "text": "Copyright is a portion of law that covers ownership of creative work, like music. It is important to musicians because it defines how another person\u2019s work can be used and shared.", 
        "id": "ch_7.html#chapter7summary", 
        "title": "Chapter 7 Summary"
    }, 
    {
        "text": "An evaluation, or assessment, is a judgment about the quality or value of something. It is important to evaluate code in order to determine its correctness and completeness.", 
        "id": "ch_8.html", 
        "title": "Evaluating Correctness: Part One"
    }, 
    {
        "text": "When assessing your own code, take multiple things into consideration. These considerations are both from the perspective of the computer and the human. The computer is only concerned with what the code does, but you are also concerned with how the code achieves its goals. This idea of a human perspective is important because, after all, your code is going to be read by other humans!", 
        "id": "ch_8.html#selfassessment", 
        "title": "Self Assessment"
    }, 
    {
        "text": "It is helpful to ask yourself questions when evaluating your code, even if you think you already know the answer. This set of questions should be extensive, taking into the account the considerations presented earlier in this chapter. Below is a sample set of questions to help you perform a thorough evaluation of your code:", 
        "id": "ch_8.html#performinganevaluation", 
        "title": "Performing an Evaluation"
    }, 
    {
        "text": "A code evaluation is a judgment of the quality or value of a script. It is an assessment that allows the programmer to determine if a program functions correctly.", 
        "id": "ch_8.html#chapter8summary", 
        "title": "Chapter 8 Summary"
    }, 
    {
        "text": "Let\u2019s review the material covered so far.", 
        "id": "ch_u1_summary.html", 
        "title": "Unit 1 Summary"
    }, 
    {
        "text": "Computer scientists and software engineers work hard to write code that is clear and concise, making it easy to understand, easy to change, and easy to use again. As you become more comfortable with writing clear and concise code in this unit, you will be able to share ideas and collaborate with others. Better still, you will be able to customize aspects of your code, making it easier for you to experiment with new musical ideas that result in more interesting, exciting, and unique music.", 
        "id": "ch_u2_intro.html", 
        "title": "Unit 2 Introduction"
    }, 
    {
        "text": "This chapter focuses on coding large-scale changes in music efficiently, which will help you create longer compositions with EarSketch.", 
        "id": "ch_9.html", 
        "title": "Musical Form and Custom Functions"
    }, 
    {
        "text": "Several measures that express an idea or feeling make up a section. Songs that contain multiple sections allow for variety and structure, or form. Intros, Verses, Choruses, and Outros are examples of sections that contribute to form.", 
        "id": "ch_9.html#sectionsandform", 
        "title": "Sections and Form"
    }, 
    {
        "text": "The most common form is A-B-A, as it tends to work well musically. The B section adds variety, while returning to the A section invokes familiarity. The code below creates an ABA form:", 
        "id": "ch_9.html#abaform", 
        "title": "A-B-A Form"
    }, 
    {
        "text": "Custom functions allow you to write your own functions and avoid repetitive code. You can give them any name and run them anywhere.", 
        "id": "ch_9.html#customfunctions", 
        "title": "Custom Functions"
    }, 
    {
        "text": "In programming we can create abstractions, just as we group musical ideas into sections. An abstraction is a bundling of ideas to form a single concept. Functions are one kind of abstraction used in computer science. They pack multiple statements into one tool so they can be easily referred to. They also help manage the complexity of a program; the user doesn\u2019t have to worry about what is in the function body. Abstractions can make the form of a program more clear, which is helpful when writing and debugging large programs.", 
        "id": "ch_9.html#abstraction", 
        "title": "Abstraction"
    }, 
    {
        "text": "Sections are related musical units consisting of multiple measures. Each expresses an idea or feeling.", 
        "id": "ch_9.html#chapter9summary", 
        "title": "Chapter 9 Summary"
    }, 
    {
        "text": "This chapter details the steps for recording and uploading sounds to EarSketch. We are also going to look at how these procedures are achieved in the computer.", 
        "id": "ch_10.html", 
        "title": "Recording & Uploading Sounds"
    }, 
    {
        "text": "In addition to the extensive sound library, EarSketch offers the ability to upload your own audio through the Sounds Browser. Clicking on the \"Add Your Own Sound\" link will open a window and present you with two options: File Upload, and Quick Record. File Upload allows you to choose audio files (.mp3, .aiff, and so on) already on your computer, and Quick Record lets you record short clips directly into the EarSketch library. Check out the video below for more information on how to use your own sounds in EarSketch:", 
        "id": "ch_10.html#recordinganduploadingsounds", 
        "title": "Recording & Uploading Sounds"
    }, 
    {
        "text": "Processes, or tasks, are programs that run on your computer. The computer\u2019s CPU, or Central Processing Unit, carries them out. The CPU is a set of complex electronic circuitry that acts as your computer\u2019s control center. Many modern computers have multiple processing units, allowing multiple processes to be executed in parallel.", 
        "id": "ch_10.html#processesandmemory", 
        "title": "Processes and Memory"
    }, 
    {
        "text": "You can upload your own sounds to EarSketch through the Sound Browser. Just click \"Add Your Own Sound\".", 
        "id": "ch_10.html#chapter10summary", 
        "title": "Chapter 10 Summary"
    }, 
    {
        "text": "makeBeat() allows us to compose music note by note instead of at the measure level, perfect for drum beats. This approach is often called step sequencing in music production.", 
        "id": "ch_11.html", 
        "title": "Making Custom Beats: makeBeat"
    }, 
    {
        "text": "We need to understand the string data type to use makeBeat(). In Python, a string is a series of characters with single or double quotation marks around it, like \"Hello World!\" or 'This is a test sentence'. Strings are often used in programming to represent non-numerical data such as words, but can include numbers. For example, the string \"123 Ferst Dr.\" could represent an address, using numbers, spaces, letters, and punctuation. Like numbers (and other types of data), strings can be assigned to variables: address = \"123 Ferst Dr.\"", 
        "id": "ch_11.html#strings", 
        "title": "Strings"
    }, 
    {
        "text": "We use strings with makeBeat() to define rhythmic, or beat, patterns. In EarSketch, we can use beat pattern strings, or series of characters, to refer to sixteenth note sub-beats of a measure. A character can be a letter, number, whitespace, punctuation, or symbol, as a single unit of information. The configuration of characters allow us to place clips at specific places in the measure and define the clip\u2019s play length. Here is an example of a beat pattern string, assigned to a variable called myDrumBeat:", 
        "id": "ch_11.html#beatpatternswithstrings", 
        "title": "Beat Patterns with Strings"
    }, 
    {
        "text": "makeBeat() takes four arguments:", 
        "id": "ch_11.html#makebeat", 
        "title": "makeBeat()"
    }, 
    {
        "text": "A string is a data type that consists of a series of characters encapsulated by single or double quotes. Strings are most often used to represent non-numerical data.", 
        "id": "ch_11.html#chapter11summary", 
        "title": "Chapter 11 Summary"
    }, 
    {
        "text": "Repetition is an important element of music. Computers can execute statements over and over again using a loop. In this chapter, we will learn about loops, using them to code more efficiently and add repetition to our music.", 
        "id": "ch_12.html", 
        "title": "Looping"
    }, 
    {
        "text": "A for-loop tells the computer to execute a section of code repeatedly, a common notation in most programming languages. We can use for-loops to avoid repeated lines or sections of code. In Python, for-loops look like this:", 
        "id": "ch_12.html#theforloop", 
        "title": "The For-Loop"
    }, 
    {
        "text": "For-loops in Python consist of 3 basic parts:", 
        "id": "ch_12.html#componentsofaforloop", 
        "title": "Components of a For-Loop"
    }, 
    {
        "text": "Previously, we have created repetition in our music by typing fitMedia() again and again, with different measure numbers:", 
        "id": "ch_12.html#exampleloop", 
        "title": "Example Loop"
    }, 
    {
        "text": "The interpreter reads and executes a script. The order it is executed in is called the control flow. It usually goes line by line, top to bottom. A loop is a control flow statement, which changes the order. At the end of a loop body, it jumps back to the top of the loop", 
        "id": "ch_12.html#followingcontrolflow", 
        "title": "Following Control Flow"
    }, 
    {
        "text": "Repeatedly adding media clips to a project is just one of many possible uses of for-loops in EarSketch. In the following video and example code, we use two loops to add clips to the DAW, and a third to add a panning effect on each track. Note: panning effects are more noticeable when using headphones.", 
        "id": "ch_12.html#addingeffectswithloops", 
        "title": "Adding Effects with Loops"
    }, 
    {
        "text": "For-loops can be used to apply repeated effects envelopes to tracks. In the example below, each iteration of the loop adds a one measure long segment of the envelope. Automating the GAIN parameter creates rhythmic volume fades, an effect popular in EDM. Try toggling the effect bypass to hear the difference the effect makes.", 
        "id": "ch_12.html#automatingeffectswithloops", 
        "title": "Automating Effects with Loops"
    }, 
    {
        "text": "A for-loop instructs the computer to execute a code section repeatedly, creating more efficient code. For-loops consist of a loop body, loop counter, and range. The code in the loop body must be indented. Revisit for-loop syntax here.", 
        "id": "ch_12.html#chapter12summary", 
        "title": "Chapter 12 Summary"
    }, 
    {
        "text": "Previously, the string data type was used to make beat strings for makeBeat(). Methods for modifying strings, string operations, are introduced in this chapter. Before we investigate these methods, let\u2019s look at a new way to make use of use custom functions.", 
        "id": "ch_13.html", 
        "title": "String Operations"
    }, 
    {
        "text": "Previously when we have called a function, we provide it some input (arguments) and then it simply executes its code block. What if we wanted to use a value generated inside a function later on, maybe outside the function?", 
        "id": "ch_13.html#returnstatements", 
        "title": "Return Statements"
    }, 
    {
        "text": "Concatenation is a means to link strings together. In doing so, a new string is formed. For example, concatenating the strings \"hello\" and \"world\" yields \"helloworld\". Strings are concatenated with the + symbol, like in the following example. To view the new string we use the print statement to print the string to the console.", 
        "id": "ch_13.html#stringconcatenation", 
        "title": "String Concatenation"
    }, 
    {
        "text": "A substring is partial string, also known as a slice, that occurs inside of a larger string. This allows a beat to be sliced up, a very popular technique in electronic music and remixing.", 
        "id": "ch_13.html#substrings", 
        "title": "Substrings"
    }, 
    {
        "text": "Concatenation is a means to link strings together, effectively forming a new string. It is used to form longer, more complex rhythms. In Python, strings are concatenated with the + symbol.", 
        "id": "ch_13.html#chapter13summary", 
        "title": "Chapter 13 Summary"
    }, 
    {
        "text": "This chapter takes a look at repetition and contrast as they pertain to music. More complex transition strategies are examined using these two elements.", 
        "id": "ch_14.html", 
        "title": "Musical Repetition"
    }, 
    {
        "text": "Repetition refers to repeated sounds or sequences of music. It is a key feature that is shared by almost all kinds of music throughout the world. Humans enjoy repetition because of what psychologists call the mere exposure effect. We like music or sections of music that we have consciously or unconsciously heard before. Furthermore, musical repetition has the profound effect of drawing the listener into the music, making us feel as if we are participating rather than just listening. Upon hearing a repeated section of music, the brain will try to imagine the next note before it is actually played. This same effect contributes to earworms, or music getting \"stuck\" in your head. Likewise, each time a section of music is repeated, the listener tends to notice different details of the piece. This is because the brain no longer has to focus on processing the raw melodic content.", 
        "id": "ch_14.html#repetitioninmusic", 
        "title": "Repetition in Music"
    }, 
    {
        "text": "Contrast refers to differences in subsequent sections of music, providing an important balance with repetition. Contrast is used to enhance music, bringing new elements to the listener\u2019s attention. These new elements create interest and a sense of momentum. Musicians provide contrast by introducing a rhythmic change, a new melodic line or harmony, and variations in the instruments or sounds used. In popular music, the verse-chorus structure commonly makes use of contrast. While the chorus may borrow ideas from the verse, it is often fuller sounding. Transitions play an important role in musical structure by linking contrasting sections.", 
        "id": "ch_14.html#contrast", 
        "title": "Contrast"
    }, 
    {
        "text": "In Chapter 6, we examined some popular strategies for creating musical transitions. Implementing repetition and contrast with code allows more advanced techniques to be examined. Take a look at the following advanced techniques.", 
        "id": "ch_14.html#advancedtransitiontechniques", 
        "title": "Advanced Transition Techniques"
    }, 
    {
        "text": "Repetition refers to repeated sounds or sequences of music. It it one of the universal traits of music, as it keeps the human brain occupied when listening.", 
        "id": "ch_14.html#chapter14summary", 
        "title": "Chapter 14 Summary"
    }, 
    {
        "text": "In this chapter, we define a series of steps to assist with the debugging process. We look at printing variables and other information to the console to help understand how a program is running and identify problems.", 
        "id": "ch_15.html", 
        "title": "Debugging Logic"
    }, 
    {
        "text": "Printing to the console helps you debug and learn the state of your program. The print statement evaluates its argument and displays it in the console. To evaluate an expression is to simplify it to its basic form, like showing what a variable or a mathematical expression equals. The expression that print evaluates can be any data type. Refer to Chapter 2 for a review of data types. Note that in Python, print is different from other functions because we do not use it with parentheses.", 
        "id": "ch_15.html#printingtotheconsole", 
        "title": "Printing to the Console"
    }, 
    {
        "text": "Printing, commenting, and the console can all be used to debug your code. Try following these steps if you run into an error.", 
        "id": "ch_15.html#thedebuggingprocess", 
        "title": "The Debugging Process"
    }, 
    {
        "text": "The following list expands on some common errors covered previously and details some additional common errors.", 
        "id": "ch_15.html#commonerrors", 
        "title": "Common Errors"
    }, 
    {
        "text": "The following exercises expand on the knowledge of common errors and how they can be handled in code.", 
        "id": "ch_15.html#moredebuggingexercises", 
        "title": "More Debugging Exercises"
    }, 
    {
        "text": "The print statement evaluates its accompanying expression and displays the result in the console. It is a useful tool for debugging because it allows the programmer to learn the state of the program.", 
        "id": "ch_15.html#chapter15summary", 
        "title": "Chapter 15 Summary"
    }, 
    {
        "text": "The idea of correct and complete code was examined in Chapter 8. Here, we further extend the concept of correctness to improve the overall conciseness and clarity of a script.", 
        "id": "ch_16.html", 
        "title": "Evaluating Correctness: Part Two"
    }, 
    {
        "text": "Conciseness means brief, but comprehensive, code that accomplishes its goal efficiently. We have seen some examples of improving conciseness in previous chapters. For-loops can replace repetitive fitMedia() and makeBeat() calls. Custom functions package up repetitive blocks of code, allowing the same code to be easily reused. It is still important to note that conciseness should not sacrifice completeness.", 
        "id": "ch_16.html#conciseness", 
        "title": "Conciseness"
    }, 
    {
        "text": "Clarity relates to how well code communicates its function and the programmer\u2019s intent. Others are likely to read your code at some point. If your peers are getting lost or confused by your code, it is probably unclear. In EarSketch, we can improve clarity by using appropriate variable and function names and using computational structures like loops and custom functions. For example, the name of a for-loop counter variable should reflect its purpose, like measure or track, whenever possible. Although it will not affect musical output, it is most logical to write code in the order sounds will appear in the DAW. Commenting is also essential; comment on any logic that may be confusing or challenging to understand, and add a short description of what each block of code does to help the user determine program flow.", 
        "id": "ch_16.html#clarity", 
        "title": "Clarity"
    }, 
    {
        "text": "The script header is an important part of every EarSketch script. It is broken into four sections: language, script name, author, and description. The purpose of a script header is simple; it helps the programmer and others understand the function and purpose of the script. The description section of the header should make clear the main goals and objectives of the script. In this way, it is useful for checking the correctness and completeness of your script (refer back to Chapter 8). If your output does not match the description, a reevaluation of correctness is needed.", 
        "id": "ch_16.html#scriptheaders", 
        "title": "Script Headers"
    }, 
    {
        "text": "Concise code is brief, but comprehensive, and accomplishes its goal efficiently. However, writing code that is concise should not come at the expense of completeness.", 
        "id": "ch_16.html#chapter16summary", 
        "title": "Chapter 16 Summary"
    }, 
    {
        "text": "The second unit covered concepts that allow code to be written more clearly and concisely. Additionally, new EarSketch functionality was introduced. Let\u2019s review.", 
        "id": "ch_u2_summary.html", 
        "title": "Unit 2 Summary"
    }, 
    {
        "text": "In the final unit of the EarSketch curriculum, we move beyond traditional composition techniques. A typical recording is fixed; you will hear the same music every time you press play. What if this wasn\u2019t the case? Imagine a piece of music that changed every time it was played. As you may have guessed, computer code makes this possible. In this unit, we will use EarSketch to create music that is dynamic and interactive. The same kinds of techniques we learn here are also used in music jukebox software like iTunes, in DJ apps, and in many other interactive music applications.", 
        "id": "ch_u3_intro.html", 
        "title": "Unit 3 Introduction"
    }, 
    {
        "text": "This chapter covers methods for adding interactivity and decision making to programs.", 
        "id": "ch_17.html", 
        "title": "Console Input and Conditionals"
    }, 
    {
        "text": "Printing to the console allows information to be displayed to the user. Console Input is text-based data taken from the keyboard, giving a program access to information from the user. Together, printing and console input can be used to allow the user to interact with a program.", 
        "id": "ch_17.html#consoleinput", 
        "title": "Console Input"
    }, 
    {
        "text": "All computer decisions are based on conditions built out of a simple logic called Boolean Logic. The boolean data type has 2 possible values, True and False. This contrasts with the other data types (int, float, string) that have many possible values. The True and False values always start with a capital letter and, unlike string values, do not have quotes.", 
        "id": "ch_17.html#booleans", 
        "title": "Booleans"
    }, 
    {
        "text": "Boolean logic allows a program to make a decision based on a condition. A condition is an expression that evaluates to a boolean, either True or False.  The if statement executes specific lines of code only when its condition is True. Like other Python constructs, the lines of code to be executed are grouped into an indented block beneath the statement. Additionally, a colon (:) follows the statement. The syntax for an if statement is shown below.", 
        "id": "ch_17.html#conditionalstatements", 
        "title": "Conditional Statements"
    }, 
    {
        "text": "A program can access information from the user via console input, text-based data taken from the keyboard. The readInput() function is used to take console input. It displays its argument to the user as a prompt.", 
        "id": "ch_17.html#chapter17summary", 
        "title": "Chapter 17 Summary"
    }, 
    {
        "text": "This chapter focuses on lists, also called arrays in some programming languages. Lists are a structure for efficiently storing data in EarSketch, especially audio clips. In addition, new functionality of makeBeat() is covered.", 
        "id": "ch_18.html", 
        "title": "Data Structures"
    }, 
    {
        "text": "A list is a collection of values combined into a single entity. They enable a single variable to store multiple items that can be easily retrieved. These items, referred to as list elements, can be any data type. We have seen lists created by the range() function previously. Now, we focus on manually created lists, using brackets ([]).", 
        "id": "ch_18.html#datastructurebasics", 
        "title": "Data Structure Basics"
    }, 
    {
        "text": "For-loops are a convenient way to read through a list from first to last index. The loop in the following example reads through myList and prints each string element in order. The len() function is used to determine how many loops are needed to iterate through the whole list.", 
        "id": "ch_18.html#iteratingthroughadatastructure", 
        "title": "Iterating Through a Data Structure"
    }, 
    {
        "text": "makeBeat() has the ability to handle multiple clips at once, allowing a single function call to trigger multiple samples. Passing in a beat string containing numbers 0 through 9 points makeBeat() to the list index of the corresponding sample. All clips must be stored in the same list to use this functionality. Check out the example below to see makeBeat() in action.", 
        "id": "ch_18.html#usingdatastructureswithmakebeat", 
        "title": "Using Data Structures with makeBeat"
    }, 
    {
        "text": "A list is a collection of values combined into a single entity, an efficient way to store data. Items stored within a list, or elements, can be any data type.", 
        "id": "ch_18.html#chapter18summary", 
        "title": "Chapter 18 Summary"
    }, 
    {
        "text": "This chapter covers two data structure operations: slicing and concatenation. Manipulation of these structures provides opportunities to create interesting musical changes.", 
        "id": "ch_19.html", 
        "title": "Data Structure Operations"
    }, 
    {
        "text": "List Operations are a set of tools for modifying a list. We performed similar operations on strings in Chapter 13. Slice notation can be used to create a subset of a list from a larger, existing list. Its syntax is newList = oldList[startIndex: endIndex]. As with string slices, the indices for slice notation are inclusive and exclusive, respectively.", 
        "id": "ch_19.html#procedure", 
        "title": "Procedure"
    }, 
    {
        "text": "Lists can be concatenated and sliced using list operations, a set of tools for modifying a list.", 
        "id": "ch_19.html#chapter19summary", 
        "title": "Chapter 19 Summary"
    }, 
    {
        "text": "Introducing randomness in music creates a sense of novelty, leading to a more improvisational feel. In this chapter, we turn some control over to the computer, allowing it to introduce elements of randomness into our music.", 
        "id": "ch_20.html", 
        "title": "Randomness"
    }, 
    {
        "text": "A random number is a generated value that is impossible to predict. A random integer can be generated in Python with the randint() function. randint() is part of Python\u2019s random API, so we need to import it as part of our script setup. Just like we import the EarSketch API with from earsketch import *, the random API is imported with from random import *.", 
        "id": "ch_20.html#randomnumbers", 
        "title": "Random numbers"
    }, 
    {
        "text": "Let\u2019s remix a popular rhythm, the amen break, by introducing a random drum pattern. The amen break is widely sampled in electronic music. The code for this particular rhythm is shown below. Two separate makeBeat() calls are used, one to handle the kick and snare, and the other for a series of cymbals. The beat strings used in these function calls are the result of concatenating a set of smaller substrings. This allows us to better understand the structure of the rhythm.", 
        "id": "ch_20.html#remixingarhythm", 
        "title": "Remixing a Rhythm"
    }, 
    {
        "text": "Random numbers generated within a program are impossible to predict.", 
        "id": "ch_20.html#chapter20summary", 
        "title": "Chapter 20 Summary"
    }, 
    {
        "text": "In Chapter 8 and Chapter 16, we examined how to personally ensure that our code is correct, complete, concise, and clear. Here we focus on using and giving peer feedback. Additionally, the process of sharing an EarSketch script is covered.", 
        "id": "ch_21.html", 
        "title": "Evaluating Correctness: Part 3"
    }, 
    {
        "text": "Peer Feedback is the practice of exchanging constructive information between colleagues. It provides the opportunity to learn from each other. In programming, it can give you the chance to make improvements to the functionality, clarity, and correctness of code. In music, it can give you the chance to reflect on and revise musical form, pacing, track, sound, and effects content. Feedback is most effectively communicated if it is constructive, meaning it builds a peer up, rather them breaking them down.", 
        "id": "ch_21.html#peerfeedback", 
        "title": "Peer Feedback"
    }, 
    {
        "text": "There are many effective techniques for approaching a peer-review process. Here, we present just one: Critical Response Process (CRP), developed by choreographer Liz Lerman. This process is made up of four steps:", 
        "id": "ch_21.html#criticalresponseprocess", 
        "title": "Critical Response Process"
    }, 
    {
        "text": "Working collaboratively can help you achieve more than working by yourself, allowing you to learn from your classmates and share your knowledge. Discovering your partner\u2019s strengths, as well as what you can bring to the table, is an important part of teamwork. Likewise, learning from your peers is a great resource. In coding and music practices, teams often work together to produce better products\u2014\u200bcomposers often team up with musicians, recording engineers, and producers to make an album. Similarly, programmers divide tasks and roles, such as in pair programming, where one individual \"drives\" (writes the code) and another person \"navigates\" (reviews each line as it is written). You should take turns being the \"driver\" and \"navigator,\" developing the skill sets needed for both roles!", 
        "id": "ch_21.html#collaboration", 
        "title": "Collaboration"
    }, 
    {
        "text": "Let\u2019s walk through how to share an EarSketch Script step by step. Check out the following video or use the text below.", 
        "id": "ch_21.html#sharinganearsketchscript", 
        "title": "Sharing an EarSketch Script"
    }, 
    {
        "text": "Exchanging constructive information with others is a form of peer feedback. It provides the opportunity to learn from others.", 
        "id": "ch_21.html#chapter21summary", 
        "title": "Chapter 21 Summary"
    }, 
    {
        "text": "Let\u2019s review the last unit.", 
        "id": "ch_u3_summary.html", 
        "title": "Unit 3 Summary"
    }, 
    {
        "text": "Up until now, you have been combining audio clips and effects to create music. What if you could get the computer to listen to parts of your composition and change the music based on how it sounds?", 
        "id": "ch_22.html", 
        "title": "Teaching Computers to Listen"
    }, 
    {
        "text": "Using a computer to analyze music is part of an area of music technology called Music Information Retrieval (MIR). MIR is widely used in the music technology industry. MIR allows you to do things such as detect a piece of music\u2019s genre, or identify a song by humming it into your phone. In EarSketch we can analyze music and determine the volume or the brightness of a sound.", 
        "id": "ch_22.html#musicinformationretrieval", 
        "title": "Music Information Retrieval"
    }, 
    {
        "text": "Every sound can be analyzed in terms of its features. Features are the ways a computer understands sounds. The analyze() function allows you to find the volume of the sound with RMS_AMPLITUDE. analyze()  also lets you work out how bright or dark a sound is with SPECTRAL_CENTROID. You can think of this as the amount of high sounds (bright) or low sounds (dark). More information on SPECTRAL_CENTROID and RMS_AMPLITUDE is available in the Reference Section.", 
        "id": "ch_22.html#analysisfeatures", 
        "title": "Analysis Features"
    }, 
    {
        "text": "Suppose we want to add a clip to the DAW if both the spectral centroid (brightness/darkness) AND the RMS amplitude (volume) are above a certain amount. How can we check for two conditions together?", 
        "id": "ch_22.html#booleanoperators", 
        "title": "Boolean Operators"
    }, 
    {
        "text": "Music Information Retrieval (MIR) is a field in music technology that includes ways for a computer to listen to music.", 
        "id": "ch_22.html#chapter22summary", 
        "title": "Chapter 22 Summary"
    }, 
    {
        "text": "If you could hear this image of the Orion Nebula, what would it sound like?", 
        "id": "ch_23.html", 
        "title": "Sonification"
    }, 
    {
        "text": "If you could hear this image of the Orion Nebula, what would it sound like?", 
        "id": "ch_23.html#imagesasdata", 
        "title": "Images as Data"
    }, 
    {
        "text": "We now know that any image is made up of a large number of pixels, each of which has number values that represent colors and brightness. Consider this row of four (zoomed in) pixels:", 
        "id": "ch_23.html#multidimensionalData", 
        "title": "Multidimensional Lists and Arrays"
    }, 
    {
        "text": "After you\u2019ve made a guess about the data, here\u2019s a way for you to check it. If you want to work with images in EarSketch, you can use our importImage function that converts any image into data that can be used within EarSketch. importImage takes 3 required arguments (and one optional argument for color data). These are the 3 basic arguments:", 
        "id": "ch_23.html#importimage", 
        "title": "importImage"
    }, 
    {
        "text": "Now that we know how to turn an image into data using importImage, we can use EarSketch to turn that data into sound. Let\u2019s go back to our checkerboard. We can turn it into a drum beat by writing code that will create a beat with hits on the black squares and rests on the white squares.", 
        "id": "ch_23.html#nestedloops", 
        "title": "Nested Loops"
    }, 
    {
        "text": "Sonification is way to turn any data into audio.", 
        "id": "ch_23.html#chapter23summary", 
        "title": "Chapter 23 Summary"
    }, 
    {
        "text": "In this section, we\u2019ll learn more about what we can do with analysis features and lists. A list is a data structure that provides a way of storing and indexing many values in a single variable. These values will often be unsorted and just in the order we entered them in. However, we may want to order these values, such as from smallest to largest. To see how, try running the following code:", 
        "id": "ch_24.html", 
        "title": "Sorting"
    }, 
    {
        "text": "In this section, we\u2019ll learn more about what we can do with analysis features and lists. A list is a data structure that provides a way of storing and indexing many values in a single variable. These values will often be unsorted and just in the order we entered them in. However, we may want to order these values, such as from smallest to largest. To see how, try running the following code:", 
        "id": "ch_24.html#sortingandanalysis", 
        "title": "Sorting and Analysis"
    }, 
    {
        "text": "A list is a way to store and index variables.", 
        "id": "ch_24.html#chapter24summary", 
        "title": "Chapter 24 Summary"
    }, 
    {
        "text": "In this module, we introduce an important concept in both computer science and artistic practice: the idea of self-similarity, and its related programming technique recursion. Self-similarity is when a part of an object is similar to the entire object.", 
        "id": "ch_25.html", 
        "title": "Recursion"
    }, 
    {
        "text": "In this module, we introduce an important concept in both computer science and artistic practice: the idea of self-similarity, and its related programming technique recursion. Self-similarity is when a part of an object is similar to the entire object.", 
        "id": "ch_25.html#whatisafractal", 
        "title": "What is a Fractal?"
    }, 
    {
        "text": "In computer science, one of the main ways that self-similarity is shown is through a technique called recursion. Recursion is found whenever a function calls itself from within the body of its own code. In the example function countdown() below, we can see at that it calls itself from within its own body of code. This means that countdown() is a recursive function, and the call inside itself is a recursive call.", 
        "id": "ch_25.html#whatisrecursionpt1", 
        "title": "What is Recursion? (Part 1)"
    }, 
    {
        "text": "Now that we understand the basics of recursion, it\u2019s time to see how we can use recursion to make music with EarSketch.", 
        "id": "ch_25.html#whatisrecursionpt2", 
        "title": "What is Recursion? (Part 2)"
    }, 
    {
        "text": "As a straightforward example of self-similarity that may be used toward great musical effect, consider the Cantor Set shown below.", 
        "id": "ch_25.html#cantorset", 
        "title": "Cantor Set"
    }, 
    {
        "text": "Self-similarity refers to a part of an object being similar to the object as a whole.", 
        "id": "ch_25.html#chapter25summary", 
        "title": "Chapter 25 Summary"
    }, 
    {
        "text": "In this chapter we\u2019re going to show ways you can create visuals that react to the music you have been composing. Visualizations can be created from any data such as music. After these tutorials you will be able to make visuals like the one shown below:", 
        "id": "ch_26.html", 
        "title": "Visualizations, Part 1: Color, 2D Space, Basic Animation"
    }, 
    {
        "text": "You may already know colors can be created by putting different colors together. This can happen with paint when you combine two colors, such as red and blue to make purple. Computers think of all colors by how much of red, green and blue makes up the color. This is then stored as an RGB (red, green, blue) value.\nRGB values are between 0 (not used at all) to 255 (full intensity). RGB values do not always have the same results as you might think from using paint, so you may want to check the table below.", 
        "id": "ch_26.html#rgbcolorandhexnotation", 
        "title": "RGB Color and Hex Notation"
    }, 
    {
        "text": "For the next section we will need some music in our project to generate visuals. If you have a song prepared already, load it up. If not, feel free to use this one or quickly make your own:", 
        "id": "ch_26.html#basicdrawingwithdrawrectangle", 
        "title": "Basic Drawing with drawRectangle()"
    }, 
    {
        "text": "Let\u2019s now make a major change to our code. Your code should now look something like this.", 
        "id": "ch_26.html#basicanimationwithonmeasure", 
        "title": "Basic Animation with onMeasure()"
    }, 
    {
        "text": "In this unit, you learned how to implement the drawRectangle() function to draw graphics to the canvas, using hex-notated colors and x-y coordinates. You then applied those concepts to a basic animation using the onMeasure() function, which is defined by the user and called automatically and repeatedly, in rhythm with the music.", 
        "id": "ch_26.html#conclusion", 
        "title": "Conclusion"
    }, 
    {
        "text": "Computers store colors as amounts of red, green and blue (RGB).", 
        "id": "ch_26.html#chapter26summary", 
        "title": "Chapter 26 Summary"
    }, 
    {
        "text": "We\u2019ve now gotten familiar with using colors, shapes, and space for animation. We\u2019ll now use those tools to make a visulization.", 
        "id": "ch_27.html", 
        "title": "Visualizations, Part 2: Using Amplitude, onLoop()"
    }, 
    {
        "text": "We\u2019ve defined onLoop(), which is called nearly 60 times per second. Let\u2019s now examine the details of our definition.", 
        "id": "ch_27.html#definingonloopandgettingaudiodata", 
        "title": "Defining onLoop() and Getting Audio Data"
    }, 
    {
        "text": "Now that we have this non-visual data (the real-time amplitude of the track), we can translate it into a visual representation, thereby performing a visualization of our music. We do that as follows:", 
        "id": "ch_27.html#shapesreactingtosound", 
        "title": "Shapes Reacting to Sound"
    }, 
    {
        "text": "To get even more comfortable with these concepts, try to modify the visualization from this unit so that the bars grow from the bottom of the canvas towards the top (rather than from the left towards the right). Or, try to add another audio track and fit another bar on the canvas.", 
        "id": "ch_27.html#Exercise", 
        "title": "Exercise"
    }, 
    {
        "text": "This unit offers a further example of what can be done with EarSketch\u2019s visualization features. Below is a video of what we will be making in this unit. It is an application of randomness and transparency, using both onMeasure() and onLoop().", 
        "id": "ch_28.html", 
        "title": "Visualizations, Supplemental: Randomness, Transparency"
    }, 
    {
        "text": "This unit offers a further example of what can be done with EarSketch\u2019s visualization features. Below is a video of what we will be making in this unit. It is an application of randomness and transparency, using both onMeasure() and onLoop().", 
        "id": "ch_28.html#initialSteps", 
        "title": "Initial Steps"
    }, 
    {
        "text": "In order to draw the various circles to the canvas, we\u2019re going to need to keep track of where they should be. We\u2019re going to create arrays of x- and y-coordinates for each color of circle, as follows:", 
        "id": "ch_28.html#populatingthearrays", 
        "title": "Populating the Arrays"
    }, 
    {
        "text": "Let\u2019s now define onLoop() and get some shapes drawn to the canvas:", 
        "id": "ch_28.html#ourdrawingloop", 
        "title": "Our Drawing Loop"
    }, 
    {
        "text": "Run and Play the code that\u2019s been discussed so far, and take a look at the results. Because we used randomness, your canvas probably won\u2019t look exactly like the one in the video, but it will be similar.", 
        "id": "ch_28.html#Exercises", 
        "title": "Exercises"
    }, 
    {
        "text": "Randomness can be used to get different results and to avoid manually entering values.", 
        "id": "ch_28.html#chapter28summary", 
        "title": "Chapter 28 Summary"
    }, 
    {
        "text": "Click Here to open the EarSketch API.", 
        "id": "ch_29.html", 
        "title": "The EarSketch API"
    }, 
    {
        "text": "BANDPASS is a filter that only passes (lets through) an adjustable-sized band of frequencies. All other frequencies are suppressed. By greatly limiting the frequency range of the original sound (when setting BANDPASS_WIDTH to a relatively small value), filter can produce special-effect sounds, such as the \u201cmegaphone\u201d sound that is popular in some modern rock music, or a telephone or small speaker sound. By using a wider frequency range (setting BANDPASS_WIDTH to a higher value), sounds that appear \u201ctoo big\u201d for a mix may be made to sound a little smaller so that they blend better with other sounds in the mix.", 
        "id": "ch_30.html", 
        "title": "Every Effect Explained in Detail"
    }, 
    {
        "text": "BANDPASS is a filter that only passes (lets through) an adjustable-sized band of frequencies. All other frequencies are suppressed. By greatly limiting the frequency range of the original sound (when setting BANDPASS_WIDTH to a relatively small value), filter can produce special-effect sounds, such as the \u201cmegaphone\u201d sound that is popular in some modern rock music, or a telephone or small speaker sound. By using a wider frequency range (setting BANDPASS_WIDTH to a higher value), sounds that appear \u201ctoo big\u201d for a mix may be made to sound a little smaller so that they blend better with other sounds in the mix.", 
        "id": "ch_30.html#bandpass", 
        "title": "BANDPASS"
    }, 
    {
        "text": "CHORUS creates various copies of the original sound which get varied slightly in pitch and time, and mixed back in to the sound, creating an ensemble-like effect of many voices playing together. At extreme values of parameter settings, artificial \u201crobot-like\u201d sounds can be heard.", 
        "id": "ch_30.html#chorus", 
        "title": "CHORUS"
    }, 
    {
        "text": "COMPRESSOR is a basic two-parameter compressor, which reduces the volume of the loudest sounds of the effected track, while amplifying the volume of its quietest sounds. This creates a narrower dynamic range from the original sound, and is often used to maximize the punch of the original sound, while reducing the potential for noise to be added later.", 
        "id": "ch_30.html#compressor", 
        "title": "COMPRESSOR"
    }, 
    {
        "text": "DELAY creates a repeated echo-like delay of the original sound. A delay effect plays back the original audio as well as a delayed, quieter version of the original that sounds like an echo. After the first echo, it plays an echo of the echo (even quieter), then an echo of the echo of the echo (still quieter), and so on until the echo dies out to nothing. With the delay effect, we can control how much time passes between each echo (delay time). If we set the delay time to match the length of a beat, we can create rhythmic effects with delay.", 
        "id": "ch_30.html#delay", 
        "title": "DELAY"
    }, 
    {
        "text": "DISTORTION creates a \u201cdirty\u201d or \u201cfuzzy\u201d sound by overdriving the original sound. This compresses or clips the sound wave, adding overtones (higher frequencies related to the original sound). It is common to distort an electric guitar sound by \u201coverdriving\u201d the guitar amplifier. Modern music sometimes uses distortion to add a grungy or gritty effect or feel to the composition.", 
        "id": "ch_30.html#distortion", 
        "title": "DISTORTION"
    }, 
    {
        "text": "EQ3BAND is a three-band equalizer used for simple EQ tasks. An equalizer is used to adjust the volume of separate ranges of frequencies within an audio track. This particular effect can be used to adjust the volume of three ranges (\u201cbands\u201d) of frequency content, namely bass, midrange, and treble (low, mid, high), where the upper border (EQ3BAND_LOWFREQ) of the low range and the center frequency of the mid range (EQ3BAND_MIDFREQ) may be set by the user.", 
        "id": "ch_30.html#eq3band", 
        "title": "EQ3BAND"
    }, 
    {
        "text": "FILTER is a standard low-pass filter with resonance. A low-pass filter effect allows low frequency audio to pass through unchanged, while lowering the volume of the higher frequencies above a cutoff frequency (the FILTER_FREQ parameter). This gives the audio a \u201cdarker\u201d sound.", 
        "id": "ch_30.html#filter", 
        "title": "FILTER"
    }, 
    {
        "text": "FLANGER is similar to a chorus effect, where various copies of the original sound are created which get varied slightly in pitch and time, and mixed back in to the sound. In contrast, a flanger uses a much finer range of time values, which creates an evolving \u201cwhoosh\u201d like sound. At extreme values of parameter settings, more artificial \u201crobot-like\u201d sounds can be heard.", 
        "id": "ch_30.html#flanger", 
        "title": "FLANGER"
    }, 
    {
        "text": "PAN affects the audio mix between the left and right channels. For example, if you were wearing headphones, changing the panning would affect whether you heard something in the left ear or the right.", 
        "id": "ch_30.html#pan", 
        "title": "PAN"
    }, 
    {
        "text": "PHASER is a sweeping-sounding effect which creates a copy of the original sound over a specified range of frequencies. This effected copy is then delayed very slightly and played against the original sound while changing its slight delay time gently back and forth. This causes some of the copied frequencies to temporarily cancel each other out by going \u201cin and out of phase\u201d with each other, thus creating a sweeping effect.", 
        "id": "ch_30.html#phaser", 
        "title": "PHASER"
    }, 
    {
        "text": "PITCHSHIFT simply lowers or raises the sound by a specific pitch interval (PITCHSHIFT_SHIFT). It can be useful in helping multiple sound files sound better together or, contrastingly, to add a little bit of dissonance, if desired.", 
        "id": "ch_30.html#pitchshift", 
        "title": "PITCHSHIFT"
    }, 
    {
        "text": "REVERB adds a slowly decaying ambiance to the source signal, which is similar to DELAY but is often much denser and richer. It is widely used for audio mixing and spatialization.", 
        "id": "ch_30.html#reverb", 
        "title": "REVERB"
    }, 
    {
        "text": "RINGMOD multiplies the signals from two sounds together: your original sound and a pure sine wave (that sounds like a tuning fork). The effect of this multiplication sounds different at every frequency of the original sound, which creates a completely artificial-sounding result, as this type of sound could never occur naturally. Some parameter settings for this effect will likely produce recognizable-sounding effects similar to ones used in old science-fiction movies. It is useful experimenting with since there are a wide range of sounds that can be generated from your original sound.", 
        "id": "ch_30.html#ringmod", 
        "title": "RINGMOD"
    }, 
    {
        "text": "TREMOLO quickly changes the volume of the original sound back and forth from its original value towards silence, resulting in a wobbling-sounding effect.", 
        "id": "ch_30.html#tremolo", 
        "title": "TREMOLO"
    }, 
    {
        "text": "VOLUME allows you to change the volume of an audio clip.", 
        "id": "ch_30.html#volume", 
        "title": "VOLUME"
    }, 
    {
        "text": "WAH is a resonant bandpass filter (see BANDPASS effect) that creates a \u201cwah-wah\u201d pedal sound when changed over time using envelopes in the setEffect() function.", 
        "id": "ch_30.html#wah", 
        "title": "WAH"
    }, 
    {
        "text": "Console message: ImportError: The appropriate packages cannot be found or imported.", 
        "id": "ch_31.html", 
        "title": "Every Error Explained in Detail"
    }, 
    {
        "text": "Console message: ImportError: The appropriate packages cannot be found or imported.", 
        "id": "ch_31.html#importerror", 
        "title": "Import Error"
    }, 
    {
        "text": "Console message: IndentationError: There is an indentation error in the code (lack of or extra spaces).", 
        "id": "ch_31.html#indentationerror", 
        "title": "Indentation Error"
    }, 
    {
        "text": "Console message: IndexError: There is an error using an out of range index.", 
        "id": "ch_31.html#indexerror", 
        "title": "Index Error"
    }, 
    {
        "text": "Console message: NameError: There is an error with a variable or function name that is not defined.", 
        "id": "ch_31.html#nameerror", 
        "title": "Name Error"
    }, 
    {
        "text": "Console message: ParseError: There is an error when reading the code.", 
        "id": "ch_31.html#parseerror", 
        "title": "Parse Error"
    }, 
    {
        "text": "Console message: SyntaxError: There is an error with the syntax (or arrangement) of code.", 
        "id": "ch_31.html#syntaxerror", 
        "title": "Syntax Error"
    }, 
    {
        "text": "Console message: TypeError: There is an error with the expected data type.", 
        "id": "ch_31.html#typeerror", 
        "title": "Type Error"
    }, 
    {
        "text": "Console message: ValueError: A provided argument is not within the set or range of acceptable values for a function.", 
        "id": "ch_31.html#valueerror", 
        "title": "Value Error"
    }, 
    {
        "text": "This document details each of the Analysis features that can be used with the analysis functions in the EarSketch API (analyze(),analyzeForTime(), analyzeTrack(), and analyzeTrackForTime()). Each of these features can be used by using the appropriate constant (which is specified with each description). These features are possible ways to determine differences in audio samples. This difference, or timbre, is how humans are able to tell the difference between instruments. For example, it\u2019s possible to distinguish between playing a C note on a piano, from a C note on a trombone. Each of these measurements returns a value between 0.0 and 1.0, and it is encouraged to try out different features if one does not work for your particular situation.", 
        "id": "ch_32.html", 
        "title": "Analysis Features"
    }, 
    {
        "text": "Constant \u2013 SPECTRAL_CENTROID", 
        "id": "ch_32.html#spectralcentroid", 
        "title": "Spectral Centroid"
    }, 
    {
        "text": "Here is an image of a low spectral centroid:", 
        "id": "ch_32.html#spectrumofalowspectralcentroidvalue", 
        "title": "Spectrum of a low Spectral Centroid value:"
    }, 
    {
        "text": "Here is an image of a high spectral centroid:", 
        "id": "ch_32.html#spectrumofahighspectralcentroidvalue", 
        "title": "Spectrum of a high Spectral Centroid value:"
    }, 
    {
        "text": "Constant \u2013 RMS_AMPLITUDE", 
        "id": "ch_32.html#rmsamplitude", 
        "title": "RMS Amplitude"
    }, 
    {
        "text": "Here is an image of a low RMS amplitude:", 
        "id": "ch_32.html#timevsamplitudeplotofalowrmsamplitudevalue", 
        "title": "Time vs. Amplitude plot of a low RMS Amplitude value:"
    }, 
    {
        "text": "Here is an image of a high RMS amplitude:", 
        "id": "ch_32.html#timevsamplitudeplotofahighrmsamplitudevalue", 
        "title": "Time vs. Amplitude plot of a high RMS Amplitude value:"
    }, 
    {
        "text": "The 16 elements of a beat string make up the 16 sixteenth notes found in one measure of 4/4 time. In creating beats with makeBeat() the style, instrument, and role of the beat should be taken into consideration in creating the rhythm pattern. This guide will provide sample rhythm patterns in the style of 4/4 Time, Hip Hop, Funk, Dubstep, and African Drum Ensemble based patterns. This will not represent a complete list of patterns, rather it will act as a guide in identifying the characteristics of percussion beats and provide string example for makeBeat().", 
        "id": "ch_33.html", 
        "title": "Creating Beats with makeBeat"
    }, 
    {
        "text": "The drum set or percussion line can be divided into three elements:", 
        "id": "ch_33.html#thethreeelementsofapercussionline", 
        "title": "The three elements of a percussion line"
    }, 
    {
        "text": "Hip Hop and Funk both function well at tempos between 84 and 92 beats per minute. If you use a running beat of 8ths, the style will gravitate closer to Hip Hop. A running beat of 16ths will simulate a funk style.", 
        "id": "ch_33.html#somefunkandhiphopbeats", 
        "title": "Some Funk and Hip Hop Beats"
    }, 
    {
        "text": "Dubstep music usually is played faster than 136 beats per minute with a \u2018halftime\u2019 feel using triplet style rhythms in the Bass Drum and Back Beat. Beats here will simulate the triplet style with a 3-sixteenth, 3-sixteenth, 2-sixteenth pattern. Dubstep music also has longer patterns, usually extending across 4 measures, so the different beats are meant to be played in succession. Dubstep music also \u2018breaks\u2019 the Bass on 1 and 3 and the Back Beat on 2 and 4 rules.", 
        "id": "ch_33.html#dubstepstylebeats", 
        "title": "Dubstep Style Beats:"
    }, 
    {
        "text": "These patterns seek to emulate the style of drumming ensembles and multi-layered percussion music based on African music. The patterns here are adapted from the \u201cUnifix Patterns\u201d as presented on the Phil Tulga website. The drum patterns are designed to \u201cweave\u201d in and out and each pattern complements the other. These patterns also demonstrate the use of lists.", 
        "id": "ch_33.html#africanstyledrummingpatterns", 
        "title": "African Style Drumming Patterns"
    }, 
    {
        "text": "To find sounds that work well together in your music, choose them from the same folder. For example, pick all your sounds from DUBSTEP_140_BPM or all of them from Y30_68_BPM_B_MINOR.", 
        "id": "ch_34.html", 
        "title": "EarSketch Sound Library"
    }, 
    {
        "text": "Online JavaScript Interpreter", 
        "id": "ch_35.html", 
        "title": "Programming Reference"
    }, 
    {
        "text": "Introduction to Programming in Python and EarSketch is a free online textbook that is available as an alternative text to this curriculum. The text includes Python programming examples and exercises both within and outside of EarSketch, and it focuses more on string, list, user input, and file processing. It was developed by collaborators at Georgia Tech and Georgia Gwinnett College specifically for college-level introductory programming courses. To access the online textbook in a new browser window, click this link.", 
        "id": "ch_36.html", 
        "title": "Additional Curricula"
    }, 
    {
        "text": "Groove Machine is shaped like a turntable. It can be used to create musical loops that turn into EarSketch code.", 
        "id": "ch_GrooveMachine.html", 
        "title": "Groove Machine"
    }, 
    {
        "text": "As you work with Groove Machine, the code window below it updates based on the changes you make to the music. Once you are happy with the music you\u2019ve made in Groove Machine, click the paste icon above the code to open the script in the EarSketch\u2019s code editor. Take a look at the script to understand how it works and how you can change it to take the music further.", 
        "id": "ch_GrooveMachine.html#Overview", 
        "title": "Overview"
    }, 
    {
        "text": "Building blocks of  Groove Machine:", 
        "id": "ch_GrooveMachine.html#UnderTheHood", 
        "title": "Under the Hood"
    }, 
    {
        "text": "Line 8 : On this line of the code, you can determine how many octants you would like to have for your music.", 
        "id": "ch_GrooveMachine.html#AdvancedTopics", 
        "title": "Advanced Topics and Exercises"
    }, 
    {
        "text": "To download resources, such as PowerPoint slides and lesson plans, that you can use in your classroom,   click here.", 
        "id": "ch_37.html", 
        "title": "Teacher Materials and Community"
    }, 
    {
        "text": "Welcome to the EarSketch Hour of Code.", 
        "id": "ch_HourOfCode.html", 
        "title": "Hour of Code"
    }, 
    {
        "text": "EarSketch is a platform for making music with code. In this Hour of Code tutorial, you will learn the basics of coding in EarSketch and will be able to make music like this:", 
        "id": "ch_HourOfCode.html#WhatIs", 
        "title": "What is EarSketch?"
    }, 
    {
        "text": "Below is some code created in EarSketch. It is written in a programming language called Python. Click the blue icon in the upper right corner to copy the code into the code editor. Don\u2019t worry about understanding the code yet.", 
        "id": "ch_HourOfCode.html#GettingStarted", 
        "title": "Getting Started"
    }, 
    {
        "text": "Run the example code by pressing the green \"Run\" button at the top of the code editor.", 
        "id": "ch_HourOfCode.html#RunTheCode", 
        "title": "Run The Code"
    }, 
    {
        "text": "Above the clips is a timeline which displays time in seconds (top) and measures (bottom). Measure is a musical term for a length of time.", 
        "id": "ch_HourOfCode.html#Clips", 
        "title": "Adding Sound Clips"
    }, 
    {
        "text": "Let\u2019s change line 7 so the sound clip ends at measure 9 instead of 5. The line should now look like this:", 
        "id": "ch_HourOfCode.html#ChangeEnd", 
        "title": "Changing the End Time of a Clip"
    }, 
    {
        "text": "Now let\u2019s look at line 8. The line reads:", 
        "id": "ch_HourOfCode.html#ChangeStart", 
        "title": "Changing the Start Time of a Clip"
    }, 
    {
        "text": "Now that you know how to change the start and end times of clips in EarSketch, you can customize the music.", 
        "id": "ch_HourOfCode.html#StartAndEnd", 
        "title": "Experiment with Start and End Times"
    }, 
    {
        "text": "Line 14 of the code uses the makeBeat() function. This function allows you to make custom rhythms.", 
        "id": "ch_HourOfCode.html#DrumFills", 
        "title": "Drum Fills"
    }, 
    {
        "text": "In this example, fillA is a variable. Variables hold data such as numbers or words to be used later in the code.", 
        "id": "ch_HourOfCode.html#Vars", 
        "title": "Variables"
    }, 
    {
        "text": "EarSketch has a function called reverseString() which can reverse the order of the characters in a string.", 
        "id": "ch_HourOfCode.html#BeatStrings", 
        "title": "Editing Beat Strings"
    }, 
    {
        "text": "We can use fillRev in a makeBeat() function. Instead of editing the existing makeBeat() function, we will make a new one to add a second drum fill to the music.", 
        "id": "ch_HourOfCode.html#NewFill", 
        "title": "Making a New Fill"
    }, 
    {
        "text": "Use what you\u2019ve learned to write another makeBeat() call at a different measure with a different beat string.", 
        "id": "ch_HourOfCode.html#UserFill", 
        "title": "Add Your Own Fill"
    }, 
    {
        "text": "Throughout the example code, you\u2019ll see section labels such as # Add Sounds, # Fills, and # More Sounds. The \"#\" symbol at the start of the line means that line is a comment. Comments provide information about the code but are ignored by the computer.", 
        "id": "ch_HourOfCode.html#Comments", 
        "title": "Using Comments"
    }, 
    {
        "text": "Under the # More Sounds comment, there is a series of fitMedia() functions that are commented out. Each contains a different sound.", 
        "id": "ch_HourOfCode.html#AddSounds", 
        "title": "Adding More Sounds"
    }, 
    {
        "text": "It is time to make your own music using EarSketch.", 
        "id": "ch_HourOfCode.html#MakeYourOwn", 
        "title": "Make Your Own Song"
    }, 
    {
        "text": "EarSketch offers much more than we had time to cover in the last hour. There is a full length curriculum included in this panel. It can be accessed by clicking the Table of Contents icon at the top right of the browser window.", 
        "id": "ch_HourOfCode.html#GoingFurther", 
        "title": "Going Further With EarSketch"
    }, 
    {
        "text": "Presented by Amazon Future Engineer", 
        "id": "ch_CelebRemix.html", 
        "title": "Celebrity Song Remix"
    }, 
    {
        "text": "Weekly Challenge #6: Remix with Gratitude -", 
        "id": "ch_CelebRemix.html#TheChallenge", 
        "title": "The Challenge"
    }, 
    {
        "text": "This competition is all about sharing your song with the public, and getting as many people to listen as you can.", 
        "id": "ch_CelebRemix.html#HowToEnter", 
        "title": "How to Enter"
    }, 
    {
        "text": "Now that your song is on SoundCloud, you can easily share to other social media!", 
        "id": "ch_CelebRemix.html#Share", 
        "title": "Share on SoundCloud"
    }, 
    {
        "text": "Prizes will include Amazon Gift Cards", 
        "id": "ch_CelebRemix.html#WeeklyPrizes", 
        "title": "Weekly Prizes"
    }, 
    {
        "text": "Do I need a SoundCloud account?", 
        "id": "ch_CelebRemix.html#FAQ", 
        "title": "FAQ"
    }
];