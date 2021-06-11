"use strict";

const fs = require("fs");
const path = require("path");
const co = require("co");
const mkdirp = require("mkdirp");
const moment = require("moment");
const { machineIdSync } = require("node-machine-id");
const shorthash = require("shorthash");

const modelsCreator = require("../models");
const logger = require("./logger");
const { genToken, toAbsolute } = require("./utils");
const config = require("./config").get();

String.prototype.firstUpperCase = function() {
	return this.replace(/\b(\w)(\w*)/g, function($0, $1, $2) {
		return $1.toUpperCase() + $2.toLowerCase();
	});
};

const day = moment().format("YYYYMMDD");
const machineId = shorthash.unique(machineIdSync({ original: true }));

function getPaths() {
	let storage = path.join(toAbsolute(config.storage), day);
	let locHash = shorthash.unique(storage);
	let database = path.join(storage, `${machineId}_${day}_${locHash}.sqlite`);
	return { storage, database };
}

function ARData(opts) {
	const { name, email } = opts;

	let fregments = name.split(" ");
	for (let i in fregments) {
		// Uppercase the name words
		fregments[i] = fregments[i].firstUpperCase();
	}

	this.name = fregments.join(" ");
	this.nameNoSpace = fregments.join("");

	this.email = email;

	this.dbPhotos = null;
	this.dbVideos = null;

	// video data
	this.videos = new Map();

	this.music = null;
	this.token = null;

	let paths = getPaths();

	// data storage path
	this.storage = paths.storage;
	this.mediaFolder = path.join("media", email);

	// database
	this.models = modelsCreator(paths.database);

	logger.info(`AR data location: ${this.storage}`);
}

ARData.prototype.getToken = function() {
	return this.models.User.findOne({ where: { email: this.email } }).then(user => {
		if (user && user.token) {
			return user.token;
		} else {
			return genToken(config.token.prefix, config.token.digit);
		}
	});
};

ARData.prototype.initialize = function() {
	mkdirp.sync(path.join(this.storage, this.mediaFolder));

	let self = this;
	return co(function*() {
		yield self.models.sequelize.sync();
		logger.info("database ready");
		self.token = yield self.getToken();
		self.dbPhotos = yield self.models.User.create({
			token: self.token,
			name: self.name,
			email: self.email,
			media: {
				type: "photo",
				store: self.mediaFolder,
				photos: []
			}
		});
		self.dbVideos = yield self.models.User.create({
			token: self.token,
			name: self.name,
			email: self.email,
			media: {
				type: "video",
				store: self.mediaFolder,
				videos: []
			}
		});
		return self;
	});
};

ARData.prototype.addPhoto = function(photoData, type, themeId) {
	let filename = themeId && themeId !== '' ? `${this.email}_${this.nameNoSpace}_${new Date().getTime()}_${themeId}.${type}` : `${this.email}_${this.nameNoSpace}_${new Date().getTime()}.${type}`;
	let filepath = path.join(this.storage, this.mediaFolder, filename);
	logger.info("Save photo as", filepath);

	fs.writeFile(filepath, photoData, err => {
		if (err) {
			return logger.error(err);
		}
		logger.info(`Save as ${filepath} successful!`);

		if (this.dbPhotos) {
			this.dbPhotos.media.photos.push(filename);
			this.dbPhotos.changed("media", true);
			this.dbPhotos.save();
			logger.info(`Add photo to database, id = ${this.dbPhotos.id}.`);
		}
	});
};

ARData.prototype.appendVideoData = function(videoData, type, videoIndex, themeId = "") {
	let videoInfo = this.videos.get(videoIndex);

	if (!videoInfo) {
		let filename = `${this.email}_${this.nameNoSpace}_${new Date().getTime()}.${type}`;
		if (themeId !== "") filename = `${this.email}_${this.nameNoSpace}_${new Date().getTime()}_${themeId}.${type}`;
		let videopath = path.join(this.storage, this.mediaFolder, filename);

		try {
			videoInfo = {
				ended: false,
				path: videopath,
				stream: fs.createWriteStream(videopath)
			};
		} catch (err) {
			return logger.error(err);
		}

		logger.info("Video file created at", videopath);
		this.videos.set(videoIndex, videoInfo);

		if (this.dbVideos) {
			this.dbVideos.media.videos.push({ raw: filename });
			this.dbVideos.changed("media", true);
			this.dbVideos.save();
			logger.info(`Add video to database, id = ${this.dbVideos.id}.`);
		}
	}

	if (videoInfo.ended) {
		return;
	}

	videoInfo.stream.write(videoData, err => {
		if (err) {
			return logger.error(err);
		}
	});
};

ARData.prototype.videoEnd = function() {
	this.videos.forEach(videoInfo => {
		videoInfo.ended = true;
		videoInfo.stream.end();
	});
};

ARData.prototype.setMusic = function(music) {
	return new Promise((resolve, reject) => {
		let filename = `${this.email}_${this.nameNoSpace}_${new Date().getTime()}${path.extname(music)}`;
		this.music = filename;

		let filepath = path.join(this.storage, this.mediaFolder, filename);
		logger.info(`Copy music from ${music}\nto ${filepath}`);
		fs.createReadStream(music)
			.on("error", reject)
			.pipe(fs.createWriteStream(filepath).on("error", reject))
			.on("finish", resolve)
			.on("error", reject);
	});
};

ARData.prototype.videoPath = function(type) {
	let filename = `${this.email}_${this.nameNoSpace}_${new Date().getTime()}.${type}`;
	let videopath = path.join(this.storage, this.mediaFolder, filename);
	if (this.dbVideos) {
		this.dbVideos.media.videos.push({ raw: filename });
		this.dbVideos.changed("media", true);
		this.dbVideos.save();
		logger.info(`Add video to database, id = ${this.dbVideos.id}.`);
	}
	return videopath;
};

module.exports = { ARData, getPaths };
