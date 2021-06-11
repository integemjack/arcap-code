const
    fs = require("fs"),
    path = require("path"),
    os = require("os"),
    iptable = {},
    ifaces = os.networkInterfaces(),
    axios = require("axios"),
    consola = require("consola");
// let iptableNu = 0;
// for (let dev in ifaces) {
//   ifaces[dev].forEach(function(details, alias) {
//     if (details.family == "IPv4") {
//       iptable[dev + (alias ? ":" + alias : "")] = details.address;
//       iptableNu++;
//     }
//   });
// }

// const getServer = (iptable, cb) => {
//   for (let k in iptable) {
//     let ips = iptable[k].split(".");
//     ips.pop();
//     for (let i = 1; i <= 255; i++) {
//       let ip = `${ips.join(".")}.${i}`;
//       // console.log(`Try connect ${ip}/api.php...`);
//       // try {
//       axios(`${ip}/api.php?do=ping`)
//         .then(res => {
//           if (res.data === "ping") {
//             cb(null, `${ip}/api.php`);
//           }
//         })
//         .catch(e => {
//           cb(e);
//         });
//     }
//   }
// };

// consola.info(`Initialize configuration file...`);

if (!fs.existsSync(path.join(process.cwd(), `config.json`))) fs.writeFileSync(path.join(process.cwd(), `config.json`), fs.readFileSync(path.join(process.cwd(), `config.bak.json`)));

// const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), `config.json`)));

// axios(`https://player.integem.com/api.php?do=ping`).then(res => {
//   // console.log(res.data);
//   if (res.data === "ping") {
//     consola.success(`Try connect https://player.integem.com/api.php successful!`);
//     config.creatorApi = `https://player.integem.com/api.php`;
//     fs.writeFileSync(path.join(process.cwd(), `config.json`), JSON.stringify(config, null, 4));
//     require("./index");
//   } else {
//     throw error();
//   }
// }).catch(e => {
//   console.log(e);
//   let i = 0;
//   getServer(iptable, (err, api) => {
//     // .then(api => {
//     if (err) i++;
//     if (api) {
//       consola.success(`Try connect ${api}/api.php successful!`);
//       config.creatorApi = `${api}/api.php`;
//       fs.writeFileSync(path.join(process.cwd(), `config.json`), JSON.stringify(config, null, 4));
//     }
//     // console.log(iptableNu, i);
//     if (i === iptableNu * 255 || api) require("./index");
//   });
// });

const modelsCreator = require("./models");

modelsCreator("./data/db.sqlite", {
    sync: true
});

require("./index");