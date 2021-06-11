"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const path = require("path");
const log4js = require("log4js");
const compression = require("compression");

const logger = require("../libs/logger");

app.use(compression());
app.use(
    log4js.connectLogger(logger, {
        level: "auto",
        format: ':remote-addr[:remote-user] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms.'
    })
);
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

/**
 * 允许跨域访问
 */
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "../static")));
app.use(require("./routes"));

module.exports = app;