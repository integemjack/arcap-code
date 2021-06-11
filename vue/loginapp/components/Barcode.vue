<template>
    <div id="agreement" class="login">
        <div class="logo">
            <router-link to="/">
                <img src="/image/logo.png"/>
            </router-link>
        </div>
        <ul>
            <li>
                <video id="preview" playsInline></video>
            </li>
            <li>
                <p>Result: &nbsp;{{code}}</p>
            </li>
        </ul>
    </div>
</template>

<script>
  import { BrowserBarcodeReader } from "@zxing/library";

  export default {
    name: "Barcode",
    props: ["theme"],
    data() {
      return {
        socket: io("/login"),
        scanner: null,
        code: ""
      };
    },
    watch: {
      code: val => {
        console.log(val);
      }
    },
    created() {

      // navigator.mediaDevices.getUserMedia({
      //   video: { facingMode: "environment" }
      // }).then(stream => {
      //   document.querySelector("#preview").srcObject = stream;
      //   document.querySelector("#preview").play();
      //
      //   // import('@zxing/library').then({ BrowserQRCodeReader } => {
      //
      //     const codeReader = new BrowserQRCodeReader();
      //     const img = document.getElementById('preview');
      //
      //     try {
      //       const result = await codeReader.decodeFromImage(img);
      //     } catch (err) {
      //       console.error(err);
      //     }
      //
      //     console.log(result);
      //
      //   // });
      //
      // }).catch(err => {
      //   console.log(err);
      // });

      const codeReader = new BrowserBarcodeReader();

      codeReader
        .listVideoInputDevices()
        .then(videoInputDevices => {
          videoInputDevices.forEach(device =>
            console.log(`${device.label}, ${device.deviceId}`)
          );

          codeReader
            .decodeFromInputVideoDevice(undefined, "preview")
            .then(result => {
              this.code = 1;
              this.code = result;
              console.log(result);
            })
            .catch(err => {
              console.error(err);
              this.code = err.message;
            });
        })
        .catch(err => console.error(err));


    },
    destroyed() {
      if (this.scanner) {
        this.scanner.stop();
        this.scanner = null;
      }
    }
  };
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
