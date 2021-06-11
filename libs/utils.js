"use strict";

const path = require("path");
const crypto = require("crypto");
const iconv = require("iconv-lite");

function AliveChecker(options) {
	this.options = options;
	this.timerId = null;
}

AliveChecker.prototype.start = function() {
	if (this.timerId) {
		return;
	}
	this.alive = false;
	this.timerId = setInterval(() => {
		if (!this.alive) {
			this.stop();
			this.options.ontimeout();
		}
		this.alive = false;
	}, this.options.timeout);
};

AliveChecker.prototype.stop = function() {
	if (this.timerId) {
		clearInterval(this.timerId);
		this.timerId = null;
	}
};

AliveChecker.prototype.setAlive = function() {
	this.alive = true;
};

AliveChecker.prototype.isAlive = function() {
	return this.timerId !== null;
};

// Get object property by string
// Sample:
//  getProperty({a:{b:1}}, 'a.b')
// Return:
//  1
function getProperty(obj, path) {
	return path
		.replace(/^\./, "")
		.split(".")
		.reduce((pre, cur) => (pre ? pre[cur] : undefined), obj);
}

function genToken(prefix, digitnum) {
	let init = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
	let str = prefix;
	for (let i = 0; i < digitnum; i++) {
		str += init[Math.floor(Math.random() * init.length)];
	}
	return str;
}

function toAbsolute(mypath, base = process.cwd()) {
	if (!path.isAbsolute(mypath)) {
		mypath = path.join(base, mypath);
	}
	return path.normalize(mypath);
}

// use secret to encrypt string
function encrypt(str, secret) {
	let cipher = crypto.createCipher("aes192", secret);
	let enc = cipher.update(str, "utf8", "hex");
	enc += cipher.final("hex");
	console.log("enc is: " + enc);
	return enc;
}

//use secret to decrypt string
function decrypt(str, secret) {
	let decipher = crypto.createDecipher("aes192", secret);
	let dec = decipher.update(str, "hex", "utf8");
	dec += decipher.final("utf8");
	console.log("dec is: " + dec);
	return dec;
}

function utf8(str) {
	return iconv.decode(str, "gbk");
}

function gbk(str) {
	return iconv.encode(str, "gbk");
}

module.exports.AliveChecker = AliveChecker;
module.exports.getProperty = getProperty;
module.exports.genToken = genToken;
module.exports.toAbsolute = toAbsolute;
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
module.exports.utf8 = utf8;
module.exports.gbk = gbk;
