var DEBUGMODE = false;
var interactionHistory = [];
var undoSteps = 2; // how far back we go with an undo; so if we undo twice in a row we can undo to the correct state

var rndID = randomString();

// STEP ONE
var checkedFilters = {
    group: "gruppenGroesse",
    moderated: "radioModeratedBoth",
    duration: "radioBothDuration",
    difficulty: "radioDiffBoth",
    selectedGoals: [],
    minIdeaAmount: 1,
    minIdeaQuality: 1,
    minIdeaDiversity: 1
}; // IDs of checked radio buttons and selectedGoals

function toggleSelectedGoal() {
    $(this).toggleClass("selectedGoal");

    var goalID = $(this).attr("id");

    // if it's not in selectedGoals, add this goal
    if ($.inArray(goalID, checkedFilters.selectedGoals) === -1) {
        checkedFilters.selectedGoals.push(goalID);
    }
    // otherwise remove it
    else {
        checkedFilters.selectedGoals = checkedFilters.selectedGoals.filter(function (goal) {
            return goal != goalID;
        });
    }
}

function toggleExplainedGoal() {
    var explanationToGoalMap = {};
    explanationToGoalMap["ex-Problems"] = "goals-Problems";
    explanationToGoalMap["ex-Knowledge"] = "goals-Knowledge";
    explanationToGoalMap["ex-Ideas"] = "goals-Ideas";
    explanationToGoalMap["ex-Evaluate"] = "goals-Evaluate";

    // Get ID of goal-div that this explanation belongs to
    var goalID = explanationToGoalMap[$(this).attr("id")];

    $("#" + goalID).toggleClass("selectedGoal");

    // if it's not in selectedGoals, add this goal
    if ($.inArray(goalID, checkedFilters.selectedGoals) === -1) {
        checkedFilters.selectedGoals.push(goalID);
    }
    // otherwise remove it
    else {
        checkedFilters.selectedGoals = checkedFilters.selectedGoals.filter(function (goal) {
            return goal != goalID;
        });
    }
}

function syncFiltersToInterface() {
    $("#gruppenGroesseModal").val(checkedFilters.group);

    $("#" + checkedFilters.moderated + "Modal").prop('checked', 'checked');

    if (checkedFilters.duration === "kurz") $("#radioShortDurationModal").prop('checked', 'checked');
    else if (checkedFilters.duration === "mittel") $("#radioMediumDurationModal").prop('checked', 'checked');
    else if (checkedFilters.duration === "lange") $("#radioLongDurationModal").prop('checked', 'checked');
    else $("#radioBothDurationModal").prop('checked', 'checked');

    $("#" + checkedFilters.difficulty + "Modal").prop('checked', 'checked');

    mengenSliderModal.slider('setValue', checkedFilters.minIdeaAmount);
    qualiSliderModal.slider('setValue', checkedFilters.minIdeaQuality);
    diversSliderModal.slider('setValue', checkedFilters.minIdeaDiversity);

    $("#topGroup").text(checkedFilters.group);

    if (checkedFilters.moderated === "radioModerated") $("#topModeriert").text("Ja");
    else if (checkedFilters.moderated === "radioNotModerated") $("#topModeriert").text("Nein");
    else $("#topModeriert").text("egal");

    if (checkedFilters.duration === "kurz") $("#topDauer").text("Kurz");
    else if (checkedFilters.duration === "mittel") $("#topDauer").text("Mittel");
    else if (checkedFilters.duration === "lange") $("#topDauer").text("Lang");
    else $("#topDauer").text("egal");

    $("#topMenge").text(checkedFilters.minIdeaAmount);
    $("#topQuali").text(checkedFilters.minIdeaQuality);
    $("#topDivers").text(checkedFilters.minIdeaDiversity);

    if (checkedFilters.difficulty === "anfaenger") $("#topSchwierigkeit").text("Standard");
    else if (checkedFilters.difficulty === "fortgeschritten") $("#topSchwierigkeit").text("Experte");
    else $("#topSchwierigkeit").text("egal")
}

// postFix can be "KO" for KO-Criteria
function syncFiltersFromInterface(postFix = "") {
    if (postFix === "KO") {
        checkedFilters.group = $("#gruppenGroesse").val();
        if (checkedFilters.group == "" || checkedFilters.group == "1-99" || parseInt(checkedFilters.group) > 99) checkedFilters.group = "egal";

        checkedFilters.moderated = $("input[name=moderated" + postFix + "]:checked").val();

        checkedFilters.duration = $("input[name=duration" + postFix + "]:checked").val();
        checkedFilters.difficulty = $("input[name=difficulty" + postFix + "]:checked").val();

        checkedFilters.minIdeaAmount = 1;
        checkedFilters.minIdeaQuality = 1;
        checkedFilters.minIdeaDiversity = 1;
    } else { // sync from modal
        checkedFilters.group = $("#gruppenGroesseModal").val();
        if (checkedFilters.group == "" || checkedFilters.group == "1-99" || parseInt(checkedFilters.group) > 99) checkedFilters.group = "egal";

        checkedFilters.moderated = $("input[name=moderated" + postFix + "]:checked").val();

        checkedFilters.duration = $("input[name=duration" + postFix + "]:checked").val();
        checkedFilters.difficulty = $("input[name=difficulty" + postFix + "]:checked").val();

        checkedFilters.minIdeaAmount = mengenSliderModal.val();
        checkedFilters.minIdeaQuality = qualiSliderModal.val();
        checkedFilters.minIdeaDiversity = diversSliderModal.val();
    }
}

function syncTechniquesToInterface() {
    fillTechniques([firstTechnique, secondTechnique, thirdTechnique]);
}

function setInterfaceTechniqueToRecommendedTechnique(interfaceTechnique, recTechnique) {
    if (recTechnique.text === undefined) console.log(recTechnique);
    interfaceTechnique.name = recTechnique.text.name;

    interfaceTechnique.description = recTechnique.text.intro; // TODO: add steps, examples, examplesteps
    interfaceTechnique.text = recTechnique.text;

    if (recTechnique.gruppe.split("-")[1] === "99") {
        interfaceTechnique.group = "egal";
    } else {
        interfaceTechnique.group = recTechnique.gruppe;
    }
    if (recTechnique.moderiert === "y") interfaceTechnique.mod = "Ja";
    else if (recTechnique.moderiert === "n") interfaceTechnique.mod = "Nein";
    else if (recTechnique.moderiert === "yn") interfaceTechnique.mod = "Beides";
    interfaceTechnique.duration = recTechnique.dauer;

    interfaceTechnique.amount = recTechnique.ideenmenge;
    interfaceTechnique.quality = recTechnique.ideenqualitaet;
    interfaceTechnique.diversity = recTechnique.ideenabwegigkeit;

    if (recTechnique.schwierigkeit === "-") interfaceTechnique.difficulty = "-"
    else interfaceTechnique.difficulty = (recTechnique.schwierigkeit > 3) ? "Experte" : "Standard";
    interfaceTechnique.fun = recTechnique.spass;
}

// takes the techniques recommended by getRecommendation() and sets the
// first/second/thirdTechnique variables and the interface accordingly
function setTechniques(recommendedTechniques) {
    setInterfaceTechniqueToRecommendedTechnique(firstTechnique, recommendedTechniques["#1"].technique);
    setInterfaceTechniqueToRecommendedTechnique(secondTechnique, recommendedTechniques["#2"].technique);
    setInterfaceTechniqueToRecommendedTechnique(thirdTechnique, recommendedTechniques["#3"].technique);
}

function showRecommendationsAndHideGoalChoice() {
    $("#goalChoice").fadeOut("slow");
    $(".stepTwo").fadeIn("slow");
}

$("#goals .col").click(toggleSelectedGoal);
$("#explanations .col").click(toggleExplainedGoal);

$("#generateRecommendations").click(function () {
    if (checkedFilters.selectedGoals.length > 0 || DEBUGMODE) {
        syncFiltersFromInterface("KO"); // read KO criteria radio buttons
        showRecommendationsAndHideGoalChoice();
        syncFiltersToInterface(); // write KO criteria to filter box

        setTechniques(getRecommendations(checkedFilters)); // get inital recommendations
        syncTechniquesToInterface();

        updateInteractionHistory("init", $.extend(true, {}, weight));
        critiqueAndUpdate($("input[name=priority]:checked").val());
    } else window.alert("Bitte wähle ein oder mehrere Ziele aus.");
});


// MODAL SLIDERS
var mengenSliderModal = $('#ideenMengeSliderModal').slider({
    formatter: function (value) {
        return value;
    }
});
var qualiSliderModal = $('#ideenQualiSliderModal').slider({
    formatter: function (value) {
        return value;
    }
});
var diversSliderModal = $('#ideenDiversSliderModal').slider({
    formatter: function (value) {
        return value;
    }
});

// STEP TWO
var firstTechnique = {
    name: "Brainstorming",
    description: "Alle Ideen, die einem in den Kopf schießen, notieren und diese zur Inspiration für neue Ideen verwenden.",
    link: "#",
    text: {},
    amount: 2,
    quality: 3,
    diversity: 2,
    group: "Beide",
    mod: "Beides",
    duration: "Lang",
    difficulty: "Einfach",
    fun: 3,
    technique: placeholderTechnique
}
var secondTechnique = {
    name: "6-3-5",
    description: "Jeder schreibt eine Idee auf einen Zettel und reicht diesen an seine/n Nachbar/in, welche/r sich von dieser inspirieren lässt.",
    link: "#",
    text: {},
    amount: 2,
    quality: 3,
    diversity: 2,
    group: "Gruppe",
    mod: "Nein",
    duration: "Lang",
    difficulty: "Nicht-So-Einfach",
    fun: 3,
    technique: placeholderTechnique
}
var thirdTechnique = {
    name: "Inspirational Words",
    description: "Wähle ein zufälliges Wort (z.B. aus einem Wörterbuch) und versuche dieses auf dein Problem zu beziehen um dich zu inspirieren.",
    link: "#",
    text: {},
    amount: 2,
    quality: 3,
    diversity: 2,
    group: "Beide",
    mod: "Nein",
    duration: "Kurz",
    difficulty: "Einfach",
    fun: 3,
    technique: placeholderTechnique
}

function getDescString(technique) {
    var descString = "<p class='descExtra'><ol class='descExtra'>";
    for (var j = 0; j < 10; j++) { // TODO get actual .text obj. property count!
        for (var j = 0; j < 10; j++) { // TODO get actual .text obj. property count!
            if (technique.text.hasOwnProperty("step" + j)) {
                descString += "<li>" + technique.text["step" + j] + "</li>";
            }
        }
    }
    descString += "</ol></p>";

    if (technique.text.hasOwnProperty("exampletext") || technique.text.hasOwnProperty("examplestatement")) {
        if (technique.text.hasOwnProperty("exampletext")) descString += ("<p class='descExtra'>" + technique.text["exampletext"] + "</p>");
        if (technique.text.hasOwnProperty("examplestatement")) descString += ("<p class='descExtra'>" + technique.text["examplestatement"] + "</p>");

        descString += "<p class='descExtra'><ol class='descExtra'>";
        if (technique.text.hasOwnProperty("examplestep" + j)) {
            descString += "<li>" + technique.text["examplestep" + j] + "</li>";
        }
        descString += "</ol></p>";
    }

    return descString;
}

// newTechniques is an array, contains 3 technique Objects
function fillTechniques(newTechniques) {
    var techNumbers = ["first", "second", "third"];

    $(".descExtra").addClass("hidden"); // hide old extra-descriptions (steps and examples)

    for (var i = 0; i < techNumbers.length; i++) {
        $("#" + techNumbers[i] + "TechniqueName").text(newTechniques[i].name);
        $("#" + techNumbers[i] + "TechniqueDescription").text(newTechniques[i].description);

        var descString = getDescString(newTechniques[i]);
        $(descString).insertAfter("#" + techNumbers[i] + "TechniqueDescription");

        $("#" + techNumbers[i] + "TechniqueGruppe").text(newTechniques[i].group);
        $("#" + techNumbers[i] + "TechniqueMod").text(newTechniques[i].mod);
        if (newTechniques[i].duration === "kurz") $("#" + techNumbers[i] + "TechniqueDauer").text("Kurz");
        else if (newTechniques[i].duration === "mittel") $("#" + techNumbers[i] + "TechniqueDauer").text("Mittel");
        else if (newTechniques[i].duration === "lange") $("#" + techNumbers[i] + "TechniqueDauer").text("Lang");
        else $("#" + techNumbers[i] + "TechniqueDauer").text("egal");

        $("#" + techNumbers[i] + "TechniqueIdeenmenge").text(newTechniques[i].amount);
        $("#" + techNumbers[i] + "TechniqueQualitaet").text(newTechniques[i].quality);
        $("#" + techNumbers[i] + "TechniqueDiversitaet").text(newTechniques[i].diversity);

        $("#" + techNumbers[i] + "TechniqueSchwierigkeit").text(newTechniques[i].difficulty);
        $("#" + techNumbers[i] + "TechniqueSpass").text(newTechniques[i].fun);
    }
}

// techNumber is "first", "second" or "third"
function fadeInReroll(techNumber, newTechnique) {
    $(".descExtra").addClass("hidden");

    $("#" + techNumber + "TechniqueName").text(newTechnique.text.name);

    $("#" + techNumber + "TechniqueDescription").text(newTechnique.text.intro);

    var descString = getDescString(newTechnique);
    $(descString).insertAfter("#" + techNumber + "TechniqueDescription");

    if (newTechnique.gruppe === "1-99") $("#" + techNumber + "TechniqueGruppe").text("egal");
    else $("#" + techNumber + "TechniqueGruppe").text(newTechnique.gruppe);

    if (newTechnique.moderiert === "y") $("#" + techNumber + "TechniqueMod").text("Ja");
    else if (newTechnique.moderiert === "n") $("#" + techNumber + "TechniqueMod").text("Nein");
    else $("#" + techNumber + "TechniqueMod").text("egal");

    if (newTechnique.dauer === "kurz") $("#" + techNumber + "TechniqueDauer").text("Kurz");
    else if (newTechnique.dauer === "mittel") $("#" + techNumber + "TechniqueDauer").text("Mittel");
    else if (newTechnique.dauer === "lange") $("#" + techNumber + "TechniqueDauer").text("Lang");
    else $("#" + techNumber + "TechniqueDauer").text("egal");

    // $("#" + techNumber + "TechniqueSchwierigkeit").text(newTechnique.schwierigkeit);
    if (newTechnique.schwierigkeit > 3) $("#" + techNumber + "TechniqueSchwierigkeit").text("Experte");
    else $("#" + techNumber + "TechniqueSchwierigkeit").text("Standard");

    $("#" + techNumber + "TechniqueIdeenmenge").text(newTechnique.ideenmenge);
    $("#" + techNumber + "TechniqueQualitaet").text(newTechnique.qualitaet);
    $("#" + techNumber + "TechniqueDiversitaet").text(newTechnique.diversitaet);

    $("#" + techNumber + "TechniqueSpass").text(newTechnique.spass);

    $("#" + techNumber + "Technique").fadeIn("slow");
}

// techNumber is "first", "second" or "third"
function reroll(techNumber, technique) {
    $("#" + techNumber + "Technique").fadeOut("slow");
    var newTechnique = getSimilarTechnique(technique, checkedFilters, [firstTechnique.name, secondTechnique.name, thirdTechnique.name]);

    setTimeout(function () {
        setInterfaceTechniqueToRecommendedTechnique(technique, newTechnique);
        fadeInReroll(techNumber, newTechnique);
    }, 500);
}

function fadeOutAll() {
    $("#firstTechnique").fadeOut("slow");
    $("#secondTechnique").fadeOut("slow");
    $("#thirdTechnique").fadeOut("slow");
}

function fadeInAll() {
    $("#firstTechnique").fadeIn("slow");
    $("#secondTechnique").fadeIn("slow");
    $("#thirdTechnique").fadeIn("slow");
}

function generateNewRecommendations() {
    fadeOutAll();
    syncFiltersFromInterface();

    setTechniques(getRecommendations(checkedFilters));

    setTimeout(function () {
        syncTechniquesToInterface();
        fadeInAll();
    }, 500);
}

// interactionType is a string that shows which button was pressed (e.g. "reroll1", "criticism: moreBeginnerFriendly", "changed filters")
function updateInteractionHistory(interactionType, weight) {
    var newWeight = weight || null;

    // $("#undoButton").removeClass("disabled");

    if (interactionType != "undo") undoSteps = 2;

    // deep-copy state
    interactionHistory.push({
        interactionType: interactionType,
        techniques: [firstTechnique.text.name, secondTechnique.text.name, thirdTechnique.text.name],
        filters: $.extend(true, {}, checkedFilters),
        selectedGoals: checkedFilters.selectedGoals.slice(),
        newWeight: newWeight
    });
}

function syncNewWeightToInterface(newWeight) {
    $("#dauerBar").attr("aria-valuenow", newWeight["dauer"]).css('width', newWeight["dauer"] + "%").text(newWeight["dauer"] + "%");
    $("#schwierigkeitBar").attr("aria-valuenow", newWeight["schwierigkeit"]).css('width', newWeight["schwierigkeit"] + "%").text(newWeight["schwierigkeit"] + "%");
    $("#mengeBar").attr("aria-valuenow", newWeight["menge"]).css('width', newWeight["menge"] + "%").text(newWeight["menge"] + "%");
    $("#qualitaetBar").attr("aria-valuenow", newWeight["qualitaet"]).css('width', newWeight["qualitaet"] + "%").text(newWeight["qualitaet"] + "%");
    $("#diversitaetBar").attr("aria-valuenow", newWeight["diversitaet"]).css('width', newWeight["diversitaet"] + "%").text(newWeight["diversitaet"] + "%");
    $("#spassBar").attr("aria-valuenow", newWeight["spass"]).css('width', newWeight["spass"] + "%").text(newWeight["spass"] + "%");

}

function critiqueAndUpdate(critiqueType) {
    var newWeight = critique(critiqueType);

    // store exact values of weight in history..
    updateInteractionHistory("critique:" + critiqueType, newWeight);

    // ..but only show rounded numbers
    for (i in newWeight) {
        newWeight[i] = Math.round(newWeight[i]);
    }

    syncNewWeightToInterface(newWeight);

    generateNewRecommendations();
}

function pick(position) {
    if (!confirm("Diese Technik auswählen und Empfehlungsprozess beenden?")) return;

    updateInteractionHistory("pick:" + position);
    console.log(interactionHistory);
    $.ajax({
        dataType: "json",
        type: "post",
        url: "/result",
        data: {
            "result": interactionHistory,
            "id": rndID
        },
        success: function (data, textStatus, jqXHR) {
            if (typeof data.redirect == 'string') window.location = data.redirect;
        },
        error: function () {
            alert("Fehler! Bitte noch einmal versuchen!");
        }
    });
}

function undoLastAction() {
    var previousState = interactionHistory[interactionHistory.length - undoSteps];

    if (previousState === undefined) return;

    checkedFilters = previousState.filters;
    syncFiltersToInterface();

    if (previousState.newWeight != null) {
        weight = $.extend({}, previousState.newWeight); // reset weight in recommender.js
        syncNewWeightToInterface(previousState.newWeight);
    }

    setTechniques(getRecommendations(checkedFilters)); // get recommendations
    syncTechniquesToInterface();

    updateInteractionHistory("undo", $.extend({}, previousState.newWeight));

    undoSteps += 2;

    // if (interactionHistory[interactionHistory.length - undoSteps].interactionType === "init") {   // doesn't work yet
        // $("#undoButton").addClass("disabled");
    // }
}

function randomString() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 8; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

// BUTTON EVENTS FOR STEP 2
$("#firstTechniqueSimilarButton").click(function () {
    reroll("first", firstTechnique);

    updateInteractionHistory("reroll1");
});

$("#secondTechniqueSimilarButton").click(function () {
    reroll("second", secondTechnique);

    updateInteractionHistory("reroll2");
});

$("#thirdTechniqueSimilarButton").click(function () {
    reroll("third", thirdTechnique);

    updateInteractionHistory("reroll3");
});

$("#firstTechniquePickButton").click(function () {
    pick("first", firstTechnique);
});

$("#secondTechniquePickButton").click(function () {
    pick("second", secondTechnique);
});

$("#thirdTechniquePickButton").click(function () {
    pick("third", thirdTechnique);
});

// Critique Buttons
$("#geringereDauerButton").click(function () {
    critiqueAndUpdate("dauer");
});
$("#geringereSchwierigkeitButton").click(function () {
    critiqueAndUpdate("schwierigkeit");
});
$("#hoehereMengeButton").click(function () {
    critiqueAndUpdate("menge");
});
$("#hoehereQualitaetButton").click(function () {
    critiqueAndUpdate("qualitaet");
});
$("#hoehereDiversitaetButton").click(function () {
    critiqueAndUpdate("diversitaet");
});
$("#mehrSpassButton").click(function () {
    critiqueAndUpdate("spass");
});
$("#resetButton").click(function () {
    critiqueAndUpdate("reset");
});

$("#undoButton").click(undoLastAction);

$("#modalUseFiltersButton").click(function () {
    generateNewRecommendations();
    syncFiltersToInterface();

    updateInteractionHistory("changed filters");
});


fillTechniques([firstTechnique, secondTechnique, thirdTechnique]);