<template>
	<div id="main" class="main" style="padding: 150px 0px 0px;">
		<div class="logo">
			<a href="#" @click="home">
				<img src="/image/logo.png">
			</a>
		</div>

		<ul>
			<li>
				<img :src="theme | image"/>
				<p>{{theme.description}}</p>
			</li>
			<li>
				<router-link :to="{path: '/themes/add', query: {theme: JSON.stringify(theme)}}">
					<button class="edit">EDIT</button>
				</router-link>
				<a>
					<button class="add" @click="add">ADD</button>
				</a>
				<br/>
			</li>
		</ul>

	</div>
</template>

<script>
import path from "path";

export default {
	name: "add-verify",
	props: {
		theme: {
			type: String,
			default: '{"name":"","location":"","description":"","thumbnail":""}'
		}
	},
	mounted: function() {
		console.log(this.theme);
		this.theme = JSON.parse(this.theme);
		console.log(this.theme);
	},
	filters: {
		image: function(theme) {
			let thumbnail = theme.thumbnail;
			if (/^\.[\/\\]?/i.test(thumbnail)) {
				thumbnail = path.join(theme.location, thumbnail.split(/^\.[\/\\]?/)[1]);
			}
			return `/image/?url=${encodeURI(thumbnail)}`;
		}
	},
	computed: {
		domain: function() {
			return "https://" + document.domain + ":2012/";
		}
	},
	methods: {
		home() {
			if(localStorage.getItem("from") && localStorage.getItem("from") === '2012') {
				location.href = this.domain;
			} else {
				location.href = `/`;
			}
		},
		add: function() {
			console.log(this.theme);
			if (!this.theme.tag || this.theme.tag.length === 0) {
				alert("Must have at least one tag.");
				return;
			}
			this.$http
				.post("/theme", { theme: this.theme })
				.then(res => {
					this.$router.push({ name: "Themes" });
				})
				.catch(err => {
					this.$router.push({ name: "Themes" });
				});
		}
	}
};
</script>

<style scoped>
ul {
	max-width: 800px;
	margin: auto;
}

ul h1 {
	margin-bottom: 30px;
}

ul li {
	margin-bottom: 20px;
	text-align: center;
}

ul li img {
	max-width: 800px;
}

ul li label {
	display: block;
	width: 100%;
}

ul li input {
	padding: 5px 0;
	border: none;
	border-bottom: 2px #ccc solid;
	display: block;
	width: 100%;
	outline: none;
}

ul li a {
	display: -webkit-box;
	display: -ms-flexbox;
	display: flex;
	float: left;
	width: 50%;
	padding: 10px;
}

ul li a button {
	border: 3px solid rgb(15, 117, 189);
}

ul li a:first-child button {
	background: #fff;
	color: rgb(15, 117, 189);
}

br {
	clear: both;
}
</style>
