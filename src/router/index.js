import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged} from "firebase/auth";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			redirect: "/dashboard",
		},
		{
			path: "/dashboard",
			name: "dashboard",
			component: () => import("../views/Dashboard.vue"),
			beforeEnter: (to, from, next) => {
				const auth = getAuth();
				onAuthStateChanged(auth, (user) => {
					if (user) {
						next();
					} else {
						next("/login");
					}
				});
			},
		},
		{
			path: "/login",
			name: "login",
			component: () => import("../views/Login.vue"),
		},
		{
			path: "/registration",
			name: "registration",
			component: () => import("../views/Register.vue"),
		},
		{
			path: "/profile",
			name: "profile",
			component: () => import("../views/Profile.vue"),
		},
      		// Not Found page
		{
			path: "/:pathMatch(.*)*",
			name: "NotFound",
			component: () => import("../views/NotFound.vue"),
		}
	],
});

export default router;

