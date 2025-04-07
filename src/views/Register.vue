<template>
	<div class="page-container">
		<RegisterForm />
	</div>
</template>

<script>
import RegisterForm from "@/components/RegisterForm.vue";

export default {
	name: "RegisterView",
	components: {
		RegisterForm,
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
