"use strict";

const fs = require("fs");
const path = require("path");
const async = require("async");
const request = require("request");
const logger = require("./logger");
const config = require("./config").get();

const CONCURRENCY = 5;
const MYAR = "https://myar.integem.com";

var requests = async.queue(request, CONCURRENCY);

module.exports.uploadPhoto = function(data, mediaFolder) {
	return new Promise((resolve, reject) => {
		logger.info("Start upload photos...");
		if (data.media.type !== "photo") {
			logger.error("The media type is not photo!");
			return reject("Type error");
		}

		let media = data.media.photos
			.map(file => path.join(mediaFolder, file))
			.filter(filePath => fs.existsSync(filePath));

		if (media.length === 0) {
			return reject("No photo to upload!");
		}

		let succ = 0,
			fail = 0,
			token = null;

		media.forEach(filePath => {
			let formData = {
				sqlite_id: data.id,
				name: data.name,
				email: data.email,
				token: data.token,
				type: "photo",
				media: [fs.createReadStream(filePath)],
				organization: config.organization,
				event: config._event
			};

			requests.push({ url: `${MYAR}/api/v1/upload`, method: "POST", formData }, (err, resp, body) => {
				if (err) {
					logger.error(err);
					fail++;
				} else if (resp && resp.statusCode !== 200) {
					logger.error(body, formData);
					fail++;
				} else {
					succ++;
					if (!token) {
						try {
							token = JSON.parse(body).userInfo.token;
							logger.info(`MyAR response token: ${token}`);
						} catch (err) {
							logger.error("No successful uploads!");
						}
					}
				}

				logger.info(`Upload ${succ} success, ${fail} failed, of total ${media.length} photos!`);
				if (succ + fail === media.length) {
					if (token) {
						resolve(token);
					} else {
						reject();
					}
				}
			});
		});
	});
};

module.exports.uploadVideos = function(data) {
	return new Promise((resolve, reject) => {
		logger.info("Start upload videos to Myar...");
		if (data.media.type !== "video") {
			logger.error("The media type is not video!");
			return reject("Type error");
		}

		let videos = data.media.videos.map(v => v.link).filter(l => l);

		if (videos.length === 0) {
			return reject("No video to upload!");
		}

		let succ = 0,
			fail = 0,
			token = null;

		videos.forEach(video => {
			let formData = {
				sqlite_id: data.id,
				name: data.name,
				email: data.email,
				token: data.token,
				type: "video",
				file: video,
				organization: config.organization,
				event: config._event
			};

			requests.push({ url: `${MYAR}/api/v1/upload`, method: "POST", formData }, (err, resp, body) => {
				if (err) {
					logger.error(err);
					fail++;
				} else if (resp && resp.statusCode !== 200) {
					logger.error(body, formData);
					fail++;
				} else {
					succ++;
					if (!token) {
						try {
							token = JSON.parse(body).userInfo.token;
							logger.info(`MyAR response token: ${token}`);
						} catch (err) {
							logger.error("No successful uploads");
						}
					}
				}

				logger.info(`Upload ${succ} success, ${fail} failed, of total ${videos.length} videos!`);
				if (succ + fail === videos.length) {
					if (token) {
						resolve(token);
					} else {
						reject();
					}
				}
			});
		});
	});
};
