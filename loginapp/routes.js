"use strict";
const path = require("path");
const moment = require("moment");
const express = require("express");
const config = require("../libs/config").get();
const modelsCreator = require("../models");
const {
    getPaths
} = require("../libs/ardata");
const logger = require("../libs/logger");
const multiparty = require("multiparty");
const util = require("util");
const fs = require("fs");
const ini = require("ini");
const os = require("os");

const router = express.Router();

router.get("/", (req, res, next) => {
    res.render("login", {
        config: config
    });
});

router.get("/:id/photo/:photo_name", (req, res, next) => {
    // *NOTE*: Config storage folder can be changed.
    let {
        storage,
        database
    } = getPaths();
    let models = modelsCreator(database);
    models.User.findById(req.params.id)
        .then(user => {
            let file = path.join(storage, user.media.store, req.params.photo_name);
            res.sendFile(file);
        })
        .catch(err => res.sendStatus(404));
});

router.get("/themes/:id/cover", (req, res, next) => {
    let models = modelsCreator("./data/db.sqlite");
    models.Themes.findById(req.params.id)
        .then(theme => {
            if (!theme) {
                return res.sendStatus(404);
            }
            let thumbnail = theme.thumbnail;
            if (/^\.[\/\\]?/i.test(thumbnail)) {
                thumbnail = path.join(theme.location, thumbnail);
            }
            logger.info(`Send theme cover: ${thumbnail}`);
            res.sendFile(thumbnail);
        })
        .catch(err => {
            res.sendStatus(500);
        });
});

router.get("/themes", (req, res, next) => {
    let models = modelsCreator("./data/db.sqlite");
    models.sequelize
        .query(
            "select distinct themes.id, themes.barcode, themes.location, themes.name, themes.description desc, themes.tag from themes, json_each(themes.tag), tags where json_each.value = tags.value and tags.use = 1 order by themes.sort desc",
            null, {
                raw: true
            }
        )
        .then(([themes, _]) => {
            let _themes = themes.map(theme => {
                let _theme = {};
                for (let k in theme) {
                    // console.log(k);
                    if (k === "tag") {
                        _theme[k] = theme[k].toLocaleLowerCase();
                    } else {
                        _theme[k] = theme[k];
                    }
                }
                try {
                    let stageconfig = ini.parse(fs.readFileSync(path.join(theme.location, 'stageconfig.txt'), 'utf-8'));
                    if (!stageconfig.HDRatio) stageconfig.HDRatio = "1";
                    for (let k in stageconfig) {
                        // console.log(k);
                        if (k === "HDRatio") {
                            _theme[k] = stageconfig[k].split(",");
                        } else {
                            _theme[k] = stageconfig[k];
                        }
                    }

                    let cam = ini.parse(fs.readFileSync(path.join(os.homedir(), 'AppData/Local/Integem/IntegemCam/Zconfigure.txt'), 'utf-8'));
                    // console.log(cam);
                    _theme.HDResolutionRatio = cam.HDResolutionRatio.HDratio
                } catch (e) {
                    console.log(e)
                }
                return _theme;
            });
            res.status(200).json(_themes);
        })
        .catch(err => {
            res.status(500).json({
                message: err.message
            });
        });
});

router.get("/tags", (req, res, next) => {
    let models = modelsCreator("./data/db.sqlite");
    models.Tags.findAll({
            where: {
                use: 1
            }
        })
        .then(tags => {
            // console.log(tags);
            let _tags = tags.map(tag => {
                let _tag = {};
                for (let k in tag.dataValues) {
                    // console.log(k);
                    if (k === "value") {
                        _tag[k] = tag.dataValues[k].toLocaleLowerCase();
                    } else {
                        _tag[k] = tag.dataValues[k];
                    }
                }
                return _tag;
            });
            res.status(200).json(unique(_tags));
        })
        .catch(err => {
            res.status(500).json({
                message: err.message
            });
        });
});

router.post("/uploadEmailFile", (req, res, next) => {
    var form = new multiparty.Form();
    form.encoding = "utf-8";
    form.uploadDir = "./";
    form.maxFilesSize = 1024 * 1024 * 1024;

    form.parse(req, function(err, fields, files) {
        if (err) {
            console.log("parse error:" + err);
        } else {
            var inputFile = files.inputFile[0];
            console.log("upload and parse file :" + inputFile.originalFilename + " success");
            var uploadedPath = inputFile.path;
            if (!fs.existsSync(path.join(process.cwd(), "data"))) fs.mkdirSync(path.join(process.cwd(), "data"));
            if (!fs.existsSync(path.join(process.cwd(), "data/emailData")))
                fs.mkdirSync(path.join(process.cwd(), "data/emailData"));
            var dstPath = path.join(process.cwd(), "data/emailData", inputFile.originalFilename);

            fs.rename(uploadedPath, dstPath, function(err) {
                if (err) {
                    console.log("rename error:" + err);
                } else {
                    console.log("" + inputFile.originalFilename + "change location to ->" + dstPath + " success!");
                    res.send(dstPath); //发送绝对路劲给前端 让它走get路由传参下载
                }
            });
        }
    });
});

module.exports = router;

function unique(list) {
    var arr = [];
    list.forEach(one => {
        if (!inArray(one, arr)) arr.push(one);
    });
    return arr;
}

function inArray(v, a) {
    let _in = false;
    a.forEach(o => {
        if (o.value === v.value) _in = true;
    });
    return _in;
}