const fs = require("fs");
const path = require("path");
const execSync = require("child_process").execSync;
const execFileSync = require("child_process").execFileSync;
const spawn = require("child_process").spawn;

const logger = require("./logger");

const newLineRegex = /\r?\n/;
function darwin() {
	const suffixes = ["/Contents/MacOS/Google Chrome Canary", "/Contents/MacOS/Google Chrome"];
	const LSREGISTER =
		"/System/Library/Frameworks/CoreServices.framework" +
		"/Versions/A/Frameworks/LaunchServices.framework" +
		"/Versions/A/Support/lsregister";
	const installations = [];
	const customChromePath = resolveChromePath();
	if (customChromePath) {
		installations.push(customChromePath);
	}
	execSync(`${LSREGISTER} -dump` + " | grep -i 'google chrome\\( canary\\)\\?.app$'" + " | awk '{$1=\"\"; print $0}'")
		.toString()
		.split(newLineRegex)
		.forEach(inst => {
			suffixes.forEach(suffix => {
				const execPath = path.join(inst.trim(), suffix);
				if (canAccess(execPath)) {
					installations.push(execPath);
				}
			});
		});
	// Retains one per line to maintain readability.
	// clang-format off
	const priorities = [
		{ regex: new RegExp(`^${process.env.HOME}/Applications/.*Chrome.app`), weight: 50 },
		{ regex: new RegExp(`^${process.env.HOME}/Applications/.*Chrome Canary.app`), weight: 51 },
		{ regex: /^\/Applications\/.*Chrome.app/, weight: 100 },
		{ regex: /^\/Applications\/.*Chrome Canary.app/, weight: 101 },
		{ regex: /^\/Volumes\/.*Chrome.app/, weight: -2 },
		{ regex: /^\/Volumes\/.*Chrome Canary.app/, weight: -1 }
	];
	if (process.env.LIGHTHOUSE_CHROMIUM_PATH) {
		priorities.push({ regex: new RegExp(process.env.LIGHTHOUSE_CHROMIUM_PATH), weight: 150 });
	}
	if (process.env.CHROME_PATH) {
		priorities.push({ regex: new RegExp(process.env.CHROME_PATH), weight: 151 });
	}
	// clang-format on
	return sort(installations, priorities);
}
function resolveChromePath() {
	if (canAccess(process.env.CHROME_PATH)) {
		return process.env.CHROME_PATH;
	}
	if (canAccess(process.env.LIGHTHOUSE_CHROMIUM_PATH)) {
		return process.env.LIGHTHOUSE_CHROMIUM_PATH;
	}
	return undefined;
}
/**
 * Look for linux executables in 3 ways
 * 1. Look into CHROME_PATH env variable
 * 2. Look into the directories where .desktop are saved on gnome based distro's
 * 3. Look for google-chrome-stable & google-chrome executables by using the which command
 */
function linux() {
	let installations = [];
	// 1. Look into CHROME_PATH env variable
	const customChromePath = resolveChromePath();
	if (customChromePath) {
		installations.push(customChromePath);
	}
	// 2. Look into the directories where .desktop are saved on gnome based distro's
	const desktopInstallationFolders = [
		path.join(require("os").homedir(), ".local/share/applications/"),
		"/usr/share/applications/"
	];
	desktopInstallationFolders.forEach(folder => {
		installations = installations.concat(findChromeExecutables(folder));
	});
	// Look for google-chrome(-stable) & chromium(-browser) executables by using the which command
	const executables = ["google-chrome-stable", "google-chrome", "chromium-browser", "chromium"];
	executables.forEach(executable => {
		try {
			const chromePath = execFileSync("which", [executable])
				.toString()
				.split(newLineRegex)[0];
			if (canAccess(chromePath)) {
				installations.push(chromePath);
			}
		} catch (e) {
			// Not installed.
		}
	});
	if (!installations.length) {
		throw new Error(
			"The environment variable CHROME_PATH must be set to " +
				"executable of a build of Chromium version 54.0 or later."
		);
	}
	const priorities = [
		{ regex: /chrome-wrapper$/, weight: 51 },
		{ regex: /google-chrome-stable$/, weight: 50 },
		{ regex: /google-chrome$/, weight: 49 },
		{ regex: /chromium-browser$/, weight: 48 },
		{ regex: /chromium$/, weight: 47 }
	];
	if (process.env.LIGHTHOUSE_CHROMIUM_PATH) {
		priorities.push({ regex: new RegExp(process.env.LIGHTHOUSE_CHROMIUM_PATH), weight: 100 });
	}
	if (process.env.CHROME_PATH) {
		priorities.push({ regex: new RegExp(process.env.CHROME_PATH), weight: 101 });
	}
	return sort(uniq(installations.filter(Boolean)), priorities);
}
function win32() {
	const installations = [];
	const suffixes = [
		`${path.sep}Google${path.sep}Chrome SxS${path.sep}Application${path.sep}chrome.exe`,
		`${path.sep}Google${path.sep}Chrome${path.sep}Application${path.sep}chrome.exe`
	];
	const prefixes = [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"]].filter(
		Boolean
	);
	const customChromePath = resolveChromePath();
	if (customChromePath) {
		installations.push(customChromePath);
	}
	prefixes.forEach(prefix =>
		suffixes.forEach(suffix => {
			const chromePath = path.join(prefix, suffix);
			if (canAccess(chromePath)) {
				installations.push(chromePath);
			}
		})
	);
	return installations;
}
function sort(installations, priorities) {
	const defaultPriority = 10;
	return installations
		.map(inst => {
			for (const pair of priorities) {
				if (pair.regex.test(inst)) {
					return { path: inst, weight: pair.weight };
				}
			}
			return { path: inst, weight: defaultPriority };
		})
		.sort((a, b) => b.weight - a.weight)
		.map(pair => pair.path);
}
function canAccess(file) {
	if (!file) {
		return false;
	}
	try {
		fs.accessSync(file);
		return true;
	} catch (e) {
		return false;
	}
}
function uniq(arr) {
	return Array.from(new Set(arr));
}
function findChromeExecutables(folder) {
	const argumentsRegex = /(^[^ ]+).*/; // Take everything up to the first space
	const chromeExecRegex = "^Exec=/.*/(google-chrome|chrome|chromium)-.*";
	let installations = [];
	if (canAccess(folder)) {
		// Output of the grep & print looks like:
		//    /opt/google/chrome/google-chrome --profile-directory
		//    /home/user/Downloads/chrome-linux/chrome-wrapper %U
		let execPaths;
		// Some systems do not support grep -R so fallback to -r.
		// See https://github.com/GoogleChrome/chrome-launcher/issues/46 for more context.
		try {
			execPaths = execSync(`grep -ER "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`);
		} catch (e) {
			execPaths = execSync(`grep -Er "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`);
		}
		execPaths = execPaths
			.toString()
			.split(newLineRegex)
			.map(execPath => execPath.replace(argumentsRegex, "$1"));
		execPaths.forEach(execPath => canAccess(execPath) && installations.push(execPath));
	}
	return installations;
}
function launch(opts) {
	let installations = null;
	switch (process.platform) {
		case "win32": {
			installations = win32();
			break;
		}
		case "linux": {
			installations = linux();
			break;
		}
		case "darwin": {
			installations = darwin();
			break;
		}
	}
	logger.info("Chrome installations:", installations);
	const chromePath = installations[0];
	if (chromePath) {
		logger.info("Launch Chrome with parameters:", opts.params);
		return spawn(chromePath, opts.params);
	} else {
		logger.error("Chrome installations not found!");
	}
}
module.exports = { launch };
