<template>
    <div id="scenes" class="login">
        <div class="logo">
            <router-link to="/">
                <img src="/image/logo.png"/>
            </router-link>
        </div>

        <div class="admin">
            <div>
                <qriously v-if="address" class="qrcode"
                          :value="`${address}?user=${encodeURIComponent(JSON.stringify(lastUser))}`" :size="100"/>
            </div>
        </div>

        <ul class="wrapper">
            <li class="box" v-for="(photo, index) in photos" :key="index" style="position: relative;">
                <img v-if="/\.jpg$/.test(photo.file)" class="photo" :src="photo.file" alt="">
                <video v-if="/\.webm$/.test(photo.file)" class="photo" :src="photo.file" controls="controls"></video>

                <div style="position: absolute; top: 5px; right: 5px;">
                    <ul>
                        <li v-if="isCreator(photo.file) && photo.status.message !== 'done'">
                            <el-button type="primary"
                                       title="Upload to creator.integem.com" @click="upload(photo)" :disabled="photo.status.success">{{photo.status.message}}
                            </el-button>
                        </li>
                        <li v-if="isCreator(photo.file) && photo.status.message === 'done'">
                            <el-button type="primary"
                                       title="Access to creator.integem.com" @click="pageId(photo.file)">Access
                            </el-button>
                        </li>
                        <li v-if="/\.webm$/.test(photo.file) && isCreator(photo.file) && photo.tomp4.message !== 'done'">
                            <el-button type="primary"
                                       title="Processing to mp4" @click="tomp4(photo)" :disabled="photo.tomp4.success">{{photo.tomp4.message}}
                            </el-button>
                        </li>
                        <li v-if="/\.webm$/.test(photo.file) && isCreator(photo.file) && photo.tomp4.message === 'done'">
                            <el-button type="primary"
                                       title="Processing to mp4" @click="openmp4(photo.file)">Open
                            </el-button>
                        </li>
                    </ul>


                </div>


                <!--<qriously v-if="/\.jpg$/.test(photo.remote)" class="qrcode" :value="photo.remote" :size="50"/>-->
            </li>
        </ul>

        <div class="pages">
            <button :class="{'no': page<=1, 'on': true, 'to': true}" :disabled="page<=1 && buttonOn" @click="page=1">
                &lt;&lt;
            </button>
            <button :class="{'no': page<=1, 'on': true, 'to': true}" :disabled="page<=1 && buttonOn"
                    @click="page=page-1">&lt;
            </button>

            <button :class="{'on': page===p}" v-for="p in pages" :key="p" :disabled="page===p && buttonOn"
                    @click="page=p">{{p}}
            </button>

            <button :class="{'no': page>=pages, 'on': true, 'to': true}" :disabled="page>=pages && buttonOn"
                    @click="page=page+1">&gt;
            </button>
            <button :class="{'no': page>=pages, 'on': true, 'to': true}" :disabled="page>=pages && buttonOn"
                    @click="page=pages">&gt;&gt;
            </button>
        </div>

    </div>
</template>

<script>
    export default {
        name: "photos",
        props: {
            user: {
                default: ""
            }
        },
        data: function () {
            return {
                socket: io("/login"),
                buttonOn: true,
                photos: [],
                address: "",
                page: 1,
                pageNumber: 6,
                pages: 1,
                lastUser: JSON.parse(localStorage.getItem("lastUser")),
                videoStatus: {}
            };
        },
        methods: {
            upload(photo) {
                // console.log(photo);
                this.socket.emit("processCreatorOne", photo.file, status => {
                    // console.log(status);
                    photo.status = status;
                    // console.log(photo.status);
                });
            },
            tomp4(photo) {
				// photo.tomp4 = false;
				this.socket.emit("processToMP4", photo.file, status => {
					// console.log(status);
					photo.tomp4 = status;
					// console.log(photo.status);
				});
            },
            isCreator(file) {
                let ids = file.split("_");
                return ids.length > 3;
            },
            pageId(file) {
                let ids = file.split("_");
                let id = ids.pop().split('.')[0];
                window.open(`https://creator.integem.com/api.php?do=page&postId=${id}`);
            },
            openmp4(file) {
            	// shell.showItemInFolder(`${file}.mp4`);
				this.socket.emit("open", file);
            }
        },
        watch: {
            "page": function (page) {
                this.buttonOn = false;
                this.socket.emit("getPhotos", this.lastUser.email, {
                    now: page,
                    number: this.pageNumber
                }, this.$route.params.id, photos => {
                    this.photos = photos.medias;
                    this.pages = photos.top;
                    this.buttonOn = true;
                });
            }
        },
        mounted: function () {
            console.log(this.$route);
            console.log(this.user, decodeURIComponent(this.user));
            if (this.user !== "") {
                this.lastUser = JSON.parse(decodeURIComponent(this.user));
            }
            // let lastUser = JSON.parse(localStorage.getItem("lastUser"));
            this.buttonOn = false;
            this.socket.emit("getPhotos", this.lastUser.email, {
                now: this.page,
                number: this.pageNumber
            }, this.$route.params.id, photos => {
                // console.log(photos);
                this.photos = photos.medias;
                this.pages = photos.top;
                this.address = photos.address;
                this.buttonOn = true;
                console.log(this.photos);
                // photos.medias.forEach(photo => {
                //     this.socket.emit("processCreatorOne", photo, false, status => {
                //         console.log(status);
                //         this.videoStatus[photo] = status
                //     })
                // })
            });
			this.socket.on("processVideoOk", file => {
				// console.log(file);
				this.photos.forEach(photo => {
					if( photo.file === file ) photo.status = {
						success: true,
						message: "done"
					}
				})
			})
			this.socket.on("processToMP4Ok", file => {
				// console.log(file);
				this.photos.forEach(photo => {
					if( photo.file === file ) photo.tomp4 = {
						success: true,
						message: "done"
					}
				})
			})
        }
    };
</script>

<style scoped>

    .admin {
        /*display: none;*/
    }

    .wrapper {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        grid-gap: 15px;
        background-color: #fff;
        color: #444;
        margin: auto;
        max-width: 100%;
    }

    @media (min-width: 600px) {
        .admin {
            display: block;
        }

        .wrapper {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-gap: 15px;
            background-color: #fff;
            color: #444;
            margin: auto;
            max-width: 100%;
        }
    }

    .box {
        background: white;
        text-decoration: none;
        color: #444;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        position: relative;
        border-radius: 5px;
        font-size: 150%;
    }

    .box .qrcode {
        position: absolute;
        right: 5px;
        top: 5px;
        background: #fff;
        border-radius: 3px;
        height: 50px;
    }

    .photo {
        width: 100%;
    }

    div.pages {
        text-align: center;
    }

    div.pages button {
        display: inline-block;
        background: #fff;
        border-radius: 3px;
        padding: 5px;
        color: #4898f8;
        margin: 5px;
        border: 1px solid #4898f8;
        cursor: pointer;
        font-size: 16px;
        line-height: 30px;
        height: 40px;
        min-width: 40px;
        text-align: center;
    }

    div.pages button.on {
        background: #4898f8;
        color: #fff;
        cursor: auto;
    }

    div.pages button.on.to {
        cursor: pointer;
    }

    div.pages button.no {
        background: #CCC;
        color: #fff;
        border-color: #ccc;
        cursor: auto;
    }
</style>
