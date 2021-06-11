var fs = require("fs");

// 需要创建的文件夹
var foldersName = ["\\data", "\\data\\userData"];

foldersName.forEach((folderName, i) => {
	folderName = process.cwd() + folderName;
	foldersName[i] = folderName;
});

var i = 0;

function create() {
	if (i >= foldersName.length) return;

	fs.exists(foldersName[i], isExist => {
		if (isExist) {
			console.log(foldersName[i] + " has been created");
			i++;
			create();
		} else {
			fs.mkdir(foldersName[i], err => {
				if (err) console.error(err);
				else {
					console.log(foldersName[i] + " creat successfully");
					i++;
					create();
				}
			});
		}
	});
}

// create();

exports = module.exports = create;
