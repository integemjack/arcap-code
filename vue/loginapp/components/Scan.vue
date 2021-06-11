<template>
<div id="agreement" class="login">
    <div class="logo">
        <router-link to="/">
            <img src="/image/logo.png" />
        </router-link>
    </div>
    <ul>
        <li>
            <video id="preview" playsInline></video>
        </li>
        <li>
            <p>&nbsp;</p>
        </li>
    </ul>
</div>
</template>

<script>
export default {
    name: 'Scan',
    props: ['theme'],
    data () {
        return {
            socket: io('/login'),
            scanner: null
        }
    },
    created () {
        let instascan = document.createElement('script');
        instascan.setAttribute('src', '/thirdparty/js/instascan.js');
        document.head.appendChild(instascan);
        instascan.onload = () => {
            this.scanner = new Instascan.Scanner({ video: document.getElementById('preview'), scanPeriod: 5, mirror: false });
            this.scanner.addListener('scan', (code, image) => {
                this.socket.emit('getByQRCode', code, (err, user) => {
                    if (err) {
                        alert('Cannot recognize code!');
                        return console.error(err);
                    }

                    localStorage.setItem("lastUser", JSON.stringify({name: user.name||user["Name"]||user["first name"]||user["First Name"], email: user.email||user["Email"]}));
                    localStorage.setItem("userInfo",JSON.stringify(user));
                    this.$router.push({path: '/'});
                });
            });
            Instascan.Camera.getCameras().then(cameras => {
                this.socket.emit('log', cameras);
                let cam;
                if(cameras.length >= 2) {
                    cam = cameras[1];
                } else {
                    cam = cameras[0];
                }

                this.socket.emit('log', navigator.userAgent);
                if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
                    // Fix: use rear camera in iOS
                    cam._constraints.video.facingMode = 'environment';
                }
                this.scanner.start(cam);
            }).catch(e => {
                console.error(e);
            });
        }
    },
    destroyed () {
        if (this.scanner) {
            this.scanner.stop();
            this.scanner = null;
        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    div.logo {
        z-index: 1;
    }
    #preview {
        position: fixed;
        margin: auto;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background: #000;
        width: 100%;
        height: 100%;
    }
</style>
