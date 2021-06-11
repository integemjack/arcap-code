<template>
  <div id="main" class="main login">
    <div class="logo">
      <router-link to="/">
        <img src="/image/logo.png" />
      </router-link>
    </div>
    <div class="admin">
      <a @click="$router.push({path: '/photos'})">
        <img src="/image/image.png" title="Your Images" />
      </a>
      <a href="javascript:void(0);" @click="logout">
        <img src="/image/logout.png" title="Logout" />
      </a>
      <popover ref="volumepopover" placement="bottom" trigger="click">
        <div style="width:300px">
          <img
            @click="toggleVolume"
            :src="'/image/'+(volume?'volume.png':'mute.png')"
            width="36px"
            height="36px"
            style="float:left"
          />
          <slider
            v-model="volume"
            @change="onVolumeChange"
            style="width:230px; position:relative; left:50px"
          ></slider>
        </div>
      </popover>
      <div v-popover:volumepopover class="volume" style="display: inline-block; position: unset;">
        <img src="/image/volume.png" />
      </div>
      <a @click="toggleLight">
        <img v-if="light" src="/image/light-off.png" />
        <img v-if="!light" src="/image/light-on.png" />
      </a>
      <a @click="toggleRecordAll">
        <img v-if="recordAll" src="/image/recordAll-on.png" />
        <img v-if="!recordAll" src="/image/recordAll-off.png" />
      </a>
      <a :href="domain" target="_blank">
        <img src="/image/settings.png" />
      </a>
    </div>

    <div class="content">
      <div class="info">{{info}}</div>
      <button id="start" @click="start" :disabled="!clickable">{{btnText}}</button>
    </div>
  </div>
</template>

<script>
import { Popover, Slider } from "element-ui";

export default {
  name: "Start",
  components: { Popover, Slider },
  props: ["theme", "name", "email", "autostart"],
  data() {
    return {
      socket: io("/login"),
      light: true,
      clickable: false,
      info: "",
      sequenceId: null,
      volume: 50,
      btnText: "START",
      domain: "",
      recordAll: false
    };
  },
  methods: {
    start() {
      this.clickable = false;
      this.startable = false;
      this.login = true;
      if (this.btnText === "START") {
        this.clickable = false;

        // localStorage.setItem('lastUser', JSON.stringify({ name: this.name, email: this.email }));
        let lastUser = JSON.parse(localStorage.getItem("lastUser") || "{}");
        console.log(lastUser);
        let userInfo = JSON.parse(localStorage.getItem("userInfo") || null);
        console.log(userInfo);
        this.socket.emit(
          "loginStart",
          {
            name: this.name || lastUser.name || "",
            email: this.email || lastUser.email || "",
            theme: this.theme,
            userInfo: userInfo
          },
          (err, sid) => {
            if (err) {
              // Re-enable button if it is not start
              this.clickable = true;
              this.sequenceId = null;
              console.error(err);
            } else {
              this.sequenceId = sid;
              console.log("Sequence Id", this.sequenceId);
            }
          }
        );
      } else if (this.btnText === "STOP") {
        console.log("Execute stopAR");
        this.socket.emit("stop");
      }
    },
    logout() {
      localStorage.removeItem("lastUser");
      localStorage.removeItem("userInfo");
      // this.$router.push({ path: "/login" });
      location.href = "/";
    },
    toggleLight() {
      this.socket.emit("toggleLight");
    },
    toggleRecordAll() {
      this.socket.emit("toggleRecordAll");
    },
    toggleVolume() {
      if (this.volume === 0) {
        this.volume = 100;
      } else {
        this.volume = 0;
      }
      this.onVolumeChange();
    },
    onVolumeChange() {
      this.socket.emit("volume", this.volume);
    }
  },
  mounted() {
    // 是否登陆
    if (localStorage.getItem("lastUser")) {
      try {
        JSON.parse(localStorage.getItem("lastUser"));
      } catch (e) {
        localStorage.removeItem("lastUser");
        localStorage.removeItem("userInfo");
        this.$router.push({ path: "/login" });
      }
    } else {
      this.$router.push({ path: "/login" });
    }

    this.domain = "http://" + document.domain + ":2018/";

    this.socket.on("arPhoto", ardata => {
      console.log("Photos:", ardata);
      this.$root.$data.ardata = ardata;
    });

    this.socket.on("serverState", state => {
      console.log("Server state:", state);
      if (state.arState && state.arState.light) {
        if (state.arState.light === "on") {
          this.light = true;
        } else if (state.arState.light === "off") {
          this.light = false;
        }
      }

      if (state.arState && state.arState.recordAll) {
        if (state.arState.recordAll === "on") {
          this.recordAll = true;
        } else if (state.arState.recordAll === "off") {
          this.recordAll = false;
        }
      }

      if (state.arState && state.arState.volume !== undefined) {
        this.volume = state.arState.volume;
      }

      if (state.arState && state.arState.state) {
        this.clickable = state.arState.state === "idle";
        switch (state.arState.state) {
          case "idle":
            this.clickable = false;
            if (this.sequenceId) {
              setTimeout(() => {
                this.clickable = true;
                this.btnText = "START";
                this.info = "";
                this.$router.push({ name: "scenes" });
              }, 3000);
            } else {
              this.clickable = true;
              this.btnText = "START";
              this.info = "";
              if (this.autostart) {
                this.start();
              }
            }
            break;
          case "starting":
            this.btnText = "START";
            if (this.sequenceId === state.arState.sid) {
              this.info = "Starting...";
            } else {
              this.info = "Somebody is using it.";
            }
            break;
          case "started":
            this.btnText = "STOP";
            this.clickable = true;
            if (this.sequenceId === state.arState.sid) {
              this.info = "HAVE FUN";
            } else {
              this.info = "Somebody is using it.";
            }
            break;
          case "stopping":
            this.btnText = "STOP";
            this.info = "Stopping...";
            break;
          case "done":
            this.btnText = "STOP";
            this.info = "Finishing...";
            break;
          case "unavailable":
            this.info = "AR machine unavailable.";
            break;
        }

        this.autostart = false;
      }
    });
  },
  destroyed() {
    if (this.socket) {
      this.socket.close();
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style src="element-ui/lib/theme-chalk/index.css"></style>
<style scoped>
</style>
