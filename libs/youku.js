"use strict";

const fs = require("fs");
const async = require("async");
const youkuUpload = require("./youku-upload");
const getAccessToken = require("./youku-accessToken");
const logger = require("./logger");
const config = require("./config").get();

const CONCURRENCY = 2;

function Youku() {
	this.uploadQueue = async.queue((file, cb) => {
		let youkuConfig = config.email.youku;
		let upload = {
			client_id: youkuConfig.client_id,
			client_secret: youkuConfig.client_secret,
			access_token: youkuConfig.access_token,
			refresh_token: youkuConfig.refresh_token,
			title: "Integem&nbsp;Camera",
			tags: "Integem,AR",
			file_name: file
		};

		// refresh token
		getAccessToken(upload)
			.then(accessToken => {
				upload.access_token = accessToken;
				youkuUpload(upload)
					.then(id => {
						cb(null, id);
					})
					.catch(err => {
						cb(err);
					});
			})
			.catch(cb);
	}, CONCURRENCY);
}

Youku.prototype.upload = function(file) {
	return new Promise((resolve, reject) => {
		this.uploadQueue.push(file, (err, link) => {
			if (err) reject(err);
			else resolve(link);
		});
	});
};

module.exports.Youku = Youku;
