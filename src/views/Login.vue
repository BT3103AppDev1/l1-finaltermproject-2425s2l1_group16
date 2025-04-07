<template>
	<div class="page-container">
		<LoginForm />
	</div>
</template>

<script>
import LoginForm from "@/components/LoginForm.vue"; // Import the new Login Form

export default {
	name: "LoginView", // Keep the name
	components: {
		LoginForm, // Use the Login Form component
	},
};
</script>

<style scoped>
.page-container {
	text-align: center;
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
}
</style>
