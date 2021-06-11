const async = require("async");
const request = require("request");
const random = require("../libs/random");

const { getTheme } = require("../libs/theme");

const emit = content => {
	return new Promise(function(resolve, reject) {
		let time = Math.floor(Math.random() * 9000) + 1000;
		setTimeout(function() {
			content.data.time = new Date().getTime();

			request(
				{
					uri: "https://localhost:8443/ARprojectName",
					method: "GET",
					rejectUnauthorized: false,
					qs: content.data
				},
				err => {
					if (err) reject(err);
					else resolve(time);
				}
			);
		}, time);
	});
};

if (!process.argv[2] || (process.argv[2] && process.argv[2] === "all")) {
	let themeIni = getTheme();
	async.eachOfSeries(
		themeIni,
		(themes, p, cb) => {
			async.eachOfSeries(
				themes,
				(theme, i, cb) => {
					async.eachOfSeries(
						theme,
						(element, i1, cb) => {
							if (i1 !== "stage") {
								return cb();
							}
							let data = {
								project: "soccer",
								stagetitle: `${i}.${i1}`
							};
							for(let i = 0; i < random(1, 10); i++) {
								data[`G${random(1, 10)}`] = random(1, 30);
							}
							if(random(0, 10) > 5) {
								data["dgloop"] = random(1, 5);
							} else {
								data["dgloopclear"] = 1;
							}
							if(random(0, 10) > 5) {
								data["MultiPerson"] = random(1, 5);
							} else {
								data["MultiPersonClear"] = 1;
							}
							emit({
								command: "stage",
								data
							})
								.then(res => {
									console.log("use", p, i, i1, res, "ms.");
									cb();
								})
								.catch(cb);
						},
						cb
					);
				},
				cb
			);
		},
		() => {
			process.exit();
		}
	);
} else if (process.argv[2] && process.argv[3]) {
	socket.emit(
		"stage",
		{
			project: process.argv[3],
			stagetitle: process.argv[2],
			time: new Date().getTime()
		},
		done => {
			process.exit();
		}
	);
}

process.on("message", function(m) {
	console.log("message", m);
	// if (m === "stop") process.exit();
	switch (m) {
		case "stop":
			process.exit();
			break;

		case "next":
			break;

		default:
			break;
	}
});
