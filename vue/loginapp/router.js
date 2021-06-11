import Vue from "vue";
import Router from "vue-router";
import Login from "./components/Login.vue";
import Confirm from "./components/Confirm.vue";
import Start from "./components/Start.vue";
import Settings from "./components/Settings.vue";
import Admin from "./components/Admin.vue";
import Agreement from "./components/Agreement.vue";
import ARImage from "./components/ARImage.vue";
import Scan from "./components/Scan.vue";
import Scenes from "./components/Scenes.vue";
import PreviewScene from "./components/PreviewScene.vue";
import Photos from "./components/photos.vue";
import PhotoList from "./components/photoList.vue";
import BarCode from "./components/Barcode.vue";

Vue.use(Router);

export default new Router({
	routes: [
		{
			path: "/",
			name: "scenes",
			component: Scenes
		},
		{
			path: "/preview-scene",
			name: "preview-scene",
			props: route => route.query,
			component: PreviewScene
		},
		{
			path: "/login",
			name: "login",
			props: route => route.query,
			component: Login
		},
		{
			path: "/confirm",
			name: "confirm",
			props: route => route.query,
			component: Confirm
		},
		{
			path: "/agreement",
			name: "agreement",
			props: route => route.query,
			component: Agreement
		},
		{
			path: "/start",
			name: "start",
			props: route => route.query,
			component: Start
		},
		{
			path: "/admin",
			name: "admin",
			component: Admin
		},
		{
			path: "/setting",
			name: "setting",
			component: Settings
		},
		{
			path: "/images",
			name: "images",
			component: ARImage
		},
		{
			path: "/photos",
			name: "photos",
			props: route => route.query,
			component: Photos
		},
		{
			path: "/photos/:id",
			name: "photoList",
			props: route => route.query,
			component: PhotoList
		},
		{
			path: "/scan",
			name: "scan",
			props: route => route.query,
			component: Scan
		},
		{
			path: "/barcode",
			name: "barcode",
			props: route => route.query,
			component: BarCode
		}
	]
});
