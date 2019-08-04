const Database = require('./../db/db');


module.exports = {
    init: (app, initDb) => {
        // app.get('/', function (req, res) {
        //     // try to initialize the db on every request if it's not already
        //     // initialized.
        //     const db = Database.db();
        //     if (db) {
        //         var col = db.collection('counts');
        //         // Create a document with request IP and current time of request
        //         col.insert({ip: req.ip, date: Date.now()});
        //         col.count(function (err, count) {
        //             if (err) {
        //                 console.log('Error running count. Message:\n' + err);
        //             }
        //             res.render('./../dist/index.html', {pageCountMessage: count, dbInfo: Database.dbDetails()});
        //         });
        //     } else {
        //         res.render('./../dist/index.html', {pageCountMessage: null});
        //     }
        // });

        function getPrices(site_id, db) {
            return new Promise((resolve) => {
                db.collection('prices').find({apartment_id: site_id}).toArray((err, prices) => {
                    resolve(prices);
                });
            })
        }

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
                db.collection('apartments')
                    .find({is_active: true, is_minsk: true})
                    .sort({date_create: -1})
                    .limit(20)
                    .toArray(async (err, elements) => {
                        for (let i = 0; i < elements.length; i++) {
                            elements[i].prices = await getPrices(elements[i].site_id, db)
                        }
                        res.send(JSON.stringify(elements));
                    });
            } else {
                res.send({done: false});
            }
        });

        app.get('/apartment/:uid', function (req, res) {
            // try to initialize the db on every request if it's not already
            // initialized.
            const db = Database.db();

            if (db && req.params && req.params.uid) {
                db.collection('apartments')
                    .findOne({site_id: +req.params.uid}, async (err, element) => {
                        if (element) {
                            const prices = await getPrices(element.site_id, db);
                            console.log(prices);
                            element.prices = prices;
                            res.send(JSON.stringify(element));
                        } else {
                            res.send(404, {error: 'No found id in DB'});
                        }
                    });
            } else {
                res.send(404, {error: 'No id'});
            }
        });

        app.get('/average', function (req, res) {
            // try to initialize the db on every request if it's not already
            // initialized.
            const db = Database.db();

            if (db) {
                db.collection('average_price')
                    .find()
                    .sort({date_create: -1})
                    .toArray(async (err, elements) => {
                        res.send(JSON.stringify(elements));
                    });
            } else {
                res.send({done: false});
            }
        });

        // error handling
        app.use(function (err, req, res, next) {
            console.error(err.stack);
            res.status(500).send('Something bad happened!');
        });


    }
};

