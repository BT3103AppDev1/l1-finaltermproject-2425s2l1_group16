import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: Home,
		},
		{
			path: "/dashboard",
			name: "dashboard",
			component: () => import("../views/Dashboard.vue"),
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
	],
});

export default router;
