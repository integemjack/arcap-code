import Vue from "vue";
import Router from "vue-router";
import Index from "./components/index.vue";
import Reg from "./components/Reg.vue";
import Confirm from "./components/Confirm.vue";
import QRcode from "./components/QRcode.vue";
import Agreement from "./components/Agreement.vue";
import Admin from "./components/Admin.vue";
import Setting from "./components/Settings.vue";
import Manager from "./components/Manager.vue";

import BarCode from "./components/barcode.vue";

import Themes from "./components/themes/manager.vue";
import ThemesAdd from "./components/themes/add.vue";
import ThemesAddVerify from "./components/themes/addVerify.vue";

import axios from "axios";

Vue.prototype.$http = axios;

Vue.use(Router);

import {
    Button,
    Input,
    Table,
    TableColumn,
    Progress,
    Upload
} from "element-ui";
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(Button);
Vue.use(Input);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Progress);
Vue.use(Upload);

export default new Router({
    routes: [{
            path: "/admin",
            name: "Admin",
            component: Admin
        },
        {
            path: "/",
            name: "Index",
            component: Index
        },
        {
            path: "/reg",
            name: "Reg",
            component: Reg
        },
        {
            path: "/confirm",
            name: "Confirm",
            props: route => route.query,
            component: Confirm
        },
        {
            path: "/qrcode",
            name: "QRcode",
            props: route => route.query,
            component: QRcode
        },
        {
            path: "/agreement",
            name: "Agreement",
            props: route => route.query,
            component: Agreement
        },
        {
            path: "/manager",
            name: "Manager",
            component: Manager
        },
        {
            path: "/themes",
            name: "Themes",
            component: Themes
        },
        {
            path: "/themes/add",
            name: "addTheme",
            props: route => route.query,
            component: ThemesAdd
        },
        {
            path: "/themes/addVerify",
            name: "addThemeVerify",
            props: route => route.query,
            component: ThemesAddVerify
        },
        {
            path: "/setting",
            name: "Setting",
            component: Setting
        },
        {
            path: "/barcode",
            name: "BarCode",
            component: BarCode
        }
    ]
});
