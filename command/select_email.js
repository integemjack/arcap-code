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

/*
function getDatabases(source) {
	return fs
		.readdirSync(source)
		.map(name => path.join(source, name))
		.filter(target => target.endsWith(".sqlite") && fs.lstatSync(target).isFile());
}
 */

function main() {
	let sendInfos = []; //[{name:"",email:""},{},{}] to avoid repeatly send

	let infoText = scanf("%S");
	let info = {};

	info.dateTime = infoText.split("&&")[0]; //get the dateTime floder
	info.email = infoText.split("&&")[1].split(",");

	//get db for one day
	let dbPaths = fs
		.readdirSync(path.join(config.storage, info.dateTime))
		.map(name => path.join(config.storage, info.dateTime, name))
		.filter(target => target.endsWith(".sqlite") && fs.lstatSync(target).isFile());

	// console.log(dbPaths);

	if (dbPaths.length === 0) {
		logger.error(`No db exist in ${dateTime} `);
		return;
	}

	dbPaths.forEach(dbPath => {
		let models = modelsCreator(dbPath);

		models.User.findAll({
			where: {
				send: false,
				email: {
					[models.Sequelize.Op.or]: info.email
				}
			}
		})
			.then(users => {
				users.forEach(user => {
					if (processedUUIDs.has(user.uuid)) {
						return logger.info(`id-${user.id}: UUID ${user.uuid} has already been processed.`);
					}
					let existData = user.media.videos ? user.media.videos : user.media.photos;
					let sendInfo = {
						email: user.email,
						name: user.name,
						type: user.media.type
					};

					let isSend = !IsExist(sendInfo, sendInfos); //if exist don't send else send
					if (isSend && existData.length) {
						sendInfos.push(sendInfo);
						logger.info(`id-${user.id} sendInfo:${JSON.stringify(sendInfo)}`);
					}
					if (user.email && user.email.trim() !== "") {
						dataproc
							.procDataAndSendDistinctEmail(user, path.join(config.storage, info.dateTime), isSend)
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
}

main();

function IsExist(info, infos) {
	for (let i = 0; i < infos.length; i++) {
		if (info.email == infos[i].email && info.type == infos[i].type && info.name == infos[i].name) {
			return true;
		}
	}
	return false;
}
