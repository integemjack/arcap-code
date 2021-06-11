"use strict";

const async = require("async");
const libvimeo = require("vimeo");
const logger = require("./logger");
const config = require("./config").get();

const CONCURRENCY = 2;

function Vimeo() {
    this.uploadQueue = async.queue((file, cb) => {
        let vimeoConfig = config.email.vimeo;
        let vimeo = new libvimeo.Vimeo(vimeoConfig.appid, vimeoConfig.appsecret, vimeoConfig.token);

        vimeo.streamingUpload(
            file,
            (error, body, statusCode, headers) => {
                if (error) {
                    return cb(error);
                }
                vimeo.request(headers.location, (error, body, statusCode, headers) => {
                    if (error) {
                        return cb(error);
                    }
                    cb(null, body.link);
                });
            },
            (uploadSize, fileSize) => {
                logger.info("You have uploaded " + Math.round((uploadSize / fileSize) * 100) + "% of the video.");
            }
        );
    }, CONCURRENCY);
}

Vimeo.prototype.upload = function(file) {
    return new Promise((resolve, reject) => {
        this.uploadQueue.push(file, (err, link) => {
            if (err) reject(err);
            else resolve(link);
        });
    });
};

module.exports.Vimeo = Vimeo;