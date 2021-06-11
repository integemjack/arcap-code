"use strict";
const fs = require("fs");
const path = require("path");
const express = require("express");
const querystring = require("querystring");
const config = require("../libs/config").get();
const async = require("async");
const Sequelize = require("sequelize");
const { updateThemePath } = require("../libs/theme");
const multiparty = require("multiparty");
const util = require("util");
const fetch = require("axios");

const router = express.Router();

const modelsCreator = require("../models/index");

const models = modelsCreator("./data/db.sqlite");
const { execSync } = require("child_process");

models.sequelize.sync();

router.get("/", (req, res, next) => {
	res.render("login", {
		config: config
	});
});

router.get("/theme/:id", (req, res, next) => {
	models.Themes.findById(req.params.id)
		.then(theme => {
			res.send({
				success: true,
				result: theme
			});
		})
		.catch(e => {
			res.status(500).send({
				success: false,
				result: e
			});
		});
});

router.post("/theme", (req, res, next) => {
	let theme = req.body.theme;
	updateThemePath(theme.location);
	models.Themes.find({
		where: {
			$or: [
				{
					location: theme.location
				},
				{
					id: theme.id
				}
			]
		}
	})
		.then(existTheme => {
			if (existTheme) {
				return models.Themes.update(theme, {
					where: {
						id: theme.id
					}
				}).then(result => {
					res.send({
						success: true,
						result: result
					});
				});
				// res.sendStatus(409);
			} else {
				return models.Themes.create(theme).then(result => {
					res.send({
						success: true,
						result: result
					});
				});
			}
		})
		.catch(e => {
			res.status(500).send({
				success: false,
				result: e
			});
		});
});

router.post("/theme/edit", (req, res, next) => {
	let theme = req.body.theme;
	updateThemePath(theme.location);
	models.Themes.find({
		where: {
			location: theme.location
		}
	})
		.then(existTheme => {
			if (existTheme && existTheme.id !== theme.id) {
				res.sendStatus(409);
			} else {
				return models.Themes.update(theme, {
					where: {
						id: theme.id
					}
				}).then(result => {
					res.send({
						success: true,
						result: result
					});
				});
			}
		})
		.catch(e => {
			res.status(500).send({
				success: false,
				result: e
			});
		});
});

router.post("/theme/sort", (req, res, next) => {
	let themes = req.body.themes;
	models.Themes.update(
		{
			sort: 0
		},
		{
			where: {
				sort: {
					[Sequelize.Op.ne]: 0
				}
			}
		}
	)
		.then(result => {
			async.forEachOf(
				themes,
				function(theme, key, callback) {
					models.Themes.update(
						{
							sort: theme.sort
						},
						{
							where: {
								id: theme.id
							}
						}
					)
						.then(result => {
							callback(null, result);
						})
						.catch(e => {
							callback(e, null);
						});
				},
				(err, result) => {
					if (err) {
						res.status(500).send({
							success: false,
							result: err
						});
					} else {
						res.send({
							success: true,
							result: result
						});
					}
				}
			);
		})
		.catch(e => {
			res.status(500).send({
				success: false,
				result: e
			});
		});
});

router.post("/themes", (req, res, next) => {
	models.Themes.findAll({
		order: [["sort", "DESC"]]
	})
		.then(themes => {
			// console.log('---------------', themes);
			let _themes = themes.map(theme => {
				let _theme = {};
				for (let k in theme.dataValues) {
					console.log(k, theme.dataValues[k]);
					if (k === "tag") {
						_theme[k] = JSON.parse(JSON.stringify(theme.dataValues[k]).toLocaleLowerCase());
					} else {
						_theme[k] = theme.dataValues[k];
					}
				}
				return _theme;
			});
			// console.log('+++++++++++++++++++', _themes);
			res.send({
				success: true,
				result: _themes
			});
		})
		.catch(e => {
			res.status(500).send({
				success: false,
				result: e
			});
		});
});

router.post("/tags", (req, res, next) => {
	models.Tags.findAll()
		.then(tags => {
			let _tags = tags.map(tag => {
				let _tag = {};
				for (let k in tag.dataValues) {
					// console.log(k);
					if (k === "value") {
						_tag[k] = tag.dataValues[k].toLocaleLowerCase();
					} else {
						_tag[k] = tag.dataValues[k];
					}
				}
				return _tag;
			});
			res.send({
				success: true,
				result: unique(_tags)
			});
		})
		.catch(e => {
			res.status(500).send({
				success: false,
				result: e
			});
		});
});

router.post("/tags/insert", (req, res, next) => {
	let tag = req.body.tag;
	models.Tags.create({
		value: tag.toLowerCase()
	})
		.then(result => {
			res.send({
				success: true,
				result: result
			});
		})
		.catch(e => {
			res.status(500).send({
				success: false,
				result: e
			});
		});
});

router.post("/tags/update", (req, res, next) => {
	let tag = req.body.tag;
	delete tag.id;
	console.log(tag);
	models.Tags.update(tag, {
		where: {
			value: tag.value
		}
	})
		.then(result => {
			res.send({
				success: true,
				result: result
			});
		})
		.catch(e => {
			res.status(500).send({
				success: false,
				result: e
			});
		});
});

router.post("/tags/del", (req, res, next) => {
	let id = req.body.id;
	models.Tags.destroy({
		where: {
			id
		}
	})
		.then(result => {
			res.send({
				success: true,
				result: result
			});
		})
		.catch(e => {
			res.status(500).send({
				success: false,
				result: e
			});
		});
});

router.get("/image", (req, res, next) => {
	let url = req.query.url;
	if (fs.existsSync(url)) {
		let image = fs.readFileSync(url, "binary");
		res.end(image, "binary");
	} else {
		res.status(404).send("not found!!!");
	}
});

router.post("/themes/del", (req, res, next) => {
	models.Themes.destroy({
		where: {
			id: req.body.id
		}
	})
		.then(result => {
			res.send({
				success: true,
				result: result
			});
		})
		.catch(e => {
			res.status(500).send({
				success: false,
				result: e
			});
		});
});

router.post("/theme/open", (req, res, next) => {
	let location = req.body.location;
	try {
		let file = path.join(location, "project.ic");
		if (!fs.existsSync(file))
			return res.status(500).send({
				success: false,
				result: new Error(`File "${file}" is not exists!`)
			});
		let command = `start ${file}`;
		console.log(command);
		let result = execSync(command);
		res.send({
			success: true,
			result: result
		});
	} catch (e) {
		res.status(500).send({
			success: false,
			result: e
		});
	}
});

router.post("/uploadFile", (req, res, next) => {
	var form = new multiparty.Form();
	form.encoding = "utf-8";
	form.uploadDir = "./";
	form.maxFilesSize = 1024 * 1024 * 1024;

	form.parse(req, function(err, fields, files) {
		if (err) {
			console.log("parse error:" + err);
		} else {
			var inputFile = files.inputFile[0];
			console.log("upload and parse file :" + inputFile.originalFilename + " success");
			var uploadedPath = inputFile.path;
			if (!fs.existsSync(path.join(process.cwd(), "data"))) fs.mkdirSync(path.join(process.cwd(), "data"));
			if (!fs.existsSync(path.join(process.cwd(), "data/userData")))
				fs.mkdirSync(path.join(process.cwd(), "data/userData"));
			var dstPath = path.join(process.cwd(), "data/userData", inputFile.originalFilename);

			fs.rename(uploadedPath, dstPath, function(err) {
				if (err) {
					console.log("rename error:" + err);
				} else {
					console.log("" + inputFile.originalFilename + "change location to ->" + dstPath + " success!");
					res.send(dstPath);
				}
			});
		}
	});
});

router.get("/downloadCsv", function(req, res, next) {
	// /downloadCsv?id = postTime
	var fileName = process.cwd() + "\\data\\saveData\\" + req.query.id + ".csv";

	fs.exists(fileName, isExist => {
		if (isExist) {
			res.download(fileName, "User.csv");
		} else res.send("No this file");
	});
});

router.post("/user/signin", async function(req, res) {
	try {
		const user = req.body;
		const response = await fetch({
			url: `${config.creatorApi}?do=login`,
			method: "POST",
			headers: {
				"content-type": "application/x-www-form-urlencoded"
			},
			data: querystring.stringify(user)
		});
		res.status(response.status).json(response.data);
	} catch (err) {
		console.log(err);
		res.json({
			success: false
		});
	}
});

router.post("/theme/addfromlink", async (req, res) => {
	try {
		const body = req.body;
		const response = await fetch({
			url: `${config.creatorApi}?do=getZip`,
			method: "POST",
			headers: {
				"content-type": "application/x-www-form-urlencoded"
			},
			data: querystring.stringify(body)
		});
		if (response.status === 200) {
			res.send({
				success: true,
				data: response.data.filter(zip => /\.zip$/.test(zip.guid))
			});
		} else {
			res.json({
				success: false
			});
		}
	} catch (err) {
		res.json({
			success: false
		});
	}
});

module.exports = router;

function unique(list) {
	var arr = [];
	list.forEach(one => {
		if (!inArray(one, arr)) arr.push(one);
	});
	return arr;
}

function inArray(v, a) {
	let _in = false;
	a.forEach(o => {
		if (o.value === v.value) _in = true;
	});
	return _in;
}
