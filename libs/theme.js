"use strict";
const fs = require("fs");
const path = require("path");
const ini = require("ini");
const YAML = require("js-yaml");

const { toAbsolute, utf8, gbk } = require("./utils");
const logger = require("./logger");
const config = require("./config").get();

let cachedThemePath = null;
let themePath = null;

function findEndStages(theme) {
	theme = Object.values(theme)[0]; // there will be only one project in themes.json

	let endStages = new Set();
	for (var stageName in theme) {
		if (/^stage/i.test(stageName)) {
			for (var action of theme[stageName].stage) {
				if (action.type === "command" && action.command === "finish") {
					endStages.add(`${stageName}.stage`);
				}
			}
		}
	}
	logger.info("Found end stages: ", endStages);

	return endStages;
}

function getTheme() {
	try {
		let themeJson = JSON.parse(fs.readFileSync(path.join(getThemePath(), "themes.json")));
		// themeJson.themePath = themePath;
		return { theme: themeJson, themeFolder: themePath };
	} catch (err) {
		logger.error(err.toString());
		return null;
	}
}

function getConfig() {
	try {
		let config = {};
		if (fs.existsSync(path.join(getThemePath(), "../config.yml")))
			config = YAML.load(fs.readFileSync(path.join(getThemePath(), "../config.yml")));
		if (fs.existsSync(path.join(getThemePath(), "../debugConfig.txt"))) {
			let debugs = fs
				.readFileSync(path.join(getThemePath(), "../debugConfig.txt"), "utf-8")
				.split(/[\r|\n]+/)
				.map(o => o.split("="));
			let debug = {};
			for (let i in debugs) {
				let d = debugs[i];
				switch (debugs[i][0]) {
					case "DebugLoopNum":
						debug[d[1]] = `${debugs[i - 1][1]} ${debugs[i][1]}:${debugs[i - 2][1]}`;
						break;

					case "DebugConditionType":
						break;

					case "DebugLoopName":
						break;

					default:
						debug[debugs[i][0]] = debugs[i][1];
						break;
				}
			}
			config.debug = debug; //ini.parse(fs.readFileSync(path.join(getThemePath(), "../debugConfig.txt"), 'utf-8'));
		}
		config.themePath = themePath;
		return config;
	} catch (err) {
		logger.error(err.toString());
		return null;
	}
}

function getThemePath() {
	if (!cachedThemePath) {
		reloadThemePath();
	}
	return cachedThemePath;
}

function reloadThemePath() {
	// Read theme path from file
	let configFolder = toAbsolute(config.theme);
	let stageconf = path.join(configFolder, "stageconfig.txt");
	cachedThemePath = null;
	try {
		let iniData = ini.parse(utf8(fs.readFileSync(stageconf)));
		logger.info("stageconfig.txt content:", iniData);
		cachedThemePath = path.join(toAbsolute(iniData.currentFolder, configFolder), "instruction");
		themePath = path.join(toAbsolute(iniData.currentFolder, configFolder));
		logger.info(`Theme path: ${cachedThemePath}`);
		return cachedThemePath;
	} catch (err) {
		logger.error(err.toString());
	}
}

function updateThemePath(themeFolder) {
	let stageconf = path.join(themeFolder, "stageconfig.txt");
	try {
		let iniData = ini.parse(utf8(fs.readFileSync(stageconf)));
		iniData.currentFolder = themeFolder;
		fs.writeFileSync(stageconf, gbk(ini.stringify(iniData)));
		logger.info("Saved theme path to stageconf:", themeFolder);
	} catch (err) {
		logger.error(err.toString());
	}
}

module.exports.findEndStages = findEndStages;
module.exports.getThemePath = getThemePath;
module.exports.reloadThemePath = reloadThemePath;
module.exports.updateThemePath = updateThemePath;
module.exports.getTheme = getTheme;
module.exports.getConfig = getConfig;
