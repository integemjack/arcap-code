"use strict";
const fs = require("fs");
const path = require("path");
const qrcode = require("qr-image");

const logger = require("../libs/logger");
const config = require("../libs/config");
const utils = require("../libs/utils");
const mailer = require("../libs/mailer");
const processor = require("../libs/processor");
const csv = require("../libs/csvOperation");
let modelsCreator = require("../models");

const request = require("request");
const progress = require("request-progress");
const YAML = require("js-yaml");
const fsext = require("fs-extra");
const AdmZip = require("adm-zip");
const download = require("../libs/download");

const dirs = require("dirs");

let models = modelsCreator("./data/db.sqlite");

module.exports = function(server, ario) {
	models.sequelize
		.sync()
		.then(() => {
			let io = require("socket.io")(server);

			io.of("/QRcode").on("connection", socket => {
				// User clicked start on QRcode page
				socket.on("getQRcode", (data, cb = () => {}) => {
					logger.info(`Start get QRcode user info: ${JSON.stringify(data)}`);
					// data.name = data.name.trim(); // delete space
					// data.email = data.email.trim();
					models.QRcode.findOrCreate({
						where: data
					}).then(qr => {
						//id is the dataValue which exist in the database
						let { id } = qr[0].dataValues;
						//code is create by id. Key is integem
						let code = utils.encrypt(id.toString(), "integem");
						cb(null, {
							image:
								"data:image/png;base64," +
								qrcode
									.imageSync(code, {
										size: 10
									})
									.toString("base64"),
							code: code
						});
					});
				});

				const getUsers = file => {
					return new Promise((resolve, reject) => {
						let sqlite = modelsCreator(file);

						sqlite.User.findAll({ where: { media: { $or: [{ photoUploaded: true }, { videoUploaded: true }] } } }) //  where: { media: { "$or": [{ photoUploaded: true }, { videoUploaded: true }] } }
							.then(users => {
								resolve(users);
							})
							.catch(reject);
					});
				};

				socket.on("getBarCodeUsers", cb => {
					dirs(path.join(config.get().storage), async (err, files) => {
						console.log(err, files);
						// cb(files);
						let sqlites = files.filter(f => /.sqlite$/.test(f));
						let Users = [];
						for (let k in sqlites) {
							let ds = await getUsers(sqlites[k]);
							console.log(sqlites[k], ds);
							ds.forEach(d => {
								Users.push(d);
							});
						}
						cb(Users);
						// files.forEach(async file => {
						// 	if(/.sqlite$/.test(file)) {
						// 		Users = Users.concat(await getUsers(file));
						// 	}
						// })
					});
				});

				// User clicked send Email on QRcode page
				socket.on("sendEmail", (email, image, cb = () => {}) => {
					console.log(image.img);
					new mailer.Mailer()
						.sendMail({
							to: email.trim(),
							subject: "QRcode for IntegemCam",
							html: `You can use this QRcode to login IntegemCam!<br /><br /><img alt="Integem" src=${image.img}  />`,
							attachments: [
								{
									filename: "QRcode.png",
									content: qrcode.imageSync(image.code, {
										size: 10
									})
								}
							]
						})
						.then(() => {
							cb(null);
						})
						.catch(e => {
							cb(e);
						});
				});

				socket.on("getDevices", cb => {
					ario.getDevices(cb);
				});

				// User login manager page
				socket.on("configGet", cb => {
					logger.info(`configGet: getting current settings.`);
					let _config = config.get();
					// if (!_config.commandFolder || _config.commandFolder === "")
					// 	_config.commandFolder = path.join(require("os").homedir(), "Desktop/");
					cb(null, {
						config: _config,
						video: fs.readFileSync(path.join(process.cwd(), "libs/mailer/templates/video.txt"), "utf8"),
						photo: fs.readFileSync(path.join(process.cwd(), "libs/mailer/templates/photo.txt"), "utf8")
					});
				});

				// Receive modified config from browser
				socket.on("configSet", json => {
					logger.info(`configSet(${JSON.stringify(json.config, null, 4)})`);

					var oldPhotoOnline = config.get().online.photo,
						oldVideoOnline = config.get().online.video;

					config.update(json.config);

					/* if (
						(!oldPhotoOnline && config.get().online.photo) ||
						(!oldVideoOnline && config.get().online.video)
					) {
						processor.start();
					} */

					fs.writeFileSync(path.join(process.cwd(), "libs/mailer/templates/video.txt"), json.video);
					fs.writeFileSync(path.join(process.cwd(), "libs/mailer/templates/photo.txt"), json.photo);
					logger.info(`Config is saved!`);
				});

				// get QRcode users on manager page
				socket.on("usersGet", cb => {
					models.QRcode.findAll().then(qr => {
						let users =
							qr &&
							qr.map(item => {
								//暂时不生成qrcode 和 codeImage
								let eid = utils.encrypt(item.dataValues.id.toString(), "integem");
								item.dataValues.eid = eid;
								item.dataValues.QRimage =
									"data:image/png;base64," +
									qrcode
										.imageSync(eid, {
											size: 10
										})
										.toString("base64");
								return item.dataValues;
							});
						cb(null, users);
						console.log(JSON.stringify(users));
					});
				});

				socket.on("saveSelect", (Indexs, cb) => {
					var IndexsText = Indexs.toString();
					var postTime = Date.parse(new Date());

					if (!fs.existsSync(path.join(process.cwd(), "data"))) fs.mkdirSync(path.join(process.cwd(), "data"));
					if (!fs.existsSync(path.join(process.cwd(), "data/saveData")))
						fs.mkdirSync(path.join(process.cwd(), "data/saveData"));

					var filePath = path.join(process.cwd(), "data/saveData", postTime + ".csv"); //process.cwd() + "\\data\\saveData\\" + postTime + ".csv";

					var queryText = "select * from QRcodes where id in (" + IndexsText + ")";
					models.sequelize
						.query(queryText)
						.then(data => {
							csv
								.writeData(data[0], filePath)
								.then(() => {
									cb(null, postTime);
								})
								.catch(err => {
									throw err;
								});
						})
						.catch(err => {
							cb(err, null);
						});
				});

				socket.on("deleteSelectIds", (Indexs, cb) => {
					// Indexs = [3,7,8];
					Indexs = Indexs.toString();
					var queryText = "delete from QRcodes where id in (" + Indexs + ")";
					models.sequelize
						.query(queryText)
						.then(() => {
							cb(null, true);
						})
						.catch(err => {
							cb(err, null);
						});
				});

				socket.on("sendSelectIds", async (Indexs, cb) => {
					Indexs = Indexs.toString();
					var queryText = "select * from QRcodes where id in (" + Indexs + ")";
					models.sequelize
						.query(queryText)
						.then(data => {
							data[0].map(async (res, i, array) => {
								res.id = res["id"] || res["ID"] || res["Id"];
								res.name = res.name || res.Name || res["first name"] || res["First Name"];
								res.email = res["email"] || res["Email"];
								res.eid = utils.encrypt(res.id.toString(), "integem");

								new mailer.Mailer()
									.sendMail({
										to: res.email.trim(),
										subject: "QRcode for IntegemCam",
										html:
											"Hi " +
											res.name +
											"!<br /><br />You can use the attached QRcode to login IntegemCam!<br /><br />",
										attachments: [
											{
												filename: "QRcode.png",
												content: qrcode.imageSync(res.eid, {
													size: 10
												})
											}
										]
									})
									.then(() => {
										cb(null, res.name);
									})
									.catch(e => {
										throw res.name + " failed";
									});
							});
						})
						.catch(err => {
							cb(err, null);
						});
				});

				// delete user in manager page
				socket.on("deleteQRcode", (id, cb) => {
					models.QRcode.destroy({
						where: {
							id: id
						}
					});
					cb(null);
				});

				socket.on("getProps", cb => {
					models.QRcode.findOne()
						.then(user => {
							let Props = [];
							for (var i in user.dataValues) {
								if (i != "id") Props.push(i);
							}
							cb(null, Props);
						})
						.catch(err => {
							cb(err, null);
						});
				});

				socket.on("registUser", (userInfo, cb) => {
					models.QRcode.create(userInfo)
						.then(user => {
							cb(null, user.id);
						})
						.catch(err => {
							cb(err, null);
						});
				});

				socket.on("addFile", (filePath, cb) => {
					csv
						.getData(filePath)
						.then(data => {
							let Props = []; //file Props
							for (var i in data[0]) {
								if (i.toLocaleLowerCase() != "id") Props.push(i); // 不去空格 不去大小写
							}
							//判断与QRcode的数据库是否一样
							models.QRcode.findOne()
								.then(user => {
									let QRProps = []; //dataBase Props
									for (var i in user.dataValues) {
										if (i != "id") QRProps.push(i);
									}
									if (QRProps.sort().toString() == Props.sort().toString()) {
										models.QRcode.bulkCreate(data).then(DBData => {
											let allData =
												DBData &&
												DBData.map(item => {
													//暂时不生成qrcode 和 codeImage
													let eid = utils.encrypt(item.dataValues.id.toString(), "integem");
													item.dataValues.eid = eid;
													item.dataValues.QRimage =
														"data:image/png;base64," +
														qrcode
															.imageSync(eid, {
																size: 10
															})
															.toString("base64");
													return item.dataValues;
												});
											cb(null, allData);
											// cb(null, DBData);
										});
									} else {
										cb(-1, null); //-1表示两个csv的字段不同
									}
								})
								.catch(err => {
									cb(err, null); //findone出现error
								});
						})
						.catch(err => {
							cb(err, null); //getData occur error
						});
				});

				socket.on("log", err => {
					console.log(err);
				});

				socket.on("uploadFile", (filePath, cb) => {
					//until this line,get filePath successfully.
					csv
						.getData(filePath)
						.then(data => {
							let Props = [];
							for (var i in data[0]) {
								if (i.toLocaleLowerCase() != "id") Props.push(i); // 不去空格 不去大小写
							}

							let tempconfig = {};
							for (var i = 0; i < Props.length; i++) {
								tempconfig[Props[i]] = {
									type: models.Sequelize.STRING
									// allowNull: false
								}; //cannot be the null
							}

							models.QRcode.drop({
								force: true
							})
								.then(() => {
									models.QRcode = models.sequelize.define("QRcode", tempconfig, {
										timestamps: false //don't add timestamp attributes(updateAt,createAt)
									});
									models.QRcode.sync({
										force: true
									}).then(() => {
										Props.unshift("id");
										fs.writeFileSync(path.join(process.cwd(), "models/qrcode.json"), JSON.stringify(Props));

										models.QRcode.bulkCreate(data).then(DBData => {
											let allData =
												DBData &&
												DBData.map(item => {
													//暂时不生成qrcode 和 codeImage
													let eid = utils.encrypt(item.dataValues.id.toString(), "integem");
													item.dataValues.eid = eid;
													item.dataValues.QRimage =
														"data:image/png;base64," +
														qrcode
															.imageSync(eid, {
																size: 10
															})
															.toString("base64");
													return item.dataValues;
												});
											cb(null, allData);

											// cb(null, DBData); //发送所有数据库数据过去
										});
									});
								})
								.catch(err => {
									console.error(err);
									cb(err, null);
								});
						})
						.catch(err => {
							//getData occur error
							console.error(err);
							cb(err, null);
						});
				});

				socket.on("updateOne", (user, cb) => {
					models.QRcode.update(user, {
						where: {
							id: user.id
						}
					})
						.then(data => {
							cb(null, data);
						})
						.catch(err => {
							cb(err, null);
						});
				});
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

				// Run data processor
				socket.on("processData", cb => {
					if (processor.isProcessing()) {
						return cb("already processing");
					}
					processor.start();
					cb();
				});

				// Unsubscribe all event when client disconnect
				socket.on("disconnect", () => {
					// logger.info("Unsubscribe processor state for socket:", socket.id);
					processor.removeListener("state", procStateForward);
				});

				// download theme zip to theme
				socket.on("downloadZip", (url, id, cb) => {
					console.log(url);
					try {
						let _path_array = url.split(/\/|[\\]{1,2}/);
						let filename = _path_array.pop();
						let name = filename.split(".")[0];

						// console.log(config.get());
						const themePath = path.join(config.get().theme, name);
						const themeZipDir = path.join(config.get().theme);
						const themeZip = path.join(config.get().theme, filename);

						if (fs.existsSync(themeZip)) fs.unlinkSync(themeZip);

						// The options argument is optional so you can omit it
						download(url, themeZipDir, {
							progress: bar => {
								// console.log(`BAR => ${bar}`)
								socket.emit("progress", { percent: bar / 100 });
							},
							error: err => {
								// console.log(`ERR => ${err}`)
								cb(err, null);
							},
							end: file => {
								console.log(`done => ${file}`);
								socket.emit("progress", {
									percent: 1
								});

								let _config = {};
								let tmp = `${themePath}_tmp`;

								let zip = new AdmZip(themeZip);
								zip.extractAllTo(tmp, true);

								console.log("done!");

								if (!fs.existsSync(path.join(tmp, "config.yml"))) {
									let dirs = fs.readdirSync(tmp);
									fsext.moveSync(path.join(tmp, dirs[0]), path.join(themePath), { overwrite: true });
								} else {
									fsext.moveSync(path.join(tmp), path.join(themePath), { overwrite: true });
								}

								fsext.removeSync(tmp);

								if (fs.existsSync(path.join(themePath, "config.yml"))) {
									_config = YAML.load(fs.readFileSync(path.join(themePath, "config.yml")));
									_config.themeId = id;
									// config.hash = md5(fs.readFileSync(themePath));
									fs.writeFileSync(path.join(themePath, "config.yml"), YAML.dump(_config));
									// console.log(JSON.stringify(config));
								} else {
									_config.themeId = id;
									fs.writeFileSync(path.join(themePath, "config.yml"), YAML.dump(_config));
								}

								_config.location = themePath;
								cb(null, _config);
							}
						});

						// progress(request(url), {
						//         throttle: 10,                    // Throttle the progress event to 2000ms, defaults to 1000ms
						//         delay: 0,                       // Only start to emit after 1000ms delay, defaults to 0ms
						//         // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
						//     })
						//     .on('progress', function(state) {
						//         // The state is an object that looks like this:
						//         // {
						//         //     percent: 0.5,               // Overall percent (between 0 to 1)
						//         //     speed: 554732,              // The download speed in bytes/sec
						//         //     size: {
						//         //         total: 90044871,        // The total payload size in bytes
						//         //         transferred: 27610959   // The transferred payload size in bytes
						//         //     },
						//         //     time: {
						//         //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
						//         //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
						//         //     }
						//         // }
						//         console.log('progress', state);
						//         // cb(null, state);
						//         socket.emit('progress', state);
						//     })
						//     .on('error', err => {
						//         // Do something with err
						//         cb(err, null);
						//     })
						//     .on('end', () => {
						// 		setTimeout(() => {
						//
						// 			socket.emit('progress', {
						// 				percent: 1
						// 			});
						//
						// 			let _config = {};
						// 			let tmp = `${themePath}_tmp`;
						//
						// 			let zip = new AdmZip(themeZip);
						// 			zip.extractAllTo(tmp, true);
						//
						// 			console.log('done!');
						//
						// 			if (!fs.existsSync(path.join(tmp, "config.yml"))) {
						// 				let dirs = fs.readdirSync(tmp);
						// 				fsext.moveSync(path.join(tmp, dirs[0]), path.join(themePath), { overwrite: true })
						// 			} else {
						// 				fsext.moveSync(path.join(tmp), path.join(themePath), { overwrite: true })
						// 			}
						//
						// 			fsext.removeSync(tmp);
						//
						// 			if (fs.existsSync(path.join(themePath, "config.yml"))) {
						// 				_config = YAML.load(
						// 					fs.readFileSync(path.join(themePath, "config.yml"))
						// 				);
						// 				_config.themeId = id;
						// 				// config.hash = md5(fs.readFileSync(themePath));
						// 				fs.writeFileSync(
						// 					path.join(themePath, "config.yml"),
						// 					YAML.dump(_config)
						// 				);
						// 				// console.log(JSON.stringify(config));
						// 			} else {
						// 				_config.themeId = id;
						// 				fs.writeFileSync(
						// 					path.join(themePath, "config.yml"),
						// 					YAML.dump(_config)
						// 				);
						// 			}
						//
						// 			_config.location = themePath;
						// 			cb(null, _config);
						//
						// 		}, 2000);
						//     })
						//     .pipe(fs.createWriteStream(themeZip));
					} catch (e) {
						cb(e.message, "try");
					}
				});
			});
		})
		.catch(err => logger.error(err));
};
