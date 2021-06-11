"use strict";
const inherits = require("util").inherits;
const EventEmitter = require("events").EventEmitter;
const path = require("path");
const { spawn } = require("child_process");
const logger = require("./logger");

function Processor() {
    if (!(this instanceof Processor)) {
        return new Processor();
    }

    this._processing = false;

    EventEmitter.call(this);
}

inherits(Processor, EventEmitter);

Processor.prototype.start = function() {
    if (this._processing) {
        return false;
    }

    logger.info("Start processing...");
    let proc = spawn("node", [path.join(__dirname, "../command/email.js")]);

    this._processing = true;
    this.emit("state", "processing");

    proc.stdout.on("data", data => {
        this.emit("output", data);
    });

    proc.stderr.on("data", data => {
        this.emit("output", data);
    });

    proc.on("close", code => {
        logger.info("Finish processing...");
        this._processing = false;
        this.emit("state", "idle");
    });

    return true;
};

Processor.prototype.creatorOne = function(dir, file, cb) {
    let proc = spawn("node", [path.join(__dirname, "../command/creatorOne.js"), path.join(dir, file)]);

    proc.stdout.on("data", data => {
        console.log("stdout ->", data.toString());
    });

    proc.stderr.on("data", data => {
        console.log("stderr ->", data.toString());
    });

    proc.on("close", code => {
        cb(code)
    });
};

Processor.prototype.toMP4 = function(dir, file, cb) {
    let proc = spawn("node", [path.join(__dirname, "../command/toMP4.js"), path.join(dir, file)]);

    proc.stdout.on("data", data => {
        console.log("stdout ->", data.toString());
    });

    proc.stderr.on("data", data => {
        console.log("stderr ->", data.toString());
    });

    proc.on("close", code => {
        cb(code)
    });
};

Processor.prototype.creator = function(_path, cb) {
    if (this._processing) {
        return false;
    }

    logger.info("Start processing...");
    let proc = spawn("node", [path.join(__dirname, "../command/creator.js"), JSON.stringify(_path)]);

    this._processing = true;
    this.emit("state", "processing");

    proc.stdout.on("data", data => {
        this.emit("output", data);
    });

    proc.stderr.on("data", data => {
        this.emit("output", data);
    });

    proc.on("close", code => {
        logger.info("Finish processing...");
        this._processing = false;
        this.emit("state", "idle");
        cb(code);
    });

    return true;
};

//根据选择email 选择date来process 所以email只需要发送一次（因为只有一个email）
Processor.prototype.selectDateStart = function(infos) {
    //info:{email:"",dateTimes:[]}
    if (this._processing) {
        return false;
    }

    this._processing = true;
    this.emit("state", "processing");

    //infoText: "1asdq@qq.com&&20180607,20180708"
    let infosText = infos.email + "&&" + infos.dateTimes.toString();

    let proc = spawn("node", [path.join(__dirname, "../command/select_date.js")]);

    proc.stdin.write(infosText + "\t");

    proc.stdout.on("data", data => {
        this.emit("output", data);
    });

    proc.stderr.on("data", data => {
        this.emit("output", data);
    });

    proc.on("close", code => {
        logger.info("Finish processing...");
        this._processing = false;
        this.emit("state", "idle");
    });

    return true;
};

Processor.prototype.selectStart = function(info) {
    if (this._processing) {
        return false;
    }
    var infoText = info.dateTime + "&&" + info.email.toString();
    logger.info("Start processing...");
    let proc = spawn("node", [path.join(__dirname, "../command/select_email.js")]);

    proc.stdin.write(infoText + "\t");

    this._processing = true;
    this.emit("state", "processing");

    proc.stdout.on("data", data => {
        //buffer Data
        data = data.toString().trim();
        this.emit("output", data);
    });

    proc.stderr.on("data", data => {
        data = data.toString().trim();
        this.emit("output", data);
    });

    proc.on("close", code => {
        logger.info("Finish processing...");
        this._processing = false;
        this.emit("state", "idle");
    });

    return true;
};

Processor.prototype.isProcessing = function() {
    return this._processing;
};

Processor.prototype.state = function() {
    return this._processing ? "processing" : "idle";
};

let processor = new Processor();
processor.setMaxListeners(Infinity);

// Use as singleton object here
module.exports = processor;
