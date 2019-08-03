let needle = require('needle');
let cheerio = require('cheerio');
var request = require('request');

module.exports = {
    generate: (url, callback) => {
        console.log(url);
        request({
            headers: {
                'Accept': 'application/json, text/plain, */*'
            },
            uri: url,
            method: 'GET'
        }, function (err, res, body) {
            if (!body) {
                console.log('body = ' + body);
                console.log('res = ' + res);
                console.log('err = ' + err);
                return;
            }
            const elements = JSON.parse(body)['apartments'];
            const last = JSON.parse(body)['page']['last'];

            const apps = elements.map((app) => {
                app.location_address = app.location.address;
                app.location_latitude = app.location.latitude;
                app.location_longitude = app.location.longitude;
                app.location_user_address = app.location.user_address;
                app.area_total = app.area.total;
                app.area_living = app.area.living;
                app.area_kitchen = app.area.kitchen;
                app.seller_type = app.seller.type;
                app.site_id = app.id;
                app.resale = app.resale ? 1 : 0;
                app.date_create = generateDate();
                app.auction_bid_amount = app.auction_bid && app.auction_bid.amount;

                delete app.location;
                delete app.area;
                delete app.seller;
                delete app.id;
                delete app.auction_bid;

                app.price = {
                    date_create: generateDate(),
                    price_amount: app.price.amount,
                    price_currency: app.price.currency,
                    is_active: true
                };

                return app;
            });

            callback && callback(apps, last);
        });
    },

    isActive(app) {
        return new Promise((resolve) => {
            needle.get(app.url, function (err, res) {
                if (err) throw err;
                let $ = cheerio.load(res.body);
                resolve($('.special-page__title').length === 0);
            });
        });
    }
};

function fixDate(date) {
    return date ? date.split('T').join(' ').split('+')[0] : '';
}

function generateDate() {
    return new Date().toJSON();
}
