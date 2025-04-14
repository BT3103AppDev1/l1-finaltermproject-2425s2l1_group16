<template>
	<div class="auth-form-container">
		<h2>Log In</h2>
		<p class="subtitle">Welcome back! Please log in to your account.</p>

		<form @submit.prevent="login">
			<div class="form-group">
				<label for="email">Email Address</label>
				<input
					type="email"
					id="email"
					v-model="email"
					placeholder="Enter your email"
					required
					:class="{ 'input-error': emailError }"
					@input="clearErrors('email')"
				/>
				<p v-if="emailError" class="error-message">{{ emailError }}</p>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					type="password"
					id="password"
					v-model="password"
					placeholder="Enter Password"
					required
					:class="{ 'input-error': passwordError }"
					@input="clearErrors('password')"
				/>
				<p v-if="passwordError" class="error-message">
					{{ passwordError }}
				</p>
			</div>

			<p v-if="generalError" class="error-message general-error">
				{{ generalError }}
			</p>

			<button type="submit" class="submit-btn">Log In</button>
		</form>

		<div class="divider">OR</div>

		<button @click="signInWithGoogle" class="google-signin-btn">
			<img src="@\assets\logo_google_g_icon.png" alt="Google logo" />
			Sign in with Google
		</button>

		<p v-if="googleError" class="error-message general-error">
			{{ googleError }}
		</p>

		<button @click="signOutUser" class="signout-btn">Sign Out</button>

		<p class="toggle-link">
			<span>Don't have an account?</span>
			<router-link to="/registration">Sign Up</router-link>
		</p>
	</div>
</template>

<script>
import {
	getAuth,
	signInWithEmailAndPassword,
	GoogleAuthProvider,
	signInWithPopup,
	signOut,
} from "firebase/auth";

export default {
	name: "LoginForm",
	data() {
		return {
			email: "",
			password: "",
			emailError: "",
			passwordError: "",
			generalError: "",
			googleError: "",
		};
	},
	methods: {
		clearErrors(field = null) {
			if (field === "email" || !field) this.emailError = "";
			if (field === "password" || !field) this.passwordError = "";
			if (!field) {
				this.generalError = "";
				this.googleError = ""; //Clear both errors
			} else if (field === "google") {
				this.googleError = ""; // Clear only google error
			}
		},
		clearForm() {
			this.email = "";
			this.password = "";
		},
		validateForm() {
			this.clearErrors();
			let isValid = true;

			if (!this.email) {
				this.emailError = "Email address is required.";
				isValid = false;
			} else if (!/\S+@\S+\.\S+/.test(this.email)) {
				this.emailError = "Please enter a valid email address.";
				isValid = false;
			}

			if (!this.password) {
				this.passwordError = "Password is required.";
				isValid = false;
			}
			return isValid;
		},
		async login() {
			if (!this.validateForm()) {
				return;
			}
			this.clearErrors();
			try {
				console.log("Attempting Firebase login...");
				const auth = getAuth();
				await signInWithEmailAndPassword(
					auth,
					this.email,
					this.password
				).then((userCredential) => {
					var user = userCredential.user;
					console.log("Firebase login successful:", user);
					console.log("Display name: ", user.displayName);
				});

				this.clearForm();
				// Redirect after successful login
				this.$router.push("/");
			} catch (error) {
				console.error(
					"Firebase login error:",
					error.code,
					error.message
				);
				this.handleFirebaseError(error);
			}
		},
		async signInWithGoogle() {
			this.clearErrors(); // Clear all previous errors
			const auth = getAuth();
			const provider = new GoogleAuthProvider(); // Create Google provider instance

			try {
				console.log("Attempting Google Sign-In via popup...");
				const result = await signInWithPopup(auth, provider);

				// This gives you a Google Access Token. You can use it to access Google APIs.
				// const credential = GoogleAuthProvider.credentialFromResult(result);
				// const token = credential.accessToken;
				// The signed-in user info.
				const user = result.user;

				console.log("Google Sign-In Successful:", user.displayName);
				// You might want to clear the email/password form fields here too
				this.clearForm();
				this.$router.push("/"); // Redirect after successful Google login
			} catch (error) {
				console.error(
					"Google Sign-In Error:",
					error.code,
					error.message
				);

				// Handle specific Google Sign-In errors
				switch (error.code) {
					case "auth/popup-closed-by-user":
						this.googleError =
							"Sign-in popup closed before completion. Please try again.";
						break;
					case "auth/account-exists-with-different-credential":
						this.googleError =
							"An account already exists with this email using a different sign-in method. Try logging in with the original method.";
						// You could potentially implement account linking here if needed
						break;
					case "auth/cancelled-popup-request":
					case "auth/popup-blocked":
						this.googleError =
							"Sign-in popup was cancelled or blocked. Please allow popups for this site and try again.";
						break;
					case "auth/operation-not-allowed":
						this.googleError =
							"Sign in with Google is not enabled for this app. Please contact support.";
						break;
					default:
						this.googleError =
							"An error occurred during Google Sign-In. Please try again.";
				}
			}
		},	

		handleFirebaseError(error) {
			switch (error.code) {
				case "auth/invalid-email":
					this.emailError = "Please enter a valid email address.";
					break;
				case "auth/user-disabled":
					this.generalError = "This user account has been disabled.";
					break;
				case "auth/user-not-found":
				case "auth/invalid-credential": // This can mean user not found or wrong password
					this.generalError = "Invalid email or password.";
					break;
				case "auth/wrong-password": // Might still appear sometimes, handle defensively
					this.generalError = "Invalid email or password.";
					break;
				case "auth/operation-not-allowed":
					this.generalError =
						"Login with email/password is not enabled.";
					break;
				default:
					this.generalError = "Login failed. Please try again.";
			}
		},

		async signOutUser() {
			const auth = getAuth();
			this.clearErrors(); // Clear any existing errors
			try {
				await signOut(auth);
				console.log("User signed out successfully.");
				this.clearForm(); // Clear form fields after sign out
				this.$router.push("/login"); // Redirect to login page
			} catch (error) {
				console.error("Sign out error:", error);
				this.generalError = "Failed to sign out. Please try again.";
			}
		},
	},
};
</script>

<style scoped>
.auth-form-container {
	text-align: left;
	max-width: 450px;
	margin: auto;
	background: white;
	padding: 30px 40px;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	border: 1px solid #d1e0ff;
}

h2 {
	font-size: 24px;
	font-weight: 600;
	color: #333;
	margin-bottom: 10px;
	text-align: left;
}

.subtitle {
	font-size: 14px;
	color: #666;
	margin-bottom: 30px;
	text-align: left;
}

.form-group {
	margin-bottom: 20px;
}

label {
	display: block;
	margin-bottom: 8px;
	font-weight: 600;
	font-size: 14px;
	color: #333;
}

input[type="email"],
input[type="password"] {
	width: 100%;
	padding: 12px 15px;
	border: 1px solid #ccc;
	border-radius: 4px;
	box-sizing: border-box;
	font-size: 14px;
	background-color: #f8f9fa;
}

input::placeholder {
	color: #aaa;
}

input:focus {
	outline: none;
	border-color: #6c63ff;
	box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
}

.input-error {
	border-color: #dc3545;
	background-color: #fff8f8;
}

.input-error:focus {
	box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

.error-message {
	color: #dc3545;
	font-size: 12px;
	margin-top: 6px;
}

.general-error {
	text-align: center;
	margin-bottom: 15px;
	color: #dc3545;
	font-size: 13px;
	font-weight: 500;
}

.submit-btn {
	background-color: #c24600;
	color: white;
	border: none;
	padding: 12px 20px;
	border-radius: 5px;
	cursor: pointer;
	font-size: 16px;
	font-weight: 600;
	width: 100%;
	margin-top: 10px;
	transition: background-color 0.2s ease;
}

.submit-btn:hover {
	background-color: #fc640d;
}

.signout-btn {
	background-color: #6c757d;
	color: white;
	border: none;
	padding: 10px 15px;
	border-radius: 5px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	width: 100%;
	margin-top: 15px;
	margin-bottom: 5px; /* Space below before toggle link */
	transition: background-color 0.2s ease;
}

.signout-btn:hover {
	background-color: #5a6268;
}

.toggle-link {
	text-align: center;
	margin-top: 25px;
	font-size: 14px;
	color: #666;
}

.toggle-link a {
	color: #c24600;
	text-decoration: none;
	font-weight: 600;
	margin-left: 5px;
}

.toggle-link a:hover {
	text-decoration: underline;
	background-color: transparent;
}

.divider {
	text-align: center;
	margin: 25px 0 20px 0;
	font-size: 12px;
	color: #888;
	font-weight: 500;
	text-transform: uppercase;
	position: relative;
}

.divider::before,
.divider::after {
	content: "";
	display: inline-block;
	width: 38%;
	height: 1px;
	background-color: #ddd;
	vertical-align: middle;
}

.divider::before {
	margin-right: 10px;
}

.divider::after {
	margin-left: 10px;
}

.google-signin-btn {
	background-color: #ffffff;
	color: #444; 
	border: 1px solid #ccc; 
	padding: 10px 15px;
	border-radius: 5px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 600; 
	width: 100%;
	margin: 0 auto 15px auto; 
	transition: background-color 0.2s ease, box-shadow 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.google-signin-btn:hover {
	background-color: #f8f8f8;
	border-color: #bbb;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.google-signin-btn img {
	width: 18px;
	height: 18px;
	margin-right: 10px;
}
</style>