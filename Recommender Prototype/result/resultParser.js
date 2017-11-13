var fs = require("fs");

fs.readFile('results.json', function (err, data) {
    var json = JSON.parse(data);
    
    var x = 0;
    json.forEach((result) => {
        result = JSON.parse(result);  // one list of interactions

        result.forEach((interaction) => {
            console.log(interaction.interactionType);
        });
        console.log("---------");
    });
});