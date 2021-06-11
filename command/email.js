const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const mkdirp = require("mkdirp");
const moment = require("moment");

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

function getDatabases(source) {
	return fs
		.readdirSync(source)
		.map(name => path.join(source, name))
		.filter(target => target.endsWith(".sqlite") && fs.lstatSync(target).isFile());
}

function main() {
	loadProcessedItems();

	getSubfolders(toAbsolute(config.storage)).forEach(storage => {
		console.log(storage);

		mkdirp.sync(path.join(storage, "media"));

		getDatabases(storage).forEach(db => {
			console.log(db);

			let models = modelsCreator(db);
			const { or, and, gt, lt } = models.Sequelize.Op;

			models.User.findAll({ where: { send: false } })
				.then(users => {
					users.forEach(user => {
						if (processedUUIDs.has(user.uuid)) {
							return logger.info(`id-${user.id}: UUID ${user.uuid} has already been processed.`);
						}

						if (user.email && user.email.trim() !== "") {
							dataproc.procDataAndSendEmail(user, storage).then(success => {
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
