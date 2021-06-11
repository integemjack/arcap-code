"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const config = require("../../libs/config");
const processor = require("../../libs/processor");
const logger = require("../../libs/logger");
const moment = require("moment");

const modelsCreator = require("../../models");
const shorthash = require("shorthash");

const { machineIdSync } = require("node-machine-id");
const { toAbsolute } = require("../../libs/utils");

const ini = require("ini");
const { exec } = require("child_process");

let processVideos = {};
let processToMP4s = {};
let day = moment().format("YYYYMMDD");
let machineId = shorthash.unique(machineIdSync({ original: true }));
let storage = path.join(toAbsolute(config.get().storage), day);
let locHash = shorthash.unique(storage);
let database = path.join(storage, `${machineId}_${day}_${locHash}.sqlite`);
let models = modelsCreator(database);
models.User.findAll().then(users => {
	users.forEach(user => {
		// console.log(user.email, user.media)
		if (user.media.videos && user.media.videos.length > 0) {
			// console.log(`/${moment().format("YYYYMMDD")}/media/${user.email}/${user.media.videos[0].raw}`);
			if (user.media.videos[0].status && user.media.videos[0].status.message === "done")
				processVideos[`/${moment().format("YYYYMMDD")}/media/${user.email}/${user.media.videos[0].raw}`] =
					user.media.videos[0].status;
		} else if (user.media.photos && user.media.status) {
			for (let file in user.media.status) {
				if (user.media.status[file].message === "done") processVideos[file] = user.media.status[file];
			}
		}
	});
});

const async = require("async");

let processVideoFun = ({ file, socket }, cb) => {
	if (processVideos[file]) return cb(processVideos[file]);

	processVideos[file] = {
		success: true,
		message: "processing..."
	};
	models.User.findAll().then(users => {
		users.forEach(user => {
			// console.log(user.media.photos);
			if (user.media.videos && user.media.videos.length > 0) {
				if (file === `/${moment().format("YYYYMMDD")}/media/${user.email}/${user.media.videos[0].raw}`) {
					user.media.videos[0].status = processVideos[file];
					user.changed("media", true);
					user.save();
				}
			} else if (user.media.photos && user.media.photos.length > 0) {
				let photos = user.media.photos
					.map(p => `/${moment().format("YYYYMMDD")}/media/${user.email}/${p}`)
					.filter(p => p === file);
				// console.log(file, photos);
				if (photos.length > 0) {
					if (!user.media.status) user.media.status = {};
					user.media.status[file] = processVideos[file];
					user.changed("media", true);
					user.save();
				}
			}
		});
	});
	cb(processVideos[file]);
	// return false;
	processor.creatorOne(config.get().storage, file, () => {
		processVideos[file] = {
			success: true,
			message: "done"
		};
		models.User.findAll().then(users => {
			users.forEach(user => {
				if (user.media.videos && user.media.videos.length > 0) {
					if (file === `/${moment().format("YYYYMMDD")}/media/${user.email}/${user.media.videos[0].raw}`) {
						user.media.videos[0].status = processVideos[file];
						user.changed("media", true);
						user.save();
					}
				} else if (user.media.photos && user.media.photos.length > 0) {
					let photos = user.media.photos
						.map(p => `/${moment().format("YYYYMMDD")}/media/${user.email}/${p}`)
						.filter(p => p === file);
					// console.log(file, photos);
					if (photos.length > 0) {
						if (!user.media.status) user.media.status = {};
						user.media.status[file] = processVideos[file];
						user.changed("media", true);
						user.save();
					}
				}
			});
		});
		socket.emit("processVideoOk", file);
		// cb(processVideos[file]);
	});
};

let processVideo = async.queue(processVideoFun, 1);

let processToMP4Fun = ({ file, socket }, cb) => {
	if (processToMP4s[file]) return cb(processToMP4s[file]);

	processToMP4s[file] = {
		success: true,
		message: "processing..."
	};
	// return false;
	processor.toMP4(config.get().storage, file, () => {
		processToMP4s[file] = {
			success: true,
			message: "done"
		};
		socket.emit("processToMP4Ok", file);
		// cb(processVideos[file]);
	});
};

let processToMP4 = async.queue(processToMP4Fun, 1);

module.exports = function(socket, ario, IO) {
	let sequenceId = null;

	//
	// Processor state
	//
	function procStateForward(state) {
		// Forward processor state to UI
		// logger.info("Forward processor state to", socket.id);
		socket.emit("serverState", {
			processorState: state
		});
	}

	// logger.info("Subscribe processor state for socket:", socket.id);
	processor.on("state", procStateForward);

	// Initialize UI state
	procStateForward(processor.state());

	function procOutputForward(data) {
		// Passing processor output to UI
		// logger.info("Forward processor output to", socket.id);
		socket.emit("console", data.toString().replace(/\x1B\[[0-9]+m(.*?)- \x1B\[[0-9]+m/g, "<br />"));
	}

	processor.on("output", procOutputForward);

	socket.on("getDevices", cb => {
		ario.getDevices(cb);
	});

	socket.on("setHDRatio", HDRatio => {
		try {
			let cam = ini.parse(
				fs.readFileSync(path.join(os.homedir(), "AppData/Local/Integem/IntegemCam/Zconfigure.txt"), "utf-8")
			);
			cam.HDResolutionRatio.HDratio = HDRatio;
			fs.writeFileSync(path.join(os.homedir(), "AppData/Local/Integem/IntegemCam/Zconfigure.txt"), ini.stringify(cam));
		} catch (e) {
			console.log(e);
		}
	});

	socket.on("setZConfig", config => {
		try {
			let cam = ini.parse(
				fs.readFileSync(path.join(os.homedir(), "AppData/Local/Integem/IntegemCam/Zconfigure.txt"), "utf-8")
			);
			// cam = HDRatio;
			fs.writeFileSync(
				path.join(os.homedir(), "AppData/Local/Integem/IntegemCam/Zconfigure.txt"),
				ini.stringify(config)
			);
		} catch (e) {
			console.log(e);
		}
	});

	socket.on("getHDRatio", cb => {
		try {
			let cam = ini.parse(
				fs.readFileSync(path.join(os.homedir(), "AppData/Local/Integem/IntegemCam/Zconfigure.txt"), "utf-8")
			);
			// console.log(cam);
			cb(cam.HDResolutionRatio.HDratio);
		} catch (e) {
			console.log(e);
			cb(1);
		}
	});

	socket.on("getZConfig", cb => {
		try {
			let cam = ini.parse(
				fs.readFileSync(path.join(os.homedir(), "AppData/Local/Integem/IntegemCam/Zconfigure.txt"), "utf-8")
			);
			// console.log(cam);
			cb(cam);
		} catch (e) {
			console.log(e);
			cb(1);
		}
	});

	// Run data processor
	socket.on("processData", cb => {
		if (processor.isProcessing()) {
			return cb("already processing");
		}
		processor.start();
		cb();
	});

	socket.on("processCreator", (input, cb) => {
		if (processor.isProcessing()) {
			return cb("already processing");
		}
		processor.creator(input, () => {
			let files = fs
				.readdirSync(input.path)
				.map(file => {
					if (file && /\.webm$/.test(file) && file.split("_")[2]) {
						let id = file.split("_")[2].split(".")[0];
						return {
							id,
							open: `https://creator.integem.com/api.php?do=page&postId=${id}`,
							file
						};
					} else {
						return null;
					}
				})
				.filter(file => file);
			console.log(files);
			cb(files);
		});
		// cb();
	});

	socket.on("processCreatorOne", (file, cb) => {
		processVideo.push({ file, socket }, status => {
			cb(status);
		});
	});

	socket.on("processToMP4", (file, cb) => {
		processToMP4.push({ file, socket }, status => {
			cb(status);
		});
	});

	socket.on("open", (file, cb) => {
		// console.log(path.join(config.get().storage, file).replace(/\\/g, '\\'));
		exec(`explorer.exe /select,"${path.join(config.get().storage, `${file}.mp4`).replace(/\\/g, "\\")}"`);
		// shell.showItemInFolder(file.split(/\\|\//).pop().join("/"));
	});

	socket.on("selectProcess", (info, cb) => {
		logger.info(`process ${info.dateTime}:${info.email.toString()}`);
		if (processor.isProcessing()) {
			return cb("already processing");
		}

		processor.selectStart(info);
		cb();
	});

	socket.on("selectDateProcess", (info, cb) => {
		logger.info(`process ${info.email} : ${info.dateTimes.toString()}`);
		if (processor.isProcessing()) {
			return cb("already processing");
		}
		processor.selectDateStart(info);
		cb();
	});

	//
	// Config changes
	//
	function configStateForward() {
		// Forward config changes to UI
		// logger.info("Forward config changes to", socket.id);
		socket.emit("config", config.get());
	}

	// logger.info("Subscribe config changes for socket:", socket.id);
	config.on("updated", configStateForward);

	//
	// AR state
	//
	function arStateForward(state) {
		// Forward config changes to UI
		// logger.info("Forward AR state to", socket.id);
		socket.emit("serverState", {
			arState: state
		});
	}

	// logger.info("Subscribe AR state for socket:", socket.id);
	ario.event.on("arState", arStateForward);

	// Initialize UI state
	if (ario.lastARState()) {
		arStateForward(ario.lastARState());
	}

	//
	// Forward AR photos to the sequence starter
	//
	function arPhotoForward(data) {
		if (data.sid === sequenceId) {
			// Forward AR photos to UI
			logger.info("Forward AR photos to", socket.id);
			socket.emit("arPhoto", data.photos);
		}
	}

	// logger.info("Subscribe AR photos for socket:", socket.id);
	ario.event.on("arPhoto", arPhotoForward);

	// Unsubscribe all event when client disconnect
	socket.on("disconnect", () => {
		// logger.info("Unsubscribe processor state for socket:", socket.id);
		processor.removeListener("state", procStateForward);

		// logger.info("Unsubscribe processor output for socket:", socket.id);
		processor.removeListener("output", procOutputForward);

		// logger.info("Unsubscribe config changes for socket:", socket.id);
		config.removeListener("updated", configStateForward);

		// logger.info("Unsubscribe AR state for socket:", socket.id);
		ario.event.removeListener("arState", arStateForward);

		// logger.info("Unsubscribe AR photo for socket:", socket.id);
		ario.event.removeListener("arPhoto", arPhotoForward);
	});

	// Send config to browser
	socket.on("configGet", cb => {
		logger.info(`configGet: getting current settings.`);
		cb(null, {
			config: config.get(),
			video: fs.readFileSync(path.join(process.cwd(), "libs/mailer/templates/video.txt"), "utf8"),
			photo: fs.readFileSync(path.join(process.cwd(), "libs/mailer/templates/photo.txt"), "utf8")
		});
	});

	// Send ai config to browser
	socket.on("getAiConfig", cb => {
		logger.info(`getAiConfig: getting current settings.`);
		// console.log(JSON.parse(fs.readFileSync(path.join(process.cwd(), "aiConfig.json"), "utf8")));
		if (!fs.existsSync(path.join(process.cwd(), "aiConfig.json")))
			fs.copyFileSync(path.join(process.cwd(), "aiConfig.bak.json"), path.join(process.cwd(), "aiConfig.json"));
		// let files = fs.readdirSync(path.join(process.cwd(), "ai"));
		// let head = {};
		// for(let file of files) {
		// 	console.log(file);
		// 	let filename = file.split(".")[0];
		// 	head[filename] = `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), "ai", file), "base64")}`
		// }
		let head = JSON.parse(fs.readFileSync(path.join(process.cwd(), "ai/info.json"), "utf8"));
		for (let key in head) {
			head[key].use = false;
			head[key].imageData = `data:image/png;base64,${fs.readFileSync(
				path.join(process.cwd(), "ai", head[key].image),
				"base64"
			)}`;
		}
		cb(null, JSON.parse(fs.readFileSync(path.join(process.cwd(), "aiConfig.json"), "utf8")), head);
	});

	// Receive modified config from browser
	socket.on("configSet", json => {
		logger.info(`configSet(${JSON.stringify(json.config, null, 4)})`);

		var oldPhotoOnline = config.get().online.photo,
			oldVideoOnline = config.get().online.video;

		config.update(json.config);

		/* if ((!oldPhotoOnline && config.get().online.photo) || (!oldVideoOnline && config.get().online.video)) {
		 processor.start();
		 } */

		fs.writeFileSync(path.join(process.cwd(), "libs/mailer/templates/video.txt"), json.video);
		fs.writeFileSync(path.join(process.cwd(), "libs/mailer/templates/photo.txt"), json.photo);
		logger.info(`Config is saved!`);
	});

	socket.on("aiConfigSet", json => {
		logger.info(`configSet(${JSON.stringify(json, null, 4)})`);

		ario.emitAiConfig(json);
		fs.writeFileSync(path.join(process.cwd(), "aiConfig.json"), JSON.stringify(json, null, 2));
		logger.info(`aiConfig is saved!`);
	});

	socket.on("welcomeGet", cb => {
		logger.info(`Get: getting current welcome words.`);
		cb(null, fs.readFileSync(path.join(process.cwd(), "libs/mailer/templates/welcome.txt"), "utf8"));
	});

	socket.on("welcomeSet", (welcomeWords, cb) => {
		logger.info(`welcome words set ${welcomeWords}`);

		fs.writeFileSync(path.join(process.cwd(), "libs/mailer/templates/welcome.txt"), welcomeWords);
		logger.info("welcome words is saved");
		cb();
	});

	// User clicked start on login page
	socket.on("loginStart", (data, cb = () => {}) => {
		logger.info(`Start AR experience with parameter ${JSON.stringify(data)}`);

		if (!data)
			data = {
				name: "",
				email: ""
			};

		// Tell AR machine to start playing
		ario.emitStart(data, (err, sid) => {
			sequenceId = sid;
			cb(err, sid);
		});
	});

	socket.on("stop", (cb = () => {}) => {
		ario.emitStop();
		// cb();
	});

	socket.on("volume", volume => {
		ario.emitVolume(volume);
	});

	socket.on("toggleLight", () => {
		logger.info("on Login panel toggleLight");
		ario.emitToggleLight();
	});

	socket.on("toggleRecordAll", () => {
		logger.info("on Login panel toggleRecordAll");
		ario.emitToggleRecordAll();
	});

	let networkInterfaces = os.networkInterfaces(),
		address = "";
	for (let k in networkInterfaces) {
		networkInterfaces[k].forEach(net => {
			if (/^192\.168\.[0-9\.]+/.test(net.address)) address = net.address;
		});
	}

	// 初始化用户项目
	socket.on("setProjectInit", (info, cb) => {
		try {
			let models = [];
			if (info.dateTime) {
				let machineId = shorthash.unique(machineIdSync({ original: true }));
				let storage = path.join(toAbsolute(config.get().storage), info.dateTime);
				// let locHash = shorthash.unique(storage);
				// let database = path.join(storage, `${machineId}_${info.dateTime}_${locHash}.sqlite`);
				fs.readdirSync(storage).forEach(file => {
					if (/\.sqlite$/.test(file)) {
						let model = modelsCreator(path.join(storage, file));
						models.push(model);
					}
				});
			} else if (info.dateTimes) {
				info.dateTimes.forEach(dateTime => {
					let machineId = shorthash.unique(machineIdSync({ original: true }));
					let storage = path.join(toAbsolute(config.get().storage), dateTime);
					// let locHash = shorthash.unique(storage);
					// let database = path.join(storage, `${machineId}_${dateTime}_${locHash}.sqlite`);
					fs.readdirSync(storage).forEach(file => {
						if (/\.sqlite$/.test(file)) {
							let model = modelsCreator(path.join(storage, file));
							models.push(model);
						}
					});
				});
			}
			let where = { $or: [] };
			info.email.forEach(e => {
				where.$or.push({ email: e });
			});

			models.forEach(async model => {
				console.log(models.length, where);
				let users = await model.User.findAll({ where });
				for (let i = 0; i < users.length; i++) {
					let user = users[i];
					// console.log(user.media);
					if (user.media.type === "video") {
						user.media.videos = user.media.videos.map(video => {
							return {
								raw: video.raw
							};
						});
						user.changed("media", true);
						// console.log("user.media.videos", user.media);
					} else {
						user.media.photoUploaded = false;
						user.changed("media", true);
						// console.log("user.media.photos", user.media);
					}
					user.send = false;
					await user.save();
				}
			});
			cb(null);
		} catch (e) {
			cb(e);
		}
	});

	// 获取用户项目列表
	socket.on("getPhotoList", (email, page, cb) => {
		let day = moment().format("YYYYMMDD");
		let machineId = shorthash.unique(machineIdSync({ original: true }));
		let storage = path.join(toAbsolute(config.get().storage), day);
		let locHash = shorthash.unique(storage);
		let database = path.join(storage, `${machineId}_${day}_${locHash}.sqlite`);
		let models = modelsCreator(database);

		models.User.findAll({ where: { email } }).then(user => {
			// console.log(JSON.stringify(user));
			let lists = Array.from(
				new Set(
					user.map(u => {
						let a = u.uuid.split("-");
						a.shift();
						return a.join("-");
					})
				)
			);
			let medias = {};
			user.map(u => {
				let uuid = u.uuid.split("-");
				uuid.shift();
				if (u.media.photos && u.media.photos.length > 0)
					medias[uuid.join("-")] = `/${moment().format("YYYYMMDD")}/media/${email}/${u.media.photos[0]}`;
				if (u.media.videos && u.media.videos.length > 0) {
					medias[uuid.join("-")] = `/${moment().format("YYYYMMDD")}/media/${email}/${u.media.videos[0].raw}`;
				}
			});
			let listsF = [];
			for (let k in medias) {
				if (medias[k] !== "") listsF.push(k);
			}
			console.log({ lists: listsF, medias });
			cb({ lists: listsF, medias });
		});
	});

	// User clicked user admin to get photos on start page
	socket.on("getPhotos", (email, page, from, cb) => {
		// console.log(email, page, from);
		let mainDir = config.get().storage;
		if (new RegExp("^[.]+").test(mainDir)) mainDir = path.join(process.cwd(), config.get().storage);

		let userDir = path.join(mainDir, moment().format("YYYYMMDD"), "media", email);

		let day = moment().format("YYYYMMDD");
		let machineId = shorthash.unique(machineIdSync({ original: true }));
		let storage = path.join(toAbsolute(config.get().storage), day);
		let locHash = shorthash.unique(storage);
		let database = path.join(storage, `${machineId}_${day}_${locHash}.sqlite`);
		let models = modelsCreator(database);
		let medias = [];
		models.User.findAll({ where: { email, uuid: { $like: `%${from}` } } })
			.then(user => {
				// console.log("user", user);
				for (let i = 0; i < user.length; i++) {
					let u = user[i];
					if (u.media.photos) medias = medias.concat(u.media.photos);
					if (u.media.videos) medias = medias.concat(u.media.videos.map(video => video.raw));
				}
				// console.log(medias);

				if (fs.existsSync(userDir)) {
					fs.readdir(userDir, (err, files) => {
						if (!err) {
							files = files.filter(file => {
								let x = medias.indexOf(file);
								if (x > -1) {
									return true;
								} else {
									return false;
								}
							});
							console.log(files.length);
							cb({
								medias: files
									? files
											.filter(file => new RegExp("jpg$").test(file) || new RegExp("webm$").test(file))
											// .map(file => {
											// 	let _ = (new RegExp("jpg$")).test(file) ? "data:image/jpeg;base64," : "data:video/webm;base64,";
											// 	return `${_}${fs.readFileSync(path.join(userDir, file), "base64")}`;
											// })
											.filter((v, i) => (page.now - 1) * page.number <= i && page.now * page.number > i)
											.map(file => {
												return {
													file: `/${moment().format("YYYYMMDD")}/media/${email}/${file}`,
													status: processVideos[`/${moment().format("YYYYMMDD")}/media/${email}/${file}`] || {
														success: false,
														message: "Upload"
													},
													tomp4: processToMP4s[`/${moment().format("YYYYMMDD")}/media/${email}/${file}`] || {
														success: false,
														message: "To MP4"
													}
												};
											})
									: [],
								top: Math.ceil(files.length / page.number),
								address: `http://${address}:20120/#/photos/${from}`
							});
						} else {
							console.log(err);
							cb(null);
						}
					});
				} else {
					console.log(`This dir<${userDir}> is not exists.`);
					cb(null);
				}
			})
			.catch(e => {
				console.log("error", e);
				cb(null);
			});
	});

	socket.on("log", console.log);
};
