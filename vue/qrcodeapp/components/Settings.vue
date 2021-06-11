<template>
    <div id="setting" class="setting">
        <div class="head">
            <a id="setting-config" class="on">Configuration</a>
            <a id="setting-email">Email content</a>
            <a id="setting-process">Process</a>
        </div>
        <div class="content">
            <div id="setting-config" class="content-main on">
                <ul class="setting">
                    <li>
                        <label>Debug Mode</label>
                        <input type="hidden" id="set-debug" v-model="config.debug" />
                        <div :class="['radio', config.debug ? 'on' : '']">
                            <span @click="config.debug = !config.debug"></span>
                        </div>
                    </li>
                    <li>
                        <label>Folder of Stage Config</label>
                        <input class="max" id="set-theme" value="" v-model="config.theme" />
                    </li>
                    <li>
                        <label>Place to save data</label>
                        <input class="max" id="set-theme" value="" v-model="config.storage" />
                    </li>
                    <hr/>

                    <h2>Devices</h2>
                    <li>
                        <label>Audio Device</label>
                        <select class="max" v-model="config.device.audioDeviceId">
                            <option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">{{device.label}}</option>
                        </select>
                    </li>
                    <li>
                        <label>Video Device</label>
                        <select class="max" v-model="config.device.videoDeviceId">
                            <option v-for="device in videoDevices" :value="device.deviceId" :key="device.deviceId">{{device.label}}</option>
                        </select>
                    </li>
                    <hr/>

                    <h2>Send info to internet</h2>
                    <li>
                        <label>Photo</label>
                        <input type="hidden" id="set-photo" value="false" v-model="config.online.photo" />
                        <div :class="['radio', config.online.photo ? 'on' : '']">
                            <span @click="config.online.photo = !config.online.photo"></span>
                        </div>
                    </li>
                    <li>
                        <multiselect v-model="photoMode" :multiple="true" :disabled="!config.online.photo" placeholder="" :options="['Upload to MyAR', 'Email to user']"></multiselect>
                    </li>
                    <li>
                        <label>Video</label>
                        <input type="hidden" id="set-video" value="true" v-model="config.online.video" />
                        <div :class="['radio', config.online.video ? 'on' : '']">
                            <span @click="config.online.video = !config.online.video"></span>
                        </div>
                    </li>
                    <li>
                        <multiselect v-model="videoMode" :multiple="true" :disabled="!config.online.video" placeholder="" :options="['Upload to MyAR', 'Email to user']"></multiselect>
                    </li>
                    <li>
                        <label>Video hosting</label>
                        <select class="max" v-model="config.email.video.mode" :disabled="!config.online.video">
                            <option value="youku">Youku</option>
                            <option value="vimeo">Vimeo</option>
                            <option value="none">None</option>
                        </select>
                    </li>
                    <hr/>

                    <li>
                        <label>MP4 Conversion</label>
                        <input type="hidden" id="set-ffmpeg" value="true" v-model="config.email.video.ffmpeg" />
                        <div :class="['radio', config.email.video.ffmpeg ? 'on' : '']">
                            <span @click="config.email.video.ffmpeg = !config.email.video.ffmpeg"></span>
                        </div>
                    </li>
                    <li>
                        <label>Background Music</label>
                        <input class="max" id="set-music" value="" v-model="config.email.video.music" />
                    </li>
                    <li>
                        <label>Voice after conversion</label>
                        <select class="max" id="voice" v-model="config.email.video.voiceMode">
                            <option value="Background music only" selected>Background music only</option>
                            <option value="Original voice only">Original voice only</option>
                            <option value="Retain both">Retain both</option>
                        </select>
                    </li>
                    <li>
                        <label>Size</label>
                        <select class="max" id="set-size" v-model="config.email.video.size">
                            <option value="1920*1080" selected>1920 * 1080</option>
                            <option value="1280*720">1280 * 720</option>
                        </select>
                    </li>
                    <h2>Video Format</h2>
                    <li>
                        <label>Codec</label>
                        <select class="max" id="set-codec" v-model="config.capture.codecs">
                            <option value="vp8" selected>vp8</option>
                            <option value="vp9">vp9</option>
                            <option value="h264">h264</option>
                        </select>
                    </li>
                    <li>
                        <label>Video Bitrate</label>
                        <select class="max" id="set-vbitrate" v-model="config.capture.videoBitrate">
                            <option value="2500000" selected>2500000</option>
                            <option value="3000000">3000000</option>
                        </select>
                    </li>
                    <li>
                        <label>Audio Bitrate</label>
                        <select class="max" id="set-abitrate" v-model="config.capture.audioBitrate">
                            <option value="128000" selected>128000</option>
                            <option value="192000">192000</option>
                        </select>
                    </li>
                    <hr/>

                    <h2>System Email Setup</h2>
                    <li>
                        <label>Restart time</label>
                        <input class="min" id="set-restart" value="" v-model="config.email.email.restart" />
                        <span>seconds</span>
                    </li>
                    <li>
                        <label>Delay</label>
                        <input class="min" id="set-delay" value="" v-model="config.email.email.delay" />
                        <span>seconds</span>
                    </li>
                    <li>
                        <label>System email service provider</label>
                        <input class="max" id="set-email-service" value="" v-model="config.email.email.service" />
                    </li>
                    <li>
                        <label>Username</label>
                        <input class="max" id="set-email-username" value="" v-model="config.email.email.username" />
                    </li>
                    <li>
                        <label>Password</label>
                        <input class="max" id="set-email-password" value="" v-model="config.email.email.password" />
                    </li>
                    <li>
                        <label>Port</label>
                        <input class="min" id="set-email-port" value="" v-model="config.email.email.port" />
                    </li>
                    <li>
                        <label>Secure connection</label>
                        <input type="hidden" id="set-secure" value="true" v-model="config.email.email.secureConnection" />
                        <div :class="['radio', config.email.email.secureConnection ? 'on' : '']">
                            <span @click="config.email.email.secureConnection = !config.email.email.secureConnection"></span>
                        </div>
                    </li>
                    <li>
                        <label>Reply to</label>
                        <input class="max" id="set-email-replyto" value="" v-model="config.email.email.replyTo" />
                    </li>
                    <hr/>

                    <h2>Admin panel</h2>
                    <li>
                        <label>Password to log in</label>
                        <input class="max" id="set-email-password-login" value="" v-model="config.password" />
                    </li>
                    <hr/>

                    <h2>Vimeo setup</h2>
                    <li>
                        <label>App ID</label>
                        <input class="max" id="set-vimeo-id" value="" v-model="config.email.vimeo.appid" />
                    </li>
                    <li>
                        <label>App Secrete key</label>
                        <input class="max" id="set-vimeo-key" value="" v-model="config.email.vimeo.appsecret" />
                    </li>
                    <li>
                        <label>Token</label>
                        <input class="max" id="set-vimeo-token" value="" v-model="config.email.vimeo.token" />
                    </li>

                    <h2>Youku setup</h2>
                    <li>
                        <label>Client ID</label>
                        <input class="max" id="set-youku-client-id" value="" v-model="config.email.youku.client_id" />
                    </li>
                    <li>
                        <label>Client Secret</label>
                        <input class="max" id="set-youku-client-secret" value="" v-model="config.email.youku.client_secret" />
                    </li>
                    <li>
                        <label>Access Token</label>
                        <input class="max" id="set-youku-access-token" value="" v-model="config.email.youku.access_token" />
                    </li>
                    <li>
                        <label>Refresh Token</label>
                        <input class="max" id="set-youku-refresh-token" value="" v-model="config.email.youku.refresh_token" />
                    </li>
                </ul>
                <div class="foot">
                    <router-link to="/">
                        <button class="cancel">Exit</button>
                    </router-link>
                    <button class="save" @click="save">Save</button>
                </div>
            </div>
            <div id="setting-email" class="content-main">
                <ul class="setting">
                    <li>
                        <label>Email For Photo:</label>
                        <textarea class="max" id="set-photo-txt" v-model="photoTemplate"></textarea>
                    </li>
                    <li>
                        <label>Email For Video</label>
                        <textarea class="max" id="set-video-txt" v-model="videoTemplate"></textarea>
                    </li>
                </ul>
                <div class="foot">
                    <router-link to="/">
                        <button class="cancel">Exit</button>
                    </router-link>
                    <button class="save" @click="save">Save</button>
                </div>
            </div>
            <div id="setting-process" class="content-main">
                <div class="mid">
                    <button class="process" @click="process" :disabled="processing">{{processing ? 'Processing...' : 'Process'}}</button>
                </div>
            </div>
        </div>

        <div class="alertBox" v-if="alertBox.show"><div>{{alertBox.text}}</div></div>
    </div>
</template>

<script>
    import Multiselect from 'vue-multiselect'

    export default {
        name: 'Settings',
        components: {
            Multiselect
        },
        data() {
            return {
                socket: io("/QRcode"),
                processing: false,
                videoTemplate: '',
                photoTemplate: '',
                photoMode: null,
                videoMode: null,
                audioDevices: [],
                videoDevices: [],
                alertBox: {
                    timerId: null,
                    text: '',
                    show: false
                },
                config: {
                    "debug": true,
                    "storage": "",
                    "password": "",
                    "device": {
                        "audioDeviceId": '',
                        "videoDeviceId": ''
                    },
                    "online": {
                        "photo": false,
                        "video": false
                    },
                    "capture": {
                        "codecs": "vp8",
                        "videoBitrate": 3000000,
                        "audioBitrate": 128000
                    },
                    "email": {
                        "photo": {
                            "upload": true,
                            "email": true
                        },
                        "video": {
                            "mode": "none",
                            "music": "",
                            "ffmpeg": false,
                            "size": "1920*1080",
                            "upload": false,
                            "email": false,
                            "voiceMode": 'Background music only'
                        },
                        "email": {
                            "restart": 3,
                            "delay": 2.718,
                            "service": "",
                            "username": "",
                            "password": "",
                            "port": 587,
                            "secureConnection": true,
                            "replyTo": ""
                        },
                        "vimeo": {
                            "appid": "",
                            "appsecret": "",
                            "token": ""
                        },
                        "youku": {
                            "client_id": "",
                            "client_secret": "",
                            "access_token": "",
                            "refresh_token": ""
                        }
                    },
                    "theme": "",
                },
            };
        },
        methods: {
            alert(txt) {
                this.alertBox.text = txt;
                let show = this.alertBox.show;
                if(show) clearTimeout(this.alertBox.timerId);

                this.alertBox.show = true;
                this.alertBox.timerId = setTimeout(() => {
                    this.alertBox.show = false;
                }, 3000);
            },
            save() {
                console.log("Save configuration");

                this.config.email.photo.upload = (this.photoMode.indexOf('Upload to MyAR') >= 0);
                this.config.email.photo.email = (this.photoMode.indexOf('Email to user') >= 0);
                this.config.email.video.upload = (this.videoMode.indexOf('Upload to MyAR') >= 0);
                this.config.email.video.email = (this.videoMode.indexOf('Email to user') >= 0);

                this.socket.emit('configSet', {
                    config: this.config,
                    photo: this.photoTemplate,
                    video: this.videoTemplate
                });

                this.alert('Setting is saved successfully!');
            },
            process() {
                this.processing = true;

                this.socket.emit('processData', (err) => {
                    if (err) {
                        // Only one reason to go here:
                        //  It is already processing.
                        console.error(err);
                    }
                });
            },
        },
        mounted() {
            if (!localStorage.getItem("admin") || localStorage.getItem("admin") !== "1") this.$router.push({
                name: "Admin"
            });

            // Initial tabs
            $('#setting div.head a').click(function () {
                $('#setting div.head a').removeClass('on');
                var id = $(this).attr('id');
                $(this).addClass('on');
                $('#setting div.content').children('div').removeClass('on');
                $('#setting div.content div#' + id).addClass('on');
            });

            this.socket.emit('getDevices', (err, devices) => {
                if (err) {
                    return console.error(err);
                }
                console.log(devices);
                this.audioDevices = devices.filter(d => d.kind === 'audioinput');
                this.videoDevices = devices.filter(d => d.kind === 'videoinput');
            });

            // Load configuration
            this.socket.emit('configGet', (err, data) => {
                if (err) {
                    return console.error(err);
                }
                this.config = data.config;
                this.photoTemplate = data.photo;
                this.videoTemplate = data.video;

                this.photoMode = [];
                if (this.config.email.photo.upload) {
                    this.photoMode.push('Upload to MyAR');
                }
                if (this.config.email.photo.email) {
                    this.photoMode.push('Email to user');
                }

                this.videoMode = [];
                if (this.config.email.video.upload) {
                    this.videoMode.push('Upload to MyAR');
                }
                if (this.config.email.video.email) {
                    this.videoMode.push('Email to user');
                }
            });

            this.socket.on('serverState', (state) => {
                console.log('Server state:', state);
                if (state.processorState) {
                    this.processing = (state.processorState !== 'idle');
                }
            });
        },
        destroyed() {
            if (this.socket) {
                this.socket.close();
            }
        }
    }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style>
    .multiselect__tag {
        background-color: rgb(119, 172, 34);
    }
</style>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div.alertBox {
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    text-align: center;
}

div.alertBox > div {
    display: inline-block;
    background: rgb(119, 172, 34);
    border: 1px solid green;
    color: #fff;
    padding: 10px;
    border-radius: 3px;
}
</style>