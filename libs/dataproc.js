"use strict";

const fs = require("fs");
const path = require("path");
const co = require("co");

const logger = require("./logger");
const ffmpeg = require("./ffmpeg");
const myar = require("./myar");
const Mailer = require("./mailer").Mailer;
const Vimeo = require("./vimeo").Vimeo;
const Youku = require("./youku").Youku;
const { toAbsolute } = require("./utils");

const config = require("./config").get();

let mailer = new Mailer();
let vimeo = new Vimeo();
let youku = new Youku();

let convertVideo = co.wrap(function*(user, userMediaFolder) {
	for (let i = 0; i < user.media.videos.length; i++) {
		let video = user.media.videos[i];
		console.log("Convert video:", video);
		if (video.merged) {
			logger.info(`id-${user.id}: Video already converted.`);
			continue;
		}

		if (!config.email.video.ffmpeg) {
			logger.info(`id-${user.id}: Stop processing due to ffmpeg option is off`);
			return null;
		}

		let rawVideo = path.join(userMediaFolder, video.raw);
		if (!fs.existsSync(rawVideo)) {
			logger.error(`id-${user.id}: Stop processing due to file not found: ${rawVideo}`);
			return null;
		}

		let audio = null;
		if (config.email.video.music) {
			audio = toAbsolute(config.email.video.music);
		}
		if (!audio) {
			logger.error(`id-${user.id}: Stop converting video, background music is not set in config!`);
			return null;
		}
		logger.info(`Merge with music file "${audio}"`);

		let mergedVideo = video.raw.replace(/\.\w+$/, ".mp4");
		let fileOutput = path.join(userMediaFolder, mergedVideo);

		yield ffmpeg.merge(rawVideo, audio, config.email.video.voiceMode, config.email.video.size, fileOutput);

		video.merged = mergedVideo;
		user.changed("media", true);
		yield user.save();
	}
});

let postVideoOnMyar = co.wrap(function*(user, userMediaFolder) {
	if (!config.email.video.upload) {
		logger.info(`id-${user.id}: Skip upload video to Myar due to option is off!`);
		return false;
	}

	if (user.media.videoUploaded) {
		logger.info(`id-${user.id}: Videos already uploaded!`);
		return true;
	}

	for (let i = 0; i < user.media.videos.length; i++) {
		let video = user.media.videos[i];
		console.log("Upload video", video);

		if (video.link) {
			logger.info(`id-${user.id}: Video already uploaded. ${video.link}`);
			continue;
		}

		if (!config.online.video) {
			logger.info(`id-${user.id}: Stop processing due to video is set to offline.`);
			continue;
		}

		if (!video.merged) {
			logger.warn("Video not merged,", video);
			continue;
		}

		logger.info(`id-${user.id}: Start upload to vimeo or youku...`);
		let mergedVideo = path.join(userMediaFolder, video.merged);

		let link = "";
		switch (config.email.video.mode) {
			case "vimeo":
				link = yield vimeo.upload(mergedVideo);
				break;
			case "youku":
				link = yield youku.upload(mergedVideo);
				break;
			default:
				logger.warn(`id-${user.id}: Cancel upload due to the vimeo or youku option is off.`);
				continue;
		}
		if (!link) {
			logger.info(`id-${user.id}: Failed to upload to ${config.email.video.mode}!`);
			continue;
		}
		logger.info(`id-${user.id}: File is uploaded to ${config.email.video.mode}! the link is ${link}`);

		video.link = link;
		user.changed("media", true);
		yield user.save();
		logger.info(`id-${user.id}: Saved ${config.email.video.mode} link to database.`);
	}

	let token = yield myar.uploadVideos(user);

	logger.info(`id-${user.id}: vimeo uploaded to Myar website.`);

	user.token = token;
	user.media.videoUploaded = true;
	user.changed("media", true);
	yield user.save();

	logger.info(`id-${user.id}: Saved videoUploaded state to database.`);
	return true;
});

let postPhotosOnMyar = co.wrap(function*(user, userMediaFolder) {
	if (!config.online.photo) {
		logger.info(`id-${user.id}: Stop processing due to photo is set to offline.`);
		return false;
	}

	logger.info(`id-${user.id}: Synchronizing photos...`);

	if (user.media.photoUploaded) {
		logger.info(`id-${user.id}: Photos already uploaded!`);
		return true;
	}

	if (!config.email.photo.upload) {
		logger.info(`id-${user.id}: Skip uploading photos due to option is off!`);
		return false;
	}

	let token = yield myar.uploadPhoto(user, userMediaFolder);

	logger.info(`id-${user.id}: Photos uploaded to Myar website.`);

	user.token = token;
	user.media.photoUploaded = true;
	user.changed("media", true);
	yield user.save();

	logger.info(`id-${user.id}: Saved photoUploaded state to database.`);

	return true;
});

let sendEmail = co.wrap(function*(user, userMediaFolder) {
	if (!user.email) {
		logger.error(`id-${user.id}: User has no email address!`);
		return false;
	}

	let mail = mailer.createMail(user, userMediaFolder);
	if (!mail) {
		logger.info(`id-${user.id}: Email is not sent.`);
		return false;
	}
	yield mailer.sendMail(mail);

	logger.info(`id-${user.id}: Send mail to ${user.email + " : " + user.name} is successful.`);
	yield user.update({ send: true });
	return true;
});

module.exports.procDataAndSendEmail = function(user, storage) {
	logger.info(`id-${user.id}: Start...`);

	let userMediaFolder = path.join(storage, user.media.store);
	logger.info(`User media folder: ${userMediaFolder}`);

	return co(function*() {
		if (user.media.type === "video") {
			yield convertVideo(user, userMediaFolder);
			yield postVideoOnMyar(user, userMediaFolder);
			if (config.email.video.email) {
				yield sendEmail(user, userMediaFolder);
			} else {
				logger.info(`id-${user.id}: Skip sending email for video.`);
			}
		} else {
			let success = yield postPhotosOnMyar(user, userMediaFolder);
			if (success) {
				if (config.email.photo.email) {
					yield sendEmail(user, userMediaFolder);
				} else {
					logger.info(`id-${user.id}: Skip sending email for photos.`);
				}
			}
		}
	}).catch(err => logger.error(err));
};

module.exports.procDataAndSendDistinctEmail = function(user, storage, isSend) {
	logger.info(`id-${user.id}: Start...`);

	let userMediaFolder = path.join(storage, user.media.store);
	logger.info(`User media folder: ${userMediaFolder}`);

	return co(function*() {
		if (user.media.type === "video") {
			yield convertVideo(user, userMediaFolder);
			yield postVideoOnMyar(user, userMediaFolder);
			if (config.email.video.email) {
				//configure 中邮件设置
				if (!isSend) {
					logger.info(`id-${user.id}: ${user.email + " : " + user.name} has been sent before,skip`);
					yield user.update({ send: true });
				} else {
					logger.info(`id-${user.id}: ${user.email + " : " + user.name} was sent email `);
					yield sendEmail(user, userMediaFolder);
				}
			} else {
				logger.info(`id-${user.id}: ${user.email + " : " + user.name} Skip sending email for video.`);
			}
		} else {
			let success = yield postPhotosOnMyar(user, userMediaFolder);
			if (success) {
				if (config.email.photo.email) {
					if (!isSend) {
						logger.info(`id-${user.id}: ${user.email + " : " + user.name} has been sent before,skip`);
						yield user.update({ send: true });
					} else {
						logger.info(`id-${user.id}: ${user.email + " : " + user.name} was sent email `);
						yield sendEmail(user, userMediaFolder);
					}
				} else {
					logger.info(`id-${user.id}: ${user.email + " : " + user.name} Skip sending email for photos.`);
				}
			}
		}
	}).catch(err => logger.error(err));
};
