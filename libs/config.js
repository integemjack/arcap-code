"use strict";
const inherits = require("util").inherits;
const EventEmitter = require("events").EventEmitter;
const fs = require("fs");
const path = require("path");
const { getProperty } = require("./utils");

const configFile = path.join(process.cwd(), "config.json");

function loadConfig() {
	let configJson = "{}";
	try {
		configJson = fs.readFileSync(configFile);
	} catch (err) {
		return console.error(err);
	}
	return JSON.parse(configJson);
}

function Configure() {
	if (!(this instanceof Configure)) {
		return new Configure();
	}

	this._config = loadConfig();

	EventEmitter.call(this);
}

inherits(Configure, EventEmitter);

Configure.prototype.get = function(key) {
	if (key) {
		return getProperty(this._config, key);
	} else {
		return this._config;
	}
};

Configure.prototype.update = function(config) {
	Object.assign(this._config, config);
	fs.writeFileSync(configFile, JSON.stringify(this._config, null, 4));
	this.emit("updated", config);
};

let config = new Configure();
config.setMaxListeners(Infinity);

module.exports = config;
