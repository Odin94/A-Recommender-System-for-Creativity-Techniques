var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var mongoose = require("mongoose");

var Result = require("./models/result");

var app = express();

mongoose.connect("mongodb://thesisman:secpw33@ds111885.mlab.com:11885/thesis");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/success", function (req, res) {
    res.sendFile(__dirname + "/public/success.html");
});

app.post("/result", function (req, res) {
    console.log(req.body);
    console.log(req.body.id);
    try {
        var result = JSON.stringify(req.body.result);
    } catch (e) {
        console.log(e);
        return;
    }


    // if (!fs.existsSync("result/results.json")) {
    //     fs.writeFileSync("result/results.json", "[]");
    // }

    // fs.readFile('result/results.json', function (err, data) {
    //     var json = JSON.parse(data);
    //     json.push(result);

    //     fs.writeFile("result/results.json", JSON.stringify(json));
    // });

    var newResult = new Result({
        resultJSON: result,
        rndID: req.body.id
    });

    newResult.save(function (err, result) {
        if (err) {
            console.log("something went wrong!");
        } else {
            console.log("We just saved a result!");
            console.log(result);
        }
    });

    res.send({
        redirect: '/success?id=' + req.body.id
    });
});

// router.post("/", middleware.isLoggedIn, function(req, res) {
//     var name = req.body.name;
//     var imgUrl = req.body.imgUrl;
//     var description = req.body.description;
//     var author = {
//         id: req.user._id,
//         username: req.user.username
//     };

//     var newCamp = new Camp({
//         name: name,
//         imgUrl: imgUrl,
//         peopleLastYear: Math.floor(Math.random() * 10000),
//         description: description,
//         author: author
//     });

//     // tries to save, callbacks on done
//     newCamp.save(function(err, camp) {
//         if (err) {
//             console.log("something went wrong!");
//         } else {
//             console.log("We just saved a camp!");
//             console.log(camp);
//         }
//     });
//     // create & save in one:
//     // Camp.create({name: "Nicememe Cove", imgUrl: "https://source.unsplash.com/K9olx8OF36A"});

//     res.redirect("/");
// });

app.listen(process.env.PORT || 8080, function () {
    if (process.env.PORT) {
        console.log("KT recommender listening on " + process.env.PORT);
    } else {
        console.log("KT recommender listening on 8080");
    }
});