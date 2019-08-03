const inside = require('point-in-polygon');
const Database = require('./../db/db');

const polygon = [
    [53.965824, 27.471225],
    [53.971314, 27.591077],
    [53.961219, 27.623519],
    [53.967729, 27.632396],
    [53.967029, 27.644714], [53.957840, 27.633880],
    [53.947598, 27.661781], [53.952306, 27.669186], [53.950632, 27.672969], [53.955407, 27.689323],
    [53.957736, 27.685204], [53.962899, 27.693100],
    [53.960485, 27.692222], [53.958270, 27.724157], [53.964012, 27.738877], [53.898267, 27.844162],
    [53.817487, 27.765198], [53.801231, 27.675247], [53.833331, 27.629242],
    [53.833331, 27.533112], [53.843890, 27.439041], [53.900294, 27.404022], [53.933533, 27.419815],
    [53.933533, 27.419815]];

module.exports = {

    processApartment(apartment, room_count, callback) {
        const price = apartment.price;
        delete apartment.price;
        const db = Database.db();


        return new Promise(resolve => {
            db.collection("apartments").findOne({site_id: apartment.site_id}, (err, findApartment) => {
                if (err) throw err;
                if (findApartment) {

                    const backCall = () => {
                        if (room_count && room_count !== 0 && !findApartment.number_of_rooms) {
                            findApartment.number_of_rooms = room_count;
                            db.collection("apartments").updateOne({_id: findApartment._id}, {$set: {...findApartment}}, (err, res) => {
                                if (err) throw err;
                                callback && callback();
                            });
                        } else {
                            callback && callback();
                        }
                    };

                    if (!findApartment.is_active) {
                        findApartment.is_active = true;
                        db.collection("apartments").updateOne({_id: findApartment._id}, {$set: {...findApartment}}, (err, res) => {
                            if (err) throw err;
                            this.processPrice(price, findApartment, backCall.bind(this));
                        });
                    } else {
                        this.processPrice(price, findApartment, backCall.bind(this));
                    }
                    resolve();
                } else {
                    if (room_count && room_count !== 0) {
                        apartment.number_of_rooms = room_count;
                    }
                    apartment.is_minsk = inside([apartment.location_latitude, apartment.location_longitude], polygon);
                    apartment.is_active = true;

                    db.collection("apartments").insertOne(apartment, (err, el_app) => {
                        if (err) throw err;
                        const afterCreate = el_app.ops[0];
                        this.processPrice(price, afterCreate, () => {
                            if (afterCreate.is_minsk) {
                                console.log('CREATED new apartment = ' + afterCreate.url, room_count);
                            }
                            resolve();
                        });
                    });
                }
            });
        });
    },

    processPrice(price, apartment, callback) {

        const db = Database.db();
        db.collection("prices").findOne({apartment_id: apartment.site_id, is_active: true}, (err, priceSaved) => {
            if (err) throw err;
            if (priceSaved) {
                if (priceSaved.price_amount !== price.price_amount || priceSaved.price_currency !== price.price_currency) {
                    console.log('OTHER PRICE!!!', priceSaved.price_amount, Math.round(price.price_amount), apartment.url, apartment.number_of_rooms, apartment.is_minsk ? 'Minsk' : 'Not Minsk');
                    priceSaved.is_active = false;

                    db.collection("prices").updateOne({_id: priceSaved._id}, {$set: {...priceSaved}}, (err, res) => {
                        if (err) throw err;
                        price.apartment_id = apartment.site_id;
                        price.price_per_meter = price.price_amount / apartment.area_total;

                        db.collection("prices").insertOne(apartment, (err) => {
                            if (err) throw err;
                            callback && callback();
                        });
                    });
                } else {
                    callback && callback();
                }
                callback && callback();
            } else {
                price.apartment_id = apartment.site_id;
                price.price_per_meter = price.price_amount / apartment.area_total;

                db.collection("prices").insertOne(price, (err) => {
                    if (err) throw err;
                    callback && callback();
                });
            }
        });
    },

    deletePricesByAppId(appId) {
        return new Promise((resolve) => {
            Price.find({apartment_id: appId, is_active: 1}, (err, pr) => {
                if (err) throw err;
                if (pr.length > 1) {
                    console.log('ALARM , price > 1', appId);
                }
                if (pr[0]) {
                    pr[0].is_active = 0;
                    pr[0].save(() => {
                        resolve();
                    })
                } else {
                    console.log('not finded prices for', appId);
                }

            });
        })
    },
};
