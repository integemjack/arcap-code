const fs = require("fs");
const path = require("path");

const { execFile } = require("child_process");
const moment = require("moment");
const ffmpeg = require("../libs/ffmpeg");
const Vimeo = require("../libs/vimeo").Vimeo;
const creator = require("../libs/creator");

(input => {

  let json = JSON.parse(input);
  let _path = json.path;
  let mode = json.mode;

  // 读取所有文件
  let dirs = fs.readdirSync(path.join(_path)).map(dir => path.join(_path, dir));
  let vimeo = new Vimeo();

  dirs.forEach(async dir => {
    console.log(dir);
    if (/\.webm$/.test(dir)) {
      let ids = dir.split("_");
      if (ids.length > 3) {
        let fileOutput = `${dir}.mp4`;
        if (!fs.existsSync(fileOutput)) await ffmpeg.merge(dir, "", "Original voice only", "1280*720", fileOutput);

        if (mode > 1) {
          let link = await vimeo.upload(fileOutput);
          console.log(`[link: ${__filename}:20]`, link);

          let id = ids[ids.length - 1].split(".")[0];
          if (mode > 2) await creator.addVimeo(id, link);
        }
        console.log(`This [${dir}] is do finished.`);
      } else {
        console.log(`This is not a valid video recorded by the creator.integem.com theme!`);
      }
    } else {
      console.log(`This [${dir}] is not a webm file.`);
    }
  });
})(process.argv[2]);
