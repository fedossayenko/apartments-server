//  OpenShift sample Node application
var express = require('express'),
    app = express(),
    morgan = require('morgan');
var bodyParser = require("body-parser");

Object.assign = require('object-assign');

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT,
    ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP;

let db = null,
    dbDetails = {};

const init = async function () {
    let IDB = require('./db/db');
    db = await IDB.init((err) => {
        console.log('Error connecting to Mongo. Message:\n' + err);
    });

    const Insert = require('./routes/insert');
    Insert.init(app);

    const Server = require('./routes/server');
    Server.init(app);


    app.listen(port, ip);
    console.log('Server running on http://%s:%s', ip, port);

    const config = require('./config');
    let pageConf = 0;

    generate(1, config.URL, 6);
    setInterval(() => {
        console.log('start getting' + config.URL);
        pageConf++;
        generate(1, pageConf % 2 === 0 ? config.URL : config.URL2, 6);
    }, 1000 * 60 * 10);
};

function generate(pageNUm, url, room_count) {
    const full_url = url + (room_count ? ('&number_of_rooms%5B%5D=' + room_count) : '') + (pageNUm ? ('&page=' + pageNUm) : '');

    const Onliner = require('./onliner');
    const Service = require('./db/service');

    Onliner.generate(full_url, async (apps, last) => {
        function goNext() {
            if (pageNUm < last) {
                generate(pageNUm + 1, url, room_count);
            } else {
                pageNUm = 0;
                if (room_count > 0) {
                    generate(pageNUm + 1, url, room_count - 1)
                } else {
                    console.log('FINISH');
                }
            }
        }

        for (let i = 0; i < apps.length; i++) {
            await Service.processApartment(apps[i], room_count);
        }

        goNext();
    });
}


init();


module.exports = app;
