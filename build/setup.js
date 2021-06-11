const path = require("path");
const co = require("co");
const util = require("util");
const { execSync } = require("child_process");
const hacker = require("@erhhung/node-resource-hacker");

co(function*() {
	process.stdout.write("Set arcap.exe icon...");
	let app = path.join(__dirname, "out/arcap.exe");
	let ico = path.join(__dirname, "Iplayer.ico");
	// Be careful! Iplayer.ico must have the same size to arcap.exe's existing icon group, or the exe will be corrupted.
	// yield reshack(`-addoverwrite ${app}, ${app}, ${ico}, ICONGROUP, 1, 1033`);
	// yield hacker({
	// 	action:   'addoverwrite', // required
	// 	open:     app,  // required
	// 	save:     app,  // optional (default: .open)
	// 	resource: ico,  // optional
	// 	mask: {                   // optional
	// 		type: 'ICONGROUP',
	// 		name: '1',              // optional
	// 		lang: '',               // optional
	// 	},
	// });
	process.stdout.write("done.\n");

	process.stdout.write("Building Setup.exe...");
	execSync('"./build/NSIS/makensis.exe" ./build/setup.nsi');
	process.stdout.write("done.\n");
});
