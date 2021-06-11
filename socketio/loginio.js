"use strict";
const fs = require("fs");
const path = require("path");
const express = require("express");
const logger = require("../libs/logger");
const config = require("../libs/config");
const mailer = require("../libs/mailer");
const modelsCreator = require("../models");
const { decrypt } = require("../libs/utils");
const csv = require("../libs/csvOperation");
const Sequelize = require("sequelize");
const ProcessDB = require("../libs/processDb");

const sequelize = new Sequelize(null, null, null, {
	dialect: "sqlite",
	storage: path.join(process.cwd(), "/data/processDB.sqlite")
});

const Process = sequelize.define(
	"Process",
	{
		dateTime: {
			type: Sequelize.STRING(8)
		},
		email: {
			type: Sequelize.STRING(64)
		}
	},
	{
		timestamps: false
	}
);

module.exports = function(server, ario, loginapp) {
	let io = require("socket.io")(server);

	// 设置今日拍摄的照片和视频为静态文件
	let mainDir = config.get().storage;
	let _mainDir = new RegExp("^[.]+").test(mainDir) ? path.join(process.cwd(), mainDir) : mainDir;
	loginapp.use(express.static(_mainDir));

	setInterval(() => {
		if (mainDir !== config.get().storage) {
			mainDir = config.get().storage;
			_mainDir = new RegExp("^[.]+").test(mainDir) ? path.join(process.cwd(), mainDir) : mainDir;
			loginapp.use(express.static(_mainDir));
		}
	}, 1000);

	io.of("/login").on("connection", socket => {
		// Dealing with login & settings UI events
		require("./common/loginio")(socket, ario, io);

		socket.on("emailFile", (data, cb) => {
			csv.getDataForEmail(data.filePath)
				.then(infoArray => {
					if (infoArray.length > 150) {
						throw "the number over 150";
					}
					var emailField = fs.readFileSync(
						path.join(process.cwd(), "libs/mailer/templates/field.txt"),
						"utf8"
					);

					let reg = new RegExp("\\{(.+?)\\}", "g"); //match {name} ...
					infoArray.forEach(info => {
						info.email = info["email"] || info["Email"];
						var infoField = emailField.replace(reg, function(a) {
							return info[a.slice(1, -1)] || "";
						});
						new mailer.Mailer()
							.sendMail({
								to: info.email.trim(),
								subject: "Your link for IntegemCam",
								text: infoField
							})
							.then(() => {
								cb(null, "success");
							})
							.catch(err => {
								throw err;
							});
					});
				})
				.catch(error => {
					cb(error, null);
				});
		});

		socket.on("getByQRCode", (code, cb) => {
			logger.info(`getByQRCode: ${code}`);
			let id = decrypt(code, "integem");
			logger.info(`decrypted: ${id}`);
			let models = modelsCreator("./data/db.sqlite");
			models.QRcode.findById(id)
				.then(user => {
					user = user.get({
						plain: true
					});
					logger.info(user);
					cb(null, user);
				})
				.catch(err => {
					logger.error(err.toString());
					logger.error("No this id matched");
					cb(err.toString());
				});
		});

		socket.on("fieldGet", cb => {
			logger.info(`Get: getting current Email field words.`);
			cb(null, fs.readFileSync(path.join(process.cwd(), "libs/mailer/templates/field.txt"), "utf8"));
		});

		socket.on("fieldSet", emailField => {
			logger.info(`Email field set ${emailField}`);

			fs.writeFileSync(path.join(process.cwd(), "libs/mailer/templates/field.txt"), emailField);
			logger.info("Email field is saved");
		});

		socket.on("getDateTime", (data, cb) => {
			if (!data) {
				try {
					var dateTimes = fs.readdirSync(config.get().storage);
					dateTimes = dateTimes.filter(
						target =>
							target.length == 8 &&
							fs.lstatSync(path.join(config.get().storage, `/${target}`)).isDirectory()
					);
					cb(null, dateTimes);
				} catch (err) {
					cb(err, null);
				}
			} else {
			}
		});

		//从dateTime文件夹的数据库中过滤出有真实photo或video的user
		socket.on("filterUser", (dateTime, cb) => {
			logger.info(`select ${dateTime} user emails`);
			let emails = fs.readdirSync(path.join(config.get().storage, `/${dateTime}/media`));
			cb(null, emails);
			logger.info(`get emails success:${emails.toString()}`);

			/* var dbPath =  fs.readdirSync(config.get().storage+"\\"+dateTime)
			.map(name => path.join(config.get().storage+"\\"+dateTime, name))
			.filter(target => target.endsWith(".sqlite") && fs.lstatSync(target).isFile());

			if(dbPath.length!=1){
				cb("database error!",null);
				return;
			}
			dbPath = dbPath[0];
			cb(null,dbPath); */
			// cb(null,dbPath);
		});

		//访问页面时，得到数据库中所有user 再看今天的文件夹是否有不存在的 有就加上去
		socket.on("getEmails", cb => {
			let today = getToday();
			let todayEmails = [];
			if (fs.existsSync(path.join(config.get().storage, `/${today}/media`)))
				todayEmails = fs.readdirSync(path.join(config.get().storage, `/${today}/media`));

			let Emails = [];
			sequelize
				.query("select distinct email from Processes")
				.then(data => {
					Emails = data[0].map(target => target.email);
					for (let i = 0; i < todayEmails.length; i++) {
						if (!findInArray(todayEmails[i], Emails)) {
							Emails.push(todayEmails[i]);
						}
					}
					cb(null, Emails);
				})
				.catch(e => {
					cb(e, null);
				});
		});

		socket.on("getAll", cb => {
			sequelize
				.query("select * from Processes")
				.then(data => {
					cb(null, data[0]);
				})
				.catch(e => {
					cb(e, null);
				});
		});

		//获取所有user信息
		socket.on("getUsers", async cb => {
			let dirs = fs.readdirSync(path.join(config.get().storage));
			let dbs = [];
			dirs.forEach(dir => {
				fs.readdirSync(path.join(config.get().storage, dir)).forEach(file => {
					let stat = fs.statSync(path.join(config.get().storage, dir, file));
					if (!stat.isDirectory()) dbs.push(path.join(config.get().storage, dir, file));
				});
			});
			console.log(dbs);

			let users = [];
			for (let ii = 0; ii < dbs.length; ii++) {
				// dbs.forEach(async db => {
				let db = dbs[ii];
				let models = modelsCreator(db);
				let data = await models.User.findAll().map(v => v.dataValues);
				console.log(data);
				for (let i = 0; i < data.length; i++) {
					if (!inArray(users, data[i]))
						users.push({
							name: data[i].name,
							email: data[i].email
						});
				}
			}

			console.log(`users:`, users);
			cb(null, users);
		});

		//user变化时 得到对应的dateTimes
		socket.on("getDateTimesforEmail", (email, cb) => {
			let today = getToday();

			//读取数据库
			Process.findAll({
				where: {
					email: email
				}
			})
				.then(objs => {
					var dateTimes = objs.map(obj => obj.dateTime);

					if (findInArray(today, dateTimes)) {
					} else {
						//如果不存在查找今天的文件夹是否存在email
						if (fs.existsSync(config.get().storage + `\\${today}\\media\\${email}`)) dateTimes.push(today);
					}

					cb(null, dateTimes);
				})
				.catch(err => {
					cb(err, null);
				});
		});

		socket.on("forceRefresh", (dateTime, cb) => {
			ProcessDB.updateForce([dateTime]);
			cb();
		});
	});
};

function getToday(time = new Date()) {
	var year = time.getFullYear();
	var month = time.getMonth() + 1 < 10 ? "0" + (time.getMonth() + 1) : time.getMonth() + 1;
	var date = time.getDate() < 10 ? "0" + time.getDate() : time.getDate();
	return "" + year + month + date;
}

function findInArray(e, a) {
	for (var i = 0; i < a.length; i++) {
		if (a[i] == e) return true;
	}
	return false;
}

function inArray(arr, val) {
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].name === val.name && arr[i].email === val.email) return true;
	}
	return false;
}
