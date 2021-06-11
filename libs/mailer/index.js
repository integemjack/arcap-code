"use strict";

const fs = require("fs");
const path = require("path");
const async = require("async");
const nodemailer = require("nodemailer");

const logger = require("../logger");
const config = require("../config").get();

const CONCURRENCY = 1;

function Mailer() {
	this.mailingQueue = async.queue((task, cb) => {
		console.log(`Wait 3 seconds to sending email to ${task.mailOptions.to}...`);
		setTimeout(() => {
			let mailConfig = config.email.email;

			let transporter = nodemailer.createTransport({
				host: mailConfig.service,
				port: mailConfig.port,
				secureConnection: mailConfig.secureConnection,
				auth: {
					user: mailConfig.username,
					pass: mailConfig.password
				}
			});

			transporter.sendMail(task.mailOptions, (error, info) => {
				if (error) {
					logger.error(`Send email to ${task.mailOptions.to} is failed: ${error}`);

					if (task.retry > 0) {
						task.retry--;
						// Put the task back to the end of the queue for retry later
						this.mailingQueue.push(task);
					} else {
						// Won't retry anymore, report error
						task.ondone(error);
					}
				} else {
					logger.info(`Send email to ${task.mailOptions.to} successfully!`);
					task.ondone();
				}

				cb();
			});
		}, 3000);
	}, CONCURRENCY);
}

Mailer.prototype.sendMail = function(mailOptions) {
	return new Promise((resolve, reject) => {
		let mailConfig = config.email.email;
		mailOptions.from = mailOptions.from || mailConfig.username;
		mailOptions.replyTo = mailOptions.replyTo || mailConfig.replyTo;
		mailOptions.inReplyTo = mailOptions.inReplyTo || mailConfig.replyTo;

		this.mailingQueue.push({
			mailOptions: mailOptions,
			retry: mailConfig.restart || 0,
			ondone: err => {
				if (err) reject(err);
				else resolve();
			}
		});
	});
};

Mailer.prototype.createMail = function(user, mediaFolder) {
	if (!user.email) {
		logger.warn(`Email address is not found: ${user.id}!`);
		return null;
	}

	let mailOptions = {
		to: user.email,
		attachments: []
	};
	let templateFolder = path.join(process.cwd(), "libs/mailer/templates");

	let content = "";
	if (user.media.type === "photo") {
		// read photo mail template
		content = fs.readFileSync(path.join(templateFolder, "photo.txt"), "utf8");
		let i = 0;
		user.media.photos.forEach(file => {
			file = path.join(mediaFolder, file);
			if (!fs.existsSync(file)) {
				return logger.error(`Photo ${file} not exists to send email!`);
			}
			// We don't send photo as attachement anymore, will send token URL instead.
			//
			// mailOptions.attachments.push({
			//     filename: `IntegemCam_take_photo${i}.jpg`,
			//     path: file,
			//     cid: `image${i}`
			// });
			i++;
		});

		if (i === 0) {
			logger.error(`Photos not found: ${user.id}!`);
			return null;
		}
	} else {
		if (user.media.videos.map(v => v.link).filter(Boolean).length === 0) {
			logger.error(`Video link not found: ${user.id}!`);
			return null;
		}

		// read video mail template
		content = fs.readFileSync(path.join(templateFolder, "video.txt"), "utf8");
	}

	// render template with properties
	let data = {
		name: user.name,
		token: user.token
	};
	for (let v in data) {
		console.log(v, " -> ", data[v]);
		content = content.replace(new RegExp("{" + v + "}", "g"), data[v]);
	}

	content = content.replace(/\r\n/g, "\n");
	let contentArray = content.split("\n");
	mailOptions.subject = contentArray[0];
	contentArray.splice(0, 1);
	while (contentArray[0] === "") {
		contentArray.splice(0, 1);
	}

	mailOptions.html = contentArray.join("<br />");

	return mailOptions;
};

module.exports.Mailer = Mailer;
