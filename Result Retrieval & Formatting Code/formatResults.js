var fs = require("fs");
var csvdata = require("csvdata");
var mongoose = require("mongoose");
var Result = require("./models/result");

var resultsJSON = require("./results.json");

const m = {
    "s1Code": "Wenn Sie mit dem Empfehlungsprozess zum ersten Szenario fertig sind, tragen Sie bitte den Code, den Sie am Ende erhalten, hier ein. (Prüfen Sie, dass vor und hinter dem Code keine Leerzeichen stehen)",
    "s1Anwenden": "Würden Sie die empfohlene Technik anwenden, wenn Sie sich tatsächlich in der in Szenario 1 beschriebenen Situation befänden?",
    "s1Andere": "Sie haben die Möglichkeit statt der für Szenario 1 empfohlenen Kreativitätstechnik eine andere Technik aus der folgenden Liste zu wählen. Würden Sie lieber die empfohlene Technik oder eine Technik aus der Liste anwenden? (Link zur Liste: https://www.ideaclouds.net/kreativitätstechniken)",

    "s2Code": "Wenn Sie mit dem Empfehlungsprozess zum zweiten Szenario fertig sind, tragen Sie bitte den Code, den Sie am Ende erhalten, hier ein. (Prüfen Sie, dass vor und hinter dem Code keine Leerzeichen stehen)",
    "s2Anwenden": "Würden Sie die empfohlene Technik anwenden, wenn Sie sich tatsächlich in der in Szenario 2 beschriebenen Situation befänden?",
    "s2Andere": "Sie haben die Möglichkeit statt der für Szenario 2 empfohlenen Kreativitätstechnik eine andere Technik aus der folgenden Liste zu wählen. Würden Sie lieber die empfohlene Technik oder eine Technik aus der Liste anwenden? (Link zur Liste: https://www.ideaclouds.net/kreativitätstechniken)",

    "s3Code": "Wenn Sie mit dem Empfehlungsprozess zum dritten Szenario fertig sind, tragen Sie bitte den Code, den Sie am Ende erhalten, hier ein. (Prüfen Sie, dass vor und hinter dem Code keine Leerzeichen stehen)",
    "s3Anwenden": "Würden Sie die empfohlene Technik anwenden, wenn Sie sich tatsächlich in der in Szenario 3 beschriebenen Situation befänden?",
    "s3Andere": "Sie haben die Möglichkeit statt der für Szenario 3 empfohlenen Kreativitätstechnik eine andere Technik aus der folgenden Liste zu wählen. Würden Sie lieber die empfohlene Technik oder eine Technik aus der Liste anwenden? (Link zur Liste: https://www.ideaclouds.net/kreativitätstechniken)",

    "susHäufig": "Ich denke, dass ich das System gerne häufig benutzen würde.",
    "susKomplex": "Ich fand das System unnötig komplex.",
    "susEinfach": "Ich fand das System einfach zu benutzen.",
    "susHilfe": "Ich glaube, ich würde die Hilfe einer technisch versierten Person benötigen, um das System benutzen zu können.",
    "susIntegriert": "Ich fand, die verschiedenen Funktionen in diesem System waren gut integriert.",
    "susInkonsistent": "Ich denke, das System enthielt zu viele Inkonsistenzen.",
    "susSchnellLernen": "Ich kann mir vorstellen, dass die meisten Menschen den Umgang mit diesem System sehr schnell lernen.",
    "susUmständlich": "Ich fand das System sehr umständlich zu nutzen.",
    "susSicher": "Ich fühlte mich bei der Benutzung des Systems sehr sicher.",
    "susMengeLernen": "Ich musste eine Menge lernen, bevor ich anfangen konnte das System zu verwenden.",

    "verbesserungsVorschläge": "Hier können Sie mir Kommentare, Anregungen und Verbesserungsvorschläge geben",

    "geschlecht": "Welches Geschlecht haben Sie?",
    "alter": "Wie alt sind Sie?",
    "berufserfahrung": "Wie viele Jahre Berufserfahrung haben Sie insgesamt?",
    "beruf": "Was ist Ihr Beruf?",
    "bildung": "Was ist Ihr höchster Bildungsabschluss?",
    "ErfahrungBeispiel": "Haben Sie bereits Erfahrung mit Kreativitätstechniken? Falls ja, mit welchen?",
    "ErfahrungsLevel": "Wie schätzen Sie Ihre Erfahrung mit Kreativitätstechniken ein?"
}

var interactions = []; // Interaktionen für alle Szenario-durchläufe

var interactions2 = {
    "job0-2": [],
    "jobMore": [],

    "kt01": [], // anfänger/grob
    "kt23": [], // gelegentlich + Regelmäßig
    // "kt3": [] // Regelmäßig

    "bildungUni": [],
    "bildungOhneUni": []
}


var csvPromise = csvdata.load("formresults.csv");
csvPromise.then(function (csvData) {
    for (data of csvData) {
        data.firstScenario = getResultFromID(data[m["s1Code"]]);
        data.secondScenario = getResultFromID(data[m["s2Code"]]);
        data.thirdScenario = getResultFromID(data[m["s3Code"]]);

        // addTo(data, interactions);
        if (data[m["berufserfahrung"]] <= 2) addTo(data, interactions2["job0-2"]);
        // else if (data[m["berufserfahrung"]] > 0 && data[m["berufserfahrung"]] <= 10) addTo(data, interactions2["job1-10"]);
        // else if (data[m["berufserfahrung"]] >= 10 && data[m["berufserfahrung"]] <= 20) addTo(data, interactions2["job10-20"]);
        else if (data[m["berufserfahrung"]] >= 2) addTo(data, interactions2["jobMore"]);

        if (data[m["ErfahrungsLevel"]] === "Komplette(r) Anfänger(in)" || data[m["ErfahrungsLevel"]] === "Grobe Vorstellung davon, was Kreativitätstechniken sind und wie man diese anwendet") addTo(data, interactions2["kt01"]);
        else if (data[m["ErfahrungsLevel"]] === "Gelegentliche Anwendung von Kreativitätstechniken") addTo(data, interactions2["kt23"]);
        else if (data[m["ErfahrungsLevel"]] === "Regelmäßige Anwendung von Kreativitätstechniken") addTo(data, interactions2["kt23"]);

        if (data[m["bildung"]] === "Bachlor" || data[m["bildung"]] === "Diplom" || data[m["bildung"]] === "Master") addTo(data, interactions2["bildungUni"]);
        else if (data[m["bildung"]] === "Gymnasium" || data[m["bildung"]] === "Realschule" || data[m["bildung"]] === "Hauptschule") addTo(data, interactions2["bildungOhneUni"]);
    }

    for (i in interactions2) {
        console.log(i);
        console.log(interactions2[i].length);
    }

    // console.log(interactions2["job0"]);

    var critiqueList = [];
    for (i in interactions2) {
        critiqueList.push({
            list: getCritiqueCounts(interactions2[i]),
            name: i
        });
    }
    var critiqueTotal = {
        "qualitaet": 0,
        "dauer": 0,
        "menge": 0,
        "diversitaet": 0,
        "spass": 0,
        "schwierigkeit": 0
    }
    critiqueList.forEach(function (i) {
        for (j in critiqueTotal) {
            critiqueTotal[j] += i.list[j];
        }
    });
    // console.log(getCritiquePercentages(critiqueTotal));

    for (critique of critiqueList) {
        console.log(critique.name);
        var acc = 0;
        for (i in critique.list) {
            acc += critique.list[i];
        }
        console.log(acc);
        console.log(getCritiquePercentages(critique.list));
    }

    console.log("\n\n\n-------- Filters: ----------- \n\n\n");


    var filterList = [];
    for (i in interactions2) {
        // console.log(i);
        // console.log(interactions2[i].length);
        // console.log(interactions2[i])
        // console.log(getCritiqueCounts(interactions2[i]));
        // console.log(getFilters(interactions2[i]));
        filterList.push({
            list: getFilters(interactions2[i]),
            name: i
        });
    }
    var filterTotal = {
        "modJa": 0,
        "modNein": 0,
        "modEgal": 0,

        "dauerKurz": 0,
        "dauerMittel": 0,
        "dauerLang": 0,
        "dauerEgal": 0,

        "schwierigkeitStd": 0,
        "schwierigkeitExp": 0,
        "schwierigkeitEgal": 0,
    }
    filterList.forEach(function (i) {
        for (j in filterTotal) {
            filterTotal[j] += i.list[j];
        }

        console.log(i.name);
        var acc = 0;
        for (j in i.list) {
            acc += i.list[j];
        }
        console.log(acc);

        console.log(i.list);
        console.log(getFilterPercentages(i.list));
    });
    // console.log(getFilterPercentages(filterTotal));
    // console.log(interactionAmounts); // mostly 3 (implying that people only have init and pick o0)
    // printInteractionLength();
    // printSUSresults(csvData);

}, function () {
    console.log("error")
});

function getFilters(scenarioList) {
    var result = {
        "modJa": 0,
        "modNein": 0,
        "modEgal": 0,

        "dauerKurz": 0,
        "dauerMittel": 0,
        "dauerLang": 0,
        "dauerEgal": 0,

        "schwierigkeitStd": 0,
        "schwierigkeitExp": 0,
        "schwierigkeitEgal": 0,
    }

    scenarioList.forEach(function (interactions) {
        if (interactions[0].filters.moderated == "egal") result["modEgal"]++;
        else if (interactions[0].filters.moderated == "radioNotModerated") result["modNein"]++;
        else if (interactions[0].filters.moderated == "radioModerated") result["modJa"]++;

        if (interactions[0].filters.duration == "egal") result["dauerEgal"]++;
        else if (interactions[0].filters.duration == "kurz") result["dauerKurz"]++;
        else if (interactions[0].filters.duration == "mittel") result["dauerMittel"]++;
        else if (interactions[0].filters.duration == "lange") result["dauerLang"]++;

        if (interactions[0].filters.difficulty == "egal") result["schwierigkeitEgal"]++;
        else if (interactions[0].filters.difficulty == "anfaenger") result["schwierigkeitStd"]++;
        else if (interactions[0].filters.difficulty == "fortgeschritten") result["schwierigkeitExp"]++;
    });

    return result;
}

// var result = {
//     "qualitaet": 0,
//     "dauer": 0,
//     "menge": 0,
//     "diversitaet": 0,
//     "spass": 0,
//     "schwierigkeit": 0
// }

function getCritiquePercentages(critiquesOfGroup) {
    const sum = critiquesOfGroup["qualitaet"] + critiquesOfGroup["dauer"] + critiquesOfGroup["menge"] + critiquesOfGroup["diversitaet"] + critiquesOfGroup["spass"] + critiquesOfGroup["schwierigkeit"];
    const qualitaet = critiquesOfGroup["qualitaet"] / sum;
    const dauer = critiquesOfGroup["dauer"] / sum;
    const menge = critiquesOfGroup["menge"] / sum;
    const diversitaet = critiquesOfGroup["diversitaet"] / sum;
    const spass = critiquesOfGroup["spass"] / sum;
    const schwierigkeit = critiquesOfGroup["schwierigkeit"] / sum;

    return {
        "qualitaet": qualitaet,
        "dauer": dauer,
        "menge": menge,
        "diversitaet": diversitaet,
        "spass": spass,
        "schwierigkeit": schwierigkeit,
    }
}

function getFilterPercentages(filtersOfGroup) {
    const modsum = filtersOfGroup["modJa"] + filtersOfGroup["modNein"] + filtersOfGroup["modEgal"];
    const modJa = filtersOfGroup["modJa"] / modsum;
    const modNein = filtersOfGroup["modNein"] / modsum;
    const modEgal = filtersOfGroup["modEgal"] / modsum;

    const dauersum = filtersOfGroup["dauerKurz"] + filtersOfGroup["dauerMittel"] + filtersOfGroup["dauerLang"] + filtersOfGroup["dauerEgal"];
    const dauerKurz = filtersOfGroup["dauerKurz"] / dauersum;
    const dauerMittel = filtersOfGroup["dauerMittel"] / dauersum;
    const dauerLang = filtersOfGroup["dauerLang"] / dauersum;
    const dauerEgal = filtersOfGroup["dauerEgal"] / dauersum;

    const schwersum = filtersOfGroup["schwierigkeitStd"] + filtersOfGroup["schwierigkeitExp"] + filtersOfGroup["schwierigkeitEgal"];
    const schwerStd = filtersOfGroup["schwierigkeitStd"] / schwersum;
    const schwerExp = filtersOfGroup["schwierigkeitExp"] / schwersum;
    const schwerEgal = filtersOfGroup["schwierigkeitEgal"] / schwersum;

    return {
        "modJa": modJa,
        "modNein": modNein,
        "modEgal": modEgal,

        "dauerKurz": dauerKurz,
        "dauerMittel": dauerMittel,
        "dauerLang": dauerLang,
        "dauerEgal": dauerEgal,

        "schwerStd": schwerStd,
        "schwerExp": schwerExp,
        "schwerEgal": schwerEgal
    }
}

function getCritiqueCounts(scenarioList) {
    var result = {
        "qualitaet": 0,
        "dauer": 0,
        "menge": 0,
        "diversitaet": 0,
        "spass": 0,
        "schwierigkeit": 0
    }

    scenarioList.forEach(function (interactions) {
        interactions.forEach(function (interaction) {
            if (interaction.interactionType == "critique:qualitaet") result["qualitaet"] += 1;
            else if (interaction.interactionType == "critique:menge") result["menge"] += 1;
            else if (interaction.interactionType == "critique:dauer") result["dauer"] += 1;
            else if (interaction.interactionType == "critique:spass") result["spass"] += 1;
            else if (interaction.interactionType == "critique:diversitaet") result["diversitaet"] += 1;
            else if (interaction.interactionType == "critique:schwierigkeit") result["schwierigkeit"] += 1;
        });
    });

    return result;
}

function getResultFromID(id) {
    for (result of resultsJSON) {
        if (result.rndID == id) return JSON.parse(result.resultJSON);
    }
    // console.log("no match for id: " + id);  // no match for i66k4tnt
    return null;
}

function addTo(data, list) {
    if (data.firstScenario) list.push(data.firstScenario);
    if (data.secondScenario) list.push(data.secondScenario);
    if (data.thirdScenario) list.push(data.thirdScenario);
}

// load results as JSON from db
// mongoose.connect("mongodb://thesisman:secpw33@ds111885.mlab.com:11885/thesis");
// Result.find(function (err, results) {
//     if (err) return console.error(err);

//     console.log(results.length);
//     // fs.writeFile("results.json", JSON.stringify(results), "utf8");
// });

function printInteractionLength() {
    var acc = 0;
    var threes = 0;
    var nonthrees = 0;
    for (interaction of interactions) {
        acc += interaction.length;
        console.log(interaction.length);

        if (interaction.length == 3) threes++;
        else nonthrees++;
    }
    console.log("three-rate: " + threes / (nonthrees + threes));
    console.log(acc / interactions.length);
}

function printSUSresults(csvData) {
    var score = 0;
    var susHäufig = 0;
    var susKomplex = 0;
    var susEinfach = 0;
    var susHilfe = 0;
    var susIntegriert = 0;
    var susInkonsistent = 0;
    var susSchnellLernen = 0;
    var susUmständlich = 0;
    var susSicher = 0;
    var susMengeLernen = 0;

    for (data of csvData) {
        score += data[m["susHäufig"]] - 1;
        susHäufig += data[m["susHäufig"]] - 1;

        score += 5 - data[m["susKomplex"]];
        susKomplex += 5 - data[m["susKomplex"]];

        score += data[m["susEinfach"]] - 1;
        susEinfach += data[m["susEinfach"]] - 1;

        score += 5 - data[m["susHilfe"]];
        susHilfe += 5 - data[m["susHilfe"]];

        score += data[m["susIntegriert"]] - 1;
        susIntegriert += data[m["susIntegriert"]] - 1;

        score += 5 - data[m["susInkonsistent"]];
        susInkonsistent += 5 - data[m["susInkonsistent"]];

        score += data[m["susSchnellLernen"]] - 1;
        susSchnellLernen += data[m["susSchnellLernen"]] - 1;

        score += 5 - data[m["susUmständlich"]];
        susUmständlich += 5 - data[m["susUmständlich"]];
        console.log(5 - data[m["susUmständlich"]]);

        score += data[m["susSicher"]] - 1;
        susSicher += data[m["susSicher"]] - 1;

        score += 5 - data[m["susMengeLernen"]];
        susMengeLernen += 5 - data[m["susMengeLernen"]];
    }
    score /= csvData.length;
    score *= 2.5;

    console.log("susHäufig: " + susHäufig * 2.5 / csvData.length);
    console.log("susKomplex: " + susKomplex);
    console.log("susEinfach: " + susEinfach);
    console.log("susHilfe: " + susHilfe * 2.5 / csvData.length);
    console.log("susIntegriert: " + susIntegriert);
    console.log("susInkonsistent: " + susInkonsistent);
    console.log("susSchnellLernen: " + susSchnellLernen);
    console.log("susUmständlich: " + susUmständlich * 2.5 / csvData.length);
    console.log("susSicher: " + susSicher);
    console.log("susMengeLernen: " + susMengeLernen * 2.5 / csvData.length);

    console.log(score);
}