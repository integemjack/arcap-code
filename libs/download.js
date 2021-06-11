const {spawn, execFile} = require('child_process');
const path = require('path');

const aria2c = (url, dir, opts) => {
    let arias = spawn(path.join(process.cwd(), 'exe/aria2c.exe'), [url, '--dir', dir]);

    let filename = '';

    arias.stdout.on('data', data => {
        // console.log(`stdout: ${data}`);

        let datas = data.toString().split(" ");

        if (/^\[.*\]$/g.test(data.toString()) && datas.length >= 5) {
            datas = data.toString().split(" ");
            // console.log(data.toString(), datas[1]);
            opts.progress(datas[1].split("(")[1].split("%")[0])
        }

        if(/^[0-9]|OK/.test(data.toString())) {
            datas = data.toString().split("|");
            filename = datas.pop();
        }
    });

    arias.stderr.on('data', data => {
        opts.error(data.toString());
    });

    arias.on('close', code => {
        // console.log(`child process exited with code ${code}`);
        opts.end(filename)
    });

    // execFile(path.join(process.cwd(), 'exe/aria2c.exe'), [url, '--dir', dir], (error, stdout, stderr) => {
    //     console.log(error, stdout, stderr)
    // });


};

module.exports = aria2c;

// aria2c('https://player.integem.com/uploads/2019/05/SaveEarth_3D_2_1558337015.zip', 'C:\\Integem\\stage', {
//     progress: bar => {
//         console.log(`BAR => ${bar}`)
//     },
//     error: err => {
//         console.log(`ERR => ${err}`)
//     },
//     end: file => {
//         console.log(`done => ${file}`)
//     }
// });