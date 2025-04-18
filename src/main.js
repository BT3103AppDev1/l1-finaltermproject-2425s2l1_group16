import "./assets/main.css";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./firebase";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faThumbsUp, faFlag } from "@fortawesome/free-regular-svg-icons";
import {
    faSearch,
    faTrash,
    faGear,
    faPen,
} from "@fortawesome/free-solid-svg-icons";
import Toast, { POSITION } from "vue-toastification";
import "vue-toastification/dist/index.css";

/* add icons to the library */
library.add(faThumbsUp, faFlag, faSearch, faTrash, faGear, faPen);

const app = createApp(App);

// configure toast options
const toastOptions = {
    position: "top-center",
    timeout: 4500,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: "button",
    icon: true,
    rtl: false,
};

app.use(router);
app.use(Toast, toastOptions);
app.component("font-awesome-icon", FontAwesomeIcon);
app.mount("#app");
