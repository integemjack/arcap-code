var INI = null,
    videoStartTimer = 0,
    backgroundAudio = "",
    config, themeConfig, zconfig, currentState = "idle",
    timers = new Set(),
    name = "",
    light = true,
    videoIndex = 1,
    volume = 100,
    videoSocket,
    videoDeviceId,
    videoTimerId,
    recordAll = false,
    userRecord = '',
    themeId = "",
    showDebug = {
        Debug: 0
    },
    ai_config = {
        poses: {
            flipHorizontal: false,
            maxDetections: 5,
            scoreThreshold: 0.5,
            nmsRadius: 20,
            decodingMethod: "single-person"
        },
        show: 0.5,
        debug: true,
        main: {
            architecture: "MobileNetV1",
            outputStride: 16,
            inputResolution: 200,
            multiplier: 0.5,
            quantBytes: 2
        }
    },
    ai_head,
    net = null,
    remoteSocket = io("ws://localhost:3000", {
        transports: ['websocket'],
        // transports: ['polling'],
        // rememberUpgrade: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        autoConnect: true
    }),
    remoteSocketUse = false,
    getImageId = 0,
    Zoom = false,
    ZoomRun = false,
    initStatus = false,
    themeFolder = '',
    twilio = null;

remoteSocket.emit("arcap");
remoteSocket.on("twilio", function(token, roomName, cb) {
    console.log(`twilio ->`, token, roomName)
    if (!twilio) {
        let video = new Twilio.Video.LocalVideoTrack(window.desktopStream.getTracks()[0])
        console.log(`twilio video ->`, video)
        Twilio.Video.connect(token, {
            name: roomName,
            tracks: [video]
        }).then(room => {
            twilio = room
            cb(null, room, video.name)
        }).catch(err => {
            cb(err, null, video.name)
        });
    }
})
remoteSocket.on("twilioClose", function() {
    if (twilio) {
        twilio.disconnect()
        twilio = null
    }
})
remoteSocket.on('videoRecord', function(userRecordPath) {
    userRecord = userRecordPath
    trace('set video record is on! path:', userRecordPath)
})

localStorage.removeItem("debug");

$(function() {

    trace("page loaded!");
    main();
});

function getProperty(obj, path) {
    return path.replace(/^\./, "").split(".").reduce((pre, cur) => pre ? pre[cur] : undefined, obj);
}

async function main() {

    // remote


    $("#loginBtn").click(function() {
        var domain = "https://" + document.domain + ":2012/";
        window.open(domain, "_blank");
    });

    var socket = io("/ar", {
        perMessageDeflate: false
    });

    socket.on("getDevices", function(cb) {
        console.log("Load devices info.");
        return navigator.mediaDevices.enumerateDevices().then(function(deviceInfo) {
            cb(null, deviceInfo);
        }).catch(function(err) {
            trace(err.message);
        });
    });

    socket.on("config", function(c) {
        trace("Config updated!");
        config = c;
        debug = config.debug;
        if (videoDeviceId !== config.videoDeviceId) {
            videoDeviceId = config.videoDeviceId;
            videoSocket.emit("videoDeviceId", videoDeviceId, function(err) {
                trace(`Change videoDeviceId: ${videoDeviceId} is error: ${JSON.stringify(err)}`);
            });
        }
        if (debug) {
            $("<div id=\"console\"></div>").appendTo(document.body);
        } else {
            $("div#console").remove();
        }
        console.log(`config.remote ->`, config.remote);
        if (config.remote) {
            remote();
        } else {
            // remoteSocket = null;
        }
    });

    socket.on("aiConfig", async function(c) {
        trace("aiConfig updated!");
        ai_config = c;
        if (!ai_config.use) {
            net = null;
        } else {
            try {
                console.log(c.posenet);
                net = await posenet.load(c.main);
            } catch (e) {
                console.log(`net ->`, e);
            }
        }
    });

    // tel server i'm ar
    socket.on("connect", function() {
        trace("connect server is success!");
        window.socket = socket;

        // get ai config
        socket.emit("getAiConfig", async function(err, config, head) {
            // console.log(err, config, head);
            console.log("Load AI config.");
            // console.log(head);
            ai_head = head;
            // for(let key in head) {
            // 	$(`#${key}`).attr("src", head[key]);
            // }
            // console.log(config)
            if (config) {
                ai_config = config;
                // console.log(ai_config, config.use);
                if (config.use) {
                    try {
                        // console.log(posenet);
                        net = await posenet.load(config.main);
                    } catch (e) {
                        // console.log(`net ->`, e);
                    }
                }
            }
            trace("Load AI config is successed.");
        });

        // get server config
        socket.emit("configGet", function(err, c) {
            if (err) {
                return trace(err);
            }
            // console.log(c);
            config = c.config;
            debug = config.debug;
            if (videoDeviceId !== config.videoDeviceId) {
                videoDeviceId = config.videoDeviceId;
                videoSocket.emit("videoDeviceId", videoDeviceId, function(err) {
                    trace(`Change videoDeviceId: ${videoDeviceId} is error: ${JSON.stringify(err)}`);
                });
            }
            if (debug) {
                $("<div id=\"console\"></div>").appendTo(document.body);
            } else {
                $("div#console").remove();
            }

            setCurrentState("idle");
            socket.emit("arState", {
                light: (light ? "on" : "off")
            });

            socket.emit("arState", {
                recordAll: (recordAll ? "on" : "off")
            });

            socket.emit("arState", {
                volume
            });

            // console.log(`config.remote ->`, config.remote);
            if (config.remote) {
                remote();
            } else {
                // remoteSocket = null;
            }
        });
    });

    // npm test console
    socket.on("console", function(data) {
        $("#console").append(`processData: ${data}<br />`);
    });

    socket.on("volume", function(vol) {
        volume = vol;
        socket.emit("arState", {
            volume
        });
        $("audio").each(function() {
            this.volume = $(this).attr("vol") * (volume / 100.);
        });
    });

    socket.on("serverError", function(err) {
        if (err === "refuseConnection") {
            error("Server refused connection, only one AR connection is allowed!");
        }
    });

    // stage
    socket.on("set", function(set) {
        var sequenceId = set.sid;
        // Get the stage, and convert it all to lowercase
        var _stage = JSON.parse(JSON.stringify(set.stage).toLocaleLowerCase());

        if (_stage.time) {
            var timer = (new Date()).getTime() - _stage.time;
            trace(`Gets the parameters sent by the AR machine: ${JSON.stringify(set)}. use time: ${timer} ms.`);
        } else {
            trace(`Gets the parameters sent by the AR machine: ${JSON.stringify(set)}`);
        }

        $("#layers").find("div,a,p,img").remove();
        $("#layersCopy").find("div,a,p,img").remove();

        // 取INI子参数的最后一个参数作为project的命名
        var project = "";
        for (var i in INI) {
            project = i;
        }

        // debugConfig.txt
        if (Number(showDebug.Debug) === 1) {
            if (_stage.dgloop && showDebug[_stage.dgloop]) $("#showDebug").text(`DEBUG ${showDebug[_stage.dgloop].split(":")[0].toLocaleUpperCase()}`);
            if (_stage.dgloopclear) $("#showDebug").text("DEBUG");
            $("#showDebug").show();
        }

        var stages = [];
        var _wearable = [];
        var _goodies = [];
        try {
            stages = getProperty(INI[project], _stage.stagetitle.split(".")[0]).stage;
            // console.log(stages);
        } catch (e) {
            console.log(e);
        }
        try {
            _wearable = getProperty(INI[project], _stage.stagetitle.split(".")[0]).wearable;
            // console.log(_wearable);
        } catch (e) {
            console.log(e);
        }
        for (let key in _wearable) {
            // console.log(key);
            if (key !== "type") {
                ai_head[key].use = _wearable[key].use;
                ai_head[key].imageData = `wears/${key}/${_wearable[key].image}`;
                if (_wearable[key].offset) {
                    ai_head[key].offset.top = _wearable[key].offset.top;
                    ai_head[key].offset.left = _wearable[key].offset.left;
                    ai_head[key].offset.zoom = _wearable[key].offset.zoom;
                }
                if (_wearable[key].position) ai_head[key].position = _wearable[key].position;
                if (_wearable[key].show) ai_head[key].show = _wearable[key].show;
                // console.log(`ai_head -> ${key}:`, ai_head[key])
            }
        }

        try {
            _goodies = getProperty(INI[project], _stage.stagetitle.split(".")[0]).goodies;
        } catch (e) {
            console.log(e);
        }
        var goodies = {};
        /**
         * 格式化 themes.json 中的 goodies -> key，以匹配 _stage 中的 G1，如：goodie1 -> G1
         */
        for (var key in _goodies) {
            var k = key.replace(/([a-zA-Z]+)([0-9]+)/, (word, w1, w2) => {
                // console.log(word, w1, w2);
                return `${w1.substring(0, 1).toLocaleLowerCase()}${w2}`;
            });
            // console.log(k)
            goodies[k] = _goodies[key];
        }

        for (var g in goodies) {
            var goodie = goodies[g];
            switch (goodie.status) {
                case "continue":
                    // console.log(`[175] goodie ->`, g);
                    addGoodie(g, goodies[g], _stage[g] || goodies[g].initNum);
                    break;

                case "remove":
                    // removeGoodie(g);
                    $("div#headers").find(`#${g}`).remove();
                    break;
            }
        }

        for (var k in _stage) {
            changeGoodie(k, _stage[k]);
        }

        // MultiPerson
        let multperson = {};
        try {
            multperson = getProperty(INI[project], _stage.stagetitle.split(".")[0]).multperson || {};
        } catch (e) {
            console.log(e);
        }
        if (_stage.multiperson) {
            addPerson(_stage.multiperson, multperson);
        }
        if (_stage.multipersonclear) {
            removePerson();
        }

        window.stageNow = _stage.stagetitle;
        // console.log(_stage.stagetitle, goodies);
        for (var s in stages) {
            // Loop processing stage
            var stage = stages[s];
            // var baseTime = (new Date()).getTime()
            doItDelay(stage, function(stage, timerId) {
                // var execTime = (new Date()).getTime()
                // trace(`exec ${stage.type} at ${execTime}, delayed ${execTime - baseTime} ms. [stage.delay = ${stage.delay || 0}]`);

                // remove this timer from pending stage tasks
                timers.delete(timerId);

                switch (stage.type) {
                    case "text":
                        // get add text
                        var txt = stage.txt;
                        for (var k in set.data) {
                            txt = txt.replace(new RegExp("{" + k + "}", "g"), set.data[k]);
                        }
                        if (stage.css) {
                            if (typeof stage.css === "string") {
                                stage.css = JSON.parse(stage.css);
                            }
                        }
                        $("<div />").attr("id", stage.id ? stage.id + "-container" : "").append(
                            $("<p />")
                                .html(txt)
                                .attr("id", stage.id || "")
                                .addClass(stage.class || "")
                                .css(stage.css || {})
                        ).appendTo($("div#layers")).clone().appendTo($("div#layersCopy"));
                        // $("#layers").clone().appendTo($("#layersCopy"));
                        // copy("#layers");
                        break;

                    case "image":
                        // get add image
                        if (stage.css) {
                            if (typeof stage.css === "string") {
                                stage.css = JSON.parse(stage.css);
                            }
                        }
                        $("<img />")
                            .attr("id", stage.id || "")
                            .attr("src", stage.src + "?" + Date.now())
                            .addClass(stage.class || "")
                            .css(stage.css || {})
                            .appendTo($("div#layers")).clone().appendTo($("div#layersCopy"));
                        // $("#layers").find("*").clone().appendTo($("#layersCopy").empty());
                        // copy("#layers");
                        break;

                    case "music":
                        if (remoteSocketUse) remoteSocket.emit("play", stage);
                        // console.log(`Music ->`, stage);
                        //return;
                        // get audio background play or stop or remove
                        var have = false;
                        $("#layers").find("audio").each(function() {
                            if ($(this).attr("src").startsWith(stage.src + "?")) {
                                have = true;
                                if (stage.status) {
                                    switch (stage.status) {
                                        case "continue":
                                            $(this)[0].play();
                                            break;
                                        case "pause":
                                            $(this)[0].pause();
                                            break;
                                        case "false":
                                            $(this).remove();
                                            have = false;
                                            break;
                                        case "remove":
                                            $(this).remove();
                                            break;
                                    }
                                } else {
                                    $(this).remove();
                                    have = false;
                                }
                            }
                        });
                        if (!have) {
                            backgroundAudio = stage.src;
                            stage.loop = (stage.loop === "true" || stage.loop === true);
                            var audio = $("<audio />")
                                .addClass("hide")
                                .attr("src", stage.src + "?" + Date.now())
                                .attr("loop", stage.loop ? "" : undefined)
                                .attr("vol", stage.volume ? stage.volume : 1)
                                .addClass("now")
                                .appendTo($("#layers"));
                            audio[0].volume = (stage.volume === undefined ? 1 : stage.volume) * (volume / 100.);
                            if (stage.status === "continue" || stage.status === "false" || !stage.status) {
                                audio[0].play();
                            }
                        }
                        break;

                    case "photo":
                        //get take photo command
                        if (stage.takephoto === "true") {
                            if (currentState !== "started") {
                                trace("Ignore take photo request! Sequence has already done.");
                                break;
                            }
                            takePhoto(function(data) {
                                if (data) {
                                    trace("take photo is ok, use all time: " + ((new Date()).getTime() - _stage.time) + " ms.");
                                    socket.emit("photo", {
                                        sid: sequenceId,
                                        type: "jpg",
                                        data: data,
                                        themeId
                                    });
                                } else {
                                    trace("Error: take photo failed, no data is received.");
                                }
                            });
                        }
                        break;

                    case "video":
                        if (!recordAll) {
                            // get recording video command
                            if (stage.takevideo === "true") {
                                if (currentState !== "started") {
                                    trace("Ignore take video request! Sequence has already done.");
                                    break;
                                }
                                trace("start recording...");
                                $("#camera").addClass("on");
                                videoStartTimer = (new Date()).getTime();
                                startRecording(config.capture, (function(videoIndex) {
                                    return function(data) {
                                        socket.emit("video", {
                                            sid: sequenceId,
                                            type: "webm",
                                            data: data,
                                            themeId: themeId,
                                            videoIndex: videoIndex
                                        });
                                    };
                                })(_stage.stagetitle));
                                if (stage.maximumTime && stage.maximumTime > 0) {
                                    videoTimerId = setTimeout(function() {
                                        if (videoTimerId) timers.delete(videoTimerId);
                                        var startTime = (new Date()).getTime();
                                        trace(`stop video use time: ${startTime - _stage.time} ms.`);
                                        stopRecording(function() {
                                            var overTime = (new Date()).getTime();
                                            trace(`Processing video takes time: ${overTime - startTime} ms. use all time: ${overTime - _stage.time} ms. video time is: ${(new Date()).getTime() - videoStartTimer} ms.`);
                                        });
                                    }, (stage.maximumTime + 1) * 1000);
                                    if (videoTimerId) timers.add(videoTimerId);
                                }

                            }
                            if (stage.stopvideo === "true") {
                                try {
                                    clearTimeout(videoTimerId);
                                    timers.delete(videoTimerId);
                                } catch (e) {
                                    console.log(e);
                                }
                                var startTime = (new Date()).getTime();
                                trace(`stop video use time: ${startTime - _stage.time} ms.`);
                                stopRecording(function() {
                                    var overTime = (new Date()).getTime();
                                    trace(`Processing video takes time: ${overTime - startTime} ms. use all time: ${overTime - _stage.time} ms. video time is: ${(new Date()).getTime() - videoStartTimer} ms.`);
                                });
                                // videoSocket.emit("stopRecording");
                            }
                        }
                        break;

                    case "microphone":
                        // get mic message command
                        annyang.removeCommands();

                        var commands = {};
                        commands[stage.text] = () => {
                            trace(`${stage.text} command is listened.`);
                            annyang.removeCommands();
                            if (window.stageNow === _stage.stagetitle) {
                                socket.emit("nextStage", true);
                            } else {
                                trace(`${stage.text} command is already expired.`);
                            }
                        };

                        annyang.addCommands(commands);
                        trace(`${stage.text} command is added.`);
                        break;

                    case "command":
                        switch (stage.command) {
                            case "done":
                                setCurrentState("done", sequenceId);
                                $("#headers").empty();
                                $("#headersCopy").empty();
                                // 如果视频还没有处理就执行视频处理
                                var startTime2 = (new Date()).getTime();
                                trace(`stop video use time: ${startTime2 - _stage.time} ms.`);
                                stopRecording(function() {
                                    // 如果视频已经结束或者处理，不会再有callback返回，也不会有以下操作
                                    var overTime2 = (new Date()).getTime();
                                    trace(`Processing video takes time: ${overTime2 - startTime2} ms. use all time: ${overTime2 - _stage.time} ms. video time is: ${(new Date()).getTime() - videoStartTimer} ms.`);
                                });

                                socket.emit("done", {
                                    sid: sequenceId,
                                    backgroundAudio: backgroundAudio
                                });
                                break;

                            case "finish":
                                trace(`AR experience finish!`);
                                // Sequence is finish, pending tasks should not be executed.
                                killDelayTasks();
                                // Tell that AR is available
                                setCurrentState("idle");
                                // Back to start page

                                $("#camera").removeClass("on");
                                $("#showDebug").hide();
                                showFinish();
                                break;

                            default:
                                console.log(`*** config ->`, config, config.commandFolder, themeFolder);
                                if (!config.commandFolder) config.commandFolder = "";
                                let _commandTxt = stage.command.replace(/\{commandFolder\}/gi, config.commandFolder).replace(/\{themeFolder\}/gi, themeFolder);
                                trace(`Run this command "${_commandTxt}"...`);
                                console.log(`Run this command "${_commandTxt}"...`);
                                socket.emit("runCommand", _commandTxt, msg => {
                                    trace(`Run this command "${_commandTxt}": ${msg}`);
                                    console.log(`Run this command "${_commandTxt}": ${msg}`);
                                });
                                break;
                        }
                }
            });
        }
    });

    // stop stage
    socket.on("stop", function(cb) {
        ZoomRun = false;
        // console.log(`ZoomRun ->`, ZoomRun);
        trace(`Arcap system stopping...`);
        // delete 所有元件
        $("#layers").empty();
        $("#layersCopy").empty();
        $("#headers").empty();
        $("#headersCopy").empty();

        // stop video record
        stopRecording(function() {});
        userRecord = '';

        killDelayTasks();
        // Tell that AR is available
        setCurrentState("idle");
        // Back to start page
        $("#camera").removeClass("on");
        // $("#camera").removeClass("speech");
        annyang.removeCommands();
        trace(`Arcap system stop finish!`);
        cb();
    });

    socket.on("reset", function() {
        ZoomRun = false;
        // console.log(`ZoomRun ->`, ZoomRun);
        trace(`Arcap system reset!`);
        // clean displaying elements and stop music
        $("#layers").empty();
        $("#headers").empty();
        $("#layersCopy").empty();
        $("#headersCopy").empty();
        // stop video recording if it is still running
        stopRecording(function() {});
        // Sequence is finish, pending tasks should not be executed.
        killDelayTasks();
        // Tell that AR is available
        setCurrentState("idle");
        // Back to start page
        goBack();
    });

    socket.on("toggleLight", function() {
        trace("Desktop toggle light");
        if (light) {
            $("<div class=\"black\"></div>").appendTo(document.body);
            light = false;
        } else {
            $(".black").remove();
            light = true;
        }
        socket.emit("arState", {
            light: (light ? "on" : "off")
        });
    });

    socket.on("toggleRecordAll", function() {
        trace("Desktop toggle recordAll");
        if (recordAll) {
            recordAll = false;
        } else {
            recordAll = true;
        }
        socket.emit("arState", {
            recordAll: (recordAll ? "on" : "off")
        });
    });

    socket.on("loginStart", function(data, cb) {
        ZoomRun = true;
        // console.log(`ZoomRun ->`, ZoomRun);
        trace(`Start AR experience with parameter ${JSON.stringify(data)}`);
        if (currentState === "starting" || currentState === "started" || currentState === "done") {
            return cb("AR experience had already started! Please wait until finish to process next.");
        }

        // start stage in AR desktop
        killDelayTasks();

        // avoid mistaken close if user click start
        window.onbeforeunload = function(e) {
            return true;
        };

        let userInfo = data.userInfo;

        var welcomeFields = "";

        socket.emit("getWelcome", (err, words) => {
            if (!err) {
                welcomeFields = words;
            };
        });

        // reload theme each sequence
        socket.emit("loadTheme", data.theme, function(theme, _config, _zconfig) {
            if (!theme) {
                showTip("Please select a theme!");
                return trace("Error: cannot load theme!");
            }

            if (!window.stream) {
                initialCamera();
                console.log(`*** no stream!`);
            } else {
                console.log(`*** has stream!`);
            }

            themeFolder = theme.themeFolder;
            themeConfig = _config;
            // themePath = _themePath;
            console.log(`themeConfig ->`, theme);

            zconfig = _zconfig;
            // console.log(theme);

            // if (zconfig && zconfig.Camera2DPara && zconfig.Camera2DPara.Camera2DOption !== 2 && initStatus) {
            //     initialCamera();
            // }

            // console.log(zconfig.DisplayMode.Display3D);
            switch (zconfig.DisplayMode.Display3D) {
                case "0":
                    $("#layers").css({
                        "transform": `scale(1, 1)`,
                        "left": "0"
                    });
                    $("#layersCopy").hide();
                    $("#headers").css({
                        "transform": `scale(1, 1)`,
                        "left": "0"
                    });
                    $("#headersCopy").hide();
                    break;

                case "1":
                    $("#layers").css({
                        "transform": `scale(0.5, 1)`,
                        "left": "-25%"
                    });
                    $("#layersCopy").css({
                        "transform": `scale(0.5, 1)`,
                        "right": `-25%`,
                        "margin-right": `-${zconfig.DisplayMode.offsetText || 0}px`
                    });
                    $("#headers").css({
                        "transform": `scale(0.5, 1)`,
                        "left": "-25%"
                    });
                    $("#headersCopy").css({
                        "transform": `scale(0.5, 1)`,
                        "right": `-25%`,
                        "margin-right": `-${zconfig.DisplayMode.offsetText || 0}px`
                    });
                    break;

                case "2":
                    $("#layers").css({
                        "transform": `scale(1, 1)`,
                        "left": "0"
                        // "box-shadow": `-${zconfig.DisplayMode.stereoDepthZ*2}px 0 ${zconfig.DisplayMode.stereoDepthZ}px ${zconfig.DisplayMode.stereoDepthZ}px red`
                    });
                    $("#layersCopy").css({
                        "transform": `scale(1, 1)`
                        // "right": `-${zconfig.DisplayMode.stereoDepthZ}px`,
                        // "box-shadow": `0 0 ${zconfig.DisplayMode.stereoDepthZ}px ${zconfig.DisplayMode.stereoDepthZ}px blue`
                    }); //.css({ "right": $("#layersCopy").right() - zconfig.DisplayMode.stereoDepthZ })
                    $("#headers").css({
                        "transform": `scale(1, 1)`,
                        "left": "0"
                        // "box-shadow": `-${zconfig.DisplayMode.stereoDepthZ*2}px 0 0 ${zconfig.DisplayMode.stereoDepthZ}px red`
                    });
                    $("#headersCopy").css({
                        "transform": `scale(1, 1)`
                        // "right": `-${zconfig.DisplayMode.stereoDepthZ}px`,
                        // "box-shadow": `0 0 0 ${zconfig.DisplayMode.stereoDepthZ}px blue`
                    }); //.css({ "right": $("#headersCopy").right() - zconfig.DisplayMode.stereoDepthZ })
                    break;
            }

            /* name = data.name;
            var weclomeWords = "Welcome " + name + " ! ";
            // address : address,street,division,state,region,city,province,country
            userInfo.address = userInfo.address || userInfo["Address"] || userInfo["Street"] || userInfo["street"] || userInfo["Division"] || userInfo["division"] || userInfo["State"] || userInfo["state"] || userInfo["Region"] || userInfo["region"] || userInfo["City"] || userInfo["city"] || userInfo["Province"] || userInfo["province"] || userInfo["Country"] || userInfo["country"]
            if (userInfo.address) {
            	weclomeWords += "How are you doing in "+userInfo.address +" .";
            } */

            //当用户是通过name 和 邮箱登录的 就直接welcome name
            if (!userInfo || welcomeFields.trim() == "") {
                var weclomeWords = "Welcome " + data.name + " ! ";
                showTip(weclomeWords);
            } else {
                //扫码登陆的按照数据库信息显示

                userInfo.name = data.name; //防止fieldsWords 里面的name和email 数据库中不存在
                userInfo.email = data.email;

                //但是其他的字段值{Title}必须和csv文件第一行的字段值保持一致
                //否则userInfo 里面找不到
                let reg = new RegExp("\\{(.+?)\\}", "g"); //match {name} ...
                var fieldsWords = welcomeFields.replace(reg, function(a) {
                    //a : {name} 需要去除{}
                    return userInfo[a.slice(1, -1)] || "";
                });
                showTip(fieldsWords);
            }

            trace("INI loaded!");
            INI = theme.theme;
            // console.log("ThemeConfig:", _config);
            // console.log("Zconfig:", _zconfig);
            if (_config && _config.themeId && _config.themeId !== "") themeId = _config.themeId;
            if (_config && _config.debug) showDebug = _config.debug;

            /* showTip(weclomeWords);
            // showTip(`Welcome ${name}!`); */

            setCurrentState("starting", data.sid);
            // $("#layers").empty();
            // $("#headers").empty();

            var project = {};
            for (var i in INI) {
                project = INI[i];
            }

            for (let p in project) {
                let _project = project[p];
                // console.log(`p ->`, p, "->", _project);
                for (let stage of _project.stage) {
                    // console.log(`s ->`, stage);
                    if (stage.type === "music") {
                        if (remoteSocketUse) {
                            // console.log(remoteSocket);
                            remoteSocket.emit("music", stage);
                        }
                    }
                }
            }

            for (var g in project.goodies) {
                // console.log(`[543] goodie ->`, g);
                addGoodie(project.goodies[g]);
            }

            socket.emit("start", data, function(err) {
                console.log(`start err ->`, err);
                if (err) {
                    setCurrentState("idle");
                } else {
                    setCurrentState("started", data.sid);

                    setTimeout(() => {
                        if (recordAll) {
                            let sid = data.sid;
                            trace("Start full recording...");
                            $("#camera").addClass("on");
                            videoStartTimer = (new Date()).getTime();
                            startRecording(config.capture, (function(videoIndex) {
                                return function(data) {
                                    socket.emit("video", {
                                        sid,
                                        type: "webm",
                                        data: data,
                                        themeId: themeId,
                                        videoIndex: videoIndex
                                    });
                                };
                            })("recordAll"));
                        } else {
                            trace("The whole recording is not opened.");
                        }

                        if (userRecord !== '') {
                            startRecording(config.capture, data => {
                                socket.emit('videoRecord', data, userRecord);
                            });
                        }
                    }, 1000);
                }
                cb(err);
            });
        });
    });
}

function trace(txt) {
    $("#console").append(`${txt}<br />`);
    if (typeof(window.socket) !== "undefined") {
        window.socket.emit("console", txt);
    }
}

function doItDelay(stage, cb) {
    // Whether to perform a deferred operation
    if (stage.delay && stage.delay !== 0) {
        let timerId = setTimeout(function() {
            cb(stage, timerId);
        }, stage.delay);
        timers.add(timerId);
    } else {
        cb(stage);
    }
}

function killDelayTasks() {
    if (timers.size) {
        trace(`Killing ${timers.size} pending stage tasks...`);
    }
    timers.forEach(function(timerId) {
        // stop and clear all pending stage tasks
        clearTimeout(timerId);
        timers.delete(timerId);
    });
}

function error(txt) {
    $("div.error div.content").html(txt);
    $("div.error").slideToggle("slow", function() {
        setTimeout(function() {
            $("div.error").slideToggle("slow");
        }, 3000);
    });
}

function setCurrentState(state, sid) {
    currentState = state;
    if (window.socket) {
        window.socket.emit("arState", {
            state: state,
            sid: sid
        });
        if (state === 'idle') {
            window.socket.emit("streamOver");
        }
    }
}

function showTip(content, cb = function() {}) {
    $("div.success div.content").text(content);
    $("div.success").slideToggle("fast", function() {
        setTimeout(function() {
            $("div.success").slideToggle("fast", cb);
        }, 2000);
    });
}

function showFinish(cb = function() {}) {
    var ele = $("<img src=\"/image/thankyou.png\" class=\"thecenterimg\">");
    ele.appendTo($("div#layers")).clone().appendTo($("div#layersCopy"));
    setTimeout(function() {
        ele.fadeToggle("fast", function() {
            $("div#layers").empty();
            $("div#layersCopy").empty();
        });
    }, 3000);
    $("#layers").find("*").clone().appendTo($("#layersCopy").empty());
    copy("#layers");
}

function addGoodie(key, goodie, number, once = true) {

    if (!changeGoodie(key, number, once)) {
        if (!number) number = goodie.initNum;

        let css = {
            position: "absolute",
            top: goodie.y / $(window).width() * 1920 / 1080 * $(window).height(),
            left: goodie.x / $(window).width() * 1920 / 1920 * $(window).width(),
            // zoom: goodie.scale,
            "-webkit-transform-origin": "top left",
            "-webkit-transform": `scale(${goodie.scale})`
        }

        var div = $("<div />").addClass("goodie").css(css).attr("id", key).attr("data", JSON.stringify(goodie)).css(goodie.css && goodie.css.main ? goodie.css.main : {});
        if (number < 5) {
            for (var i = 0; i < number; i++) {
                div.append($("<img />").attr("src", `goodies/${goodie.img}`).css({
                    marginLeft: goodie.gap
                }).css(goodie.css && goodie.css.img ? goodie.css.img : {}));
            }
        } else {
            div.append($("<img />").attr("src", `goodies/${goodie.img}`)).append($("<span />").text(`x ${number}`).css({
                marginLeft: goodie.gap
            }).css(goodie.css && goodie.css.text ? goodie.css.text : {}));
        }
        div.appendTo($("div#headers"));
        // $("#headers").find("*").clone().appendTo($("#headersCopy").empty());
        copy("#headers");
    }
}

function removeGoodie(key) {
    $("div#headers").find("div.goodie").each(function() {
        if ($(this).attr("id") === key) $(this).remove();
    });
    // $("#headers").find("*").clone().appendTo($("#headersCopy").empty());
    copy("#headers");
}

function changeGoodie(key, number, once = false) {
    var div;
    $("div#headers").find("div.goodie").each(function() {
        // console.log($(this).attr('id'))
        if ($(this).attr("id") === key) div = $(this);
    });
    if (div) {
        if (!once) {
            // console.log(div.attr("id"), number);
            div.empty();
            var goodie = JSON.parse(div.attr("data"));
            if (number < 5) {
                for (var i = 0; i < number; i++) {
                    div.append($("<img />").attr("src", `goodies/${goodie.img}`).css({
                        marginLeft: goodie.gap
                    }).css(goodie.css && goodie.css.img ? goodie.css.img : {}));
                }
            } else {
                div.append($("<img />").attr("src", `goodies/${goodie.img}`)).append($("<span />").text(`x ${number}`).css({
                    marginLeft: goodie.gap
                }).css(goodie.css && goodie.css.text ? goodie.css.text : {}));
            }
        }
        // $("#headers").find("*").clone().appendTo($("#headersCopy").empty());
        copy("#headers");
        return true;
    } else {
        return false;
    }
}

function addPerson(number, multiperson) {
    let person = $("div#headers").find("div.person");
    if (person.length === 0) {
        let css = {
            position: "absolute",
            // top: multiperson.y || "20px",
            // left: multiperson.x || "20px",
            // zoom: goodie.scale,
            "-webkit-transform-origin": "top left",
            "-webkit-transform": `scale(1)`
        };
        if (multiperson.scale) css["-webkit-transform"] = `scale(${multiperson.scale})`;
        if (multiperson.x) {
            css["left"] = multiperson.x;
        } else {
            css["left"] = "10px";
        }
        if (multiperson.y) {
            css["top"] = multiperson.y;
        } else {
            css["bottom"] = "10px";
        }
        person = $("<div />")
            .addClass("person")
            .css(css)
            .appendTo($("div#headers"));
    }
    if (person.find("img").length > number) {
        let i = person.find("img").length - number;
        person.find("img").each(function() {
            if (i !== 0) {
                $(this).remove();
                i--;
            }
        });
    } else {
        for (let i = 0; i <= number - person.find("img").length; i++) {
            $("<img class=\"person\" src=\"/image/kidIcon.jpg\" />").appendTo(person);
        }
    }
    // $("#headers").find("*").clone().appendTo($("#headersCopy").empty());
    copy("#headers");
}

function removePerson() {
    $("div#headers").find("div.person").remove();
    // $("#headers").find("*").clone().appendTo($("#headersCopy").empty());
    copy("#headers");
}

function copy(name) {
    $(`${name}Copy`).empty();
    $(name).children().each(function() {
        $(this).clone().appendTo($(`${name}Copy`));
    });
}

async function remote() {
    try {
        let _stream = await navigator.mediaDevices.getDisplayMedia(); //.then(stream => {
        let _remoteSocket = io("ws://localhost:3001", {
            transports: ['websocket'],
            // transports: ['polling'],
            // rememberUpgrade: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            autoConnect: true
        });
        // let _remoteSocket = io("wss://integem1.ireoo.com:3000");
        // let zoomSocket = io("ws://localhost:3001");
        let peers = {};
        remoteSocket.emit('server')

        let video = document.getElementById("remote_video");
        let canvas = document.getElementById("remote_canvas");

        window.desktopStream = _stream;
        video.srcObject = _stream;

        let w = 640; //video.videoWidth //640
        let h = 480; //w / video.videoWidth * video.videoHeight
        canvas.width = w;
        canvas.height = h;
        let ctx = canvas.getContext("2d");
        // console.log(w, h);
        let i;
        video.addEventListener(
            "play",
            function() {
                let w = 640; //video.videoWidth //640
                let h = 480; //w / video.videoWidth * video.videoHeight
                let sw = h / video.videoHeight * video.videoWidth;
                let sh = w / video.videoWidth * video.videoHeight;
                if (sw > 640) {
                    sw = 640;
                } else {
                    sh = 480;
                }

                let tw = (640 - sw) / 2;
                let th = (480 - sh) / 2;
                canvas.width = w; //video.videoWidth
                canvas.height = h; //video.videoHeight
                i = window.setInterval(function() {
                    if (Zoom && ZoomRun) ctx.drawImage(video, tw, th, sw, sh);
                }, 10);
            },
            false
        );
        video.addEventListener(
            "pause",
            function() {
                window.clearInterval(i);
            },
            false
        );
        video.addEventListener(
            "ended",
            function() {
                clearInterval(i);
            },
            false
        );

        const getImage = () => {
            getImageId += 1;
            // console.log(`ZoomRun ->`, ZoomRun);
            if (Zoom && ZoomRun) {
                let t = new Date().getTime();
                canvas.toBlob(
                    function(image) {
                        // let _now = new Date().getTime() - t;
                        // console.log(`get image -> use time:`, new Date().getTime() - t)
                        if (image) _remoteSocket.emit("simage", image, getImageId, _now, () => {
                            // console.log(`get image -> use time:`, new Date().getTime() - t);
                            setTimeout(getImage, 10);
                            // getImage()
                        });
                        // setTimeout(getImage, 20)
                        // getImage()
                    },
                    "image/jpeg",
                    0.5
                );
            } else {
                setTimeout(getImage, 1000);
            }
        };
        getImage();

        _remoteSocket.on("peer", function(id, streamMode, cb) {
            peers[id] = new RTCPeerConnection({
                iceServers: [{
                    urls: [
                        "stun:134.209.142.117:3478",
                        'stun:47.103.113.126:3478',
                        'stun:172.217.213.127:19302',
                        'stun:[2404:6800:400A:1002::7F]:19302'
                    ]
                },
                    {
                        credential: 'vqXXWFJvY2QKLw6FdclDCNhv4yU=',
                        maxRateKbps: '800000',
                        urls: [
                            'turn:74.125.203.127:19305?transport=udp',
                            'turn:[2404:6800:4008:C03::7F]:19305?transport=udp',
                            'turn:74.125.203.127:19305?transport=tcp',
                            'turn:[2404:6800:4008:C03::7F]:19305?transport=tcp'
                        ],
                        username: 'CJCN7/gFEgbCINTfocYYzc/s6OMTIICjBQ'
                    }
                ]
            });
            // this.peers[id].addStream(this.stream)
            _stream.getTracks().forEach(async track => {
                // console.log(`track ->`, track);
                try {
                    await peers[id].addTrack(track, _stream);
                } catch (e) {
                    console.log(`error ->`, e);
                }
            });
            // console.log(id, peers[id]);

            if (streamMode) {
                peers[id].addEventListener("track", e => {
                    let remoteStream = new MediaStream();
                    // console.log(`gotRemoteStream ->`, e);
                    remoteStream.addTrack(e.track, remoteStream);
                    let _div = window.document.createElement("div");
                    _div.setAttribute("id", id);
                    let _video = window.document.createElement("video");
                    let _canvas = window.document.createElement("canvas");
                    _video.setAttribute("autoplay", `autoplay`);
                    _div.appendChild(_video);
                    _div.appendChild(_canvas);
                    document.getElementById("remote_users").appendChild(_div);

                    _video.srcObject = remoteStream;
                    getImages(peers[id], id, _video, _canvas);
                });
            }

            peers[id]
                .createOffer({
                    offerToReceiveVideo: 1,
                    offerToReceiveAudio: 1
                })
                .then(offer => {
                    // console.log("offer ->", offer);
                    return peers[id].setLocalDescription(offer).then(() => {
                        // console.log("setLocalDescription ok!");
                        // console.log("offer", offer);
                        _remoteSocket.emit("remote_peer", id, offer);
                    });
                })
                .catch(e => {
                    console.error(e);
                });

            peers[id].onicecandidate = event => {
                // console.log(`candidate ->`, event.candidate);
                if (event.candidate) {
                    // cb('ice', event.candidate)
                    _remoteSocket.emit("remote_ice", id, event.candidate);
                }
            };
        });

        _remoteSocket.on("ice", function(id, ice, cb) {
            peers[id].addIceCandidate(new RTCIceCandidate(ice));
            // console.log(`ice ->`, ice);
            // peers[id].onicecandidate = function(event) {
            //     if (event.candidate) {
            //         // cb(event.candidate)
            //         // yourConnection.addIceCandidate(new
            //         // RTCIceCandidate(event.candidate));
            //         _remoteSocket.emit('remote_ice', id, event.candidate)
            //     }
            // }
        });

        _remoteSocket.on("answer", function(id, answer) {
            peers[id]
                .setRemoteDescription(new RTCSessionDescription(answer))
                .then(() => {
                    console.log("setRemoteDescription ok!");
                    // let r = this.peers[id].addStream(this.stream)
                })
                .catch(e => {
                    console.error(e);
                });
        });

        _remoteSocket.on("twilio", function(token, roomName, cb) {
            console.log(`twilio ->`, token, roomName)
            Twilio.Video.connect(token, {
                name: roomName,
                tracks: [new Twilio.Video.LocalVideoTrack(_stream.getTracks()[0])]
            }).then(room => {
                twilio = room
                cb(null, room)
            }).catch(err => {
                cb(err, null)
            });
        })

        _remoteSocket.on("twilioClose", function() {
            twilio.disconnect()
            twilio = null
        })

        _remoteSocket.on("connect", () => {
            console.log("connect");
            remoteSocketUse = true;
            _remoteSocket.emit("server", _c => {
                Zoom = _c.zoom;
            });
        });

        _remoteSocket.on("disconnect", () => {
            remoteSocketUse = false;
            // remoteSocket = null;
        });

        // remoteSocket = _remoteSocket;

        // })  remote end
    } catch (e) {
        console.log(e);
        return null;
    }
}

function getImages(peer, id, video, canvas) {
    let _this = this;
    canvas.width = 640; //video.videoWidth
    canvas.height = 480; //video.videoHeight
    let ctx = canvas.getContext("2d");
    console.log(video.videoWidth, video.videoHeight);
    let i;
    video.addEventListener(
        "play",
        function() {
            let w = 640; //video.videoWidth //640
            let h = 480; //w / video.videoWidth * video.videoHeight
            canvas.width = w; //video.videoWidth
            canvas.height = h; //video.videoHeight
            i = window.setInterval(function() {
                ctx.drawImage(video, 0, 0, w, h);
            }, 10);
        },
        false
    );
    video.addEventListener(
        "pause",
        function() {
            window.clearInterval(i);
        },
        false
    );
    video.addEventListener(
        "ended",
        function() {
            clearInterval(i);
        },
        false
    );

    const getImage = () => {
        // console.log(`this.peers[id] ->`, peers[id].connectionState);
        if (peer.connectionState !== "disconnected") {
            let t = new Date().getTime();
            canvas.toBlob(
                function(image) {
                    if (image) remoteSocket.emit("image", image, id);
                    // console.log(id, `Get image ->`, new Date().getTime() - t);
                    setTimeout(getImage, 10);
                    //getImage()
                },
                "image/jpeg",
                0.5
            );
        } else {
            document.getElementById(id).remove();
        }
    };

    getImage();
}

$(window).resize(function() {
    $("body").css("zoom", $(window).width() / 1920);
});

$("body").css("zoom", $(window).width() / 1920);


// twilio-video

// const { connect, createLocalTracks } = Twilio.Video;
// const $TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTSzQyNmJlZWUzNzljMTYyZDk0Y2RmOTAzYzYwNjNkNjA1LTE2MjA3MTc2NTMiLCJncmFudHMiOnsiaWRlbnRpdHkiOiIzMjExIiwidmlkZW8iOnsicm9vbSI6IjMyMSJ9fSwiaWF0IjoxNjIwNzE3NjUzLCJleHAiOjE2MjA3MjEyNTMsImlzcyI6IlNLNDI2YmVlZTM3OWMxNjJkOTRjZGY5MDNjNjA2M2Q2MDUiLCJzdWIiOiJBQzdlNjM3ZTE1ZWRkNjljZjY4YmRjMzFmZjkxMjc4ZDEyIn0.1dgZLptn8qr10frklUDSmrveXyrOZSusC405-z7ja5c"
// // connect("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS2IyOTE3MTlmOGQwYTQyMmE2YmNiNDViOTEyMjE1NTA5LTE2MjA3MDcyNjAiLCJpc3MiOiJTS2IyOTE3MTlmOGQwYTQyMmE2YmNiNDViOTEyMjE1NTA5Iiwic3ViIjoiQUM3ZTYzN2UxNWVkZDY5Y2Y2OGJkYzMxZmY5MTI3OGQxMiIsImV4cCI6MTYyMDcxMDg2MCwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiMTIzIiwidmlkZW8iOnsicm9vbSI6IjEyMyJ9fX0.d6wGQM6WKC_w8o6v4KIi_bbBCohqdoPY00uajCFGdOA", { name: "existing-room" }).then(
// //     (room) => {
// //         console.log(`Successfully joined a Room: ${room}`);
// //         room.on("participantConnected", (participant) => {
// //             console.log(`A remote Participant connected: ${participant}`);
// //         });
// //     },
// //     (error) => {
// //         console.error(`Unable to connect to Room: ${error.message}`);
// //     }
// // );
//
// // Option 1
// createLocalTracks({
//     audio: true,
//     video: { width: 640 }
// }).then(localTracks => {
//     console.log(`localTracks ->`, localTracks)
//     return connect($TOKEN, {
//         name: 'my-room-name',
//         tracks: localTracks
//     });
// }).then(room => {
//     console.log(`ROOM ->`, room)
//     console.log(`Connected to Room: ${room.name}`);
// });
