const { app, BrowserWindow, powerSaveBlocker, ipcMain } = require("electron");

let mainWindow, sleepId;
const winURL = `file://${__dirname}/html/index.html`;

// 打开控制台
// require("electron-debug")({ showDevTools: true });

function createWindow() {
	/**
	 * Initial window options
	 */
	let width = 800;
	let height = 486;

	mainWindow = new BrowserWindow({
		height: height,
		minHeight: height,
		useContentSize: true,
		width: width,
		minWidth: width,
		hide: true
		// frame: false
		// titleBarStyle: "hiddenInset"
	});

	mainWindow.loadURL(winURL);

	mainWindow.hide();

	mainWindow.on("closed", () => {
		mainWindow = null;
	});

	// 打开省电拦截
	sleepId = powerSaveBlocker.start("prevent-display-sleep");
}

app.on("ready", () => {
	createWindow();
});

app.on("window-all-closed", () => {
	// 关闭省电拦截
	if (powerSaveBlocker.isStarted(sleepId)) powerSaveBlocker.stop(sleepId);
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (mainWindow === null) {
		createWindow();
	}
});
