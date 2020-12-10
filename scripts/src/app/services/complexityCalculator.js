import { STRUCTURE_SAMPLES, PY_LIST_FUNCS, PY_STR_FUNCS, PY_CREATE_LIST_FUNCS, PY_CREATE_STR_FUNCS, JS_BUILT_IN_OBJECTS, JS_LIST_FUNCS, JS_STR_FUNCS, JS_STR_LIST_OVERLAP, starterReturns, sampleCode, apiFunctions, simplifiedASTdictionary, bodyIDs, Level3OriginalForPurpose } from 'ccSamples';

/**
/**
 * An angular factory service for parsing and analyzing abstract syntax trees
 * without compiling the script, e.g. to measure code complexity.
 *
 * @module complexityCalculator
 * @author Creston Bunch, Erin Truesdell
 */
app.factory('complexityCalculator', ['esconsole', 'userNotification', function complexityCalculator(esconsole, userNotification) {

    //variable init
    var parentLineNumber = 0;
    var studentCode = [];
    var originalityLines = [], makeBeatRenames = [], userFunctionRenames = [], loopLocations = [], userFunctionParameters = [], flaggedReturns = [], forLoopFuncs = [], uncalledFunctionLines = [];
    var takesArgs = false, returns = false, thisSequenceAlreadyCounted = false;
    var allVariables, functionLines, dataTypes, listFuncs, strFuncs, createListFuncs, createStrFuncs, isJavascript, userFunctionReturns;
    var apiCalls;
    var allCalls;
    var lineDictionary;
    var allConditionals;
    var variableAssignments;
    var results;

    /**  
      * Build the abstract syntax tree for Python. Useful for analyzing script
      * complexity or looking for specific function call e.g. onLoop().
      *
      * @param source {String} The source code to analyze.
      * @private
      */
    function pythonAst(source) {
        try {
            var parse = Sk.parse("<analyzer>", source);
            studentCode = source.split("\n");
            return Sk.astFromParse(parse.cst, "<analyzer>", parse.flags);
        } catch (error) {
            userNotification.show(ESMessages.general.complexitySyntaxError, 'failure2', 5);
            throw error;
        }
    }

    function apiCalls() {
        return apiCalls;
    }

    /**
    *Translate recorded integer values from the results into human-readable English
    *@param resultsObj The results object.
    */
    function translateIntegerValues(resultsObj) {
        Object.keys(resultsObj).forEach(function (key) {

            //0 = does not use 1 = uses 2 = uses original
            if (resultsObj[key] === 0) {
                resultsObj[key] = "Does Not Use";
            }
            else if (resultsObj[key] === 1) {
                resultsObj[key] = "Uses";
            }
            else if (resultsObj[key] === 2) {
                if (key === "consoleInput") {
                    resultsObj[key] = "Takes Console Input Originally";
                }
                else {
                    resultsObj[key] = "Uses Original";
                }
            }
            else if (resultsObj[key] === 3) {
                if (Level3OriginalForPurpose.includes(key)) {
                    resultsObj[key] = "Uses Originally For Purpose";
                }
                else {
                    if (key === "forLoops" && !isJavascript) {
                        resultsObj[key] = "Uses Originally With Range Min/Max";
                    }
                    else if (key === "forLoops" && isJavascript) {
                        resultsObj[key] = "Uses Originally With Two Arguments";
                    }
                    else if (key === "conditionals") {
                        resultsObj[key] = "Uses Originally to Follow Multiple Code Paths";
                    }
                    else if (key === "userFunc") {
                        resultsObj[key] = "Uses and Calls Originally";
                    }
                    else if (key === "consoleInput") {
                        resultsObj[key] = "Takes Input Originally and Uses For Purpose";
                    }
                }
            }

            else {
                //levels 3 and beyond are more topic-specific
                if ((key === "lists" || key === "strings") && resultsObj[key] === 4) {
                    resultsObj[key] = "Uses And Indexes Originally For Purpose OR Uses Originally And Iterates Upon";
                }
                if (key === "variables" && resultsObj[key] === 4) {
                    resultsObj[key] = "Uses Originally And Transforms Value";
                }
                if (key === "forLoops") {
                    if (resultsObj[key] === 4 && !isJavascript) {
                        resultsObj[key] = "Uses Originally With Range Min/Max And Increment";
                    }
                    else if (resultsObj[key] === 4 && isJavascript) {
                        resultsObj[key] = "Uses Originally With Three Arguments";
                    }
                    else if (resultsObj[key] === 5) {
                        resultsObj[key] = "Uses Original Nested Loops";
                    }
                }
            }
            if (key === "userFunc") {
                if (resultsObj[key] === "Returns") {
                    resultsObj[key] = "Uses Originally And Returns Values";
                }
                else if (resultsObj[key] === "Args") {
                    resultsObj[key] = "Uses Originally And Takes Arguments";
                }
                else if (resultsObj[key] === "ReturnAndArgs") {
                    resultsObj[key] = "Uses Originally, Takes Arguments, And Returns Values";
                }
            }
        });
    }

    /*Appends the values in the source array to the target list.
    * @param source {Array} The source array whose values will be appended
    * @param target {Array} The target array to append the values to
    * @returns the target array with values appended.
    */
    function appendArray(source, target) {
        for (var p = 0; p < source.length; p++) {
            target.push(source[p]);
        }
        return target;
    }

    /**
     * Analyze the source code of a Python script.
     * @param source {String} The source code to analyze.
     * @returns {Object} A summary of the analysis.
     */
    function analyzePython(source) {

        apiCalls = [];
        allCalls = [];
        allConditionals = [];
        variableAssignments = [];

        listFuncs = PY_LIST_FUNCS;
        strFuncs = PY_STR_FUNCS;
        createListFuncs = PY_CREATE_LIST_FUNCS;
        createStrFuncs = PY_CREATE_STR_FUNCS;

        //initialize all of the lists we'll use in each code reading
        originalityLines = [];
        loopLocations = [];
        dataTypes = [];
        functionLines = [];
        uncalledFunctionLines = [];
        userFunctionParameters = [];
        makeBeatRenames = [];
        userFunctionRenames = [];
        forLoopFuncs = [];
        allVariables = [];

        //initialize list of function return objects with all functions from the API that return something (includes casting), using a slice to make a copy so as not to overwrite anything in starterReturns
        userFunctionReturns = starterReturns.slice(0);

        var ast = pythonAst(source);
        replaceNumericUnaryOps(ast.body);
        //initialize the results object
        var resultsObject = {
            userFunc: 0,
            conditionals: 0,
            forLoops: 0,
            lists: 0,
            strings: 0,
            ints: 0,
            floats: 0,
            booleans: 0,
            variables: 0,
            listOps: 0,
            strOps: 0,
            boolOps: 0,
            comparisons: 0,
            mathematicalOperators: 0,
            consoleInput: 0
        };
        isJavascript = false;

        //PASS 0: efficient originality
        checkOriginality();
        //PASS 1: Do the same thing for function returns from user-defined functions
        evaluateuserFunctionParameters(ast, resultsObject);
        //PASS 2: Gather and label all user-defined variables. If the value is a function call or a BinOp
        gatherAllVariables(ast);
        //PASS 3: Account for the variables that only exist as function params.
        evaluateFunctionReturnParams(ast);
        //use information gained from labeling user functions to fill in missing variable info, and vice-versa.
        var iterations = 0;
        while (!allReturnsFilled() && iterations < 10) {
            evaluateAllEmpties();
            iterations++;
        }
        recursiveAnalyzeAST(ast, resultsObject, [false, false]);
        //PASS 4: Actually analyze the Python.

        //boolops and comparisons count as boolean values, so if they're used at a certain level, booleans should be AT LEAST the value of these
        if (resultsObject.boolOps > resultsObject.booleans) {
            resultsObject.booleans = resultsObject.boolOps;
        }
        if (resultsObject.comparisons > resultsObject.booleans) {
            resultsObject.booleans = resultsObject.comparisons;
        }

        //console.log(lineDict());

        translateIntegerValues(resultsObject);   //translate the calculated values
        lineDict();
        results = resultsObject;
        return resultsObject;
    }

    /* Replaces AST nodes for objects such as negative variables to eliminate the negative for analysis
    * @param ast - the Python or Javascript AST object
    */
    function replaceNumericUnaryOps(ast) {
        for (var i in ast) {
            if (ast[i] != null && ast[i]._astname != null) {
                if (ast[i]._astname === "UnaryOp" && (ast[i].op.name === "USub" || ast[i].op.name === "UAdd")) { ast[i] = ast[i].operand; }
                else if (ast[i] != null && 'body' in ast[i]) {
                    for (var p in ast[i].body) {
                        replaceNumericUnaryOps(ast[i].body[p]);
                    }
                }
                replaceNumericUnaryOps(ast[i]);
            }
        }
    }

    /*
      Levenshtein function copyright (c) 2011 Andrei Mackenzie
      Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
      to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
      and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
      The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
      INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
      IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
      ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
      */

    // Compute the edit distance between the two given strings
    function levenshtein(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        var matrix = [];

        // increment along the first column of each row
        var i;
        for (i = 0; i <= b.length; i++) { matrix[i] = [i]; }

        // increment each column in the first row
        var j;
        for (j = 0; j <= a.length; j++) { matrix[0][j] = j; }

        // Fill in the rest of the matrix
        for (i = 1; i <= b.length; i++) {
            for (j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1)); // deletion
                }
            }
        }
        return matrix[b.length][a.length];
    }
    //end Levenshtein function

    /* Determines whether the edit distance between two lines is greater than a given threshold.
    * @param lineA - the line to check
    * @param lineB - the line to check lineA against
    * @param editThreshold {int} The minimum number of edits required before a line is considered unique.
    * @returns true if the lines are too similar (edit distance < edit threshold), false otherwise
    */
    function checkForMatch(lineA, lineB, editThreshold) {
        if (editThreshold === 0) {
            if (lineA === lineB) {
                return true;
            }
            else return false;
        }
        else {
            var editDistance = levenshtein(lineA, lineB);
            if (editDistance >= editThreshold) {
                return false;
            }
            else return true;
        }
    }

    /* Copies attributes (except for boolean values set to False) from one object to another, including recursively copying all values from child objects.
    * NOTE: Does NOT reset any boolean values in Target to False. This is intentional
    * @param source - the object whose attributes will be copied
    * @param target - the object to copy the attributes to
    * @param attributesToCopy {Array} - an array of string values containing the names of attributes to be copied.
    */
    function copyAttributes(source, target, attributesToCopy) {
        for (var attr = 0; attr < attributesToCopy.length; attr++) {
            //copy null values
            if (source[attributesToCopy[attr]] == null) {
                target[attributesToCopy[attr]] = null;
            }
            else if (Array.isArray(source[attributesToCopy[attr]])) {
                //copy array values
                target[attributesToCopy[attr]] = appendArray(source[attributesToCopy[attr]], []);
            }
                //copy all non-false, non-object values
            else if (source[attributesToCopy[attr]] !== false || target[attributesToCopy[attr]] == null) {
                target[attributesToCopy[attr]] = source[attributesToCopy[attr]];
            }
                //copy properties of child objects recursively
            else if (typeof source[attributesToCopy[attr]] === "object") {
                var copiedObj = {};
                var attrsToCopy = [];

                for (var at in source[attributesToCopy[attr]]) {
                    attrsToCopy.push(at);
                }

                copyAttributes(source[attributesToCopy[attr]], copiedObj, attrsToCopy);
                target[attributesToCopy[attr]] = copiedObj;
            }
        }
    }


    /* Determines what type of value is described by an AST node
    * @param node - the node in question
    * @returns String value describing datatype.
    */
    function getTypeFromNode(node) {
        node = retrieveFromList(node);


        if (node == null) {
            return ""; //return empty if we can't compute a type
        }
        else if (node._astname === "UnaryOp") {  //the only unary op we should see is "not _____" so we can assume this is a boolean value
            return "Bool";
        }
        else if (node._astname === "Call") {
            return getCallReturn(node);
        }
        else if (node._astname === "Str" || node._astname === "List") {
            return node._astname;
        }
        else if (node._astname === "Num") {
            if (!isNodeFloat(node)) {
                return "Int";
            }
            else return "Float";
        }
        else if (node._astname === "Name") {
            if (node.id.v === "True" || node.id.v === "False") {
                return "Bool";
            }
            else if (getVariableObject(node.id.v) != null) {
                return getVariableObject(node.id.v).value;
            }
        }
        else if (node._astname === "BinOp") {
            var binOpValue = recursivelyAnalyzeBinOp(node);
            if (typeof binOpValue === "string") {
                return binOpValue;
            }
            else if (Array.isArray(binOpValue)) {
                return "List";
            }
        }
        else if (node._astname === "BoolOp" || node._astname === "Compare") {
            return "Bool";
        }
        return "";
    }

    /* If an AST node retrieves a value from a list (by indexing or list.pop()), returns the node being retrieved
    * @param callingNode - the node to return or retrieve from
    * @returns an AST node - either the node retrieved from a list, or the original node (if it's not s subscript/call to list.pop())
    */
    function retrieveFromList(callingNode) {
        //Gets the node referenced by an AST subscript node. (OR an array of nodes, if the subscript is a slice instead of index) WHAT IF WE THROW A STRING AT IT???
        function getSubscriptValue(subscriptNodeToGet) {
            var subscriptNode = subscriptNodeToGet;

            if (subscriptNode.slice._astname === "Index") { //handle singular indices
                var indexValue = 0;
                var objToIndex;
                var valObj = retrieveFromList(subscriptNode.value);

                //what index are we retrieving?
                if ("n" in subscriptNode.slice.value) {
                    indexValue = subscriptNode.slice.value.n.v;
                }
                else if (subscriptNode.slice.value._astname == "Name" && getVariableObject(subscriptNode.slice.value.id.v) != null) {
                    indexValue = getMostRecentValue(getVariableObject(subscriptNode.slice.value.id.v), subscriptNode.lineno);
                    if (indexValue == null) {
                        return null;
                    }
                }

                //what list/array are we retrieving from?
                if (valObj != null) {
                    if (subscriptNode.value._astname === "List") {
                        objToIndex = valObj.elts;
                    }
                    if (valObj._astname === "BinOp") {
                        objToIndex = getAllBinOpLists(subscriptNode.value);
                    }
                    if (valObj._astname === "Call") {
                        if (doesCallCreateList(valObj)) {
                            objToIndex = performListOp(valObj)[0];
                        }
                        else {
                            if (getFunctionObject(valObj.func.id.v) != null) {
                                var callItem = getFunctionObject(valObj.func.id.v);
                                if (callItem.nodeElements != null && callItem.nodeElements[0] != null) {
                                    var callElts = callItem.nodeElements[0].elts;
                                    if (callElts != null) {
                                        objToIndex = callElts.slice(0);
                                    }
                                }
                            }
                        }
                    }
                    if (valObj._astname === "Name") {
                        var variable = getVariableObject(valObj.id.v);
                        if (variable != null) {
                            objToIndex = mostRecentElements(variable, subscriptNodeToGet.lineno);
                        }
                    }
                }

                //get the object at the given index and return it.
                if (objToIndex != null) {
                    if (indexValue < 0) {
                        indexValue += objToIndex.length;
                    }
                    var returnObj = retrieveFromList(objToIndex[indexValue]);
                    return returnObj;
                }

                if (valObj != null && 'id' in valObj) {
                    return null;
                } //if we don't know what it is we're indexing, just return
            }


            else if (subscriptNode.slice._astname === "Slice") { //handle slices
                var lower = null;
                var upper = null;

                var lowerNode = retrieveFromList(subscriptNode.slice.lower);
                var upperNode = retrieveFromList(subscriptNode.slice.upper);

                //get the lower bound for the slice
                if (lowerNode != null && lowerNode._astname === "Num") {
                    lower = lowerNode.n.v;
                }
                else if (lowerNode != null && lowerNode._astname == "Name" && getVariableObject(lowerNode.id.v) != null) {
                    lower = getMostRecentValue(getVariableObject(lowerNode.id.v));
                }

                //get the upper bound for the slice
                if (upperNode != null && upperNode._astname === "Num") {
                    upper = upperNode.n.v;
                }
                else if (upperNode != null && upperNode._astname == "Name" && getVariableObject(upperNode.id.v) != null) {
                    upper = getMostRecentValue(getVariableObject(upperNode.id.v));
                }

                //get the list/array that we are slicing
                var nodeValue = retrieveFromList(subscriptNode.value);
                if (nodeValue._astname === "List") {
                    nodeValue = nodeValue.elts;
                }
                if (nodeValue._astname === "BinOp") {
                    nodeValue = getAllBinOpLists(nodeValue);
                }
                if (nodeValue._astname === "Call") {
                    if (doesCallCreateList(nodeValue)) {
                        nodeValue = performListOp(nodeValue)[0];
                    }
                    else {
                        var call = getFunctionObject(nodeValue.func.id.v)
                        if (call != null && call.nodeElements != null && call.nodeElements.length > 0) {
                            nodeValue = call.nodeElements[0].elts;
                        }
                    }
                }
                if (nodeValue._astname === "Name") {
                    var variable = getVariableObject(nodeValue.id.v);
                    if (variable != null) {
                        var varElts = mostRecentElements(variable, subscriptNodeToGet.lineno);
                        if (varElts != null) {
                            nodeValue = varElts.slice(0);
                        }
                    }
                }

                //set upper and lower bounds to default values if they are unknown
                if (nodeValue != null && Array.isArray(nodeValue)) {
                    if (lower == null) {
                        lower = 0;
                    }
                    if (upper == null) {
                        upper = nodeValue.length - 1;
                    }
                    if (lower < 0) {
                        lower += nodeValue.length;
                    }
                    if (upper < 0) {
                        upper += nodeValue.length;
                    }
                    if (lower != null && upper != null) {
                        //slice the array of nodes and return a fake list node repsenting the result
                        return {
                            _astname: "List",
                            elts: nodeValue.slice(lower, upper)
                        };
                    }
                }

                    //if we can't compute a slice or index, return null
                else if (nodeValue != null && 'id' in nodeValue) {
                    return null;
                }
                else if (nodeValue != null && 'func' in nodeValue && 'id' in nodeValue.func) {
                    return null;
                }
            }
            return null;
        }

        //Helper function: is this a node that requires list retrieval?
        function doesNodeRetrieveFromList(callingNode) {
            if (callingNode != null) {
                if (callingNode._astname === "Call" && 'func' in callingNode && 'attr' in callingNode.func && (callingNode.func.attr.v === "pop" || callingNode.func.attr.v === "choice")) {
                    return true;
                }
                else if (callingNode._astname === "Call" && 'func' in callingNode && 'id' in callingNode.func && (callingNode.func.id.v === "min" || callingNode.func.id.v === "max")) {
                    return true;
                }
            }
            return false;
        }


        //the bulk of the retrieval function
        if (!doesNodeRetrieveFromList(callingNode)) {
            //if the node DOESN't require retrieval or subscripting, just return the original node.
            if (callingNode != null && callingNode._astname === "Subscript") {
                return getSubscriptValue(callingNode);
            }
            else return callingNode;
        }
        else {

            //handling for pop()
            if (callingNode._astname === "Call" && 'func' in callingNode && 'attr' in callingNode.func && (callingNode.func.attr.v === "pop")) {
                var listToUse = [];
                var calledValue = retrieveFromList(callingNode.func.value);
                var thisLine = callingNode.lineno;


                //get the list we're retrieving from
                if (calledValue._astname === "Name") {
                    var variable = getVariableObject(calledValue.id.v);

                    if (variable != null) {
                        var correctElts = mostRecentElements(variable, thisLine - 1);
                        if (correctElts != null) {
                            listToUse = correctElts.slice(0);
                        }
                    }
                }
                else if (calledValue._astname === "Call") {  //it's either a UDF or another listop
                    listToUse = retrieveFromList(calledValue).elts;
                    if (doesCallCreateList(calledValue)) {
                        listToUse = performListOp(calledValue)[0];
                    }
                    else if ('id' in calledValue.func) {
                        var funcObject = getFunctionObject(calledValue.func.id.v);

                        if (funcObject != null && funcObject.nodeElements != null && funcObject.nodeElements.length > 0) {
                            listToUse = funcObject.nodeElements[0].elts.slice(0);
                        }
                    }
                }
                else if (calledValue._astname === "List") {
                    listToUse = calledValue.elts.slice(0);
                }
                else if (calledValue._astname === "BinOp") {
                    listToUse = getAllBinOpLists(calledValue);
                }

                var popLocation = listToUse.length - 1;


                //if no argument is provided, default to the end of the array
                if (callingNode.args.length > 0) {
                    popLocation = callingNode.args[0].n.v;
                }

                return retrieveFromList(listToUse[popLocation]); //nested in case the popped value also requires list retrieval
            }

                //handling for array/list min/max/choice functions
            else if ((callingNode._astname === "Call" && 'func' in callingNode && 'id' in callingNode.func && (callingNode.func.id.v === "min" || callingNode.func.id.v === "max")) || callingNode._astname === "Call" && 'func' in callingNode && 'attr' in callingNode.func && (callingNode.func.attr.v === "choice")) {
                var listToUse = [];
                var calledValue = retrieveFromList(callingNode.args[0]);
                if (calledValue != null) {
                    if (calledValue._astname === "Name") {
                        var variable = getVariableObject(calledValue.id.v);

                        if (variable != null) {
                            var mostRecentElts = mostRecentElements(variable, callingNode.lineno - 1);
                            if (mostRecentElts != null) {
                                listToUse = mostRecentElts.slice(0);
                            }
                        }
                        return null;
                    }
                    else if (calledValue._astname === "Call") { //it's either a UDF or another listop.
                        var calledFunc = retrieveFromList(calledValue.func);
                        if (doesCallCreateList(calledValue)) {
                            listToUse = performListOp(calledValue)[0];
                        }
                        else if ('id' in calledFunc) {
                            var funcObject = getFunctionObject(calledFunc.id.v);
                            if (funcObject != null && funcObject.nodeElements != null && funcObject.nodeElements.length > 0) {
                                listToUse = funcObject.nodeElements[0].elts.slice(0);
                            }
                        }
                    }
                    else if (calledValue._astname === "List") {
                        listToUse = calledValue.elts;
                    }
                    else if (calledValue._astname === "BinOp") {
                        listToUse = getAllBinOpLists(calledValue);
                    }


                    //if it's min/max, we have to sort the array first, then retrieve the value at one end
                    if ('id' in callingNode.func && (callingNode.func.id.v === "min" || callingNode.func.id.v === "max")) {
                        listToUse = performListOp({
                            _astname: "Call",
                            func: {
                                attr: {
                                    v: "sort"
                                },
                                value: {
                                    _astname: "List",
                                    elts: listToUse
                                }
                            }
                        })[0];

                        if (callingNode.func.id.v === "max") {
                            listToUse.reverse();
                        }
                    }

                    return listToUse[0];

                }

                else return null;
            }
        }
    }


    /*Converts an array of AST nodes to an array of strings that indicate the datatype represented by the node. 
    * @param nodeElements - An array of AST node objects
    * @param thisLine - the line location in the python/JS code from where this is being called
    *   (done bc datatypes in variables may change at different points in the code)
    * @returns - Returns array of strings.
    */
    function nodesToStrings(nodeElements, thisLine) {
        var stringElementsToReturn = [];

        for (var i = 0; i < nodeElements.length; i++) {

            var nextElt = getTypeFromNode(nodeElements[i]);

            //if it's null, just push an empty string
            if (nextElt == null) {
                stringElementsToReturn.push("");

            }

                //if the item is a list, create an array of whatever is in THAT list by recursively calling this function.
            else if (nextElt === "List") {
                var listVal = retrieveFromList(nodeElements[i]);

                if (listVal._astname === "List") {
                    nextElt = nodesToStrings(nodeElements[i].elts, thisLine);
                }

                else if (listVal._astname === "BinOp") {
                    nextElt = nodesToStrings(getAllBinOpLists(nodeElements[i]));
                }

                else if (listVal._astname === "Call") {
                    listFunc = retrieveFromList(listVal.func);
                    if ('id' in listFunc) {
                        var calledFunc = getFunctionObject(listVal.func.id);
                        if (calledFunc != null && calledFunc.nodeElements != null && calledFunc.nodeElements.length > 0) {
                            stringElementsToReturn.push(nodesToStrings(calledFunc.nodeElements[0].elts, thisLine));
                        }
                    }
                    else if (doesCallCreateList(listFunc)) {
                        stringElementsToReturn.push(nodesToStrings(performListOp(listVal), thisLine));
                    }
                }

                else if (listVal._astname === "Name") {
                    var listVar = getVariableObject(listVal.id.v);

                    if (listVar != null) {
                        stringElementsToReturn.push(nodesToStrings(mostRecentElements(listVar, thisLine), thisLine));
                    }
                }
            }
                //if we know what's in the node, just push that to the array and move on
            else {
                stringElementsToReturn.push(nextElt);
            }
        }
        return stringElementsToReturn;
    }


    /* Determines what kind of value is returned by a call to Number()
    * @param callingNode - the AST node representing the call
    * @returns "Float" or "Int," dependent upon return type
    */
    function getNumberCallReturn(callingNode) {
        //if it's not a function call at all, return.
        if (callingNode._astname != "Call") {
            return;
        }

        //get the function name
        var calledFunc = retrieveFromList(callingNode.func);
        var functionName = "";
        if ('id' in calledFunc) {
            functionName = calledFunc.id.v;
        }

        if (functionName === "Number") { //If it's not a call to Number(), we can skip and return nothing.
            if (callingNode.args[0] != null) {
                var firstArg = retrieveFromList(callingNode.args[0]);

                //If it's a string, just call Number() here and return the result of the output ("Float" or "Int")
                if (firstArg != null && firstArg._astname === "Str") {
                    if (Number.isInteger(Number(firstArg.s.v))) {
                        return "Int";
                    }
                    else return "Float";
                }

                if (firstArg != null && firstArg._astname === "Name") {
                    if (firstArg.id.v === "None") {
                        return "Int";
                    }

                    var isVar = getVariableObject(firstArg.id.v);
                    //if string we actually can do this since we store an assignedModified value.
                    //Try Number() on the most recent value of the variable
                    if (isVar != null && isVar.value === "Str") {
                        var currentValue = retrieveFromList(getMostRecentValue(isVar, callingNode.lineno));
                        if (currentValue != null && currentValue._astname === "Str") {

                            if (Number.isInteger(Number(currentValue.s.v))) {
                                return "Int";
                            }
                            else return "Float";
                        }
                    }
                }
            }
        }
        return ""; //fall-through
    }


    /* Returns the value returned by a function call
    * @param callingNode - the node representing the function call
    * @returns string of type unless the call returns a list, in which case an array of AST nodes is returned
    */
    function getCallReturn(callingNode) {
        if (callingNode._astname === "Call") { //just return null if this is the wrong kind of node.


            //if the call creates a string or list
            if (doesCallCreateString(callingNode)) {
                return "Str";
            }
            if (doesCallCreateList(callingNode)) {
                return performListOp(callingNode)[0];
            }

            //otherwise, let's see what the function is
            callingNode.func = retrieveFromList(callingNode.func);
            var functionName = "";
            if ('id' in callingNode.func) {
                functionName = callingNode.func.id.v;
            }
            if ('attr' in callingNode.func) {
                functionName = callingNode.func.attr.v;
            }

            //special case for Number()
            if (functionName === "Number") {
                return getNumberCallReturn(callingNode);
            }

            //check through our list of function returns. If we know the return type, return that here.
            var functionCalled = getFunctionObject(functionName);

            if (functionCalled != null) {
                if (functionCalled.returns === "List" && functionCalled.nodeElements != null && functionCalled.nodeElements.length > 0) {
                    return functionCalled.nodeElements[0].elts;
                }
                else if (functionCalled.returns === "BinOp") {
                    return null;
                }
                else return functionCalled.returns;
            }
        }
        return null;
    }


    /* Get the most recent assigned value of a variable
    * @param variableObj - the allVariables item representing the variable
    * @lineno - the line number from which we are inquiring - needed because variable values change over time
    * @returns AST node representing the most likely most recent value assigned to this variable
    */
    function getMostRecentValue(variableObject, lineno) {
        var inFunction = null;   //step 1. are we in a function?
        var returnVal = null;
        for (var u = 0; u < userFunctionReturns.length; u++) {
            if (lineno >= userFunctionReturns[u].startLine && lineno <= userFunctionReturns[u].endLine) {
                inFunction = [userFunctionReturns[u].startLine, userFunctionReturns[u].endLine];
                break;
            }
        }

        if (inFunction != null) {   //check inside the function FIRST
            var furthestLine = -1;
            for (var amItem = 0; amItem < variableObject.assignedModified.length; amItem++) {
                if (variableObject.assignedModified[amItem].line > inFunction[1] || variableObject.assignedModified[amItem].line > lineno) {
                    break;
                }
                if (variableObject.assignedModified[amItem].line >= inFunction[0]) {
                    furthestLine = amItem;
                }
            }
            if (furthestLine > -1) {
                return variableObject.assignedModified[furthestLine].nodeValue;
            }
        }

        //if we haven't returned, OR if we're  not in a function, look for the most recent NOT IN FUNCTION elts.
        for (var amItem = 0; amItem < variableObject.assignedModified.length; amItem++) {
            if (variableObject.assignedModified[amItem].line > lineno) {
                break;
            }

            if (variableObject.assignedModified[amItem].line <= lineno) {
                // is it in a function? this only counts if it's NOT in a function
                var isInFunction = false;
                for (var udfNumber = 0; udfNumber < userFunctionReturns.length; udfNumber++) {
                    if (variableObject.assignedModified[amItem].line >= userFunctionReturns[udfNumber].startLine && variableObject.assignedModified[amItem].line <= userFunctionReturns[udfNumber].endLine) {
                        isInFunction = true;
                        break;
                    }
                }
                if (!isInFunction) {
                    returnVal = variableObject.assignedModified[amItem].nodeValue;
                }
            }
        }

        //if we still don't know what it is, just use the first assigned value.
        if (returnVal == null && (variableObject.assignedModified.length > 0)) {
            returnVal = variableObject.assignedModified[0].nodeValue;
        }

        //if the most recent value is that of another variable, fund the most recent value of THAT variable
        if (returnVal != null && returnVal._astname === "Name" && getVariableObject(returnVal.id.v) != null) {
            returnVal = getMostRecentValue(getVariableObject(returnVal.id.v), lineno);
        }

        return returnVal;
    }

    /* fGets any variable values stored inside any AST node
    * @param nodeToCheck - the AST value we're looking in.
    * @param nameList - an empty array that will be filled with the names of any nested variables
    * @returns filled array with names of contained variables
    */
    function getNestedVariables(nodeToCheck, nameList) {


        function checkNode(nodeComponent, nameList) {
            if (nodeComponent == null) {
                return nameList;
            }
            if (nodeComponent._astname === "Name" && nodeComponent.id.v !== "True" && nodeComponent.id.v !== "False" && getVariableObject(nodeComponent.id.v) != null) {
                //if this node represents a variable, add its name to the list
                nameList.push(nodeComponent.id.v);
            }

            if (nodeComponent in ["BinOp", "List", "Compare", "BoolOp", "Subscript"] || retrieveFromList(nodeComponent) != nodeComponent) {
                //if it's a BinOp or list, call the parent function recursively.
                getNestedVariables(nodeComponent, nameList);
            }

            return nameList;
        }

        //call checkNode() on appropriate parts of nodes that contain other nodes
        if (nodeToCheck._astname === "List") {
            for (var p = 0; p < nodeToCheck.elts.length; p++) {
                checkNode(nodeToCheck.elts[p], nameList);
            }
        }
        else if (nodeToCheck._astname === "BinOp") {
            checkNode(nodeToCheck.left, nameList);
            checkNode(nodeToCheck.right, nameList);
        }
        else if (nodeToCheck._astname === "Compare") {
            checkNode(nodeToCheck.left, nameList);
            for (var p = 0; p < nodeToCheck.comparators.length; p++) {
                checkNode(nodeToCheck.comparators[p], nameList);
            }
        }
        else if (nodeToCheck._astname === "BoolOp") {
            for (var t = 0; t < nodeToCheck.values.length; t++) {
                checkNode(nodeToCheck.values[t], nameList);
            }
        }
        else if (nodeToCheck._astname === "UnaryOp") {
            checkNode(nodeToCheck.operand, nameList);
        }
        else if (nodeToCheck._astname === "Subscript") {
            if (nodeToCheck.slice._astname === "Index") {
                checkNode(nodeToCheck.slice.value, nameList);
            }
            else if (nodeToCheck.slice._astname === "Slice") {
                checkNode(nodeToCheck.slice.upper, nameList);
                checkNode(nodeToCheck.slice.lower, nameList);
            }
            checkNode(nodeToCheck.value, nameList);
        }
        else if (retrieveFromList(nodeToCheck) != nodeToCheck) {
            checkNode(nodeToCheck.func.value, nameList);
            if (nodeToCheck.args.length > 0) {
                checkNode(nodeToCheck.args[0], nameList);
            }
        }


        return nameList;
    }

    /*determines whether or not two AST nodes contain the same value. 
    *Used when performListOp() is performing a removal
    * @param astnode1, astnode2 - the AST node objects to compare
    * @returns True if the nodes have the same value; false otherwise
    *
    */
    function doAstNodesMatch(astnode1, astnode2) {
        var matchingAstName = astnode1._astname;


        if (astnode1._astname === "Name" && astnode2._astname === "Name" && astnode1.id.v === astnode2.id.v) {
            //the two nodes reference the same variable or function
            return true;
        }

        if (astnode1._astname != astnode2._astname) {
            //if they're not the same variable but they ARE the same value 
            //(ex., a variable whose value is 5 and and integeere whose value is 5)
            //register this as a match
            if (astnode1._astname === "Name" || astnode2._astname === "Name") {  //if one side is a variable, get the most recent value  //if it's a function call, that's a lost cause
                var val1 = astnode1;
                var val2 = astnode2;
                if (astnode1._astname === "Name") {
                    var varObj = getVariableObject(astNode1.id.v);
                    if (varObj == null) {
                        return false;
                    }
                    else { val1 = getMostRecentValue(varObj, astNode1.lineno); }
                }
                if (_astnode2._astname === "Name") {
                    var varObj = getVariableObject(astNode2.id.v);
                    if (varObj == null) {
                        return false;
                    }
                    else { val2 = getMostRecentValue(varObj, astNode2.lineno); }
                }
                return (doAstNodesMatch(val1, val2));
            }
            return false;
        }

        //if it's a UnaryOp, we should see if the operands match
        //this isn't exact but works for our purposes
        if (matchingAstName === "UnaryOp") {
            return doAstNodesMatch(astnode1.operand, astnode2.operand);
        }

        //if two lists, check that the elements all match
        if (matchingAstName === "List") {
            if (astnode1.elts.length != astnode2.elts.length) {
                return false;
            }

            else {
                for (var e = 0; e < astnode1.elts.length; e++) {
                    if (!(doAstNodesMatch(astnode1.elts[e], astnode2.elts[e]))) {
                        return false;
                    }
                }
                return true;
            }
        }

            //We can't actually perform any user-defined functions, so this is an approximation:
            // if the same function is called with same arguments, consider the values equal
        else if (matchingAstName === "Call") {

            var args1 = [];
            var args2 = [];

            var funcNode1 = retrieveFromList(astnode1.func);
            var funcNode2 = retrieveFromList(astnode2.func);

            //for list ops and string ops
            if ('attr' in funcNode1) {
                if (!('attr' in funcNode2)) {
                    return false
                }
                else {
                    if (funcNode1.attr.v != funcNode2.attr.v) {
                        return false;
                    }
                    args1 = funcNode1.args;
                    args2 = funcNode2.args;
                }
            }

                //for all other function types
            else if ('id' in funcNode1) {
                if (!('id' in funcNode2)) {
                    return false
                }
                else {
                    if (funcNode1.id.v != funcNode2.id.v) {
                        return false;
                    }
                    args1 = funcNode1.args;
                    args2 = funcNode2.args;
                }
            }

            //do the arguments match?
            if (args1.length != args2.length) {
                return false;
            }
            for (var a = 0; a < args1.length; a++) {
                if (!doAstNodesMatch(args1[a], args2[a])) {
                    return false;
                }
            }
            return true;
        }

            //numerical values must match
        else if (matchingAstName === "Num") {
            if (astnode1.n.v !== astnode2.n.v) {
                return false;
            }
            else return true;
        }

            //ditto for strings
        else if (matchingAstName === "Str") {
            if (astnode1.s.v !== astnode2.s.v) {
                return false;
            }
            else return true;
        }

    }

    /*Returns the type of the first element in a list. 
    * Used for sorting lists within lists during performListOp() sorts.
    * @param list - the python list or js array AST node whose first type we want to retrieve
    * @returns String representation of the datatype of the first element of the list/array
    */
    function getFirstElementType(list) {
        return getTypeFromNode(retrieveFromList(list.elts[0]));
    }



    /*performs a list operation & returns an array of AST nodes in the proper order, if appropriate
    * @param callingNode - the "Call" AST node representing the list op to be performed
    * @returns An array of AST nodes representing the output of the list op.
    */
    function performListOp(callingNode) {

        //check the language, and call the appropriate listop function
        //python and javascript handle str/listops a little differently,
        //so we must differentiate as well
        if (!isJavascript) {
            return pythonOp(callingNode);
        }
        else return jsOp(callingNode);

        //JS list ops
        function jsOp(callingNode) {
            //variable init
            var opToPerform = null;
            var listToUse = [];
            var stringElements = [];
            var variableOrFuncIndex = -1;
            var isVariable = false;
            var isFunc = false;

            //first, determine what operation we need to perform
            if ('func' in callingNode && 'attr' in callingNode.func) {
                opToPerform = callingNode.func.attr.v;
            }


            //find the array we'll be performing it on

            //if variable, find most recent list of elements
            if (callingNode.func.value._astname === "Name") {
                var variable = getVariableObject(callingNode.func.value.id.v);
                if (variable != null) {
                    var correctElts = mostRecentElements(variable, callingNode.lineno);
                    if (correctElts != null) {
                        listToUse = correctElts.slice(0);
                    }
                }
            }

                //if a function call, find the stored elements list
            else if (callingNode.func.value._astname === "Call") {
                if (doesCallCreateList(callingNode.func.value)) {
                    listToUse = performListOp(callingNode.func.value, false)[0];
                }
                else if (retrieveFromList(callingNode.func.value) != callingNode.func.value) {
                    listToUse = retrieveFromList(callingNode.func.value).elts;
                }
                else if ('id' in callingNode.func.value.func && getFunctionObject(callingNode.func.value.func.id.v) != null) {
                    isFunc = true;
                    var variable = getVariableObject(callingNode.func.value.id.v);
                    if (variable != null) {
                        var correctElts = mostRecentElements(variable, callingNode.lineno);
                        if (correctElts != null) {
                            listToUse = correctElts.slice(0);
                        }
                    }
                }
            }

                //if it's a list or binop node, get the values inside
            else if (callingNode.func.value._astname === "List") {
                listToUse = callingNode.func.value.elts;
            }
            else if (callingNode.func.value._astname === "BinOp") {
                listToUse = getAllBinOpLists(callingNode.func.value);
            }

            //I don't think we actually need this
            //else if ('func' in callingNode && 'id' in callingNode.func) {
            //    opToPerform = callingNode.func.id.v;
            //}


            //if we don't know what array to use, return empty
            if (listToUse == null) {
                return [[], []];
            }

            //perform the called operation.
            if (opToPerform != null) {

                //Concatenation
                if (opToPerform === "concat") {

                    //get the list of values to be appended to the list
                    var listToAppend = [];
                    if (callingNode.args[0]._astname === "List") {
                        listToAppend = callingNode.args[0].elts;
                    }
                    else if (callingNode.args[0]._astname === "Name") {
                        var varVal = getVariableObject(callingNode.args[0].id.v);
                        if (varVal != null) {
                            listToAppend = mostRecentElements(varVal, callingNode.lineno);
                        }
                    }
                    else if (callingNode.args[0]._astname === "Call") {
                        if (doesCallCreateList(callingNode.args[0])) {
                            listToAppend = performListOp(callingNode.args[0]);
                        }
                        else if ('id' in callingNode.args[0].func) {
                            var funcReturn = getFunctionObject(callingNode.args[0].func.id.v);
                            if (funcReturn != null && funcReturn.nodeElements != null && funcReturn.nodeElements.length > 0) {
                                listToAppend = funcReturn.nodeElements[0].elts;
                            }
                        }
                    }

                    //if nothing, keep the list the same and return accordingly
                    if (listToAppend.length === 0) {
                        return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                    }

                    else {
                        //perform the concatenation and return the result
                        listToUse.concat(listToAppend);
                        return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                    }
                }

                //copyWithin
                if (opToPerform === "copyWithin") {
                    var targetVal = 0;
                    var startVal = 0;
                    var endVal = listToUse.length;

                    var targetNode = retrieveFromList(callingNode.args[0]);

                    //get the start, end, and target values for the copyWithin
                    if (targetNode._astname === "Name" && getVariableObject(targetNode.id.v) != null) {
                        targetNode = getMostRecentValue(getVariableObject(targetNode.id.v), callingNode.lineno);
                    }
                    if (targetNode._astname === "Num") {
                        targetVal = targetNode.n.v;
                    }


                    if (callingNode.args.length > 1) {
                        var startNode = retrieveFromList(callingNode.args[1]);
                        if (startNode != null && startNode._astname === "Num") {
                            startVal = startNode.n.v;
                        }
                        else if (startNode._astname === "Name" && getVariableObject(startNode.id.v) != null && getVariableObject(startNode.id.v) === "Int") {
                            startVal = getMostRecentValue(getVariableObject(startNode.id.v), callingNode.lineno);
                        }
                    }
                    if (callingNode.args.length > 2) {
                        var endNode = retrieveFromList(callingNode.args[2]);
                        if (endNode != null && endNode._astname === "Num") {
                            endVal = endNode.n.v;
                        }
                        else if (endNode._astname === "Name" && getVariableObject(endNode.id.v) != null && getVariableObject(endNode.id.v) === "Int") {
                            endVal = getMostRecentValue(getVariableObject(endNode.id.v), callingNode.lineno);
                        }
                    }

                    //get the nodes to be copied
                    sliceToCopy = listToUse.slice(startVal, endVal);

                    var newList = [];

                    //create the new array
                    for (var i = 0; i < targetVal; i++) {
                        newList.push(listToUse[i]);
                    }
                    for (var j = 0; j < sliceToCopy.length; j++) {
                        if (j === listToUse.length) {
                            break;
                        }
                        newList.push(sliceToCopy[j]);
                    }
                    for (var k = newList.length; k < listToUse.length; k++) {
                        newList.push(listToUse[k]);
                    }

                    //return the modified array
                    return [newList, nodesToStrings(newList, callingNode.lineno)];
                }

                //fill
                if (opToPerform === "fill") {
                    //get the node to fill the array with
                    var fillItem = retrieveFromList(callingNode.args[0]);

                    //fill the array with that node
                    if (fillItem != null) {
                        var returnList = [];
                        for (var i = 0; i < listToUse.length; i++) {
                            returnList.push(fillItem);
                        }
                    }
                    //return output
                    return [returnList, nodesToStrings(returnList)];
                }

                if (opToPerform === "filter") {
                    //it's probably wise to not try to do this and instead just return the same list.
                    return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                }

                if (opToPerform === "keys") {
                    //create new arrays for the fake key nodes and their types
                    var emptyArray = [];
                    var strArray = [];

                    //make an array of fake integer nodes
                    for (var i in listToUse) {
                        fakeNode = { _astname: "Num", lineno: callingNode.lineno, n: { lineno: callingNode.lineno, v: i } };
                        emptyArray.push(fakeNode);
                        strArray.push("Int");
                    }

                    //return the array of fake nodes and the array of "Int" (for stringElements)
                    return [emptyArray, strArray];
                }

                //map
                if (opToPerform === "map") {
                    //lookup return of called function   
                    //called function is EITHER a name OR a functionexp
                    var fakeList = [];
                    var fakeElts = [];

                    var mapFuncName = null;
                    var funcNode = retrieveFromList(callingNode.args[0]);

                    //get the name of the function to use in map()
                    if (funcNode._astname === "Name") {
                        mapFuncName = funcNode.id.v;
                    }
                    else if (funcNode._astname === "FunctionExp") {
                        mapFuncName = "" + funcNode.lineno + "|" + funcNode.col_offset;
                    }

                    //find what kind of value it returns
                    var thisReturn = getFunctionObject(mapFuncName);

                    //create a fake node whose value will represent the returned value
                    var returnedValue = {};
                    returnedValue.lineno = callingNode.lineno;


                    if (thisReturn != null) {
                        if (thisReturn.returns === "Int" || thisReturn.returns === "Float") {
                            returnedValue._astname = "Num";
                            if (thisReturn.returns === "Int") {
                                //filler values so this gets correctly picked up in any later references
                                returnedValue.n = { v: 1 };
                            }
                            else {
                                returnedValue.n = { v: 1.15 };
                            }
                        }
                        if (thisReturn.returns === "Str") {
                            returnedValue._astname === "Str";
                        }
                        if (thisReturn.returns === "List") {
                            returnedValue._astname = "List";
                            if (thisReturn.nodeElements != null && thisReturn.nodeElements.length > 0) {
                                returnedValue.elts = thisReturn.nodeElements[0].elts;
                            }
                        }
                        if (thisReturn.returns === "Bool") {
                            returnedValue._astname === "Name";
                            returnedValue.id = { v: "True" };
                        }

                        if (thisReturn.returns === "BinOp") {
                            returnedValue.left = thisReturn.binOp.left;
                            returnedValue.right = thisReturn.binOp.right;
                        }

                        //fill the empty array with fake nodes
                        for (var i in listToUse) {
                            fakeList.push(returnedValue);
                            fakeElts.push(thisReturn.returns);
                        }
                        return [fakeList, fakeElts];
                    }
                    else {
                        return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                    }

                }

                //return the list with the last item removed
                if (opToPerform === "pop") {
                    listToUse.splice(listToUse.length - 1, 1);
                    return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                }

                //push the passed node
                if (opToPerform === "push") {
                    var pushArg = retrieveFromList(callingNode.args[0]);
                    if (pushArg != null) {
                        var returnList = listToUse.slice(0);
                        returnList.push(pushArg);
                        return [returnList, nodesToStrings(returnList, callingNode.lineno)];
                    }
                }

                //reverse
                if (opToPerform === "reverse") {
                    var returnList = listToUse.reverse();
                    return [returnList, nodesToStrings(returnList, callingNode.lineno)];
                }
                //shift
                if (opToPerform === "shift") {
                    listToUse.splice(0, 1);
                    return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                }
                //slice
                if (opToPerform === "slice") {
                    var startInt = 0;
                    var endInt = listToUse.length - 1;   //get the actual values, if we know them.

                    //gather target, start, and end vals
                    var targetNode = retrieveFromList(callingNode.args[0]);

                    if (targetNode._astname === "Name" && getVariableObject(targetNode.id.v) != null) {
                        targetNode = getMostRecentValue(getVariableObject(targetNode.id.v), callingNode.lineno);
                    }
                    if (targetNode != null && targetNode._astname === "Num") {
                        startInt = targetNode.n.v;
                    }
                    if (callingNode.args.length > 1) {
                        var endNode = retrieveFromList(callingNode.args[1]);
                        if (endNode._astname === "Name" && getVariableObject(endNode.id.v) != null) {
                            endNode = getMostRecentValue(getVariableObject(endNode.id.v), callingNode.lineno);
                        }
                        if (endNode != null && endNode._astname === "Num") {
                            endInt = endNode.n.v;
                        }
                    }
                    //handle negatives
                    if (startInt < 0) {
                        startInt += listToUse.length;
                    }
                    if (endInt < 0) {
                        endInt += listToUse.length;
                    }

                    //do the slicing and return results
                    var newList = listToUse.slice(startInt, endInt);
                    return [newList, nodesToStrings(newList, callingNode.lineno)];

                }

                //sort
                if (opToPerform === "sort") {

                    //helper comparison function
                    function compare(a, b) { // Use toUpperCase() to ignore character casing
                        const bandA = a.key.toUpperCase();
                        const bandB = b.key.toUpperCase();
                        var comparison = 0;
                        if (bandA > bandB) { comparison = 1; }
                        else if (bandA < bandB) { comparison = -1; }
                        return comparison;
                    }

                    //variable init
                    var returnList = [];
                    var numberPairs = [];

                    //indices is used to indicate items that have already been sorted and put in the result list
                    //so we don't include/sort them twice
                    var indices = [];

                    //the first thing to sort is numerical values
                    for (var i in listToUse) {
                        if (listToUse[i]._astname === "Num") {
                            var stringVal = listToUse[i].n.v.toString();
                            numberPairs.push({ key: stringVal, value: listToUse[i] });
                            indices.push(i);
                        }
                        else if (listToUse[i]._astname === "List" && listToUse[i][0]._astname === "Num") {
                            var stringVal = listToUse[i][0].n.v.toString();
                            numberPairs.push({ key: stringVal, value: listToUse[i] });
                            indices.push(i);
                        }
                    }
                    //sort the numberVals
                    numberPairs.sort(compare);

                    for (var i in numberPairs) {
                        returnList.push(numberPairs[i].value);
                    }

                    //any numerical values whose values we do not know get put in next
                    for (var i in listToUse) {
                        if (!(indices.includes(i))) {
                            if (listToUse[i]._astname === "Name") {
                                if (getVariableObject(listToUse[i]) != null && (getVariableObject(listToUse[i]).value === "Int" || getVariableObject(listToUse[i]).value === "Float")) {
                                    returnList.push(listToUse[i]);
                                    indices.push(i);
                                }
                            }
                            if (listToUse[i]._astname === "BinOp") {
                                if (recursivelyAnalyzeBinOp(listToUse[i]) === "Int" || recursivelyAnalyzeBinOp(listToUse[i]) === "Float") {
                                    returnList.push(listToUse[i]);
                                    indices.push(i);
                                }
                            }
                            if (listToUse[i]._astname === "Call") {
                                if (getCallReturn(listToUse[i]) === "Int" || getCallReturn(listToUse[i]) === "Float") {
                                    returnList.push(listToUse[i]);
                                    indices.push(i);
                                }
                            }
                        }
                    }

                    //everything else gets converted to a string and the strings get sorted, which mirrors the way JS sorts lists
                    var sortables = [];
                    for (var i in listToUse) {
                        if (!(indices.includes(i))) {
                            if (listToUse[i]._astname === "Name" && (listToUse[i].id.v === "True" || listToUse[i].id.v === "False")) {
                                sortables.push({ key: listToUse[i].id.v.toLowerCase(), value: listToUse[i] });
                                indices.push(i);
                            }
                            else if (listToUse[i]._astname === "Str") {
                                sortables.push({ key: listToUse[i].s.v, value: listToUse[i] });
                                indices.push(i);
                            }
                            else if (listToUse[i]._astname === "Name" && getVariableObject(listToUse[i].id.v) == null && getFunctionObject(listToUse[i].id.v) == null) {
                                sortables.push({ key: listToUse[i].id.v, value: listToUse[i] });
                                indices.push(i);
                            }
                            else if (listToUse[i]._astname === "Name" && getVariableObject(listToUse[i].id.v) == null && getFunctionObject(listToUse[i].id.v) != null) {
                                sortables.push({ key: "{\"prototype\":{},\"length\":0}", value: listToUse[i] });
                                indices.push(i);
                            }
                            else if (listToUse[i]._astname === "List") {
                                if (listToUse[i][0]._astname === "Name" && (listToUse[i][0].id.v === "True" || listToUse[i][0].id.v === "False")) {
                                    sortables.push({ key: listToUse[i].id.v.toLowerCase(), value: listToUse[i] });
                                    indices.push(i);
                                }
                                else if (listToUse[i][0]._astname === "Str") {
                                    sortables.push({ key: listToUse[i][0].s.v, value: listToUse[i] });
                                    indices.push(i);
                                }
                                else if (listToUse[i][0]._astname === "Name" && getVariableObject(listToUse[i][0].id.v) == null && getFunctionObject(listToUse[i][0].id.v) == null) {
                                    sortables.push({ key: listToUse[i][0].id.v, value: listToUse[i] });
                                    indices.push(i);
                                }
                                else if (listToUse[i][0]._astname === "Name" && getVariableObject(listToUse[i][0].id.v) == null && getFunctionObject(listToUse[i][0].id.v) != null) {
                                    sortables.push({ key: "{\"prototype\":{},\"length\":0}", value: listToUse[i] });
                                    indices.push(i);
                                }
                            }
                        }
                    }

                    //sort the list of stringified versions
                    sortables.sort(compare);

                    for (var i in sortables) {
                        returnList.push(sortables[i].value);
                    }

                    for (var i in listToUse) {
                        if (!indices.includes(i)) { returnList.push(listToUse[i]); }
                    }

                    return [returnList, nodesToStrings(returnList, callingNode.lineno)];
                }

                //splice
                if (opToPerform === "splice") {
                    //as with python ops, this is necessarily not 100% accurate but should at least serve some purpose
                    var startValue = listToUse.length;
                    var deleteCount = 0;
                    var itemsToAppend = [];
                    var newList = [];

                    //get start and deleteCount values, defaulting if necessary
                    var targetNode = retrieveFromList(callingNode.args[0]);
                    if (targetNode != null && targetNode._astname === "Num") {
                        startValue = targetNode.n.v;
                    }
                    else if (targetNode._astname === "Name") {
                        var targetVar = getVariable(targetNode.id.v);
                        if (targetVar != null && targetVar.value === "Int") {
                            startValue = getMostRecentValue(targetVar, callingNode.lineno);
                        }
                    }

                    if (callingNode.args.length > 1) {
                        endNode = retrieveFromList(callingNode.args[1]);
                        if (endNode._astname === "Num") {
                            deleteCount = endNode.n.v;
                        }
                        else if (endNode._astname === "Name") {
                            var endVar = getVariable(endNode.id.v);
                            if (endVar != null && endVar.value === "Int") {
                                deleteCount = getMostRecentValue(endVar, callingNode.lineno);
                            }
                        }
                    }
                    if (callingNode.args.length > 2) {
                        for (var i = 2; i < callingNode.args.length; i++) {
                            itemsToAppend.push(callingNode.args[i]);
                        }
                    }

                    //default values
                    if (startValue < 0) {
                        startValue += listToUse.length;
                    }
                    if (startValue < 0) {
                        startValue = 0;
                    }

                    //create the new array with the spliced values
                    for (var i = 0; i < startValue; i++) {
                        newList.push(listToUse[i]);
                    }
                    for (var i in itemsToAppend) {
                        newList.push(itemsToAppend[i]);
                    }
                    for (var i = startValue + deleteCount; i < listToUse.length; i++) {
                        newList.push(listToUse[i]);
                    }

                    //return
                    return [newList, nodesToStrings(newList, callingNode.lineno)];
                }
                //unshift
                if (opToPerform === "unshift") {
                    var returnList = listToUse.slice(0);
                    returnList.splice(0, 0, callingNode.args[0]);
                    return [returnList, nodesToStrings(returnList, callingNode.lineno)];
                }
                //values really just keeps the list the same
                if (opToPerform === "values") {
                    return [listToUse, nodesToStrings(listToUse)];
                }
            }
            //return listToUse if we haven't done anything to it
            return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
        }


        //Python listops
        function pythonOp(callingNode) {

            //variable init
            var opToPerform = null;
            var listToUse = [];
            var variableOrFuncIndex = -1;
            var isVariable = false;
            var isFunc = false;

            //what operation are we performing?
            if ('func' in callingNode && 'attr' in callingNode.func) {
                opToPerform = callingNode.func.attr.v;
            }

            if (callingNode.func.value._astname === "Name") {
                var variable = getVariableObject(callingNode.func.value.id.v);

                if (variable != null) {
                    var correctElts = mostRecentElements(variable, callingNode.lineno);
                    if (correctElts != null) {
                        listToUse = correctElts.slice(0);
                    }
                }
            }
            else if (callingNode.func.value._astname === "Call") {
                if (doesCallCreateList(callingNode.func.value)) {
                    listToUse = performListOp(callingNode.func.value, false)[0];
                }
                else if (retrieveFromList(callingNode.func.value) != callingNode.func.value) {
                    listToUse = retrieveFromList(callingNode.func.value).elts;
                }
                else if ('id' in callingNode.func.value.func) {
                    var funcName = callingNode.func.value.func.id.v;
                    if (getFunctionObject(funcName) != null) {
                        isFunc = true;
                        var variable = getVariableObject(callingNode.func.value.id.v);

                        if (variable != null) {
                            var correctElts = mostRecentElements(variable.nodeElements, callingNode.lineno);
                            if (correctElts != null) {
                                listToUse = correctElts.slice(0);
                            }
                        }
                    }
                }
            }
            else if (callingNode.func.value._astname === "List") {
                listToUse = callingNode.func.value.elts;
            }
            else if (callingNode.func.value._astname === "BinOp") {
                listToUse = getAllBinOpLists(callingNode.func.value);
            }

            //if we don't know what array to use, return empty
            if (listToUse == null) {
                return [[], []];
            }

            if (opToPerform != null) {
                //append
                if (opToPerform === "append") {

                    var itemToAppend = callingNode.args[0];
                    listToUse.push(itemToAppend);

                    return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                }

                //extend
                if (opToPerform === "extend") {

                    //get the list value to append to the original list
                    var listToAppend = [];
                    if (callingNode.args[0]._astname === "List") {
                        listToAppend = callingNode.args[0].elts.slice(0);
                    }
                    else if (callingNode.args[0]._astname === "Name") {
                        var varVal = getVariableObject(callingNode.args[0].id.v);
                        if (varVal != null) {
                            var currentElts = mostRecentElements(varVal, callingNode.lineno);
                            listToAppend = currentElts.slice(0);
                        }
                    }
                    else if (callingNode.args[0]._astname === "Call") {
                        if (doesCallCreateList(callingNode.args[0])) {
                            listToAppend = performListOp(callingNode.args[0]);
                        }
                        else if ('id' in callingNode.args[0].func) {
                            var funcReturn = getFunctionObject(callingNode.args[0].func.id.v);
                            if (funcReturn != null && funcReturn.nodeElements != null && funcReturn.nodeElements.length > 0) {
                                listToAppend = funcReturn.nodeElements[0].elts;
                            }
                        }
                    }

                    //return the list with values appended
                    if (listToAppend.length === 0) {
                        return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                    }
                    else {
                        listToUse.concat(listToAppend);
                        return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                    }
                }

                //insert
                if (opToPerform === "insert") {
                    var insertPosition = 0;
                    var itemToInsert = retrieveFromList(callingNode.args[0]);

                    if (itemToInsert != null) {
                        listToUse.splice(insertPosition, 0, itemToInsert);
                    }
                    return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                }
                //pop
                if (opToPerform === "pop") {
                    var popArg = listToUse.length - 1;

                    if (callingNode.args != null && callingNode.args.length > 0) {
                        popArg = callingNode.args[0].n.v;
                    }

                    listToUse.splice(popArg, 1);
                    return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                }
                //remove
                if (opToPerform === "remove") {
                    var indexToRemove = -1;
                    var itemToRemove = callingNode.args[0];
                    //find an item that matches. same _astname, same value
                    for (var p = 0; p < listToUse.length; p++) {
                        if (listToUse[p]._astname === itemToRemove._astname) {
                            //now we check that the values are the same.
                            if (doAstNodesMatch(listToUse[p], itemToRemove)) {
                                indexToRemove = p;
                                break; //THIS BREAK IS IMPORTANT! - erin
                            }
                        }
                    }

                    if (indexToRemove > -1) {
                        listToUse.splice(indexToRemove, 1);
                    }

                    return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                }
                if (opToPerform === "sort") {
                    var sortedList = [];
                    var sortedBools = [];
                    var sortedInts = [];
                    var sortedFloats = [];
                    var sortedLists = [];
                    var sortedStrings = [];


                    //sort the bools - false, then true, then undetermined
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i]._astname === "Name" && listToUse[i].id.v === "False") {
                            sortedBools.push(listToUse[i]);
                        }
                    }
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i]._astname === "Name" && listToUse[i].id.v === "True") {
                            sortedBools.push(listToUse[i]);
                        }
                    }
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i]._astname === "Name" && getVariableObject(listToUse[i].id.v) != null && getVariableObject(listToUse.id.v).value === "Bool") {
                            sortedBools.push(listToUse[i]);
                        }

                        else if (listToUse[i]._astname === "Call") {
                            var functionName = ""
                            var funcId = retrieveFromList(listToUse[i].func);

                            if ('id' in funcId) {
                                functionName = funcId.id.v;
                            }
                            if (functionName !== "" && (getFunctionObject(func1tionName).returns === "Bool")) {
                                sortedBools.push(listToUse[i]);
                            }
                        }
                        else if (listToUse[i]._astname === "BoolOp") {
                            sortedBools.push(listToUse[i]);  //we COULD evaluate these, and may a a later time, but IMHO it's inefficient to do now.
                        }
                        else if (listToUse[i]._astname === "Compare") {
                            sortedBools.push(listToUse[i]);
                        }
                        else if (listToUse[i]._astname === "UnaryOp") {
                            sortedBools.push(listToUse[i]);
                        }
                    }

                    //sort the ints - ascending order first, then undetermined values
                    function sortNumber(a, b) { return a - b; }
                    var unsortedInts = [];
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i]._astname === "Num" && !isNodeFloat(listToUse[i])) {
                            unsortedInts.push(listToUse[i].n.v);
                        }
                    }

                    unsortedInts.sort(sortNumber); //let's make javascript do this for us

                    for (var y = 0; y < unsortedInts.length; y++) {
                        //find the matching AST node and push to sortedInts
                        for (var i = 0; i < listToUse.length; i++) {
                            if (listToUse[i]._astname === "Num" && listToUse[i].n.v === unsortedInts[y]) {
                                sortedInts.push(listToUse[i]);
                                break;
                            }
                        }
                    }
                    //add the undetermined-value integers here
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i]._astname === "Call") {
                            var functionName = "";
                            var funcId = retrieveFromList(listToUse[i].func);
                            if ('id' in funcId) { functionName = funcId.id.v; }
                            if (getVariableObject(functionName) != null && getVariableObject(functionName).value === "Int") {
                                sortedInts.push(listToUse[i]);
                            }

                        }
                        else if (listToUse[i]._astname === "Name" && (getVariableObject(listToUse[i].id.v) != null && getVariableObject(listToUse[i].id.v).value === "Int")) {
                            sortedInts.push(listToUse[i]);
                        }
                        else if (listToUse[i]._astname === "BinOp" && recursivelyAnalyzeBinOp(listToUse[i]) === "Int") {
                            sortedInts.push(listToUse[i]);
                        }
                    }


                    //sort the floats next.
                    var unsortedFloats = [];
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i]._astname === "Num" && !!isNodeFloat(listToUse[i])) {
                            unsortedFloats.push(listToUse[i].n.v);
                        }
                    }

                    for (var y = 0; y < unsortedFloats.length; y++) {
                        //find the matching AST node and push to sortedInts
                        for (var i = 0; i < listToUse.length; i++) {
                            if (listToUse[i]._astname === "Num" && listToUse[i].n.v === unsortedFloats[y]) {
                                sortedFloats.push(listToUse[i]);
                                break;
                            }
                        }
                    }

                    //insert the undetermined-value floats
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i]._astname === "Call") {
                            var functionName = "";
                            if ('id' in listToUse[i].func) {
                                functionName = listToUse[i].func.id.v;
                            }
                            else if (listToUse[i].func._astname === "Subscript") {
                                var subName = retrieveFromList(listToUse[i].func);
                                if (subName._astname === "Name" && getVariableObject(subName.id.v) != null && getVariableObject(subName.id.v).value === "Float") {
                                    sortedFloats.push(listToUse[i]);
                                }
                            }
                        }
                        else if (listToUse[i]._astname === "Name" && (getVariableObject(listToUse[i].id.v) != null && getVariableObject(listToUse[i].id.v).value === "Float")) {
                            sortedFloats.push(listToUse[i]);
                        }
                        else if (listToUse[i]._astname === "BinOp" && recursivelyAnalyzeBinOp(listToUse[i]) === "Float") {
                            sortedFloats.push(listToUse[i]);
                        }
                    }

                    //next, the LISTS. these will be the hardest because we are sorting them by first element, theoretically, in the same order as the overarching list.
                    var unsortedLists = [];
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i]._astname === "List") {
                            unsortedLists.push(listToUse[i]);
                        }
                    }
                    sortedLists = pythonSortNestedLists(unsortedLists);

                    //lists with unknown first values
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i]._astname === "Call") {
                            var functionName = "";
                            if ('id' in listToUse[i].func) { functionName = listToUse[i].func.id.v; }
                            else if (listToUse[i].func._astname === "Subscript") {
                                var subName = retrieveFromList(listToUse[i].func);
                                if (subName._astname === "Name" && getVariableObject(subName.id.v) != null && getVariableObject(subName.id.v).value === "List") {
                                    sortedLists.push(listToUse[i]);
                                }
                            }
                        }

                        else if (listToUse[i]._astname === "Name" && (getVariableObject(listToUse[i].id.v) != null && getVariableObject(listToUse[i].id.v).value === "List")) {
                            sortedLists.push(listToUse[i]);
                        }
                        else if (listToUse[i]._astname === "BinOp" && (Array.isArray(recursivelyAnalyzeBinOp(listToUse[i])))) {
                            sortedLists.push(listToUse[i]);
                        }
                    }

                    //finally, the strings.
                    var unsortedStrings = [];
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i]._astname === "Str") { unsortedStrings.push(listToUse[i].s.v); }
                    }

                    unsortedStrings.sort();

                    for (var y = 0; y < unsortedStrings.length; y++) {
                        for (var i = 0; i < listToUse.length; i++) {
                            if (listToUse[i]._astname === "Str" && 's' in listToUse[i] && listToUse[i].s.v === unsortedStrings[y]) {
                                sortedStrings.push(listToUse[i]);
                                break;
                            }
                        }
                    }

                    //insert the complicated strings
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i]._astname === "Call") {
                            var functionName = "";
                            if ('id' in listToUse[i].func) { functionName = listToUse[i].func.id.v; }
                            else if (listToUse[i].func._astname === "Subscript") {
                                var subName = retrieveFromList(listToUse[i].func);
                                if (subName._astname === "Name" && getVariableObject(subName.id.v) != null && getVariableObject(subName.id.v).value === "Str") {
                                    sortedStrings.push(listToUse[i]);
                                }
                            }
                        }
                        else if (listToUse[i]._astname === "Name" && (getVariableObject(listToUse[i].id.v) != null && getVariableObject(listToUse[i].id.v).value === "Str")) {
                            sortedStrings.push(listToUse[i]);
                        }
                        else if (listToUse[i]._astname === "BinOp" && (recursivelyAnalyzeBinOp(listToUse[i]) === "Str")) {
                            sortedStrings.push(listToUse[i]);
                        }
                    }


                    //combine the sorted components, and return that
                    sortedList = sortedBools;// + sortedInts + sortedFloats + sortedLists + sortedStrings;
                    sortedList = appendArray(sortedInts, sortedList);
                    sortedList = appendArray(sortedFloats, sortedList);
                    sortedList = appendArray(sortedLists, sortedList);
                    sortedList = appendArray(sortedStrings, sortedList);

                    return [sortedList, nodesToStrings(sortedList, callingNode.lineno)];
                }
                if (opToPerform === "shuffleList") {
                    //this is, by necessity, a gap in this complexity calculator. We cannot replicate randomness, because it is random. Possible space for future improvements
                    return [listToUse, nodesToStrings(listToUse, callingNode.lineno)];
                }
            }

            return null;
        }

        //helper function for pythonOp
        function pythonSortNestedLists(allListsInList) {
            //sort lists by first element (sorted by type and by value) 
            //lists WITHIN this get sorted by THEIR first element within this (recursively calls self on those lists.)

            var listsWithin = [];
            var listsSorted = [];

            var intSorted = [], floatSorted = [], listSorted = [], stringSorted = [];

            for (var a = 0; a < allListsInList.length; a++) {
                if (getFirstElementType(allListsInList[a]) === "Bool") {
                    listsSorted.push(allListsInList[a]);
                }
                else if (getFirstElementType(allListsInList[a]) === "Int") {
                    intSorted.push(allListsInList[a]);
                }
                else if (getFirstElementType(allListsInList[a]) === "Float") {
                    floatSorted.push(allListsInList[a]);
                }
                else if (getFirstElementType(allListsInList[a]) === "List") {
                    listsWithin.push(allListsInList[a]);
                }
                else if (getFirstElementType(allListsInList[a]) === "Str") {
                    stringSorted.push(allListsInList[a]);
                }
            }

            if (listsWithin.length > 0) {
                listSorted = pythonSortNestedLists(listsWithin);
            }

            //append the arrays, in order
            listsSorted = appendArray(intSorted, listsSorted);
            listsSorted = appendArray(floatSorted, listsSorted);
            listsSorted = appendArray(listSorted, listsSorted);
            listsSorted = appendArray(stringSorted, listsSorted);

            return listsSorted;
        }

    }

    //Finds Variable object given the variable name. If not found, returns null.
    function getVariableObject(variableName) {
        for (var r = 0; r < allVariables.length; r++) {
            if (allVariables[r].name === variableName) { return allVariables[r]; }
        }
        return null;
    }


    //Find the User Function Return object by the function name. If not found, returns null.
    function getFunctionObject(funcName) {
        for (var u = 0; u < userFunctionReturns.length; u++) {
            if (userFunctionReturns[u].name === funcName) { return userFunctionReturns[u]; }
        }
        return null;
    }


    /*Does this call to a listOp function RETURN a list?
    * @param node - The "Call" AST node
    * @returns True or False
    */
    function doesCallCreateList(node) {
        var funcName = "";
        if (node._astname === "Call") {

            var funcNode = retrieveFromList(node.func);

            if (funcNode != null) {
                if ('attr' in funcNode) {
                    funcName = funcNode.attr.v;
                }
                if ('id' in funcNode && funcNode.id.v === "shuffleList") {
                    return true;
                };
                if (createListFuncs.includes(funcName)) {
                    return true;
                }
            }
        }
        return false;
    }


    /* Is this node a call to an operation that creates a string?
    * @param node {object} The AST node in question
    * @returns True or False.
    */
    function doesCallCreateString(node) {
        var funcName = "";
        if (node._astname === "Call") {
            var funcNode = retrieveFromList(node.func);

            if (funcNode != null) {
                if ('attr' in funcNode) {
                    funcName = funcNode.attr.v;
                }
                if ('id' in funcNode && funcNode.id.v === "shuffleString") {
                    return true;
                };
            }
            if (createStrFuncs.includes(funcName)) {
                return true;
            }
        }
        return false;
    }


    /* Is this node a call to a string operation?
    * @param node {object} The AST node in question
    * @returns True or False.
    */
    function isCallAStrOp(node) {
        var thisNode = retrieveFromList(node);
        if (thisNode != null && thisNode._astname === "Call") {
            if ('id' in thisNode.func) {
                return false;
            }
            else if ('attr' in thisNode.func) {
                var funcName = thisNode.func.attr.v;
                if (strFuncs.includes(funcName)) {
                    return true;
                }
            }
        }
        return false;
    }

    /* Does this node contain any string indexing or slicing?
    * @param node {object} The AST node in question
    * @returns {array} Array with 2 boolean values - the first is whether or not there's indexing in the node, and the second is the originality thereof (if the first is true).
    */
    function getStringIndexingInNode(node) {
        function getStringIndexing(node) {
            if (node._astname === "Subscript" && (node.slice._astname === "Index" || node.slice._astname === "Slice")) {

                //is the thing we're indexing a string?
                if (node.value._astname === "Str") {
                    return [true, true];
                }
                //or a binOp that resolves to a string?
                if (node.value._astname === "BinOp" && recursivelyAnalyzeBinOp(node.value) === "Str") {
                    return [true, true];
                }
                //or a call that returns a string?
                if (node.value._astname === "Call") {
                    if (doesCallCreateString(node.value)) {
                        return [true, true];
                    }
                    if ('func' in node.value && 'id' in node.value.func) {
                        var funcObj = getFunctionObject(node.value.func.id.v);
                        if (funcObj.returns === "Str") {
                            return [true, funcObj.original];
                        }
                    }
                    else if ('func' in node.value && node.func.value._astname === "Subscript") {
                        var funcName = retrieveFromList(node.func);
                        if (funcName._astname === "Name") {
                            var returns = getFunctionObject(funcName);
                            if (returns != null && returns.returns === "Str") {
                                return [true, returns.original];
                            }
                        }
                    }
                }
                //or a variable that contains a string?
                if (node.value._astname === "Name") {
                    var thisVariable = getVariableObject(node.value.id.v);
                    if (thisVariable != null) {
                        return [thisVariable.value === "Str", thisVariable.original];
                    }
                }
                //Or a subscripted string?
                if (node.value._astname === "Subscript") {
                    return (getStringIndexing(node.value));
                }
            }
            return [false, false];
        }


        //regardless of the type of node, we need two things:
        //1. if there's string indexing
        //2. if anything in the node should count as original

        if (node._astname === "UnaryOp") {
            return getStringIndexingInNode(node.operand);
        }
        if (node._astname === "BinOp") {
            var isIndexed = false;
            var isOriginal = false;

            if (getStringIndexingInNode(node.right)[0] || getStringIndexingInNode(node.right)[0]) {
                isIndexed = true;
            }
            if ((getStringIndexingInNode(node.right)[0] && getStringIndexingInNode(node.right)[1]) || (getStringIndexingInNode(node.left)[0] && getStringIndexingInNode(node.left)[1])) {
                isOriginal = true;
            }

            return [isIndexed, isOriginal];
        }

        if (node._astname === "BoolOp") {
            var isIndex = false;
            var isOriginal = false;

            //check values
            for (var i = 0; i < node.values.length; i++) {
                if (getStringIndexingInNode(node.values[i])[0]) {

                    isIndex = true;
                    if (getStringIndexingInNode(node.values[i])[1]) {
                        isOriginal = true;
                    }
                }
            }
            return [isIndex, isOriginal];
        }


        if (node._astname === "List") {
            var isIndex = false;
            var isOriginal = false;


            //check elements
            for (var i = 0; i < node.elts.length; i++) {
                if (getStringIndexingInNode(node.elts[i])[0]) {

                    isIndex = true;
                    if (getStringIndexingInNode(node.elts[i])[1]) {
                        isOriginal = true;
                    }
                }
            }
            return [isIndex, isOriginal];
        }
        if (node._astname === "Compare") {
            var isIndexed = false;
            var isOriginal = false;

            //check left side
            if (getStringIndexingInNode(node.left)[0]) {
                isIndexed = true;
                if (getStringIndexingInNode(node.left)[1]) {
                    isOriginal = true;
                }
            }
            //check comparators
            for (var n = 0; n < node.comparators.length; n++) {
                if (getStringIndexingInNode(node.comparators[n])[0]) {
                    isIndexed = true;
                    if (getStringIndexingInNode(node.comparators[n])[1]) {
                        isOriginal = true;
                    }
                }
            }
            return [isIndexed, isOriginal];
        }

        if (node._astname === "Subscript") {
            //is this indexing or slicing a string?
            return (getStringIndexing(node));
        }

        if (node._astname === "Name") {
            if (getVariableObject(node.id.v) != null) {
                return [getVariableObject(node.id.v).indexAndInput.strIndexed, getVariableObject(node.id.v).original];
            }
        }

        if (node._astname === "Call" && 'id' in node.func) {
            var foundFunction = getFunctionObject(node.func.id.v);

            if (foundFunction != null && 'indexAndInput' in foundFunction) {
                return [foundFunction.indexAndInput.strIndexed, foundFunction.original];
            }
        }

        if (node._astname === "Subscript") {
            if (node.slice._astname === "Index" || node.slice._astname === "Slice") {
                if (node.value._astname === "Str") {
                    return [true, originalityLines.includes(node.lineno)];
                }
                if (node.value._astname === "Subscript") {
                    return (getStringIndexing(node.value));
                }
                //binop that resolves to string
                if (node.value._astname === "BinOp" && recursivelyAnalyzeBinOp(node.value) === "Str") {
                    return [true, true];
                }
                if (node.value._astname === "Call") {  //is it a listop, concat binop, OR a UDF that returns a string
                    if (doesCallCreateString(node.value)) {
                        return [true, true];
                    }
                    if ('func' in node.value && 'id' in node.value.func && getFunctionObject(node.value.id.v).returns === "Str") {
                        return [true, getFunctionObject(node.value.id.v).original];
                    }
                }

                //variable that contains string
                if (node.value._astname === "Name" && (getVariableObject(node.value.id.v) != null && getVariableObject(node.value.id.v).value === "Str")) {
                    return [true, getVariableObject(node.value.id.v).original];
                }
            }
        }
        return [false, false];
    }

    /* Is this "Call" AST node a call to a list operation?
    * @param node {object} The AST node in question
    * @returns True or False.
    */
    function isCallAListOp(node) {
        var thisNode = retrieveFromList(node);

        if (thisNode != null && thisNode._astname === "Call" && 'attr' in thisNode.func && listFuncs.includes(thisNode.func.attr.v)) {
            return true;
        }
        return false;
    }


    /* Does this node contain any list indexing or slicing?
   * @param node {object} The AST node in question
   * @returns {array} Array with 2 boolean values - the first is whether or not there's indexing in the node, and the second is the originality thereof (if the first is true).
   */
    function getIndexingInNode(node) {

        function getNestedIndexing(node) {

            if (node._astname === "Subscript" && node.slice._astname === "Index") {//if the thing we're indexing is a list, return true
                if (node.value._astname === "List") {
                    return [true, originalityLines.includes(node.lineno)];
                }
                //is it a binop that resolves to a list?
                if (node.value._astname === "BinOp" && Array.isArray(recursivelyAnalyzeBinOp(node.value))) {
                    return [true, true];
                }
                if (node.value._astname === "Call") {//is it a listop, concat binop, OR a UDF that returns a list
                    if (doesCallCreateList(node.value)) {
                        return [true, true];
                    }
                    if ('func' in node.value && 'id' in node.value.func) {
                        var funcObj = getFunctionObject(node.value.func.id.v);
                        if (funcObj.returns === "List") {
                            return [true, funcObj.original];
                        }
                    }
                }
                if (node.value._astname === "Name") {//is it indexing a variable that contains a list?
                    var thisVariable = getVariableObject(node.value.id.v);
                    if (thisVariable != null) {
                        return [thisVariable.value === "List", thisVariable.original];
                    }
                }
                if (node.value._astname === "Subscript") {
                    return (getNestedIndexing(node.value));
                }
            }
            return false;
        }



        if (node._astname === "BinOp") {
            var isIndexed = false;
            var isOriginal = false;

            //check left and right sides
            if (getIndexingInNode(node.right)[0] || getIndexingInNode(node.right)[0]) {
                isIndexed = true;
            }
            if ((getIndexingInNode(node.right)[0] && getIndexingInNode(node.right)[1]) || (getIndexingInNode(node.left)[0] && getIndexingInNode(node.left)[1])) {
                isOriginal = true;
            }

            return [isIndexed, isOriginal];
        }

        if (node._astname === "UnaryOp") {
            //check operand
            return (getIndexingInNode(node.operand));
        }

        if (node._astname === "BoolOp") {
            var isIndex = false;
            var isOriginal = false;

            //check all value nodes
            for (var i = 0; i < node.values.length; i++) {
                if (getIndexingInNode(node.values[i])[0]) {
                    isIndex = true;

                    if (getIndexingInNode(node.values[i])[1]) {
                        isOriginal = true;
                    }
                }
            }

            return [isIndex, isOriginal];
        }

        if (node._astname === "List") {
            var isIndex = false;
            var isOriginal = false;

            //check all element nodes
            for (var i = 0; i < node.elts.length; i++) {
                if (getIndexingInNode(node.elts[i])[0]) {
                    isIndex = true;
                    if (getIndexingInNode(node.elts[i])[1]) {
                        isOriginal = true;
                    }
                }
            }

            return [isIndex, isOriginal];
        }
        if (node._astname === "Compare") {
            var isIndexed = false;
            var isOriginal = false;

            //check left side
            if (getIndexingInNode(node.left)[0]) {
                isIndexed = true;
                if (getIndexingInNode(node.left)[1]) {
                    isOriginal = true;
                }
            }

            //check all comparators
            for (var n = 0; n < node.comparators.length; n++) {
                if (getIndexingInNode(node.comparators[n])[0]) {
                    isIndexed = true;
                    if (getIndexingInNode(node.comparators[n])[1]) {
                        isOriginal = true;
                    }
                }
            }
            return [isIndexed, isOriginal];
        }


        if (node._astname === "Subscript") {
            //check the value
            return (getNestedIndexing(node));
        }

        if (node._astname === "Name" && getVariableObject(node.id.v) != null) {
            //if it's a variable, does it contain indexing and is it original?
            return [getVariableObject(node.id.v).indexAndInput.indexed, getVariableObject(node.id.v).original];
        }

        if (node._astname === "Call" && 'id' in node.func && getFunctionObject(node.func.id.v) != null) {
            //ditto for functions
            if ('indexAndInput' in getFunctionObject(node.func.id.v)) {
                return [getFunctionObject(node.func.id.v).indexAndInput.indexed, getFunctionObject(node.func.id.v).original];
            }
        }

        //special cases: min, max, and choice count as indexing for our purposes
        if (node._astname === "Call" && 'id' in node.func && (node.func.id.v === "min" || node.func.id.v === "max")) {

            return [true, originalityLines.includes(node.lineno)];
        }
        if (node._astname === "Call" && 'attr' in node.func && node.func.attr.v === "choice") {

            return [true, originalityLines.includes(node.lineno)];
        }

        if (node._astname === "Subscript") {
            if (node.slice._astname === "Index" || node.slice._astname === "Slice") {
                //is the thing being indexed a list?
                if (node.value._astname === "List") {
                    return [true, true];
                }
                //a subscripted list?
                if (node.value._astname === "Subscript") {
                    return (getNestedIndexing(node.value));
                }
                //a binop that resolves to a list?
                if (node.value._astname === "BinOp" && Array.isArray(recursivelyAnalyzeBinOp(node.value))) {
                    return [true, true];
                }
                //a function call that returns a list?
                if (node.value._astname === "Call") {
                    if (doesCallCreateList(node.value)) {
                        return [true, true];
                    }
                    if ('func' in node.value && 'id' in node.value.func && getFunctionObject(node.value.id.v).returns === "List") {
                        return [true, getFunctionObject(node.value.id.v).original];
                    }
                }
                //a variable that contains a list?
                if (node.value._astname === "Name" && getVariableObject(node.value.id.v) === "List") {
                    return [true, getVariableObject(node.value.id.v).original];
                }
            }
        }


        return [false, false];
    }


    /*Gets all types within a boolop, binop, list, or compare node. Returns array of strings.
    * @param node - The AST node in question
    * @param typesWithin - an array to which the datatypes found in the node will be pushed
    * @param inputIndexingObj - an object including "input," "indexed," and "strIndexed" properties that will be set to true if any of these properties are found
    * @param opList - A formatted list of operations done.
    * @returns - filled typesWithin array.
    */
    function listTypesWithin(node, typesWithin, inputIndexingObj, opList) {
        var thisNode = retrieveFromList(node);
        if (thisNode != null) {
            if (thisNode._astname === "BinOp") {
                opList = addOpToList("BinOp", opList, thisNode.lineno);

                //check left and right
                listTypesWithin(thisNode.left, typesWithin, inputIndexingObj, opList);
                listTypesWithin(thisNode.right, typesWithin, inputIndexingObj, opList);
            }
            if (thisNode._astname === "List") {
                typesWithin.push("List");

                //check elements
                for (var listItem = 0; listItem < thisNode.elts.length; listItem++) {
                    listTypesWithin(thisNode.elts[listItem], typesWithin, inputIndexingObj, opList);
                }
            }
            if (thisNode._astname === "BoolOp") {
                opList = addOpToList("BoolOp", opList, thisNode.lineno);
                typesWithin.push("Bool");

                //check values
                for (var boolItem = 0; boolItem < thisNode.values.length; boolItem++) {
                    listTypesWithin(thisNode.values[boolItem], typesWithin, inputIndexingObj, opList);
                }
            }
            if (thisNode._astname === "Compare") {
                opList = addOpToList("Compare", opList, thisNode.lineno);
                typesWithin.push("Bool");

                //check left side
                listTypesWithin(thisNode.left, typesWithin, inputIndexingObj, opList);
                //check comparators
                for (var compareItem = 0; compareItem < thisNode.comparators.length; compareItem++) {
                    listTypesWithin(thisNode.comparators[compareItem], typesWithin, inputIndexingObj, opList);
                }
            }
            if (thisNode._astname === "UnaryOp") {
                opList = addOpToList("BoolOp", opList, thisNode.lineno);
                typesWithin.push("Bool");
                //check operand
                listTypesWithin(thisNode.operand, typesWithin, inputIndexingObj, opList);
            }

            //OR, it's a call, int, float, string, bool, or var

            //bool int, float, str
            if (thisNode._astname === "Num") {
                if (!isNodeFloat(thisNode)) {
                    typesWithin.push("Int");
                }
                else {
                    typesWithin.push("Float");
                }
            }
            if (thisNode._astname === "Str") {
                typesWithin.push("Str");
            }
            if (thisNode._astname === "Name" && (thisNode.id.v === "True" || thisNode.id.v === "False")) {
                typesWithin.push("Bool");
            }

                //vairable
            else if (thisNode._astname === "Name") {
                var includedVar = getVariableObject(thisNode.id.v);
                if (includedVar != null && typeof includedVar.value === "string" && includedVar.value !== "" && includedVar.value !== "BinOp") {
                    typesWithin.push(includedVar.value);

                    for (var c = 0; c < includedVar.containedValue.length; c++) {
                        typesWithin.push(includedVar.containedValue[c]);
                    }

                    opList = appendOpList(includedVar.opsDone, opList);
                    copyAttributes(includedVar.indexAndInput, inputIndexingObj, ["indexed", "strIndexed", "input"]);
                }
            }

            //function call
            if (thisNode._astname === "Call") {
                var funcName = "";
                var functionNode = retrieveFromList(thisNode.func);

                if ('attr' in functionNode) {
                    funcName = functionNode.attr.v;
                }
                if ('id' in functionNode) {
                    funcName = functionNode.id.v;
                }

                //if it's a listop or strop we have to get types in args
                var isListFunc, isStrFunc = false;

                //disambiguation for functions that can go for strings or arrays
                if (JS_STR_LIST_OVERLAP.includes(funcName) && isJavascript) {
                    var opValType = getTypeFromNode(functionNode.value);
                    if (opValType === "List") {
                        isListFunc = true;
                    }
                    else if (opValType === "Str") {
                        isStrFunc = true;
                    }
                    else if (opValType === "") {
                        isListFunc, isStrFunc = true;
                    }
                }

                //check value
                if (listFuncs.includes(funcName) && !isStrFunc) {
                    opList = addOpToList("ListOp", opList, thisNode.lineno);
                    listTypesWithin(functionNode.value, typesWithin, inputIndexingObj, opList);
                }

                if (strFuncs.includes(funcName) && !isListFunc) {
                    opList = addOpToList("StrOp", opList, thisNode.lineno);
                    listTypesWithin(functionNode.value, typesWithin, inputIndexingObj, opList);
                }

                var calledFunc = getFunctionObject(funcName);

                if (calledFunc != null) {
                    if (typeof calledFunc.returns === "string") {
                        typesWithin.push(calledFunc.returns);
                    }
                    if (calledFunc.containedValue != null) {
                        appendArray(calledFunc.containedValue, typesWithin);
                    }
                    if (calledFunc.opsDone != null) {
                        opList = appendOpList(calledFunc.opsDone, opList);
                    }
                    if (calledFunc.indexAndInput != null) {
                        copyAttributes(calledFunc.indexAndInput, inputIndexingObj, ["indexed", "strIndexed", "input"]);
                    }
                }
            }
        }
        return typesWithin;
    }


    /*Adds a single operation to the list for a function or variable
    * @param opToAdd {String} The name of the operation to be added to the list
    * @param opList {Array} The opList object for the operation to be added to
    * @param lineno {Int} The line number where the operation being added occurs
    * @returns Updated opList array.
    */
    function addOpToList(opToAdd, opList, lineno) {
        if (opList == null) {
            //if we're passed a null value for the array, initialize a new one
            opList = [];
        }

        //adjustment if we're in a loop
        //basically, if the op happens in a loop, we consider it to start at the loop's first line 
        for (var p in loopLocations) {
            if (lineno >= loopLocations[p][0] && lineno <= loopLocations[p][1]) {
                lineno = loopLocations[p][0];
                break;
            }
        }

        //Is the operation already in the list?
        var opIndex = -1;
        for (var p = 0; p < opList.length; p++) {
            if (opList[p].op === opToAdd) {
                opIndex = p;
                break;
            }
        }

        //if this op is already in the list, just add this line number to it
        if (opIndex > -1 && !opList[opIndex].lines.includes(lineno)) {
            opList[opIndex].lines.push(lineno);
            opList[opIndex].lines.sort();
        }
            //otherwise, make a new op object with the line number as the first entry in the lines array
        else if (opIndex === -1) {
            opList.push({ op: opToAdd, lines: [lineno] });
        }

        return opList;
    }

    /* Appends one opList array to another. 
    * This is a separate function because our opLists have a very specific format.
    * @param source - The source opList to be appended
    * @param target - The opList to which the source values will be appended
    * @returns target list with source list appended.
    */
    function appendOpList(source, target) {
        for (var a = 0; a < source.length; a++) {
            for (var b = 0; b < source[a].lines.length; b++) {
                target = addOpToList(source[a].op, target, source[a].lines[b]);
            }
        }
        return target;
    }

    /* Searches an opList for all entries prior to a specified line.
    * @param opList - the opList array to search
    * @param lineNumber - The function will return all entries in the opList object
    * @returns String array with all ops performed before the line
    */
    function opsBeforeLine(opList, lineNumber, funcOrVar, funcOrVarObject) {
        var opsBefore = []; //initialize return value

        //are we in a function?
        var inFunction = false;
        for (var u = 0; u < userFunctionReturns.length; u++) {
            if (lineNumber >= userFunctionReturns[u].startLine && lineNumber <= userFunctionReturns[u].endLine) {
                inFunction = true;
            }
        }

        //iterate through the ops list, and count any that occur before the line
        for (var a = 0; a < opList.length; a++) {

            //if we're in a function, and the op occurs before the current line, we can assume it has occurred before this point.
            if (inFunction && opList[a].lines[0] <= lineNumber) {
                opsBefore.push(opList[a].op);
            }


            else {
                //if we're outside a function, we need the first line NOT in a function. 
                var lineOutsideFunction = false;
                var line = 0;
                while (!lineOutsideFunction && line < opList[a].lines.length) {

                    var lineno = opList[a].lines[line];
                    var isInside = false;


                    for (var u = 0; u < userFunctionReturns.length; u++) {
                        if (lineno >= userFunctionReturns[u].startLine && lineno <= userFunctionReturns[u].endLine) {
                            isInside = true;
                            break;
                        }
                    }

                    lineOutsideFunction = !isInside;
                    line++;
                }

                if (lineOutsideFunction) {
                    line -= 1;
                    if (opList[a].lines[line] <= lineNumber) {
                        opsBefore.push(opList[a].op);
                    }
                }
            }
        }


        //check other modifying function calls
        if (funcOrVar === "var") {
            //get modifying functions
            var modFuncs = [];

            for (var i in funcOrVarObject.modifyingFunctions) {
                //find the function object in userFunctions
                var funcObj = null;
                for (var p in userFunctionReturns) {
                    if (userFunctionReturns[p].startLine != null
                        && userFunctionReturns[p].startLine === funcOrVarObject.modifyingFunctions[i][0] && userFunctionReturns[p].endLine === funcOrVarObject.modifyingFunctions[i][1]) {

                        funcObj = Object.assign({}, userFunctionReturns[p]);
                        break;
                    }
                }

                //if it's called before lineNumber, add it to the list [name, [startline, endlline]]
                if (funcObj.callsTo != null && funcObj.callsTo.length > 0) {
                    if (funcObj.callsTo[0] >= lineNumber) {
                        modFuncs.push([funcObj.startLine, funcObj.endLine]);
                    }
                }
            }


            //append any ops within their bounds to opsBefore
            for (var i in opList) {
                if (!opsBefore.includes(opList[i].op)) {
                    var isBefore = false;
                    for (var p in opList[i].lines) {
                        for (var j in modFuncs) {
                            if (opList[i].lines[p] >= modFuncs[j][0] && opList[i].lines[p] <= modFuncs[j][1]) {
                                isBefore = true;
                                break;
                            }
                        }
                        if (isBefore) {
                            opsBefore.push(opList[i].op);
                            break;
                        }
                    }
                }
            }

        }
        else if (funcOrVar === "func") {
            //if any other functions are called within the bounds of this function

            var containedFuncs = [];

            for (var i in userFunctionReturns) {
                if (userFunctionReturns[i].callsTo != null) {
                    for (var p in userFunctionReturns[i].callsTo) {
                        if (userFunctionReturns[i].callsTo[p] >= funcOrVarObject.startLine && userFunctionReturns[i].callsTo[p] <= funcOrVarObject.endLine) {
                            containedFuncs.push(userFunctionReturns[i]);
                        }
                    }
                }
            }

            //append ops from THEIR opslists to opsBefore
            for (var i in containedFuncs) {
                for (var p in containedFuncs[i].opsDone) {
                    if (!opsBefore.includes(containedFuncs[i].opsDone[p].op)) {
                        opsBefore.push(containedFuncs[i].opsDone[p].op);
                    }
                }
            }
        }



        return opsBefore;
    }

    /*Fills userFunctionParameters list
    * @param ast - An AST tree or node
    * @param results - the results object.
    */
    function evaluateuserFunctionParameters(ast, results) {
        if (ast != null && ast.body != null) {
            angular.forEach(ast.body, function (node) {
                checkForFunctions(node, results);
                evaluateuserFunctionParameters(node, results);
            });
        }
        else if (ast != null && (ast._astname != null || (ast[0] != null && typeof ast[0] === 'object'))) {
            angular.forEach(ast, function (node) {
                checkForFunctions(node, results);
                evaluateuserFunctionParameters(node, results);
            });
        }
    }

    /*Fills allVariables list
   * @param ast - An AST tree or node
   * @param results - the results object.
   */
    function gatherAllVariables(ast) {
        if (ast != null && ast.body != null) {
            angular.forEach(ast.body, function (node) {
                markVariable(node);
                gatherAllVariables(node);
            });
        }
        else if (ast != null && (ast._astname != null || (ast[0] != null && typeof ast[0] === 'object'))) {
            angular.forEach(ast, function (node) {
                markVariable(node);
                gatherAllVariables(node);
            });
        }
    }

    /*Adds a variable to allVariables along with its contents if a node includes a variable assignment.
    *Also marks bourdaries of for and while loops for use later
    * @param node - the AST node to be marked
    */
    function markVariable(node) {
        var fakeBinOp = null;

        //Javascript for loops can include both variable declarations and updates (augassign)
        if (node != null && node._astname != null && node._astname === "JSFor") {
            //mark the loop bounds for later labeling of variable value changes.
            var startLine = node.lineno;
            var endLine = getLastLine(node);

            loopLocations.push([startLine, endLine]);

            //check the "init" component, and mark variable there if found
            if (node.init != null) {
                markVariable(node.init);
            }

            //ditto with the "update" component, which is often an augAssign
            if (node.update != null && node.update._astname === "AugAssign") {
                markVariable(node.update);
            }
        }

        //While loops just need to have their bounds marked
        if (node != null && node._astname != null && node._astname === "While") {
            loopLocations.push([node.lineno, getLastLine(node)]);
        }

        //Python for loops. Also, JS foreach loops get sent here.
        if (node != null && node._astname != null && node._astname === "For") {
            //mark the loop bounds for later labeling of variable value changes.
            var startLine = node.lineno;
            var endLine = getLastLine(node);
            loopLocations.push([startLine, endLine]);

            var nodeIter = node.iter;
            if (nodeIter != null) {
                if (node.target._astname === "Name") {
                    if (getVariableObject(node.target.id.v) == null) {

                        //if it's not already stored in a var, we create a new variable object
                        //get the variable's name

                        var varTarget = retrieveFromList(node.target);
                        if (varTarget == null || (varTarget != null && varTarget._astname !== "Name" && varTarget._astname !== "Subscript")) {
                            return;
                        }
                        var targetName = varTarget.id.v;


                        //initialize variable object
                        var newVariable = {
                            name: targetName,
                            value: "",
                            binOp: null,
                            flagVal: "",
                            funcVar: "",
                            containedValue: [],
                            indexAndInput: {
                                input: false,
                                indexed: false,
                                strIndexed: false
                            },
                            nested: false,
                            original: false,
                            opsDone: [],
                            assignedModified: [],
                            modifyingFunctions: [],
                            nodeElements: [],
                            stringElements: []
                        };

                        var fakeValue = { _astname: "" }; //for later chacks of variable's "latest value"
                        //handling for if the iterator is a unary op or subscript node 


                        //unary ops should never happen here
                        //if (nodeIter._astname === "UnaryOp") {
                        //    var varHasOriginality = originalityLines.includes(nodeIter.lineno);
                        //    if (!originality) {
                        //        var unaryNames = [];
                        //        getNestedVariables(nodeIter, unaryNames);

                        //        for (var p in unaryNames) {
                        //            //if anything inside/stored in the variable value is original, then that counts.
                        //            var isVar = getVariableObject(unaryNames[p]);
                        //            if (isVar != null && isVar.original) {
                        //                varHasOriginality = true;
                        //                break;
                        //            }
                        //        }

                        //    }

                        //    if (varHasOriginality) {
                        //        newVariable.containedValue.push("Bool");
                        //    }
                        //    nodeIter = nodeIter.operand;
                        //}
                        if (getIndexingInNode(nodeIter)[0] && getIndexingInNode(nodeIter)[1]) {
                            newVariable.indexAndInput.indexed = true;
                        }

                        nodeIter = retrieveFromList(nodeIter);


                        //end unary/subscript handling

                        if (nodeIter._astname === "Call") {
                            if ('func' in nodeIter && 'id' in nodeIter.func && nodeIter.func.id.v === 'range') {
                                //python range()
                                newVariable.value = "Int";
                                fakeValue = { _astname: "Num", n: { v: 1 } };
                            }
                            else if ('func' in nodeIter && 'id' in nodeIter.func) {
                                if (nodeIter.func.id.v === "readInput") {
                                    //readinput
                                    newVariable.indexAndInput.input = true;
                                    fakeValue = { _astname: "Str", s: { v: "string" } };
                                }

                                var funcReturnObj = getFunctionObject(nodeIter.func.id.v);
                                if (funcReturnObj != null) {
                                    if (funcReturnObj.returns === "List") {
                                        if (funcReturnObj.nodeElements != null && funcReturnObj.nodeElements.length > 0) {
                                            fakeValue = funcReturnObj.nodeElements[0].elts[0];
                                        }
                                        if (funcReturnObj.stringElements != null) {
                                            newVariable.value = funcReturnObj.stringElements[0];
                                        }
                                        if (funcReturnObj.stringElements[0]._astname === "Name") {
                                            var userFunc = getFunctionObject(funcReturnObj.stringElements[0].id.v);
                                            if (userFunc != null) {

                                                var forFuncObj = {
                                                    startline: node.lineno,
                                                    endLine: getLastLine(node),
                                                    callName: targetName,
                                                    functionNames: []
                                                };

                                                for (var i in funcReturnObj.stringElements) {
                                                    var listItem = retrieveFromList(funcReturnObj.stringElements[i]);

                                                    if (listItem != null && listItem._astname === "Name") {
                                                        var itemIsFunction = false;
                                                        for (var u in userFunctionParameters) {
                                                            if (userFunctionParameters[u].name === listItem.id.v) {
                                                                itemIsFunction = true;
                                                                break;
                                                            }
                                                        }
                                                        if (itemIsFunction) {
                                                            forFuncObj.functionNames.push(listItem.id.v);
                                                        }
                                                    }
                                                }

                                                forLoopFuncs.push(forFuncObj);
                                                newVariable.value = "userFunction";
                                            }
                                        }
                                    }
                                    if (funcReturnObj.returns === "Str") {
                                        newVariable.value = "Str";
                                        fakeValue = { _astname: "Str", s: { v: "string" } };
                                    }
                                    copyAttributes(funcReturnObj, newVariable, ["flagVal", "funcVar", "binOp", "indexAndInput", "opsDone", "original", "containedValue", "nodeElements", "stringElements"]);
                                }
                            }
                        }
                        //listop/strop
                        if ('func' in nodeIter && 'attr' in retrieveFromList(nodeIter.func)) {
                            if (doesCallCreateList(nodeIter)) {
                                newVariable.opsDone = addOpToList("ListOp", newVariable.opsDone, nodeIter.lineno);

                                //assume first item in list is type
                                var listVal = performListOp(nodeIter)[0][0];
                                fakeValue = listVal;
                                if (listVal._astname === "BinOp") {
                                    var binList = recursivelyAnalyzeBinOp(listVal);

                                    if (Array.isArray(listVal)) {
                                        var eltsStorage = listVal;
                                        listVal = {};
                                        listVal._astname = "List";
                                        listVal.elts = eltsStorage;
                                    }

                                    else if (typeof listVal !== "string") {
                                        listVal._astname = "";
                                        newVariable.value = "BinOp";
                                        newVariable.binOp = listVal;
                                    }

                                    else {
                                        listVal._astname = "";
                                        newVariable.value = listVal;
                                    }

                                    //fill containedValue array
                                    listTypesWithin(listVal, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);
                                }


                                if (listVal._astname === "List") {
                                    newVariable.value = "List";
                                    newVariable.nodeElements = [{
                                        line: node.lineno,
                                        elts: listVal.elts
                                    }];

                                    newVariable.stringElements = [{
                                        line: node.lineno,
                                        elts: nodesToStrings(targetElts, node.lineno)
                                    }];

                                    newVariable.containedValue = listTypesWithin(listVal, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);
                                }

                                else if (listVal._astname === "Num") {
                                    if (!isNodeFloat(listVal)) {
                                        newVariable.value = "Int";
                                    }
                                    else {
                                        newVariable.value = "Float";
                                    }
                                }

                                else if (listVal._astname === "Str") {
                                    newVariable.value = "Str";
                                }

                                else if (listVal._astname === "Name") {
                                    if ('id' in listVal) {
                                        if (listVal.id.v === "True" || listVal.id.v === "False") {
                                            newVariable.value = "Bool";
                                        }
                                        else if (getFunctionObject(listVal.id.v) != null) {
                                            //a function.
                                            var userFunc = getFunctionObject(listVal.id.v);

                                            var forFuncObj = {
                                                startline: node.lineno,
                                                endLine: getLastLine(node),
                                                callName: targetName,
                                                functionNames: []
                                            };

                                            for (var i in funcReturnObj.stringElements) {
                                                var listItem = retrieveFromList(funcReturnObj.stringElements[i]);

                                                if (listItem != null && listItem._astname === "Name") {
                                                    var itemIsFunction = false;
                                                    for (var u in userFunctionParameters) {
                                                        if (userFunctionParameters[u].name === listItem.id.v) {
                                                            itemIsFunction = true;
                                                            break;
                                                        }
                                                    }
                                                    if (itemIsFunction) {
                                                        forFuncObj.functionNames.push(listItem.id.v);
                                                    }
                                                }
                                            }

                                            forLoopFuncs.push(forFuncObj);
                                            newVariable.value = "userFunction";

                                        }
                                        else {
                                            var listValVar = getVariableObject(listVal.id.v);
                                            newVariable.value = listValVar.value;

                                            copyAttributes(listValVar, newAttribute, ["flagVal", "funcVar", "binOp", "indexAndInput", "opsDone", "original", "containedValue", "nodeElements", "stringElements"]);
                                        }
                                    }
                                }
                            }

                            else if (doesCallCreateString(nodeIter)) {
                                newVariable.opsDone = addOpToList("StrOp", newVariable.opsDone, nodeIter.lineno);
                                newVariable.value = "Str";
                            }
                        }
                        if ('func' in nodeIter && (nodeIter.func._astname === "Subscript" || (retrieveFromList(nodeIter.func) != nodeIter.func))) {
                            var subVal = retrieveFromList(nodeIter.func);

                            if (subVal != null && subVal._astname === "Name") {
                                //it's a variable or function returns that contains an iterable type.

                                var subObject = getVariableObject(subVal.id.v);
                                if (subObject != null) {
                                    if (subObject.value === "List") {
                                        var varElements = mostRecentElements(subObject, node.lineno);

                                        if (varElements != null) {
                                            fakeValue = varElements[0];
                                            var firstItem = varElements[0];

                                            if (firstItem._astname === "Subscript") {
                                                firstItem = retrieveFromList(firstItem);
                                                newVariable.indexAndInput.indexed = true;
                                            }

                                            if (firstItem._astname === "List") {
                                                newVariable.value = "List";
                                                newVariable.nodeElements = [{
                                                    line: node.lineno,
                                                    elts: firstItem.elts
                                                }];
                                                newVariable.stringElements = [{
                                                    line: node.lineno,
                                                    elts: nodesToStrings(firstItem.elts, node.lineno)
                                                }];

                                                newVariable.containedValue = listTypesWithin(firstItem, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);
                                            }

                                            if (firstItem._astname === "Str") {
                                                newVariable.value = "Str";
                                            }

                                            if (firstItem._astname === "Call") {
                                                //listop
                                                if (doesCallCreateList(firstItem)) {
                                                    var listResults = performListOp(firstItem);

                                                    newVariable.value = "List";
                                                    newVariable.nodeElements = [{
                                                        line: node.lineno,
                                                        elts: listResults[0]
                                                    }];
                                                    newVariable.stringElements = [{
                                                        line: node.lineno,
                                                        elts: listResults[1]
                                                    }];


                                                    newVariable.containedValue = listTypesWithin(listResults[0], newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);
                                                    newVariable.opsDone = addOpToList("ListOp", newVariable.opsDone, thisLine);
                                                }
                                                    //strop
                                                else if (doesCallCreateString(firstItem)) {
                                                    newVariable.value = "Str";
                                                }

                                                    //subscript
                                                else if (firstItem.func._astname === "Subscript" || (retrieveFromList(firstItem) != firstItem)) {
                                                    var callVar = null;
                                                    if (firstItem.func._astname === "Subscript") {
                                                        callVar = retrieveFromList(firstItem.func);
                                                    }
                                                    else {
                                                        callVar = retrieveFromList(firstItem);
                                                    }

                                                    if (callVar._astname === "Name" && 'id' in callVar) {
                                                        var subFunc = getFunctionObject(callVar.id.v);
                                                        if (subFunc != null) {
                                                            copyAttributes(subFunc, newVariable, ["flagVal", "funcVar", "binOp", "indexAndInput", "opsDone", "containedValue", "stringElements", "nodeElements", "original"]);
                                                            newVariable.value = subFunc.returns;
                                                        }
                                                    }

                                                }
                                                    //user-defined function
                                                else if ('id' in firstItem.func) {
                                                    var functionReturn = getFunctionObject(firstItem.func.id.v);
                                                    if (functionReturn != null) {
                                                        newVariable.value = functionReturn.returns;

                                                        copyAttributes(functionReturn,
                                                            newVariable,
                                                            ["flagVal", "funcVar", "binOp", "indexAndInput", "opsDone", "original", "containedValue ", "nodeElements", "stringElements"]);
                                                    }
                                                }
                                            }

                                            if (firstItem._astname === "Name") {
                                                if ('id' in firstItem) {
                                                    var functionReturn = getFunctionObject(firstItem.func.id.v);

                                                    if (functionReturn != null) {
                                                        newVariable.value = functionReturn.returns;
                                                        copyAttributes(functionReturn,
                                                            newVariable,
                                                            ["flagVal", "funcVar", "binOp", "indexAndInput", "opsDone", "original", "containedValue ", "nodeElements", "stringElements"]);
                                                    }

                                                    else {
                                                        if (firstItem.id.v === "True" || firstItem.id.v === "False") {
                                                            newVariable.value = "Bool";
                                                        }
                                                        else {
                                                            var firstVar = getVariableObject(firstItem.id.v);

                                                            if (firstVar != null) {
                                                                copyAttributes(firstVar,
                                                                    newVariable,
                                                                    ["value", "flagVal", "funcVar", "binOp", "indexAndInput", "opsDone", "original", "containedValue", "nodeElements", "stringElements"]);
                                                            }
                                                        }
                                                    }
                                                }
                                            }

                                            if (firstItem._astname === "BinOp") {
                                                var binVal = recursivelyAnalyzeBinOp(firstItem);

                                                if (typeof binVal === "string") {
                                                    newVariable.value = binVal;
                                                }

                                                else if (Array.isArray(binVal)) {
                                                    newVariable.value = "List";
                                                    listTypesWithin(binVal, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);

                                                    newVariable.nodeElements = [{
                                                        line: node.lineno,
                                                        elts: getAllBinOpLists(firstItem)
                                                    }];
                                                    newVariable.stringElements = [{
                                                        line: node.lineno,
                                                        elts: binVal
                                                    }];
                                                }

                                                else {
                                                    newVariable.value = "BinOp"
                                                    newVariable.binOp = binVal;
                                                }
                                            }
                                        }
                                    }
                                    if (subObject.value === "Str") {
                                        newVariable.value = "Str";
                                        fakeValue = { _astname: "Str", s: { v: "string" } };
                                    }
                                }

                                subObject = getFunctionObject(subVal.id.v)
                                if (subObject != null) {
                                    newVariable.value = subObject.returns;
                                    copyAttributes(subObject, newVariable, ["flagVal", "funcVar", "binOp", "indexAndInput", "opsDone", "original", "containedValue", "nodeElements", "stringElements"]);
                                    if (subObject.returns === "Str") {
                                        fakeValue = { _astname: "Str", s: { v: "string" } };
                                    }
                                    else if (subObject.returns === "List" && subObject.nodeElements != null && subObject.nodeElements.length > 0) {
                                        fakeValue = subObject.nodeElements[0].elts[0];
                                    }
                                }
                            }
                        }

                        else if (nodeIter._astname === "Name") {
                            var iterVar = getVariableObject(nodeIter.id.v);

                            if (iterVar != null) {
                                if (iterVar.value === "Str") {
                                    newVariable.value = "Str";
                                    fakeValue = { _astname: "Str", s: { v: "string" } };
                                }

                                if (iterVar.value === "List") {
                                    var varElements = mostRecentElements(iterVar, node.lineno);

                                    if (varElements != null && varElements.length > 0 && varElements[0]._astname === "Name") {
                                        fakeValue = varElements[0];
                                        var userFunc = getFunctionObject(varElements[0].id.v);
                                        if (userFunc != null) {

                                            //treat this like it's a created function that is actually all the other functions under a different name.
                                            var forFuncObj = {
                                                startline: node.lineno,
                                                endLine: getLastLine(node),
                                                callName: targetName,
                                                functionNames: []
                                            };


                                            for (var i in varElements) {
                                                var listItem = retrieveFromList(varElements[i]);

                                                if (listItem._astname === "Name") {
                                                    var listItemIsFunction = false;
                                                    for (var u in userFunctionParameters) {
                                                        if (userFunctionParameters[u].name === listItem.id.v) {
                                                            listItemIsFunction = true;
                                                            break;
                                                        }
                                                    }
                                                    if (listItemIsFunction) {
                                                        forFuncObj.functionNames.push(listItem.id.v);
                                                    }
                                                }
                                            }
                                            newVariable.value = "userFunction";
                                            forLoopFuncs.push(forFuncObj);
                                        }
                                    }
                                    if (newVariable.value !== "userFunction" && varElements != null && varElements.length > 0) {
                                        newVariable.value = nodesToStrings(varElements, node.lineno)[0];
                                    }
                                    else if (newVariable.value !== "userFunction") { //make a fake subscript node and this can get tallied later
                                        newVariable.value = "Subscript";
                                        var fakeNode = {
                                            _astname: "Subscript",
                                            slice: { _astname: "Index", value: { n: { v: 0 } } },
                                            value: node.iter
                                        };

                                        newVariable.flagVal = fakeNode;
                                    }
                                }
                                copyAttributes(iterVar, newVariable, ["original", "funcVar", "flagVal", "binOp", "indexAndInput", "opsDone", "containedValue", "nodeElements", "stringElements"]);
                            }
                        }

                        else if (nodeIter._astname === "Str") {
                            newVariable.value = "Str";
                            newVariable.indexAndInput.strIndexed = true;
                            fakeValue = { _astname: "Str", s: { v: "string" } };
                        }

                        else if (nodeIter._astname === "List") {//we can assume that the type of the first item should reflect the rest of the list
                            newVariable.indexAndInput.indexed = true;
                            var firstValue = nodeIter.elts[0];
                            fakeValue = firstValue;
                            if (firstValue._astname === "BoolOp" || firstValue._astname === "Compare") {
                                newVariable.value = "Bool";

                                if (firstValue._astname === "BoolOp") {
                                    listTypesWithin(firstValue, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);
                                }
                                if (firstValue._astname === "Compare") {
                                    listTypesWithin(firstValue, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);
                                }
                            }
                            if (firstValue._astname === "Name") {
                                if ('id' in firstValue) {
                                    if (firstValue.id.v === "True" || firstValue.id.v === "False") {
                                        newVariable.value = "Bool";
                                    }
                                    else {
                                        var firstVar = getVariableObject(firstValue.id.v);

                                        if (firstVar != null) {
                                            copyAttributes(firstVar, newVariable, ["value", "flagVal", "funcVar", "binOp", "indexAndInput", "opsDone", "original", "containedValue", "nodeElements", "ektsList"]);
                                        }

                                        else {
                                            var userFunc = getFunctionObject(firstValue.id.v);

                                            if (userFunc != null) {
                                                var forFuncObj = {
                                                    startline: node.lineno,
                                                    endLine: getLastLine(node),
                                                    callName: targetName,
                                                    functionNames: []
                                                };

                                                //now we have to get the list elts and shove EVERY function name in there. and validate that it is a function BECAUSE PYTHON IS STUPID
                                                for (var i in nodeIter.elts) {
                                                    var iterListItem = nodeIter.elts[i];
                                                    iterListItem = retrieveFromList(iterListItem);
                                                    if (iterListItem._astname === "Name") {
                                                        var foundIter = false;
                                                        for (var u in userFunctionParameters) {
                                                            if (userFunctionParameters[u].name === iterListItem.id.v) {
                                                                foundIter = true;
                                                                break;
                                                            }
                                                        }
                                                        if (foundIter) { forFuncObj.functionNames.push(iterListItem.id.v); }
                                                    }
                                                }

                                                forLoopFuncs.push(forFuncObj);
                                                newVariable.value = "userFunction";
                                            }
                                        }
                                    }
                                }
                            }
                            else if (firstValue._astname === "Call") {
                                if ('id' in firstValue.func) {
                                    var firstFunc = getFunctionObject(firstValue.func.id.v);
                                    if (firstFunc != null) {
                                        newVariable.value = firstFunc.returns;
                                        copyAttributes(firstFunc, newVariable, ["flagVal", "funcVar", "binOp", "indexAndInput", "opsDone", "original", "containedValue", "nodeElements", "stringElements"]);
                                    }
                                }
                                //subscript
                                if (firstValue.func._astname === "Subscript" || retrieveFromList(firstValue) != firstValue) {
                                    var subVal = null;
                                    subVal = retrieveFromList(firstValue);
                                    if (subVal != null) {
                                        if ('id' in subVal) {
                                            var subFunction = getFunctionObject(subVal.id.v);

                                            if (subFunction != null) {
                                                newVariable.value = subFunction.returns;
                                                copyAttributes(subFunction, newVariable, ["flagVal", "funcVar", "binOp", "indexAndInput", "opsDone", "original", "containedValue", "nodeElements", "stringElements"]);
                                            }
                                        }
                                    }
                                }
                                //listop
                                if (doesCallCreateList(firstValue)) {
                                    newVariable.value = "List";
                                    newVariable.opsDone = addOpToList("ListOp", newVariable.opsDone, node.lineno);
                                    var variableElts = performListOp(firstValue, node.lineno);

                                    newVariable.nodeElements = [{
                                        line: node.lineno,
                                        elts: variableElts[0]
                                    }];
                                    newVariable.stringElements = [{
                                        line: node.lineno,
                                        elts: variableElts[1]
                                    }];

                                    newVariable.containedValue = listTypesWithin(firstValue, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone)
                                }

                                //strop
                                if (isCallAStrOp(firstValue)) {
                                    newVariable.value = "Str";
                                    newVariable.opsDone = addOpToList("StrOp", newVariable.opsDone, node.lineno);
                                }
                            }
                            else if (firstValue._astname === "List") {
                                newVariable.value = "List";

                                newVariable.nodeElements = [{
                                    line: node.lineno,
                                    elts: firstValue.elts
                                }];
                                newVariable.stringElements = [{
                                    line: node.lineno,
                                    elts: nodesToStrings(firstValue.elts, node.lineno)
                                }];

                                newVariable.containedValue = listTypesWithin(firstValue, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);
                            }

                            else if (firstValue._astname === "Str") {
                                newVariable.value = "Str";
                            }

                            else if (firstValue._astname === "Num") {
                                if (!isNodeFloat(firstValue)) {
                                    newVariable.value = "Int";
                                }
                                else {
                                    newVariable.value = "Float";
                                }
                            }

                            else if (firstValue._astname === "Subscript") {
                                var subValue = retrieveFromList(firstValue);

                                if (subValue != null) {
                                    if (subValue._astname === "List") {
                                        newVariable.value = "List";
                                        newVariable.nodeElements = [{
                                            line: node.lineno,
                                            elts: subValue.elts
                                        }];
                                        newVariable.stringElements = [{
                                            line: node.lineno,
                                            elts: nodesToStrings(subValue.elts, node.lineno)
                                        }];
                                    }

                                    if (subValue._astname === "Name") {//variable or bool or function
                                        if ('id' in subValue) {
                                            if (subValue.id.v === "True" && subValue.id.v === "False") {
                                                newVariable.value = "Bool";
                                            }
                                            else {
                                                var foundVar = getVariableObject(subValue.id.v);
                                                if (foundVar != null) {
                                                    copyAttributes(foundVar, newVariable, ["value", "indexAndInput", "original", "containedValue"]);
                                                }

                                                else {
                                                    var userFunc = getFunctionObject(subValue.id.v);

                                                    if (userFunc != null) {

                                                        var forFuncObj = {
                                                            startline: node.lineno,
                                                            endLine: getLastLine(node),
                                                            callName: targetName,
                                                            functionNames: []
                                                        };

                                                        //treat this like a series function renames
                                                        for (var i in nodeIter.elts) {
                                                            var iterListItem = nodeIter.elts[i];
                                                            iterListItem = retrieveFromList(iterListItem);

                                                            if (iterListItem._astname === "Name") {
                                                                var foundIter = false;

                                                                for (var u in userFunctionParameters) {
                                                                    if (userFunctionParameters[u].name === iterListItem.id.v) {
                                                                        foundIter = true;
                                                                        break;
                                                                    }
                                                                }

                                                                if (foundIter) {
                                                                    forFuncObj.functionNames.push(iterListItem.id.v);
                                                                }
                                                            }
                                                        }

                                                        forLoopFuncs.push(forFuncObj);
                                                        newVariable.value = "userFunction";
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (subValue._astname === "Call") {
                                        //listop
                                        if (doesCallCreateList(subValue)) {
                                            newVariable.value = "List";
                                            newVariable.opsDone = addOpToList("ListOp", newVariable.opsDone, node.lineno);


                                            var eltsObjects = performListOp(subValue);

                                            newVariable.nodeElements = [{
                                                line: node.lineno,
                                                elts: eltsObjects[0]
                                            }];
                                            newVariable.stringElements = [{
                                                line: node.lineno,
                                                elts: eltsObjects[1]
                                            }];
                                        }
                                        //strop
                                        if (doesCallCreateString(subValue)) {
                                            newVariable.opsDone = addOpToList("StrOp", newVariable.opsDone, node.lineno);
                                            newVariable.value = "Str";
                                        }
                                        //udf
                                        if ('id' in subValue.func) {
                                            var foundFunc = getFunctionObject(subValue.func.id.v);
                                            if (foundFunc != null) {
                                                newVariable.value = foundFunc.returns;
                                                copyAttributes(foundFunc, newVariable, ["nodeElements", "stringElements", "flagVal", "funcVar"]);
                                            }
                                        }
                                        //subscript
                                        if (subValue.func._astname === "Subscript" || retrieveFromList(subValue.func) != subValue.func) {
                                            var nestedSubscript = retrieveFromList(subValue.func);
                                            if (nestedSubscript != null && nestedSubscript._astname === "Name") {
                                                var subFuncFound = getFunctionObject(nestedSubscript.id.v);
                                                if (subFuncFound != null) {
                                                    copyAttributes(subFuncFound, newVariable, ["flagVal", "funcVar", "binOp", "indexAndInput", "opsDone", "original", "containedValue", "nodeElements", "stringElements"]);
                                                    newVariable.value = subFuncFound.returns;
                                                }
                                            }
                                        }
                                    }

                                    if (subValue._astname === "Num") {
                                        if (!isNodeFloat(subValue)) {
                                            newVariable.value = "Int";
                                        }
                                        else {
                                            newVariable.value = "Float";
                                        }
                                    }
                                }
                            }
                            else if (firstValue._astname === "BinOp") {
                                var binVal = recursivelyAnalyzeBinOp(firstValue);

                                if (typeof binVal === "string") {
                                    newVariable.value = binVal;
                                }
                                else if (Array.isArray(binVal)) {
                                    newVariable.value = "List";
                                    newVariable.stringElements = [{
                                        line: node.lineno,
                                        elts: binVal
                                    }];
                                    newVariable.nodeElements = [{
                                        line: node.lineno,
                                        elts: getAllBinOpLists(firstValue)
                                    }];
                                }

                                else {
                                    newVariable.value = "BinOp";
                                    newVariable.binOp = binVal;
                                }

                                listTypesWithin(firstValue, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);
                            }
                        }
                        else if (nodeIter._astname === "BinOp") {//evaluate the binOp
                            var binopVar = recursivelyAnalyzeBinOp(nodeIter);

                            if (binopVar.type === "string") {
                                newVariable.value = binopVar;
                                newVariable.opsDone = ["BinOp"];
                                newVariable.containedValue = listTypesWithin(nodeIter, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);
                                fakeValue = { _astname: "Str", s: { v: "string" } };
                            }

                            else if (Array.isArray(binopVar)) {
                                newVariable.value = "List";
                                newVariable.containedValue = listTypesWithin(nodeIter, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);
                                fakeValue = binOpVar[0];
                                var allLists = getAllBinOpLists(binopVar);
                                var userFunc = getFunctionObject(firstValue.id.v);
                                if (userFunc != null) {

                                    var forFuncObj = {
                                        startline: node.lineno,
                                        endLine: getLastLine(node),
                                        callName: targetName,
                                        functionNames: []
                                    };

                                    //series of renames in forLoopFuncs
                                    for (var i in allLists) {
                                        var iterListItem = allLists[i];
                                        iterListItem = retrieveFromList(iterListItem);
                                        if (iterListItem != null && iterListItem._astname === "Name") {
                                            var foundIter = false;

                                            for (var u in userFunctionParameters) {

                                                if (userFunctionParameters[u].name === iterListItem.id.v) {
                                                    foundIter = true;
                                                    break;
                                                }

                                            }
                                            if (foundIter) {
                                                forFuncObj.functionNames.push(iterListItem.id.v);
                                            }
                                        }
                                    }
                                    forLoopFuncs.push(forFuncObj);
                                    newVariable.value = "userFunction";
                                }
                            }
                            else {
                                newVariable.value = "BinOp"
                                newVariable.binOp = binopVar;
                                newVariable.containedValue = listTypesWithin(nodeIter, newVariable.containedValue, newVariable.indexAndInput, newVariable.opsDone);
                            }
                        }

                        //finish creating the variable object and add it to our list
                        var lineNumber = 0;
                        var modFunc = [];
                        if (node.lineno != null) {
                            lineNumber = node.lineno;
                            parentLineNumber = lineNumber;
                        }
                        else {
                            lineNumber = parentLineNumber;
                        }


                        if (originalityLines.includes(lineNumber)) {

                            newVariable.original = true;
                            for (var u = 0; u < userFunctionReturns.length; u++) {

                                //if we are inside a function, and the variable being updated is a function parameter, save the name to the function's list of parameters changed.

                                if (node.lineno >= userFunctionReturns[u].startLine && node.lineno <= userFunctionReturns[u].endLine) {
                                    var paramIndex = -1;

                                    for (var a = 0; a < userFunctionParameters.length; a++) {

                                        if (userFunctionParameters[a].name === userFunctionReturns[u].name) {
                                            for (var p = 0; p < userFunctionParameters[a].params.length; p++) {
                                                if (userFunctionParameters[a].params[p] === varName) {
                                                    paramIndex = p;
                                                    break;
                                                }
                                            }
                                            break;
                                        }
                                    }

                                    if (paramIndex > -1) {
                                        userFunctionReturns[u].paramsChanged.push(paramIndex);
                                        modFunc.push([userFunctionReturns[u].startLine, userFunctionReturns[u].endLine]);
                                    }
                                    break;
                                }
                            }

                            //Mark the assignment at the first line of the loop
                            var lineNo = node.lineno;
                            for (var h = 0; h < loopLocations.length; h++) {
                                if (lineNo >= loopLocations[h][0] && lineNo <= loopLocations[h][1]) {
                                    lineNo = loopLocations[h][0];
                                    break;
                                }
                            }

                            if (fakeValue == null) {
                                fakeValue = { _astname: "", lineno: node.lineno };
                            }

                            //done twice intentionally; that way this ALWAYS registers as the variable's value being changed, which is what we want.
                            newVariable.assignedModified.push({ line: lineNo, value: studentCode[lineNumber].trim(), original: true, nodeValue: fakeValue });
                            newVariable.assignedModified.push({ line: lineNo, value: studentCode[lineNumber].trim(), original: true, nodeValue: fakeValue });


                            allVariables.push(newVariable);
                            variableAssignments.push({ line: node.lineno, name: newVariable.name });
                        }

                    }
                }
            }
        }

        if (node != null && node._astname != null && node._astname === "If" && node.orelse != null) {
            gatherAllVariables(node.orelse);
        }

        if (node != null && node._astname != null && node._astname === "Call") {
            var functionNode = retrieveFromList(node.func);
            var valueItem = { _astname: "" };
            if (functionNode != null && "attr" in functionNode) {
                lineNumber = 0;

                if (node.lineno != null) {
                    lineNumber = node.lineno;
                    parentLineNumber = lineNumber;
                }
                else {
                    lineNumber = parentLineNumber;
                }

                var isInForLoop = false;
                for (var n in loopLocations) {
                    if (loopLocations[n][0] < lineNumber && loopLocations[n][1] > lineNumber) {
                        isInForLoop = true;
                    }
                }

                var modOriginality = (originalityLines.includes(lineNumber));
                var funcName = functionNode.attr.v;

                if (listFuncs.includes(funcName)) {

                    var valueString = studentCode[node.lineno - 1];

                    //is a variable being passed to it? If not, we can return.
                    if (functionNode.value._astname === "Name" && functionNode.value.id.v !== "True" && functionNode.value.id.v !== "False") {
                        var varName = functionNode.value.id.v;

                        var variableObject = getVariableObject(varName);
                        if (variableObject == null) {
                            return;
                        }


                        //test for duplication and add if not a duplicate

                        //AugAssign
                        var assignmentAlreadyExists = false;
                        for (var p = 0; p < variableObject.assignedModified.length; p++) {
                            if (variableObject.assignedModified[p].value === valueString) {
                                assignmentAlreadyExists = true;
                                break;
                            }
                        }
                        if (performListOp(node)[0] != null) {
                            valueItem = performListOp(node)[0][0];
                        }
                        if (!assignmentAlreadyExists) {
                            var lineNo = node.lineno;

                            for (var h = 0; h < loopLocations.length; h++) {
                                if (lineNo >= loopLocations[h][0] && lineNo <= loopLocations[h][1]) {
                                    lineNo = loopLocations[h][0];
                                    break;
                                }
                            }

                            variableObject.assignedModified.push({
                                line: lineNo,
                                value: trimCommentsAndWhitespace(valueString),
                                original: modOriginality,
                                nodeValue: valueItem
                            });
                            variableAssignments.push({ line: node.lineno, name: variableObject.name });

                            if (isInForLoop) { //push a second time if we're in a loop.
                                variableObject.assignedModified.push({
                                    line: lineNo,
                                    value: trimCommentsAndWhitespace(valueString),
                                    original: modOriginality,
                                    nodeValue: valueItem
                                });
                            }
                            variableObject.nodeElements.push({
                                line: node.lineno,
                                elts: performListOp(node)[0]
                            });

                            variableObject.stringElements.push({
                                line: node.lineno,
                                elts: performListOp(node)[1]
                            });
                        }

                    }
                }
            }
        }

        if (node != null && node._astname != null && node._astname === 'AugAssign') {
            lineNumber = 0;

            if (node.lineno != null) {
                lineNumber = node.lineno;
                parentLineNumber = lineNumber;
            }
            else {
                lineNumber = parentLineNumber;
            }


            var isInForLoop = false;
            for (var n in loopLocations) {
                if (loopLocations[n][0] < lineNumber && loopLocations[n][1] > lineNumber) {
                    isInForLoop = true;
                    break;
                }
            }


            var modOriginality = (originalityLines.includes(lineNumber));;
            var assignLine = node.value.lineno - 1;
            var offset = node.value.col_offset;
            var valueString = node.op.name + " " + studentCode[assignLine].substring(offset);

            var indexOfExistingVariableObj = -1;

            varTarget = retrieveFromList(node.target);
            if (varTarget != null && varTarget._astname !== "Name" && varTarget._astname !== "Subscript") {
                return;
            }


            var varName = varTarget.id.v;
            var variableObject = getVariableObject(varName);
            if (variableObject == null) {
                return;
            }

            variableObject.opsDone = addOpToList("AugAssign", variableObject.opsDone, node.lineno);
            var modificationAlreadyExists = false;
            for (var p = 0; p < variableObject.assignedModified.length; p++) {
                if (variableObject.assignedModified[p].value === valueString) {
                    modificationAlreadyExists = true;
                    break;
                }
            }

            //the infrastructure we have for binops can handle the input and indexing stuff we need to handle, so we make a fake binop here to get that information.
            fakeBinOp = {
                _astname: "BinOp",
                left: node.target,
                right: node.value,
                lineno: lineNumber
            };

            var nestedBinOp = [];
            getNestedVariables(fakeBinOp, nestedBinOp);
            if (nestedBinOp.length > 0) {
                variableObject.nested = true;
            }

            binVal = recursivelyAnalyzeBinOp(fakeBinOp);
            var varVal = "";

            if (Array.isArray(binVal)) {
                varVal = "List";
                variableObject.nodeElements.push({
                    line: node.lineno,
                    elts: getAllBinOpLists(fakeBinOp)
                });
                variableObject.stringElements.push({
                    line: node.lineno,
                    elts: nodesToStrings(getAllBinOpLists(fakeBinOp), node.lineno)
                });

                appendArray(nodesToStrings(binVal, node.lineno), variableObject.containedValue);
                variableObject.containedValue.push("List");
                variableObject.opsDone = addOpToList("ListOp", variableObject.opsDone, node.lineno);
            }

            if (binVal === "Str") {
                containsOps = addOpToList("StrOp", variableObject.opsDone, node.lineno);
            }

            if (typeof binVal !== "string" && !Array.isArray(binVal)) {
                varVal = "BinOp";
            }

            variableObject.opsDone = addOpToList("BinOp", variableObject.opsDone, node.lineno);
            var binOpTypes = listTypesWithin(fakeBinOp, [], variableObject.indexAndInput, variableObject.opsDone);
            appendArray(binOpTypes, variableObject.containedValue);


            if (!modificationAlreadyExists) {
                var lineNo = node.lineno;
                for (var h = 0; h < loopLocations.length; h++) {
                    if (lineNo >= loopLocations[h][0] && lineNo <= loopLocations[h][1]) {
                        lineNo = loopLocations[h][0];
                        break;
                    }
                }

                variableObject.assignedModified.push({
                    line: lineNo,
                    value: trimCommentsAndWhitespace(valueString),
                    original: modOriginality,
                    nodeValue: node,
                    binop: binVal
                });
                variableAssignments.push({ line: node.lineno, name: variableObject.name });

                if (isInForLoop) { //push twice for loops
                    variableObject.assignedModified.push({
                        line: lineNo,
                        value: trimCommentsAndWhitespace(valueString),
                        original: modOriginality,
                        nodeValue: node,
                        binop: binVal
                    });
                }
            }

        }


        if (node != null && node._astname != null && node._astname === 'Assign') {

            var containedVal = [];
            if ('id' in node.value || node.value._astname === "Subscript" || node.value._astname === "FunctionExp" || node.value._astname === "Call") {
                //if the user is assigning a function to a variable 
                var isFunction = false;

                var assignedName = "";
                var assignedVal = null;

                if (node.value._astname !== "Call") {
                    assignedVal = node.value;
                    isFunction = true;
                }
                else {
                    var funcNode = retrieveFromList(node.value.func);
                    if (funcNode._astname === "Name" && getFunctionObject(funcNode.id.v) != null && getFunctionObject(funcNode.id.v).returns === "Function") {
                        assignedName = getFunctionObject(funcNode.id.v).flagVal;
                        isFunction = true;
                    }
                }

                if (isFunction) {
                    var subscripted = false;

                    if (assignedVal != null) {
                        if (assignedVal._astname === "UnaryOp") {
                            containedVal.push("Bool");
                            assignedVal = assignedVal.operand;
                        }

                        if (assignedVal != null && typeof assignedVal === 'object' &&
                            assignedVal._astname != null && assignedVal._astname === "Subscript" &&
                            getIndexingInNode(assignedVal)[0]) {
                            subscripted = true;
                        }

                        assignedVal = retrieveFromList(assignedVal);

                        if (assignedVal != null && typeof assignedVal === 'object' && assignedVal._astname != null && assignedVal._astname === "UnaryOp") {
                            containedVal.push("Bool");
                            assignedVal = assignedVal.operand;
                        }

                        if (assignedVal != null && node.value._astname !== "Call") {
                            if ('id' in assignedVal) {
                                assignedName = assignedVal.id.v;
                            }
                            else {
                                assignedName = "" + assignedVal.lineno + "|" + assignedVal.col_offset;
                            }
                        }
                    }


                    if (assignedName !== "") {
                        var varTarget = retrieveFromList(node.targets[0]);

                        if (varTarget == null || (varTarget != null && varTarget._astname !== "Name" && varTarget._astname !== "Subscript")) {
                            return;
                        }

                        else {

                            var varName = varTarget.id.v;

                            if (assignedName === "makeBeat" || makeBeatRenames.includes(assignedName)) {
                                //special case if user renames makeBeat
                                makeBeatRenames.push(varName);
                            }

                            for (var n = 0; n < userFunctionParameters.length; n++) {
                                if (userFunctionParameters[n].name === assignedName) { //double check and make sure its not already in here
                                    var alreadyMarked = false;

                                    for (var j = 0; j < userFunctionParameters.length; j++) {
                                        if (userFunctionParameters[j].name === varName) {
                                            alreadyMarked = true;
                                            break;
                                        }
                                    }

                                    if (!alreadyMarked) {
                                        newFunctionObject = {};
                                        Object.assign(newFunctionObject, userFunctionParameters[n]);
                                        newFunctionObject.name = varName;

                                        userFunctionParameters.push(newFunctionObject);
                                    }
                                }
                            }


                            for (var p = 0; p < userFunctionReturns.length; p++) {
                                if (assignedName === userFunctionReturns[p].name) {
                                    for (var i = 0; i < userFunctionReturns.length; i++) {
                                        if (userFunctionReturns[i].name === varName) {
                                            return;
                                        } //if it's already been marked we don't need to do anything else.

                                    }

                                    var newReturn = {};
                                    Object.assign(newReturn, userFunctionReturns[p]);
                                    newReturn.name = varName;

                                    if (subscripted) {
                                        newReturn.indexAndInput.indexed = true;
                                    }
                                    userFunctionReturns.push(newReturn);

                                    //if the function we're reassigning is a reassign of something else
                                    var reassignedFuncName = assignedName;
                                    for (var n = 0; n < userFunctionRenames; n++) {
                                        if (userFunctionRenames[n][0] === reassignedFuncName) {
                                            reassignedFuncName = userFunctionRenames[n][1];
                                        }
                                    }
                                    userFunctionRenames.push([varName, reassignedFuncName]);
                                    return;
                                }
                            }
                        }

                        //ELSE if rename of api function, ignore it completely. 
                        if (assignedVal != null && apiFunctions.includes(assignedName)) {
                            return;
                        }
                    }
                }
            }


            //otherwise we go on to marking the variable
            var listElts = [];
            var funcOrVar = "";
            var flag = "";
            var indexOfExistingVariableObj = -1;
            var varTarget = retrieveFromList(node.targets[0]);

            if ((varTarget != null && varTarget._astname !== "Name" && varTarget._astname !== "Subscript") || varTarget == null) {
                return;
            }

            //variable init
            varName = varTarget.id.v;
            var varVal = ""
            var binVal = null;
            var inputIndexing = { input: false, indexed: false, strIndexed: false };
            var containsNested = false;
            var isNewAssignmentValue = false;
            var containsOps = [];
            var assignLine = node.value.lineno - 1;
            var offset = node.value.col_offset;
            var valueString = studentCode[assignLine].substring(offset);
            var subscriptString = false;
            var nodeVal = node.value;
            var carryOriginality = false;
            var copiedElts = null;


            //mark subscripting and listops, if applicable
            if (nodeVal._astname === "Subscript") {
                inputIndexing.strIndexed = getStringIndexingInNode(node.value)[0];
                if (inputIndexing.strIndexed) {
                    varVal = "Str";
                }
                else {
                    inputIndexing.indexed = getIndexingInNode(node.value)[0];

                    if (nodeVal == null || (nodeVal != null && nodeVal._astname == null)) {   //save as a whole subscript node.
                        varVal = "Subscript";
                        flag = node.value;
                    }
                }
            }
            else if (retrieveFromList(nodeVal) != nodeVal) {
                containsOps = addOpToList("ListOp", containsOps, node.lineno);
                if (nodeVal == null || (nodeVal != null && nodeVal._astname == null)) {   //save as a whole subscript node.
                    varVal = "Subscript";
                    flag = node.value;
                }
            }

            nodeVal = retrieveFromList(nodeVal);


            if (nodeVal != null && nodeVal._astname != null) {
                if (nodeVal._astname === "UnaryOp" || nodeVal._astname === 'Compare' || (nodeVal._astname === 'Name' && nodeVal.id.v != null && ((nodeVal.id.v === "True" || nodeVal.id.v === "False")))) {
                    varVal = "Bool";
                    if (nodeVal._astname === "Compare") {
                        containsOps = addOpToList("Compare", containsOps, node.lineno);
                        var compareTypes = [];

                        listTypesWithin(nodeVal, compareTypes, inputIndexing, containsOps);
                        containedVal = compareTypes;

                    }
                }

                else if (nodeVal._astname === 'Name') { //this means it contains the value of another variable or function
                    containsNested = true;
                    var otherVar = getVariableObject(nodeVal.id.v);
                    if (otherVar != null && otherVar.value !== "" && otherVar.value !== "BinOp") {
                        varVal = otherVar.value;

                        if (otherVar.indexAndInput.input) {
                            inputIndexing.input = true;
                        }
                        containsOps = appendOpList(otherVar.opsDone, containsOps);
                        if (otherVar.indexAndInput.indexed) {
                            inputIndexing.indexed = true;
                        }
                        if (otherVar.indexAndInput.strIndexed) {
                            inputIndexing.strIndexed = true;
                        }
                        if (otherVar.nodeElements != null) {
                            copiedElts = [];
                            appendArray(otherVar.nodeElements, copiedElts);
                        }

                        appendArray(otherVar.containedValue, containedVal);
                    }
                    if (otherVar == null && getFunctionObject(nodeVal.id.v) != null) {
                        varVal = "func";
                        flag = nodeVal.id.v;
                    }
                    if (varVal === "") { //if we don't know what THAT variable is, make a note of it to be analyzed later and move on.
                        funcOrVar = "var";
                        flag = nodeVal.id.v;
                    }
                }

                if (nodeVal._astname === 'List') {
                    varVal = "List";
                    listElts = nodeVal.elts;
                    containedVal = listTypesWithin(nodeVal, containedVal, inputIndexing, containsOps);
                    var hasNames = [];
                    getNestedVariables(nodeVal, hasNames);
                    if (hasNames.length > 0) {
                        containsNested = true;
                    }
                }

                if (nodeVal._astname === 'Call') {
                    //special cases for listops and stringop
                    var funcName = "";
                    if ('id' in nodeVal.func) {
                        funcName = nodeVal.func.id.v;
                    }
                    else if ('attr' in nodeVal.func) {
                        funcName = nodeVal.func.attr.v;
                    }
                    if (funcName === 'readInput') {
                        inputIndexing.input = true;
                    }

                    var isListFunc = false, isStrFunc = false;

                    //disambiguation between operations that can be done to strings and lists in JS
                    if (JS_STR_LIST_OVERLAP.includes(funcName) && isJavascript) {
                        var operationType = getTypeFromNode(nodeVal.func.value);
                        if (operationType === "List") {
                            isListFunc = true;
                        }
                        else if (operationType === "Str") {
                            isStrFunc = true;
                        }
                        else if (operationType === "") {
                            isListFunc, isStrFunc = true;
                        }
                    }

                    if ('attr' in nodeVal.func && listFuncs.includes(funcName) && !isStrFunc && funcName !== "shuffleList") {
                        varVal = "List";
                        containsOps = addOpToList("ListOp", containsOps, node.lineno);
                        if (doesCallCreateList(nodeVal)) {
                            listElts = performListOp(nodeVal)[0];
                        }

                        if (nodeVal.func.value._astname === "List") {
                            var valuesInList = listTypesWithin(nodeVal.func.value, [], inputIndexing, containsOps);
                            for (var vil = 0; vil < valuesInList; vil++) {
                                containedVal.push(valuesInList[vil]);
                            }
                        }

                        //binop
                        if (nodeVal.func.value._astname === "BinOp") {
                            var valsInOp = [];
                            containsOps = addOpToList("BinOp", containsOps, node.lineno);
                            listTypesWithin(nodeVal.func.value, valsInOp, inputIndexing, containsOps);
                            for (var vio = 0; vio < valsInOp.length; vio++) {
                                containedVal.push(valsInOp[vio]);
                            }
                        }

                        //func call
                        if (nodeVal.func.value._astname === "Call") {
                            var calledFunction = getFunctionObject(nodeVal.func.value.id.v);

                            if (calledFunction != null) {
                                if (calledFunction.containedValue != null) {
                                    appendArray(calledFunction.containedValue, containedVal);
                                }
                                if (calledFunction.opsDone != null) {
                                    appendOpList(calledFunction.opsDone, containsOps);
                                }
                            }
                        }

                        //var
                        if (nodeVal.func.value._astname === "Name") {//we have to find the other variable
                            var foundVariable = getVariableObject(nodeVal.func.value.id.v);

                            if (foundVariable != null) {
                                appendArray(foundVariable.containedValue, containedVal);
                                containsOps = appendOpList(foundVariable.opsDone, containsOps);
                            }
                        }
                    }
                    if (strFuncs.includes(funcName) && !isListFunc) {
                        varVal = "Str";
                        containsOps = addOpToList("StrOp", containsOps, node.lineno);

                        if (nodeVal.func.value._astname === "Name") {
                            var varNum = getVariableObject(nodeVal.func.value.id.v);
                            if (varNum != null) {
                                appendArray(varNum.containedValue, containedVal);
                                containsOps = appendOpList(varNum.opsDone, containsOps);
                            }
                        }
                        if (nodeVal.func.value._astname === "BinOp") {
                            var valsInOp = [];
                            containsOps = addOpToList("BinOp", containsOps, node.lineno);
                            listTypesWithin(nodeVal.func.value, valsInOp, inputIndexing, containsOps);

                            for (var v = 0; v < valsInOp.length; v++) {
                                containedVal.push(valsInOp[v]);
                            }
                        }

                        if (nodeVal.func.value._astname === "Call") {
                            var funcName = "";
                            if ('id' in nodeVal.func) {
                                funcName = nodeVal.func.id.v;
                            }
                            else {
                                funcName = nodeVal.func.attr.v;
                            }
                            var nodeFunction = getFunctionObject(funcName);


                            if (nodeFunction != null) {
                                if (nodeFunction.containedValue != null) {
                                    appendArray(nodeFunction.containedValue, containedVal);
                                }
                                if (nodeFunction.opsDone != null) {
                                    containsOps = appendOpList(nodeFunction.opsDone, containsOps);
                                }
                            }
                        }

                        if (funcName === "split") {
                            listElts = [{
                                line: node.lineno,
                                elts: [nodeVal.func.value]
                            }];
                        }
                    }


                    var assignedFunctionReturn = getFunctionObject(funcName);

                    if (assignedFunctionReturn != null && assignedFunctionReturn.returns !== "" && assignedFunctionReturn.returns !== "BinOp") {
                        varVal = assignedFunctionReturn.returns;
                        if (assignedFunctionReturn.indexAndInput != null) {
                            inputIndexing = assignedFunctionReturn.indexAndInput;
                        }
                        if (assignedFunctionReturn.opsDone != null) {
                            containsOps = appendOpList(assignedFunctionReturn.opsDone, containsOps);
                        }
                        if (assignedFunctionReturn.containedValue != null) {
                            containedVal = appendArray(assignedFunctionReturn.containedValue, containedVal);
                        }
                        if (assignedFunctionReturn.nodeElements != null && assignedFunctionReturn.nodeElements.length > 0) {
                            copiedElts = [];
                            copiedElts.push(assignedFunctionReturn.nodeElements[0]);
                        }
                        if (assignedFunctionReturn.original != null && assignedFunctionReturn.original === true) {
                            carryOriginality = true;
                        }
                        if (assignedFunctionReturn.nested != null) {
                            containsNested = true;
                        }
                    }
                    if (varVal === "") {
                        funcOrVar = "func";
                        flag = funcName;
                    }
                }
                if (nodeVal._astname === "BoolOp" || nodeVal._astname === "BinOp" || nodeVal._astname === "Compare" || nodeVal._astname === "List") {
                    if (getIndexingInNode(nodeVal)[0]) {
                        inputIndexing.indexed = true;
                    }
                    if (getStringIndexingInNode(nodeVal)[0]) {
                        inputIndexing.strIndexed = true;
                    }
                }
                if (nodeVal._astname === "BoolOp") {//see what's inside in case there are other variables in the boolop
                    var nestedVariables = [];
                    getNestedVariables(nodeVal, nestedVariables);
                    containsOps = addOpToList("BoolOp", containsOps, node.lineno);

                    if (nestedVariables.length > 0) {
                        containsNested = true;
                    }

                    varVal = "Bool";
                    var boolOpVals = [];
                    listTypesWithin(nodeVal, boolOpVals, inputIndexing, containsOps);
                    if (boolOpVals.length > 0) {
                        containedVal = boolOpVals;
                    }
                }
                if (nodeVal._astname === 'BinOp') {
                    //If it's a BinOp, recursively analyze and include in containedValue.
                    //also, see if other variables are in the BinOp (which actually happens first)
                    var nestedBinOp = [];
                    getNestedVariables(nodeVal, nestedBinOp);
                    if (nestedBinOp.length > 0) {
                        containsNested = true;
                    }
                    if (Array.isArray(recursivelyAnalyzeBinOp(nodeVal))) {
                        listElts = getAllBinOpLists(nodeVal);
                    }


                    var binVal = recursivelyAnalyzeBinOp(nodeVal);
                    if (binVal != null && typeof binVal === 'string' && !binVal.includes(':')) {
                        varVal = binVal;
                    }
                    else if (Array.isArray(binVal)) {
                        varVal = "List";
                        listElts = getAllBinOpLists(nodeVal);
                        containedVal = binVal;
                        containsOps = addOpToList("ListOp", containsOps, node.lineno);
                    }
                    if (varVal === "Str") {
                        containsOps = addOpToList("StrOp", containsOps, node.lineno);
                    }
                    if (typeof binVal !== "string" && !Array.isArray(binVal)) {
                        varVal = "BinOp";
                    }

                    containsOps = addOpToList("BinOp", containsOps, node.lineno);
                    containedVal = listTypesWithin(nodeVal, [], inputIndexing, containsOps);
                }

                if (nodeVal._astname === 'Num') { //test if it's an int or float
                    if (!isNodeFloat(nodeVal)) {
                        varVal = 'Int';
                    }
                    else {
                        varVal = 'Float';
                    }
                }
                if (nodeVal._astname === "Str") {
                    varVal = "Str";
                }

                if (typeof nodeVal === "string") {
                    varVal = node.value;
                    flag = nodeVal;
                }
            }

            if (varVal !== "" || flag !== "") {

                //if we have ANY kind of information, add the variable to the list; or, if the variable is already in the list, update the value.
                for (i = 0; i < allVariables.length; i++) {
                    if (allVariables[i].name === varName) {
                        indexOfExistingVariableObj = i;
                        break;
                    }
                }

                if (indexOfExistingVariableObj === -1) {
                    var invalidTransformation = false; //This gets set to true if the variable's value is being set to itself, ex. myVariable = myVariable.

                    if (node.value._astname === "Name" && node.targets[0].id.v === node.value.id.v) {
                        invalidTransformation = true;
                    }


                    lineNumber = 0;
                    var modFunc = [];
                    if (node.lineno != null) {
                        lineNumber = node.lineno;
                        parentLineNumber = lineNumber;
                    }
                    else {
                        lineNumber = parentLineNumber;
                    }

                    var modOriginality = (originalityLines.includes(lineNumber));

                    if (!invalidTransformation) {  //if this is within a function and part of the function's params, we need to note that here.
                        for (var u = 0; u < userFunctionReturns.length; u++) {
                            if (node.lineno >= userFunctionReturns[u].startLine && node.lineno <= userFunctionReturns[u].endLine) {
                                var paramIndex = -1;  //ok, it's in the function, is it a param?
                                for (var a = 0; a < userFunctionParameters.length; a++) {
                                    if (userFunctionParameters[a].name === userFunctionReturns[u].name) {
                                        for (var p = 0; p < userFunctionParameters[a].params.length; p++) {
                                            if (userFunctionParameters[a].params[p] === varName) {
                                                paramIndex = p;
                                                break;
                                            }
                                        }
                                        break;
                                    }
                                }
                                if (paramIndex > -1) {
                                    userFunctionReturns[u].paramsChanged.push(paramIndex);
                                    modFunc.push([userFunctionReturns[u].startLine, userFunctionReturns[u].endLine]);
                                }
                                break;
                            }
                        }
                    }
                    if (copiedElts == null) {
                        copiedElts = [];
                    }

                    if (listElts.length > 0) {
                        copiedElts.push({
                            line: node.lineno,
                            elts: listElts
                        });
                    }

                    var eltsToList = [];
                    for (var o = 0; o < copiedElts.length; o++) {
                        eltsToList.push({
                            line: copiedElts[o].line,
                            elts: nodesToStrings(copiedElts[o].elts, node.lineno)
                        });
                    }

                    var userVariable = {
                        name: varName,
                        value: varVal,
                        binOp: binVal,
                        flagVal: flag,
                        funcVar: funcOrVar,
                        containedValue: containedVal,
                        indexAndInput: {
                            input: inputIndexing.input,
                            indexed: inputIndexing.indexed,
                            strIndexed: inputIndexing.strIndexed
                        },
                        nested: containsNested,
                        original: carryOriginality,
                        opsDone: containsOps,
                        assignedModified: [],
                        modifyingFunctions: modFunc,
                        nodeElements: copiedElts,
                        stringElements: eltsToList
                    };

                    if (!invalidTransformation) {
                        var lineNo = node.lineno;
                        var insideForLoop = false;
                        for (var h = 0; h < loopLocations.length; h++) {
                            if (lineNo >= loopLocations[h][0] && lineNo <= loopLocations[h][1]) {
                                lineNo = loopLocations[h][0];
                                insideForLoop = true;
                                break;
                            }
                        }

                        userVariable.assignedModified.push({
                            line: lineNo,
                            value: trimCommentsAndWhitespace(valueString),
                            original: modOriginality,
                            nodeValue: node.value,
                            binop: binVal
                        });

                        //if we're inside a for loop we actually add this twice.
                        if (insideForLoop) {
                            userVariable.assignedModified.push({
                                line: lineNo,
                                value: trimCommentsAndWhitespace(valueString),
                                original: modOriginality,
                                nodeValue: node.value,
                                binop: binVal
                            });
                        }
                    }
                    allVariables.push(userVariable);
                    variableAssignments.push({ line: node.lineno, name: userVariable.name });
                }

                else {
                    var invalidTransformation = false; //This gets set to true if the variable's value is being set to itself, ex. potato = potato.
                    if (node.value._astname === "Name" && 'id' in node.targets[0] && node.targets[0].id.v === node.value.id.v) {
                        invalidTransformation = true;
                    }
                    if (copiedElts == null) {
                        copiedElts = [];
                    }
                    if (listElts.length > 0) {
                        copiedElts.push({
                            line: node.lineno,
                            elts: listElts
                        });
                    }

                    var eltsToList = [];

                    for (var o = 0; o < copiedElts.length; o++) {
                        eltsToList.push({
                            line: copiedElts[0].line,
                            elts: nodesToStrings(copiedElts[o].elts)
                        });
                    }

                    appendArray(copiedElts, allVariables[indexOfExistingVariableObj].nodeElements);
                    appendArray(eltsToList, allVariables[indexOfExistingVariableObj].stringElements);

                    if (inputIndexing.input) {
                        allVariables[indexOfExistingVariableObj].indexAndInput.input = true;
                    }
                    if (inputIndexing.indexed) {
                        allVariables[indexOfExistingVariableObj].indexAndInput.indexed = true;
                    }
                    if (inputIndexing.strIndexed) {
                        allVariables[indexOfExistingVariableObj].indexAndInput.strIndexed = true;
                    }
                    if (varVal !== "") {
                        allVariables[indexOfExistingVariableObj].value = varVal;
                    }
                    if (binVal != null) {
                        allVariables[indexOfExistingVariableObj].binOp = binVal;
                    }
                    var assignmentExists = false;

                    for (var p = 0; p < allVariables[indexOfExistingVariableObj].assignedModified.length; p++) {
                        if (allVariables[indexOfExistingVariableObj].assignedModified[p].value === valueString) {
                            assignmentExists = true;
                            break;
                        }
                    }

                    if (!assignmentExists && !invalidTransformation) {
                        isNewAssignmentValue = true;
                    }

                    if (isNewAssignmentValue) {
                        lineNumber = 0;
                        if (node.lineno != null) {
                            lineNumber = node.lineno;
                            parentLineNumber = lineNumber;
                        }
                        else {
                            lineNumber = parentLineNumber;
                        }


                        var modOriginality = (originalityLines.includes(lineNumber));
                        var lineNo = node.lineno;
                        for (var h = 0; h < loopLocations.length; h++) {
                            if (lineNo >= loopLocations[h][0] && lineNo <= loopLocations[h][1]) {
                                lineNo = loopLocations[h][0];
                                break;
                            }
                        }

                        allVariables[indexOfExistingVariableObj].assignedModified.push({
                            line: lineNo,
                            value: trimCommentsAndWhitespace(valueString),
                            original: modOriginality,
                            nodeValue: node.value,
                            binop: binVal
                        });
                        variableAssignments.push({ line: node.lineno, name: allVariables[indexOfExistingVariableObj].name });

                        for (var uf = 0; uf < userFunctionParameters.length; uf++) { //is this variable a parameter in this function? if so, what's its parameter index?
                            var paramIndex = -1;
                            for (var pa = 0; pa < userFunctionParameters[uf].params.length; pa++) {
                                if (userFunctionParameters[uf].params[pa] === varName) {
                                    paramIndex = pa;
                                    break;
                                }
                            }
                            if (paramIndex > -1) { //ok it's a param in this func. NOW we see if it's within the lines of the function
                                var ufReturnIndex = -1;
                                for (var u = 0; u < userFunctionReturns.length; u++) {
                                    if (userFunctionReturns[u].name === userFunctionParameters[uf].name) {
                                        ufReturnIndex = u;
                                        break;
                                    }
                                }
                                if (ufReturnIndex > -1) {//this should NEVER be false. but, ya know. safety. or because we needed another if statement. your choice.
                                    if (node.lineno > userFunctionReturns[ufReturnIndex].startLine && node.lineno <= userFunctionReturns[ufReturnIndex].endLine) {
                                        userFunctionReturns[ufReturnIndex].paramsChanged.push(paramIndex);
                                    } //then THIS is a change TO THE FUNCTION'S PARAMETER, WITHIN THAT FUNCTION. AKA this function modifies the value of this parameter.
                                }
                            }
                        }
                    }
                    appendOpList(containsOps, allVariables[indexOfExistingVariableObj].opsDone);
                }
            }
        }
    }

    /* Attempts to determine the value of a BinOp object.
        * @param binOp - A binOp OBJECT (not AST node) whose value we want to know
        * @returns - String of datatype output of the binOp node represented by the object, OR a binop object representing the node
        */
    function recursivelyEvaluateBinOp(binOp) {
        //evaluate the left
        if (typeof binOp.left === 'string') {
            //then it's a function call, variable, OR we already know what it is
            if (binOp.left.includes(':')) {
                //then it's just the value of a variable or a function return.
                if (binOp.left.includes(':')) {
                    //check if it's a var or a func
                    if (binOp.left.startsWith("var")) {
                        //it's a variable
                        var varName = binOp.left.split(':')[1];
                        var leftVar = getVariableObject(varName);
                        if (leftVar != null) {
                            // if (allVariables[i].containedValue != null && allVariables[i].containedValue !== "") {
                            if (leftVar.value == "List") {
                                binOp.left = leftVar.containedValue;
                            }
                            else {
                                binOp.left = leftVar.value;
                            }
                        }
                    }

                    else {
                        //it's a function
                        funcName = binOp.left.split(':')[1];
                        var binOpFunc = getFunctionObject(funcName);

                        if (binOpFunc != null) {
                            if (binOpFunc.returns === "List" && binOpFunc.stringElements != null) {
                                binOp.left = binOpFunc.stringElements[0].elts;
                            }
                            else {
                                binOp.left = binOpFunc.returns;
                            }
                        }
                    }
                }
            }
        }
            //if the left side is a subscript node
        else if (typeof binOp.left === 'object' && binOp.left._astname != null && binOp.left._astname === "Subscript") {
            var newSub = retrieveFromList(binOp.left);
            if (newSub != null) {
                var newVal = getTypeFromNode(newSub);
                if (newVal !== "") {
                    binOp.left = newVal;
                }
            }
        }

            //otherwise, the left node is another binOp object - evaluate that
        else if (!Array.isArray(binOp.left)) {
            binOp.left = recursivelyEvaluateBinOp(binOp.left);
        }


        //evaluate the right
        if (typeof binOp.right === 'string') {
            //then it's a function call, variable, or we already know what it is
            if (binOp.right.includes(':')) {
                if (binOp.right.includes(':')) {
                    //check if it's a var or a func
                    if (binOp.right.startsWith("var")) {
                        //it's a variable
                        var varName = binOp.right.split(':')[1];
                        var rightVar = getVariableObject(varName);

                        if (rightVar != null) {
                            binOp.right = rightVar.value;
                        }

                    }

                    else {
                        //it's a function
                        funcName = binOp.right.split(':')[1];
                        var rightFunc = getFunctionObject(funcName);

                        if (rightFunc != null) {
                            binOp.right = rightFunc.returns;
                        }
                    }
                }
            }
        }
            //if the right side is a subscript node
        else if (typeof binOp.right === 'object' && binOp.right._astname != null && binOp.right._astname === "Subscript") {
            var newSub = retrieveFromList(binOp.right);
            if (newSub != null) {
                var newVal = getTypeFromNode(newSub);
                if (newVal !== "") {
                    binOp.right = newVal;
                }
            }
        }
            //otherwise, it's a binop object
        else if (!Array.isArray(binOp.right)) {
            binOp.right = recursivelyEvaluateBinOp(binOp.right);
        }



        //then, evaluate if possible
        if (binOp.left === "Str" || binOp.right === "Str") {
            binOp = "Str";
        }
        else if (binOp.left === "Int" && binOp.right === "Int") {
            binOp = "Int";
        }
        else if ((binOp.left === "Float" && binOp.right === "Float") || (binOp.left === "Float" && binOp.right === "Int") || (binOp.left === "Int" && binOp.right === "Float")) {
            binOp = "Float";
        }

            //get all the contents of lists
        else if (Array.isArray(binOp.left) && Array.isArray(binOp.right)) {
            var allListVals = [];

            for (var k = 0; k < binOp.left.length; k++) {
                allListVals.push(binOp.left[k]);
            }
            for (var k = 0; k < binOp.right.length; k++) {
                allListVals.push(binOp.right[k]);
            }

            binOp = allListVals;
        }

        return binOp; //A BinOp object if values are still unknown, a string if we know what's up.
    }




    /*Calculates what kind of datatype is represented by a given BinOp object.
    * This is the function to be used on BinOp Objects stored in function and variable objects when we don't know, at the time, what type it is.
    * @param functionOrVariable - "func" or "var" - is the object whose BinOp we are checking in the list of functions, or the list of variables
    * @param index - The index of the object whose BinOp we are checking.
    * @returns String if we know what datatype the BinOp object resolves to, otherwise an updated BinOp object
    */
    function evaluateBinOp(functionOrVariable, index) {

        //get function binop
        if (functionOrVariable === "func") {
            var returnObj = recursivelyEvaluateBinOp(userFunctionReturns[index].binOp);

            if (typeof returnObj === 'string') {
                userFunctionReturns[index].returns = returnObj;
                if (returnObj === "Str") {
                    userFunctionReturns[index].opsDone = addOpToList("StrOp", userFunctionReturns[index].opsDone, userFunctionReturns[index].endLine);
                }
            }

            else if (Array.isArray(returnObj)) {
                userFunctionReturns[index].returns = "List";
                userFunctionReturns[index].containedValue = returnObj;
                userFunctionReturns[index].opsDone = addOpToList("ListOp", userFunctionReturns[index].opsDone, userFunctionReturns[index].endLine);
            }
            else {
                //if we don't know the datatype, at least update with anything new we might have.
                userFunctionReturns[index].binOp = returnObj;
            }
        }

            //variable binop
        else {
            var returnObj = recursivelyEvaluateBinOp(allVariables[index].binOp);

            if (typeof returnObj === 'string') {
                allVariables[index].value = returnObj;
                if (returnObj === "Str") {
                    allVariables[index].opsDone = addOpToList("StrOp", allVariables[index].opsDone, allVariables[index].assignedModified[0].line);
                }
            }
            else if (Array.isArray(returnObj)) {
                allVariables[index].value = "List";
                allVariables[index].containedValue = returnObj;
                allVariables[index].opsDone = addOpToList("ListOp", allVariables[index].opsDone, allVariables[index].assignedModified[0].line);
            }
            else {
                //if we don't know the datatype, at least update with anything new we might have.
                allVariables[index].binOp = returnObj;
            }
        }
    }



    /* Handles re-visiting all of the variables, functions, and subscript values where we didn't know the datatype at the time
    * Traverses through lists of function and variable objects, and finds values for those that don't have them
    */
    function evaluateAllEmpties() {
        //function objects
        for (var r = 0; r < userFunctionReturns.length; r++) {
            if (userFunctionReturns[r].returns === "") {
                if (userFunctionReturns[r].funcVar === "var") {
                    //if it returns a variable  we look it up in the variable dictionary

                    var returnedVariable = getVariableObject(userFunctionReturns[r].flagVal);

                    if (returnedVariable != null && returnedVariable.value !== "" && returnedVariable.value !== "BinOp") {
                        userFunctionReturns[r].flagVal = "";
                        userFunctionReturns[r].funcVar = "";
                        userFunctionReturns[r].returns = returnedVariable.value;
                        copyAttributes(returnedVariable, userFunctionReturns[r], ["indexAndInput"]);

                        //get the latest version of the variable's node elements before the function is declared, and assign that to the function object's node elements.
                        if (returnedVariable.nodeElements != null && returnedVariable.nodeElements.length > 0) {
                            var nodeElementsIndex = -1;
                            for (var t = 0; t < returnedVariable.nodeElements.length - 1; t++) {
                                if (returnedVariable.nodeElements[t].line > userFunctionReturns[r].endLine) {
                                    break;
                                }
                                if (returnedVariable.nodeElements[t].line > userFunctionReturns[r].startLine && returnedVariable.nodeElements[t + 1].line > userFunctionReturns[r].endLine) {
                                    nodeElementsIndex = t;
                                }
                            }
                            if (nodeElementsIndex === -1 &&
                                returnedVariable.nodeElements[returnedVariable.nodeElements.length - 1].line >= userFunctionReturns[r].startLine &&
                                returnedVariable.nodeElements[returnedVariable.nodeElements.length - 1].line <= userFunctionReturns[r].endLine) {
                                nodeElementsIndex = returnedVariable.nodeElements.length - 1;
                            }

                            if (nodeElementsIndex === -1) {
                                nodeElementsIndex = 0;
                            }

                            userFunctionReturns[r].nodeElements = [returnedVariable.nodeElements[nodeElementsIndex]];
                            userFunctionReturns[r].stringElements = [returnedVariable.stringElements[nodeElementsIndex]];
                        }

                        //append any opsDone and containedValue items from the variable to the corresponding items in the function objec.t
                        appendArray(returnedVariable.containedValue, userFunctionReturns[r].containedValue);
                        userFunctionReturns[r].opsDone = appendOpList(returnedVariable.opsDone, userFunctionReturns[r].opsDone);
                    }
                }
                    //if it returns a call to another function, copy the information from that function.
                else if (userFunctionReturns[r].funcVar === "func" && userFunctionReturns[r].name != userFunctionReturns[r].flag) {
                    //This prevents us from getting stuck recursing forever
                    var returnedFunc = getFunctionObject(userFunctionReturns[r].flagVal)

                    if (returnedFunc != null && returnedFunc.returns !== "" && returnedFunc.returns !== "BinOp") {
                        userFunctionReturns[r].flagVal = "";
                        userFunctionReturns[r].funcVar = "";

                        //copy relevant information
                        copyAttributes(returnedFunc, userFunctionReturns[r], ["returns", "binOp", "indexAndInput", "nested", "nodeElements", "stringElements"]);

                        if (returnedFunc.containedValue != null) {
                            appendArray(returnedFunc.containedValue, userFunctionReturns[r]);
                        }
                        if (returnedFunc.opsDone != null) {
                            userFunctionReturns[r].opsDone = appendOpList(returnedFunc.opsDone, userFunctionReturns[r].opsDone)
                        }
                    }
                }
            }

            //go through all of the objects in the function's nodeElements and evaluate them, creating fake nodes
            if (userFunctionReturns[r].nodeElements != null && userFunctionReturns[r].nodeElements.length > 0 && userFunctionReturns[r].nodeElements[0] != null) {

                for (var i in userFunctionReturns[r].nodeElements[0].elts) {

                    if (userFunctionReturns[r].nodeElements[0].elts[i]._astname == null &&
                        typeof userFunctionReturns[r].nodeElements[0].elts[i] === "object" &&
                        'left' in userFunctionReturns[r].nodeElements[0].elts[i]) {

                        var eltsValue = { lineno: userFunctionReturns[r].nodeElements[0].elts[i].lineno };
                        eltsValue._astname = recursivelyEvaluateBinOp(userFunctionReturns[r].nodeElements[0].elts[i]);

                        if (eltsValue._astname === "Int") {
                            eltsValue._astname = "Num";
                            eltsValue.n = { v: 1 };
                        }
                        if (eltsValue._astname === "Float") {
                            eltsValue._astname = "Num";
                            eltsValue.n = { v: 1.57 };
                        }
                        if (eltsValue._astname === "List") {
                            eltsValue.elts = [];
                        }
                        if (eltsValue._astname === "Bool") {
                            eltsValue._astname = "Name";
                            eltsValue.id = { v: "True" };
                        }

                        userFunctionReturns[r].nodeElements[0].elts[i] = eltsValue
                    }
                }
                userFunctionReturns[r].stringElements[0] = nodesToStrings(userFunctionReturns[r].nodeElements[0].elts, userFunctionReturns[r].nodeElements[0].line);
            }

            //If we have an un-evaluated subscript, do that now
            if (userFunctionReturns[r].returns === "Subscript") {
                //its an index or a slice
                var indexValue = retrieveFromList(userFunctionReturns[r].flagVal);

                if (getIndexingInNode(userFunctionReturns[r].returns)[0]) {
                    userFunctionReturns[r].indexAndInput.indexed = true;
                }
                if (getStringIndexingInNode(userFunctionReturns[r].returns)[0]) {
                    userFunctionReturns[r].indexAndInput.strIndexed = true;
                }


                if (indexValue != null) {
                    //We know what it is.

                    userFunctionReturns[r].opsDone = addOpToList("ListOp", userFunctionReturns[r].opsDone, indexValue.lineno);
                    allVariables.flagVal = ""; //this may get reset to something down below, which is fine and 100% intentional.
                    indexValue = retrieveFromList(indexValue);


                    if (indexValue._astname === "Name") {
                        //it's a bool OR it's another variable. EVEN IF WE DON'T KNOW WHAT THAT VAR IS, WE CAN UPDATE THIS and set the flagVal to var:varName

                        if (indexValue.id.v === "True" || indexValue.id.v === "False") {
                            //boolean
                            userFunctionReturns[r].returns = "Bool";
                        }

                        //otherwise, it's a variable object
                        var indexVar = getVariableObject(indexValue.id.v);

                        if (indexVar != null && indexVar.value !== "" && indexVar.value !== "BinOp") {
                            copyAttributes(indexVar, userFunctionReturns[r], ["value", "binOp", "nested", "original", "input", "nodeElements", "stringElements", "strIndexed"]);
                            userFunctionReturns[r].opsDone = appendOpList(indexVar.opsDone, userFunctionReturns[r].opsDone);
                            appendArray(indexVar.containedValue, userFunctionReturns[r].containedValue);
                        }
                        else if (indexVar != null && indexVar.value === "") {
                            userFunctionReturns[r].returns = "";
                            userFunctionReturns[r].flagVal = "var:" + indexVar.name;
                        }

                        else if (indexVar == null && getFunctionObject(indexValue.id.v) != null) {

                            for (var n = 0; n < userFunctionParameters.length; n++) {
                                if (userFunctionParameters[n].name === userFunctionReturns[r].name) { //double check and make sure its not already in here
                                    var alreadyMarked = false;

                                    for (var j = 0; j < userFunctionParameters.length; j++) {
                                        if (userFunctionParameters[j].name === indexValue.id.v) {
                                            alreadyMarked = true;
                                            break;
                                        }
                                    }

                                    if (!alreadyMarked) {
                                        newFunctionObject = {};
                                        Object.assign(newFunctionObject, userFunctionParameters[n]);
                                        newFunctionObject.name = indexValue.id.v;

                                        userFunctionParameters.push(newFunctionObject);

                                    }
                                    break;
                                }
                            }


                            for (var p = 0; p < userFunctionReturns.length; p++) {
                                if (userFunctionReturns[r].name === userFunctionReturns[p].name) {
                                    var alreadyMarked = false;
                                    for (var i = 0; i < userFunctionReturns.length; i++) {
                                        if (userFunctionReturns[i].name === indexValue.id.v) {
                                            alreadyMarked = true;
                                            break;
                                        } //if it's already been marked we don't need to do anything else.

                                    }
                                    if (alreadyMarked) {
                                        break;
                                    }

                                    var newReturn = {};
                                    Object.assign(newReturn, userFunctionReturns[p]);
                                    newReturn.name = indexValue.id.v;

                                    newReturn.indexAndInput.indexed = true;

                                    userFunctionReturns.push(newReturn);

                                    //if the function we're reassigning is a reassign of something else
                                    var reassignedFuncName = userFunctionReturns[r].name;
                                    for (var n = 0; n < userFunctionRenames; n++) {
                                        if (userFunctionRenames[n][0] === reassignedFuncName) {
                                            reassignedFuncName = userFunctionRenames[n][1];
                                        }
                                    }
                                    userFunctionRenames.push([indexValue.id.v, reassignedFuncName]);
                                    break;
                                }
                            }
                        }
                    }
                        //it's a function call
                    else if (indexValue._astname === "Call") {
                        var alreadyTallied = false;

                        if ('id' in indexValue.func || indexValue.func._astname === "Subscript" || retrieveFromList(indexValue.func) != indexValue.func) {

                            var funcName = "";

                            //get the function name
                            if ('id' in indexValue.func) {
                                funcName = indexValue.func.id.v;
                            }
                            else {
                                var functionNameNode = null;
                                functionNameNode = retrieveFromList(indexValue.func);
                                if (functionNameNode != null && functionNameNode._astname === "Name") {
                                    funcName = functionNameNode.id.v;
                                }
                            }

                            //get the function object and copy values from it
                            var userFunctionCalled = getFunctionObject(funcName);
                            if (userFunctionCalled != null && userFunctionCalled.returns !== "") {

                                userFunctionReturns[r].returns = userFunctionCalled.returns;
                                copyAttributes(userFunctionCalled, userFunctionReturns[r], ["binOp", "nested", "original", "indexAndInput", "nodeElements", "stringElements"]);

                                appendArray(userFunctionCalled.containedValue, userFunctionReturns[r].containedValue);
                                if (userFunctionCalled.opsDone != null) {
                                    userFunctionReturns[r].opsDone = appendOpList(userFunctionCalled.opsDone, userFunctionReturns[r].opsDone);
                                }

                            }

                            alreadyTallied = true;
                        }

                        if (!alreadyTallied) { //if it's na list or string op instead, do the following
                            if (doesCallCreateList(indexValue)) {
                                userFunctionReturns[r].returns = "List";
                                var eltsItem = performListOp(indexValue);


                                userFunctionReturns[r].nodeElements.push({ line: indexValue.lineno, elts: eltsItem[0] });
                                userFunctionReturns[r].stringElements.push({ line: indexValue.lineno, elts: eltsItem[1] });

                                alreadyTallied = true;
                            }

                            if (doesCallCreateString(indexValue)) {
                                userFunctionReturns[r].returns = "Str";
                                alreadyTallied = true;
                            }

                        }
                        if (!alreadyTallied) { //if it's STILL not tallied, do the following
                            userFunctionReturns[r].returns = getCallReturn(indexValue); //attempt to get the call return for list creation and handle that

                            if (Array.isArray(userFunctionReturns[r].returns)) {

                                allVariables.nodeElements.push({
                                    line: indexValue.lineno,
                                    elts: userFunctionReturns[r].returns
                                });

                                allVariables.stringElements.push({
                                    line: indexValue.lineno,
                                    elts: nodesToStrings(userFunctionReturns[r].returns)
                                });

                                userFunctionReturns[r].returns = "List";
                            }
                        }
                    }
                        //ints, floats
                    else if (indexValue._astname === "Num") {
                        if (!isNodeFloat(indexValue)) {
                            userFunctionReturns[r].returns = "Int";
                        }
                        else {
                            userFunctionReturns[r].returns = "Float";
                        }
                    }
                        //comparisons and boolops both become booleans and stored in containedValue
                    else if (indexValue._astname === "Compare" || indexValue._astname === "BoolOp") {
                        userFunctionReturns[r].returns = "Bool";

                        if (indexValue._astname === "Compare") {
                            listTypesWithin(indexValue, userFunctionReturns[r].containedValue, userFunctionReturns[r].indexAndInput, userFunctionReturns[r].opsDone);
                        }
                        if (indexValue._astname === "BoolOp") {
                            listTypesWithin(indexValue, userFunctionReturns[r].containedValue, userFunctionReturns[r].indexAndInput, userFunctionReturns[r].opsDone);
                        }

                    }
                        //if binop, evaluate and push contained values
                    else if (indexValue._astname === "BinOp") {

                        userFunctionReturns[r].opsDone = addOpToList("BinOp", userFunctionReturns[r].opsDone, indexValue.lineno);
                        var binVal = recursivelyAnalyzeBinOp(indexValue);

                        if (typeof binVal === "string") {
                            userFunctionReturns[r].returns = binVal;
                            listTypesWithin(indexValue, userFunctionReturns[r].containedValue, userFunctionReturns[r].indexAndInput, userFunctionReturns[r].opsDone);
                        }
                        else if (Array.isArray(binVal)) {

                            userFunctionReturns[r].returns = "List";

                            allVariables.nodeElements.push({
                                line: indexValue.lineno,
                                elts: binVal
                            });
                            allVariables.stringElements.push({
                                line: indexValue.lineno,
                                elts: nodesToStrings(binVal)
                            });

                        }
                        else {//we re-frame as a binop object!
                            userFunctionReturns[r].returns = "BinOp";
                            userFunctionReturns[r].binOp = binVal;
                        }
                    }

                        //list
                    else if (indexValue._astname === "List") {
                        userFunctionReturns[r].returns = "List";
                        appendArray(listTypesWithin(indexValue, userFunctionReturns[r].containedValue, userFunctionReturns[r].indexAndInput, userFunctionReturns[r].opsDone), userFunctionReturns[r].containedValue);

                        userFunctionReturns[r].nodeElements.push({
                            line: indexValue.lineno,
                            elts: indexValue.elts
                        });
                        userFunctionReturns[r].nodeElements.push({
                            line: indexValue.lineno,
                            elts: nodesToStrings(indexValue.elts)
                        });
                    }
                    else if (indexValue._astname === "Str") {
                        userFunctionReturns[r].returns = "Str";
                    }
                }
            }
        }

        //Now, go through the list of all variables and do the same thing
        for (var r = 0; r < allVariables.length; r++) {

            if (allVariables[r].value === "") {
                if (allVariables[r].funcVar === "var") {
                    //if it's the value of another variable, we look it up in the var directory and copy the values


                    var copiedVar = getVariableObject(allVariables[r].flagVal);
                    if (copiedVar != null && copiedVar.value !== "" && copiedVar.value !== "BinOp") {
                        allVariables[r].flagVal = "";
                        allVariables[r].funcVar = "";
                        copyAttributes(copiedVar, allVariables[r], ["value", "binOp", "original", "indexAndInput", "nodeElements", "stringElements", "nested", ]);


                        appendArray(copiedVar.containedValue, allVariables[r].containedValue);
                        allVariables[r].opsDone = appendOpList(copiedVar.opsDone, allVariables[r].opsDone);
                    }
                }

                else if (allVariables[r].funcVar === "func" && allVariables[r].name != allVariables[r].flagVal) {
                    //otherwise, it contains the value returned by a function, so go look that up and copy its values 
                    //prevents us from getting stuck recursing forever
                    var funcValue = getFunctionObject(allVariables[r].flagVal);
                    if (funcValue != null && funcValue.returns !== "") {
                        allVariables[r].flagVal = "";
                        allVariables[r].funcVar = "";
                        allVariables[r].value = funcValue.returns;

                        copyAttributes(funcValue, allVariables[r], ["input", "binOp", "nested", "nodeElements", "stringElements"]);
                        if (funcValue.containedValue != null) {
                            appendArray(funcValue.containedValue, allVariables[r].containedValue);
                        }
                        if (funcValue.opsDone != null) {
                            allVariables[r].opsDone = appendOpList(funcValue.opsDone, allVariables[r].opsDone);
                        }
                    }
                }
            }
            //now go through and check all of the things in nodeElements, because we need to evaluate them if we can
            if (allVariables[r].nodeElements != null) {
                for (var p in allVariables[r].nodeElements) {
                    for (var i in allVariables[r].nodeElements[p].elts) {

                        if (allVariables[r].nodeElements[p].elts[i]._astname == null && typeof allVariables[r].nodeElements[p].elts[i] === "object" && 'left' in allVariables[r].nodeElements[p].elts[i]) {

                            var eltsValue = {
                                lineno: allVariables[r].nodeElements[p].elts[i].lineno
                            };
                            eltsValue._astname = recursivelyEvaluateBinOp(allVariables[r].nodeElements[p].elts[i]);


                            if (eltsValue._astname === "Int") {
                                eltsValue._astname = "Num";
                                eltsValue.n = { v: 1 };
                            }
                            if (eltsValue._astname === "Float") {
                                eltsValue._astname = "Num";
                                eltsValue.n = { v: 1.57 };
                            }
                            if (eltsValue._astname === "List") {
                                eltsValue.elts = [];
                            }
                            if (eltsValue._astname === "Bool") {
                                eltsValue._astname = "Name";
                                eltsValue.id = { v: "True" };
                            }

                            allVariables[r].nodeElements[p].elts[i] = eltsValue;
                        }
                    }

                    allVariables[r].stringElements[p] = nodesToStrings(allVariables[r].nodeElements[p].elts, allVariables[r].nodeElements[p].line);
                }
            }

            if (allVariables[r].value === "List") {
                for (var j = 0; j < allVariables[r].containedValue.length; j++) {
                    if (allVariables[r].containedValue[j] != null && typeof allVariables[r].containedValue[j] === 'string' && allVariables[r].containedValue[j].includes('var:')) {

                        var varName = allVariables[r].containedValue[j].split(':')[1];
                        var otherVariable = getVariableObject(varName);


                        if (otherVariable != null && otherVariable.value !== "" && otherVariable.value !== "BinOp") {
                            if (otherVariable.value === "List") {
                                allVariables[r].containedValue[j] = otherVariable.containedValue.slice(0);
                            }
                            if (otherVariable.nested) {
                                allVariables[r].nested = true;
                            }
                        }
                    }

                    else if (allVariables[r].containedValue[j] != null && typeof allVariables[r].containedValue[j] === 'string' && allVariables[r].containedValue[j].includes('func:')) {
                        var funcName = allVariables[r].containedValue[j].split(':')[1];
                        var otherFunc = getFunctionObject(funcName);

                        if (otherFunc != null && otherFunc.returns !== "" && otherFunc.returns !== "BinOp") {
                            allVariables[r].containedValue[j] = otherFunc.returns;
                        }
                    }
                }
            }

            if (allVariables[r].value === "Subscript") {
                var indexValue = retrieveFromList(allVariables[r].flagVal);
                if (indexValue != null) {//then we know what it is.

                    allVariables[r].indexAndInput.indexed = true;
                    allVariables[r].opsDone = addOpToList("ListOp", allVariables[r].opsDone, indexValue.lineno);
                    allVariables.flagVal = ""; //this may get reset to something down below, which is fine and 100% intentional.


                    indexValue = retrieveFromList(indexValue);
                    if (indexValue != null && indexValue._astname === "Name") {
                        //it's a bool OR it's another variable. EVEN IF WE DON'T KNOW WHAT THAT VAR IS, WE CAN UPDATE THIS and set the flagVal to var:varName
                        if (indexValue.id.v === "True" || indexValue.id.v === "False") {
                            allVariables[r].value = "Bool";
                        }
                        var indexVar = getVariableObject(indexValue.id.v);
                        if (indexVar != null && indexVar.value !== "" && indexVar.value !== "BinOp") {

                            copyAttributes(indexVar, allVariables[r], ["value", "nested", "original", "input", "nodeElements", "stringElements", "strIndexed"]);

                            allVariables[r].opsDone = appendOpList(indexVar.opsDone, allVariables[r].opsDone);
                            appendArray(indexVar.containedValue, allVariables[r].containedValue);
                        }
                        else if (indexVar != null && indexVar.value === "") {
                            allVariables[r].value = "";
                            allVariables[r].flagVal = "var:" + indexVar.name;
                        }
                    }
                    else if (indexValue != null && indexValue._astname === "Call") {

                        var alreadyTallied = false;

                        if ('id' in indexValue.func || indexValue.func._astname === "Subscript" || retrieveFromList(indexValue.func) != indexValue.func) {
                            var funcName = "";
                            if ('id' in indexValue.func) {
                                funcName = indexValue.func.id.v;
                            }
                            else {
                                var functionNameNode = null;
                                functionNameNode = retrieveFromList(indexValue.func);
                                if (functionNameNode != null) {
                                    funcName = functionNameNode.id.v;
                                }
                            }

                            var userFunctionCalled = getFunctionObject(funcName);
                            if (userFunctionCalled != null && userFunctionCalled.returns !== "") {

                                allVariables[r].value = userFunctionCalled.returns;
                                copyAttributes(userFunctionCalled, allVariables[r], ["nested", "binOp", "original", "indexAndInput", "nodeElements", "stringElements"]);
                                appendArray(userFunctionCalled.containedValue, allVariables[r].containedValue);

                                if (userFunctionCalled.opsDone != null) {
                                    allVariables[r].opsDone = appendOpList(userFunctionCalled.opsDone, allVariables[r].opsDone);
                                }
                            }

                            alreadyTallied = true;
                        }
                        if (!alreadyTallied) {
                            if (doesCallCreateList(indexValue)) {
                                allVariables[r].value = "List";

                                var eltsItem = performListOp(indexValue);

                                allVariables[r].nodeElements.push({
                                    line: indexValue.lineno,
                                    elts: eltsItem[0]
                                });

                                allVariables[r].stringElements.push({
                                    line: indexValue.lineno,
                                    elts: eltsItem[1]
                                });

                                alreadyTallied = true;
                            }

                            if (doesCallCreateString(indexValue)) {
                                allVariables[r].value = "Str";
                                alreadyTallied = true;
                            }
                        }
                        if (!alreadyTallied) {
                            allVariables[r].value = getCallReturn(indexValue);

                            if (Array.isArray(allVariables[r].value)) {

                                allVariables.nodeElements.push({
                                    line: indexValue.lineno,
                                    elts: allVariables[r].value
                                });
                                allVariables.stringElements.push({
                                    line: indexValue.lineno,
                                    elts: nodesToStrings(allVariables[r].value)
                                });

                                allVariables[r].value = "List";
                            }
                        }
                    }
                    else if (indexValue._astname === "Num") {
                        if (!isNodeFloat(indexValue)) {
                            allVariables[r].value = "Int";
                        }
                        else {
                            allVariables[r].value = "Float";
                        }
                    }
                    else if (indexValue._astname === "Compare" || indexValue._astname === "BoolOp") {
                        allVariables[r].value = "Bool";

                        if (indexValue._astname === "Compare") {
                            listTypesWithin(indexValue, allVariables[r].containedValue, allVariables[r].indexAndInput, allVariables[r].opsDone);
                        }
                        if (indexValue._astname === "BoolOp") {
                            listTypesWithin(indexValue, allVariables[r].containedValue, allVariables[r].indexAndInput, allVariables[r].opsDone);
                        }

                    }
                    else if (indexValue._astname === "BinOp") {
                        allVariables[r].opsDone = addOpToList("BinOp", allVariables[r].opsDone, indexValue.lineno);
                        var binVal = recursivelyAnalyzeBinOp(indexValue);
                        if (typeof binVal === "string") {
                            allVariables[r].value = binVal;
                            listTypesWithin(indexValue, allVariables[r].containedValue, allVariables[r].indexAndInput, allVariables[r].opsDone);
                        }

                        else if (Array.isArray(binVal)) {
                            allVariables[r].value = "List";

                            allVariables.nodeElements.push({
                                line: indexValue.lineno,
                                elts: binVal
                            });
                            allVariables.stringElements.push({
                                line: indexValue.lineno,
                                elts: nodesToStrings(binVal)
                            });

                        }

                        else {
                            //we re-frame as a binop object
                            allVariables[r].value = "BinOp";
                            allVariables[r].binOp = binVal;
                        }
                    }
                    else if (indexValue._astname === "List") {
                        allVariables[r].value = "List";
                        appendArray(allVariables[r].containedValue, listTypesWithin(indexValue, allVariables[r].containedValue, allVariables[r].indexAndInput, allVariables[r].opsDone));

                        allVariables[r].nodeElements.push({
                            line: indexValue.lineno,
                            elts: indexValue.elts
                        });
                        allVariables[r].nodeElements.push({
                            line: indexValue.lineno,
                            elts: nodesToStrings(indexValue.elts)
                        });
                    }
                    else if (indexValue._astname === "Str") {
                        allVariables[r].value = "Str";
                    }
                }
            }
        }
        //binops
        for (var i = 0; i < userFunctionReturns.length; i++) {
            if (userFunctionReturns[i].returns === "BinOp") {
                evaluateBinOp("func", i);
            }
        }
        for (var i = 0; i < allVariables.length; i++) {

            if (allVariables[i].value === "BinOp") {
                evaluateBinOp("var", i);
            }
            for (var o in allVariables[i].assignedModified) {
                if (allVariables[i].assignedModified[o].binop != null && typeof allVariables[i].assignedModified[o].binop !== "string" && !Array.isArray(allVariables[i].assignedModified[o].binop)) {

                    var binAM = recursivelyEvaluateBinOp(allVariables[i].assignedModified[o].binop);
                    allVariables[i].assignedModified[o].binop = binAM;

                    if (binAM === "Str") {
                        allVariables[i].opsDone = addOpToList("StrOp", allVariables[i].opsDone, allVariables[i].assignedModified[o].line);
                    }
                    if (Array.isArray(binAM)) {
                        allVariables[i].opsDone = addOpToList("ListOp", allVariables[i].opsDone, allVariables[i].assignedModified[o].line);
                    }
                }
            }
        }
    }

    /* If a BinOp node contains a number of lists, consolidates these into a single array for use in analysis
    * @param node - the BinOp node
    * @returns - An array of AST nodes representing the output of the BinOp
    */
    function getAllBinOpLists(node) {
        function recursivelyGetListValues(node, combinedList) {
            var leftNode = node.left;
            var rightNode = node.right;

            leftNode = retrieveFromList(leftNode);

            if (leftNode != null) {
                if (leftNode._astname === "BinOp") {
                    recursivelyGetListValues(node.left, combinedList);
                }
                if (leftNode._astname === "Name") {

                    var variable = getVariableObject(leftNode.id.v);
                    if (variable != null) {
                        var eltsToCopy = mostRecentElements(variable, node.lineno);
                        if (eltsToCopy != null) {
                            for (var i = 0; i < eltsToCopy.length; i++) {
                                combinedList.push(eltsToCopy[i]);
                            }
                        }
                    }
                }

                else if (leftNode._astname === "Call") {
                    var udf = getVariableObject(leftNode.id.v);
                    if (udf != null && udf.nodeElements != null) {
                        for (var i = 0; i < udf.nodeElements.length; i++) {
                            combinedList.push(udf.nodeElements[i]);
                        }
                    }
                }
                else if (leftNode._astname === "List") {
                    for (var i = 0; i < leftNode.elts.length; i++) {
                        combinedList.push(leftNode.elts[i]);
                    }
                }
            }

            rightNode = retrieveFromList(rightNode);

            if (rightNode != null) {
                if (rightNode._astname === "BinOp") {
                    recursivelyGetListValues(node.right, combinedList);
                }
                if (rightNode._astname === "Name") {

                    var variable = getVariableObject(rightNode.id.v);
                    if (variable != null) {
                        var eltsToCopy = mostRecentElements(variable, node.lineno);
                        if (eltsToCopy != null) {
                            for (var i = 0; i < eltsToCopy.length; i++) {
                                combinedList.push(eltsToCopy[i]);
                            }
                        }
                    }
                }
                else if (rightNode._astname === "Call") {
                    var udf = getVariableObject(rightNode.id.v);
                    if (udf != null) {
                        if (udf.nodeElements != null) {
                            for (var i = 0; i < udf.nodeElements.length; i++) {
                                combinedList.push(udf.nodeElements[i]);
                            }
                        }
                    }
                }
                else if (rightNode._astname === "List") {
                    for (var i = 0; i < rightNode.elts.length; i++) {
                        combinedList.push(rightNode.elts[i]);
                    }
                }
            }
        }

        if (!Array.isArray(recursivelyAnalyzeBinOp(node))) {
            return [];
        }
        var combined = [];
        recursivelyGetListValues(node, combined);

        return combined;
    }



    /*Finds out if a node in a user-defined function returns a value, and returns that 
    * @param node - the AST node
    * @returns function object populated with necessary values.
    */
    function findReturnInBody(node, functionObject) {
        if (node != null && node._astname != null) {

            //variable init
            var variablesIncluded = false;
            var varList = [];
            var isIndexed = false;
            var tempObj = {};
            var flag = "";
            var variableName = "";


            copyAttributes(functionObject, tempObj, ["stringElements", "indexAndInput", "name", "returns", "funcVar", "flagVal", "binOp", "containedValue", "opsDone", "nested", "original", "paramsChanged", "nodeElements", "paramFuncsCalled"]);
            functionObject = tempObj;

            var userFuncsIndex = -1;
            if (functionObject.name != null) {
                //should never be null but putting this in here for error protection
                for (var i in userFunctionParameters) {
                    if (userFunctionParameters[i].name === functionObject.name) {
                        userFuncsIndex = i;
                        break;
                    }
                }
            }

            //initialize any array that may be empty
            var emptyArrays = ['opsDone', 'stringElements', 'nodeElements', 'paramsChanged', 'containedValue'];
            for (var i in emptyArrays) {
                if (functionObject[emptyArrays[i]] == null) {
                    functionObject[emptyArrays[i]] = [];
                }
            }
            if (functionObject.indexAndInput == null) {
                functionObject.indexAndInput = {
                    indexed: false,
                    strIndexed: false,
                    input: false
                };
            }


            //add any ops to opsDone
            if (node._astname === "BinOp") {
                functionObject.opsDone = addOpToList("BinOp", functionObject.opsDone, node.lineno);
            }
            if (node._astname === "AugAssign") {
                functionObject.opsDone = addOpToList("AugAssign", functionObject.opsDone, node.lineno);
            }
            if (node._astname === "BoolOp" || node._astname === "UnaryOp") {
                functionObject.opsDone = addOpToList("BoolOp", functionObject.opsDone, node.lineno);
            }
            if (node._astname === "Compare") {
                functionObject.opsDone = addOpToList("Compare", functionObject.opsDone, node.lineno);
            }

            //is there a call to another function or to a list or string op? Handle that here.
            if (node._astname === "Call") {
                var funcName = "";
                var funcNode = retrieveFromList(node.func);
                if (funcNode != null) {
                    if ('id' in funcNode) {
                        funcName = funcNode.id.v;
                    }
                    else {
                        funcName = funcNode.attr.v;
                    }
                    if (funcName === 'readInput') {
                        functionObject.indexAndInput.input = true;
                    }

                    if (userFuncsIndex != -1 && userFunctionParameters[userFuncsIndex].params.includes(funcName)) {
                        //later on, this will be used to simulate a call to this function that was passed as a parameter
                        userFunctionParameters[userFuncsIndex].paramFuncsCalled.push({
                            index: userFunctionParameters[userFuncsIndex].params.indexOf(funcName),
                            node: Object.assign({}, node)
                        });
                    }

                    var isListFunc = false, isStrFunc = false;
                    if (JS_STR_LIST_OVERLAP.includes(funcName) && isJavascript) {
                        var opValType = getTypeFromNode(funcNode.value);
                        if (opValType === "List") {
                            isListFunc = true;
                        }
                        else if (opValType === "Str") {
                            isStrFunc = true;
                        }
                        else if (opValType === "") {
                            isListFunc, isStrFunc = true;
                        }
                    }

                    if (listFuncs.includes(funcName) && !isStrFunc) {
                        functionObject.opsDone = addOpToList("ListOp", functionObject.opsDone, node.lineno);
                    }
                    if (strFuncs.includes(funcName) && !isListFunc) {
                        functionObject.opsDone = addOpToList("StrOp", functionObject.opsDone, node.lineno);
                    }
                }
            }

            //if this is the return value, populate functionObject with it

            if (node._astname === "Return" && node.value != null) {
                var contVal = null;
                var valueType = node.value._astname
                var opsPerformed = [];
                var inputTaken = false;
                var retVal = node.value;


                //get values stored inside UnaryOp and Subscript nodes, applying appropriate indexing values in the process
                if (retVal._astname === "UnaryOp") {
                    functionObject.returns = "Bool";
                    retVal = retVal.operand;
                    opsPerformed = addOpToList("BoolOp", opsPerformed, node.lineno);
                }
                if (node.value._astname === "Subscript") {
                    retVal = retrieveFromList(node.value);
                    if (retVal == null) {
                        valueType = "Subscript";
                        flag = node.value;
                    }

                    if (getIndexingInNode(node.value)[0]) {
                        functionObject.indexAndInput.isIndexed = true;
                    }
                    if (getStringIndexingInNode(node.value)[0]) {
                        functionObject.indexAndInput.strIndexed = true;
                    }

                }


                retVal = retrieveFromList(node.value);
                if (typeof retVal === "string") {
                    valueType = "";
                    flag = retVal;
                }

                    //store the type of returned value
                else if (retVal != null) {
                    if (retVal._astname === "BinOp" || retVal._astname === "BoolOp" || retVal._astname === "Compare" || retVal._astname === "List") {
                        //get list/array/string indexing
                        isIndexed = getIndexingInNode(retVal)[0];
                        functionObject.indexAndInput.strIndexed = getStringIndexingInNode(retVal)[0];
                    }
                    if (retVal._astname === "Num") {
                        if (!isNodeFloat(retVal)) {
                            valueType = "Int";
                        }
                        else {
                            valueType = "Float";
                        }
                    }
                    else if (retVal._astname === "Call") {
                        //if it returns another function's return, we look up what THAT function returns. if we know.
                        var funcOrVar = "func";
                        var funcName = "";

                        if ('id' in retVal.func) {
                            funcName = retVal.func.id.v;
                        }
                        else {
                            funcName = retVal.func.attr.v;
                        }
                        if (funcName === 'readInput') {
                            functionObject.indexAndInput.input = true;
                        }

                        //special case - returns the returned value of a listOp
                        if (listFuncs.includes(funcName)) {
                            valueType = "List";
                            opsPerformed = addOpToList("ListOp", opsPerformed, node.lineno);

                            if (retVal.func.value._astname === "List") {
                                var valuesInList = listTypesWithin(retVal.func.value.elts, [], functionObject.indexAndInput, opsPerformed);

                                for (var vil = 0; vil < valuesInList; vil++) {
                                    contVal.push(valuesInList[vil]);
                                }
                            }

                            if (retVal.func.value._astname === "BinOp") {
                                var valsInOp = [];
                                listTypesWithin(retVal.func.value, valsInOp, functionObject.indexAndInput, opsPerformed);
                                for (var vio = 0; vio < valsInOp.length; vio++) {
                                    contVal.push(valsInOp[vio]);
                                }
                            }

                            if (retVal.func.value._astname === "Call") {
                                var retFunc = getFunctionObject(retVal.func.value.func.id.v);
                                if (retFunc != null) {
                                    if (retFunc.containedValue != null) {
                                        appendArray(retFunc.containedValue, contVal);
                                    }
                                    if (retFunc.opsDone != null) {
                                        opsPerformed = appendOpList(retFunc.opsDone, opsPerformed);
                                    }
                                }
                            }

                            if (retVal.func.value._astname === "Name") {  //we have to find the other variable
                                var retVar = getVariableObject(retVal.func.value.id.v);
                                if (retVar != null) {
                                    appendArray(retVar.containedValue, contVal);
                                    opsPerformed = appendOpList(retVar.opsDone, opsPerformed);
                                }
                            }
                        }

                        //or a strOp
                        if (strFuncs.includes(funcName)) {
                            varVal = "String";
                            opsPerformed = addOpToList("StrOp", opsPerformed, node.lineno);
                            if (retVal.func.value._astname === "Name") {
                                variablesIncluded = true;
                                var retFunc = getFunctionObject(retVal.func.value.id.v);
                                if (retFunc != null) {
                                    copyAttributes(retFunc,
                                        functionObject,
                                        ["containedValue",
                                            "opsDone",
                                            "nested",
                                            "indexAndInput",
                                            "nodeElements",
                                            "stringElements",
                                            "original",
                                            "funcVar",
                                            "binOp",
                                            "flagVal"]);
                                }
                            }

                            if (retVal.func.value._astname === "BinOp") {
                                var valsInOp = [];
                                listTypesWithin(retVal.func.value, valsInOp, functionObject.indexAndInput, functionObject.opsDone);

                                for (var vio = 0; vio < valsInOp.length; vio++) {
                                    contVal.push(valsInOp[vio]);
                                }
                            }
                            if (retVal.func.value._astname === "Call") {
                                var returnedFunc = getFunctionObject(retVal.func.value.id.v);
                                if (returnedFunc != null) {
                                    if (userFunctionReturns[functionNum].containedValue != null && userFunctionReturns[functionNum].containedValue.length > 0) {
                                        for (var cv = 0; cv < userFunctionReturns[functionNum].containedValue.length; cv++) {
                                            contVal.push(userFunctionReturns[functionNum].containedValue[cv]);
                                        }
                                    }
                                    if (userFunctionReturns[functionNum].nested) {
                                        variablesIncluded = true;
                                    }
                                }
                            }
                        }

                        flag = funcName;
                        foundMatch = false;
                        var matchedFunc = getFunctionObject(funcName);

                        //or it returns the return of another function
                        if (matchedFunc != null) {
                            valueType = matchedFunc.returns;
                            if (matchedFunc.containedValue != null) {

                                if (matchedFunc.containedValue != null) {
                                    contVal = matchedFunc.containedValue;
                                }
                                if (matchedFunc.opsDone != null) {
                                    opsPerformed = appendOpList(matchedFunc.opsDone, opsPerformed);
                                }

                                if (matchedFunc.nested) {
                                    variablesIncluded = true;
                                }
                                if (matchedFunc.nodeElements != null && matchedFunc.nodeElements.length > 0) {
                                    functionObject.nodeElements = [matchedFunc.nodeElements[0]];
                                    functionObject.stringElements = [matchedFunc.stringElements[0]]
                                }

                                var isIndexed = false;
                                foundMatch = true;
                            }
                            if (!foundMatch) {
                                // this denotes that we do not yet know what  this returns
                                valueType = "";
                            }
                        }
                    }
                        //returns a variable value
                    else if (retVal._astname === "Name") {
                        var isFunctionName = false;

                        for (var i in userFunctionParameters) {
                            if (userFunctionParameters[i].name === retVal.id.v) {
                                isFunctionName = true;
                            }
                        }

                        if (isFunctionName) {
                            //the variable contains a function value
                            valueType = "Function";
                            flag = retVal.id.v;

                        }
                            //otherwise it's a variable the user has declared previously
                        else {
                            if (retVal.id.v === "True" || retVal.id.v === "False") {
                                valueType = "Bool";
                            }
                            else {
                                funcOrVar = "var";
                                variableName = retVal.id.v;
                                flag = variableName;
                                valueType = "";
                                variablesIncluded = true;
                                var varToCopy = getVariableObject(variableName);

                                //copy values from the variable object
                                if (varToCopy != null && varToCopy.value !== "BinOp" && varToCopy.value !== "") {

                                    valueType = varToCopy.value;
                                    contVal = varToCopy.containedValue;
                                    opsPerformed = appendOpList(varToCopy.opsDone, opsPerformed);


                                    if (varToCopy.nodeElements != null) {
                                        var nodeElementsIndex = -1;
                                        for (var t = 0; t < allVariables[v].nodeElements.length - 1; t++) {
                                            if (allVariables[v].nodeElements[t].line > functionObject.startLine && allVariables[v].nodeElements[t + 1].line > functionObject.endLine) {
                                                nodeElementsIndex = t;
                                                break;
                                            }
                                        }
                                        if (nodeElementsIndex = -1 && allVariables[v].nodeElements[allVariables[v].nodeElements.length - 1].line >= functionObject.startLine &&
                                            allVariables[v].nodeElements[allVariables[v].nodeElements.length - 1].line <= functionObject.endLine) {

                                            nodeElementsIndex = allVariables[v].nodeElements.length - 1;

                                        }
                                        if (nodeElementsIndex = -1) {
                                            nodeElementsIndex = 0;
                                        }


                                        functionObject.nodeElements = [varToCopy.nodeElements[nodeElementsIndex]];
                                        functionObject.stringElements = [varToCopy.stringElements[nodeElementsIndex]];
                                    }

                                    if (varToCopy.indexAndInput.indexed) {
                                        isIndexed = true;
                                    }
                                    if (varToCopy.indexAndInput.strIndexed) {
                                        functionObject.indexAndInput.strIndexed = true;
                                    }
                                }
                            }
                        }
                    }
                        //if it returns a binOp, we have to evaluate what kind of datatype it is.
                    else if (retVal._astname === "BinOp") {


                        opsPerformed = addOpToList("BinOp", opsPerformed, node.lineno);

                        if (Array.isArray(recursivelyAnalyzeBinOp(retVal))) {
                            var binOpElts = getAllBinOpLists(retVal);
                            functionObject.nodeElements = [{
                                line: retVal.lineno,
                                elts: binOpElts
                            }];
                            functionObject.stringElements = [{
                                line: retVal.lineno,
                                elts: nodesToStrings(binOpElts, retVal.lineno)
                            }];
                        }

                        getNestedVariables(retVal, varList);
                        var binVal = recursivelyAnalyzeBinOp(retVal);

                        if (binVal != null) {
                            valueType = "BinOp";
                            contVal = [];
                            listTypesWithin(retVal, contVal, functionObject.indexAndInput, opsPerformed);
                        }
                        else {
                            valueType = "";
                        }
                    }

                        //boolop becomes bool
                    else if (retVal._astname === "BoolOp") {
                        valueType = "Bool";
                        getNestedVariables(retVal, varList);
                        contVal = [];
                        opsPerformed = addOpToList("BoolOp", opsPerformed, node.lineno);
                        listTypesWithin(retVal, contVal, functionObject.indexAndInput, opsPerformed);
                    }
                        //store "List" and also all values within that list in nodeElements, stringElements, and containedValue
                    else if (retVal._astname === "List") {
                        valueType = "List";
                        getNestedVariables(retVal, varList);
                        contVal = listTypesWithin(retVal.elts, contVal, functionObject.indexAndInput, opsPerformed);

                        functionObject.nodeElements = [{
                            line: node.lineno,
                            elts: retVal.elts
                        }];
                        functionObject.stringElements = [{
                            line: node.lineno,
                            elts: nodesToStrings(retVal.elts, node.lineno)
                        }];
                    }
                        //comparison also becomes a bool
                    else if (retVal._astname === "Compare") {
                        getNestedVariables(retVal, varList);
                        valueType = "Bool";
                        contVal = [];
                        opsPerformed = addOpToList("Compare", opsPerformed, node.lineno);
                        listTypesWithin(retVal, contVal, functionObject.indexAndInput, opsPerformed);
                    }
                }
                //if we know what it is, we don't have to bother flagging it
                if (valueType !== "" && valueType !== "Subscript" && valueType !== "BinOp") {
                    flag = "";
                    funcOrVar = "";
                }
                if (functionObject != null && functionObject.opsDone != null) {
                    opsPerformed = appendOpList(functionObject.opsDone, opsPerformed);
                }
                if (varList.length > 0) {
                    variablesIncluded = true;
                }

                //fill in properties
                functionObject.returns = valueType;
                functionObject.funcVar = funcOrVar;
                functionObject.flagVal = flag;
                functionObject.binOp = binVal;
                if (contVal != null) {
                    for (var g = 0; g < contVal.length; g++) {
                        functionObject.containedValue.push(contVal[g]);
                    }
                }

                if (isIndexed) {
                    functionObject.indexAndInput.indexed = true;
                }
                if (inputTaken) {
                    functionObject.indexAndInput.input = true;
                }

                functionObject.opsDone = opsPerformed;
                functionObject.nested = variablesIncluded;
            }

            //some things don't get recursively checked automatically (if tests, JSFor init, etc.), so we manually make these calls here
            if (node._astname === "JSFor") {
                if (node.init != null) {
                    functionObject = findReturnInBody(node.init, functionObject);
                }
                functionObject = findReturnInBody(node.test, functionObject);
                if (node.update != null) {
                    functionObject = findReturnInBody(node.update, functionObject);
                }
            }

            if (node._astname === "If") {
                functionObject = findReturnInBody(node.test, functionObject);
                if (node.orelse != null) {
                    for (var i in node.orelse) {
                        functionObject = findReturnInBody(node.orelse[i], functionObject);
                    }
                }
            }

            //regular recursive calls
            if (node != null && node.body != null) {
                angular.forEach(node.body, function (nodechild) {
                    functionObject = findReturnInBody(nodechild, functionObject);
                });
            }
            else if (node != null && (node._astname != null || node[0] != null)) {
                angular.forEach(node, function (nodechild) {
                    functionObject = findReturnInBody(nodechild, functionObject);
                });
            }
        }

        return functionObject;
    }

    //legacy code; it's still called so I'm not taking it out but this does nothing.
    function total() { return 0; }

    /* Gets the last line in a multiline block of code.
    * @param functionNode - The node in questions
    * @returns - Integer representing the line number of the last line of the block.
    */
    function getLastLine(functionNode) {
        if (!('body' in functionNode) || functionNode.body.length === 0) {
            return functionNode.lineno;
        }

        var lastLine = getLastLine(functionNode.body[functionNode.body.length - 1]);

        //if the node has a "body" or "orelse" component, this may end later than what we have marked.
        if ('body' in functionNode.body[functionNode.body.length - 1]) {
            var bodyLast = getLastLine(functionNode.body[functionNode.body.length - 1]);
            if (bodyLast > lastLine) {
                lastLine = bodyLast;
            }
        }
        if ('orelse' in functionNode && functionNode.orelse.length > 0) {
            var orElseLast = getLastLine(functionNode.orelse[functionNode.orelse.length - 1]);
            if (orElseLast > lastLine) {
                lastLine = orElseLast;
            }
        }

        return lastLine;
    }

    /*Checks a single node for a function definition and adds name to the list if it finds one
    * @param node - The AST node to check
    * @param results - the results object
    */
    function checkForFunctions(node, results) {

        //again, some things don't get recursively checked automatically, so we manually call that here
        if (node != null && node._astname != null && 'test' in node) {
            checkForFunctions(node.test, results);
        }
        if (node != null && node._astname != null && 'orelse' in node) {
            checkForFunctions(node.orelse, results);
        }

        //now - is there a function?
        if (node != null && node._astname != null && node._astname === 'FunctionDef') {
            if (results.userFunc < 1) {
                //update results
                results.userFunc = 1;
            }

            //gather parameter information
            var paramList = [];
            for (var r = 0; r < node.args.args.length; r++) {
                var paramName = node.args.args[r].id.v;
                paramList.push(paramName);
            }


            var lineNumber = node.lineno - 1;
            var lastLine = getLastLine(node);
            var wholeLoop = studentCode.slice(lineNumber, lastLine);
            userFunctionParameters.push({
                name: node.name.v,
                params: paramList,
                paramFuncsCalled: []
            });

            var funcOrVar = "";
            var flag = "";
            var valueType = "";
            var binVal = null;
            var functionName = node.name.v;

            //create base function object
            var functionObj = {
                name: functionName
            };

            for (var i = 0; i < node.body.length; i++) {
                //go through the lines and find any returns.
                //findReturnInBody also fills out all the other things
                functionObj = findReturnInBody(node.body[i], functionObj);
            }

            //set originality measure
            var originality = false;
            for (var p = lineNumber + 1; p < lastLine + 1; p++) {
                if (originalityLines.includes(p)) {
                    originality = true;
                    break;
                }
            }

            if (originality && results.userFunc < 2) {
                //update results
                results.userFunc = 2;
            }

            functionObj.original = originality;
            var lastLine = getLastLine(node);

            //store these lines as places where functions are defined
            var functionLineMarker = {
                name: functionName,
                lines: []
            };

            for (var k = node.lineno; k <= lastLine; k++) {
                uncalledFunctionLines.push(k);
                functionLineMarker.lines.push(k);
            }

            functionLines.push(functionLineMarker);

            //create a new object and add its return value. push to list.
            if (functionObj != null) {
                functionObj.name = functionName;
                functionObj.startLine = node.lineno;
                functionObj.endLine = lastLine;
                userFunctionReturns.push(functionObj);
            }
        }
    }

    /*Checks each line of student code for originality. This is stored for later use.
    */
    function checkOriginality() {
        for (var studentLine = 0; studentLine < studentCode.length; studentLine++) {
            var isOriginal = true;

            //trim
            var thisLine = trimCommentsAndWhitespace(studentCode[studentLine]);

            //check against all lines of sample code, also trimmed
            for (var sampleLine = 0; sampleLine < sampleCode.length; sampleLine++) {
                var thisSample = sampleCode[sampleLine];
                thisSample = trimCommentsAndWhitespace(thisSample);
                if (checkForMatch(thisLine, thisSample, 5)) {
                    isOriginal = false;
                    break;
                }
            }

            if (isOriginal) {
                //store if it's original
                originalityLines.push(studentLine + 1);
            }
        }
    }

    /*Recursively calls lookForParamReturns on a series of AST nodes.
    * @param ast - AST tree or node.
    */
    function evaluateFunctionReturnParams(ast) {
        if (ast != null && ast.body != null) {
            lookForParamReturns(ast);
            angular.forEach(ast.body, function (node) {
                lookForParamReturns(node);
                evaluateFunctionReturnParams(node);
            });
        }
        else if (ast != null && (ast._astname != null || (ast[0] != null && typeof ast[0] === 'object'))) {
            lookForParamReturns(ast);
            angular.forEach(ast, function (node) {
                lookForParamReturns(node);
                evaluateFunctionReturnParams(node);
            });
        }
    }

    /* Labels functions that return their own parameters. Also handles function removal from the uncalledFunctionLines if said function is called (we only evaluate in-function code if the function is called)
    * @param node - the node to be checked
    *
    *
    */
    function lookForParamReturns(node) {

        //again, we need to manually recurse through certian types of nodes
        if (node != null && node._astname != null && 'test' in node) {
            evaluateFunctionReturnParams(node.test);
        }
        if (node != null && node._astname != null && "iter" in node) {
            evaluateFunctionReturnParams(node.iter);
        }
        if (node != null && node._astname != null && "orelse" in node) {
            evaluateFunctionReturnParams(node.orelse);
        }


        if (node != null && node._astname === "Call" && "attr" in node.func) {
            //this is solely for JS array ops such as map() that take function expressions as arguments
            for (var i in node.args) {
                var nodeItem = retrieveFromList(node.args[i]);
                if (nodeItem != null && nodeItem._astname === "FunctionExp") {
                    //handle params
                    var funcName = nodeItem.functionName;
                    var isRecursiveCall = false;
                    var argsIn = nodeItem.functionDef.args.args;
                    var calledReturnObj = getFunctionObject(calledName);


                    if (calledReturnObj != null && calledReturnObj.startLine != null && (nodeItem.lineno > calledReturnObj.startLine && nodeItem.lineno <= calledReturnObj.endLine)) {
                        isRecursiveCall = true;
                    }
                    var index = -1;
                    for (var userFuncRet = 0; userFuncRet < userFunctionReturns.length; userFuncRet++) {
                        if (userFunctionReturns[userFuncRet].name === funcName) {
                            index = userFuncRet;
                            break;
                        }
                    }
                    //create empty variable value for the param
                    for (var a = 0; a < argsIn.length; a++) {
                        var paramArgVar = {
                            name: "",
                            value: "",
                            binOp: null,
                            flagVal: "",
                            funcVar: "",
                            containedValue: [],
                            nested: "",
                            original: false,
                            indexAndInput: {
                                input: false,
                                indexed: false,
                                strIndexed: false
                            },
                            opsDone: [],
                            modifyingFunctions: [],
                            assignedModified: [],
                            nodeElements: [],
                            stringElements: []
                        };

                        //adjustments so things get read accurately
                        var lineNo = nodeItem.lineno;
                        for (var h = 0; h < loopLocations.length; h++) {
                            if (lineNo >= loopLocations[h][0] && lineNo <= loopLocations[h][1]) {
                                lineNo = loopLocations[h][0];
                                break;
                            }
                        }


                        if (!isRecursiveCall) {
                            paramArgVar.assignedModified.push({
                                line: lineNo,
                                value: studentCode[nodeItem.lineno - 1].trim(),
                                nodeValue: nodeItem
                            });
                            variableAssignments.push({ line: node.lineno, name: paramArgVar.name });
                        }

                        //fill in param variable values, add to allVariables
                        var alreadyExists = -1;
                        var funcInd = -1;
                        for (var f = 0; f < userFunctionParameters.length; f++) {
                            if (userFunctionParameters[f].name === funcName) {
                                funcInd = f;
                                break;
                            }
                        }

                        if (funcInd != -1) {
                            for (var e = 0; e < allVariables.length; e++) {
                                if (allVariables[e].name === userFunctionParameters[funcInd].params[a]) {
                                    alreadyExists = e;
                                    break;
                                }
                            }

                            paramArgVar.name = userFunctionParameters[funcInd].params[a];
                        }

                        var attrName = node.func.attr.v;
                        var opToPerform = null;
                        //this information is needed so we can get a value for the param variable
                        if (attrName === "map" || attrName === "filter") {
                            var listToUse = [];
                            if ('func' in node && 'attr' in node.func) {
                                opToPerform = node.func.attr.v;
                            }
                            if (node.func.value._astname === "Name") {
                                var variable = getVariableObject(node.func.value.id.v);
                                if (variable != null) {
                                    var correctElts = mostRecentElements(variable, node.lineno - 1);
                                    if (correctElts != null) {
                                        listToUse = correctElts.slice(0);
                                    }
                                }
                            }
                            else if (node.func.value._astname === "Call") {
                                if (doesCallCreateList(node.func.value)) {
                                    listToUse = performListOp(node.func.value, false)[0];
                                }
                                else if (retrieveFromList(node.func.value) != node.func.value) {
                                    listToUse = retrieveFromList(node.func.value).elts;
                                }

                                else if ('id' in node.func.value.func) {
                                    var funcName = node.func.value.func.id.v;
                                    var thisLine = node.lineno;


                                    if (getFunctionObject(funcName) != null) {
                                        var variable = getVariableObject(node.func.value.id.v);
                                        if (variable != null) {
                                            var correctElts = mostRecentElements(variable, node.lineno);
                                            if (correctElts != null) {
                                                listToUse = correctElts.slice(0);
                                            }
                                        }
                                    }
                                }
                            }
                            else if (node.func.value._astname === "List") {
                                listToUse = node.func.value.elts;
                            }
                            else if (node.func.value._astname === "BinOp") {
                                listToUse = getAllBinOpLists(node.func.value);
                            }

                            if (listToUse != null) {
                                paramArgVar.value = getTypeFromNode(retrieveFromList(listToUse[0]));
                            }

                        }

                        //add to relevant lists

                        if (paramArgVar.opsDone.length > 0 && index != -1 && userFunctionReturns[index].startLine != null) {
                            paramArgVar.modifyingFunctions.push([userFunctionReturns[index].startLine, userFunctionReturns[index].endLine]);
                        }
                        if (alreadyExists > -1 && (allVariables[alreadyExists].value === "" && paramArgVar.value !== "")) {
                            allVariables[alreadyExists] = paramArgVar;
                        }
                        else if (alreadyExists === -1) {
                            allVariables.push(paramArgVar);
                            variableAssignments.push({ line: node.lineno, name: paramArgVar.name });
                        }
                    }



                    if (index > -1) {
                        //if the function returns one of its own parameters, we now know what datatype that is.

                        if (userFunctionReturns[index].funcVar === "param") {
                            var arg = nodeItem.args[userFunctionReturns[index].flagVal];
                            var argType = arg._astname;
                            var returnType = argType;
                            var containedWithin = [];
                            if (userFunctionReturns[index].opsDone == null) {
                                userFunctionReturns[index].opsDone = [];
                            }

                            if (argType === "Num") {
                                if (!isNodeFloat(arg)) {
                                    argType = "Int";
                                }
                                else {
                                    argType = "Float";
                                }

                                userFunctionReturns[index].flagVal = "";
                                userFunctionReturns[index].funcVar = "";
                                userFunctionReturns[index].returns = argType;
                            }

                            if (argType === "Name" && (arg.id.v === "True" || arg.id.v === "False")) {
                                argType = "Bool";
                                userFunctionReturns[index].flagVal = "";
                                userFunctionReturns[index].funcVar = "";
                                userFunctionReturns[index].returns = argType;
                            }

                            else if (argType === "Name") {
                                var foundVar = false;
                                for (var v = 0; v < allVariables.length; v++) {
                                    if (allVariables[v].name === arg.id.v && allVariables[v].value !== "" && allVariables[v].value !== "BinOp") {
                                        foundVar = true;
                                        argType = allVariables[v].value;
                                        containedWithin = allVariables[v].containedValue;
                                        userFunctionReturns[index].opsDone = appendOpList(allVariables[v].opsDone, userFunctionReturns[index].opsDone);
                                        break;
                                    }
                                }

                                if (foundVar) {
                                    userFunctionReturns[index].funcVar = "";
                                    userFunctionReturns[index].flagVal = "";
                                    userFunctionReturns[index].returns = argType;
                                    if (containedWithin.length > 0) {
                                        userFunctionReturns[index].containedValue = containedWithin;
                                    }
                                }
                                else {
                                    userFunctionReturns[index].funcVar = "var";
                                    userFunctionReturns[index].flagVal = arg.id.v;
                                }
                            }
                            if (argType === "Compare") {
                                argType = "Bool";
                                userFunctionReturns[index].opsDone = addOpToList("Compare", userFunctionReturns[index].opsDone, nodeItem.lineno);
                                listTypesWithin(arg, containedWithin, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);

                                userFunctionReturns[index].funcVar = "";
                                userFunctionReturns[index].flagVal = "";
                                userFunctionReturns[index].returns = argType;

                                if (containedWithin.length > 0) {
                                    userFunctionReturns[index].containedValue = containedWithin;
                                }
                            }
                            if (argType === "BoolOp") {
                                argType = "Bool";

                                userFunctionReturns[index].opsDone = addOpToList("BoolOp", userFunctionReturns[index].opsDone, nodeItem.lineno);
                                userFunctionReturns[index].funcVar = "";
                                userFunctionReturns[index].flagVal = "";

                                userFunctionReturns[index].returns = argType;
                                listTypesWithin(arg, containedWithin, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);

                                if (containedWithin.length > 0) {
                                    userFunctionReturns[index].containedValue = containedWithin;
                                }
                            }
                            if (argType === "Call") {
                                //if the argument is a function call, we need to know what THAT function returns.
                                var foundFunc = false;
                                var funcName = "";
                                if ('id' in nodeItem.value.func) {
                                    funcName = nodeItem.value.func.id.v;
                                }
                                else {
                                    funcName = nodeItem.value.func.attr.v;
                                }
                                if (funcName === 'readInput') {
                                    userFunctionReturns[index].indexAndInput.input = true;
                                }

                                if (listFuncs.includes(funcName)) {
                                    valueType = "List";
                                    userFunctionReturns[index].opsDone = addOpToList("ListOp", userFunctionReturns[index].opsDone, nodeItem.lineno);
                                    if (nodeItem.value.func.value._astname === "List") {
                                        var valuesInList = listTypesWithin(nodeItem.value.func.value.elts, [], userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);
                                        for (var vil = 0; vil < valuesInList; vil++) {
                                            userFunctionReturns[index].containedValue.push(valuesInList[vil]);
                                        }
                                    }
                                    //binop
                                    if (nodeItem.value.func.value._astname === "BinOp") {
                                        var valsInOp = [];

                                        listTypesWithin(nodeItem.value.func.value, valsInOp, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);
                                        for (var vio = 0; vio < valsInOp.length; vio++) {
                                            userFunctionReturns[index].containedValue.push(valsInOp[vio]);
                                        }
                                    }
                                    //func call
                                    if (nodeItem.value.func.value._astname === "Call" && 'id' in nodeItem.value.func.value) {
                                        var calledFunction = getFunctionObject(nodeItem.value.func.value.id.v);
                                        if (calledFunction != null) {
                                            copyAttributes(calledFunction, userFunctionReturns[index], ["original", "binOp", "indexAndInput", "nodeElements", "stringElements", "nested"]);

                                            if (calledFunction.containedValue != null) {
                                                appendArray(calledFunction.containedValue, userFunctionReturns[index].containedValue);
                                            }
                                            if (calledFunction.opsDone != null) {
                                                userFunctionReturns[index].opsDone = appendOpList(calledFunction.opsDone, userFunctionReturns[index].opsDone);
                                            }
                                        }
                                    }
                                    //var
                                    if (nodeItem.value.func.value._astname === "Name") {
                                        var valueVariable = getVariableObject(nodeItem.value.func.value.id.v);
                                        if (valueVariable != null) {
                                            copyAttributes(valueVariable, userFunctionReturns[index], ["indexAndInput", "nested"]);
                                            if (valueVariable.nodeElements.length > 0) {
                                                userFunctionReturns.nodeElements = [valueVariable.nodeElements[0]];
                                                userFunctionReturns.stringElements = [valueVariable.stringElements[0]];
                                            }
                                            appendArray(valueVariable.containedValue, userFunctionReturns[index].containedValue);
                                            appendOpList(valueVariable.opsDone, userFunctionReturns[index].opsDone);
                                        }
                                    }
                                }
                                if (strFuncs.includes(funcName)) {
                                    varVal = "String";
                                    userFunctionReturns[index].opsDone = addOpToList("StrOp", userFunctionReturns[index].opsDone, nodeItem.lineno);
                                    if (nodeItem.value.func.value._astname === "Name") {
                                        var otherVar = getVariableObject(nodeItem.value.func.value.id.v);
                                        if (otherVar != null) {
                                            if (otherVar.containedValue != null && otherVar.containedValue.length > 0) {
                                                appendArray(otherVar.containedValue, userFunctionReturns[index].containedValue);
                                                userFunctionReturns[index].opsDone = appendOpList(otherVar.opsDone, userFunctionReturns[index].opsDone);
                                            }
                                        }
                                    }

                                    if (nodeItem.value.func.value._astname === "BinOp") {
                                        var valsInOp = [];
                                        listTypesWithin(nodeItem.value.func.value, valsInOp, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);

                                        for (var vio = 0; vio < valsInOp.length; vio++) {
                                            userFunctionReturns[index].containedValue.push(valsInOp[vio]);
                                        }
                                    }
                                    if (nodeItem.value.func.value._astname === "Call") {
                                        for (var functionNum = 0; functionNum < userFunctionReturns.length; functionNum++) {

                                            if (nodeItem.value.func.value.id.v === userFunctionReturns[functionNum].name) {

                                                if (userFunctionReturns[functionNum].containedValue != null && userFunctionReturns[functionNum].containedValue.length > 0) {
                                                    for (var cv = 0; cv < userFunctionReturns[functionNum].containedValue.length; cv++) {
                                                        userFunctionReturns[index].containedValue.push(userFunctionReturns[functionNum].containedValue[cv]);
                                                    }
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }


                                var funcRet = getFunctionObject(arg.id.v);
                                if (funcRet != null && funcRet.returns !== "" && funcRet.returns !== "BinOp") {
                                    foundFunc = true;

                                    userFunctionReturns[index].flagVal = "";
                                    userFunctionReturns[index].funcVar = "";
                                    userFunctionReturns[index].returns = funcRet.returns;

                                    if (funcRet.containedValue != null) {
                                        userFunctionReturns[index].containedValue = funcRet.containedValue;
                                    }
                                    if (funcRet.opsDone != null) {
                                        appendOpList(funcRet.opsDone, userFunctionReturns[index].opsDone);
                                    }
                                }
                                if (!foundFunc) {
                                    userFunctionReturns[index].funcVar = "func";
                                    userFunctionReturns[index].flagVal = arg.func.id.v;
                                }

                            }
                            if (argType === "BinOp") {
                                var contVal = [];
                                userFunctionReturns[index].opsDone = addOpToList("BinOp", userFunctionReturns[index], nodeItem.lineno);
                                var binVal = recursivelyAnalyzeBinOp(arg);


                                if (typeof binVal === "string") {
                                    userFunctionReturns[index].returns = binVal;
                                    listTypesWithin(arg, contVal, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);

                                    userFunctionReturns[index].flagVal = "";
                                    userFunctionReturns[index].funcVar = "";
                                }

                                else if (Array.isArray(binVal)) {
                                    userFunctionReturns[index].returns = "List";
                                    listTypesWithin(arg, contVal, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);

                                    userFunctionReturns[index].flagVal = "";
                                    userFunctionReturns[index].funcVar = "";

                                    userFunctionReturns[index].nodeElements = [{
                                        line: arg.lineno,
                                        elts: binVal
                                    }];
                                    userFunctionReturns[index].stringElements = [{
                                        line: arg.lineno,
                                        elts: nodesToStrings(binVal)
                                    }];
                                }

                                else {
                                    userFunctionReturns[index].returns = "BinOp";
                                    userFunctionReturns[index].binOp = binVal;
                                    listTypesWithin(arg, contVal, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);
                                }
                                if (contVal.length > 0) {
                                    userFunctionReturns[index].containedValue = contVal;
                                }
                            }
                            if (argType === "List") {
                                userFunctionReturns[index].flagVal = "";
                                userFunctionReturns[index].funcVar = "";

                                userFunctionReturns[index].returns = "List";
                                userFunctionReturns[index].containedValue = listTypesWithin(arg.elts, userFunctionReturns[index].containedValue,
                                    userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);

                                userFunctionReturns[index].nodeElements = [{
                                    line: arg.lineno,
                                    elts: arg.elts
                                }];
                                userFunctionReturns[index].stringElements = [{
                                    line: arg.lineno,
                                    elts: nodesToStrings(arg.elts)
                                }];
                            }
                        }
                    }
                    var modifiesParams = [];


                    //store line numbers and originality
                    var lineNumber = 0;
                    if (nodeItem.lineno != null) {
                        lineNumber = nodeItem.lineno;
                        parentLineNumber = lineNumber;
                    }
                    else {
                        lineNumber = parentLineNumber;
                    }

                    var originality = (originalityLines.includes(lineNumber));
                    var startLine = 0;
                    var endLine = 0;

                    for (var f = 0; f < userFunctionReturns.length; f++) {
                        if (userFunctionReturns[f].name === funcName && userFunctionReturns[f].paramsChanged != null) {
                            modifiesParams = userFunctionReturns[f].paramsChanged;
                            startLine = userFunctionReturns[f].startLine;
                            endLine = userFunctionReturns[f].endLine;
                            break;
                        }
                    }


                    //update assignedModified for any params that the function modifies
                    for (var a = 0; a < argsIn.length; a++) {
                        if (modifiesParams.includes(a) && (argsIn[a]._astname === "Name" && argsIn[a].id.v !== "True" && argsIn[a].id.v !== "False")) {
                            modString = studentCode[nodeItem.lineno - 1];

                            for (var v = 0; v < allVariables.length; v++) {
                                if (allVariables[v].name === argsIn[a].id.v) {
                                    var lineNo = nodeItem.lineno;
                                    for (var h = 0; h < loopLocations.length; h++) {
                                        if (lineNo >= loopLocations[h][0] && lineNo <= loopLocations[h][1]) {
                                            lineNo = loopLocations[h][0];
                                            break;
                                        }
                                    }

                                    allVariables[v].assignedModified.push({
                                        line: lineNo,
                                        value: studentCode[lineNumber].trim(),
                                        original: originality,
                                        nodeValue: nodeItem
                                    });
                                    variableAssignments.push({ line: node.lineno, name: allVariables[v].name });

                                    allVariables[v].modifyingFunctions.push([startLine, endLine]);
                                    break;
                                }
                            }
                        }
                    }


                    //Handle uncalledFunctionLines. a functionExp is generally ALWAYS called.
                    for (var p = 0; p < functionLines.length; p++) {
                        if (functionLines[p].name === funcName) {
                            //remove lines from uncalledFunctionLines
                            for (var l = 0; l < functionLines[p].lines.length; l++) {
                                var lineIndex = uncalledFunctionLines.indexOf(functionLines[p].lines[l]);
                                uncalledFunctionLines.splice(lineIndex, 1);
                            }
                            break;
                        }
                    }
                }
            }
        }


        //for everything that ISN'T a JS FunctionExp
        if (node != null && node._astname != null && node._astname === "Call") {
            //is this a user function?
            var alreadyExists = false;
            var funcInd = -1;
            var argsIn = [];
            var funcNames = [];
            var funcName = "";
            var nodeArgs = [];

            //get the function name and args
            if ('id' in node.func) {
                funcName = node.func.id.v;
                argsIn = node.args;
            }
            else if ('attr' in node.func) {
                funcName = node.func.attr.v;
                nodeArgs = [node.func.value];
            }
            else if (node.func._astname === "Subscript") {
                var nameNode = retrieveFromList(node.func);
                if (nameNode._astname === "Name") {
                    funcName = nameNode.id.v;
                }
                argsIn = node.args;
            }

            //if we haven't stored the name yet, check the function renames in for loops
            for (var f = 0; f < userFunctionParameters.length; f++) {
                if (userFunctionParameters[f].name === funcName) {
                    alreadyExists = true;
                    funcInd = f;
                    break;
                }
            }

            if (!alreadyExists) {
                var alias = null;
                for (var h in forLoopFuncs) {
                    if (forLoopFuncs[h].callName === funcName) {
                        alreadyExists = true;
                        funcNames = forLoopFuncs[h].functionNames;
                        break;
                    }
                }
            }
            else {
                funcNames = [funcName];
            }

            //we have to do this for each stored name
            for (var r in funcNames) {
                var foundName = false;
                var calledName = funcNames[r];

                for (var f = 0; f < userFunctionParameters.length; f++) {
                    if (userFunctionParameters[f].name === calledName) {
                        foundName = true;
                        funcInd = f;
                        break;
                    }
                }
                for (var p = 0; p < functionLines.length; p++) {
                    for (var n = 0; n < userFunctionRenames.length; n++) {
                        if (userFunctionRenames[n][0] === calledName) {
                            calledName = userFunctionRenames[n][1];
                        }
                    }

                    if (functionLines[p].name === calledName) {
                        //remove lines from uncalledFunctionLines
                        for (var l = 0; l < functionLines[p].lines.length; l++) {
                            var lineIndex = uncalledFunctionLines.indexOf(functionLines[p].lines[l]);
                            uncalledFunctionLines.splice(lineIndex, 1);
                        }
                        break;
                    }
                }

                var ops = [];
                var isRecursiveCall = false;
                var calledReturnObj = getFunctionObject(calledName);

                if (calledReturnObj != null) {
                    if (!('callsTo' in calledReturnObj)) {
                        calledReturnObj.callsTo = [];
                    }

                    calledReturnObj.callsTo.push(node.lineno);
                }


                if (calledReturnObj != null && calledReturnObj.startLine != null && (node.lineno > calledReturnObj.startLine && node.lineno <= calledReturnObj.endLine)) {
                    isRecursiveCall = true;
                }

                if (foundName) {
                    //create a variable object for each parameter, adding to allVariables
                    for (var a = 0; a < argsIn.length; a++) {

                        var paramArgVar = {
                            name: "",
                            value: "",
                            binOp: null,
                            flagVal: "",
                            funcVar: "",
                            containedValue: [],
                            nested: "",
                            original: false,
                            indexAndInput: {
                                input: false,
                                indexed: false,
                                strIndexed: false
                            },
                            opsDone: ops,
                            modifyingFunctions: [],
                            assignedModified: [],
                            nodeElements: [],
                            stringElements: []
                        };

                        //get lineno, etc.
                        var lineNo = node.lineno;
                        for (var h = 0; h < loopLocations.length; h++) {
                            if (lineNo >= loopLocations[h][0] && lineNo <= loopLocations[h][1]) {
                                lineNo = loopLocations[h][0];
                                break;
                            }
                        }

                        if (!isRecursiveCall) {
                            paramArgVar.assignedModified.push({
                                line: lineNo,
                                value: studentCode[node.lineno - 1].trim(),
                                nodeValue: node
                            });
                            variableAssignments.push({ line: node.lineno, name: paramArgVar.name });
                        }

                        var alreadyExists = -1;
                        for (var e = 0; e < allVariables.length; e++) {
                            if (allVariables[e].name === userFunctionParameters[funcInd].params[a]) {
                                alreadyExists = e;
                                break;
                            }
                        }

                        if (funcInd != -1) {
                            paramArgVar.name = userFunctionParameters[funcInd].params[a];
                        }


                        //now we get the actual value
                        var argItem = argsIn[a];
                        if (argItem._astname === "UnaryOp") {
                            paramArgVar.value = "Bool";
                            listTypesWithin(argsIn[a].operand, paramArgVar.containedValue, paramArgVar.indexAndInput, paramArgVar.opsDone);
                            argItem = argItem.operand;
                        }

                        if (retrieveFromList(argItem) != argItem) {
                            if (getIndexingInNode(argItem)[0]) {
                                paramArgVar.indexAndInput.indexed = true;
                            }
                            if (getStringIndexingInNode(argItem)[0]) {
                                paramArgVar.indexAndInput.strIndexed = true;
                            }

                            argItem = retrieveFromList(argItem);
                        }


                        if (argItem != null && argItem._astname === "Subscript") {
                            if (getIndexingInNode(argItem)[0]) {
                                paramArgVar.indexAndInput.indexed = true;
                            }
                            if (getStringIndexingInNode(argItem)[0]) {
                                paramArgVar.indexAndInput.strIndexed = true;
                            }

                            argItem = retrieveFromList(argItem);
                        }
                        if (argItem != null && argItem._astname === "UnaryOp") {
                            paramArgVar.value = "Bool";
                            listTypesWithin(argsIn[a].operand, paramArgVar.containedValue, paramArgVar.indexAndInput, paramArgVar.opsDone);
                            argItem = argItem.operand;
                        }

                        if (argItem != null) {
                            var type = argsIn[a]._astname;
                            if (type === "Str") {
                                paramArgVar.value = "Str";
                            }

                            else if (type === "AugAssign") {
                                paramArgVar.opsDone = addOpToList("AugAssign", paramArgVar.opsDone, node.lineno);
                            }

                            else if (type === "Num") {
                                if (!isNodeFloat(node.args[a])) {
                                    paramArgVar.value = "Int";
                                }
                                else {
                                    paramArgVar.value = "Float";
                                }
                            }
                            else if (type === "Name" && (argsIn[a].id.v === "True" || argsIn[a].id.v === "False")) {
                                paramArgVar.value = "Bool";
                            }
                            else if (type === "Name") {
                                var otherVar = node.args[a].id.v;
                                var foundOtherVar = false;
                                var otherVariableLocated = getVariableObject(otherVar);

                                if (otherVariableLocated != null && otherVariableLocated.value !== "" && otherVariableLocated.value !== "BinOp") {
                                    foundOtherVar = true;
                                    copyAttributes(otherVariableLocated, paramArgVar, ["value", "flagVal", "binOp", "nested", "indexAndInput", "original", "nodeElements", "stringElements"]);
                                    appendArray(otherVariableLocated.containedValue, paramArgVar.containedValue);
                                    paramArgVar.opsDone = appendOpList(otherVariableLocated.opsDone, paramArgVar.opsDone);
                                }
                                if (!foundOtherVar) {
                                    paramArgVar.funcVar = "var";
                                    paramArgVar.flagVal = otherVar;
                                }
                            }
                            else if (type === "BinOp") {
                                var nestedBinOp = [];
                                getNestedVariables(node.args[a], nestedBinOp);
                                paramArgVar.opsDone = addOpToList("BinOp", paramArgVar.opsDone, node.lineno);

                                if (nestedBinOp.length > 0) {
                                    paramArgVar.nested = true;
                                }


                                var binVal = recursivelyAnalyzeBinOp(node.args[a]);
                                if (binVal != null && typeof binVal === 'string' && !binVal.includes(':')) {
                                    paramArgVar.value = binVal;
                                }

                                    //list binops
                                else if (binVal != null && Array.isArray(binVal)) {
                                    paramArgVar.value = "List";
                                    paramArgVar.nodeElements.push({
                                        line: node.lineno,
                                        elts: binVal
                                    });
                                    paramArgVar.stringElements.push({
                                        line: node.lineno,
                                        elts: nodesToStrings(binVal)
                                    });
                                }
                                    //if we don't have an answer yet, store the binop object for later evaluation
                                else {
                                    paramArgVar.value = "BinOp";
                                    paramArgVar.binOp = binVal;
                                }

                                var binOpTypes = listTypesWithin(node.args[a], [], paramArgVar.indexAndInput, paramArgVar.opsDone);
                                paramArgVar.containedVal = binOpTypes;

                            }
                            else if (type === "Call") {
                                //then it's whatever that call returns
                                var funcName = "";
                                var item = argsIn[a].func;
                                item = retrieveFromList(argsIn[a].func);
                                if ('id' in item) {
                                    funcName = item.id.v;
                                }
                                else if ('attr' in item) {
                                    funcName = item.attr.v;
                                }
                                if (funcName === 'readInput') {
                                    functionObject.indexAndInput.input = true;
                                }

                                if (listFuncs.includes(funcName)) {
                                    valueType = "List";
                                    paramArgVar.opsDone = addOpToList("ListOp", paramArgVar.opsDone, node.lineno);

                                    if (node.value.func.value._astname === "List" || node.value.func.value._astname === "BinOp") {
                                        var valuesInList = listTypesWithin(node.value.func.value.elts, [], functionObject.indexAndInput, opsPerformed);
                                        appendArray(valuesInList, paramArgVar.containedValue);
                                    }
                                    //elts
                                    var eltsObj = performListOp(item);
                                    paramArgVar.nodeElements.push({
                                        line: node.lineno,
                                        elts: eltsObj[0]
                                    });
                                    paramArgVar.stringElements.push({
                                        line: node.lineno,
                                        elts: eltsObj[1]
                                    });


                                    //func call
                                    if (node.value.func.value._astname === "Call") {
                                        var paramCall = getFunctionObject(node.value.func.value.id.v);
                                        if (paramCall != null) {
                                            if (paramCall.containedValue != null) {
                                                appendArray(paramCall.containedValue, paramArgVar.containedValue);
                                            }
                                            if (paramCall.opsDone != null) {
                                                paramArgVar.opsDone = appendOpList(paramCall.opsDone, paramArgVar.opsDone);
                                            }
                                            if (paramCall.nodeElements != null) {
                                                paramArgVar.nodeElements = paramCall.nodeElements;
                                                paramArgVar.stringElements = paramCall.stringElements;
                                            }
                                        }
                                    }


                                    //var 
                                    if (node.value.func.value._astname === "Name") {
                                        var calledVar = getVariableObject(node.value.func.value.id.v);
                                        if (calledVar != null) {

                                            appendArray(calledVar.containedValue, paramArgVar.containedValue);
                                            paramArgVar.opsDone = appendOpList(calledVar.opsDone, paramArgVar.opsDone);


                                            appendArray(paramCall.stringElements, paramArgVar.stringElements);
                                            appendArray(paramCall.nodeElements, paramArgVar.nodeElements);
                                        }
                                    }
                                }

                                if (strFuncs.includes(funcName)) {
                                    varVal = "String";
                                    paramArgVar.opsDone = addOpToList("StrOp", paramArgVar.opsDone, node.lineno);

                                    //if it's a string op, we need to get the arguments passed and store these in containedValue
                                    if (item.value._astname === "Name") {

                                        var otherVar = getVariableObject(item.value.id.v);
                                        if (otherVar != null) {

                                            copyAttributes(otherVar, paramArgVar, ["nested", "binOp", "original", "nodeElements", "stringElements"]);
                                            copyAttributes(otherVar.indexAndInput, paramArgVar.indexAndInput, ["input", "indexed", "strIndexed"]);

                                            appendArray(otherVar.containedValue, paramArgVar.containedValue);
                                            paramArgVar.opsDone = appendOpList(otherVar.opsDone, paramArgVar.opsDone);

                                        }
                                    }
                                    if (item.value._astname === "BinOp") {
                                        var valsInOp = [];
                                        listTypesWithin(item.value, valsInOp, paramArgVar.indexAndInput, paramArgVar.opsDone);
                                        for (var vio = 0; vio < valsInOp.length; vio++) {
                                            paramArgVar.containedValue.push(valsInOp[vio]);
                                        }
                                    }

                                    if (item.value._astname === "Call") {
                                        functionNameVal = ""
                                        var funcName = "";

                                        //if it's a function call, get all the info from THAT

                                        //get function name
                                        if ('id' in item.value.func) {
                                            funcName = item.value.func.id.v;
                                        }

                                        else if (item.value.func._astname === "Subscript" || retrieveFromList(item.value.func) != item.value.func) {
                                            var funcNameNode = null;
                                            funcNameNode = retrieveFromList(item.value.func);
                                            if (funcNameNode._astname === "Name") {
                                                funcName = funcNameNode.id.v;
                                            }
                                        }
                                        else {
                                            funcName = item.value.func.attr.v;
                                        }


                                        var valueFunc = getFunctionObject(funcName);

                                        //copy info
                                        if (valueFunc != null && (valueFunc.containedValue != null && valueFunc.containedValue.length > 0)) {
                                            appendArray(valueFunc.containedValue, paramArgVar.containedValue);
                                            copyAttributes(valueFunc.indexAndInput, paramArgVar.indexAndInput, ["input", "indexed", "strIndexed"]);
                                        }

                                        //set value and other attributes
                                        var functionReturn = getFunctionObject(funcName);

                                        if (functionReturn != null && functionReturn.returns !== "" && functionReturn !== "BinOp") {
                                            paramArgVar.value = functionReturn.returns;

                                            if (functionValue.containedValue != null) {
                                                copyAttributes(functionReturn, paramArgVar, ["nested", "binOp", "original", "nodeElements", "stringElements", "indexAndInput"]);
                                                if (functionReturn.containedValue != null) {
                                                    appendArray(functionReturn.containedValue, paramArgVar.containedValue);
                                                }
                                                if (functionReturn.opsDone != null) {
                                                    paramArgVar.opsDone = appendOpList(functionReturn.opsDone, paramArgVar.opsDone);
                                                }
                                            }
                                        }
                                        if (varVal === "") {
                                            paramArgVar.funcVar = "func";
                                            paramArgVar.flagVal = funcName;
                                        }
                                    }
                                }
                            }

                            else if (type === "BoolOp") {
                                paramArgVar.value = "Bool";
                                paramArgVar.opsDone = addOpToList("BoolOp", paramArgVar.opsDone, node.lineno);

                                var boolOpVals = listTypesWithin(argsIn[a], [], paramArgVar.indexAndInput, paramArgVar.opsDone);
                                if (boolOpVals.length > 0) {
                                    paramArgVar.containedValue = boolOpVals;
                                }
                            }
                            else if (type === "List") {
                                paramArgVar.value = "List";
                                var containedVal = listTypesWithin(argsIn[a].elts, [], paramArgVar.indexAndInput, paramArgVar.opsDone);
                                if (containedVal.length > 0) {
                                    paramArgVar.containedValue = containedVal;
                                }

                                paramArgVar.nodeElements.push({
                                    line: node.lineno,
                                    elts: argsIn[a].elts
                                });
                                paramArgVar.stringElements.push({
                                    line: node.lineno,
                                    elts: nodesToStrings(argsIn[a].elts, node.lineno)
                                });
                            }
                            else if (type === "Compare") {
                                paramArgVar.value = "Bool";
                                paramArgVar.opsDone = addOpToList("Compare", paramArgVar.opsDone, node.lineno);

                                var compareTypes = listTypesWithin(argsIn[a], [], paramArgVar.indexAndInput, paramArgVar.opsDone);
                                if (compareTypes.length > 0) {
                                    paramArgVar.containedValue = compareTypes;
                                }
                            }

                            var index = -1;

                            for (var userFuncRet = 0; userFuncRet < userFunctionReturns.length; userFuncRet++) {

                                if (userFunctionReturns[userFuncRet].name === funcName) {
                                    index = userFuncRet;
                                    break;
                                }
                            }

                            if (paramArgVar.opsDone.length > 0 && index != -1 && userFunctionReturns[index].startLine != null) {
                                paramArgVar.modifyingFunctions.push([userFunctionReturns[index].startLine, userFunctionReturns[index].endLine]);
                            }

                            if (alreadyExists > -1 && (allVariables[alreadyExists].value === "" && paramArgVar.value !== "")) {
                                allVariables[alreadyExists] = paramArgVar;
                            }
                            else if (alreadyExists === -1) {
                                allVariables.push(paramArgVar);

                                variableAssignments.push({ line: node.lineno, name: paramArgVar.name });
                            }
                        }
                    }

                    if (index > -1) {
                        //if the function returns this parameter, we tell it what that is
                        if (userFunctionReturns[index].funcVar === "param") {
                            var arg = node.args[userFunctionReturns[index].flagVal];
                            var argType = arg._astname;
                            var returnType = argType;
                            var containedWithin = [];


                            if (userFunctionReturns[index].opsDone == null) {
                                userFunctionReturns[index].opsDone = [];
                            }
                            if (argType === "Num") {
                                if (!isNodeFloat(arg)) {
                                    argType = "Int";
                                }
                                else {
                                    argType = "Float";
                                }
                                userFunctionReturns[index].flagVal = "";
                                userFunctionReturns[index].funcVar = "";
                                userFunctionReturns[index].returns = argType;
                            }
                            if (argType === "Name" && (arg.id.v === "True" || arg.id.v === "False")) {
                                argType = "Bool";

                                userFunctionReturns[index].flagVal = "";
                                userFunctionReturns[index].funcVar = "";

                                userFunctionReturns[index].returns = argType;
                            }
                            else if (argType === "Name") {
                                var foundVar = false;
                                for (var v = 0; v < allVariables.length; v++) {

                                    if (allVariables[v].name === arg.id.v && allVariables[v].value !== "" && allVariables[v].value !== "BinOp") {

                                        foundVar = true;
                                        argType = allVariables[v].value;

                                        containedWithin = allVariables[v].containedValue;
                                        userFunctionReturns[index].opsDone = appendOpList(allVariables[v].opsDone, userFunctionReturns[index].opsDone);

                                        break;
                                    }
                                }
                                if (foundVar) {
                                    userFunctionReturns[index].funcVar = "";
                                    userFunctionReturns[index].flagVal = "";
                                    userFunctionReturns[index].returns = argType;

                                    if (containedWithin.length > 0) {
                                        userFunctionReturns[index].containedValue = containedWithin;
                                    }
                                }
                                else {
                                    userFunctionReturns[index].funcVar = "var";
                                    userFunctionReturns[index].flagVal = arg.id.v;
                                }
                            }

                            if (argType === "Compare") {
                                argType = "Bool";
                                userFunctionReturns[index].opsDone = addOpToList("Compare", userFunctionReturns[index].opsDone, node.lineno);
                                listTypesWithin(arg, containedWithin, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);

                                userFunctionReturns[index].funcVar = "";
                                userFunctionReturns[index].flagVal = "";

                                userFunctionReturns[index].returns = argType;
                                if (containedWithin.length > 0) {
                                    userFunctionReturns[index].containedValue = containedWithin;
                                }
                            }

                            if (argType === "BoolOp") {
                                argType = "Bool";
                                userFunctionReturns[index].opsDone = addOpToList("BoolOp", userFunctionReturns[index].opsDone, node.lineno);

                                userFunctionReturns[index].funcVar = "";
                                userFunctionReturns[index].flagVal = "";
                                userFunctionReturns[index].returns = argType;

                                listTypesWithin(arg, containedWithin, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);
                                if (containedWithin.length > 0) {
                                    userFunctionReturns[index].containedValue = containedWithin;
                                }
                            }
                            if (argType === "Call") {
                                var foundFunc = false;
                                var funcName = "";

                                if ('id' in node.value.func) {
                                    funcName = node.value.func.id.v;
                                }
                                else {
                                    funcName = node.value.func.attr.v;
                                }
                                if (funcName === 'readInput') {
                                    userFunctionReturns[index].indexAndInput.input = true;
                                }


                                if (listFuncs.includes(funcName)) {
                                    valueType = "List";
                                    userFunctionReturns[index].opsDone = addOpToList("ListOp", userFunctionReturns[index].opsDone, node.lineno);

                                    if (node.value.func.value._astname === "List") {
                                        var valuesInList = listTypesWithin(node.value.func.value.elts, [], userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);
                                        for (var vil = 0; vil < valuesInList; vil++) {
                                            userFunctionReturns[index].containedValue.push(valuesInList[vil]);
                                        }
                                    }
                                    //binop
                                    if (node.value.func.value._astname === "BinOp") {
                                        var valsInOp = [];
                                        listTypesWithin(node.value.func.value, valsInOp, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);

                                        for (var vio = 0; vio < valsInOp.length; vio++) {
                                            userFunctionReturns[index].containedValue.push(valsInOp[vio]);
                                        }
                                    }
                                    //func call
                                    if (node.value.func.value._astname === "Call" && 'id' in node.value.func.value) {
                                        var calledFunction = getFunctionObject(node.value.func.value.id.v);
                                        if (calledFunction != null) {
                                            copyAttributes(calledFunction, userFunctionReturns[index], ["original", "binOp", "indexAndInput", "nodeElements", "stringElements", "nested"]);


                                            if (calledFunction.containedValue != null) {
                                                appendArray(calledFunction.containedValue, userFunctionReturns[index].containedValue);
                                            }
                                            if (calledFunction.opsDone != null) {
                                                userFunctionReturns[index].opsDone = appendOpList(calledFunction.opsDone, userFunctionReturns[index].opsDone);
                                            }
                                        }
                                    }
                                    //var
                                    if (node.value.func.value._astname === "Name") {
                                        var valueVariable = getVariableObject(node.value.func.value.id.v);

                                        if (valueVariable != null) {
                                            copyAttributes(valueVariable, userFunctionReturns[index], ["indexAndInput", "nested"]);

                                            if (valueVariable.nodeElements.length > 0) {
                                                userFunctionReturns.nodeElements = [valueVariable.nodeElements[0]];
                                                userFunctionReturns.stringElements = [valueVariable.stringElements[0]];
                                            }

                                            appendArray(valueVariable.containedValue, userFunctionReturns[index].containedValue);
                                            appendOpList(valueVariable.opsDone, userFunctionReturns[index].opsDone);
                                        }
                                    }
                                }
                                if (strFuncs.includes(funcName)) {
                                    varVal = "String";
                                    userFunctionReturns[index].opsDone = addOpToList("StrOp", userFunctionReturns[index].opsDone, node.lineno);

                                    if (node.value.func.value._astname === "Name") {
                                        var otherVar = getVariableObject(node.value.func.value.id.v);
                                        if (otherVar != null && (otherVar.containedValue != null && otherVar.containedValue.length > 0)) {
                                            appendArray(otherVar.containedValue, userFunctionReturns[index].containedValue);
                                            userFunctionReturns[index].opsDone = appendOpList(otherVar.opsDone, userFunctionReturns[index].opsDone);
                                        }
                                    }

                                    if (node.value.func.value._astname === "BinOp") {
                                        var valsInOp = [];

                                        listTypesWithin(node.value.func.value, valsInOp, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);

                                        for (var vio = 0; vio < valsInOp.length; vio++) {
                                            userFunctionReturns[index].containedValue.push(valsInOp[vio]);
                                        }
                                    }
                                    if (node.value.func.value._astname === "Call") {
                                        for (var functionNum = 0; functionNum < userFunctionReturns.length; functionNum++) {

                                            if (node.value.func.value.id.v === userFunctionReturns[functionNum].name) {

                                                if (userFunctionReturns[functionNum].containedValue != null && userFunctionReturns[functionNum].containedValue.length > 0) {

                                                    for (var cv = 0; cv < userFunctionReturns[functionNum].containedValue.length; cv++) {
                                                        userFunctionReturns[index].containedValue.push(userFunctionReturns[functionNum].containedValue[cv]);
                                                    }
                                                }

                                                break;
                                            }
                                        }
                                    }
                                }

                                var funcRet = getFunctionObject(arg.id.v);

                                if (funcRet != null && funcRet.returns !== "" && funcRet.returns !== "BinOp") {
                                    foundFunc = true;
                                    userFunctionReturns[index].flagVal = "";
                                    userFunctionReturns[index].funcVar = "";

                                    userFunctionReturns[index].returns = funcRet.returns;

                                    if (funcRet.containedValue != null) {
                                        userFunctionReturns[index].containedValue = funcRet.containedValue;
                                    }
                                    if (funcRet.opsDone != null) {
                                        appendOpList(funcRet.opsDone, userFunctionReturns[index].opsDone);
                                    }
                                }

                                if (!foundFunc) {
                                    userFunctionReturns[index].funcVar = "func";
                                    userFunctionReturns[index].flagVal = arg.func.id.v;
                                }
                            }
                            if (argType === "BinOp") {
                                var contVal = [];
                                userFunctionReturns[index].opsDone = addOpToList("BinOp", userFunctionReturns[index], node.lineno);
                                var binVal = recursivelyAnalyzeBinOp(arg);


                                if (typeof binVal === "string") {
                                    userFunctionReturns[index].returns = binVal;
                                    listTypesWithin(arg, contVal, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);


                                    userFunctionReturns[index].flagVal = "";
                                    userFunctionReturns[index].funcVar = "";
                                }
                                else if (Array.isArray(binVal)) {
                                    userFunctionReturns[index].returns = "List";
                                    listTypesWithin(arg, contVal, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);

                                    userFunctionReturns[index].flagVal = "";
                                    userFunctionReturns[index].funcVar = "";

                                    userFunctionReturns[index].nodeElements = [{
                                        line: arg.lineno,
                                        elts: binVal
                                    }];
                                    userFunctionReturns[index].stringElements = [{
                                        line: arg.lineno,
                                        elts: nodesToStrings(binVal)
                                    }];
                                }

                                else {
                                    userFunctionReturns[index].returns = "BinOp";
                                    userFunctionReturns[index].binOp = binVal;

                                    listTypesWithin(arg, contVal, userFunctionReturns[index].indexAndInput, userFunctionReturns[index].opsDone);
                                }

                                if (contVal.length > 0) {
                                    userFunctionReturns[index].containedValue = contVal;
                                }
                            }
                            if (argType === "List") {
                                userFunctionReturns[index].flagVal = "";
                                userFunctionReturns[index].funcVar = "";

                                userFunctionReturns[index].returns = "List";

                                userFunctionReturns[index].containedValue = listTypesWithin(arg.elts,
                                    userFunctionReturns[index].containedValue,
                                    userFunctionReturns[index].indexAndInput,
                                    userFunctionReturns[index].opsDone);


                                userFunctionReturns[index].nodeElements = [{
                                    line: arg.lineno,
                                    elts: arg.elts
                                }];
                                userFunctionReturns[index].stringElements = [{
                                    line: arg.lineno,
                                    elts: nodesToStrings(arg.elts)
                                }];
                            }
                        }
                    }

                    //deal with modifiesParams and assignedModified for the function and param var, respectively
                    var modifiesParams = [];
                    var funcName = "";
                    if ('id' in node.func) {
                        lineNumber = 0;
                        if (node.lineno != null) {
                            lineNumber = node.lineno;
                            parentLineNumber = lineNumber;
                        }

                        else {
                            lineNumber = parentLineNumber;
                        }
                        var originality = (originalityLines.includes(lineNumber));

                        funcName = node.func.id.v;
                        nodeArgs = node.args;

                        var startLine = 0;
                        var endLine = 0;

                        for (var f = 0; f < userFunctionReturns.length; f++) {
                            if (userFunctionReturns[f].name === funcName && userFunctionReturns[f].paramsChanged != null) {
                                modifiesParams = userFunctionReturns[f].paramsChanged;

                                startLine = userFunctionReturns[f].startLine;
                                endLine = userFunctionReturns[f].endLine;
                                break;
                            }
                        }

                        for (var a = 0; a < nodeArgs.length; a++) {
                            if (modifiesParams.includes(a) && (nodeArgs[a]._astname === "Name" && nodeArgs[a].id.v !== "True" && nodeArgs[a].id.v !== "False")) {
                                modString = studentCode[node.lineno - 1];
                                for (var v = 0; v < allVariables.length; v++) {

                                    if (allVariables[v].name === nodeArgs[a].id.v) {
                                        var lineNo = node.lineno;

                                        for (var h = 0; h < loopLocations.length; h++) {
                                            if (lineNo >= loopLocations[h][0] && lineNo <= loopLocations[h][1]) {
                                                lineNo = loopLocations[h][0];
                                                break;
                                            }
                                        }

                                        allVariables[v].assignedModified.push({
                                            line: lineNo,
                                            value: studentCode[lineNumber].trim(),
                                            original: originality,
                                            nodeValue: node
                                        });
                                        variableAssignments.push({ line: node.lineno, name: allVariables[v].name });
                                        allVariables[v].modifyingFunctions.push([startLine, endLine]);

                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /*gets the most LIKELY value of a variable object's array of elts, based upon the line of reference.
    * @param variableObj - the variable object whose values are desired
    * @param callingLine - the line at which this check is occurring
    * @returns - An array of AST nodes
    */
    function mostRecentElements(variableObj, callingLine) {
        var inFunction = null;
        var correctElts = null;

        //check whether the current line is inside or outside of a function declaration
        for (var u = 0; u < userFunctionReturns.length; u++) {
            if (callingLine >= userFunctionReturns[u].startLine && callingLine <= userFunctionReturns[u].endLine) {
                inFunction = [userFunctionReturns[u].startLine, userFunctionReturns[u].endLine];
                break
            }
        }


        if (inFunction != null) {
            //check inside the function FIRST
            var furthestLine = -1;

            for (var eltsItem = 0; eltsItem < variableObj.nodeElements.length; eltsItem++) {
                if (variableObj.nodeElements[eltsItem].line > inFunction[1] || variableObj.nodeElements[eltsItem].line > callingLine) {
                    break;
                }
                if (variableObj.nodeElements[eltsItem].line >= inFunction[0]) {
                    furthestLine = eltsItem;
                }
            }
            if (furthestLine > -1) {
                return variableObj.nodeElements[furthestLine].elts;
            }
        }

        //if we haven't returned, OR if we're  not in a function, look for the most recent NOT IN FUNCTION elts.
        var finalElts = null;
        for (var eltsItem = 0; eltsItem < variableObj.nodeElements.length; eltsItem++) {
            if (variableObj.nodeElements[eltsItem].line > callingLine) {
                break;
            }

            if (variableObj.nodeElements[eltsItem].line <= callingLine) {
                // is it in a function? this only counts if it's NOT in a function
                var isInFunction = false;

                for (var udfNumber = 0; udfNumber < userFunctionReturns.length; udfNumber++) {
                    if (variableObj.nodeElements[eltsItem].line >= userFunctionReturns[udfNumber].startLine && variableObj.nodeElements[eltsItem].line <= userFunctionReturns[udfNumber].endLine) {
                        isInFunction = true;
                        break;
                    }
                }
                if (!isInFunction) {
                    finalElts = variableObj.nodeElements[eltsItem].elts;
                }
            }
        }

        //return the most likely value
        if (finalElts == null && (variableObj.nodeElements.length > 0)) {
            finalElts = variableObj.nodeElements[0].elts;
        }

        return finalElts;
    }

    /*Recursive function to find out what's in a BinOp AST node.
    * @param node - An AST "BinOp" node
    * @returns a BinOp object (if values are left to be calculated), an array of contained types (if the binOp represents a list), or a string representing the resulting datatype.
    */
    function recursivelyAnalyzeBinOp(node) {

        if (node.left != null && node.left._astname == null) {
            //in case a binop obj gets passed to it
            return recursivelyEvaluateBinOp(node);
        }

        //return getAllBinOpLists
        var leftNode = node.left;
        var rightNode = node.right;
        var leftVal = "";
        var rightVal = "";

        //what kind value is on the left?
        leftNode = retrieveFromList(leftNode);

        if (leftNode != null) {
            if (leftNode._astname === "BinOp") {
                leftVal = recursivelyAnalyzeBinOp(leftNode);
            }

            if (leftNode._astname === "UnaryOp") {
                leftVal = "Bool";
            }
            if (leftNode._astname === "Name") {
                if (leftNode.id.v === "True" || leftNode.id.v === "False") {
                    leftVal = "Bool";
                }

                else {
                    var leftVariable = getVariableObject(leftNode.id.v);

                    if (leftVariable != null && leftVariable.value !== "" && leftVariable.value !== "BinOp") {
                        leftVal = leftVariable.value;
                    }
                    if (leftVal === "List") {
                        leftVal = mostRecentElements(leftVariable, node.lineno);
                    }
                    if (leftVariable != null && leftVariable.value === "BinOp") {
                        leftVal = leftVariable.binOp;
                    }
                    if (leftVal == null || leftVal === "") {
                        leftVal = "var:" + leftNode.id.v;
                    }
                }
            }

            if (leftNode._astname === "Call") {
                leftVal = getCallReturn(leftNode);
                if (leftVal == null && 'id' in leftNode.func) {
                    leftVal = "func:" + leftNode.func.id.v;
                }
            }

            if (leftNode._astname === "List") {
                leftVal = leftNode.elts;
            }
            if (leftNode._astname === "Str") {
                leftVal = "Str";
            }
            if (leftNode._astname === "Num") {
                if (!isNodeFloat(leftNode)) {
                    leftVal = "Int";
                }
                else {
                    leftVal = "Float";
                }
            }

            if (leftNode._astname === "Compare" || leftNode._astname === "BoolOp") {
                leftVal = "Bool";
            }

        }
        else {
            leftVal = node.left;
        }


        //what kind of value is on the irght?
        rightNode = retrieveFromList(rightNode);

        if (rightNode != null) {
            if (rightNode._astname === "BinOp") {
                rightVal = recursivelyAnalyzeBinOp(rightNode);
            }
            if (rightNode._astname === "UnaryOp") {
                rightVal = "Bool";
            }
            if (rightNode._astname === "Name") {
                if (rightNode.id.v === "True" || rightNode.id.v === "False") {
                    rightVal = "Bool";
                }
                else {
                    var rightVariable = getVariableObject(rightNode.id.v);

                    if (rightVariable != null && rightVariable.value !== "" && rightVariable.value !== "BinOp") {
                        rightVal = rightVariable.value;
                    }
                    if (rightVal === "List") {
                        rightVal = mostRecentElements(rightVariable, node.lineno);
                    }
                    if (rightVariable != null && rightVariable.value === "BinOp") {
                        rightVal = rightVariable.binOp;
                    }
                    if (rightVal == null || rightVal === "") {
                        rightVal = "var:" + rightNode.id.v;
                    }
                }
            }


            if (rightNode._astname === "Call") {
                rightVal = getCallReturn(rightNode);

                if (rightVal == null && 'id' in rightNode.func) {
                    rightVal = "func:" + rightNode.func.id.v;
                }
            }
            if (rightNode._astname === "List") {
                rightVal = rightNode.elts;
            }
            if (rightNode._astname === "Str") {
                rightVal = "Str";
            }
            if (rightNode._astname === "Num") {
                if (!isNodeFloat(rightNode)) {
                    rightVal = "Int";
                }
                else {
                    rightVal = "Float";
                }
            }

            if (rightNode._astname === "Compare" || rightNode._astname === "BoolOp") {
                rightVal = "Bool";
            }
        }
        else {
            rightVal = node.right;
        }


        //if types match, return a string
        if (typeof leftVal === "string" && typeof rightVal === "string" && leftVal === rightVal && !leftVal.includes(':')) {
            return leftVal;
        }

        //if both arrays, return array.
        if (Array.isArray(leftVal) && Array.isArray(rightVal)) {
            return (leftVal.concat(rightVal))
        }

        //otherwise return a binop object //if ANYTHING in it is a string, return string
        if (leftVal === "Str" || rightVal === "Str") {
            return "Str";
        }

        return ({ left: leftVal, right: rightVal });
    }

    /* Trims comments and leading/trailing whitespace from lines of Python and JS code.
    * @param stringToTrim - the value to be trimmed
    * @returns the string with comments and leading/trailing whitespace removed.
    */
    function trimCommentsAndWhitespace(stringToTrim) {
        var returnString = stringToTrim;

        //strip out any trailing comments
        if (!isJavascript && returnString.includes('#')) {
            var singleQuotes = 0;
            var doubleQuotes = 0;
            var commentIndex = -1;

            //python uses #

            for (var s in returnString) {
                //we use the number of single and double quotes (odd versus even) to determine whether any # or // is actually part of a string and NOT a comment.
                if (returnString[s] === "'") {
                    singleQuotes++;
                }
                if (returnString[s] === '"') {
                    doubleQuotes++;
                }
                if (returnString[s] === "#") {
                    //we have a #. assuming this is NOT in a string (ie both singleQuotes and doubleQuotes are EVEN NUMBERS this is the index we chop from. save it and break
                    if (doubleQuotes % 2 === 0 && singleQuotes % 2 === 0) {
                        commentIndex = s;
                        break;
                    }
                }
            }
            if (commentIndex != -1) {
                returnString = returnString.substring(0, commentIndex);
            }
        }

        //Javascript uses //
        if (isJavascript) {
            if (returnString.includes('//')) {
                var singleQuotes = 0;
                var doubleQuotes = 0;
                var commentIndex = -1;

                for (var s in returnString) {
                    if (returnString[s] === "'") {
                        singleQuotes++;
                    }
                    if (returnString[s] === '"') {
                        doubleQuotes++;
                    }
                    if (returnString[s] === "/" && s < returnString.length - 1 && returnString[s + 1] === "/") {
                        //we have a double slash. assuming this is NOT in a string (ie both singleQuotes and doubleQuotes are EVEN NUMBERS this is the index we chop from. save it and break
                        if (doubleQuotes % 2 === 0 && singleQuotes % 2 === 0) {
                            commentIndex = s;
                            break;
                        }
                    }
                }
                if (commentIndex != -1) {
                    returnString = returnString.substring(0, commentIndex);
                }
            }
        }


        returnString = returnString.trim();  //then any leading/trailing spaces
        return returnString;
    }

    /* AST nodes do not always easliy distinguish between floats and ints. 
    * Helper function to disambiguate.
    * @param - AST "Num" node
    * @returns True or False
    */
    function isNodeFloat(node) {
        if (node._astname === "Num") {
            var sourceIndex = node.lineno - 1;

            //if we're sure it's a float
            if (!Number.isInteger(node.n.v)) {
                return true;
            }

            else {
                //otherwise, we check for a decimal point in the actual line of code.
                var strVal = String(node.n.v);
                var lineString = studentCode[sourceIndex];
                var valueIndex = node.col_offset;
                var valToTrim = lineString.substring(valueIndex);
                var valueString = "";
                var done = false;

                for (var t = 0; t < valToTrim.length; t++) {
                    if (valToTrim[t] != '.' && valToTrim[t] != '-' && isNaN(parseInt(valToTrim[t]))) {
                        break;
                    }
                    else {
                        valueString += valToTrim[t];
                    }
                }

                if (valueString.includes('.')) {
                    return true;
                }
                else return false;
            }
        }
    }

    /* Do we know the value of all function returns and variables?
    * @returns true or false
    */
    function allReturnsFilled() {
        var allFilled = true; // gets flagged as false if a function return or variable value is not yet known.


        //go through the list of uer-defined functions. if the return value is unknown, flag allFilled to false.
        for (var j = 0; j < userFunctionReturns.length; j++) {
            if (typeof userFunctionReturns[j].returns != 'string' ||
                userFunctionReturns[j].returns === "" ||
                userFunctionReturns[j].returns === "BinOp" ||
                userFunctionReturns[j].returns === "Subscript") {

                allFilled = false;
            }

            if (userFunctionReturns[j].returns === "List" && userFunctionReturns[j].containedValue != null) {
                for (var k = 0; k < userFunctionReturns[j].containedValue.length; k++) {
                    if (userFunctionReturns[j].containedValue[k].includes(':')) {
                        allFilled = false;
                        break;
                    }
                }
            }

            if (allFilled === false) {
                break;
            }
        }

        //do the same thing with allVariables
        for (j = 0; j < allVariables.length; j++) {

            if (typeof allVariables[j].value != 'string' || allVariables[j].value === "" || allVariables[j].value === "BinOp" || allVariables[j].value === "Subscript") {
                allFilled = false;
            }

            if (allVariables[j].value === "List" && allVariables[j].containedValue != null) {
                for (var k = 0; k < allVariables[j].containedValue.length; k++) {
                    if (allVariables[j].containedValue[k].includes(':')) {
                        allFilled = false;
                        break;
                    }
                }

                for (var p in allVariables[j].assignedModified) {
                    if (!Array.isArray(allVariables[j].assignedModified[p].binop) && (typeof allVariables[j].assignedModified[p].binop !== "string")) {
                        allFilled = false;
                    }
                }
            }
            if (allFilled === false) {
                break;
            }
        }

        return allFilled;
    }

    /* Helper function for apiCalls accessory output.
    * Gathers the values of all arguments in a function call.
    * @param argArray - an array of AST nodes representing arguments or list elements
    * @returns - Array of values, datatypes, and variable names, dependent on what information is available.
    */
    function getArgValuesFromArray(argArray, lineno) {

        var returnArray = [];

        for (var i in argArray) {
            var argument = retrieveFromList(argArray[i]);
            var argumentObject = "";

            if (argument != null) {
                //first, attempt to get the actual value.
                if (argument._astname === "Name") {
                    if (getVariableObject(argument.id.v) != null) {
                        argument = getMostRecentValue(getVariableObject(argument.id.v), lineno);
                    }
                    else {
                        argumentObject = argument.id.v;
                    }
                }

                if (argument != null) {
                    if (argument._astname === "Num") {
                        argumentObject = argument.n.v;
                    }
                    else if (argument._astname === "Str") {
                        argumentObject = argument.s.v;
                    }
                    else if (argument._astname === "List") {
                        argumentObject = getArgValuesFromArray(argumentObject.elts, lineno);
                    }
                }

                //if impossible, fall back to datatype, or leave empty
                if (argumentObject === "") {
                    argumentObject = getTypeFromNode(argument);
                }

                returnArray.push(argumentObject);
            }
        }

        return returnArray;

    }

    function analyzeFunctionCall(node, results, loopParent, opsUsed, purposeVars, lineNumber) {
        if (node._astname !== "Call") {
            //This is a function for "Call" nodes. If something else gets passed accidentally, return.
            return;
        }

        var originality = false;
        originality = (originalityLines.includes(lineNumber));

        //add to apiFunctionCalls
        var functionNameNode = retrieveFromList(node.func);
        if (functionNameNode != null && functionNameNode._astname == "Name") {
            //add to api function calls
            var callObject = {};
            callObject.line = node.lineno;
            callObject.function = functionNameNode.id.v;
            callObject.args = [];

            if (node.args != null) {
                callObject.args = getArgValuesFromArray(node.args, node.lineno);
            }

            allCalls.push(callObject);


            if (apiFunctions.includes(functionNameNode.id.v)) {

                apiCalls.push(callObject);

            }
        }
        else if (functionNameNode != null && 'attr' in functionNameNode) {
            var callObject = {};
            callObject.line = node.lineno;
            callObject.function = functionNameNode.attr.v;
            callObject.args = [];

            if (node.args != null) {
                callObject.args = getArgValuesFromArray([functionNameNode.value], node.lineno);
            }

            allCalls.push(callObject);
        }

        //if it's a function that's been renamed, we count this as variables being 3
        if (originality) {
            //go through function renames
            //the varname is the first one
            for (var i in userFunctionRenames) {
                if (userFunctionRenames[i][0] === functionNameNode.id.v && results.variables < 3) {
                    results.variables = 3;
                }
            }
        }


        //if it's a function CALL there's an extra thing we note, and that's that the function is actually used once it's defined.

        var functionParametersIndex = -1;
        var foundFunc = false;
        var funcName = "";

        //get function name
        if ('id' in node.func) {
            funcName = node.func.id.v;
        }
        else if ('attr' in node.func) {
            funcName = node.func.attr.v;
        }
        else if (node.func._astname === "Subscript") {
            var nameNode = retrieveFromList(node.func);

            if (nameNode._astname === "Name") {
                funcName = nameNode.id.v;
                if (originality || getFunctionObject(funcName).original) {
                    results.lists = 4;
                }
            }
        }
        else if (retrieveFromList(node.func) != node.func) {
            var nameNode = retrieveFromList(node.func);

            if (nameNode._astname === "Name") {
                funcName = nameNode.id.v;
                if (originality || getFunctionObject(funcName).original) {
                    results.lists = 4;
                }
            }
        }
        for (var f = 0; f < userFunctionParameters.length; f++) {
            if (userFunctionParameters[f].name === funcName) {
                foundFunc = true;
                functionParametersIndex = f;
                break;
            }
        }


        //using a list as a makeBeat() parameter counts as indexing it for a purpose.
        if ((funcName === "makeBeat" || makeBeatRenames.includes(funcName)) && results.lists < 4 && node.args.length > 0) {

            //see if the arg is a list
            //get the first argument
            var firstArg = node.args[0];
            var mbList = false;
            var listOrig = false;


            //if it's a subscript or pop it DOESN'T MATTER cause that'll get marked anyway, so we can ignore.
            if (firstArg._astname === "List") {
                mbList = true;
            }
            if (firstArg._astname === "BinOp") {
                if (Array.isArray(recursivelyAnalyzeBinOp(firstArg))) {
                    mbList = true;
                }
                var nestedItems = [];
                getNestedVariables(firstArg, nestedItems);

                for (var f = 0; f < nestedItems.length; f++) {
                    if (nestedItems[f].original) {
                        listOrig = true;
                        break;
                    }
                }
            }
            if (firstArg._astname === "Call") {
                if (doesCallCreateList(firstArg)) {
                    mbList = true;
                }
                else if ('id' in firstArg.func) {
                    //else, is it a UDF/api func that returns a list?
                    var calledFunc = getFunctionObject(firstArg.func.id.v);

                    if (calledFunc != null && calledFunc.returns === "List") {
                        mbList = true;
                    }
                    if (calledFunc.original) {
                        listOrig = true;
                    }
                }
            }
            if (firstArg._astname === "Name") {
                //find the variable
                if ('id' in firstArg) {
                    var argVar = getVariableObject(firstArg.id.v);

                    if (argVar != null && argVar.value === "List") {
                        mbList = true;
                        listOrig = argVar.original;
                    }
                }
            }
            if (mbList && (listOrig || originality)) {
                results.lists = 4;
            }
        }


        //let's check the args
        //using something as an argument counts as using "for a purpose," so this gets updated in the results.
        var floats = false;
        var ints = false;
        var strings = false;
        var bools = false;
        var lists = false;
        var nodeArgs = [];
        var funcName = "";
        var functionOriginality = false;

        if ('args' in node) {
            nodeArgs = node.args;
        }

        var funcNode = node.func;
        funcNode = retrieveFromList(funcNode);

        //get the function's name and arguments
        if ('id' in node.func) {
            funcName = node.func.id.v;
            nodeArgs = node.args;
        }
        else if ('attr' in node.func) {
            funcName = node.func.attr.v;
            if (node.func.value._astname === "Name") {
                nodeArgs = [node.func.value];
            }
            else if (node.func.value._astname === "List") {
                nodeArgs = node.func.value.elts;
            }
            else if (node.func.value._astname === "Str") {
                nodeArgs = [node.func.value];
            }

            if (node.args != null) {
                for (var i in node.args) {
                    nodeArgs.push(node.args[i]);
                }
            }
        }



        var thisFuncReturnObj = getFunctionObject(funcName);
        if (thisFuncReturnObj != null && thisFuncReturnObj.original != null && thisFuncReturnObj.original === true) {
            functionOriginality = true;
        }

        //update contained values as well
        if (functionOriginality && thisFuncReturnObj.opsDone != null) {
            for (var i in thisFuncReturnObj.opsDone) {
                opsUsed.push(thisFuncReturnObj.opsDone[i].op);
            }
            for (var i in thisFuncReturnObj.containedValue) {
                if (thisFuncReturnObj.containedValue[i] === "Str") {
                    strings = true;
                }
                if (thisFuncReturnObj.containedValue[i] === "Bool") {
                    bools = true;
                }
                if (thisFuncReturnObj.containedValue[i] === "Int") {
                    ints = true;
                }
                if (thisFuncReturnObj.containedValue[i] === "List") {
                    lists = true;
                }
                if (thisFuncReturnObj.containedValue[i] === "Float") {
                    floats = true;
                }
            }

        }
        //if anything reaches a new level, update the results.
        if (originality || functionOriginality) {
            if (floats) {
                results.floats = 3;
            }
            if (ints) {
                results.ints = 3;
            }
            if (strings && results.strings < 3) {
                results.strings = 3;
            }
            if (bools) {
                results.booleans = 3;
            }
            if (lists && (results.lists < 3)) {
                results.lists = 3;
            }
        }


        //check for various datatypes in the arguments of the call
        for (var a = 0; a < nodeArgs.length; a++) {

            var floats = false;
            var ints = false;
            var strings = false;
            var bools = false;
            var lists = false;

            var singleArg = nodeArgs[a];




            //extract values from UnaryOp and Subscript nodes
            if (singleArg._astname === "UnaryOp") {
                var anyOr = originality;
                if (!originality) {
                    var unaryNames = [];
                    getNestedVariables(singleArg, unaryNames);

                    for (var p in unaryNames) {
                        var isVar = getVariableObject(unaryNames[p]);
                        if (isVar != null && isVar.original) {
                            anyOr = true;
                            break;
                        }
                    }
                }
                if (anyOr) {
                    results.booleans = 3;
                }
                singleArg = singleArg.operand;
            }
            if (retrieveFromList(singleArg) != singleArg) {
                var varsIn = [];
                getNestedVariables(singleArg, varsIn);
                var anyOriginality = originality;

                if (!anyOriginality) {
                    for (var varIn = 0; varIn < varsIn.length; varIn++) {
                        if (getVariableObject(varsIn[varIn]) != null && getVariableObject(varsIn[varIn]).original) {
                            anyOriginality = true;
                            break;
                        }
                    }
                }

                if (varsIn.length > 0 && anyOriginality) {
                    purposeVars = true;
                }

            }
            if (singleArg != null && singleArg._astname === "Subscript") {

                if (originality) {
                    if (getStringIndexingInNode(singleArg)[0]) {
                        results.strings = 4;
                    }
                    if (getIndexingInNode(singleArg)[0]) {
                        results.lists = 4;
                    }
                }

                var varsIn = [];
                getNestedVariables(singleArg, varsIn);

                var anyOriginality = originality;
                if (!anyOriginality) {
                    for (var varIn = 0; varIn < varsIn.length; varIn++) {
                        if (getVariableObject(varsIn[varIn]) != null && getVariableObject(varsIn[varIn]).original) {
                            anyOriginality = true;
                            break;
                        }
                    }
                }

                if (varsIn.length > 0 && anyOriginality) {
                    purposeVars = true;
                }

            }

            singleArg = retrieveFromList(singleArg);


            //then - what type of argument is it?
            if (singleArg != null) {
                if (singleArg._astname === "UnaryOp") {

                    var anyOr = originality;
                    if (!originality) {
                        var unaryNames = [];
                        getNestedVariables(singleArg, unaryNames);
                        for (var p in unaryNames) {
                            var isVar = getVariableObject(unaryNames[p]);
                            if (isVar != null && isVar.original) {
                                anyOr = true;
                                break;
                            }
                        }
                    }

                    if (anyOr) {
                        results.booleans = 3;
                    }
                    singleArg = singleArg.operand;
                }

                //special handling for function expressions
                if (singleArg._astname === "FunctionExp") {
                    var nameString = "";
                    var funcExpOriginality = false;
                    nameString += singleArg.lineno + "|" + singleArg.col_offset;

                    for (var i in userFunctionParameters) {
                        if (userFunctionParameters[i].name === nameString) {
                            if (userFunctionParameters[i].params.length > 0) {
                                takesArgs = true;
                            }
                            break;
                        }
                    }

                    if (getFunctionObject(nameString) != null && getFunctionObject(nameString).returns != null && getFunctionObject(nameString).returns !== "") {
                        returns = true;
                    }

                    if (getFunctionObject(nameString).originality != null && getFunctionObject(nameString).originality === true) {
                        funcExpOriginality = true;
                    }

                    if ((originality || funcExpOriginality) && Number.isInteger(results.userFunc) && results.userFunc < 3) {
                        results.userFunc = 3;
                    }
                    if (takesArgs && !returns && results.userFunc === 3) {
                        results.userFunc = "Args";
                    }
                    else if (!takesArgs && returns && (results.userFunc === 3)) {
                        results.userFunc = "Returns";
                    }
                    else if ((!takesArgs && returns && results.userFunc === "Args") || ((takesArgs && !returns && results.userFunc === "Returns"))) {
                        results.userFunc = "ReturnAndArgs"
                    }
                    else if (takesArgs && returns && (results.userFunc === 3 || results.userFunc === "Args" || results.userFunc === "Returns")) {
                        results.userFunc = "ReturnAndArgs";
                    }


                    if (functionParametersIndex > -1) {
                        //if a matches an index, make a fake node and recursively analyze

                        for (var paramFunc in userFunctionParameters[functionParametersIndex].paramFuncsCalled) {
                            if (userFunctionParameters[functionParametersIndex].paramFuncsCalled[paramFunc].index === a) {
                                //make a fake node
                                var fakeNode = Object.assign({}, userFunctionParameters[functionParametersIndex].paramFuncsCalled[paramFunc].node);

                                if (singleArg._astname === "Name") {
                                    fakeNode.func = Object.assign({}, singleArg);
                                    fakeNode.func._astname = "Name";
                                    fakeNode._astname = "Call";
                                    analyzeFunctionCall(fakeNode, results, loopParent, opsUsed, purposeVars, lineNumber);
                                }

                                break;
                            }
                        }
                    }
                }

                //if the argument is a call to another function, look up what it contains/returns
                if (singleArg._astname === "Call") {
                    var lineNumberToUse = node.lineno;
                    if (doesCallCreateList(node) || doesCallCreateString(node)) {
                        lineNumberToUse = node.lineno - 1;
                    }


                    //get the name and arguments
                    var funcName = "";
                    var argFunc = singleArg.func;
                    argFunc = retrieveFromList(argFunc);

                    if ('id' in argFunc) {
                        funcName = argFunc.id.v;
                    }
                    else if ('attr' in argFunc) {
                        funcName = argFunc.attr.v;
                    }
                    if (listFuncs.includes(funcName)) {
                        lists = true;
                        if (!opsUsed.includes("ListOp")) {
                            opsUsed.push("ListOp");
                        }
                    }
                    if (strFuncs.includes(funcName)) {
                        strings = true;
                        if (!opsUsed.includes("StrOp")) {
                            opsUsed.push("StrOp");
                        }
                    }
                    if (funcName === "readInput") {
                        results.consoleInput = 3;
                    }


                    //get returns values
                    var funcReturn = "";
                    var returnContains = [];
                    var funcItem = getFunctionObject(funcName);

                    if (funcItem != null) {
                        funcReturn = funcItem.returns;

                        if (funcItem.containedValue != null) {
                            returnContains = funcItem.containedValue;
                        }
                        if (funcItem.nested) {
                            purposeVars = true;
                        }
                        if (funcItem.indexAndInput != null && funcItem.indexAndInput.indexed) {
                            results.lists = 4;
                        }
                        if (funcItem.indexAndInput != null && funcItem.indexAndInput.strIndexed) {
                            results.strings = 4;
                        }
                        if (funcItem.opsDone != null) {
                            var opsUsedList = opsBeforeLine(funcItem.opsDone, lineNumberToUse, "func", funcItem);
                            appendArray(opsUsedList, opsUsed);
                        }
                    }


                    //update results object accordingly
                    if (funcReturn === "Str" && results.strings < 3) {
                        results.strings = 3;
                    }
                    if (funcReturn === "Int") {
                        ints = true;
                    }
                    if (funcReturn === "Float") {
                        floats = true;
                    }
                    if (funcReturn === "Bool") {
                        bools = true;
                    }
                    if (funcReturn === "List" && (results.lists < 3)) {
                        lists = true;
                    }

                    if (returnContains != null) {
                        for (var ret = 0; ret < returnContains.length; ret++) {
                            var funcReturnCont = returnContains[ret];

                            if (funcReturnCont === "Str" && results.strings < 3) {
                                strings = true;
                            }
                            if (funcReturnCont === "Int") {
                                ints = true;
                            }
                            if (funcReturnCont === "Float") {
                                floats = true;
                            }
                            if (funcReturnCont === "Bool") {
                                bools = true;
                            }
                            if (funcReturnCont === "List" && (results.lists < 3)) {
                                lists = true;
                            }
                        }
                    }
                }
                    //basic datatypes: str, bool, int, float
                else if (singleArg._astname === 'Str') {
                    strings = true;
                }
                else if (singleArg._astname === 'Name' && singleArg.id.v != null && (singleArg.id.v === 'True' || singleArg.id.v === 'False')) {
                    bools = true;
                }
                else if (singleArg._astname === 'Num') {
                    if (!isNodeFloat(singleArg)) {
                        ints = true;
                    }
                    else {
                        floats = true;
                    }
                }

                    //if it's a list, we also look at and note all the types in the list as being used for a purpose.
                else if (singleArg._astname === 'List') {

                    lists = true;

                    var listInputIndexing = {
                        input: false,
                        indexed: false,
                        strIndexed: false
                    };
                    var listValues = [];


                    if (originality) {
                        var operations = [];
                        listValues = listTypesWithin(singleArg.elts, listValues, listInputIndexing, operations);
                        appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);

                        if (listInputIndexing.indexed) {
                            results.lists = 4;
                        }
                        if (listInputIndexing.strIndexed) {
                            results.strings = 4;
                        }
                    }
                    else {
                        listValues = listTypesWithin(singleArg.elts, listValues, { input: false, indexed: false, strIndexed: false }, []);
                    }


                    if (listValues.includes("Str")) {
                        strings = true;
                    }
                    if (listValues.includes("Bool")) {
                        bools = true;
                    }
                    if (listValues.includes("Int")) {
                        ints = true;
                    }
                    if (listValues.includes("Float")) {
                        floats = true;
                    }


                    if (listInputIndexing.input && originality) {
                        results.consoleInput = 3;
                    }

                    var varsIn = [];
                    getNestedVariables(singleArg, varsIn);

                    var anyOriginality = originality;
                    if (!anyOriginality) {
                        for (var varIn = 0; varIn < varsIn.length; varIn++) {
                            if (getVariableObject(varsIn[varIn]) != null && getVariableObject(varsIn[varIn]).original) {
                                anyOriginality = true;
                                break;
                            }
                        }
                    }

                    if (varsIn.length > 0 && anyOriginality) {
                        purposeVars = true;
                    }
                }

                    //if it's a variable, we mark its value/contained values
                else if (singleArg._astname === 'Name' && singleArg.id.v !== "True" && singleArg.id.v !== "False") {

                    var lineNumberToUse = node.lineno;
                    if (doesCallCreateList(node) || doesCallCreateString(node)) {
                        lineNumberToUse = node.lineno - 1;
                    }
                    var otherVar = getVariableObject(singleArg.id.v);

                    if (otherVar != null) {
                        purposeVars = true;
                        var originalAssignment = otherVar.original;
                        if ((originalAssignment || originality) && otherVar.indexAndInput.indexed) {
                            results.lists = 4;
                        }
                        if ((originalAssignment || originality) && otherVar.indexAndInput.strIndexed) {
                            results.strings = 4;
                        }
                        if ((originalAssignment || originality) && otherVar.opsDone != null) {
                            var opsUsedInVar = opsBeforeLine(otherVar.opsDone, lineNumberToUse, "var", otherVar);
                            appendArray(opsUsedInVar, opsUsed);
                        }

                        if (otherVar.containedValue != null) {
                            if (otherVar.containedValue.includes("Str")) {
                                strings = true;
                            }
                            if (otherVar.containedValue.includes("Bool")) {
                                bools = true;
                            }
                            if (otherVar.containedValue.includes("Int")) {
                                ints = true;
                            }
                            if (otherVar.containedValue.includes("Float")) {
                                floats = true;
                            }
                            if (otherVar.containedValue.includes("List")) {
                                lists = true;
                            }
                        }

                        switch (otherVar.value) {
                            case "Str":
                                strings = true;
                                break;
                            case "Bool":
                                bools = true;
                                break;
                            case "Int":
                                ints = true;
                                break;
                            case "Float":
                                floats = true;
                                break;
                            case "List":
                                lists = true;
                                break;
                        }
                    }


                    //check to see if this is a variable whose value has been changed at least once before this call

                    var argModded = false;
                    var modOriginality = false;
                    var modString = "";
                    var insideOutside = "outside"; //this will get set to "inside" if this call is within another function
                    var insideLines = [-1, -1];
                    var assignOriginality = false;
                    var varType = "";
                    var varInput = false;

                    var otherVar = getVariableObject(singleArg.id.v);
                    if (otherVar != null) {
                        var numberOfMods = 0;


                        //check if the variable's value has been changed at least once after it was declared

                        //ops done
                        if (otherVar.opsDone != null && (otherVar.original || originality)) {
                            var otherVarOps = opsBeforeLine(otherVar.opsDone, node.lineno, "var", otherVar);
                            appendArray(otherVarOps, opsUsed);
                        }

                        //is the use inside or outside a function?
                        for (var n = 0; n < otherVar.modifyingFunctions.length; n++) {
                            if (node.lineno >= otherVar.modifyingFunctions[n][0] && node.lineno <= otherVar.modifyingFunctions[n][1]) {
                                insideOutside = "inside";
                                insideLines = otherVar.modifyingFunctions[n];
                                break;
                            }
                        }

                        if (insideOutside === "outside") {
                            insideLines = [];
                            for (var n = 0; n < otherVar.modifyingFunctions.length; n++) {
                                for (var line = otherVar.modifyingFunctions[n][0]; line <= otherVar.modifyingFunctions[n][1]; line++) {
                                    insideLines.push(line);
                                }
                            }
                        }
                        for (var z = 0; z < otherVar.assignedModified.length; z++) {
                            if (otherVar.assignedModified[z].line > node.lineno) {
                                //stop loop before we get to the current line OR if both things we're looking for are already set to true.
                                break;
                            }

                            //is there a modification? is it original? is it inside/outside the function as appropriate?
                            if (otherVar.assignedModified[z].line <= node.lineno) {
                                if ((insideOutside === "inside" && node.lineno >= insideLines[0] && node.lineno <= insideLines[1]) || (insideOutside === "outside" && !insideLines.includes(node.lineno))) {
                                    argModded = true;
                                    numberOfMods += 1;

                                    if (otherVar.assignedModified[z].original) {
                                        modOriginality = true;
                                    }
                                }
                            }
                        }


                        varType = otherVar.value;
                        varInput = otherVar.indexAndInput.input;


                        //update results object
                        if (argModded && (originality || modOriginality) && ((insideOutside === "outside" && numberOfMods > 1) || (insideOutside === "inside" && numberOfMods > 0))) {
                            results.variables = 4;
                        }

                        if (otherVar.original || originality) {
                            if (varInput && results.consoleInput < 3) {
                                results.consoleInput = 3;
                            }
                            if (results.variables < 3) {
                                results.variables = 3;
                            }
                            if (varType === "List" && results.lists < 3) {
                                results.lists = 3;
                            }
                            if (varType === "Bool" && (results.bools === "Does Not Use" || results.bools === 1 || results.bools === 2)) {
                                results.bools = 3;
                            }
                            if (varType === "Str" && results.strings < 3) {
                                results.strings = 3;
                            }
                            if (varType === "Int") {
                                results.ints = 3;
                            }
                            if (varType === "Float") {
                                results.floats = 3;
                            }
                        }
                    }


                    //update results
                    if (originality || assignOriginality || functionOriginality) {
                        if (floats) {
                            results.floats = 3;
                        }
                        if (ints) {
                            results.ints = 3;
                        }
                        if (strings && results.strings < 3) {
                            results.strings = 3;
                        }
                        if (bools) {
                            results.booleans = 3;
                        }
                        if (lists && (results.lists < 3)) {
                            results.lists = 3;
                        }
                        if (purposeVars && (results.variables < 3)) {
                            results.variables = 3;
                        }
                    }
                }

                else if ((singleArg._astname === "BinOp" || singleArg._astname === "BoolOp" || singleArg._astname === "Compare" || singleArg._astname === "List")) {
                    if (getIndexingInNode(singleArg)[0] && (originality || getIndexingInNode(singleArg)[1])) {
                        results.lists = 4;
                    }
                    if (getStringIndexingInNode(singleArg)[0] && (originality || getStringIndexingInNode(singleArg)[1])) {
                        results.strings = 4;
                    }
                }

                //for binops, boolops, comparisons, we check what types are inside

                if (singleArg._astname === "BinOp") {
                    //Anything in a binOp counts as used for a purpose (e.g. " 'potato' + ' tomato' " passed as an arg counts for strings used for a purpose.
                    var withinBinOp = [];
                    var binOpComponentOriginality = false;
                    var containedInOp = [];
                    getNestedVariables(singleArg, containedInOp);

                    for (var u = 0; u < containedInOp.length; u++) {
                        if (getVariableObject(containedInOp[u]) != null && getVariableObject(containedInOp[u]).original) {
                            binOpComponentOriginality = true;
                            break;
                        }
                    }

                    if (originality || binOpComponentOriginality) {
                        if (Array.isArray(recursivelyAnalyzeBinOp(singleArg)) && results.listOps < 3) {
                            results.listOps = 3;
                        }
                        if (recursivelyAnalyzeBinOp(singleArg) === "Str" && results.strOps < 3) {
                            results.strOps = 3;
                        }
                    }

                    if (!originality) {
                        listTypesWithin(singleArg, withinBinOp, { input: false, indexed: false, strIndexed: false }, []);
                    }

                    else {
                        var inputIndexPurpose = {
                            input: false,
                            indexed: false,
                            strIndexed: false
                        };
                        var operations = [];

                        listTypesWithin(singleArg, withinBinOp, inputIndexPurpose, operations);
                        appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);

                        if (inputIndexPurpose.input) {
                            results.consoleInput = 3;
                        }
                        if (inputIndexPurpose.indexed) {
                            results.lists = 4;
                        }
                        if (inputIndexPurpose.strIndexed) {
                            results.strings = 4;
                        }
                    }

                    if (originality && !opsUsed.includes("BinOp")) {
                        opsUsed.push("BinOp");
                    }
                    for (var p = 0; p < withinBinOp.length; p++) {
                        if (Array.isArray(withinBinOp[p])) { //if the binop includes a list, go through THAT.
                            lists = true;
                            if (withinBinOp[p].includes("Str")) {
                                strings = true;
                            }
                            if (withinBinOp[p].includes("Bool")) {
                                bools = true;
                            }
                            if (withinBinOp[p].includes("Int")) {
                                ints = true;
                            }
                            if (withinBinOp[p].includes("Float")) {
                                floats = true;
                            }
                        }
                        else {
                            switch (withinBinOp[p]) { //otherwise we just see what the item is.
                                case "Str":
                                    strings = true;
                                    break;
                                case "Bool":
                                    bools = true;
                                    break;
                                case "Int":
                                    ints = true;
                                    break;
                                case "Float":
                                    floats = true;
                                    break;
                            }
                        }
                    }
                }

                    //if it's a bool op, we need all the values in that
                else if (singleArg._astname === "BoolOp") {
                    var boolOpValues = [];
                    if (originality && !opsUsed.includes("BoolOp")) {
                        opsUsed.push("BoolOp");
                    }

                    if (!originality) {
                        listTypesWithin(singleArg, boolOpValues, {
                            input: false,
                            indexed: false,
                            strIndexed: false
                        }, []);
                    }

                    else {
                        var inputForPurposeInArg = {
                            input: false,
                            indexed: false,
                            strIndexed: false
                        };

                        var operations = [];
                        listTypesWithin(singleArg, boolOpValues, inputForPurposeInArg, operations);
                        appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);
                        if (inputForPurposeInArg.input) {
                            results.consoleInput = 3;
                        }
                        if (inputForPurposeInArg.indexed) {
                            results.lists = 4;
                        }
                        if (inputForPurposeInArg.strIndexed) {
                            results.strings = 4;
                        }
                    }
                    for (var b = 0; b < boolOpValues.length; b++) {
                        if (boolOpValues[b] === "Str") {
                            strings = true;
                        }
                        if (boolOpValues[b] === "Int") {
                            ints = true;
                        }
                        if (boolOpValues[b] === "Float") {
                            floats = true;
                        }
                        if (boolOpValues[b] === "Bool") {
                            bools = true;
                        }
                        if (boolOpValues[b] === "List") {
                            lists = true;
                        }
                    }
                }

                    //same for comparison statemenrs
                else if (singleArg._astname === "Compare") {
                    var compareValues = [];
                    var indexInputItem = {
                        input: false,
                        indexed: false,
                        strIndexed: false
                    };


                    if (!opsUsed.includes("Compare")) {
                        opsUsed.push("Compare");
                    }

                    if (!originality) {
                        listTypesWithin(singleArg, compareValues, { input: false, indexed: false, strIndexed: false }, []);
                    }

                    else {

                        var compareInd = false;
                        var compareStrInd = false;
                        var operations = [];

                        listTypesWithin(singleArg, compareValues, indexInputItem, operations);
                        appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);

                        if (indexInputItem.indexed) {
                            results.lists = 4;
                        }
                        if (indexInputItem.strIndexed) {
                            results.strings = 4;
                        }
                    }

                    if (indexInputItem.input) {
                        results.consoleInput = 3;
                    }

                    //update datatype usage bools
                    for (var b = 0; b < compareValues.length; b++) {
                        if (compareValues[b] === "Str") {
                            strings = true;
                        }
                        if (compareValues[b] === "Int") {
                            ints = true;
                        }
                        if (compareValues[b] === "Float") {
                            floats = true;
                        }
                        if (compareValues[b] === "Bool") {
                            bools = true;
                        }
                        if (compareValues[b] === "List") {
                            lists = true;
                        }
                    }
                }

                //is it something else that can CONTAIN a variable value? We need to check this for setting results.variables to 3
                if (singleArg._astname === "List" || singleArg._astname === "BinOp" || singleArg._astname === "BoolOp" || singleArg._astname === "Compare") {
                    if (singleArg._astname === "Compare" && originality) { results.comparisons = 3; }
                    var modOriginality = false;
                    var allNamesWithin = [];
                    getNestedVariables(singleArg, allNamesWithin);
                    //if ANY of these is marked as original, assignment counts as original
                    var originalAssign = false
                    for (var n = 0; n < allNamesWithin.length; n++) {
                        var otherVariable = getVariableObject(allNamesWithin[n]);
                        if (otherVariable != null) {
                            var argModded = false;
                            var containedVal = otherVariable.value;
                            var insideOutside = "outside"; //this will get set to "inside" if this call is within another function
                            var insideLines = [-1, -1];

                            //is the use inside or outside a function?
                            for (var f = 0; f < otherVariable.modifyingFunctions.length; f++) {
                                if (node.lineno >= otherVariable.modifyingFunctions[f][0] && node.lineno <= otherVariable.modifyingFunctions[f][1]) {
                                    insideOutside = "inside";
                                    insideLines = otherVariable.modifyingFunctions[f];
                                    break;
                                }
                            }
                            if (insideOutside === "outside") {
                                insideLines = [];
                                for (var f = 0; f < otherVariable.modifyingFunctions.length; f++) {
                                    for (var line = otherVariable.modifyingFunctions[f][0]; line <= otherVariable.modifyingFunctions[f][1]; line++) {
                                        insideLines.push(line);
                                    }
                                }
                            }
                            var numberOfMods = 0;
                            for (var z = 0; z < otherVariable.assignedModified.length; z++) {
                                if (otherVariable.assignedModified[z].line > node.lineno) { break; }//stop loop before we get to the current line OR if both thigns we're looking for are already set to true.
                                //is there a modification? is it original?
                                if ((insideOutside === "inside" && node.lineno >= insideLines[0] && node.lineno <= insideLines[1]) || (insideOutside === "outside" && !insideLines.includes(node.lineno))) {
                                    argModded = true;
                                    numberOfMods += 1;
                                    if (otherVariable.assignedModified[z].original) { modOriginality = true; }
                                }
                            }


                            //update results object
                            if (argModded && (originality || modOriginality) && ((insideOutside === "outside" && numberOfMods > 1) || (insideOutside === "inside" && numberOfMods > 0))) {
                                results.variables = 4;
                            }
                            if (otherVariable.original || originality) {
                                if (containedVal === "List" && results.lists < 3) {
                                    results.lists = 3;
                                }
                                if (containedVal === "Bool" && (results.bools < 3)) {
                                    results.bools = 3;
                                }
                                if (containedVal === "Str" && results.strings < 3) {
                                    results.strings = 3;
                                }
                                if (containedVal === "Int") {
                                    results.ints = 3;
                                }
                                if (containedVal === "Float") {
                                    results.floats = 3;
                                }
                                if (otherVariable.indexAndInput.input) {
                                    results.consoleInput = 3;
                                }
                            }
                        }
                    }

                    if (allNamesWithin.length > 0 && (originalAssign || originality) && (results.variables < 3)) {
                        results.variables = 3;
                    }
                }


                //if anything reaches a new level, update the results.
                if (originality || functionOriginality) {
                    if (floats) {
                        results.floats = 3;
                    }
                    if (ints) {
                        results.ints = 3;
                    }
                    if (strings && results.strings < 3) {
                        results.strings = 3;
                    }
                    if (bools) {
                        results.booleans = 3;
                    }
                    if (lists && (results.lists < 3)) {
                        results.lists = 3;
                    }
                    if (purposeVars && (results.variables < 3)) {
                        results.variables = 3;
                    }
                }
            }
        }


        //if the function or its call is original, update in results
        if ((originality || (getFunctionObject(funcName) != null && getFunctionObject(funcName).original != null && getFunctionObject(funcName).original))) {
            if (Number.isInteger(results.userFunc) && results.userFunc < 3 && foundFunc) { results.userFunc = 3; }
            var funcFound = getFunctionObject(funcName);
            if (funcFound == null) {
                //is it in ForLoopFuncs instead???
                var fLF = null;
                for (var f in forLoopFuncs) {
                    if (forLoopFuncs[f].callName === funcName) {
                        fLF = forLoopFuncs[f];
                        break;
                    }
                }
                if (fLF != null) {
                    //handle variable originality too
                    var forLoopOrig = false;
                    if (!originality && originalityLines.includes(fLF.startLine)) {
                        //this is done only if the call isn't original, for efficiency's sake
                        forLoopOrig = true;
                    }

                    if (originality || forLoopOrig) {
                        results.variables = 4;
                    }

                    for (var otherName in fLF.functionNames) {
                        var otherFunc = getFunctionObject(fLF.functionNames[otherName]);
                        var paramFuncIndex = -1;


                        if (otherFunc != null) {
                            if (Number.isInteger(results.userFunc) && results.userFunc < 3) {
                                results.userFunc = 3;
                            }
                            for (var f = 0; f < userFunctionParameters.length; f++) {
                                if (userFunctionParameters[f].name === fLF.functionNames[otherName]) {
                                    paramFuncIndex = f;
                                    break;
                                }
                            }
                            if (otherFunc != null && otherFunc.returns !== "" && otherFunc.returns != null) {
                                returns = true;
                            }
                            if (otherFunc.indexAndInput != null) {
                                if (otherFunc.indexAndInput.indexed) {
                                    results.lists = 4;
                                }
                                if (otherFunc.indexAndInput.strIndexed) {
                                    results.strings = 4;
                                }
                                if (otherFunc.indexAndInput.input) {
                                    results.consoleInput = 3;
                                }
                            }
                            if (userFunctionParameters[paramFuncIndex].params.length > 0) {
                                takesArgs = true;
                            }
                        }
                    }
                }
            }

                //update results
            else if (foundFunc) {
                if (funcFound != null && funcFound.returns !== "" && funcFound.returns != null) {
                    returns = true;
                }
                if (funcFound.indexAndInput != null) {
                    if (funcFound.indexAndInput.indexed) {
                        results.lists = 4;
                    }
                    if (funcFound.indexAndInput.strIndexed) {
                        results.strings = 4;
                    }
                    if (funcFound.indexAndInput.input) {
                        results.consoleInput = 3;
                    }
                }
                if (functionParametersIndex != -1 && userFunctionParameters[functionParametersIndex].params.length > 0) {
                    takesArgs = true;
                }
            }

            if (takesArgs && !returns && results.userFunc === 3) {
                results.userFunc = "Args";
            }
            else if (!takesArgs && returns && (results.userFunc === 3)) {
                results.userFunc = "Returns";
            }
            else if ((!takesArgs && returns && results.userFunc === "Args") || ((takesArgs && !returns && results.userFunc === "Returns"))) {
                results.userFunc = "ReturnAndArgs"
            }
            else if (takesArgs && returns && (results.userFunc === 3 || results.userFunc === "Args" || results.userFunc === "Returns")) {
                results.userFunc = "ReturnAndArgs";
            }
        }
    }

    /* Handles the addition of information about conditional lines to allConditionals
    * @param node - the conditional AST node
    */
    function notateConditional(node) {

        var lastLine = getLastLine(node);

        //fills in a list of lines where else statements for this conditional occur
        function addElse(node, elseLineList) {
            if (node.orelse != null && node.orelse.length > 0) {
                elseLineList.push(node.orelse[0].lineno);
                addElse(node.orelse[0], elseLineList);
            }
        }

        //determines if the conditional in question is inside another conditional
        function findParent(startLine, endLine, nodeList) {
            var parentNode = null

            for (var i in nodeList) {
                if (nodeList[i].children.length > 0) {
                    parentNode = findParent(startLine, endLine, nodeList[i].children)
                }
                if (parentNode == null) {
                    if (nodeList[i].start < startLine && nodeList[i].end >= endLine) {
                        parentNode = nodeList[i];
                        break;
                    }
                }

            }

            return parentNode;
        }

        //pushes this conditional's object to its parent's list of children
        function pushParent(child, parentStart, parentEnd, nodeList) {
            for (var i in nodeList) {
                if (nodeList[i].start === parentStart && nodeList[i].end === parentEnd) {
                    nodeList[i].children.push(child);
                }
                else if (nodeList[i].start <= parentStart && nodeList[i].end >= parentEnd) {
                    pushParent(child, parentStart, parentEnd, nodeList[i].children);
                    break;
                }

            }
        }

        //Have we already marked this exact conditional before?
        function doesAlreadyExist(start, end, nodeList) {

            for (var i in nodeList) {
                if (nodeList[i].children.length > 0) {
                    if (doesAlreadyExist(start, end, nodeList[i].children)) {
                        return true;
                    }
                }
                if (nodeList[i].start == start && nodeList[i].end == end) {
                    return true;
                }


            }

            return false;
        }



        //get all orelse locations
        var elseLines = [];
        addElse(node, elseLines);
        elseLines.push(lastLine);

        var newObjects = [];

        if (elseLines.length > 0) {
            var firstNode = { start: node.lineno, end: elseLines[0], children: [] };
            newObjects.push(firstNode);
            for (var i = 0; i < elseLines.length - 1; i++) {
                var newNode = { start: elseLines[i], end: elseLines[i + 1], children: [] };
                newObjects.push(newNode);
            }
        }
        else {
            var firstNode = { start: node.lineno, end: elseLines[0], children: [] };
            newObjects.push(firstNode);
        }

        //is this a child node?
        var isChild = findParent(node.lineno, lastLine, allConditionals);
        //go through, replacing isChild with the object its a child of if found
        if (isChild != null) {
            for (var i in newObjects) {
                if (!doesAlreadyExist(newObjects[i].start, newObjects[i].end, allConditionals)) {
                    pushParent(newObjects[i], isChild.start, isChild.end, allConditionals);
                }
            }
        }
        else {
            for (var i in newObjects) {
                if (!doesAlreadyExist(newObjects[i].start, newObjects[i].end, allConditionals)) {
                    allConditionals.push(newObjects[i]);
                }
            }
        }

    }

    /**
     * Analyze a single node of a Python AST.
     * @private
     */
    function analyzeASTNode(node, results, loopParent) {
        var isForLoop = false;
        var isWhileLoop = false;
        if (node != null && node._astname != null) {

            var lineNumber = 0;
            if (node.lineno != null) {
                lineNumber = node.lineno;
                parentLineNumber = lineNumber;
            }
            else {
                lineNumber = parentLineNumber;
            }

            if (!uncalledFunctionLines.includes(lineNumber + 1)) {
                //initilize usage booleans
                var uses = {
                    variables: false,
                    strings: false,
                    booleans: false,
                    conditionals: false,
                    ints: false,
                    lists: false,
                    consoleInput: false,
                    mathematicalOperators: false,
                    comparisons: false,
                    floats: false,
                    userFunc: false,
                    forLoops: false,
                    whileLoops: false,
                    boolOps: false,
                    binOps: false,
                    listOps: false,
                    strOps: false
                }

                var usesVarsWithPurpose = false;
                var orElse = false;
                var listOpUsed = "";
                var strOpUsed = "";

                //FIRST, we check for usage of all of our concepts and update the uses object accordingly.

                if (node._astname === 'Assign' || node[0] === 'Assign') {
                    uses["variables"] = true;
                }
                if (node._astname === 'Str') {
                    uses["strings"] = true;
                }
                if (node._astname === 'Num') {
                    if (!isNodeFloat(node)) {
                        uses["ints"] = true;
                    }
                    else {
                        uses["floats"] = true;
                    }
                }
                if ((node._astname === "Name" && (node.id.v === "True" || node.id.v === "False"))) {
                    uses["booleans"] = true;
                }
                if (node._astname === "UnaryOp") {
                    uses["booleans"] = true;
                }
                if (node._astname === "Name" && node.id.v !== "True" && node.id.v !== "False" && getVariableObject(node.id.v) != null) {
                    uses["variables"] = true;
                    if (originalityLines.includes(lineNumber) && results.variables < 2) {
                        results.variables = 2;
                    }
                }
                if (node._astname === "BoolOp" || node._astname === "UnaryOp") {
                    uses["boolOps"] = true;
                }
                if (node._astname === "Compare") {
                    uses['comparisons'] = true;
                }
                if (node._astname === "BoolOp" && results.boolOps < 1) {
                    uses["boolOps"] = true;
                }
                if (node._astname === "UnaryOp") {
                    recursiveAnalyzeAST(node.operand, results, loopParent);
                }

                //CASTING - this marks existence of relevant datatype.
                if (node._astname === "Call" && 'func' in node) {
                    var nodeFunc = node.func;
                    nodeFunc = retrieveFromList(nodeFunc);
                    if (nodeFunc._astname === 'Name') {

                        if (nodeFunc.id.v === "int") {
                            uses["int"] = true;
                        }
                        if (nodeFunc.id.v === "float") {
                            uses["floats"] = true;
                        }
                        if (nodeFunc.id.v === "bool") {
                            uses["booleans"] = true;
                        }
                        if (nodeFunc.id.v === "str") {
                            uses["strings"] = true;
                        }
                    }
                }
                //look for user-defined functions
                if (node._astname === 'FunctionDef') {
                    uses["userFunc"] = true;
                }
                var compareLeft = null;
                var compareRight = null;

                //look for conditionals
                if (node._astname === 'If') {
                    notateConditional(node);




                    uses["conditionals"] = true;
                    if (node.test._astname === "Compare") {

                        compareLeft = node.test.left;
                        compareRight = node.test.right;
                    }
                    if (node.test._astname === "Name") { usesBooleans = true; }
                    if (node.test._astname === "BoolOp" || node.test._astname === "UnaryOp") {
                        usesBooleans = true;
                        var names = [];
                        getNestedVariables(node.test, names);
                        if (names.length > 0) { usesVarsWithPurpose = true; }
                        var anyOriginalNested = false;
                        for (var i = 0; i < names.length; i++) {
                            var nameItem = getVariableObject(names[i]);
                            if (nameItem != null && nameItem.original) {
                                anyOriginalNested = true;
                                break;
                            }
                        }
                        if (originality || anyOriginalNested) {
                            if (nameItem.indexAndInput.input) { results.consoleInput = 3; }
                            if (nameItem.indexAndInput.strIndexed) { results.strings = 4; }
                            if (nameItem.indexAndInput.indexed) { results.lists = 4; }
                            var opsList = opsBeforeLine(nameItem.opsDone, node.lineno, "var", nameItem);
                            for (var p = 0; p < opsList; p++) {
                                if (opsList[p] === "ListOp") { results.listOps = 3; }
                                if (opsList[p] === "StrOp") { results.strOps = 3; }
                                if (opsList[p] === "BinOp") { results.mathematicalOperators = 3; }
                                if (opsList[p] === "BoolOp") { results.mathematicalOperators = 3; }
                            }
                        }
                    }
                    if ((node.test._astname !== "Name" || node.test.id.v != 'True' || node.test.id.v != 'False') && (node.orelse != null && node.orelse.length > 0)) {
                        orElse = true;
                        recursiveAnalyzeAST(node.orelse, results, loopParent);

                    } //is there an "or else" element?
                }
                //look for for loops
                if (node._astname === 'For' || node._astname === "JSFor") {
                    uses["forLoops"] = true;
                    isForLoop = true;
                }
                //look for while loops
                if (node._astname === 'While') {
                    usesWhileLoops = true;
                    isWhileLoop = true;
                }
                //look for mathematical operations. Also tallies list and string concatenation since those all appear in the AST as BinOps.
                if (node._astname === "AugAssign") {
                    uses["mathematicalOperators"] = true;
                    // we have to make a fake binop here
                    var fakeBinOp = { _astname: "BinOp", lineno: node.lineno, left: node.target, right: node.value };
                    if (Array.isArray(recursivelyAnalyzeBinOp(fakeBinOp)) && results.listOps < 1) {
                        uses["listOps"] = true;
                    }
                    else if (recursivelyAnalyzeBinOp(fakeBinOp) === "Str") {
                        uses["strOps"] = true;
                    }
                }
                if (node._astname === "BinOp") {
                    uses["mathematicalOperators"] = true;
                    if (Array.isArray(recursivelyAnalyzeBinOp(node)) && results.listOps < 1) {
                        uses["listOps"] = true;
                    }
                    else if (recursivelyAnalyzeBinOp(node) === "Str") {
                        uses["strOps"] = true;
                    }
                }
                //look for comparators
                if (node._astname === 'Compare') { uses["comparisons"] = true; }
                //look for lists. should also cover lists passed as args.
                if (node._astname === 'List') {
                    uses["lists"] = true;
                    // containerIndex = 0;
                }
                //list and string ops
                if (node._astname === "Call") {
                    var funcName = "";
                    var nodeFunc = node.func;
                    nodeFunc = retrieveFromList(nodeFunc);
                    if ('attr' in nodeFunc) {
                        funcName = nodeFunc.attr.v;
                        //ok now we find out if it was performed on a variable
                        var attrVar = null;
                        if (nodeFunc.value._astname === "Name") { attrVar = getVariableObject(nodeFunc.value.id.v); }

                        var isListFunc = false;
                        var isStrFunc = false;
                        if (JS_STR_LIST_OVERLAP.includes(funcName) && isJavascript) {
                            var opValType = getTypeFromNode(nodeFunc.value);
                            if (opValType === "List") { isListFunc = true; }
                            else if (opValType === "Str") { isStrFunc = true; }
                            else if (opValType === "") {
                                isListFunc = true;
                                isStrFunc = true;
                            }
                        }

                        if (listFuncs.includes(funcName) && !isStrFunc) {
                            if (results.listOps[funcName] === 0) { results.listOps = 1; }
                            if (originalityLines.includes(node.lineno) && results.listOps < 2) { results.listOps = 2; }
                            listOpUsed = "" + funcName;
                            if (attrVar != null) { attrVar.opsDone = addOpToList("ListOp", attrVar.opsDone, node.lineno); }
                            //are we in a function?
                            for (var p in userFunctionReturns) {
                                if (userFunctionReturns[p].startLine != null && userFunctionReturns.startLine < node.lineno && userFunctionReturns.endLine >= node.lineno) {
                                    userFunctionReturns[p].opsDone = addOpToList("ListOp", userFunctionReturns[p].opsDone, node.lineno);
                                    break;
                                }
                            }
                        }
                        if (strFuncs.includes(funcName) && !isListFunc) {
                            if (results.strOps === 0) { results.strOps = 1; }
                            if (originalityLines.includes(node.lineno) && results.strOps < 2) { results.strOps = 2; }
                            strOpUsed = "" + funcName;
                            if (attrVar != null) { attrVar.opsDone = addOpToList("StrOp", attrVar.opsDone, node.lineno); }
                            //are we in a function?
                            for (var p in userFunctionReturns) {
                                if (userFunctionReturns[p].startLine != null && userFunctionReturns.startLine < node.lineno && userFunctionReturns.endLine >= node.lineno) {
                                    userFunctionReturns[p].opsDone = addOpToList("StrOp", userFunctionReturns[p].opsDone, node.lineno);
                                    break;
                                }
                            }
                        }
                    }
                }
                //look for console input
                if ((node.value != null && node.value._astname === 'Call') && ('id' in node.value.func && 'v' in node.value.func.id && node.value.func.id.v === 'readInput')) { uses["consoleInput"] = true; }
                var newDataType = "";
                //mark usage of the things we are looknig for
                Object.keys(uses).forEach(function (key) {
                    if (uses[key] && results[key] === 0) { results[key] = 1; }
                });
                if (uses["booleans"]) {
                    newDataType = "Bool";
                }
                if (uses["floats"]) {
                    newDataType = "Float";
                }
                if (uses["ints"]) {
                    newDataType = "Int";
                }
                if (uses["strings"]) {
                    newDataType = "Str";
                }



                //Level 2 is originality, so we check that next.

                var originality = false;
                //check for originality
                //if it's a chunk of code we check the whole chunk.
                if (node._astname === 'FunctionDef' || node._astname === 'If' || node._astname === 'While' || node._astname === 'For' || node._astname === "JSFor") {
                    //OLD ORIGINALITY - leave these comments here and DO NOT DELETE until we are 100% ready to implement new originality!
                    //then we have to check the WHOLE NODE for originality
                    lineNumber = node.lineno - 1;
                    //lastLine = node.body[node.body.length - 1].lineno + 1;
                    var lastLine = getLastLine(node);
                    for (var chunkLine = node.lineno; chunkLine <= lastLine; chunkLine++) {
                        if (originalityLines.includes(chunkLine)) {
                            originality = true;
                            break;
                        }
                    }
                    //tree originaity, if we ever want to switch to this measure
                    // originality = TreeOriginality(node, 1, STRUCTURE_SAMPLES);
                }
                else {
                    //then this is one line and we only need to check a single line
                    lineNumber = 0;
                    if (node.lineno != null) {
                        lineNumber = node.lineno;
                        parentLineNumber = lineNumber;
                    }
                    else {
                        lineNumber = parentLineNumber;
                    }

                    originality = (originalityLines.includes(lineNumber));
                }



                //originality value updates for functions, variables, etc.
                if (originality) {
                    if (node.id != null && node.id.v != null) {
                        var foundVar = getVariableObject(node.id.v);
                        if (foundVar != null) {
                            var varName = foundVar.name;
                            for (var f = 0; f < allVariables.length; f++) {
                                if (allVariables[f].name === varName) {
                                    allVariables[f].original = true; //the variable is assigned in  unique line
                                    break;
                                }
                            }
                        }
                    }


                    //whatever is in here, mark that it's used uniquely.
                    var markAsOriginal = ["variables", "strings", "booleans", "ints", "consoleInput", "mathematicalOperators", "floats", "lists", "listOps", "strOps", "boolOps"];

                    for (var attribute = 0; attribute < markAsOriginal.length; attribute++) {
                        if (uses[markAsOriginal[attribute]] && results[markAsOriginal[attribute]] < 2) {
                            results[markAsOriginal[attribute]] = 2;
                        }
                    }

                    if (node._astname === 'FunctionDef') {
                        if (uses["userFunc"] && (Number.isInteger(results.userFunc) && results.userFunc < 2)) {
                            results.userFunc = 2;
                        }

                        //does this function take arguments or return values? //TODO can we get rid of this???? I fell like it's wrong
                        if (node.args.args.length > 0) {
                            takesArgs = true;
                        }
                        for (i = 0; i < node.body.length; i++) {
                            if (node.body[i]._astname === 'Return') {
                                returns = true;
                                break;
                            }
                        }
                    }

                    //what about stuff in for loops (iterators, etc.?) Mark these as original if need be.
                    if (node._astname === 'For') {
                        if (uses["forLoops"] && results.forLoops < 2) {
                            results.forLoops = 2;
                        }
                        if (node.iter._astname === "List") {
                            results.lists = 4;
                        }
                        if (node.iter._astname === "Name") {
                            var iterName = getVariableObject(node.iter.id.v);

                            if (iterName != null) {
                                if (iterName.value === "List") {
                                    results.lists = 4;
                                }
                                if (iterName.value === "Str") {
                                    results.strings = 4;
                                }

                                var listedOps = opsBeforeLine(iterName.opsDone, node.lineno, "var", iterName);

                                for (var op = 0; op < listedOps.length; op++) {
                                    if (listedOps[op] === "BinOp" || listedOps[op] === "AugAssign") {
                                        results.mathematicalOperators = 3;
                                    }
                                    if (listedOps[op] === "BoolOp") {
                                        results.boolOps = 3;
                                    }
                                    if (listedOps[op] === "StrOp") {
                                        results.strOps = 3;
                                    }
                                    if (listedOps[op] === "ListOp") {
                                        results.listOps = 3;
                                    }
                                    if (listedOps[op] === "Compare") {
                                        results.comparisons = 3;
                                    }
                                }
                            }
                        }
                        if (node.iter._astname === "Str") {
                            results.strings = 4;
                        }

                        if ('func' in node.iter) {
                            if (doesCallCreateList(node.iter)) {
                                results.lists = 4;
                            }
                            if (doesCallCreateString(node.iter)) {
                                results.strings = 4;
                            }
                            if ('id' in node.iter.func && getFunctionObject(node.iter.func.id.v) != null) {
                                var iterator = getFunctionObject(node.iter.func.id.v);


                                if (iterator.returns === "List") {
                                    results.lists = 4;
                                }
                                else if (iterator.returns === "Str") {
                                    results.strings = 4;
                                }
                                var listedOps = opsBeforeLine(iterator.opsDone, node.lineno, "func", iterator);


                                for (var op = 0; op < listedOps.length; op++) {
                                    if (listedOps[op] === "BinOp" || listedOps[op] === "AugAssign") {
                                        results.mathematicalOperators = 3;
                                    }
                                    if (listedOps[op] === "BoolOp") {
                                        results.boolOps = 3;
                                    }
                                    if (listedOps[op] === "StrOp") {
                                        results.strOps = 3;
                                    }
                                    if (listedOps[op] === "ListOp") {
                                        results.listOps = 3;
                                    }
                                    if (listedOps[op] === "Compare") {
                                        results.comparisons = 3;
                                    }
                                }
                            }
                        }

                        //if we're using range(), check for minimum and step values
                        if ('func' in node.iter && 'id' in node.iter.func && node.iter.func.id.v === 'range') {
                            if (node.iter.args.length === 2 && results.forLoops < 3) {
                                results.forLoops = 3;
                            }
                            else if (node.iter.args.length === 3 && results.forLoops < 4) {
                                results.forLoops = 4;
                            }
                        }
                    }
                    //JSFor
                    if (node._astname === 'JSFor' && uses["forLoops"] && results.forLoops < 2) {
                        results.forLoops = 2;
                    }
                    if (node._astname === 'If') {
                        if (uses["conditionals"] && results.conditionals < 2) {
                            results.conditionals = 2;
                        }
                        if (orElse && results.conditionals < 3) {
                            results.conditionals = 3;
                        }
                    }
                }

                if (originality && uses["comparisons"]) {
                    results.comparisons = 2;
                }



                //Level 3 is "uses for a purpose" - do that next



                var purposeVars = false;

                //look for purposes for datatypes, variables, lists, ops
                var opsUsed = [];
                var changesVarsForPurpose = false;
                var originalAssignment = false;


                if (node._astname === "Call") {
                    //at this point, calls are shipped out to a helper function
                    analyzeFunctionCall(node, results, loopParent, opsUsed, purposeVars, lineNumber);
                }

                //next, we look in conditional statements
                if (node._astname === "If") {

                    //variable init
                    var floats = false;
                    var ints = false;
                    var strings = false;
                    var bools = false;
                    var lists = false;
                    purposeVars = false;
                    var inputUsed = false;
                    var containedTypes = [];

                    //check the test node
                    var testNode = node.test;
                    if (testNode._astname === "UnaryOp") {
                        var anyOr = originality;
                        if (!originality) {
                            var unaryNames = [];
                            getNestedVariables(testNode, unaryNames);
                            for (var p in unaryNames) {
                                var isVar = getVariableObject(unaryNames[p]);
                                if (isVar != null && isVar.original) {
                                    anyOr = true;
                                    break;
                                }
                            }
                        }
                        if (anyOr) { results.booleans = 3; }
                        testNode = testNode.operand;
                    }


                    //first, go through and grab all the bits of the test statement, whatever that may be
                    if (testNode._astname === "Subscript") {

                        var isIndexedItem = getIndexingInNode(testNode)[0];
                        var isStrIndexedItem = getStringIndexingInNode(testNode)[0];

                        if (isIndexedItem) { results.lists = 4; }
                        if (isStrIndexedItem) { results.strings = 4; }

                        testNode = retrieveFromList(testNode);
                    }

                    //unary op handling 
                    //YES, this is in here twice. That IS intentional. -Erin 
                    if (testNode != null && testNode._astname === "UnaryOp") {
                        var anyOr = originality;
                        if (!originality) {
                            var unaryNames = [];
                            getNestedVariables(testNode, unaryNames);
                            for (var p in unaryNames) {
                                var isVar = getVariableObject(unaryNames[p]);
                                if (isVar != null && isVar.original) {
                                    anyOr = true;
                                    break;
                                }
                            }
                        }
                        if (anyOr) {
                            results.booleans = 3;
                        }
                        testNode = testNode.operand;
                    }

                    if (testNode != null) {
                        //this won't get checked on its own.
                        recursiveAnalyzeAST(testNode, results, loopParent);
                    }

                    //check for using for a purpose inside the test
                    if (testNode != null && testNode._astname === "Compare") {


                        //update indexing variables
                        if (getIndexingInNode(testNode)[0] && (originality || getIndexingInNode(testNode)[1])) {
                            results.lists = 4;
                        }
                        if (getStringIndexingInNode(testNode)[0] && (originality || getStringIndexingInNode(testNode)[1])) {
                            results.strings = 4;
                        }

                        if (!originality) {
                            listTypesWithin(testNode, containedTypes, {
                                input: false,
                                indexed: false,
                                strIndexed: false
                            }, []);
                        }

                        else {
                            results.comparisons = 3;
                            var inputIndexItem = {
                                input: false,
                                indexed: false,
                                strIndexed: false
                            };

                            var operations = [];
                            listTypesWithin(testNode, containedTypes, inputIndexItem, operations);
                            appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);


                            if (inputIndexItem.indexed) {
                                results.lists = 4;
                            }
                            if (inputIndexItem.strIndexed) {
                                results.strings = 4;
                            }
                            if (inputIndexItem.input) {
                                inputUsed = true;
                            }
                        }
                    }

                        //we have to check everything inside the binop's left and right items
                    else if (testNode != null && testNode._astname === "BinOp") {
                        var inputIndexItem = {
                            indexed: false,
                            input: false,
                            strIndexed: false
                        };

                        if (getIndexingInNode(testNode)[0] && (originality || getIndexingInNode(testNode)[1])) {
                            results.lists = 4;
                        }
                        if (getStringIndexingInNode(testNode)[0] && (originality || getStringIndexingInNode(testNode)[1])) {
                            results.strings = 4;
                        }

                        if (!originality) {
                            listTypesWithin(testNode, containedTypes, {
                                indexed: false,
                                input: false,
                                strIndexed: false
                            }, []);
                        }

                        else {
                            var operations = [];
                            listTypesWithin(testNode, containedTypes, inputIndexItem, operations);
                            appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);
                        }

                        if (inputIndexItem.indexed) {
                            results.lists = 4;
                        }
                        if (inputIndexItem.strIndexed) {
                            results.strings = 4;
                        }
                        if (inputIndexItem.input) {
                            inputUsed = true;
                        }
                    }

                        //same for boolops
                    else if (testNode != null && testNode._astname === "BoolOp") {
                        var inputIndexPurp = {
                            input: false,
                            indexed: false,
                            strIndexed: false
                        };

                        if (getIndexingInNode(testNode)[0] && (originality || getIndexingInNode(testNode)[1])) {
                            results.lists = 4;
                        }
                        if (getStringIndexingInNode(testNode)[0] && (originality || getStringIndexingInNode(testNode)[1])) {
                            results.strings = 4;
                        }

                        if (!originality) {
                            listTypesWithin(testNode, containedTypes, {
                                input: false,
                                indexed: false,
                                strIndexed: false
                            }, []);
                        }


                        else {
                            var operations = [];
                            listTypesWithin(testNode, containedTypes, inputIndexPurp, operations);
                            appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);
                        }

                        if (inputIndexPurp.indexed) {
                            results.lists = 4;
                        }
                        if (inputIndexPurp.strIndexed) {
                            results.strings = 4;
                        }
                        if (inputIndexPurp.input) {
                            inputUsed = true;
                        }
                    }
                        //for lists, we have to check every item
                    else if (testNode != null && testNode._astname === "List") {
                        var inputIndexPurp = {
                            input: false,
                            indexed: false,
                            strIndexed: false
                        };

                        if (getIndexingInNode(testNode)[0] && (originality || getIndexingInNode(testNode)[1])) {
                            results.lists = 4;
                        }
                        if (getStringIndexingInNode(testNode)[0] && (originality || getStringIndexingInNode(testNode)[1])) {
                            results.strings = 4;
                        }
                        if (!originality) {
                            containedTypes = listTypesWithin(testNode.elts, containedTypes, {
                                input: false,
                                indexed: false,
                                strIndexed: false
                            }, []);
                        }

                        else {
                            var operations = [];
                            containedTypes = listTypesWithin(testNode.elts, containedTypes, inputIndexPurp, operations);
                            appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);
                        }

                        if (inputIndexPurp.indexed) {
                            results.lists = 4;
                        }
                        if (inputIndexPurp.strIndexed) {
                            results.strings = 4;
                        }
                        if (inputIndexPurp.input) {
                            inputUsed = true;
                        }
                    }

                    else if (testNode != null && testNode._astname === "Name") {
                        //grab variable val if it represents a single datatype
                        //also, get information about ops and contained values from the variable
                        if (testNode.id.v !== "True" && testNode.id.v !== "False") {
                            var value = "";
                            var containedValInTest = null;
                            var testVar = getVariableObject(testNode.id.v);

                            if (testVar != null) {

                                value = testVar.value;
                                if (testVar.indexAndInput.input) {
                                    inputUsed = true;
                                }

                                containedValInTest = testVar.containedValue;

                                if (testVar.indexAndInput.indexed && (originality || testVar.original)) {
                                    results.lists = 4
                                }
                                if (testVar.indexAndInput.strIndexed && (originality || testVar.original)) {
                                    results.strings = 4;
                                }
                                if (testVar.opsDone != null && (originality || testVar.original)) {
                                    var opsInVar = opsBeforeLine(testVar.opsDone, node.lineno, "var", testVar);
                                    appendArray(opsInVar, opsUsed);
                                }
                            }


                            //update usage booleans
                            if (value === "Bool") {
                                bools = true;
                            }
                            if (value === "Int") {
                                ints = true;
                            }
                            if (value === "Float") {
                                floats = true;
                            }
                            if (value === "Str") {
                                strings = true;
                            }


                            if (value === "List" || containedValInTest != null) {
                                if (value === "List") {
                                    lists = true;
                                }
                                for (var k = 0; k < containedValInTest.length; k++) {
                                    if (containedValInTest[k] === "Str") {
                                        strings = true;
                                    }
                                    if (containedValInTest[k] === "Int") {
                                        ints = true;
                                    }
                                    if (containedValInTest[k] === "Float") {
                                        floats = true;
                                    }
                                    if (containedValInTest[k] === "Bool") {
                                        bools = true;
                                    }
                                }
                            }
                        }
                        else {
                            //otherwise it's just "if true" or "if false"
                            bools = true;
                        }

                    }
                    else if (testNode != null && testNode._astname === "Call") {
                        analyzeASTNode(testNode, results, parent);
                        recursiveAnalyzeAST(testNode, results, parent);
                        var funcName = "";
                        var argList = [];

                        //get function name and args
                        if ('id' in testNode.func) {
                            funcName = testNode.func.id.v;
                            argList = testNode.args;
                        }
                        else {
                            funcName = testNode.func.attr.v;
                        }


                        if (funcName === 'readInput') {
                            inputUsed = true;
                        }
                        if (listFuncs.indexOf(funcName) > -1 && originality) {
                            lists = true;
                            if (!opsUsed.includes("ListOp")) {
                                opsUsed.push("ListOp");
                            }
                        }
                        if (strFuncs.indexOf(funcName) > -1 && originality) {
                            strings = true;
                            if (!opsUsed.includes("StrOp")) {
                                opsUsed.push("StrOp");
                            }
                        }

                        //get the return value from the function
                        var callReturnVal = "";
                        var returnFrom = getFunctionObject(funcName);


                        if (returnFrom != null) {
                            callReturnVal = returnFrom.returns;

                            if (returnFrom.containedValue != null) {
                                for (var c = 0; c < returnFrom.containedValue.length; c++) {
                                    var returnElement = returnFrom.containedValue[c];
                                    if (returnElement === "Str") {
                                        strings = true;
                                    }
                                    if (returnElement === "Int") {
                                        ints = true;
                                    }
                                    if (returnElement === "Float") {
                                        floats = true;
                                    }
                                    if (returnElement === "Bool") {
                                        bools = true;
                                    }
                                }
                            }

                            //update results accordingly
                            if (returnFrom.indexAndInput.indexed && (originality || returnFrom.original)) {
                                results.lists = 4;
                            }
                            if (returnFrom.indexAndInput.strIndexed && (originality || returnFrom.original)) {
                                results.strings = 4;
                            }
                            if (returnFrom.indexAndInput.input) {
                                inputUsed = true;
                            }
                            if (returnFrom.nested) {
                                purposeVars = true;
                            }
                            if (returnFrom.opsDone != null && originality) {
                                var returnOps = opsBeforeLine(returnFrom.opsDone, node.lineno, "func", returnFrom);
                                appendArray(returnOps, opsUsed);
                            }
                        }
                        if (callReturnVal === "Str") {
                            strings = true;
                        }
                        else if (callReturnVal === "Int") {
                            ints = true;
                        }
                        else if (callReturnVal === "Float") {
                            floats = true;
                        }
                        else if (callReturnVal === "Bool") {
                            bools = true;
                        }
                        else if (callReturnVal === "List") {
                            lists = true;
                        }
                    }

                    //then if contained Types is there and has values in it, we look through it and flag the relevant things
                    if (containedTypes.length > 0) {
                        for (var g = 0; g < containedTypes.length; g++) {
                            if (containedTypes[g] === "List") {
                                lists = true;
                            }
                            if (containedTypes[g] === "Bool") {
                                bools = true;
                            }
                            if (containedTypes[g] === "Str") {
                                strings = true;
                            }
                            if (containedTypes[g] === "Int") {
                                ints = true;
                            }
                            if (containedTypes[g] === "Float") {
                                floats = true;
                            }
                        }
                    }
                    recursiveAnalyzeAST(testNode, results, loopParent);
                    //we already look for booleans or w/e so we don't need to do that here
                    if ((originality || originalAssignment) && (inputUsed && results.consoleInput < 3)) { results.consoleInput = 3; }
                    //here's where we update the results if anything needs to be elevated a level.
                    if (originality || originalAssignment) {
                        if (floats) { results.floats = 3; }
                        if (ints) { results.ints = 3; }
                        if (strings && results.strings < 3) { results.strings = 3; }
                        if (bools) { results.booleans = 3; }
                        if (lists && (results.lists < 3)) { results.lists = 3; }
                        if (purposeVars && (results.variables < 3)) { results.variables = 3; }
                    }

                    var modOriginality = false;
                    if (testNode != null && testNode._astname === "Name" && testNode.id.v !== "True" && testNode.id.v !== "False") {
                        var originalAssign = false;
                        var varInput = false;
                        var testVariable = getVariableObject(node.test.id.v);
                        if (testVariable != null) {
                            var argModded = false;
                            var insideOutside = "outside"; //this will get set to "inside" if this call is within another function
                            var insideLines = [-1, -1];
                            if (testVariable.indexAndInput.input) { varInput = true; }
                            if (testVariable.original) { originalAssign = true; }
                            if (testVariable.opsDone != null && (originality || testVariable.original)) {
                                var testVariableOps = opsBeforeLine(testVariable.opsDone, node.lineno, "var", testVariable);
                                appendArray(testVariableOps, opsUsed);
                            }
                            //is the use inside or outside a function?
                            for (var n = 0; n < testVariable.modifyingFunctions.length; n++) {
                                if (node.lineno >= testVariable.modifyingFunctions[n][0] && node.lineno <= testVariable.modifyingFunctions[n][1]) {
                                    insideOutside = "inside";
                                    insideLines = testVariable.modifyingFunctions[n];
                                    break;
                                }
                            }
                            if (insideOutside === "outside") {
                                insideLines = [];
                                for (var n = 0; n < testVariable.modifyingFunctions.length; n++) {
                                    for (var line = testVariable.modifyingFunctions[n][0]; line <= testVariable.modifyingFunctions[n][1]; line++) {
                                        insideLines.push(line);
                                    }
                                }
                            }
                            var numberOfMods = 0;
                            for (var z = 0; z < testVariable.assignedModified.length; z++) {
                                if (testVariable.assignedModified[z].line > node.lineno) { break; } //stop loop before we get to the current line OR if both things we're looking for are already set to true.

                                //is there a modification? is it original?
                                if ((insideOutside === "inside" && node.lineno >= insideLines[0] && node.lineno <= insideLines[1]) || (insideOutside === "outside" && !insideLines.includes(node.lineno))) {
                                    argModded = true;
                                    numberOfMods += 1;
                                    if (testVariable.assignedModified[z].original) { modOriginality = true; }
                                }
                            }
                            if (argModded && (originality || modOriginality) && ((insideOutside === "outside" && numberOfMods > 1) || (insideOutside === "inside" && numberOfMods > 0))) { results.variables = 4; }
                        }


                        //update results object
                        if (originalAssign || originality) {
                            if (varInput && results.consoleInput < 3) {
                                results.consoleInput = 3;
                            }
                            if (results.variables < 3) {
                                results.variables = 3;
                            }
                            if ((assignOriginality || originality)) {
                                if (varType === "List" && results.lists < 3) {
                                    results.lists = 3;
                                }
                                if (varType === "Bool" && results.booleans < 3) {
                                    results.booleans = 3;
                                }
                                if (varType === "Str" && results.strings < 3) {
                                    results.strings = 3;
                                }
                                if (varType === "Int" && results.ints < 3) {
                                    results.ints = 3;
                                }
                                if (varType === "Float") {
                                    results.floats = 3;
                                }
                            }
                        }
                    }


                    //is the argument something else that can CONTAIN a variable value?
                    //This is where we go through and see if any variables are contained in other structures (e.g., a binop or list)

                    if (testNode != null && (testNode._astname === "List" || testNode._astname === "BinOp" || testNode._astname === "BoolOp" || testNode._astname === "Compare")) {
                        if (testNode._astname === "Compare" && originality) { results.comparisons = 3; }
                        var originalAssign = false;
                        var varInput = false;
                        var allNamesWithin = [];
                        getNestedVariables(testNode, allNamesWithin);
                        //if ANY of these is marked as original, assignment counts as original
                        var originalAssign = false
                        for (var n = 0; n < allNamesWithin.length; n++) {
                            var varWithin = getVariableObject(allNamesWithin[n]);
                            if (varWithin != null) {

                                var insideOutside = "outside"; //this will get set to "inside" if this call is within another function
                                var insideLines = [-1, -1];
                                var argModded = false;
                                var containedVal = varWithin.value;
                                var numberOfMods = 0;


                                //is the use inside or outside a function?
                                for (var i = 0; i < varWithin.modifyingFunctions.length; i++) {
                                    if (node.lineno >= varWithin.modifyingFunctions[i][0] && node.lineno <= varWithin.modifyingFunctions[i][1]) {
                                        insideOutside = "inside";
                                        insideLines = varWithin.modifyingFunctions[i];
                                        break;
                                    }
                                }
                                if (insideOutside === "outside") {
                                    insideLines = [];
                                    for (var i = 0; i < varWithin.modifyingFunctions.length; i++) {
                                        for (var line = varWithin.modifyingFunctions[i][0]; line <= varWithin.modifyingFunctions[i][1]; line++) {
                                            insideLines.push(line);
                                        }
                                    }
                                }
                                for (var z = 0; z < varWithin.assignedModified.length; z++) {
                                    if (varWithin.assignedModified[z].line > node.lineno) {  //stop loop before we get to the current line OR if both things we're looking for are already set to true.
                                        break;
                                    }

                                    //is there a modification? is it original?
                                    if ((insideOutside === "inside" && node.lineno >= insideLines[0] && node.lineno <= insideLines[1]) || (insideOutside === "outside" && !insideLines.includes(node.lineno))) {
                                        argModded = true;
                                        numberOfMods += 1;
                                        if (varWithin.assignedModified[z].original) {
                                            modOriginality = true;
                                        }
                                    }
                                }
                                if (argModded && (originality || modOriginality) && ((insideOutside === "outside" && numberOfMods > 1) || (insideOutside === "inside" && numberOfMods > 0))) {
                                    results.variables = 4;
                                }
                                if (varWithin.original) {
                                    originalAssign = true;
                                }

                                //update results
                                if (varWithin.original || originality) {
                                    if (containedVal === "List" && results.lists < 3) {
                                        results.lists = 3;
                                    }
                                    if (containedVal === "Bool" && results.booleans < 3) {
                                        results.booleans = 3;
                                    }
                                    if (containedVal === "Str" && results.strings < 3) {
                                        results.strings = 3;
                                    }
                                    if (containedVal === "Int" && results.ints < 3) {
                                        results.ints = 3;
                                    }
                                    if (containedVal === "Float") {
                                        results.floats = 3;
                                    }
                                }
                            }
                        }
                        if (allNamesWithin.length > 0 && (originalAssign || originality) && (results.variables < 3)) {
                            results.variables = 3;
                        }
                    }
                }

                //if it's a for loop (python, or JS for-in), we chack the iterator
                if (node._astname === "For") {
                    var datatypesUsed = [];
                    var nodeIter = node.iter;

                    //get unary-op and subscript sub-values
                    if (nodeIter._astname === "UnaryOp") {
                        var anyOr = originality;
                        if (!originality) {
                            var unaryNames = [];
                            getNestedVariables(nodeIter, unaryNames);
                            for (var p in unaryNames) {
                                var isVar = getVariableObject(unaryNames[p]);
                                if (isVar != null && isVar.original) {
                                    anyOr = true;
                                    break;
                                }
                            }
                        }
                        if (anyOr) {
                            results.booleans = 3;
                        }
                        nodeIter = nodeIter.operand;
                    }
                    nodeIter = retrieveFromList(nodeIter);
                    if (nodeIter._astname === "UnaryOp") {
                        var anyOr = originality;
                        if (!originality) {
                            var unaryNames = [];
                            getNestedVariables(nodeIter, unaryNames);
                            for (var p in unaryNames) {
                                var isVar = getVariableObject(unaryNames[p]);
                                if (isVar != null && isVar.original) {
                                    anyOr = true;
                                    break;
                                }
                            }
                        }
                        if (anyOr) { results.booleans = 3; }
                        nodeIter = nodeIter.operand;
                    }

                    //these won't get anayzed automatically
                    analyzeASTNode(node.iter, results, loopParent);
                    analyzeASTNode(node.target, results, loopParent);

                    //get all of the stuff inside, and update results to match
                    if (originality) {
                        var inputTaken = false;


                        if ('func' in nodeIter) {
                            for (var fa = 0; fa < nodeIter.args.length; fa++) {
                                if (nodeIter.args[fa]._astname === "Call" && (nodeIter.args[fa].func.id.v === "readInput" && results.consoleInput < 3)) {
                                    results.consoleInput = 3;
                                }

                                if (nodeIter.args[fa]._astname === "BinOp") {
                                    //var init
                                    var inputIndexItem = {
                                        input: false,
                                        indexed: false,
                                        strIndexed: false
                                    };
                                    var binOpIndex = false;
                                    var binOpStrIndex = false;



                                    if (originality) { //actually look for stuff if originality
                                        var operations = [];
                                        listTypesWithin(nodeIter.args[fa], [], inputIndexItem, operations);
                                        appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);
                                    }
                                    else { //feed it empty lists/objects
                                        listTypesWithin(note.iter.args[fa], [], { input: false, indexed: false, strIndexed: false }, []);
                                    }

                                    //update results
                                    if (inputIndexItem.input && results.consoleInput < 3) {
                                        results.consoleInput = 3;
                                    }
                                    if (inputIndexItem.indexed) {
                                        results.lists = 4;
                                    }
                                    if (inputIndexItem.strIndexed) {
                                        results.strings = 4;
                                    }
                                }
                            }
                        }

                            //other things are also iterable!
                        else if (nodeIter._astname === "List") {
                            if (getIndexingInNode(nodeIter)[0]) {
                                results.lists = 4;
                            }
                            if (getStringIndexingInNode(nodeIter)[0]) {
                                results.strings = 4;
                            }
                            datatypesUsed.push("List");


                            var inputIndexItem = {
                                input: false,
                                indexed: false,
                                strIndexed: false
                            };
                            var operations = [];
                            var listTypes = listTypesWithin(nodeIter.elts, [], inputIndexItem, operations);
                            appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);


                            for (var a = 0; a < listTypes.length; a++) {
                                datatypesUsed.push(listTypes[a]);
                            }


                            if (inputIndexItem.indexed) {
                                results.lists = 4;
                            }
                            if (inputIndexItem.strIndexed) {
                                results.strings = 4;
                            }
                            if (inputIndexItem.input) {
                                inputTaken = true;
                            }
                        }

                        else if (nodeIter._astname === "Str") {
                            results.strings = 4;
                        }
                            //itarator is a variable
                        else if (nodeIter._astname === "Name") {

                            var iteratorVar = getVariableObject(nodeIter.id.v);


                            if (iteratorVar != null) {
                                if (iteratorVar.value === "Str") {
                                    results.strings = 4;
                                }
                                if (iteratorVar.value === "Bool") {
                                    results.booleans = 3;
                                }
                                if (iteratorVar.value === "Int") {
                                    results.ints = 3;
                                }
                                if (iteratorVar.value === "Float") {
                                    results.floats = 3;
                                }
                                if (iteratorVar.value === "List") {
                                    results.lists = 4;
                                }

                                //update results
                                if ((iteratorVar.original || originality) && iteratorVar.indexAndInput.indexed) {
                                    results.lists = 4;
                                }
                                if ((iteratorVar.original || originality) && iteratorVar.indexAndInput.strIndexed) {
                                    results.strings = 4;
                                }

                                if (iteratorVar.containedValue != null) {
                                    for (var cv = 0; cv < iteratorVar.containedValue.length; cv++) {
                                        if (iteratorVar.containedValue[cv] === "Str" && results.strings < 3) {
                                            results.strings = 3;
                                        }
                                        if (iteratorVar.containedValue[cv] === "Bool") {
                                            results.booleans = 3;
                                        }
                                        if (iteratorVar.containedValue[cv] === "Int") {
                                            results.ints = 3;
                                        }
                                        if (iteratorVar.containedValue[cv] === "Float") {
                                            results.floats = 3;
                                        }
                                        if (iteratorVar.containedValue[cv] === "List" && results.lists < 3) {
                                            results.lists = 3;
                                        }
                                    }
                                }

                                if (iteratorVar.indexAndInput.input) {
                                    results.consoleInput = 3;
                                }

                                //check for ops done
                                if (iteratorVar.opsDone != null) {
                                    var iteratorOps = opsBeforeLine(iteratorVar.opsDone, node.lineno, "var", iteratorVar);
                                    for (var p = 0; p < iteratorOps.length; p++) {

                                        if (!opsUsed.includes(iteratorOps[p])) {
                                            opsUsed.push(iteratorOps[p]);
                                        }


                                        if (iteratorOps[p] === "BinOp" || iteratorOps[p] === "AugAssign") {
                                            results.mathematicalOperators = 3;
                                        }
                                        if (iteratorOps[p] === "BoolOp") {
                                            results.boolOps = 3;
                                        }
                                        if (iteratorOps[p] === "StrOp") {
                                            results.strOps = 3;
                                        }
                                        if (iteratorOps[p] === "ListOp") {
                                            results.listOps = 3;
                                        }
                                        if (iteratorOps[p] === "Compare") {
                                            results.comparisons = 3;
                                        }
                                    }
                                }
                            }
                        }

                        else if (nodeIter._astname === "BinOp") {
                            if (getIndexingInNode(nodeIter)[0]) {
                                results.lists = 4;
                            }
                            if (getStringIndexingInNode(nodeIter)[0]) {
                                results.strings = 4;
                            }


                            var iterableBinOpTypes = [];
                            var inputBinOp = false;
                            var isList = Array.isArray(recursivelyAnalyzeBinOp(nodeIter));


                            if (isList) {
                                results.lists = 4;
                            }
                            if (recursivelyAnalyzeBinOp(nodeIter) === "Str") {
                                results.strings = 4;
                            }
                            if (!opsUsed.includes("BinOp")) {
                                opsUsed.push("BinOp");
                            }


                            for (var p = 0; p < iterableBinOpTypes.length; p++) {
                                var typeName = iterableBinOpTypes[p];
                                if (typeName === "Str") {
                                    results.strings = 4;
                                }
                                if (typeName === "Int") {
                                    results.ints = 3;
                                }
                                if (typeName === "Float") {
                                    results.floats = 3;
                                }
                                if (typeName === "List") {
                                    results.lists = 4;
                                }
                                if (typeName === "Bool") {
                                    results.booleans = 3;
                                }
                            }
                            if (inputBinOp) {
                                results.consoleInput = 3;
                            }
                        }


                        if (nodeIter._astname === "Call") {
                            var funcName = "";
                            if ('id' in nodeIter.func) {
                                funcName = nodeIter.func.id.v;
                            }

                            else if (nodeIter.func._astname === "Subscript") {
                                var subscriptCall = retrieveFromList(nodeIter.func);
                                if (subscriptCall._astname === "Name") {
                                    funcName = subscriptCall.id.v;
                                }
                            }
                            else {
                                funcName = nodeIter.func.attr.v;
                            }


                            if (listFuncs.includes(funcName)) {
                                results.listOps = 3;
                                if (doesCallCreateList) {
                                    results.lists = 4;
                                }
                            }
                            if (strFuncs.includes(funcName)) {
                                results.strOps = 3;
                                if (doesCallCreateString) { results.strings = 4; }
                            }


                            for (var u = 0; u < userFunctionReturns.length; u++) {
                                if (userFunctionReturns[u].name === funcName) {
                                    if (userFunctionReturns[u].returns === "Str") {
                                        results.strings = 3;
                                    }
                                    if (userFunctionReturns[u].returns === "List") {
                                        results.lists = 4;
                                    }
                                    if (userFunctionReturns[u].returns === "Int") {
                                        results.ints = 3;
                                    }
                                    if (userFunctionReturns[u].returns === "Float") {
                                        results.floats = 3;
                                    }
                                    if (userFunctionReturns[u].returns === "Bool") {
                                        results.booleans = 3;
                                    }


                                    if (originality && userFunctionReturns[u].indexAndInput.indexed) {
                                        results.lists = 4;
                                    }
                                    if (originality && userFunctionReturns[u].indexAndInput.strIndexed) {
                                        results.strings = 4;
                                    }
                                }


                                if (userFunctionReturns[u].containedValue != null) {
                                    for (var cv = 0; cv < userFunctionReturns[u].containedValue.length; cv++) {
                                        if (userFunctionReturns[u].containedValue[cv] === "Str") {
                                            results.strings = 3;
                                        }
                                        if (userFunctionReturns[u].containedValue[cv] === "List") {
                                            results.lists = 4;
                                        }
                                        if (userFunctionReturns[u].containedValue[cv] === "Int") {
                                            results.ints = 3;
                                        }
                                        if (userFunctionReturns[u].containedValue[cv] === "Float") {
                                            results.floats = 3;
                                        }
                                        if (userFunctionReturns[u].containedValue[cv] === "Bool") {
                                            results.booleans = 3;
                                        }
                                    }
                                }
                                if (userFunctionReturns[u].opsDone != null) {
                                    appendArray(opsBeforeLine(userFunctionReturns[u].opsDone, node.lineno, "func", userFunctionReturns[u]), opsUsed);
                                }
                            }
                        }

                        if (inputTaken) {
                            results.consoleInput = 3;
                        }

                    }
                    var varInput = false;

                    //node iter is a function call
                    if ('func' in nodeIter) {

                        //get function name
                        var iterFuncName = "";
                        if ('id' in nodeIter.func) {
                            iterFuncName = nodeIter.func.id.v;
                        }
                        else if ('attr' in nodeIter.func) {
                            iterFuncName = nodeIter.func.attr.v;
                        }
                        else if (nodeIter.func._astname === "Subscript") {
                            var iterNameNode = retrieveFromList(nodeIter.func);
                            if (iterNameNode._astname === "Name") {
                                iterFuncName = iterNameNode.id.v;
                            }

                            var varsIn = [];
                            getNestedVariables(nodeIter.func, varsIn);

                            var anyOriginal = originality;
                            if (!anyOriginal) {
                                for (var varIn = 0; varIn < varsIn.length; varIn++) {
                                    if (getVariableObject(varsIn[varIn]) != null && getVariableObject(varsIn[varIn]).original) {
                                        anyOriginal = true;
                                        break;
                                    }
                                }
                            }
                            if (anyOriginal && varsIn.length > 0) {
                                purposeVars = true;
                            }
                        }
                        //is it a call to function with a nested variable? let us check
                        var iterArgFunc = getFunctionObject(iterFuncName);
                        if (iterArgFunc != null && iterArgFunc.nested != null && iterArgFunc.nested) {
                            purposeVars = true;
                        }

                        for (var t = 0; t < nodeIter.args.length; t++) {
                            if (nodeIter.args[t]._astname === "Name") {
                                var argVar = getVariableObject(nodeIter.args[t].id.v);
                                //get input and indexing

                                if (argVar != null) {

                                    if (argVar.indexAndInput.input) {
                                        varInput = true;
                                    }
                                    if (argVar.indexAndInput.indexed && (argVar.original || originality)) {
                                        results.lists = 4;
                                    }
                                    if (argVar.indexAndInput.strIndexed && (argVar.original || originality)) {
                                        results.strings = 4;
                                    }

                                    //update results

                                    if (argVar.opsDone != null) {
                                        var argOps = opsBeforeLine(argVar.opsDone, node.lineno, "var", argVar);


                                        for (var op = 0; op < argOps.length; op++) {
                                            if (!opsUsed.includes(argOps[op])) { opsUsed.push(argOps[op]); }
                                            if (argOps[op] === "BinOp" || argOps[op] === "AugAssign") {
                                                results.mathematicalOperators = 3;
                                            }
                                            if (argOps[op] === "BoolOp") {
                                                results.boolOps = 3;
                                            }
                                            if (argOps[op] === "StrOp") {
                                                results.strOps = 3;
                                            }
                                            if (argOps[op] === "ListOp") {
                                                results.listOps = 3;
                                            }
                                            if (argOps[op] === "Compare") {
                                                results.comparisons = 3;
                                            }
                                        }
                                    }
                                }
                            }

                            //if it's a binop, boolop, list, or call we grab the contained values. We also need to get contained BoolOps.
                            if (nodeIter.args[t]._astname === "Compare" || nodeIter.args[t]._astname === "BoolOp" || nodeIter.args[t]._astname === "List" || nodeIter.args[t]._astname === "BoolOp") {

                                if (nodeIter.args[t]._astname === "Compare" && originality) {
                                    results.comparisons = 3;
                                }
                                if (getIndexingInNode(nodeIter.args[t])[0] && (originality || getIndexingInNode(nodeIter.args[t])[1])) {
                                    results.lists = 4;
                                }
                                if (getStringIndexingInNode(nodeIter.args[t])[0] && (originality || getStringIndexingInNode(nodeIter.args[t])[1])) {
                                    results.strings = 4;
                                }

                                var allNamesWithin = [];
                                getNestedVariables(nodeIter.args[t], allNamesWithin);


                                //if ANY of these is marked as original, assignment counts as original
                                var originalAssign = false
                                for (var n = 0; n < allNamesWithin.length; n++) {
                                    var nestedVar = getVariableObject(allNamesWithin[n]);
                                    if (nestedVar != null) {
                                        var containedVal = nestedVar.value;
                                        if (nestedVar.indexAndInput.input) {
                                            varInput = true;
                                        }

                                        //update results
                                        if (nestedVar.original || originality) {
                                            if (varInput && results.consoleInput < 3) {
                                                results.consoleInput = 3;
                                            }
                                            if (containedVal === "List" && results.lists < 3) {
                                                results.lists = 3;
                                            }
                                            if (containedVal === "Bool" && results.booleans < 3) {
                                                results.bools = 3;
                                            }
                                            if (containedVal === "Str" && results.strings < 3) {
                                                results.strings = 3;
                                            }
                                            if (containedVal === "Int" && results.ints < 3) {
                                                results.ints = 3;
                                            }
                                            if (containedVal === "Float") {
                                                results.floats = 3;
                                            }
                                            if (nestedVar.opsDone != null) {
                                                appendArray(opsBeforeLine(nestedVar.opsDone, node.lineno, "var", nestedVar), opsUsed);
                                            }
                                        }
                                    }
                                }

                                if (allNamesWithin.length > 0 && (originalAssign || originality) && (results.variables < 3)) {
                                    results.variables = 3;
                                }
                            }
                            if (nodeIter.args[t]._astname === "Subscript") {
                                if (nodeIter.args[t].slice._astname === "Index" || nodeIter.args[t].slice._astname === "Slice") {
                                    if (nodeIter.args[t].value._astname === "List") {
                                        results.lists = 4;
                                    }
                                    if (nodeIter.args[t].value._astname === "Subscript" && (getNestedIndexing(nodeIter.args[t].value))) {
                                        results.lists = 4;
                                    }
                                    if (nodeIter.args[t].value._astname === "BinOp" && Array.isArray(recursivelyAnalyzeBinOp(nodeIter.args[t].value))) {
                                        results.lists = 4;
                                    }

                                    if (nodeIter.args[t].value._astname === "Call") {
                                        if (doesCallCreateList(nodeIter.args[t].value)) {
                                            results.lists = 4;
                                        }
                                        else if ('id' in nodeIter.args[t].value && (getFunctionObject(nodeIter.args[t].value.id.v) != null && getFunctionObject(nodeIter.args[t].value.id.v).returns === "List")) {
                                            results.lists = 4;
                                        }
                                    }

                                    if (nodeIter.args[t].value._astname === "Name" && (getVariableObject(nodeIter.args[t].value.id.v).value === "List")) {
                                        results.lists = 4;
                                    }

                                    //is it a string?
                                    if (nodeIter.args[t].value._astname === "Str") {
                                        results.strings = 4;
                                    }
                                    if (nodeIter.args[t].value._astname === "Subscript" && getstringIndexing(nodeIter.args[t].value)) {
                                        results.strings = 4;
                                    }
                                    if (nodeIter.args[t].value._astname === "BinOp" && recursivelyAnalyzeBinOp(nodeIter.args[t].value) === "Str") {
                                        results.strings = 4;
                                    }
                                    if (nodeIter.args[t].value._astname === "Call") {
                                        if (doesCallCreateString(nodeIter.args[t].value)) {
                                            results.strings = 4;
                                        }
                                        if (getFunctionObject(nodeIter.args[t].value.id.v) != null && getFunctionObject(nodeIter.args[t].value.id.v).returns === "Str") {
                                            results.strings = 4;
                                        }
                                    }
                                    if (nodeIter.args[t].value._astname === "Name") {
                                        var iterArgVar = getVariableObject(nodeIter.args[t].value.id.v);

                                        if (iterArgVar != null && iterArgVar.value === "Str") {
                                            results.strings = 4;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    //iterating over a list
                    if (nodeIter._astname === "List") {
                        var listVars = [];
                        listVars = getNestedVariables(nodeIter, listVars);

                        if (getIndexingInNode(nodeIter)[0] && originality) {
                            results.lists = 4;
                        }
                        if (getStringIndexingInNode(nodeIter)[0] && originality) {
                            results.strings = 4;
                        }


                        for (var m = 0; m < listVars.length; m++) {
                            var listVariable = getVariableObject(listVars[m]);
                            if (listVariable != null) {

                                //var init
                                var argModded = false;
                                var modOriginality = false;
                                var insideOutside = "outside"; //this will get set to "inside" if this call is within another function
                                var insideLines = [-1, -1];


                                //is the use inside or outside a function?
                                for (var n = 0; n < listVariable.modifyingFunctions.length; n++) {
                                    if (node.lineno >= listVariable.modifyingFunctions[n][0] && node.lineno <= listVariable.modifyingFunctions[n][1]) {
                                        insideOutside = "inside";
                                        insideLines = listVariable.modifyingFunctions[n];
                                        break;
                                    }
                                }
                                if (insideOutside === "outside") {
                                    insideLines = [];
                                    for (var n = 0; n < listVariable.modifyingFunctions.length; n++) {
                                        for (var line = listVariable.modifyingFunctions[n][0]; line <= listVariable.modifyingFunctions[n][1]; line++) {
                                            insideLines.push(line);
                                        }
                                    }
                                }
                                var numberOfMods = 0;
                                for (var z = 0; z < allVariables[m].assignedModified.length; z++) {
                                    if (allVariables[m].assignedModified[z].line > node.lineno) { break; } //stop loop before we get to the current line OR if both thigns we're looking for are already set to true.

                                    //is there a modification? is it original?
                                    if ((insideOutside === "inside" && node.lineno >= insideLines[0] && node.lineno <= insideLines[1]) || (insideOutside === "outside" && !insideLines.includes(node.lineno))) {
                                        argModded = true;
                                        numberOfMods += 1;
                                        if (allVariables[m].assignedModified[z].original) { modOriginality = true; }
                                    }
                                }

                                //update results
                                if (argModded && (originality || modOriginality) && ((insideOutside === "outside" && numberOfMods > 1) || (insideOutside === "inside" && numberOfMods > 0))) {
                                    results.variables = 4;
                                }
                                if (allVariables[a].nested && (results.variables < 3) && (originality || allVariables[a].original)) {
                                    results.variables = 3;
                                }
                            }
                        }
                    }

                    //this is separate becuase even if THIS isn't original, something inside it may be
                    //it could be a string or list/array that's being iterated over, so check for those and update accordingly
                    if (nodeIter._astname === "Subscript") {
                        if (nodeIter.slice._astname === "Index") {
                            if (nodeIter.value._astname === "List") {
                                results.lists = 4;
                            }
                            if (nodeIter.value._astname === "Str") {
                                results.strings = 4;
                            }


                            if (nodeIter.value._astname === "Subscript") {
                                if (getNestedIndexing(nodeIter.value)[0]) {
                                    results.lists = 4;
                                }
                                if (getStringIndexingInNode(nodeIter.value)[0]) {
                                    results.strings = 4;
                                }
                            }

                            if (nodeIter.value._astname === "BinOp") {
                                if (Array.isArray(recursivelyAnalyzeBinOp(nodeIter.value))) {
                                    results.lists = 4;
                                }

                                if (recursivelyAnalyzeBinOp(nodeIter.value) === "Str") {
                                    var anyOriginality = false;
                                    if (originality) {
                                        anyOriginality = true;
                                    }

                                    else {
                                        var allVarsIn = [];
                                        getNestedVariables(nodeIter.value, allVarsIn);
                                        for (var o = 0; o < allVarsIn.length; o++) {
                                            if (getVariableObject(allVarsIn[o]).original) {
                                                anyOriginality = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (anyOriginality) {
                                        results.strings = 4;
                                    }
                                }
                            }
                            if (nodeIter.value._astname === "Call") {
                                //is it a listop, concat binop, OR a UDF that returns a list
                                if (originality) {
                                    if (doesCallCreateList(nodeIter.value)) {
                                        results.lists = 4;
                                    }
                                    if ('id' in nodeIter.value && getFunctionObject(nodeIter.value.id.v) != null && getFunctionObject(nodeIter.value.id.v).returns === "List") {
                                        results.lists = 4;
                                    }

                                    //is it a string op
                                    if (doesCallCreateString(nodeIter.value)) { results.strings = 4; }
                                    if ('id' in nodeIter.value && getFunctionObject(nodeIter.value.id.v) != null && getFunctionObject(nodeIter.value.id.v).returns === "Str") {
                                        results.lists = 4;
                                    }
                                }

                                //is it a UDF and what does it return
                                if ('func' in nodeIter.value) {

                                    var isUserFunc = null;
                                    isUserFunc = getFunctionObject(nodeIter.value.func.id.v);

                                    if (isUserFunc != null) {
                                        if (isUserFunc.returns === "List" && (originality || isUserFunc.original)) {
                                            results.lists = 4;
                                        }
                                        else if (isUserFunc.returns === "Str" && (originality || isUserFunc.original)) {
                                            results.strings = 4;
                                        }
                                    }
                                }
                            }
                            if (nodeIter.value._astname === "Name") {
                                //is it indexing a variable that contains a list?
                                if (getVariableObject(nodeIter.value.id.v).value === "List" && (originality || getVariableObject(nodeIter.value.id.v).original)) {
                                    results.lists = 4;
                                }
                                if (getVariableObject(nodeIter.value.id.v).value === "Str" && (originality || getVariableObject(nodeIter.value.id.v).original)) {
                                    results.strings = 4;
                                }
                            }
                        }
                    }
                }

                if (node._astname === "While") {
                    var testItem = node.test;

                    if (testItem._astname === "UnaryOp") {
                        var anyOr = originality;
                        if (!originality) {
                            var unaryNames = [];
                            getNestedVariables(testItem, unaryNames);
                            for (var p in unaryNames) {
                                var isVar = getVariableObject(unaryNames[p]);
                                if (isVar != null && isVar.original) {
                                    anyOr = true;
                                    break;
                                }
                            }
                        }
                        if (anyOr) { results.booleans = 3; }
                        testItem = testItem.operand;
                    }

                    if (testItem._astname === "Subscript" && (testItem.slice._astname === "Index" || testItem.slice._astname === "Slice")) {

                        //is the thing we're indexing a list?

                        if (testItem.value._astname === "List") {
                            results.lists = 4;
                        }
                        if (testItem.value._astname === "Subscript" && getNestedIndexing(testItem.value)) {
                            results.lists = 4;
                        }
                        if (testItem.value._astname === "BinOp" && Array.isArray(recursivelyAnalyzeBinOp(testItem.value))) {
                            results.lists = 4;
                        }
                        if (testItem.value._astname === "Call") {
                            //is it a listop, concat binop, OR a UDF that returns a list
                            if (doesCallCreateList(testItem.value)) {
                                results.lists = 4;
                            }
                            else if ('id' in testItem.func) {
                                var calledFunc = getUserFunctionReturn(testItem.func.id.v);
                                if (calledFunc != null && calledFunc.returns === "List") {
                                    results.lists = 4;
                                }
                            }
                        }
                        if (testItem.value._astname === "Name" && getVariableObject(testItem.value.id.v).value === "List") {
                            results.lists = 4;
                        }
                    }
                    testItem = retrieveFromList(testItem);

                    if (testItem._astname === "UnaryOp") {
                        var anyOr = originality;
                        if (!originality) {
                            var unaryNames = [];
                            getNestedVariables(testItem, unaryNames);
                            for (var p in unaryNames) {
                                var isVar = getVariableObject(unaryNames[p]);
                                if (isVar != null && isVar.original) {
                                    anyOr = true;
                                    break;
                                }
                            }
                        }
                        if (anyOr) {
                            results.booleans = 3;
                        }
                        testItem = testItem.operand;
                    }

                    //won't get automatically analyzed
                    recursiveAnalyzeAST(testItem, results, loopParent);


                    if (testItem._astname === "Call") {

                        //get the function name
                        var funcName = "";
                        var argList = [];
                        if ('id' in testItem.func) {
                            funcName = testItem.func.id.v;
                            argList = testItem.args;
                        }
                        else {
                            funcName = testItem.func.attr.v;
                        }

                        //input or ops used?
                        if (funcName === 'readInput') {
                            inputUsed = true;
                        }
                        if (listFuncs.indexOf(funcName) > -1 && originality) {
                            lists = true;
                            if (!opsUsed.includes("ListOp")) {
                                opsUsed.push("ListOp");
                            }
                        }
                        else if (strFuncs.indexOf(funcName) > -1 && originality) {
                            strings = true;
                            if (!opsUsed.includes("StrOp")) {
                                opsUsed.push("StrOp");
                            }
                        }
                        else if (getFunctionObject(funcName).indexAndInput.indexed && (originality || getFunctionObject(funcName).original)) {
                            results.lists = 4;
                        }

                        //get the rturn value
                        var callReturnVal = "";
                        var calledFunc = getFunctionObject(funcName);

                        if (calledFunc != null) {
                            callReturnVal = calledFunc.returns;

                            if (calledFunc.containedValue != null) {
                                for (var c = 0; c < calledFunc.containedValue.length; c++) {
                                    var returnElement = calledFunc.containedValue[c];
                                    if (returnElement === "Str") {
                                        strings = true;
                                    }
                                    if (returnElement === "Int") {
                                        ints = true;
                                    }
                                    if (returnElement === "Float") {
                                        floats = true;
                                    }
                                    if (returnElement === "Bool") {
                                        bools = true;
                                    }
                                }
                            }

                            if (calledFunc.indexAndInput.input) {
                                inputUsed = true;
                            }
                            if (originality && calledFunc.indexAndInput.indexed) {
                                results.lists = 4;
                            }
                            if (originality && calledFunc.indexAndInput.strIndexed) {
                                results.strings = 4;
                            }
                            if (calledFunc.nested) {
                                purposeVars = true;
                            }
                            if (calledFunc.opsDone != null && originality) {
                                appendArray(opsBeforeLine(calledFunc.opsDone, node.lineno, "func", calledFunc), opsUsed);
                            }
                        }

                        if (callReturnVal === "Str") {
                            strings = true;
                        }
                        if (callReturnVal === "Int") {
                            ints = true;
                        }
                        if (callReturnVal === "Float") {
                            floats = true;
                        }
                        if (callReturnVal === "Bool") {
                            bools = true;
                        }
                        if (callReturnVal === "List") {
                            lists = true;
                        }
                    }

                    //now, if it's something that has values within it, we chack through that
                    if (testItem._astname === "Compare" || testItem._astname === "List" || testItem._astname === "BinOp" || testItem._astname === "BoolOp") {
                        //var init
                        var allTypes = [];
                        var useInput = {
                            input: false,
                            indexed: false,
                            strIndexed: false
                        };
                        var operations = [];


                        listTypesWithin(testItem, allTypes, useInput, operations);
                        appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);


                        if (testItem._astname === "Compare" && originality) {
                            results.comparisons = 3;
                        }
                        for (var insideType = 0; insideType < allTypes.length; insideType++) {
                            if (originality) {
                                if (useInput.input && results.consoleInput < 3) {
                                    results.consoleInput = 3;
                                }
                                if (allTypes[insideType] === "Str" && results.strings < 3) {
                                    results.strings = 3;
                                }
                                if (allTypes[insideType] === "Int") {
                                    results.ints = 3;
                                }
                                if (allTypes[insideType] === "Bool") {
                                    results.booleans = 3;
                                }
                                if (allTypes[insideType] === "Float") {
                                    results.floats = 3;
                                }
                                if (allTypes[insideType] === "List" && (results.lists < 3)) {
                                    results.lists = 3;
                                }
                            }
                        }

                        var nestedVars = getNestedVariables(testItem, []);
                        var anyOriginality = false;

                        for (var i = 0; i < nestedVars.length; i++) {
                            var nestVar = getVariableObject(nestedVars[i]);
                            if (nestVar != null && nestVar.original) {
                                anyOriginality = true;
                                break;
                            }
                        }
                        if (anyOriginality || anyOriginality) {
                            if (useInput.input) {
                                results.lists = 4;
                            }
                            if (useInput.strIndexed) {
                                results.strings = 4;
                            }
                            if (useInput.indexed) {
                                results.lists = 4;
                            }
                        }
                    }

                    if (testItem._astname === "Call") {
                        if ('func' in testItem) {
                            if (originality) {
                                var functionName = testItem.func.id.v;
                                var testFunc = getFunctionObject(functionName);
                                if (testFunc != null) {
                                    if (testFunc.nested) {
                                        purposeVars = true;
                                    }
                                    if (testFunc.opsDone != null) {
                                        var testOps = opsBeforeLine(testFunc.opsDone, node.lineno, "func", testFunc);
                                        for (var op = 0; op < testOps.length; op++) {
                                            if (testOps[op] === "BinOp" || testOps[op] === "AugAssign") {
                                                results.mathematicalOperators = 3;
                                            }
                                            if (testOps[op] === "BoolOp") {
                                                results.boolOps = 3;
                                            }
                                            if (testOps[op] === "StrOp") {
                                                results.strOps = 3;
                                            }
                                            if (testOps[op] === "ListOp") {
                                                results.listOps = 3;
                                            }
                                            if (testOps[op] === "Compare") {
                                                results.comparisons = 3;
                                            }
                                        }
                                    }
                                    //input
                                    if (testFunc.indexAndInput.input && originality) {
                                        results.consoleInput = 3;
                                    }
                                    if (testFunc.indexAndInput.indexed) {
                                        results.lists = 4;
                                    }
                                    if (testFunc.indexAndInput.strIndexed) {
                                        results.lists = 4;
                                    }


                                    //contained values
                                    if (testFunc.containedValue != null) {
                                        for (var c = 0; c < testFunc.containedValue.length; c++) {
                                            var varType = testFunc.containedValue[c];
                                            if (varType === "Str" && results.strings < 3) {
                                                results.strings = 3;
                                            }
                                            if (varType === "Int") {
                                                results.ints = 3;
                                            }
                                            if (varType === "Float") {
                                                results.floats = 3;
                                            }
                                            if (varType === "Bool") {
                                                results.booleans = 3;
                                            }
                                            if (varType === "List" && (results.lists < 3)) {
                                                results.lists = 3;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    //if the test is a variable
                    if (testItem._astname === "Name") {
                        var argVar = getVariableObject(testItem.id.v);
                        if (argVar != null) {
                            var varInput = false;
                            if (argVar.indexAndInput.input) {
                                varInput = true;
                            }
                            var assignOriginal = argVar.original;


                            if (originality || assignOriginal) {
                                if (argVar.indexAndInput.indexed) {
                                    results.lists = 4;
                                }
                                if (argVar.indexAndInput.strIndexed) {
                                    results.strings = 4;
                                }
                                var varType = argVar.value;

                                var contained = argVar.containedValue;

                                if (varInput && results.consoleInput < 3) {
                                    results.consoleInput = 3;
                                }
                                if (results.variables < 3) {
                                    results.variables = 3;
                                }

                                if (argVar.opsDone != null) {
                                    appendArray(opsBeforeLine(argVar.opsDone, node.lineno, "var", argVar), opsUsed);
                                }

                                if (varType === "Str" && results.strings < 3) {
                                    results.strings = 3;
                                }
                                if (varType === "Int") {
                                    results.ints = 3;
                                }
                                if (varType === "Float") {
                                    results.floats = 3;
                                }
                                if (varType === "Bool") {
                                    results.booleans = 3;
                                }
                                if (varType === "List" && (results.lists < 3)) {
                                    results.lists = 3;
                                }

                                if (contained.length > 0) {
                                    for (var v = 0; v < contained.length; v++) {
                                        var containedTypeValue = contained[v];

                                        if (containedTypeValue === "Str" && results.strings < 3) {
                                            results.strings = 3;
                                        }
                                        if (containedTypeValue === "Int") {
                                            results.ints = 3;
                                        }
                                        if (containedTypeValue === "Float") {
                                            results.floats = 3;
                                        }
                                        if (containedTypeValue === "Bool") {
                                            results.booleans = 3;
                                        }
                                        if (containedTypeValue === "List" && (results.lists < 3)) {
                                            results.lists = 3;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    //orrrrr if it's a binop, boolop, list, or call we grab the contained values. wheeee.
                    if (testItem._astname === "Compare" || testItem._astname === "BoolOp" || testItem._astname === "List" || testItem._astname === "BoolOp") {
                        if (testItem._astname === "Compare" && originality) {
                            results.comparisons = 3;
                        }

                        //oh we need variable NAMEs hrngh
                        var allNamesWithin = [];
                        getNestedVariables(testItem, allNamesWithin);

                        //if ANY of these is marked as original, assignment counts as original
                        var originalAssign = false;
                        var varInput = false;

                        for (var n = 0; n < allNamesWithin.length; n++) {
                            var testVariable = getVariableObject(allNamesWithin[n]);
                            if (testVariable != null) {
                                var containedVal = testVariable.value;
                                if (testVariable.indexAndInput.input) { varInput = true; }
                                var containedValList = testVariable.containedValue;
                                if (testVariable.original) { originalAssign = true; }



                                //update results
                                if (testVariable.original || originality) {
                                    if (varInput && results.consoleInput < 3) {
                                        results.consoleInput = 3;
                                    }
                                    if (containedVal === "List" && results.lists < 3) {
                                        results.lists = 3;
                                    }
                                    if (containedVal === "Bool" && results.booleans < 3) {
                                        results.booleans = 3;
                                    }
                                    if (containedVal === "Str" && results.strings < 3) {
                                        results.strings = 3;
                                    }
                                    if (containedVal === "Int" && results.ints < 3) {
                                        results.ints = 3;
                                    }
                                    if (containedVal === "Float") {
                                        results.floats = 3;
                                    }
                                    if (containedValList.length > 0) {
                                        for (var v = 0; v < containedValList.length; v++) {
                                            var containedItem = containedValList[v];
                                            if (containedItem === "List" && results.lists < 3) {
                                                results.lists = 3;
                                            }
                                            if (containedItem === "Bool" && results.booleans < 3) {
                                                results.booleans = 3;
                                            }
                                            if (containedItem === "Str" && results.strings < 3) {
                                                results.strings = 3;
                                            }
                                            if (containedItem === "Int" && results.ints < 3) {
                                                results.ints = 3;
                                            }
                                            if (containedItem === "Float") {
                                                results.floats = 3;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (allNamesWithin.length > 0 && (originalAssign || originality)) {
                            if (results.variables < 3) {
                                results.variables = 3;
                            }
                        }
                    }
                }

                if (node._astname === "Return") {
                    //datatypes are already covered as return value from calls. 
                    //functions are already covered where they are called
                    //ops are included in function calls
                    //this is only for variables. 
                    var nodeValue = node.value;
                    if (nodeValue != null) {
                        if (nodeValue._astname === "UnaryOp") {
                            var anyOr = originality;
                            if (!originality) {
                                var unaryNames = [];
                                getNestedVariables(nodeValue, unaryNames);
                                for (var p in unaryNames) {
                                    var isVar = getVariableObject(unaryNames[p]);
                                    if (isVar != null && isVar.original) {
                                        anyOr = true;
                                        break;
                                    }
                                }
                            }
                            if (anyOr) {
                                results.booleans = 3;
                            }
                            nodeValue = nodeValue.operand;
                        }
                        //handle subscript and unaryops
                        if (nodeValue._astname === "Subscript" && (nodeValue.slice._astname === "Index" || nodeValue.slice._astname === "Slice")) {
                            //is the thing we're indexing a list?
                            if (nodeValue.value._astname === "List") {
                                results.lists = 4;
                            }
                            if (nodeValue.value._astname === "Subscript" && getNestedIndexing(nodeValue.value)) {
                                results.lists = 4;
                            }
                            if (nodeValue.value._astname === "BinOp" && Array.isArray(recursivelyAnalyzeBinOp(nodeValue.value))) {
                                results.lists = 4;
                            }
                            if (nodeValue.value._astname === "Call") {  //is it a listop, concat binop, OR a UDF that returns a list
                                if (doesCallCreateList(nodeValue.value)) {
                                    results.lists = 4;
                                }
                                else if ('id' in nodeValue.func) {
                                    var calledFunc = getUserFunctionReturn(nodeValue.func.id.v);
                                    if (calledFunc != null && calledFunc.returns === "List") {
                                        results.lists = 4;
                                    }
                                }
                            }
                            if (nodeValue.value._astname === "Name" && getVariableObject(nodeValue.value.id.v) != null && getVariableObject(nodeValue.value.id.v).value === "List") {
                                results.lists = 4;
                            }
                        }

                        nodeValue = retrieveFromList(nodeValue);

                        if (nodeValue != null && nodeValue._astname === "UnaryOp") {
                            var anyOr = originality;
                            if (!originality) {
                                var unaryNames = [];
                                getNestedVariables(nodeValue, unaryNames);
                                for (var p in unaryNames) {
                                    var isVar = getVariableObject(unaryNames[p]);
                                    if (isVar != null && isVar.original) {
                                        anyOr = true;
                                        break;
                                    }
                                }
                            }
                            if (anyOr) {
                                results.booleans = 3;
                            }
                            nodeValue = nodeValue.operand;
                        }

                        //now, get the variable value and contained info
                        if (nodeValue != null && nodeValue._astname === "Name" && nodeValue.id.v !== "True" && nodeValue.id.v !== "False") {

                            //var init
                            var argModded = false;
                            var modOriginality = false;
                            var modString = "";
                            var insideOutside = "outside"; //this will get set to "inside" if this call is within another function
                            var insideLines = [-1, -1];
                            var assignOriginality = false;
                            var varType = "";
                            var varInput = false;

                            var otherVar = getVariableObject(nodeValue.id.v);
                            if (otherVar != null) {
                                var numberOfMods = 0;
                                //ops done
                                if (otherVar.opsDone != null && (otherVar.original || originality)) {
                                    var otherVarOps = opsBeforeLine(otherVar.opsDone, node.lineno, "var", otherVar);
                                    appendArray(otherVarOps, opsUsed);
                                }
                                //is the use inside or outside a function?
                                for (var n = 0; n < otherVar.modifyingFunctions.length; n++) {
                                    if (node.lineno >= otherVar.modifyingFunctions[n][0] && node.lineno <= otherVar.modifyingFunctions[n][1]) {
                                        insideLines = otherVar.modifyingFunctions[n];
                                        break;
                                    }
                                }
                                for (var z = 0; z < otherVar.assignedModified.length; z++) {
                                    if (otherVar.assignedModified[z].line > node.lineno) { break; } //stop loop before we get to the current line OR if both thigns we're looking for are already set to true.

                                    //is there a modification? is it original? is it inside/outside the function as appropriate?
                                    if (otherVar.assignedModified[z].line <= node.lineno) {
                                        if ((insideOutside === "inside" && node.lineno >= insideLines[0] && node.lineno <= insideLines[1]) || (insideOutside === "outside" && !insideLines.includes(node.lineno))) {
                                            argModded = true;
                                            numberOfMods += 1;
                                            if (otherVar.assignedModified[z].original) { modOriginality = true; }
                                        }
                                    }
                                }


                                varType = otherVar.value;
                                varInput = otherVar.indexAndInput.input;

                                //update results
                                if (argModded && (originality || modOriginality) && ((insideOutside === "outside" && numberOfMods > 1) || (insideOutside === "inside" && numberOfMods > 0))) {
                                    results.variables = 4;
                                }


                                if (otherVar.original || originality) {
                                    if (varInput && results.consoleInput < 3) {
                                        results.consoleInput = 3;
                                    }
                                    if (results.variables < 3) {
                                        results.variables = 3;
                                    }
                                    if (varType === "List" && results.lists < 3) {
                                        results.lists = 3;
                                    }
                                    if (varType === "Bool" && (results.bools === "Does Not Use" || results.bools === 1 || results.bools === 2)) {
                                        results.bools = 3;
                                    }
                                    if (varType === "Str" && results.strings < 3) {
                                        results.strings = 3;
                                    }
                                    if (varType === "Int") {
                                        results.ints = 3;
                                    }
                                    if (varType === "Float") {
                                        results.floats = 3;
                                    }
                                }
                            }
                        }
                    }
                }
                //look for "vars for a purpose" in subscript nodes
                if (node._astname === "Subscript") {
                    var nodesToCheck = [];
                    if (node.slice._astname === "Index") {
                        nodesToCheck.push(node.slice.value);
                    }
                    else if (node.slice._astname === "Slice") {
                        nodesToCheck.push(node.slice.lower);
                        nodesToCheck.push(node.slice.upper);
                    }


                    for (var e in nodesToCheck) {
                        var nodeToCheck = nodesToCheck[e];
                        if (retrieveFromList(nodeToCheck) != nodeToCheck) {
                            var varsIn = [];
                            nodeToCheck = retrieveFromList(nodeToCheck);
                            if (nodeToCheck != null) {
                                getNestedVariables(nodeToCheck, varsIn);
                                var anyOriginality = originality;
                                if (!anyOriginality) {
                                    for (var varIn = 0; varIn < varsIn.length; varIn++) {
                                        if (getVariableObject(varsIn[varIn]) != null && getVariableObject(varsIn[varIn]).original) {
                                            anyOriginality = true;
                                            break;
                                        }
                                    }
                                }
                                if (varsIn.length > 0 && anyOriginality) {
                                    purposeVars = true;
                                }
                            }
                        }

                        if (nodeToCheck != null) {
                            if (nodeToCheck._astname === "Subscript") {
                                if (originality) {
                                    var isIndexedItem = false;
                                    if (getStringIndexingInNode(nodeToCheck)[0]) {
                                        results.strings = 4;
                                    }

                                    if (nodeToCheck.slice._astname === "Index") {

                                        //is the thing we're indexing a list?
                                        if (nodeToCheck.value._astname === "List") {
                                            isIndexedItem = true;
                                        }
                                        if (nodeToCheck.value._astname === "Subscript" && (getNestedIndexing(nodeToCheck.value))) {
                                            isIndexedItem = true;
                                        }
                                        if (nodeToCheck.value._astname === "BinOp") {
                                            if (Array.isArray(recursivelyAnalyzeBinOp(nodeToCheck.value))) {
                                                isIndexedItem = true;
                                            }
                                        }
                                        if (nodeToCheck.value._astname === "Call") {
                                            //is it a listop, OR a UDF that returns a list
                                            if (doesCallCreateList(nodeToCheck.value)) {
                                                isIndexedItem = true;
                                            }
                                            else if ('id' in nodeToCheck.value.func) {
                                                var funcList = getFunctionObject(nodeToCheck.value.func.id.v);
                                                if (funcList != null && funcList.returns === "List") {
                                                    isIndexedItem = true;
                                                }
                                            }
                                        }
                                        if (nodeToCheck.value._astname === "Name") {
                                            isIndexedItem = (getVariableObject(nodeToCheck.value.id.v).value === "List");
                                        }
                                    }

                                    if (isIndexedItem) {
                                        results.lists = 4;
                                    }
                                }

                                //get any variables nested inside
                                var varsIn = [];
                                getNestedVariables(nodeToCheck, varsIn);
                                var anyOriginality = originality;
                                if (!anyOriginality) {
                                    for (var varIn = 0; varIn < varsIn.length; varIn++) {
                                        if (getVariableObject(varsIn[varIn]) != null && getVariableObject(varsIn[varIn]).original) {
                                            anyOriginality = true;
                                            break;
                                        }
                                    }
                                }
                                if (varsIn.length > 0 && anyOriginality) { purposeVars = true; }
                                nodeToCheck = retrieveFromList(nodeToCheck);
                            }

                            //the node is a function call
                            if (nodeToCheck._astname === "Call") {
                                var lineNumberToUse = node.lineno;
                                if (doesCallCreateList(node) || doesCallCreateString(node)) {
                                    lineNumberToUse = node.lineno - 1;
                                }

                                // get the function name
                                var funcName = "";
                                var argFunc = nodeToCheck.func;
                                argFunc = retrieveFromList(argFunc);

                                if ('id' in argFunc) {
                                    funcName = argFunc.id.v;
                                }
                                else if ('attr' in argFunc) {
                                    funcName = argFunc.attr.v;
                                }

                                //get ops and input
                                if (listFuncs.includes(funcName)) {
                                    lists = true;
                                    if (!opsUsed.includes("ListOp")) {
                                        opsUsed.push("ListOp");
                                    }
                                }
                                if (strFuncs.includes(funcName)) {
                                    strings = true;
                                    if (!opsUsed.includes("StrOp")) {
                                        opsUsed.push("StrOp");
                                    }
                                }
                                if (funcName === "readInput") {
                                    results.consoleInput = 3;
                                }

                                var funcReturn = "";
                                var returnContains = [];


                                var funcItem = getFunctionObject(funcName);

                                //update results
                                if (funcItem != null) {
                                    funcReturn = funcItem.returns;
                                    if (funcItem.containedValue != null) {
                                        returnContains = funcItem.containedValue;
                                    }
                                    if (funcItem.nested) {
                                        purposeVars = true;
                                    }
                                    if (funcItem.indexAndInput != null && funcItem.indexAndInput.indexed) {
                                        results.lists = 4;
                                    }
                                    if (funcItem.indexAndInput != null && funcItem.indexAndInput.strIndexed) {
                                        results.strings = 4;
                                    }
                                    if (funcItem.opsDone != null) {
                                        var opsUsedList = opsBeforeLine(funcItem.opsDone, lineNumberToUse, "func", funcItem);
                                        appendArray(opsUsedList, opsUsed);
                                    }
                                }

                                if (funcReturn === "Str" && results.strings < 3) {
                                    results.strings = 3;
                                }
                                if (funcReturn === "Int") {
                                    results.ints = 3;
                                }
                                if (funcReturn === "Float") {
                                    results.floats = 3;
                                }
                                if (funcReturn === "Bool") {
                                    results.booleans = 3;
                                }
                                if (funcReturn === "List" && (results.lists < 3)) {
                                    results.lists = 3;
                                }

                                if (returnContains != null) {
                                    for (var ret = 0; ret < returnContains.length; ret++) {
                                        var funcReturnCont = returnContains[ret];
                                        if (funcReturnCont === "Str" && results.strings < 3) {
                                            results.strings = 3;
                                        }
                                        if (funcReturnCont === "Int") {
                                            results.ints = 3;
                                        }
                                        if (funcReturnCont === "Float") {
                                            results.floats = 3;
                                        }
                                        if (funcReturnCont === "Bool") {
                                            results.booleans = 3;
                                        }
                                        if (funcReturnCont === "List" && (results.lists < 3)) {
                                            results.lists = 3;
                                        }
                                    }
                                }
                            }

                                //basic datatypes
                            else if (nodeToCheck._astname === 'Str') {
                                strings = true;
                            }
                            else if (nodeToCheck._astname === 'Name' && nodeToCheck.id.v != null && (nodeToCheck.id.v === 'True' || nodeToCheck.id.v === 'False')) {
                                bools = true;
                            }
                            else if (nodeToCheck._astname === 'Num') {
                                if (!isNodeFloat(nodeToCheck)) {
                                    ints = true;
                                }
                                else {
                                    floats = true;
                                }
                            }
                            else if (nodeToCheck._astname === 'List') {
                                //if it's a list, we also look at and note all the types in the list as being used for a purpose.
                                lists = true;
                                var listInputIndexing = {
                                    input: false,
                                    indexed: false,
                                    strIndexed: false
                                };
                                var listValues = [];
                                if (originality) {

                                    //check ops and list and string indexing
                                    var operations = [];
                                    listValues = listTypesWithin(nodeToCheck.elts, listValues, listInputIndexing, operations);
                                    appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);

                                    if (listInputIndexing.indexed) {
                                        results.lists = 4;
                                    }
                                    if (listInputIndexing.strIndexed) {
                                        results.strings = 4;
                                    }
                                }
                                else {
                                    listValues = listTypesWithin(nodeToCheck.elts, listValues, {
                                        input: false,
                                        indexed: false,
                                        strIndexed: false
                                    }, []);
                                }

                                //basic datatypes - purpose
                                for (var k = 0; k < listValues.length; k++) {
                                    if (listValues[k] === "Str") {
                                        strings = true;
                                    }
                                    else if (listValues[k] === "Bool") {
                                        bools = true;
                                    }
                                    else if (listValues[k] === "Int") {
                                        ints = true;
                                    }
                                    else if (listValues[k] === "Float") {
                                        floats = true;
                                    }
                                }

                                if (listInputIndexing.input && originality) {
                                    results.consoleInput = 3;
                                }

                                var varsIn = [];
                                getNestedVariables(nodeToCheck, varsIn);

                                var varsIn = [];
                                getNestedVariables(nodeToCheck, varsIn);
                                var anyOriginality = originality;
                                if (!anyOriginality) {
                                    for (var varIn = 0; varIn < varsIn.length; varIn++) {
                                        if (getVariableObject(varsIn[varIn]) != null && getVariableObject(varsIn[varIn]).original) {
                                            anyOriginality = true;
                                            break;
                                        }
                                    }
                                }
                                if (varsIn.length > 0 && anyOriginality) {
                                    purposeVars = true;
                                }
                            }
                            else if (nodeToCheck._astname === 'Name' && nodeToCheck.id.v !== "True" && nodeToCheck.id.v !== "False") {
                                //then it's a variable. look up what's in there.
                                purposeVars = true;


                                var lineNumberToUse = node.lineno;
                                if (doesCallCreateList(node) || doesCallCreateString(node)) {
                                    lineNumberToUse = node.lineno - 1;
                                }

                                var otherVar = getVariableObject(nodeToCheck.id.v);

                                if (otherVar != null) {
                                    var originalAssignment = otherVar.original;
                                    if ((originalAssignment || originality) && otherVar.indexAndInput.indexed) {
                                        results.lists = 4;
                                    }
                                    if ((originalAssignment || originality) && otherVar.indexAndInput.strIndexed) {
                                        results.strings = 4;
                                    }
                                    if ((originalAssignment || originality) && otherVar.opsDone != null) {
                                        var opsUsedInVar = opsBeforeLine(otherVar.opsDone, lineNumberToUse, "var", otherVar);
                                        appendArray(opsUsedInVar, opsUsed);

                                    }

                                    if (otherVar.containedValue != null) {
                                        for (var c = 0; c < otherVar.containedValue.length; c++) {
                                            switch (otherVar.containedValue[c]) {
                                                case "Str":
                                                    strings = true;
                                                    break;
                                                case "Bool":
                                                    bools = true;
                                                    break;
                                                case "Int":
                                                    ints = true;
                                                    break;
                                                case "Float":
                                                    floats = true;
                                                    break;
                                                case "List":
                                                    lists = true;
                                                    break;
                                            }
                                        }
                                    }
                                    switch (otherVar.value) {
                                        case "Str":
                                            strings = true;
                                            break;
                                        case "Bool":
                                            bools = true;
                                            break;
                                        case "Int":
                                            ints = true;
                                            break;
                                        case "Float":
                                            floats = true;
                                            break;
                                        case "List":
                                            lists = true;
                                            if (otherVar.containedValue != null) {
                                                //go through values in list and note those too!
                                                for (var k = 0; k < otherVar.containedValue.length; k++) {
                                                    if (otherVar.containedValue[k] === "Str") {
                                                        strings = true;
                                                    }
                                                    else if (otherVar.containedValue[k] === "Bool") {
                                                        bools = true;
                                                    }
                                                    else if (otherVar.containedValue[k] === "Int") {
                                                        ints = true;
                                                    }
                                                    else if (otherVar.containedValue[k] === "Float") {
                                                        floats = true;
                                                    }
                                                }
                                            }
                                            break;
                                    }
                                }
                            }
                            else if ((nodeToCheck._astname === "BinOp" || nodeToCheck._astname === "BoolOp" || nodeToCheck._astname === "Compare" || nodeToCheck._astname === "List")) {
                                if (getIndexingInNode(nodeToCheck)[0] && (originality || getIndexingInNode(nodeToCheck)[1])) {
                                    results.lists = 4;
                                }
                                if (getStringIndexingInNode(nodeToCheck)[0] && (originality || getStringIndexingInNode(nodeToCheck)[1])) {
                                    results.strings = 4;
                                }
                            }

                            if (nodeToCheck._astname === "BinOp") {
                                // ditto with the BinOp
                                //anything in there counts as used for a purpose 
                                //(e.g. " 'potato' + ' tomato' " passed as an arg amounts to strings used for a purpose.
                                var withinBinOp = [];
                                var binOpComponentOriginality = false;
                                var containedInOp = [];
                                getNestedVariables(nodeToCheck, containedInOp);

                                for (var u = 0; u < containedInOp.length; u++) {
                                    if (getVariableObject(containedInOp[u]) != null && getVariableObject(containedInOp[u]).original) {
                                        binOpComponentOriginality = true;
                                        break;
                                    }
                                }
                                if (originality || binOpComponentOriginality) {
                                    if (Array.isArray(recursivelyAnalyzeBinOp(nodeToCheck)) && results.listOps < 3) {
                                        results.listOps = 3;
                                    }
                                    if (recursivelyAnalyzeBinOp(nodeToCheck) === "Str" && results.strOps < 3) {
                                        results.strOps = 3;
                                    }
                                }
                                if (!originality) {
                                    listTypesWithin(nodeToCheck, withinBinOp, {
                                        input: false,
                                        indexed: false,
                                        strIndexed: false
                                    }, []);
                                }
                                else {
                                    var inputIndexPurpose = {
                                        input: false,
                                        indexed: false,
                                        strIndexed: false
                                    };
                                    var operations = [];


                                    listTypesWithin(nodeToCheck, withinBinOp, inputIndexPurpose, operations);
                                    appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);


                                    if (inputIndexPurpose.input) {
                                        results.consoleInput = 3;
                                    }
                                    if (inputIndexPurpose.indexed) {
                                        results.lists = 4;
                                    }
                                    if (inputIndexPurpose.strIndexed) {
                                        results.strings = 4;
                                    }
                                }
                                if (originality && !opsUsed.includes("BinOp")) { opsUsed.push("BinOp"); }
                                for (var p = 0; p < withinBinOp.length; p++) {
                                    if (Array.isArray(withinBinOp[p])) {
                                        //if the binop includes a list, go through THAT.
                                        lists = true;
                                        for (var s = 0; s < withinBinOp.length; s++) {
                                            switch (withinBinOp[p][s]) {
                                                case "Str":
                                                    strings = true;
                                                    break;
                                                case "Bool":
                                                    bools = true;
                                                    break;
                                                case "Int":
                                                    ints = true;
                                                    break;
                                                case "Float":
                                                    floats = true;
                                                    break;
                                            }
                                        }
                                    }
                                    else {
                                        switch (withinBinOp[p]) {
                                            //otherwise we just see what the item is.
                                            case "Str":
                                                strings = true;
                                                break;
                                            case "Bool":
                                                bools = true;
                                                break;
                                            case "Int":
                                                ints = true;
                                                break;
                                            case "Float":
                                                floats = true;
                                                break;
                                        }
                                    }
                                }
                            }
                            else if (nodeToCheck._astname === "BoolOp") {
                                var boolOpValues = [];

                                if (originality && !opsUsed.includes("BoolOp")) {
                                    opsUsed.push("BoolOp");
                                }

                                if (!originality) {
                                    listTypesWithin(nodeToCheck, boolOpValues, {
                                        indexed: false,
                                        input: false,
                                        strIndexed: false
                                    }, []);
                                }

                                else {

                                    var inputForPurposeInArg = {
                                        input: false,
                                        indexed: false,
                                        strIndexed: false
                                    };

                                    var operations = [];
                                    listTypesWithin(nodeToCheck, boolOpValues, inputForPurposeInArg, operations);
                                    appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);

                                    if (inputForPurposeInArg.input) {
                                        results.consoleInput = 3;
                                    }
                                    if (inputForPurposeInArg.indexed) {
                                        results.lists = 4;
                                    }
                                    if (inputForPurposeInArg.strIndexed) {
                                        results.strings = 4;
                                    }
                                }

                                if (boolOpValues[b].includes("Str")) {
                                    strings = true;
                                }
                                if (boolOpValues[b].includes("Int")) {
                                    ints = true;
                                }
                                if (boolOpValues[b].includes("Float")) {
                                    floats = true;
                                }
                                if (boolOpValues[b].includes("Bool")) {
                                    bools = true;
                                }
                                if (boolOpValues[b].includes("List")) {
                                    lists = true;
                                }

                            }
                                //chack all values inside the comparison
                            else if (nodeToCheck._astname === "Compare") {
                                var compareValues = [];
                                var indexInputItem = {
                                    input: false,
                                    indexed: false,
                                    strIndexed: false
                                };

                                if (!opsUsed.includes("Compare")) {
                                    opsUsed.push("Compare");
                                }
                                if (!originality) {
                                    listTypesWithin(nodeToCheck, compareValues, {
                                        input: false,
                                        indexed: false,
                                        strIndexed: false
                                    }, []);
                                }

                                else {
                                    var compareInd = false;
                                    var compareStrInd = false;
                                    var operations = [];

                                    listTypesWithin(nodeToCheck, compareValues, indexInputItem, operations);
                                    appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);

                                    if (indexInputItem.indexed) {
                                        results.lists = 4;
                                    }
                                    if (indexInputItem.strIndexed) {
                                        results.strings = 4;
                                    }
                                }
                                if (indexInputItem.input) {
                                    results.consoleInput = 3;
                                }

                                if (compareValues[b].includes("Str")) {
                                    strings = true;
                                }
                                if (compareValues[b].includes("Int")) {
                                    ints = true;
                                }
                                if (compareValues[b].includes("Float")) {
                                    floats = true;
                                }
                                if (compareValues[b].includes("Bool")) {
                                    bools = true;
                                }
                                if (compareValues[b].includes("List")) {
                                    lists = true;
                                }

                            }

                            if (nodeToCheck._astname === "Name" && nodeToCheck.id.v !== "True" && nodeToCheck.id.v !== "False") {
                                var argModded = false;
                                var modOriginality = false;
                                var modString = "";
                                var insideOutside = "outside"; //this will get set to "inside" if this call is within another function
                                var insideLines = [-1, -1];
                                var assignOriginality = false;
                                var varType = "";
                                var varInput = false;

                                var otherVar = getVariableObject(nodeToCheck.id.v);
                                if (otherVar != null) {
                                    var numberOfMods = 0;

                                    //ops done
                                    if (otherVar.opsDone != null && (otherVar.original || originality)) {
                                        var otherVarOps = opsBeforeLine(otherVar.opsDone, node.lineno, "var", otherVar);
                                        appendArray(otherVarOps, opsUsed);
                                    }

                                    //is the use inside or outside a function?
                                    for (var n = 0; n < otherVar.modifyingFunctions.length; n++) {
                                        if (node.lineno >= otherVar.modifyingFunctions[n][0] && node.lineno <= otherVar.modifyingFunctions[n][1]) {
                                            insideOutside = "inside";
                                            insideLines = otherVar.modifyingFunctions[n];
                                            break;
                                        }
                                    }
                                    if (insideOutside === "outside") {
                                        insideLines = [];
                                        for (var n = 0; n < otherVar.modifyingFunctions.length; n++) {
                                            for (var line = otherVar.modifyingFunctions[n][0]; line <= otherVar.modifyingFunctions[n][1]; line++) {
                                                insideLines.push(line);
                                            }
                                        }
                                    }
                                    for (var z = 0; z < otherVar.assignedModified.length; z++) {
                                        if (otherVar.assignedModified[z].line > node.lineno) {
                                            //stop loop before we get to the current line OR if both things we're looking for are already set to true.
                                            break;
                                        }

                                        //is there a modification? is it original? is it inside/outside the function as appropriate?
                                        if (otherVar.assignedModified[z].line <= node.lineno) {
                                            if ((insideOutside === "inside" && node.lineno >= insideLines[0] && node.lineno <= insideLines[1]) || (insideOutside === "outside" && !insideLines.includes(node.lineno))) {
                                                argModded = true;
                                                numberOfMods += 1;
                                                if (otherVar.assignedModified[z].original) {
                                                    modOriginality = true;
                                                }
                                            }
                                        }
                                    }

                                    varType = otherVar.value;
                                    varInput = otherVar.indexAndInput.input;

                                    if (argModded && (originality || modOriginality) && ((insideOutside === "outside" && numberOfMods > 1) || (insideOutside === "inside" && numberOfMods > 0))) {
                                        results.variables = 4;
                                    }



                                    if (otherVar.original || originality) {
                                        if (varInput && results.consoleInput < 3) {
                                            results.consoleInput = 3;
                                        }
                                        if (results.variables < 3) {
                                            results.variables = 3;
                                        }
                                        if (varType === "List" && results.lists < 3) {
                                            results.lists = 3;
                                        }
                                        if (varType === "Bool" && results.bools < 3) {
                                            results.bools = 3;
                                        }
                                        if (varType === "Str" && results.strings < 3) {
                                            results.strings = 3;
                                        }
                                        if (varType === "Int") {
                                            results.ints = 3;
                                        }
                                        if (varType === "Float") {
                                            results.floats = 3;
                                        }
                                    }
                                }
                            }

                            //is it something else that can CONTAIN a variable value?
                            if (nodeToCheck._astname === "List" || nodeToCheck._astname === "BinOp" || nodeToCheck._astname === "BoolOp" || nodeToCheck._astname === "Compare") {
                                if (nodeToCheck._astname === "Compare" && originality) {
                                    results.comparisons = 3;
                                }

                                var modOriginality = false;
                                var allNamesWithin = [];


                                getNestedVariables(nodeToCheck, allNamesWithin);
                                //if ANY of these is marked as original, assignment counts as original
                                var originalAssign = false

                                for (var n = 0; n < allNamesWithin.length; n++) {
                                    var otherVariable = getVariableObject(allNamesWithin[n]);

                                    if (otherVariable != null) {
                                        var argModded = false;
                                        var insideOutside = "outside"; //this will get set to "inside" if this call is within another function
                                        var insideLines = [-1, -1];

                                        //is the use inside or outside a function?
                                        for (var f = 0; f < otherVariable.modifyingFunctions.length; f++) {
                                            if (node.lineno >= otherVariable.modifyingFunctions[f][0] && node.lineno <= otherVariable.modifyingFunctions[f][1]) {
                                                insideOutside = "inside";
                                                insideLines = otherVariable.modifyingFunctions[f];
                                                break;
                                            }
                                        }

                                        if (insideOutside === "outside") {
                                            insideLines = [];
                                            for (var f = 0; f < otherVariable.modifyingFunctions.length; f++) {
                                                for (var line = otherVariable.modifyingFunctions[f][0]; line <= otherVariable.modifyingFunctions[f][1]; line++) {
                                                    insideLines.push(line);
                                                }
                                            }
                                        }


                                        var numberOfMods = 0;
                                        for (var z = 0; z < otherVariable.assignedModified.length; z++) {
                                            if (otherVariable.assignedModified[z].line > node.lineno) {
                                                //stop loop before we get to the current line OR if both things we're looking for are already set to true.
                                                break;
                                            }

                                            //is there a modification? is it original?
                                            if ((insideOutside === "inside" && node.lineno >= insideLines[0] && node.lineno <= insideLines[1]) || (insideOutside === "outside" && !insideLines.includes(node.lineno))) {
                                                argModded = true;
                                                numberOfMods += 1;
                                                if (otherVariable.assignedModified[z].original) {
                                                    modOriginality = true;
                                                }
                                            }
                                        }

                                        if (argModded && (originality || modOriginality) && ((insideOutside === "outside" && numberOfMods > 1) || (insideOutside === "inside" && numberOfMods > 0))) {
                                            results.variables = 4;
                                        }
                                        if (otherVariable.original || originality) {
                                            if (otherVariable.value === "List" && results.lists < 3) {
                                                results.lists = 3;
                                            }
                                            if (otherVariable.value === "Bool" && (results.bools < 3)) {
                                                results.bools = 3;
                                            }
                                            if (otherVariable.value === "Str" && results.strings < 3) {
                                                results.strings = 3;
                                            }
                                            if (otherVariable.value === "Int") {
                                                results.ints = 3;
                                            }
                                            if (otherVariable.value === "Float") {
                                                results.floats = 3;
                                            }
                                            if (otherVariable.indexAndInput.input) {
                                                results.consoleInput = 3;
                                            }
                                        }
                                    }
                                }

                                if (allNamesWithin.length > 0 && (originalAssign || originality) && (results.variables < 3)) {
                                    results.variables = 3;
                                }
                            }

                        }

                        //if anything reaches a new level, update the results.
                        if (originality || originalAssignment) {
                            if (floats) {
                                results.floats = 3;
                            }
                            if (ints) {
                                results.ints = 3;
                            }
                            if (strings && results.strings < 3) {
                                results.strings = 3;
                            }
                            if (bools) {
                                results.booleans = 3;
                            }
                            if (lists && (results.lists < 3)) {
                                results.lists = 3;
                            }
                            if (purposeVars && (results.variables < 3)) {
                                results.variables = 3;
                            }
                        }

                    }
                }

                //JS for loops have up to 3 components that need to be checked
                if (node._astname === "JSFor") {

                    var forLoopArgs = 0;

                    if (node.init != null) {

                        if (node.init._astname === "Assign") {
                            var initOrig = originality;

                            var initVars = [];


                            if (!originality) {
                                initVars = appendArray(getNestedVariables(node.init.targets[0], []), getNestedVariables(node.init.value, []));
                                for (var i in initVars) {
                                    var iVar = getVariableObject(initVars[i]);
                                    if (iVar != null && iVar.original) {
                                        initOrig = true;
                                        break;
                                    }
                                }
                            }

                            if (initOrig) {
                                forLoopArgs += 1;
                                if (initVars.length > 0 && results.variables < 3) {
                                    results.variables = 3
                                }

                                var typesWithinAssign = [];
                                var assignIn = {
                                    input: false,
                                    indexed: false,
                                    strIndexed: false
                                };


                                typesWithinAssign = listTypesWithin(node.init.targets[0], typesWithinAssign, assignIn, opsUsed);
                                listTypesWithin(node.init.value, typesWithinAssign, assignIn, opsUsed);


                                //datatypes
                                if ('int' in typesWithinAssign) {
                                    results.ints = 3;
                                }
                                if ('str' in typesWithinAssign && results.strings < 3) {
                                    results.strings = 3;
                                }
                                if ('bool' in typesWithinAssign) {
                                    results.booleans = 3;
                                }
                                if ('list' in typesWithinAssign && results.lists < 3) {
                                    results.lists = 3;
                                }
                                if ('float' in typesWithinAssign) {
                                    results.floats = 3;
                                }

                                if (assignIn.input) {
                                    results.consoleInput = 3;
                                }
                                if (assignIn.indexed) {
                                    results.lists = 4;
                                }
                                if (assignIn.strIndexed) {
                                    results.strings = 4;
                                }
                            }
                        }
                        if (node.init._astname === "AugAssign") {
                            //augassign has target and valeu
                            var initOrig = originality;
                            if (results.mathematicalOperators < 1) {
                                results.mathematicalOperators = 1;
                            }


                            var initVars = [];
                            if (!originality) {
                                initVars = appendArray(getNestedVariables(node.init.target, []), getNestedVariables(node.init.value, []));
                                for (var i in initVars) {
                                    var iVar = getVariableObject(initVars[i]);

                                    if (iVar != null && iVar.original) {
                                        initOrig = true;
                                        break;
                                    }
                                }
                            }


                            if (initOrig) {
                                if (results.mathematicalOperators < 3) {
                                    results.mathematicalOperators = 3;
                                }

                                if (initVars.length > 0 && results.variables < 3) {
                                    results.variables = 3;
                                }

                                forLoopArgs += 1;
                                var typesWithinAssign = [];
                                var assignIn = {
                                    input: false,
                                    indexed: false,
                                    strIndexed: false
                                };

                                typesWithinAssign = listTypesWithin(node.init.target, typesWithinAssign, assignIn, opsUsed);
                                listTypesWithin(node.init.value, typesWithinAssign, assignIn, opsUsed);

                                //datatypes
                                if ('int' in typesWithinAssign) {
                                    results.ints = 3;
                                }
                                if ('str' in typesWithinAssign &&
                                    results.strings < 3) { results.strings = 3; }
                                if ('bool' in typesWithinAssign) {
                                    results.booleans = 3;
                                }
                                if ('list' in typesWithinAssign && results.lists < 3) {
                                    results.lists = 3;
                                }
                                if ('float' in typesWithinAssign) {
                                    results.floats = 3;
                                }

                                if (assignIn.input) {
                                    results.consoleInput = 3;
                                }
                                if (assignIn.indexed) {
                                    results.lists = 4;
                                }
                                if (assignIn.strIndexed) {
                                    results.strings = 4;
                                }
                            }
                        }

                    }


                    //test node is always there. this is a comparison, or a bool, or a boolop. Something that returns a bool.
                    //We'll need typeswithin here as well as any other ops
                    var nodeTest = node.test;
                    if (nodeTest._astname === "UnaryOp") {
                        var anyOr = originality;

                        if (!originality) {
                            var unaryNames = [];
                            getNestedVariables(nodeTest, unaryNames);
                            for (var p in unaryNames) {
                                var isVar = getVariableObject(unaryNames[p]);

                                if (isVar != null && isVar.original) {
                                    anyOr = true;
                                    break;
                                }
                            }
                        }
                        if (anyOr) {
                            results.booleans = 3;
                        }
                        nodeTest = nodeTest.operand;
                    }

                    //is the test node a subscript?
                    if (nodeTest._astname === "Subscript" && (nodeTest.slice._astname === "Index" || nodeTest.slice._astname === "Slice")) {
                        //is the thing we're indexing a list?
                        if (nodeTest.value._astname === "List") {
                            results.lists = 4;
                        }
                        if (nodeTest.value._astname === "Subscript" && getNestedIndexing(nodeTest.value)) {
                            results.lists = 4;
                        }
                        if (nodeTest.value._astname === "BinOp" && Array.isArray(recursivelyAnalyzeBinOp(nodeTest.value))) {
                            results.lists = 4;
                        }
                        if (nodeTest.value._astname === "Call") {
                            //is it a listop, concat binop, OR a UDF that returns a list
                            if (doesCallCreateList(nodeTest.value)) {
                                results.lists = 4;
                            }
                            else if ('id' in nodeTest.func) {
                                var calledFunc = getUserFunctionReturn(nodeTest.func.id.v);
                                if (calledFunc != null && calledFunc.returns === "List") {
                                    results.lists = 4;
                                }
                            }
                        }
                        if (nodeTest.value._astname === "Name" && getVariableObject(nodeTest.value.id.v).value === "List") {
                            results.lists = 4;
                        }
                    }


                    nodeTest = retrieveFromList(nodeTest);

                    if (nodeTest._astname === "UnaryOp") {
                        var anyOr = originality;
                        if (!originality) {
                            var unaryNames = [];
                            getNestedVariables(nodeTest, unaryNames);

                            for (var p in unaryNames) {
                                var isVar = getVariableObject(unaryNames[p]);
                                if (isVar != null && isVar.original) {
                                    anyOr = true;
                                    break;
                                }
                            }
                        }

                        if (anyOr) {
                            results.booleans = 3;
                        }
                        nodeTest = nodeTest.operand;
                    }

                    var nestedVars = [];
                    getNestedVariables(nodeTest, nestedVars);

                    var anyOriginal = originality;
                    if (!originality) {
                        for (var i in nestedVars) {
                            var isVar = getVariableObject(nestedVars[i]);
                            if (isVar != null) {
                                if (isVar.original) {
                                    anyOriginal = true;
                                    break;
                                }
                            }
                        }
                    }


                    if (anyOriginal) {
                        //we need: datatypes and ops. and contained datatypes. and whether or not any vars are used or nested.
                        if (nestedVars.length > 0 && results.variables < 3) {
                            results.variables = 3
                        }
                        var dataTypesIn = [];
                        var indexingIn = {
                            input: false,
                            indexed: false,
                            strIndexed: false
                        };
                        dataTypesIn = listTypesWithin(nodeTest, dataTypesIn, indexingIn, opsUsed);

                        var testItem = node.test;



                        //unary and subscript values
                        if (testItem._astname === "UnaryOp") {
                            var anyOr = originality;
                            if (!originality) {
                                var unaryNames = [];
                                getNestedVariables(testItem, unaryNames);

                                for (var p in unaryNames) {
                                    var isVar = getVariableObject(unaryNames[p]);

                                    if (isVar != null && isVar.original) {
                                        anyOr = true;
                                        break;
                                    }
                                }
                            }

                            if (anyOr) {
                                results.booleans = 3;
                            }
                            testItem = testItem.operand;
                        }


                        if (testItem._astname === "Subscript" && (testItem.slice._astname === "Index" || testItem.slice._astname === "Slice")) {
                            //is the thing we're indexing a list?
                            if (testItem.value._astname === "List") {
                                results.lists = 4;
                            }
                            if (testItem.value._astname === "Subscript" && getNestedIndexing(testItem.value)) {
                                results.lists = 4;
                            }
                            if (testItem.value._astname === "BinOp" && Array.isArray(recursivelyAnalyzeBinOp(testItem.value))) {
                                results.lists = 4;
                            }
                            if (testItem.value._astname === "Call") {  //is it a listop, concat binop, OR a UDF that returns a list
                                if (doesCallCreateList(testItem.value)) {
                                    results.lists = 4;
                                }

                                else if ('id' in testItem.func) {
                                    var calledFunc = getUserFunctionReturn(testItem.func.id.v);
                                    if (calledFunc != null && calledFunc.returns === "List") {
                                        results.lists = 4;
                                    }
                                }
                            }
                            if (testItem.value._astname === "Name" && getVariableObject(testItem.value.id.v).value === "List") {
                                results.lists = 4;
                            }
                        }

                        testItem = retrieveFromList(testItem);

                        if (testItem._astname === "UnaryOp") {
                            var anyOr = originality;
                            if (!originality) {
                                var unaryNames = [];
                                getNestedVariables(testItem, unaryNames);
                                for (var p in unaryNames) {
                                    var isVar = getVariableObject(unaryNames[p]);

                                    if (isVar != null && isVar.original) {
                                        anyOr = true;
                                        break;
                                    }
                                }
                            }
                            if (anyOr) {
                                results.booleans = 3;
                            }

                            testItem = testItem.operand;
                        }

                        //test item doesn't get auto-analyzed
                        recursiveAnalyzeAST(testItem, results, loopParent);


                        if (testItem._astname === "Call") {
                            var funcName = "";
                            var argList = [];

                            //get the function name

                            if ('id' in testItem.func) {
                                funcName = testItem.func.id.v;
                                argList = testItem.args;
                            }
                            else {
                                funcName = testItem.func.attr.v;
                            }

                            //get indexing and input
                            if (funcName === 'readInput') {
                                inputUsed = true;
                            }
                            if (listFuncs.indexOf(funcName) > -1 && originality) {
                                lists = true;
                                if (!opsUsed.includes("ListOp")) {
                                    opsUsed.push("ListOp");
                                }
                            }
                            else if (strFuncs.indexOf(funcName) > -1 && originality) {
                                strings = true;
                                if (!opsUsed.includes("StrOp")) {
                                    opsUsed.push("StrOp");
                                }
                            }
                            else if (getFunctionObject(funcName).indexAndInput.indexed && (originality || getFunctionObject(funcName).original)) {
                                results.lists = 4;
                            }


                            var callReturnVal = "";
                            var calledFunc = getFunctionObject(funcName);

                            //updates results and purpose booleans
                            if (calledFunc != null) {
                                callReturnVal = calledFunc.returns;
                                if (calledFunc.containedValue != null) {
                                    if (calledFunc.containedValue.includes("Str")) {
                                        strings = true;
                                    }
                                    if (calledFunc.containedValue.includes("Int")) {
                                        ints = true;
                                    }
                                    if (calledFunc.containedValue.includes("Float")) {
                                        floats = true;
                                    }
                                    if (calledFunc.containedValue.includes("Bool")) {
                                        bools = true;
                                    }

                                }

                                if (calledFunc.indexAndInput.input) {
                                    inputUsed = true;
                                }
                                if (originality && calledFunc.indexAndInput.indexed) {
                                    results.lists = 4;
                                }
                                if (originality && calledFunc.indexAndInput.strIndexed) {
                                    results.strings = 4;
                                }
                                if (calledFunc.nested) {
                                    purposeVars = true;
                                }
                                if (calledFunc.opsDone != null && originality) {
                                    appendArray(opsBeforeLine(calledFunc.opsDone, node.lineno, "func", calledFunc), opsUsed);
                                }
                            }

                            if (callReturnVal === "Str") {
                                strings = true;
                            }
                            if (callReturnVal === "Int") {
                                ints = true;
                            }
                            if (callReturnVal === "Float") {
                                floats = true;
                            }
                            if (callReturnVal === "Bool") {
                                bools = true;
                            }
                            if (callReturnVal === "List") {
                                lists = true;
                            }


                            //if the test is a function call
                            if ('func' in testItem) {
                                if (originality) {
                                    var functionName = testItem.func.id.v;
                                    var testFunc = getFunctionObject(functionName);


                                    if (testFunc != null) {
                                        if (testFunc.nested) {
                                            purposeVars = true;
                                        }
                                        if (testFunc.opsDone != null) {
                                            var testOps = opsBeforeLine(testFunc.opsDone, node.lineno, "func", testFunc);
                                            if (testOps.includes("BinOp") || testOps.includes("AugAssign")) {
                                                results.mathematicalOperators = 3;
                                            }
                                            if (testOps.includes("BoolOp")) {
                                                results.boolOps = 3;
                                            }
                                            if (testOps.includes("StrOp")) {
                                                results.strOps = 3;
                                            }
                                            if (testOps.includes("ListOp")) {
                                                results.listOps = 3;
                                            }
                                            if (testOps.includes("Compare")) {
                                                results.comparisons = 3;
                                            }

                                        }
                                        //input
                                        if (testFunc.indexAndInput.input && originality) {
                                            results.consoleInput = 3;
                                        }
                                        if (testFunc.indexAndInput.indexed) {
                                            results.lists = 4;
                                        }
                                        if (testFunc.indexAndInput.strIndexed) {
                                            results.lists = 4;
                                        }


                                        //contained values
                                        if (testFunc.containedValue != null) {
                                            if (testFunc.containedValue.includes("Str") && results.strings < 3) {
                                                results.strings = 3;
                                            }
                                            if (testFunc.containedValue.includes("Int")) {
                                                results.ints = 3;
                                            }
                                            if (testFunc.containedValue.includes("Float")) {
                                                results.floats = 3;
                                            }
                                            if (testFunc.containedValue.includes("Bool")) {
                                                results.booleans = 3;
                                            }
                                            if (testFunc.containedValue.includes("List") && (results.lists < 3)) {
                                                results.lists = 3;
                                            }

                                        }
                                    }
                                }
                            }
                        }

                        //if storagefor other types of information
                        if (testItem._astname === "Compare" || testItem._astname === "List" || testItem._astname === "BinOp" || testItem._astname === "BoolOp") {
                            var allTypes = [];
                            var useInput = {
                                input: false,
                                indexed: false,
                                strIndexed: false
                            };
                            var operations = [];


                            listTypesWithin(testItem, allTypes, useInput, operations);
                            appendArray(opsBeforeLine(operations, node.lineno, "", null), opsUsed);

                            if (testItem._astname === "Compare" && originality) {
                                results.comparisons = 3;
                            }


                            //update results from types within?
                            if (originality) {
                                if (useInput.input && results.consoleInput < 3) {
                                    results.consoleInput = 3;
                                }
                                if (allTypes.includes("Str") && results.strings < 3) {
                                    results.strings = 3;
                                }
                                if (allTypes.includes("Int")) {
                                    results.ints = 3;
                                }
                                if (allTypes.includes("Bool")) {
                                    results.booleans = 3;
                                }
                                if (allTypes.includes("Float")) {
                                    results.floats = 3;
                                }
                                if (allTypes.includes("List") && (results.lists < 3)) {
                                    results.lists = 3;
                                }
                            }

                            var nestedVars = getNestedVariables(testItem, []);
                            var anyOriginality = false;

                            for (var i = 0; i < nestedVars.length; i++) {
                                var nestVar = getVariableObject(nestedVars[i]);
                                if (nestVar != null && nestVar.original) {
                                    anyOriginality = true;
                                    break;
                                }
                            }

                            //input, indexing
                            if (anyOriginality || anyOriginality) {
                                if (useInput.input) {
                                    results.lists = 4;
                                }
                                if (useInput.strIndexed) {
                                    results.strings = 4;
                                }
                                if (useInput.indexed) {
                                    results.lists = 4;
                                }
                            }
                        }

                        //if test item is a variable
                        if (testItem._astname === "Name") {
                            var argVar = getVariableObject(testItem.id.v);


                            if (argVar != null) {
                                var varInput = false;
                                if (argVar.indexAndInput.input) {
                                    varInput = true;
                                }
                                var assignOriginal = argVar.original;


                                if (originality || assignOriginal) {
                                    if (argVar.indexAndInput.indexed) {
                                        results.lists = 4;
                                    }
                                    if (argVar.indexAndInput.strIndexed) {
                                        results.strings = 4;
                                    }

                                    var varType = argVar.value;
                                    var contained = argVar.containedValue;




                                    //update results
                                    if (varInput && results.consoleInput < 3) {
                                        results.consoleInput = 3;
                                    }
                                    if (results.variables < 3) {
                                        results.variables = 3;
                                    }

                                    if (argVar.opsDone != null) {
                                        appendArray(opsBeforeLine(argVar.opsDone, node.lineno, "var", argVar), opsUsed);
                                    }

                                    if (varType === "Str" && results.strings < 3) {
                                        results.strings = 3;
                                    }
                                    if (varType === "Int") {
                                        results.ints = 3;
                                    }
                                    if (varType === "Float") {
                                        results.floats = 3;
                                    }
                                    if (varType === "Bool") {
                                        results.booleans = 3;
                                    }
                                    if (varType === "List" && (results.lists < 3)) {
                                        results.lists = 3;
                                    }

                                    if (contained.length > 0) {

                                        if (contained.includes("Str") && results.strings < 3) {
                                            results.strings = 3;
                                        }
                                        if (contained.includes("Int")) {
                                            results.ints = 3;
                                        }
                                        if (contained.includes("Float")) {
                                            results.floats = 3;
                                        }
                                        if (contained.includes("Bool")) {
                                            results.booleans = 3;
                                        }
                                        if (contained.includes("List") && (results.lists < 3)) {
                                            results.lists = 3;
                                        }

                                    }
                                }
                            }
                        }

                        //orrrrr if it's a binop, boolop, list, or call we grab the contained values. wheeee.
                        if (testItem._astname === "Compare" || testItem._astname === "BoolOp" || testItem._astname === "List" || testItem._astname === "BoolOp") {

                            if (testItem._astname === "Compare" && originality) {
                                results.comparisons = 3;
                            }
                            if (testItem._astname === "BinOp" && originality) {
                                results.mathematicalOperators = 3;
                            }


                            //oh we need variable NAMEs hrngh
                            var allNamesWithin = [];
                            getNestedVariables(testItem, allNamesWithin);


                            //if ANY of these is marked as original, assignment counts as original
                            var originalAssign = false;
                            var varInput = false;


                            for (var n = 0; n < allNamesWithin.length; n++) {
                                var testVariable = getVariableObject(allNamesWithin[n]);

                                if (testVariable != null) {
                                    var containedVal = testVariable.value;
                                    if (testVariable.indexAndInput.input) {
                                        varInput = true;
                                    }

                                    var containedValList = testVariable.containedValue;
                                    if (containedValList == null) {
                                        containedValList = [];
                                    }
                                    if (testVariable.original) {
                                        originalAssign = true;
                                    }


                                    if (testVariable.original || originality) {
                                        if (varInput && results.consoleInput < 3) {
                                            results.consoleInput = 3;
                                        }
                                        if ((containedVal === "List" || containedValList.includes("List")) && results.lists < 3) {
                                            results.lists = 3;
                                        }
                                        if ((containedVal === "Bool" || containedValList.includes("Bool")) && results.booleans < 3) {
                                            results.booleans = 3;
                                        }
                                        if ((containedVal === "Str" || containedValList.includes("Str")) && results.strings < 3) {
                                            results.strings = 3;
                                        }
                                        if ((containedVal === "Int" || containedValList.includes("Int")) && results.ints < 3) {
                                            results.ints = 3;
                                        }
                                        if (containedVal === "Float" || containedValList.includes("Float")) {
                                            results.floats = 3;
                                        }

                                    }
                                }
                            }

                            if (allNamesWithin.length > 0 && (originalAssign || originality)) {
                                if (results.variables < 3) {
                                    results.variables = 3;
                                }
                            }
                        }

                        //datatypes
                        if ('int' in dataTypesIn) {
                            results.ints = 3;
                        }
                        if ('str' in dataTypesIn && results.strings < 3) {
                            results.strings = 3;
                        }
                        if ('bool' in dataTypesIn) {
                            results.booleans = 3;
                        }
                        if ('list' in dataTypesIn && results.lists < 3) {
                            results.lists = 3;
                        }
                        if ('float' in dataTypesIn) {
                            results.floats = 3;
                        }


                        if (indexingIn.input) {
                            results.consoleInput = 3;
                        }
                        if (indexingIn.indexed) {
                            results.lists = 4;
                        }
                        if (indexingIn.strIndexed) {
                            results.strings = 4;
                        }

                    }


                    //finally, the update function.
                    if (node.update != null) {

                        //this should always be an augassign of some sort
                        if (node.update._astname === "AugAssign") {

                            var updateOrig = originality;

                            if (results.mathematicalOperators < 1) {
                                results.mathematicalOperators = 1;
                            }

                            var updateVars = [];
                            if (!originality) {
                                updateVars = appendArray(getNestedVariables(node.update.target, []), getNestedVariables(node.update.value, []));

                                for (var i in updateVars) {
                                    var iVar = getVariableObject(updateVars[i]);
                                    if (iVar != null && iVar.original) {
                                        updateOrig = true;
                                        break;
                                    }
                                }


                            }
                            if (updateOrig) {
                                if (results.mathematicalOperators < 3) {
                                    results.mathematicalOperators = 3;
                                }

                                if (updateVars.length > 0 && results.variables < 3) {
                                    results.variables = 3
                                }

                                forLoopArgs += 1;
                                var typesWithinAssign = [];
                                var assignIn = {
                                    input: false,
                                    indexed: false,
                                    strIndexed: false
                                };


                                typesWithinAssign = listTypesWithin(node.update.target, typesWithinAssign, assignIn, opsUsed);
                                listTypesWithin(node.update.value, typesWithinAssign, assignIn, opsUsed);

                                //datatypes
                                if ('int' in typesWithinAssign) {
                                    results.ints = 3;
                                }
                                if ('str' in typesWithinAssign && results.strings < 3) {
                                    results.strings = 3;
                                }
                                if ('bool' in typesWithinAssign) {
                                    results.booleans = 3;
                                }
                                if ('list' in typesWithinAssign && results.lists < 3) {
                                    results.lists = 3;
                                }
                                if ('float' in typesWithinAssign) {
                                    results.floats = 3;
                                }


                                if (assignIn.input) {
                                    results.consoleInput = 3;
                                }
                                if (assignIn.indexed) {
                                    results.lists = 4;
                                }
                                if (assignIn.strIndexed) {
                                    results.strings = 4;
                                }
                            }
                        }
                    }

                    //then we handle forLoopArgs
                    if (forLoopArgs === 1 && originality) {
                        //for loops should be at least 3
                        if (results.forLoops < 3) {
                            results.forLoops = 3;
                        }
                    }
                    if (forLoopArgs === 2 && originality) {
                        //at least 4
                        if (results.forLoops < 4) {
                            results.forLoops = 4;
                        }
                    }
                }


                if (purposeVars && (results.variables < 3) && (originality || originalAssignment)) {
                    results.variables = 3;
                }

                //updates results with information from opsUsed
                for (var op = 0; op < opsUsed.length; op++) {

                    var thisOp = opsUsed[op];
                    if (typeof thisOp === "object") {
                        thisOp = thisOp.op;
                    }

                    if (thisOp === "Compare") {
                        results.comparisons = 3;
                    }
                    if (thisOp === "BoolOp") {
                        results.boolOps = 3;
                    }
                    if (thisOp === "BinOp" || opsUsed[op] === "AugAssign") {
                        results.mathematicalOperators = 3;
                    }
                    if (thisOp === "StrOp") {
                        results.strOps = 3;
                    }
                    if (thisOp === "ListOp") {
                        results.listOps = 3;
                    }
                }

                takesArgs = false;
                returns = false;


                if (loopParent != null) { //this logic is wonky but i promise you it works
                    if (isForLoop && loopParent[0] && originality) {
                        results.forLoops = 5;
                    }
                    if ((isWhileLoop || isForLoop) && (loopParent[0] || loopParent[1]) && originality) {
                        results.forLoops = 5;
                    }
                    if (loopParent[0] && originality) {
                        isForLoop = true;
                    }
                    if (loopParent[1] && originality) {
                        isWhileLoop = true;
                    }
                }

                //we need to return this information so we know abt nested loops
                return [isForLoop, isWhileLoop];
            }
        }
    }


    /**
     * Recursively analyze a python abstract syntax tree.
     * @private
     */
    function recursiveAnalyzeAST(ast, results, loopParent) {
        if (ast != null && ast.body != null) {
            angular.forEach(ast.body, function (node) {
                var loopPar = analyzeASTNode(node, results, loopParent);
                recursiveAnalyzeAST(node, results, loopPar);
            });
        }
        else if (ast != null && (ast._astname != null || (ast[0] != null && typeof ast[0] === 'object'))) {
            angular.forEach(ast, function (node) {
                var loopPar = analyzeASTNode(node, results, loopParent);
                recursiveAnalyzeAST(node, results, loopPar);
            });
        }
        return results;
    }



    /**
    *Determine whether the structure of an AST node is sufficiently original from the structure of sample code
    *@param node The node whose originality the function is to check
    *@param threshold The number of tree edits required between the given node and all sample nodes for the node to be marked original
    *@param sampleList The list of sample structures. If called from outside the function, this should be STRUCTURE_SAMPLES.
    *@returns true if the node is sufficiently original from all nodes in sample code; false otherwise
    */
    function TreeOriginality(node, threshold, sampleList) {
        var studentAST = buildSimplifiedAST(node);
        numericizeSimplifiedAST(studentAST);
        for (var i in sampleList) {
            var distance = computeEditDistance(studentAST, sampleList[i]);
            if (distance < threshold) {
                return false;
            }
            if (bodyIDs.includes(sampleList[i].id)) {
                if (!TreeOriginality(node, threshold, sampleList[i].children)) {
                    return false;
                }
            }
        }
        return true;


    }



    /**
    *Compute the edit distance (including additions, removals, and changes between two simplified AST nodes from buildSimplifiedAST
    *@param nodeA The first node
    *@param nodeB The node to compare nodeA to
    *@returns integer edit distance
    */
    function computeEditDistance(nodeA, nodeB) {
        // Define cost functions.
        var insert, remove, update;
        insert = remove = function (node) { return 1; };
        update = function (nodeA, nodeB) {
            return nodeA.id !== nodeB.id ? 1 : 0;
        };
        var children = function (node) { return node.children; };

        // Compute edit distance, mapping, and alignment.
        var tedObj = ted(nodeA, nodeB, children, insert, remove, update);


        //get the alignment, and work with that.
        //should be hierarchical
        //ignore unchanged body nodes.
        var astDistance = 0;
        var pairs = tedObj.pairs();
        var bodyNodes = [];

        for (var i in pairs) {
            var pair = pairs[i];
            if (pair[0] == null || pair[1] == null) {
                //addition or removal
                astDistance += 1;
            }
            else if (pair[0].id != pair[1].id) {
                //update
                astDistance += 1;
            }
            else if ((pair[0].id === pair[1].id) && (pair[0].parent != null && pair[1].parent != null) && (pair[0].parent != pair[1].parent) && pair[0].id != 2) {
                //this is for if the nodes are the same and their parent is different and not a body, which also constitutes an edit.
                astDistance += 1;
            }
        }
        return astDistance;

    }

    /**
     * Recursively analyze a python abstract syntax tree and build a simplified, partially canonicalized AST for equivalence use and MAYBE edit distance, depending on how much time Erin has.
     *DO NOT CALL THIS FUNCTION until AFTER allVariables and userDefinedFunctions have been filled (i.e., only call from AnalyzePythonNode)! These are used to get variable datatypes.
     * @param node {AST Node} The node to canonicalize
     */
    function buildSimplifiedAST(node) {
        if (node != null && node._astname != null) {
            if (node._astname === "Expr") {
                node = node.value;
            }


            var returnObject = {};
            returnObject.id = 'empty';
            returnObject.children = [];

            if (node._astname === "For") {
                returnObject.id = "for";
                var targetObj = buildSimplifiedAST(node.target);


                //iterator can be an iterable datatype OR a range() call
                var iteratorObj = buildSimplifiedAST(node.iter);

                returnObject.children[0] = targetObj;
                returnObject.children[1] = iteratorObj;

                var bodyObj = {
                    id: "body"
                };
                var bodyChildren = [];

                for (var i in node.body) {
                    var inBodyObj = buildSimplifiedAST(node.body[i]);
                    if (inBodyObj != null) {
                        bodyChildren.push(inBodyObj);
                    }
                }

                if (bodyChildren.length > 0) {
                    bodyObj.children = bodyChildren;
                }

                returnObject.children[2] = bodyObj;

            }
            else if (node._astname === "While") {
                returnObject.id = "while";
                var testObj = buildSimplifiedAST(node.test);

                returnObject.children[0] = testObj;
                var bodyNodes = { id: "body" };
                var bodyChildren = [];


                for (var i in node.body) {
                    var bodyObj = buildSimplifiedAST(node.body[i]);
                    bodyChildren.push(bodyObj);
                }

                if (bodyChildren.length > 0) {
                    bodyNodes.children = bodyChildren;
                }

                returnObject.children[1] = bodyNodes;

            }
            else if (node._astname === "FunctionDef") {
                returnObject.id = "def";
                var argsObj = { id: "args" };
                var argChildren = []


                for (var i in node.args.args) {
                    var singleArg = buildSimplifiedAST(node.args.args[i]);
                    argChildren.push(singleArg);
                }
                if (argChildren.length > 0) {
                    argsObj.children = argChildren;
                }

                returnObject.children[0] = argsObj;

                var bodyObj = { id: 'body' };
                var bodyChildren = [];

                for (var i in node.body) {
                    var inBodyObj = buildSimplifiedAST(node.body[i]);
                    bodyChildren.push(inBodyObj);
                }

                if (bodyChildren.length > 0) {
                    bodyObj.children = bodyChildren;
                }

                returnObject.children[1] = bodyObj;
            }
            else if (node._astname === "If") {
                returnObject.id = "conditional";
                var testObj = buildSimplifiedAST(node.test);
                returnObject.children[0] = testObj;


                if (node.orelse != null && node.orelse.length > 0) {
                    var orElseObj = buildSimplifiedAST(node.orelse[0]);
                    returnObject.children[1] = orElseObj;
                }

                else {
                    returnObject.children[1] = { id: 'empty' };
                }

                if (node.body != null) {
                    var bodyObjs = { id: "body" };
                    var bodyChildren = [];

                    for (var i in node.body) {
                        var bodyObj = buildSimplifiedAST(node.body[i]);
                        bodyChildren.push(bodyObj);

                    }
                    if (bodyChildren.length > 0) {
                        bodyObjs.children = bodyChildren;
                    }

                    returnObject.children[2] = bodyObjs;
                }
                else {
                    returnObject.children[2] = { id: 'empty' };
                }
            }
            else if (node._astname === "Assign") {
                returnObject.id = "assign";

                var targetObj = buildSimplifiedAST(node.target);
                returnObject.children[0] = targetObj;

                var valueObj = buildSimplifiedAST(node.value);
                returnObject.children[1] = valueObj;
            }
            else if (node._astname === "Subscript") {
                returnObject.id = "subscript";

                var sliceObj = buildSimplifiedAST(node.slice);
                var slicedValue = buildSimplifiedAST(node.value);

                returnObject.children[0] = sliceObj;
                returnObject.children[1] = slicedValue;

            }
            else if (node._astname === "Slice") {
                returnObject.id = "slice";

                var upperObj = buildSimplifiedAST(node.upper);
                var lowerObj = buildSimplifiedAST(node.lower);

                returnObject.children[0] = upperObj;
                returnObject.children[1] = lowerObj;

                var stepObj = buildSimplifiedAST(node.step);
                returnObject.children[2] = stepObj;

            }

            else if (node._astname === "Index") {
                returnObject.id = "index";
                var indexValue = buildSimplifiedAST(node.value);

                returnObject.children[0] = indexValue;

            }
            else if (node._astname === "AugAssign") {
                //augassign gets expanded. "i += j" becomes "i = i + j"
                returnObject.id = "assign";

                var targetObj = buildSimplifiedAST(node.target);
                returnObject.children[0] = targetObj;

                //we need to do the fake binop thing
                var fakeBinOp = {
                    _astname: "BinOp",
                    left: node.target,
                    right: node.value,
                    op: { name: node.op.name }
                };

                var valueObj = buildSimplifiedAST(fakeBinOp);
                returnObject.children[1] = valueObj;
            }
            else if (node._astname === "Attribute") {
                returnObject.id = "attr";
                returnObject.children[0] = { id: node.v };
                //TODO this should work but I'm leaving the todo in here in case it breaks
            }
            else if (node._astname === "Call") {
                returnObject.id = "call";
                var funcObj = buildSimplifiedAST(node.func);
                var argsObj = { id: "args" };
                var argsList = [];


                if ('args' in node) {
                    for (var i in node.args) {
                        var singleArgObj = buildSimplifiedAST(node.args[i]);
                        argsList.push(singleArgObj);

                    }
                }

                if (argsList.length > 0) {
                    argsObj.children = argsList;
                }

                else if ('attr' in node) {
                    args = buildSimplifiedAST(node.func.value);

                    if (args.id !== "empty") {
                        argsObj.children = [args];
                    }
                }

                returnObject.children[0] = funcObj;
                returnObject.children[1] = argsObj;
            }
            else if (node._astname === "Return") {
                returnObject.id = "return";
                var valueObj = buildSimplifiedAST(node.value);

                if (valueObj != null) {
                    returnObject.children[0] = valueObj;
                }
            }
            else if (node._astname === "Compare") {
                returnObject.id = "compare";
                var op = node.ops[0].name;
                if (op !== "NotEq") {
                    var reverse = false;

                    if (op === "GtE") {
                        reverse = true;
                        op = "LtE";
                    }

                    if (op === "Gt") {
                        op = "Lt";
                        reverse = true;
                    }

                    var leftObj = node.left;
                    var rightObj = node.comparators[0];

                    if (reverse) {
                        var container = leftObj;
                        leftObj = rightObj;
                        rightObj = container;
                    }

                    leftObj = buildSimplifiedAST(leftObj);
                    rightObj = buildSimplifiedAST(rightObj);

                    returnObject.children[0] = leftObj;
                    returnObject.children[1] = rightObj;
                    returnObject.children[2] = { id: op };
                }
                else {
                    //then handle the not-equal
                    op = "Eq";
                    //right value is a fake node

                    var fakeNode = { _astname: "Not", value: node.comparators[0] };
                    var rightObj = buildSimplifiedAST(fakeNode);
                    var leftObj = buildSimplifiedAST(node.left)

                    returnObject.children[0] = leftObj;
                    returnObject.children[1] = rightObj;
                    returnObject.children[2] = { id: op };
                }
            }
            else if (node._astname === "UnaryOp") {
                if (node.op.name === "Not") {
                    var fakeNode = {
                        _astname: "not",
                        value: node.operand
                    };

                    returnObject.id = "not";
                    returnObject.children[0] = buildSimplifiedAST(fakeNode);
                }
                else {
                    returnObject.children[0] = { id: 'empty' };
                }
            }
            else if (node._astname === "Not") {
                returnObject.id = "not";
                var valueObj = buildSimplifiedAST(node.value);
                returnObject.children[0] = valueObj;
            }
            else if (node._astname === "BoolOp") {
                returnObject.id = "boolop";

                //properties are op and an array of value nodes. "op" and "values"
                returnObject.children[0] = { id: node.op.name };

                var valuesObj = { id: 'values' };
                var valsList = [];


                for (var i in node.values) {
                    var singleVal = buildSimplifiedAST(node.values[i]);
                    valsList.push(singleVal);
                }
                if (valsList.length > 0) {
                    valuesObj.children = valsList;
                }

                returnObject.children[1] = valuesObj;

            }
            else if (node._astname === "BinOp") {
                returnObject.id = "binop";


                var leftObj = buildSimplifiedAST(node.left);
                var rightObj = buildSimplifiedAST(node.right);

                returnObject.children[0] = { id: node.op.name };
                returnObject.children[1] = leftObj;
                returnObject.children[2] = rightObj;
            }
            else if (node._astname === "Name") {
                if (node.id.v === "True" || node.id.v === "False") {
                    returnObject.id = "bool";
                }

                else {
                    var varName = node.id.v;
                    if (getVariableObject(varName) != null) {
                        returnObject.id = "var";
                        returnObject.children[0] = { id: getVariableObject(varName).value.toLowerCase() };
                    }
                    else {

                        //function ref
                        if (getFunctionObject(varName) != null) {
                            returnObject.id = "Function";

                            if (getFunctionObject(varName) != null && getFunctionObject(varName).returns != null) {
                                returnObject.children[0] = { id: getFunctionObject(varName).returns.toLowerCase() };
                            }
                        }
                        else {
                            //is it None???
                            if (node.id.v === "None") {
                                returnObject.id = "null";
                            }
                        }

                    }
                }
            }
            else if (node._astname === "Num") {
                //int or float
                var numVal = node.n.v;

                if (isNodeFloat(node)) {
                    returnObject.id = "float";
                }
                else returnObject.id = "int";
            }
            else if (node._astname === "Str") {
                returnObject.id = "str";
            }
            else if (node._astname === "List" || node._astname === "Tuple") {
                if (node._astname === "List") {
                    returnObject.id = "list";
                }
                else {
                    returnObject.id = "tuple";
                }

                //beyond this these things are identical, for our purposes. Both have elts, and that's what we care about.
                var eltsObj = { id: "elts" };
                var eltsChildren = [];


                for (var i in node.elts) {
                    var eltObj = buildSimplifiedAST(node.elts[i]);
                    eltsChildren.push(eltObj);
                }


                if (eltsChildren.length > 0) {
                    eltsObj.children = eltsChildren;
                }
                returnObject.children[0] = eltsObj;
            }
            if (returnObject.children.length === 0) {
                var idVal = returnObject.id;
                returnObject = { id: idVal };
            }
            if (returnObject.id == null || returnObject.id === "") {
                returnObject.id = "empty";
            }

            return returnObject;
        }

        return { id: 'empty' };
    }

    /* Converts a simplified AST tree to a numberic representation for the purpose of judging edit distance
    * @param simplifiedAST - the simplified AST to be converted
    */
    function numericizeSimplifiedAST(simplifiedAST) {
        var astID = simplifiedAST.id;
        var newID = simplifiedASTdictionary[astID];

        if (newID == null) {
            newID = 0;  //should never happen
        }
        simplifiedAST.id = newID;

        //replace old string ID with numeric id


        if ('children' in simplifiedAST) {

            for (var i in simplifiedAST.children) {
                numericizeSimplifiedAST(simplifiedAST.children[i]);
                simplifiedAST.children[i].parent = newID;
            }
        }


    }

    function analyzeJavascript(source) {
        //  try {
        apiCalls = [];
        allCalls = [];
        allConditionals = [];
        variableAssignments = [];

        var ast = acorn.parse(source, {
            locations: true
        });


        listFuncs = JS_LIST_FUNCS;
        strFuncs = JS_STR_FUNCS;
        createListFuncs = JS_LIST_FUNCS;
        createStrFuncs = JS_STR_FUNCS;

        studentCode = source.split("\n");

        //handle this like you'd handle python.
        var newAST = convertJavascriptASTTree(ast);


        //initialize all of the lists we'll use in each code reading
        originalityLines = [];
        loopLocations = [];
        dataTypes = [];
        functionLines = [];
        uncalledFunctionLines = [];
        userFunctionParameters = [];
        makeBeatRenames = [];
        userFunctionRenames = [];
        forLoopFuncs = [];

        //initialize list of function return objects with all functions from the API that return something (includes casting)
        userFunctionReturns = starterReturns.slice(0);
        allVariables = [];

        //initialize the results object
        var resultsObject = {
            userFunc: 0,
            conditionals: 0,
            forLoops: 0,
            lists: 0,
            strings: 0,
            ints: 0,
            floats: 0,
            booleans: 0,
            variables: 0,
            listOps: 0,
            strOps: 0,
            boolOps: 0,
            comparisons: 0,
            mathematicalOperators: 0,
            consoleInput: 0
        };


        isJavascript = true;
        //PASS 0: efficient originality. we need. JS sample code
        checkOriginality();
        //PASS 1: Do the same thing for function returns from user-defined functions
        evaluateuserFunctionParameters(newAST, resultsObject);
        //PASS 2: Gather and label all user-defined variables. If the value is a function call or a BinOp
        gatherAllVariables(newAST);
        //PASS 3: Account for the variables that only exist as function params. This pass also does a couple other things in the way of functions/removes called function lines from the uncalledFunctionLines so they get checked
        evaluateFunctionReturnParams(newAST);

        //Now, use information gained from labeling user functions to fill in missing variable info, and vice-versa. 10 is the max number of times this will happen before we give up. we can change this if it proves problematic
        var iterations = 0;
        while (!allReturnsFilled() && iterations < 10) {
            evaluateAllEmpties();
            iterations++;
        }
        //PASS 4: Actually analyze the Python.
        recursiveAnalyzeAST(newAST, resultsObject, [false, false]);

        //boolops and comparisons count as boolean values, so if they're used at a certain level, booleans should be AT LEAST the value of these
        if (resultsObject.boolOps > resultsObject.booleans) {
            resultsObject.booleans = resultsObject.boolOps;
        }
        if (resultsObject.comparisons > resultsObject.booleans) {
            resultsObject.booleans = resultsObject.comparisons;
        }

        //translate the calculated values
        translateIntegerValues(resultsObject);
        //console.log(resultsObject);
        lineDict();
        results = resultsObject;
        return resultsObject;


        // }
        //catch (err) {
        //    userNotification.show(ESMessages.general.complexitySyntaxError, 'failure2', 5);
        //    throw err;
        //}
    }


    //This script from github.com/schulzch/edit-distance-js used under the Apache 2.0 license: https://www.apache.org/licenses/LICENSE-2.0.  Copyright © 2016 Christoph Schulz.

    function postOrderWalk(root, childrenCb, visitCb) {
        var child, children, firstChild, index, k, len, node, ref1, ref2, ref3, ref4, stack1, stack2;
        stack1 = [];
        stack2 = [];
        stack1.push([void 0, root]);
        while (stack1.length > 0) {
            ref1 = stack1.pop(), index = ref1[0], node = ref1[1];
            children = childrenCb(node);
            firstChild = (ref2 = children != null ? children[0] : void 0) != null ? ref2 : null;
            stack2.push([index, node, firstChild]);
            ref3 = children != null ? children : [];
            for (index = k = 0, len = ref3.length; k < len; index = ++k) {
                child = ref3[index];
                stack1.push([index, child]);
            }
        }
        while (stack2.length > 0) {
            ref4 = stack2.pop(), index = ref4[0], node = ref4[1], firstChild = ref4[2];
            visitCb(index, node, firstChild);
        }
    }

    function ted(rootA, rootB, childrenCb, insertCb, removeCb, updateCb) {
        var fdist, i, j, k, l, len, len1, preprocess, ref1, ref2, tA, tB, tdist, tdistance, treeDistance, ttrack;
        preprocess = function (root) {
            var t;
            t = {
                nodes: [],
                llds: [],
                keyroots: []
            };
            postOrderWalk(root, childrenCb, function (index, node, firstChild) {
                var childIndex, lldIndex, nIndex;
                nIndex = t.nodes.length;
                t.nodes.push(node);
                if (firstChild == null) {
                    lldIndex = nIndex;
                } else {
                    childIndex = t.nodes.indexOf(firstChild);
                    lldIndex = t.llds[childIndex];
                }
                t.llds.push(lldIndex);
                if (index !== 0) {
                    t.keyroots.push(nIndex);
                }
            });
            t.keyroots.sort();
            return t;
        };
        treeDistance = function (i, j) {
            var a, aL, aN, b, bL, bN, iOff, jOff, k, l, m, min, n, o, p, q, r, ref1, ref2, ref3, ref4;
            aL = tA.llds;
            bL = tB.llds;
            aN = tA.nodes;
            bN = tB.nodes;
            iOff = aL[i] - 1;
            jOff = bL[j] - 1;
            m = i - aL[i] + 2;
            n = j - bL[j] + 2;
            for (a = k = 1, ref1 = m; k < ref1; a = k += 1) {
                fdist[a][0] = fdist[a - 1][0] + removeCb(aN[a + iOff]);
            }
            for (b = l = 1, ref2 = n; l < ref2; b = l += 1) {
                fdist[0][b] = fdist[0][b - 1] + insertCb(bN[b + jOff]);
            }
            for (a = o = 1, ref3 = m; o < ref3; a = o += 1) {
                for (b = r = 1, ref4 = n; r < ref4; b = r += 1) {
                    if (aL[i] === aL[a + iOff] && bL[j] === bL[b + jOff]) {
                        min = trackedMin(fdist[a - 1][b] + removeCb(aN[a + iOff]), fdist[a][b - 1] + insertCb(bN[b + jOff]), fdist[a - 1][b - 1] + updateCb(aN[a + iOff], bN[b + jOff]));
                        ttrack[a + iOff][b + jOff] = min.index;
                        tdist[a + iOff][b + jOff] = fdist[a][b] = min.value;
                    } else {
                        p = aL[a + iOff] - 1 - iOff;
                        q = bL[b + jOff] - 1 - jOff;
                        fdist[a][b] = Math.min(fdist[a - 1][b] + removeCb(aN[a + iOff]), fdist[a][b - 1] + insertCb(bN[b + jOff]), fdist[p][q] + tdist[a + iOff][b + jOff]);
                    }
                }
            }
        };
        tA = preprocess(rootA);
        tB = preprocess(rootB);
        ttrack = zero(tA.nodes.length, tB.nodes.length);
        tdist = zero(tA.nodes.length, tB.nodes.length);
        fdist = zero(tA.nodes.length + 1, tB.nodes.length + 1);
        ref1 = tA.keyroots;
        for (k = 0, len = ref1.length; k < len; k++) {
            i = ref1[k];
            ref2 = tB.keyroots;
            for (l = 0, len1 = ref2.length; l < len1; l++) {
                j = ref2[l];
                treeDistance(i, j);
            }
        }
        tdistance = tdist[tA.nodes.length - 1][tB.nodes.length - 1];
        return new Mapping(tA, tB, tdistance, ttrack, tedBt);
    }

    function trackedMin(a, b, c) {
        var min;
        min = {
            value: a,
            index: 0 | 0
        };
        if (b < min.value) {
            min.value = b;
            min.index = 1 | 0;
        }
        if (c < min.value) {
            min.value = c;
            min.index = 2 | 0;
        }
        return min;
    }

    function zero(width, height) {
        var i, j, k, l, ref, ref1, x, y;
        x = new Array(width);
        for (i = k = 0, ref = width; k < ref; i = k += 1) {
            y = x[i] = new Array(height);
            for (j = l = 0, ref1 = height; l < ref1; j = l += 1) {
                y[j] = 0;
            }
        }
        return x;
    }

    function tedBt(tA, tB, ttrack) {
        var i, j, mapping;
        mapping = [];
        i = tA.nodes.length - 1;
        j = tB.nodes.length - 1;
        while (i >= 0 && j >= 0) {
            switch (ttrack[i][j]) {
                case 0:
                    mapping.push([tA.nodes[i], null]);
                    --i;
                    break;
                case 1:
                    mapping.push([null, tB.nodes[j]]);
                    --j;
                    break;
                case 2:
                    mapping.push([tA.nodes[i], tB.nodes[j]]);
                    --i;
                    --j;
                    break;
                default:
                    throw new Error("Invalid operation " + ttrack[i][j] + " at (" + i + ", " + j + ")");
            }
        }
        if (i === -1 && j !== -1) {
            while (j >= 0) {
                mapping.push([null, tB.nodes[j]]);
                --j;
            }
        }
        if (i !== -1 && j === -1) {
            while (i >= 0) {
                mapping.push([tA.nodes[i], null]);
                --i;
            }
        }
        return mapping;
    }
    var bind = function (fn, me) { return function () { return fn.apply(me, arguments); }; };

    var Mapping = (function () {
        function Mapping(a1, b1, distance, track, backtrackFn) {
            this.a = a1;
            this.b = b1;
            this.distance = distance;
            this.track = track;
            this.backtrackFn = backtrackFn;
            this.alignment = bind(this.alignment, this);
            this.pairs = bind(this.pairs, this);
            this.pairCache = null;
        }

        Mapping.prototype.pairs = function () {
            if (this.pairCache == null) {
                this.pairCache = this.backtrackFn(this.a, this.b, this.track);
            }
            return this.pairCache;
        };

        Mapping.prototype.alignment = function () {
            var alignmentA, alignmentB, k, len, pair, pairs, ref;
            pairs = this.pairs();
            alignmentA = [];
            alignmentB = [];
            ref = pairs.reverse();
            for (k = 0, len = ref.length; k < len; k++) {
                pair = ref[k];
                alignmentA.push(pair[0]);
                alignmentB.push(pair[1]);
            }
            return {
                alignmentA: alignmentA,
                alignmentB: alignmentB
            };
        };

        return Mapping;

    })();
    //end scripts from schulzch/edit-distance-js

    //fun javascript conversion times

    function convertJavascriptASTTree(AstTree) {
        var bodyItems = [];

        for (var i in AstTree.body) {
            var toAdd = convertJavascriptASTNode(AstTree.body[i]);
            bodyItems.push(toAdd);
        }

        var parentItem = { body: bodyItems };
        return parentItem;

    }

    var jsParentLine;
    var jsParentCol;

    /*
    *Converts a Javascript AST to a fake Python AST 
    *@param JsAst The Javascript AST to convert.
    * does this by hierarchically going through JS AST nodes, and constructing a new AST with matching nodes structured like Skulpt Python nodes
    */
    function convertJavascriptASTNode(JsAst) {
        var returnObject = {};
        var object = JsAst;


        if (JsAst.type === "ExpressionStatement") { //remove expression objects. we do not need them.
            object = JsAst.expression;
        }
        var hasBody = false;
        if ('body' in object && 'body' in object.body) { // we skip the blockstatement....thing
            hasBody = true;
            var nodeBody = [];
            for (var i in object.body.body) {
                var bodyItem = convertJavascriptASTNode(object.body.body[i]);
                nodeBody.push(bodyItem);
            }
            if (object.body.body[0] != null && "loc" in object.body.body[0]) {
                nodeBody.lineno = object.body.body[0].loc.start.line;
            }
            else {
                nodeBody.lineno = jsParentLine;
            }
        }


        //line number
        if (object.loc != null) {
            returnObject.lineno = object.loc.start.line;
            returnObject.col_offset = object.loc.start.column;

            jsParentLine = object.loc.start.line;
            jsParentCol = object.loc.start.column;
        }
        else {
            returnObject.lineno = jsParentLine;
            returnObject.col_offset = jsParentCol;
        }

        //now for the hard part - covering everything we might possibly need.

        if (object.type === "ForStatement") { //for loops are a special case, because they function VERY differently in js than in python. We have to build in csome extra stuff in our analysis function, but that's doable, methinks.
            returnObject._astname = "JSFor";
            if (object.init != null) {
                returnObject.init = convertJavascriptASTNode(object.init);
            }
            if (object.test != null) {
                returnObject.test = convertJavascriptASTNode(object.test);
            }
            if (object.update != null) {
                returnObject.update = convertJavascriptASTNode(object.update);
            }
            if (hasBody) {
                returnObject.body = nodeBody;
            }
        }

        else if (object.type === "ForInStatement") { //for loops are a special case, because they function VERY differently in js than in python. We have to build in csome extra stuff in our analysis function, but that's doable, methinks.
            returnObject._astname = "For";

            //has an iter and a target
            returnObject.iter = convertJavascriptASTNode(object.right);
            if (object.left.type = "VariableDeclaration") {
                returnObject.target = convertJavascriptASTNode(object.left.declarations[0].id)
            }
            else {
                returnObject.iter = convertJavascriptASTNode(object.left);
            }


            if (hasBody) {
                returnObject.body = nodeBody;
            }
        }
        else if (object.type === "WhileStatement") {
            if (object.test != null) {
                returnObject.test = convertJavascriptASTNode(object.test);
            }
            if (hasBody) {
                returnObject.body = nodeBody;
            }
        }
        else if (object.type === "FunctionDeclaration") {
            returnObject._astname = "FunctionDef";

            //has id.v with "name" ast
            if (object.id != null) {
                var funcName = object.id.name;
                returnObject.name = { v: funcName, lineno: object.loc.start.line };
            }

            //and a params property.
            var paramsObject = [];
            for (var i in object.params) {
                var paramObject = convertJavascriptASTNode(object.params[i]);
                paramsObject.push(paramObject);
            }
            returnObject.args = {
                args: paramsObject,
                lineno: object.loc.start.line
            };

            //and a body.
            if (hasBody) {
                returnObject.body = nodeBody;
            }
        }
        else if (object.type === "FunctionExpression") {
            returnObject._astname = "FunctionExp";

            //name the function after its location so its return gets properly tallied by function evaluate.
            returnObject.functionName = "" + object.loc.start.line + "|" + object.loc.start.column;

            //make a child object the serves as a function definition
            var funcDefObj = {
                _astname: "FunctionDef",
                lineno: object.loc.start.line,
                name: { v: returnObject.functionName }
            };

            //body in funcdefobj
            if (hasBody) {
                funcDefObj.body = nodeBody
            };


            //params
            var paramsObject = [];
            for (var i in object.params) {
                var paramObject = convertJavascriptASTNode(object.params[i]);
                paramsObject.push(paramObject);
            }

            funcDefObj.args = {
                args: paramsObject,
                lineno: object.loc.start.line
            };

            returnObject.functionDef = funcDefObj;
        }

        else if (object.type === "IfStatement") {
            returnObject._astname = "If";

            if (object.test != null) {
                returnObject.test = convertJavascriptASTNode(object.test);
            }

            returnObject.body = [];
            if (object.consequent != null && 'body' in object.consequent) {
                for (var i in object.consequent.body) {
                    var addObj = convertJavascriptASTNode(object.consequent.body[i]);
                    if (addObj != null) { returnObject.body.push(addObj); }
                }
            }

            //alternate is the "else" component
            if (object.alternate != null && object.alternate.type !== "EmptyStatement") {
                if (object.alternate.type === "BlockStatement") {

                    var bodyList = [];
                    for (var i in object.alternate.body) {
                        bodyList.push(convertJavascriptASTNode(object.alternate.body[i]));
                    }

                    returnObject.orelse = bodyList;
                }

                else {
                    returnObject.orelse = [convertJavascriptASTNode(object.alternate)]; //could be a single line, could be a body node
                }
            }
        }
        else if (object.type === "VariableDeclaration") {
            //we're actually looking in the declarator node
            var declaratorNode = object.declarations[0];

            returnObject._astname = "Assign";

            returnObject.targets = [convertJavascriptASTNode(declaratorNode.id)];
            if (declaratorNode.init != null) {
                returnObject.value = convertJavascriptASTNode(declaratorNode.init);
            }
            else { //fake null node
                returnObject.value = { lineno: object.loc.start.line };
                returnObject.value._astname = "Name";
                returnObject.value.id = {
                    v: "None",
                    lineno: object.loc.start.line
                };
            }
        }
        else if (object.type === "MemberExpression") {

            if ('name' in object.property && (JS_LIST_FUNCS.includes(object.property.name) || JS_STR_FUNCS.includes(object.property.name))) {

                returnObject._astname = "Call";

                //initialize function object
                returnObject.func = {
                    _astname: "Attribute",
                    attr: {
                        v: object.property.name,
                        lineno: object.loc.start.line
                    },
                    lineno: object.loc.start.line
                };

                returnObject.func.value = convertJavascriptASTNode(object.object);
            }
            else {
                returnObject._astname = "Subscript";

                //subscript nodes have a slice, which has a value. here, the slice _astname will ALWAYS be "Index"
                returnObject.slice = { _astname: "Index" };
                returnObject.slice.value = convertJavascriptASTNode(object.property);

                //and a value which is the thing we are slicing.
                returnObject.value = convertJavascriptASTNode(object.object);
            }

        }
        else if (object.type === "CallExpression") {


            returnObject._astname = "Call";
            returnObject.func = {}; //initialize function object

            var attrFuncs = ["pop", "reverse", "length", "sort", "concat", "indexOf", "splice", "push"];

            //first, we HAVE to get the function name
            //if it's a listop or strop . we need all the extra stuff bc memberexpression can also be a subscript which doesn't get saved as an attr


            if (object.callee.type === "MemberExpression" && 'property' in object.callee && 'name' in object.callee.property &&
                    (JS_LIST_FUNCS.includes(object.callee.property.name) || JS_STR_FUNCS.includes(object.callee.property.name))) {

                //get the funcname and store as an attr. attr.v is func name - in JS, this is an identifier in objec.tproperty. we just need the name prop tbqh   //func.value is arg - in JS, this is stored inobject.object.
                returnObject.func._astname = "Attribute";
                returnObject.func.attr = {
                    v: object.callee.property.name,
                    lineno: object.loc.start.line
                };

                returnObject.func.value = convertJavascriptASTNode(object.callee.object);

                if (object.arguments.length > 0) {
                    var argsObj = [];
                    for (var i in object.arguments) {
                        argsObj.push(convertJavascriptASTNode(object.arguments[i]));
                    }
                    returnObject.args = argsObj;
                }
            }
            else if (object.callee.type === "MemberExpression" && 'object' in object.callee && 'name' in object.callee.object && (JS_BUILT_IN_OBJECTS.includes(object.callee.object.name))) {
                returnObject.func.id = {
                    v: object.callee.property.name,
                    lineno: object.loc.start.line
                };

                returnObject.args = [];
            }

            else {
                var funcVal = convertJavascriptASTNode(object.callee);

                returnObject.func = funcVal;
                var argsObj = [];
                for (var i in object.arguments) {
                    argsObj.push(convertJavascriptASTNode(object.arguments[i]));
                }
                returnObject.args = argsObj;
            }

        }
        else if (object.type === "ReturnStatement") {
            returnObject._astname = "Return";

            if (object.argument != null) {
                returnObject.value = convertJavascriptASTNode(object.argument);
            }
        }
        else if (object.type === "BinaryExpression") {

            //this could be a binop OR compare. Check the operator.
            var binOps = ["+", "-", "*", "/", "%", "^", "**"];
            if (binOps.includes(object.operator)) {

                //then we make a binop node
                returnObject._astname = "BinOp";

                //binop has left, right, and operator
                returnObject.left = convertJavascriptASTNode(object.left);
                returnObject.right = convertJavascriptASTNode(object.right);

                var op = "";
                switch (object.operator) {
                    case "+":
                        op = "Add";
                        break;
                    case "-":
                        op = "Sub";
                        break;
                    case "/":
                        op = "Div";
                        break;
                    case "*":
                        op = "Mult";
                        break;
                    case "%":
                        op = "Mod";
                        break;
                    case "**":
                        op = "Pow";
                        break;
                    case "^":
                        op = "Pow";
                        break;
                    default:
                        break;

                }

                returnObject.op = { name: op };

            }
            else {
                //we make a compare node
                //then we make a binop node
                returnObject._astname = "Compare";

                //binop has left, right, and operator
                returnObject.left = convertJavascriptASTNode(object.left);
                returnObject.comparators = [convertJavascriptASTNode(object.right)];
                var op = "";
                switch (object.operator) {
                    case ">":
                        op = "Gt";
                        break;
                    case "<":
                        op = "Lt";
                        break;
                    case ">=":
                        op = "GtE";
                        break;
                    case "<=":
                        op = "LtE";
                        break;
                    case "==":
                        op = "Eq";
                        break;
                    case "!=":
                        op = "NotEq";
                        break;
                    default:
                        break;

                }
                returnObject.ops = [{ name: op }];
            }
        }
        else if (object.type === "UnaryExpression" && object.operator === "!") {
            returnObject._astname = "UnaryOp";

            returnObject.op = { name: "Not" };
            returnObject.operand = convertJavascriptASTNode(object.argument);
        }
        else if (object.type === "UnaryExpression" && object.operator === "-") {

            returnObject._astname = "Num";
            var value = object.argument.value;
            value = -value;

            returnObject.n = {
                lineno: object.loc.start.line,
                v: value
            }
        }
        else if (object.type === "LogicalExpression") {
            returnObject._astname = "BoolOp";

            var leftVal = convertJavascriptASTNode(object.left);
            var rightVal = convertJavascriptASTNode(object.right);
            var op = object.operator;

            returnObject.values = [leftVal, rightVal];

            //operator should be or or and. bitwise ops don't count. 
            if (op === "&&") {
                op = "And";
            }
            else if (op === "||") {
                op = "Or";
            }
            else {
                //do nothing.
            }

            returnObject.op = { name: op };
        }
        else if (object.type === "Literal") {
            //this is all of our basic datatypes - int, float, bool, str, and null

            if (object.value == null) {
                returnObject._astname = "Name";
                returnObject.id = {
                    v: "None",
                    lineno: object.loc.start.line
                };
            }
            else if (typeof object.value === 'string') {
                returnObject._astname = "Str";
                returnObject.s = {
                    v: object.value,
                    lineno: object.loc.start.line
                };
            }
            else if (typeof object.value === 'number') {
                returnObject._astname = "Num";
                returnObject.n = {
                    v: object.value,
                    lineno: object.loc.start.line
                };
            }
            else if (typeof object.value === 'boolean') {
                returnObject._astname = "Name";
                var boolVal = object.value.raw;
                if (boolVal === "true") {
                    boolVal = "True";
                }
                else {
                    boolVal = "False";
                }
                returnObject.id = {
                    v: boolVal,
                    lineno: object.loc.start.line
                };
            }
        }
        else if (object.type === "Identifier") {
            returnObject._astname = "Name";
            returnObject.id = {
                v: object.name,
                lineno: object.loc.start.line
            };
        }
        else if (object.type === "ArrayExpression") {
            returnObject._astname = "List";
            var eltsObj = [];

            for (var i in object.elements) {
                eltsObj.push(convertJavascriptASTNode(object.elements[i]))
            }

            returnObject.elts = eltsObj;
        }
        else if (object.type === "UpdateExpression" || object.type === "AssignmentExpression") {

            //augassign has target, op, value
            if (object.type === "UpdateExpression") {
                returnObject._astname = "AugAssign";

                //++ is just += 1
                var opString = "";
                if (object.operator === "++") {
                    opString = "Add";
                }
                if (object.operator === "--") {
                    opString = "Sub";
                }


                var valueObj = {
                    _astname: "Num",
                    n: {
                        v: 1,
                        lineno: object.loc.start.line
                    },
                    lineno: object.loc.start.line
                };

                var targetObj = convertJavascriptASTNode(object.argument);


                returnObject.target = targetObj;
                returnObject.value = valueObj;
                returnObject.op = opString;
            }
            else {
                if (object.operator === "=") {
                    returnObject._astname = "Assign";

                    returnObject.targets = [convertJavascriptASTNode(object.left)];
                    returnObject.value = convertJavascriptASTNode(object.right);
                }
                else {
                    returnObject._astname = "AugAssign";
                    var opString = "";
                    if (object.operator === "+=") {
                        opString = "Add";
                    }
                    else if (object.operator === "-=") {
                        opString = "Sub";
                    }
                    else if (object.operator === "*=") {
                        opString = "Mult";
                    }
                    else if (object.operator === "/=") {
                        opString = "Div";
                    }
                    else if (object.operator === "%=") {
                        opString = "Mod";
                    }

                    returnObject.op = opString;
                    returnObject.target = convertJavascriptASTNode(object.left);
                    returnObject.value = convertJavascriptASTNode(object.right);
                }
            }

        }
        return returnObject;
    }

    function lineDict() {

        function fillLevels(nodeList, levelList) {
            var childNodes = [];
            var thisLevel = [];
            for (var i in nodeList) {
                if (nodeList[i].children.length > 0) {
                    for (var j in nodeList[i].children) {
                        childNodes.push(nodeList[i].children[j]);
                    }
                }
                thisLevel.push([nodeList[i].start, nodeList[i].end]);

            }
            levelList.push(thisLevel);
            if (childNodes.length > 0) {
                fillLevels(childNodes, levelList);
            }
        }



        lineDictionary = [];

        //initialize array values
        for (var i in studentCode) {
            lineDictionary.push({ line: Number(i) + 1, variables: [], loop: 0, calls: [], ifElse: [] });
        }

        //note every time the user defines a function
        for (var u in userFunctionReturns) {
            if (userFunctionReturns[u].startLine != null) {
                var index = userFunctionReturns[u].startLine - 1;
                lineDictionary[index].userFunction = userFunctionReturns[u];
            }
        }

        //note every time a variable is assigned or modified
        for (var v in variableAssignments) {
            var index = variableAssignments[v].line - 1;
            var variableVal = getVariableObject(variableAssignments[v].name);
            lineDictionary[index].variables.push(variableVal);
        }

        for (var loop in loopLocations) {
            //track the begin points of each loop
            var index = loopLocations[loop][0] - 1;
            lineDictionary[index].loopStart = loopLocations[loop];

            //note which lines are in one or more loops
            for (var loopLine = loopLocations[loop][0] - 1; loopLine <= loopLocations[loop][1] - 1; loopLine++) {
                lineDictionary[loopLine].loop += 1;
            }
        }

        for (var call in allCalls) {
            var index = allCalls[call].line - 1;
            lineDictionary[index].calls.push(allCalls[call]);
        }


        //nested if else statements
        var levels = [];
        fillLevels(allConditionals, levels);


        //remove overlap in levels
        for (var i in levels) {
            for (var j = 0; j < levels[i].length; j++) {
                //if (j != 0) {
                //    //if it's not the first one, subtract 1 from the start value
                //   // levels[i][j][0] -= 1;
                //}
                if (j != levels[i].length - 1) {
                    //if it's not the last one, subtract 1 from the end value
                    levels[i][j][1] -= 1;
                }
                else {
                }
            }
        }
        console.log(levels);

        for (var i in levels) {
            for (var j = 0; j < levels[i].length; j++) {
                var string = "else";
                if (j === 0) {
                    string = "if";
                }
                var start = levels[i][j][0];
                var end = levels[i][j][1];
                for (var p = start; p <= end; p++) {
                    lineDictionary[p - 1].ifElse.push(string);
                }
            }
        }


        return lineDictionary;
    }

    return {
        total: total,
        apiCalls: apiCalls,
        pythonAst: pythonAst,
        analyzePython: analyzePython,
        analyzeJavascript: analyzeJavascript,
        lineDict: lineDict
    };
}]);

