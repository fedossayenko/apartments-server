let dbDetails = {};
let db = null;
let mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL;
let mongoURLLabel = "";

if (mongoURL == null) {
    var mongoHost, mongoPort, mongoDatabase, mongoPassword, mongoUser;
    // If using plane old env vars via service discovery
    if (process.env.DATABASE_SERVICE_NAME) {
        var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
        mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'];
        mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'];
        mongoDatabase = process.env[mongoServiceName + '_DATABASE'];
        mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
        mongoUser = process.env[mongoServiceName + '_USER'];

        // If using env vars from secret from service binding  
    } else if (process.env.database_name) {
        mongoDatabase = process.env.database_name;
        mongoPassword = process.env.password;
        mongoUser = process.env.username;
        var mongoUriParts = process.env.uri && process.env.uri.split("//");
        if (mongoUriParts.length == 2) {
            mongoUriParts = mongoUriParts[1].split(":");
            if (mongoUriParts && mongoUriParts.length == 2) {
                mongoHost = mongoUriParts[0];
                mongoPort = mongoUriParts[1];
            }
        }
    }


    if (mongoHost && mongoPort && mongoDatabase) {
        mongoURLLabel = mongoURL = 'mongodb://';
        if (mongoUser && mongoPassword) {
            mongoURL += mongoUser + ':' + mongoPassword + '@';
        }
        // Provide UI label that excludes user id and pw
        mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
        mongoURL += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    } else {
        mongoURL = 'mongodb://127.0.0.1:27017';
    }
}

module.exports = {
    dbDetails: () => {
        return dbDetails;
    },

    db: () => {
        return db;
    },
    init: (callback) => {
        return new Promise((resolve) => {
            if (mongoURL == null) return;

            let mongodb = require('mongodb');
            if (mongodb == null) return;

            mongodb.connect(mongoURL, async function (err, conn) {
                if (err) {
                    callback(err);
                    return;
                }

                db = conn;
                dbDetails.databaseName = db.databaseName;
                dbDetails.url = mongoURLLabel;
                dbDetails.type = 'MongoDB';

                console.log('Connected to MongoDB at: %s', mongoURL);
                console.log(db.databaseName);

                await db.createCollection("apartments");
                await db.createCollection("prices");
                await db.createCollection("average_price");
                resolve(db);
            });
        })
    },

};
