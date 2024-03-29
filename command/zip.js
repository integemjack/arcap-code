const request = require('request');
const progress = require('request-progress');
const unzip = require("unzip");

const url = process.argv[2];
try {
    let _path_array = url.split(/\/|[\\]{1,2}/);
    let name = _path_array.pop();
    name = name.split(".")[0];

    const themePath = path.join(config.get().theme, name);
    // The options argument is optional so you can omit it
    progress(request(url), {
            // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
            // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
            // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
        })
        .on('progress', function(state) {
            // The state is an object that looks like this:
            // {
            //     percent: 0.5,               // Overall percent (between 0 to 1)
            //     speed: 554732,              // The download speed in bytes/sec
            //     size: {
            //         total: 90044871,        // The total payload size in bytes
            //         transferred: 27610959   // The transferred payload size in bytes
            //     },
            //     time: {
            //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
            //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
            //     }
            // }
            console.log('progress', state);
            // cb(null, state);
        })
        .on('error', function(err) {
            // Do something with err
            cb(err, null);
        })
        .on('end', function() {
            // Do something after request finishes
            const configPath = path.join(themePath, "config.yml");
            const config = YAML.load(fs.readFileSync(configPath));
            config.name = themePath;
            cb(null, config);
        })
        .pipe(unzip.Extract({
            path: themePath
        }));
} catch (e) {
    cb(e.message, 'try');
}