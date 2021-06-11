const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const mkdirp = require("mkdirp");
const moment = require("moment");
const scanf = require("scanf");

const dataproc = require("../libs/dataproc");
const logger = require("../libs/logger");
const modelsCreator = require("../models");
const config = require("../libs/config").get();
const { toAbsolute } = require("../libs/utils");

let processedDataFile = path.join(process.cwd(), "command/db.txt");
let processedUUIDs = new Set();

String.prototype.trim = function() {
	return this.replace(/(^\s*)|(\s*$)/g, "");
};

function rememberProcessedItem(uuid) {
	console.warn(`Remember processed item: ${uuid}`);
	processedUUIDs.add(uuid);
	fs.appendFileSync(processedDataFile, `${uuid}\n`);
}

function loadProcessedItems() {
	try {
		let content = fs.readFileSync(processedDataFile, "utf8");
		processedUUIDs = new Set(content.split("\n"));
	} catch (err) {}
}

function getSubfolders(source) {
	return fs
		.readdirSync(source)
		.map(name => path.join(source, name))
		.filter(target => fs.lstatSync(target).isDirectory());
}

function main() {
	let sendInfos = []; //[{name:"",email:""},{},{}] to avoid repeatly send

	let infoText = scanf("%S");
	let info = {};

	info.email = infoText.split("&&")[0]; //get only email
	info.dateTimes = infoText.split("&&")[1].split(","); //get the dateTime floder

	info.dateTimes.forEach(dateTime => {
		//对每个文件夹下的db进行操作

		let dbPaths = fs
			.readdirSync(path.join(config.storage, dateTime))
			.map(name => path.join(config.storage, dateTime, name))
			.filter(target => target.endsWith(".sqlite") && fs.lstatSync(target).isFile());

		if (dbPaths.length === 0) {
			logger.error(`No db exist in ${dateTime} `);
			return;
		}

		// dbPath = dbPath[0]; //avoid two or more db
		dbPaths.forEach(dbPath => {
			let models = modelsCreator(dbPath);
			models.User.findAll({
				where: {
					send: false,
					email: info.email
				}
			})
				.then(users => {
					users.forEach(user => {
						//为db中的一行数据
						if (processedUUIDs.has(user.uuid)) {
							return logger.info(`id-${user.id}: UUID ${user.uuid} has already been processed.`);
						}

						// let existData = user.media.videos || user.media.photos; //是个数组 判断是否有值
						let existData = user.media.videos ? user.media.videos : user.media.photos;
						let sendInfo = {
							type: user.media.type,
							name: user.name
						};
						//还没有发送过 并且photos或者videos中有数据 进行发送email
						let isSend = !IsExist(sendInfo, sendInfos); //if exist don't send else send
						if (isSend && existData.length) {
							//如果是要发送的并且有数据 那么放入数组中 用以之后出现再比较
							sendInfos.push(sendInfo);
							logger.info(`id-${user.id} sendInfo:${JSON.stringify(sendInfo)}`);
						}
						// logger.info(`id-${user.id} type-${user.media.type} isSend :${isSend}  flag:${existData.length==true}`);

						if (user.email && user.email.trim() !== "") {
							dataproc
								.procDataAndSendDistinctEmail(user, path.join(config.storage, dateTime), isSend)
								.then(success => {
									if (success) {
										rememberProcessedItem(user.uuid);
									}
								});
						}
					});
				})
				.catch(err => logger.error(err));
		});
	});
}

main();

function IsExist(info, infos) {
	for (let i = 0; i < infos.length; i++) {
		if (info.type == infos[i].type && info.name == infos[i].name) {
			return true;
		}
	}
	return false;
}
