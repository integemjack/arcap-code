"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const log4js = require("log4js");
const compression = require("compression");

const { getThemePath } = require("../libs/theme");
const logger = require("../libs/logger");
const config = require("../libs/config").get();
const routes = require("./routes");

const app = express();
app.use(compression());

app.use(
	log4js.connectLogger(logger, {
		level: "auto",
		format:
			':remote-addr[:remote-user] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms.'
	})
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// serve theme files
app.use((req, res, next) => {
	console.log(`*****************************************************`);
	let txt = "";
	for (
		let i = 1;
		i < `*****************************************************`.length - `*** req.path -> ${req.path} ***`.length;
		i++
	)
		txt += " ";
	console.log(`*** req.path ->`, req.path, txt, "***");
	console.log(`*****************************************************`);
	let themePath = getThemePath();
	if (themePath) {
		let themeFile = path.join(themePath, req.path.split("?")[0]);
		if (fs.existsSync(themeFile)) {
			let stat = fs.statSync(themeFile);
			if (stat.isFile()) {
				logger.info("Sending theme file:", themeFile);
				return res.sendFile(themeFile);
			}
		}
	}
	next();
});

// serve app statics
app.use(express.static(path.join(__dirname, "../static")));
app.use(routes);

module.exports = app;
