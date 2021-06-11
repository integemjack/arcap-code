import App from "./App.vue";
import router from "./router";

import "./plugins/qrcode";
import "./plugins/elementUI";

new Vue({
	el: "#app",
	router,
	template: "<App/>",
	components: { App },
	data: {
		ardata: null,
		scenes: []
	}
});
