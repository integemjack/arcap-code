<template>
    <div id="scenes" class="login">
        <div class="logo">
            <router-link to="/">
                <img src="/image/logo.png"/>
            </router-link>
        </div>

        <!--<div class="admin">-->
        <!--<div>-->
        <!--<qriously v-if="address" class="qrcode"-->
        <!--:value="`${address}?user=${encodeURIComponent(JSON.stringify(lastUser))}`" :size="100"/>-->
        <!--</div>-->
        <!--</div>-->

        <ul class="wrapper">
            <li class="box" v-for="(photo, index) in photos" :key="index">
                <router-link :to="{path: `/photos/${photo}`}">
                    <img v-if="/\.jpg$/.test(srcs[photo])" class="photo" :src="srcs[photo]" alt="">
                    <video v-if="/\.webm$/.test(srcs[photo])" class="photo" :src="srcs[photo]"
                           controls="controls"></video>
                    <!--<qriously v-if="/\.jpg$/.test(photo.remote)" class="qrcode" :value="photo.remote" :size="50"/>-->
                </router-link>
            </li>
        </ul>

        <!--<div class="pages">-->
        <!--<button :class="{'no': page<=1, 'on': true, 'to': true}" :disabled="page<=1 && buttonOn" @click="page=1">-->
        <!--&lt;&lt;-->
        <!--</button>-->
        <!--<button :class="{'no': page<=1, 'on': true, 'to': true}" :disabled="page<=1 && buttonOn"-->
        <!--@click="page=page-1">&lt;-->
        <!--</button>-->

        <!--<button :class="{'on': page===p}" v-for="p in pages" :key="p" :disabled="page===p && buttonOn"-->
        <!--@click="page=p">{{p}}-->
        <!--</button>-->

        <!--<button :class="{'no': page>=pages, 'on': true, 'to': true}" :disabled="page>=pages && buttonOn"-->
        <!--@click="page=page+1">&gt;-->
        <!--</button>-->
        <!--<button :class="{'no': page>=pages, 'on': true, 'to': true}" :disabled="page>=pages && buttonOn"-->
        <!--@click="page=pages">&gt;&gt;-->
        <!--</button>-->
        <!--</div>-->

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
		data: function() {
			return {
				socket: io("/login"),
				buttonOn: true,
				photos: [],
				srcs: [],
				address: "",
				page: 1,
				pageNumber: 6,
				pages: 1,
				lastUser: JSON.parse(localStorage.getItem("lastUser"))
			};
		},
		watch: {
			"page": function(page) {
				this.buttonOn = false;
				this.socket.emit("getPhotos", this.lastUser.email, {
					now: page,
					number: this.pageNumber
				}, "", photos => {
					this.photos = photos.medias;
					this.pages = photos.top;
					this.buttonOn = true;
				});
			}
		},
		mounted: function() {
			console.log(this.user, decodeURIComponent(this.user));
			if (this.user !== "") {
				this.lastUser = JSON.parse(decodeURIComponent(this.user));
			}
			// let lastUser = JSON.parse(localStorage.getItem("lastUser"));
			this.buttonOn = false;
			// this.socket.emit("getPhotos", this.lastUser.email, {
			// 	now: this.page,
			// 	number: this.pageNumber
			// }, "", photos => {
			// 	this.photos = photos.medias;
			// 	this.pages = photos.top;
			// 	this.address = photos.address;
			// 	this.buttonOn = true;
			// });
			this.socket.emit("getPhotoList", this.lastUser.email, {
				now: this.page,
				number: this.pageNumber
			}, photos => {
				this.photos = photos.lists;
				this.srcs = photos.medias;
				// this.pages = photos.top;
				// this.address = photos.address;
				this.buttonOn = true;
			});
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