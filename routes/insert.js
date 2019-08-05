const Database = require('./../db/db');

module.exports = {
    init: (app) => {
        app.post('/api/insert-apartments', async function (req, res) {
            // try to initialize the db on every request if it's not already
            // initialized.
            const db = Database.db();

            const response = {...req.body};
            // response.created_at = ISODate(response.created_at);
            // console.log(req);
            await db.collection("apartments").insertOne(response, function (err, res) {
                if (err) throw err;
                res.send();
            });
        });


        app.post('/api/insert-prices', async function (req, res) {
            // try to initialize the db on every request if it's not already
            // initialized.
            const db = Database.db();
            // console.log(req);
            await db.collection("prices").insertOne(req.body, function (err, res) {
                if (err) throw err;
                console.log("1 record inserted");
            });
            res.send();
        });
    }
};
