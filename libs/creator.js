"use strict";

const fs = require("fs");
const path = require("path");
const async = require("async");
const request = require("request");
const logger = require("./logger");

const CONCURRENCY = 1;
// const URL = "https://creator.integem.com";

const requests = async.queue(request, CONCURRENCY);

module.exports.addVimeo = function(id, uri) {
	return new Promise((resolve, reject) => {
		logger.info(`Start add ${uri} to post...`);
		if (uri === "") {
			logger.error("has no url!");
			return reject("Type error");
		}

		let formData = {
			postId: id,
			content: uri,
			type: "add"
		};

		let config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json')));
		requests.push({ url: `${config.creatorApi}?do=vimeo`, method: "POST", formData }, (err, resp, body) => {
			if (err) {
				logger.error(err);
				reject();
			} else if (resp && resp.statusCode !== 200) {
				logger.error(body, formData);
				reject();
			} else {
				resolve();
			}

			logger.info(`Add ${uri} to post successed!`, body);
		});
	});
};

module.exports.addJpg = function(id, uri) {
	return new Promise((resolve, reject) => {
		logger.info(`Start add ${uri} to post...`);
		if (uri === "") {
			logger.error("has no url!");
			return reject("Type error");
		}

		let file = fs.readFileSync(path.join(uri), 'base64');
		// return console.log(file);

		let formData = {
			postId: id,
			content: `data:image/png;base64,${file}`,
			type: "add"
		};

		let config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json')));
		requests.push({ url: `${config.creatorApi}?do=jpg`, method: "POST", formData }, (err, resp, body) => {
			if (err) {
				logger.error(err);
				reject();
			} else if (resp && resp.statusCode !== 200) {
				logger.error(body, formData);
				reject();
			} else {
				resolve();
			}

			logger.info(`Add ${uri} to post successed!`, body);
		});
	});
};

module.exports.removeVimeo = function(id, uri) {
	return new Promise((resolve, reject) => {
		logger.info(`Start add ${uri} to post...`);
		if (uri === "") {
			logger.error("has no url!");
			return reject("Type error");
		}

		let formData = {
			postId: id,
			content: uri,
			type: "remove"
		};

		let config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json')));
		requests.push({ url: `${config.creatorApi}?do=vimeo`, method: "POST", formData }, (err, resp, body) => {
			if (err) {
				logger.error(err);
				reject();
			} else if (resp && resp.statusCode !== 200) {
				logger.error(body, formData);
				reject();
			} else {
				resolve();
			}

			logger.info(`Add ${uri} to post successed!`);
		});
	});
};
