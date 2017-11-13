// examplestepX, exampletext, intro, stepX

var techniques = [];
var placeholderTechnique = {
    hildesheimTechnique: {
        name: "Keine Technik gefunden.",
        boden_type: "-",
        activity: "-",
        problem_recognition: "-",
        search_for_knowledge: "-",
        activation_of_knowledge: "-",
        restructuring_of_knowledge: "-",
        evaluation: "-",
        knowledge_type: "-",
        physical: "-",
        usertype: "-",
        emotional: "-",
        complex: "-",
        webusable: "-",
        interactive: "-",
        driving_source: "-",
        distance: "-",
        link: "-",
    },

    text: {
        name: "Keine Technik gefunden.",
        intro: "Bitte ändere die Filtereinstellungen."
    },

    ktSelectorName: "Keine Technik gefunden.",
    gruppe: "-",
    moderiert: "-",
    dauer: "-",
    schwierigkeit: "-",
    ideenmenge: "-",
    spass: "-",
    ideenqualitaet: "-",
    ideenabwegigkeit: "-",
    anwendungsbereiche: []
};

// maps technique property values from single letters to their full names
var mappings = {};

var weight = {
    dauer: 16.6,
    schwierigkeit: 16.6,
    menge: 16.6,
    qualitaet: 16.6,
    diversitaet: 16.6,
    spass: 16.6,
};

// type can be any member of weight
function critique(type) {
    if (type === "reset") {
        for (i in weight) {
            weight[i] = 16.6;
        }
        return $.extend({}, weight);
    }

    var strength = 20;

    if (!weight.hasOwnProperty(type)) return; // only works if type is part of weight
    if (weight[type] == 100) return weight;

    oldWeightOfType = weight[type];
    weight[type] = Math.min(100, weight[type] + strength);

    var toSubtract = weight[type] - oldWeightOfType;
    var maxIterations = Math.round(strength * 100);
    var iterationCounter = 0;
    while (toSubtract > 0 && maxIterations >= iterationCounter) { // subtract as much from other weights as was added to weight[type]; if other weights are all 0, maxIterations prevents infinite loop
        for (i in weight) {
            if (i == type) continue;
            else {
                if (weight[i] > 0) {
                    weight[i] = Math.max(0, weight[i] - 0.1); // use babysteps for more precision (otherwise if weight[i] == 0.2 and we remove 1, we have .8 too much in total)
                    toSubtract -= 0.1;
                }
            }
            iterationCounter++;
        }
    }

    return $.extend({}, weight); // return copy of weight
}

$.getJSON("json/MergedTechniqueData.json", function (json) {
    techniques = json;
});

$.getJSON("json/Mappings.json", function (json) {
    mappings = json;
});

// checks if two strings have at least one shared character
function haveSharedChar(s1, s2) {
    // go over all chars in s1 and return true if one of them is part of s2
    for (var i = 0; i < s1.length; i++) {
        if (s2.indexOf(s1[i]) > -1) return true;
    }
}

function haveMatchingGoal(selectedGoals, technique) {
    // for goals-Evaluate technique has to have either boden_type: v or Evaluation: e
    var goalToLetterMap = {
        "goals-Ideas": "e",
        "goals-Evaluate": "v"
    }; // "goals-Problems" & "goals-Knowledge" left out intentionally; see bottom of function

    for (i in selectedGoals) {
        selectedGoalLetter = goalToLetterMap[selectedGoals[i]];
        // if selectedGoalLetter in technique.boden_type
        if (technique.boden_type.indexOf(selectedGoalLetter) > -1) return true;
    }

    if (selectedGoals.indexOf("goals-Evaluate") > -1) {
        if (technique.evaluation === "e") return true;
    }

    if (selectedGoals.indexOf("goals-Knowledge") > -1) {
        if (technique.search_for_knowledge !== "-" || technique.activation_of_knowledge !== "-") return true;
    }

    // if goals-Problems in selectedGoals
    if (selectedGoals.indexOf("goals-Problems") > -1) {
        return (technique.problem_recognition === "p");
    }
}

function matchesGroupSize(technique, groupFilter) {
    var minSize = parseInt(technique.gruppe.split("-")[0]);
    var maxSize = parseInt(technique.gruppe.split("-")[1]);

    return groupFilter >= minSize && groupFilter <= maxSize;
}

function matchesDifficulty(technique, difficultyFilter) {
    return (technique.schwierigkeit <= 3 && difficultyFilter === "anfaenger") || (technique.schwierigkeit >= 4 && difficultyFilter === "fortgeschritten");
}

function matchesMinimums(technique, filters) {
    return (technique.ideenmenge >= filters.minIdeaAmount && technique.ideenqualitaet >= filters.minIdeaQuality && technique.ideenabwegigkeit >= filters.minIdeaDiversity);
}

// returns list of techniques that match the filters
// filters has to contain data for all existing filters
function getFilteredTechniques(techniques, filters) {
    var filteredTechniques = techniques.filter(function (technique) {
        // map interface filters to property values
        var filterMap = {
            "radioModerated": "y",
            "radioNotModerated": "n"
        };

        // check if properties match filters or filter doesn't need to be applied (cause all possible values are fine, e.g. "GroupBoth")
        return (haveMatchingGoal(filters.selectedGoals, technique.hildesheimTechnique) &&
            (filters.group === "egal" || matchesGroupSize(technique, filters.group)) &&
            (filters.moderated === "egal" || haveSharedChar(filterMap[filters.moderated], technique.moderiert)) &&
            (filters.duration === "egal" || filters.duration === technique.dauer) &&
            (filters.difficulty === "egal" || matchesDifficulty(technique, filters.difficulty)) &&
            (matchesMinimums(technique, filters))
        );
    });

    return filteredTechniques;
}

// weight is an object that contains a weight between 0 and 100 for all dimensions of interest
function getUtility(technique, weight) {
    var dauerMap = {
        "kurz": 1,
        "mittel": 3,
        "lang": 5,
        "lange": 5
    }

    var utility = 0.0;

    utility += (6 - dauerMap[technique.dauer]) * weight.dauer;
    utility += (6 - technique.schwierigkeit) * weight.schwierigkeit;
    utility += technique.ideenmenge * weight.menge;
    utility += technique.ideenqualitaet * weight.qualitaet;
    utility += technique.ideenabwegigkeit * weight.diversitaet;
    utility += technique.spass * weight.spass;

    return utility;
}

function getPropertySimilarityScore(tech1, tech2, property, weight) {
    if (tech1[property] === tech2[property]) {
        return weight;
    }
    // not exactly the same, but share attribute value: half score
    else if (haveSharedChar(tech1[property], tech2[property])) {
        return weight / 2;
    }
    // 0 if no matches
    return 0;
}

// gets weighted similarity score for two techniques
function getSimilarity(tech1, tech2) {
    var hildeSimWeight = {
        "activity": 50
    };
    var simWeight = weight;
    var similarityScore = 0;

    for (property in hildeSimWeight) {
        similarityScore += getPropertySimilarityScore(tech1.hildesheimTechnique, tech2.hildesheimTechnique, property, hildeSimWeight[property]);
    }

    for (property in simWeight) {
        if (tech1[property] === tech2[property]) similarityScore += simWeight[property];
        else if (Math.abs(tech1[property] - tech2[property]) <= 1) similarityScore += simWeight[property] / 2; // doesn't work for gruppe, moderiert, dauer
    }

    return similarityScore;
}


// activeTechniqueNames is a list that contains the names of the other two techniques that 
// are currently shown to prevent showing the same technique more than once simultaneously
function getSimilarTechnique(technique, filters, activeTechniqueNames) {
    // remove technique from global techniques list
    for (var i = 0; i < techniques.length; i++) {
        if (technique.name === techniques[i].text.name) {
            technique = techniques[i]; // turn interface-technique into database-technique format
            techniques.splice(i, 1);
            break;
        }
    }

    var filteredTechniques = getFilteredTechniques(techniques, filters);
    var similarTechnique = {
        technique: placeholderTechnique,
        similarity: -1
    };

    for (var i = 0; i < filteredTechniques.length; i++) {
        if (activeTechniqueNames.indexOf(filteredTechniques[i].text.name) > -1) continue; // don't even look at techniques that are already displayed in the interface

        var similarity = getSimilarity(technique, filteredTechniques[i]);

        if (similarity > similarTechnique.similarity) {
            similarTechnique.technique = filteredTechniques[i];
            similarTechnique.similarity = similarity;
        }
    }

    return similarTechnique.technique;
}

function getRecommendations(filters) {
    var filteredTechniques = getFilteredTechniques(techniques, filters);

    // Maps Activities to techniques with highest rank, so we can later get 3 highest-rank techniques for 3 different activities
    var topRankedTechniques = {
        "s": {
            technique: placeholderTechnique,
            utility: -1
        },
        "f": {
            technique: placeholderTechnique,
            utility: -1
        },
        "d": {
            technique: placeholderTechnique,
            utility: -1
        },
        "e": {
            technique: placeholderTechnique,
            utility: -1
        },
        "r": {
            technique: placeholderTechnique,
            utility: -1
        },
        "q": {
            technique: placeholderTechnique,
            utility: -1
        }
    };

    var backup = {
        technique: placeholderTechnique,
        utility: -1
    };
    for (i in filteredTechniques) {
        var technique = filteredTechniques[i];
        var utility = getUtility(technique, weight);
        // for every activity of the technique, check if it's the highest-utility technique for that activity
        technique.hildesheimTechnique.activity = technique.hildesheimTechnique.activity.replace(/[^a-z]/g, ''); // remove all non-letter characters; some techniques have "()" in their activities
        for (j in technique.hildesheimTechnique.activity) {
            var activity = technique.hildesheimTechnique.activity[j];
            if (activity === "-") continue; // ignore techniques without activity; maybe remove them from TechniqueData.json?

            // if it is the highest-utility technique for that activity, add it to topRankedTechniques
            if (utility > topRankedTechniques[activity].utility) {
                topRankedTechniques[activity].technique = technique;
                topRankedTechniques[activity].utility = utility;
                // break;
            } else if (utility > backup.utility) {
                backup.technique = technique;
                backup.utility = utility;
            }
        }
    }

    // Filter down to 3 highest-utility techniques in topRankedTechniques and return them
    var topThreeTechniques = {
        "#1": {
            technique: placeholderTechnique,
            utility: -1
        },
        "#2": {
            technique: placeholderTechnique,
            utility: -1
        },
        "#3": {
            technique: placeholderTechnique,
            utility: -1
        }
    }
    for (i in topRankedTechniques) {
        var technique = topRankedTechniques[i].technique;
        var utility = topRankedTechniques[i].utility;

        // check if technique is better than one of the top three, replace according technique and continue
        if (utility > topThreeTechniques["#1"].utility) {
            topThreeTechniques["#3"].technique = topThreeTechniques["#2"].technique; // cascade down
            topThreeTechniques["#3"].utility = topThreeTechniques["#2"].utility;
            
            topThreeTechniques["#2"].technique = topThreeTechniques["#1"].technique;
            topThreeTechniques["#2"].utility = topThreeTechniques["#1"].utility;

            topThreeTechniques["#1"].technique = technique;
            topThreeTechniques["#1"].utility = utility;
            continue;
        } else if (utility > topThreeTechniques["#2"].utility) {
            topThreeTechniques["#3"].technique = topThreeTechniques["#2"].technique; // cascade down
            topThreeTechniques["#3"].utility = topThreeTechniques["#2"].utility;

            topThreeTechniques["#2"].technique = technique;
            topThreeTechniques["#2"].utility = utility;
            continue;
        } else if (utility > topThreeTechniques["#3"].utility) {
            topThreeTechniques["#3"].technique = technique;
            topThreeTechniques["#3"].utility = utility;
            continue;
        }
    }

    // allow one technique of same Handlungsart if the alternative would be "no result"
    var backupIsUnique = true;
    for (i in topThreeTechniques) {
        if (topThreeTechniques[i].technique.text.name == backup.technique.text.name) {
            backupIsUnique = false;
        }
    }
    if (backupIsUnique) {
        if (topThreeTechniques["#2"].utility === -1) topThreeTechniques["#2"] = backup;
        else if (topThreeTechniques["#3"].utility === -1) topThreeTechniques["#3"] = backup;
    }

    return topThreeTechniques;
}