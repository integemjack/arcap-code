"use strict";

const os = require("os");
const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const ini = require("ini");
const EventEmitter = require("events").EventEmitter;
const { exec, fork } = require("child_process");
const fsext = require("fs-extra");

const dataproc = require("../libs/dataproc");
const { ARData } = require("../libs/ardata");
const logger = require("../libs/logger");
const { AliveChecker, toAbsolute } = require("../libs/utils");
const { getTheme, getConfig, findEndStages, reloadThemePath } = require("../libs/theme");
const config = require("../libs/config").get();
const modelsCreator = require("../models");

let stopVideoStream = null;

// const speech = require("../libs/speech");

const unavailable = {
	state: "unavailable"
};

let currentSequenceId = uuid.v1();
let aliveChecker = null;
let endStages = new Set();
let arData = null;
let arSocket = null;
let lastARState = unavailable;
let test_fork = null;
let pythonExec = null;

// zoom info
let zoom_info,
	zoom_users = [],
	zoom_cameras_json = {},
	last_user = {
		p1: {},
		p2: {}
	};

let arEvent = new EventEmitter();
arEvent.setMaxListeners(Infinity);

module.exports = function(server) {
	let io = require("socket.io")(server, {
		perMessageDeflate: false
	});

	function prepareAliveChecker() {
		if (aliveChecker) {
			aliveChecker.stop();
		}
		aliveChecker = new AliveChecker({
			timeout: config.ARbackendTimeout * 1000,
			ontimeout: () => {
				// Stages will be sent accroding to user's movement, I don't know how long the next stage will be arrive.
				// Don't take any action when timeout, until we have a good solution.
				// logger.error('AR backend timeout!');
				// arNsp.emit('reset');
			}
		});
		aliveChecker.start();
	}

	io.of("/login").on("connection", socket => {
		// Dealing with login & settings UI events
		logger.warn("Login UI connected");
		socket.on("disconnect", () => {
			logger.warn("Login UI disconnected");
		});

		require("./common/loginio")(socket, theExports);
	});

	let arNsp = io.of("/ar");
	arNsp.on("connection", socket => {
		if (arSocket) {
			logger.warn("Refuse AR connection, only one AR connection is allowed.");
			socket.emit("serverError", "refuseConnection");
			return socket.disconnect();
		}

		arSocket = socket;

		logger.warn("AR Chrome window connected");

		socket.on("disconnect", () => {
			if (socket === arSocket) {
				logger.warn("AR Chrome window disconnected");
				arSocket = null;
				lastARState = unavailable;
				arEvent.emit("arState", lastARState);
				try {
					//如果报错说明还没有开始运行theme
					if (process.argv.indexOf("test") >= 2) {
						test_fork.send("stop");
					} else {
						exec(`"${path.join(process.cwd(), "exe/CppNamedPipeServer.exe")}" Stop`, err => {
							if (err) {
								if (err.code === 1) {
									logger.info("**NOTE** CppNamedPipeServer.exe is always returning 1 as success code.");
								} else {
									logger.error(err);
								}
							}
						});
					}
					logger.info("close thread");
				} catch (e) {
					logger.info("Theme doesn't start already");
				}
			}
		});

		require("./common/loginio")(socket, theExports);

		// socket.on("speech", (content, cb) => {
		//
		// 	speech
		// 		.ffmpeg(content)
		// 		.then(c => {
		// 			switch (config.speech) {
		// 				case 'baidu':
		// 					speech.baidu(c, cb);
		// 					break;
		//
		// 				case 'google':
		// 					speech.google(c, cb);
		// 					break;
		//
		// 				default:
		// 					speech.google(c, cb);
		// 					break;
		// 			}
		// 		})
		// 		.catch(e => {
		// 			console.log(e);
		// 			cb(e, null);
		// 		});
		//
		// });

		socket.on("nextStage", () => {
			logger.info("Send next stage message to AR backend.");
			if (process.argv.indexOf("test") >= 2) {
				test_fork.send("next");
			} else {
				exec(`"${path.join(process.cwd(), "exe/CppNamedPipeServer.exe")}" Continue`, err => {
					if (err) {
						if (err.code === 1) {
							logger.info("**NOTE** CppNamedPipeServer.exe is always returning 1 as success code.");
						} else {
							logger.error(err);
						}
					}
				});
			}
		});

		// Logging AR desktop debug messages
		socket.on("console", msg => {
			logger.info("Desktop:", msg);
		});

		socket.on("streamOver", () => {
			let t = 1000 * 60 * 15;
			clearTimeout(stopVideoStream);
			console.log(`*** Cancel stop stream! ***`, stopVideoStream);
			stopVideoStream = setTimeout(function() {
				let log = require("child_process").execSync(`tasklist /M integem*`);
				let list = log.toString().split(/\r|\n|\r\n/g);

				let lists = list
					.filter(l => /integem/gi.test(l))
					.map(l => {
						let _l = l.split(/ +/g);
						return _l;
					});
				console.log(lists);

				lists.forEach(l => {
					let _log = require("child_process").execSync(`taskkill /T /F /PID ${l[1]}`);
					console.log(_log.toString());
				});
			}, t);
			console.log(`*** ${t} stoping stream...`, stopVideoStream, "***");
		});

		socket.on("getWelcome", cb => {
			logger.info(`Get: getting current welcome words.`);
			cb(null, fs.readFileSync(path.join(process.cwd(), "libs/mailer/templates/welcome.txt"), "utf8"));
		});

		socket.on("loadTheme", (themeId, cb = () => {}) => {
			clearTimeout(stopVideoStream);
			console.log(`*** Cancel stop stream! ***`, stopVideoStream);

			try {
				zoom_cameras_json = {};

				last_user = {
					p1: {},
					p2: {}
				};

				if (!fs.existsSync(path.join("c:/Integem/ZoomListCamera.txt")))
					fs.copyFileSync(path.join("c:/Integem/ZoomList.txt"), path.join("c:/Integem/ZoomListCamera.txt"));

				zoom_info = ini.parse(fs.readFileSync(path.join("c:/Integem/ZoomListCamera.txt"), "utf8"));

				zoom_users = [];
				for (let i = 1; i <= zoom_info.ZoomMeeting.TotalParticipants; i++) {
					zoom_users.push(zoom_info.ZoomMeeting[`Participant${i}`]);
				}

				console.log(`zoom info ->`, zoom_info);
				let zoom_cameras_txt = fs
					.readFileSync(path.join(os.homedir(), "Desktop/camera.config.csv"), "utf8")
					.toLocaleLowerCase();

				console.log(`zoom_cameras_txt ->`, zoom_cameras_txt);
				let zoom_cameras = zoom_cameras_txt.split(/[\r|\n]+/).map(cam => cam.split(","));
				console.log(`zoom cameras ->`, zoom_cameras);

				for (let i = 0; i < zoom_cameras.length; i += 4) {
					let name = zoom_cameras[i][0].replace(/(^\s*)|(\s*$)/g, "");
					if (name === "") continue;

					let over = zoom_cameras[i + 3][1].replace(/(^\s*)|(\s*$)/g, "") * 1;

					zoom_cameras_json[name] = {};

					let names = [];

					for (let p = 1; p <= 2; p++) {
						let { p_name, p_values, p_value } = zoom_info_p(i, p, zoom_cameras, over);

						names.push(p_values.name);
						zoom_cameras_json[name][p_name] = p_value;
						zoom_cameras_json[name][`${p_name}_name`] = p_values;

						last_user[`p${p}`] = p_values;
					}

					// console.log(`last_user ->`, last_user);
					zoom_cameras_json[name][`names`] = uniqueArray(names);
					zoom_cameras_json[name][zoom_cameras[i + 3][0].replace(/(^\s*)|(\s*$)/g, "")] = over;
				}

				// console.log(`zoom_cameras_json ->`, zoom_cameras_json);
				fs.writeFileSync(
					path.join(os.homedir(), "Desktop/camera.config.json"),
					JSON.stringify(zoom_cameras_json, null, 2)
				);
			} catch (e) {
				logger.error(e);
				console.log(new Date(), `Read zoom info error ->`, e.message);
			}

			let type = typeof themeId;
			logger.info(`Load theme id: [${type}] ${themeId}`);
			switch (type) {
				case "number":
					let models = modelsCreator("./data/db.sqlite", {
						sync: true
					});
					models.Themes.findById(themeId)
						.then(theme => {
							if (!theme) {
								logger.error(`theme id = ${theme} not found.`);
								return cb();
							}

							// write stageconfig
							let configFolder = toAbsolute(config.theme);
							let stageconf = path.join(configFolder, "stageconfig.txt");
							fsext.copyFileSync(path.join(theme.location, "stageconfig.txt"), stageconf);

							reloadThemePath();
							cb(
								getTheme(),
								getConfig(),
								ini.parse(
									fs.readFileSync(path.join(os.homedir(), "AppData/Local/Integem/IntegemCam/Zconfigure.txt"), "utf-8")
								)
							);
						})
						.catch(err => {
							logger.error(err);
							cb();
						});
					break;

				case "string":
					// let configFolder = toAbsolute(config.theme);
					// let stageconf = path.join(configFolder, "stageconfig.txt");
					// fsext.copyFileSync(path.join(themeId, "stageconfig.txt"), stageconf);

					reloadThemePath();
					cb(
						getTheme(),
						getConfig(),
						ini.parse(
							fs.readFileSync(path.join(os.homedir(), "AppData/Local/Integem/IntegemCam/Zconfigure.txt"), "utf-8")
						)
					);
					break;

				default:
					reloadThemePath();
					cb(
						getTheme(),
						getConfig(),
						ini.parse(
							fs.readFileSync(path.join(os.homedir(), "AppData/Local/Integem/IntegemCam/Zconfigure.txt"), "utf-8")
						)
					);
					break;
			}
		});

		// AR desktop is starting an new sequence, initialize data here.
		socket.on("start", (data, cb = () => {}) => {
			// Pass ID around the stage procedure to track stage initiator.
			currentSequenceId = data.sid;
			logger.info(`New sequence key: ${currentSequenceId}`);

			// Empty data object for the new sequence
			arData = new ARData({
				name: data.name.trim(),
				email: data.email.trim()
			});

			// Find out all end stages (stages that contains command finish)
			// to help detemine the sequence is finish or not
			endStages = findEndStages(getTheme());

			// Initial AR data storage
			arData
				.initialize()
				.then(() => {
					if (process.argv.indexOf("test") >= 2) {
						// Run AR backend simulator
						test_fork = fork(path.join(__dirname, "../command/stage.js"));
					} else {
						// Execute application to send start signal to AR backend
						logger.info("Send pipe message to AR backend.");
						exec(`"${path.join(process.cwd(), "exe/CppNamedPipeServer.exe")}"`, err => {
							if (err) {
								if (err.code === 1) {
									logger.info("**NOTE** CppNamedPipeServer.exe is always returning 1 as success code.");
								} else {
									logger.error(err);
								}
							}
						});
					}

					// Initial AR backend checker
					// Auto reset application state if AR backend is not responding.
					prepareAliveChecker();

					cb();
				})
				.catch(err => cb(err.toString()));
		});

		// No more data will be sent after done, time to rollup data and save to database
		socket.on("done", data => {
			// if (pythonExec) pythonExec.kill(pythonExec.pid + 1);
			if (data.sid !== currentSequenceId) {
				return logger.error(`[Done] Unexpected sequenceId ${data.sid}, currentSequenceId is ${currentSequenceId}`);
			}

			// Use local variable to protect from global modified
			let ardata = arData;

			// Write photos record to database
			if (ardata.dbPhotos) {
				if (config.online.photo) {
					// logger.info(`It's online mode! so send photos to user email!`);
					// dataproc.procDataAndSendEmail(ardata.dbPhotos, ardata.storage);
				} else {
					logger.info(`It's offline mode!`);
				}
			}

			arEvent.emit("arPhoto", {
				sid: currentSequenceId,
				photos: ardata.dbPhotos
			});

			// Completing video writing
			ardata.videoEnd();
			if (ardata.dbVideos) {
				if (config.online.video) {
					// logger.info(`It's online mode! so send video to user email!`);
					// dataproc.procDataAndSendEmail(ardata.dbVideos, ardata.storage);
				} else {
					logger.info(`It's offline mode!`);
				}
			}
		});

		socket.on("runCommand", (command, cb) => {
			let log = require("child_process").execSync(`tasklist /M python*`);
			let list = log.toString().split(/\r|\n|\r\n/g);

			let lists = list
				.filter(l => /python/gi.test(l))
				.map(l => {
					let _l = l.split(/ +/g);
					return _l;
				});
			console.log(lists);

			lists.forEach(l => {
				let _log = require("child_process").execSync(`taskkill /T /F /PID ${l[1]}`);
				console.log(_log.toString());
			});

			pythonExec = exec(command, (err, strout, out) => {
				cb(out.toString());
			});
		});

		// Receive and concat ongoing video chunks
		socket.on("video", data => {
			if (data.sid !== currentSequenceId) {
				return logger.error(`[Video] Unexpected sequenceId ${data.sid}, currentSequenceId is ${currentSequenceId}`);
			}
			arData.appendVideoData(data.data, data.type, data.videoIndex, data.themeId);
		});

		socket.on("videoRecord", (data, path) => {
			logger.info(`Save video stream "${path}" ->`, data.length);
			if (path !== "") {
				let stream = fs.createWriteStream(path, { flags: "r+" });
				stream.write(data, err => {
					if (err) {
						return logger.error(err);
					}
				});
			}
		});

		socket.on("videoPath", (data, cb) => {
			cb(arData.videoPath(data.type));
		});

		// Receive and save photos
		socket.on("photo", data => {
			if (data.sid !== currentSequenceId) {
				return logger.error(`[Photo] Unexpected sequenceId ${data.sid}, currentSequenceId is ${currentSequenceId}`);
			}
			arData.addPhoto(data.data, data.type, data.themeId);
		});

		// Publishing AR desktop state to listeners
		socket.on("arState", state => {
			logger.info("Received AR state:", state);
			Object.assign(lastARState, state);
			arEvent.emit("arState", state);
		});
	});

	// Export methods
	let theExports = {
		// Use to publish AR machine states, eg. idle, starting, started, etc
		event: arEvent,

		getDevices: cb => {
			logger.info("Get devices information.");
			if (!arSocket) {
				return cb("AR machine unavailable");
			}

			arSocket.emit("getDevices", (err, devices) => {
				logger.info(devices);
				cb(err, devices);
			});
		},

		// This method will be called when receiving AR backend stage requests
		emitStage: stage => {
			console.log(`stage ->`, stage);

			let _stage = JSON.parse(JSON.stringify(stage).toLocaleLowerCase());
			let thisStage = _stage.stagetitle.split(".")[0];
			let zoomUsers = [],
				names = [];

			try {
				if (!fs.existsSync(path.join("c:/Integem/ZoomListCamera.txt")))
					fs.copyFileSync(path.join("c:/Integem/ZoomList.txt"), path.join("c:/Integem/ZoomListCamera.txt"));

				zoom_info = ini.parse(fs.readFileSync(path.join("c:/Integem/ZoomListCamera.txt"), "utf8"));

				for (let i = 1; i <= zoom_info.ZoomMeeting.TotalParticipants; i++) {
					if (!/^integemar/gi.test(zoom_info.ZoomMeeting[`Participant${i}`]))
						zoomUsers.push(zoom_info.ZoomMeeting[`Participant${i}`]);
				}
			} catch (e) {
				cosnole.log(`zoomList error ->`, e.message);
			}

			try {
				let name = thisStage;
				console.log(`name ->`, name, Object.keys(zoom_cameras_json));

				for (let p = 1; p <= 2; p++) {
					let { p_values, p_value } = this_zoom_info(p, zoom_cameras_json[name], zoomUsers);

					names.push(p_values.name);
					zoom_cameras_json[name][`p${p}`] = p_value;
					zoom_cameras_json[name][`p${p}_name`] = p_values;

					last_user[`p${p}`] = p_values;
				}

				zoom_cameras_json[name][`names`] = uniqueArray(names);

				fs.writeFileSync(
					path.join(os.homedir(), "Desktop/camera.config.json"),
					JSON.stringify(zoom_cameras_json, null, 2)
				);

				let zoomInfo = zoom_cameras_json[name];
				console.log(`zoomInfo ->`, zoomInfo);

				if (zoomInfo) {
					let users = zoomInfo.names;
					console.log(`users ->`, users);

					let info = {
						ARinfo: {
							ARuserNum: users.length
						}
					};

					for (let i = 0; i < info.ARinfo.ARuserNum; i++) {
						info.ARinfo[`ARuser${i + 1}`] = users[i];
					}

					info.ARinfo.Frameformat = "720p";
					let infoTxt = ini.stringify(info);
					infoTxt = infoTxt.replace(/^[ \r\n]+/, "");
					console.log(`infoTxt ->`, infoTxt);
					fs.writeFileSync(path.join("c:/Integem/ARusers.txt"), infoTxt);
				}
			} catch (e) {
				console.log(`Write ARusers.txt is error ->`, e.message);
				console.log(e);
			}

			try {
				let chat_txt = fs.readFileSync(path.join("c:/Integem/StageChat.txt"), "utf8").replace(/[\r|\n]+$/, "");
				let chats = chat_txt
					.split(/[\r|\n]+/)
					.map(chat => chat.split(";").map(c => c.replace(/(^\s*)|(\s*$)/g, "")))
					.map(c => {
						let chat_users = [];
						for (let i = 2; i < c.length; i++) {
							let id = c[i] * 1;
							switch (id) {
								case 0:
									chat_users.push(`ARuser${i - 1}=anybody`);
									break;

								default:
									if (zoomUsers.length >= id) chat_users.push(`ARuser${i - 1}=${zoomUsers[id - 1]}`);
									break;
							}
						}
						// _c[c[0].toLocaleLowerCase()] = `${c[0]};${c[1]};${users.join(";")}`;
						return {
							title: c[0].toLocaleLowerCase(),
							value: `${c[0]};${c[1]};${chat_users.join(";")}`
						};
					});

				let chat = {};
				chats.forEach(c => {
					chat[c.title] = c.value;
				});

				console.log(`Stage Chat ->`, thisStage, chat[thisStage]);

				if (chat[thisStage]) fs.writeFileSync(path.join("c:/Integem/currentStageChat.txt"), chat[thisStage]);
			} catch (e) {
				console.log(`zoom chat error ->`, e.message);
			}

			arNsp.emit("set", {
				sid: currentSequenceId,
				stage
			});
			logger.info("set", {
				sid: currentSequenceId,
				stage
			});

			if (aliveChecker) {
				// Notify that AR backend is still alive
				aliveChecker.setAlive();
				if (endStages.has(stage.stagetitle)) {
					// Stop alive checker since we have reached command finish
					// Command finish is officially the last action in the sequence
					aliveChecker.stop();
				}
			}
		},

		// Mobile login app will call this method to start an AR experience
		emitStart: (data, cb = () => {}) => {
			if (!arSocket) {
				return cb("AR machine unavailable");
			}

			data.sid = uuid.v1();

			// Notify the AR desktop to start playing
			arSocket.emit("loginStart", data, err => {
				if (err) {
					logger.error(err);
				}
			});
			cb(null, data.sid);
		},

		emitStop: () => {
			logger.info("Stop AR experience.");
			let state = {
				state: "stopping",
				sid: currentSequenceId
			};
			Object.assign(lastARState, state);
			arEvent.emit("arState", state);

			arSocket.emit("stop", err => {
				if (err) logger.warn("**NOTE** stop ar have some error: ", err);
			});

			logger.info("Send stop message to AR backend.");
			if (process.argv.indexOf("test") >= 2) {
				test_fork.send("stop");
			} else {
				exec(`"${path.join(process.cwd(), "exe/CppNamedPipeServer.exe")}" Stop`, err => {
					if (err) {
						if (err.code === 1) {
							logger.info("**NOTE** CppNamedPipeServer.exe is always returning 1 as success code.");
						} else {
							logger.error(err);
						}
					}
				});
			}
		},

		// Get lastest AR state
		lastARState: () => lastARState,

		emitToggleLight: () => {
			if (!arSocket) {
				return;
			}

			arSocket.emit("toggleLight");
		},

		emitToggleRecordAll: () => {
			if (!arSocket) {
				return;
			}

			arSocket.emit("toggleRecordAll");
		},

		emitVolume: volume => {
			if (!arSocket) {
				return;
			}

			arSocket.emit("volume", volume);
		},

		emitAiConfig: config => {
			arSocket.emit("aiConfig", config);
		}
	};

	return theExports;
};

function uniqueArray(arr) {
	if (null == arr || arr.length == 0) {
		return arr;
	} else {
		let innerHashMap = {};
		for (let i = 0, j = arr.length; i < j; i++) {
			innerHashMap[arr[i]] = null;
		}
		let rs = [];
		for (let obj in innerHashMap) {
			rs.push(obj);
		}
		return rs;
	}
}

function zoom_info_p(i, p, zoom_cameras, over) {
	let p_name = zoom_cameras[i + p][0].replace(/(^\s*)|(\s*$)/g, "");
	let p_value = zoom_cameras[i + p][1].replace(/(^\s*)|(\s*$)/g, "");

	let p_values = {
		type: p_value.substr(0, 1),
		id: p_value.substr(1, 2) * 1,
		status: p_value.substr(3, 3),
		number: p_value.substr(6, 3) * 1
	};

	let index, _id;
	switch (p_values.type) {
		case "2":
			_id = p_values.id - 1;
			index = _id >= zoom_users.length ? p_values.id % over : _id;
			// p_values.name = zoom_users[index];
			break;

		default:
			p_values.sourceId = p_values.id;
			if (p_values.type === "2") {
				_id = p_values.id - 1;
				index = _id >= zoom_users.length ? p_values.id % over : _id;
				p_values.name = zoom_users[index];
			} else {
				switch (p_values.type) {
					case "0":
						let gps = p === 1 ? 2 : 1;
						let { p_values: p_value_o } = zoom_info_p(i, gps, zoom_cameras, over); //zoom_cameras[i + gps][1].replace(/(^\s*)|(\s*$)/g, "");
						p_values.id = p_value_o.index;
						break;

					case "1":
						p_values.id = last_user[`p${p}`].index;
						break;
				}

				switch (p_values.status) {
					case "001":
						_id = p_values.id - 1;
						index = _id >= zoom_users.length ? (_id % over) - 1 : _id;
						// p_values.name = zoom_users[index];
						break;

					case "002":
						_id = p_values.id + p_values.number - 1;
						index = _id >= zoom_users.length ? (_id % over) - 1 : _id;
						// p_values.name = zoom_users[index];
						break;

					case "003":
						_id = p_values.id - p_values.number - 1;
						index = _id >= zoom_users.length ? (_id % over) - 1 : _id;
						// p_values.name = zoom_users[index];
						break;

					case "004":
						let number = p_values.number >= zoom_users.length ? zoom_users.length : p_values.number;
						_id = Math.floor(Math.random() * number);
						index = _id >= zoom_users.length ? (_id % over) - 1 : _id;
						// p_values.name = zoom_users[index];
						break;
				}
			}
			break;
	}
	if (index < 0) index = 0;
	p_values.name = zoom_users[index];
	p_values.index = index + 1;
	// last_user[`p${p}`] = p_values;
	return { p_name, p_values, p_value };
}

function this_zoom_info(p, zooms, users) {
	let p_value = zooms[`p${p}`];

	let p_values = {
		type: p_value.substr(0, 1),
		id: p_value.substr(1, 2) * 1,
		status: p_value.substr(3, 3),
		number: p_value.substr(6, 3) * 1
	};

	let over = zooms.over;

	let index, _id;
	switch (p_values.type) {
		case "2":
			_id = p_values.id - 1;
			index = _id >= users.length ? p_values.id % over : _id;
			// p_values.name = users[index];
			break;

		default:
			p_values.sourceId = p_values.id;
			if (p_values.type === "2") {
				_id = p_values.id - 1;
				index = _id >= users.length ? p_values.id % over : _id;
				p_values.name = users[index];
			} else {
				switch (p_values.type) {
					case "0":
						let gps = p === 1 ? 2 : 1;
						let { p_values: p_value_o } = zoom_info_p(gps, zooms, users); //zoom_cameras[i + gps][1].replace(/(^\s*)|(\s*$)/g, "");
						p_values.id = p_value_o.index;
						break;

					case "1":
						p_values.id = last_user[`p${p}`].index;
						break;
				}

				switch (p_values.status) {
					case "001":
						_id = p_values.id;
						index = _id; // >= users.length ? (_id % over) - 1 : _id;
						// p_values.name = users[index];
						break;

					case "002":
						_id = p_values.id + p_values.number;
						index = _id; // >= users.length ? (_id % over) - 1 : _id;
						// p_values.name = users[index];
						break;

					case "003":
						_id = p_values.id - p_values.number;
						index = _id; // >= users.length ? (_id % over) - 1 : _id;
						// p_values.name = users[index];
						break;

					case "004":
						let number = p_values.number >= users.length ? users.length : p_values.number;
						_id = Math.floor(Math.random() * number) + 1;
						index = _id; // >= users.length ? (_id % over) - 1 : _id;
						// p_values.name = users[index];
						break;
				}
			}
			break;
	}
	// if (index <= 0) index = index % users.length;
	// while (index <= 0) {
	// 	index += users.length;
	// }
	if (index > users.length || index < 0) index = index % users.length;
	if (index === 0) index = users.length;
	p_values.name = users[index - 1];
	p_values.index = index;
	// last_user[`p${p}`] = p_values;
	return { p_values, p_value };
}
