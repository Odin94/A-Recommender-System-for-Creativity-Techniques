var mongoose = require("mongoose");

var resultSchema = new mongoose.Schema({
    resultJSON: String,
    rndID: String
});
var Result = mongoose.model("Result", resultSchema);  // can be used to create new Results with Result.create etc.

module.exports = Result;