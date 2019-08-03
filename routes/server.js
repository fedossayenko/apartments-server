const Database = require('./../db/db');


module.exports = {
    init: (app, initDb) => {
        app.get('/', function (req, res) {
            // try to initialize the db on every request if it's not already
            // initialized.
            const db = Database.db();
            if (db) {
                var col = db.collection('counts');
                // Create a document with request IP and current time of request
                col.insert({ip: req.ip, date: Date.now()});
                col.count(function (err, count) {
                    if (err) {
                        console.log('Error running count. Message:\n' + err);
                    }
                    res.render('index.html', {pageCountMessage: count, dbInfo: dbDetails});
                });
            } else {
                res.render('index.html', {pageCountMessage: null});
            }
        });

        app.get('/pagecount', function (req, res) {
            // try to initialize the db on every request if it's not already
            // initialized.
            const db = Database.db();
            if (db) {
                db.collection('counts').count(function (err, count) {
                    res.send('{ pageCount: ' + count + '}');
                });
            } else {
                res.send('{ pageCount: -1 }');
            }
        });

        app.get('/last-apartments', function (req, res) {
            // try to initialize the db on every request if it's not already
            // initialized.
            const db = Database.db();
            if (db) {
                db.collection('apartments').find({}).sort({created_at: 1}).limit(20).toArray((err, elements) => {
                    res.send(JSON.stringify(elements));
                });
            } else {
                res.send();
            }
        });

        // error handling
        app.use(function (err, req, res, next) {
            console.error(err.stack);
            res.status(500).send('Something bad happened!');
        });


    }
};

