"use strict";

var fs = require("fs");
var path = require("path");
var Sequelize = require("sequelize");
var toAbsolute = require("../libs/utils").toAbsolute;
var basename = path.basename(__filename);
var cache = {};
var localsequelize = null;

function create(dataLocation, Props = {
    sync: false
}) {
    let dataloc = toAbsolute(dataLocation);
    if (cache.hasOwnProperty(dataloc) && fs.existsSync(dataloc)) {
        console.log("Use cached models for", dataloc);
        // cache[dataloc] =  resetQR(dataLocation);
        return cache[dataloc];
    }

    let dbconf = {
        dialect: "sqlite",
        storage: dataloc
    };
    var db = {};
    var sequelize = new Sequelize(null, null, null, dbconf);

    fs.readdirSync(__dirname)
        .filter(file => {
            //only for xx.js to build modle
            return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";
        })
        .forEach(file => {
            var model = sequelize["import"](path.join(__dirname, file));
            db[model.name] = model; //QRcode,User...
        });

    Object.keys(db).forEach(modelName => {
        if (db[modelName].associate) {
            db[modelName].associate(db);
        }
    });

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;

    if (Props.sync) {
        console.log(`Sync database "${dataLocation}"`);
        db.sequelize.sync({
            alter: true
        });
    }

    console.log("New sequelize at: ", dataloc);
    cache[dataloc] = db;
    localsequelize = sequelize;

    if (!fs.existsSync(path.join(__dirname, "qrcode.json"))) {
        fs.writeFileSync(path.join(__dirname, "qrcode.json"), "[]");
    }
    //如果2018 manager 只显示 id eid qrcode 或者不显示 是因为qrcode.json与数据库不匹配

    var QRcodeAttrs = JSON.parse(fs.readFileSync(path.join(__dirname, "qrcode.json")));

    db.QRcode = resetQR(dataLocation, QRcodeAttrs);
    cache[dataloc] = db;

    return db;
}

// Props = ["id", "name", "email", "test"];
function resetQR(dataLocation, Props = ["id", "name", "email"]) {
    let dataloc = toAbsolute(dataLocation);
    var db = cache[dataloc];
    var sequelize = localsequelize;

    // db["QRcode"].drop();

    var tempconfig = {};
    for (var i = 0; i < Props.length; i++) {
        if (Props[i] == "id") continue;
        tempconfig[Props[i]] = {
            type: Sequelize.STRING
                // allowNull: false
        };
    }

    return (db.QRcode = db.sequelize.define("QRcode", tempconfig, {
        timestamps: false //don't add timestamp attributes(updateAt,createAt)
    }));
}

//question :: functions Array exports have same parameters
module.exports = create;

// exports = module.exports = {create,resetQR}; //error :: can't get exports functions