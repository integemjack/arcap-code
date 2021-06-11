const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require("./config");
const logger = require("./logger");

const dataPath = config.get().storage;
const dbPath = path.join(process.cwd(), "data/processDB.sqlite");

const sequelize = new Sequelize(null, null, null, {
	dialect: "sqlite",
	storage: dbPath
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

function init() {
	!fs.existsSync(dbPath) ? CreateDB() : UpdateDB();
}

//深度遍历
function CreateDB() {
	logger.info("create db");
	Process.sync({
		force: true
	})
		.then(() => {
			// Table created

			var dateTimes = fs.readdirSync(dataPath);
			//过滤栓选出真正的dateTime 八位的文件夹
			dateTimes = dateTimes.filter(
				target => target.length == 8 && fs.lstatSync(path.join(config.get().storage, target)).isDirectory()
			);

			dateTimes.forEach(function(dateTime) {
				if (!fs.existsSync(path.join(dataPath, dateTime, "media"))) {
					logger.info(`${dateTime} folder don't have emails`);
					return;
				}

				var Emails = fs.readdirSync(path.join(dataPath, dateTime, "media"));

				/* Emails.forEach(Email => {
                Process.create({
                    dateTime: dateTime,
                    email: Email
                })
            }); */

				var objs = Emails.map(Email => {
					return {
						dateTime: dateTime,
						email: Email
					};
				});

				Process.bulkCreate(objs).then(() => {
					console.log(`${dateTime} folder added`);
				});
			});
		})
		.then(() => {
			logger.info("create over");
		});
}

function UpdateDB() {
	logger.info("Update db");
	sequelize.query("select distinct datetime from processes").then(data => {
		var db_dateTimes = data[0].map(target => target.dateTime);
		var folder_dateTimes = fs
			.readdirSync(dataPath)
			.filter(
				target => target.length == 8 && fs.lstatSync(path.join(config.get().storage, target)).isDirectory()
			);

		var compareRes = ArrayCompare(db_dateTimes, folder_dateTimes);
		var db_more = compareRes.more;
		var db_less = compareRes.less;

		if (db_more.length) {
			//数据库多出数据需要删除dateTime
			Process.destroy({
				where: {
					dateTime: {
						[Sequelize.Op.or]: db_more
					}
				}
			}).then(() => logger.info(`delete ${db_more.toString()} in db `));
		} else {
			console.log("No dateTime need delete to db");
		}

		if (db_less.length) {
			//数据库比文件夹夹少数据需要添加

			db_less.forEach(dateTime => {
				if (!fs.existsSync(path.join(dataPath, dateTime, "media"))) {
					logger.info(`${dateTime} folder don't have emails`);
					return;
				}

				var Emails = fs.readdirSync(path.join(dataPath, dateTime, "media"));
				Emails.forEach(Email => {
					Process.create({
						dateTime: dateTime,
						email: Email
					});
				});
				logger.info(`${dateTime} folder added`);
			});
		} else {
			console.log("No dateTime need add in db");
		}
	});
}

function ArrayCompare(A1, A2) {
	var tempA1 = A1.concat();
	var tempA2 = A2.concat();
	for (var i = 0; i < tempA1.length; i++) {
		//当两个完全相同时 会出现A[0]进入执行块 此时A已经没有元素
		var isExist = existInArray(tempA1[i], tempA2);
		if (isExist) {
			tempA1.splice(i, 1);
			tempA2.splice(isExist - 1, 1);
			i--; //因为需要抵消i++
		}
	}
	return {
		more: tempA1,
		less: tempA2
	};
}

//返回index（从1开始） 在A中寻找element是否存在
function existInArray(element, A) {
	if (element == undefined) {
		//处理A[0]无效值情况
		return false;
	}

	for (var i = 0; i < A.length; i++) {
		if (A[i] == element) {
			return i + 1; //因为0是false
		}
	}

	return false;
}

exports = module.exports;
module.exports.init = init;
module.exports.update = UpdateDB;
module.exports.create = CreateDB;
module.exports.updateForce = updateForce;
module.exports.getTime = getToday; //在index.js中的引用位置在一块
//还有强制刷新的update 一个dateTime里面的所有email

//dateTimes:["20180607","20180605"]
function updateForce(dateTimes) {
	//先删除所有数据库dateTime的数据 再把dateTime文件夹中关系加上去
	dateTimes.forEach(dateTime => {
		Process.destroy({
			where: {
				dateTime: dateTime
			}
		}).then(() => {
			//if floder don't exist
			if (!fs.existsSync(path.join(dataPath, dateTime, "media"))) {
				return;
			}

			let Emails = fs.readdirSync(path.join(dataPath, dateTime, "media"));

			var objs = Emails.map(Email => {
				return {
					dateTime: dateTime,
					email: Email
				};
			});

			Process.bulkCreate(objs).then(() => {
				console.log(`${dateTime} folder added`);
			});
		});
	});
}

function getToday(time = new Date()) {
	var year = time.getFullYear();
	var month = time.getMonth() + 1 < 10 ? "0" + (time.getMonth() + 1) : time.getMonth() + 1;
	var date = time.getDate() < 10 ? "0" + time.getDate() : time.getDate();
	return "" + year + month + date;
}
