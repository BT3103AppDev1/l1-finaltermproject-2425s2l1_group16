<template>
	<div class="auth-form-container">
		<h2>Sign Up</h2>
		<p class="subtitle">
			Welcome! Your all-in-one internship platform is a few steps away.
		</p>

		<form @submit.prevent="register">
			<div class="form-group">
				<label for="email">Email Address</label>
				<input
					type="email"
					id="email"
					v-model="email"
					placeholder="internship@gmail.com"
					required
					:class="{ 'input-error': emailError }"
					@input="clearErrors('email')"
				/>
				<p v-if="emailError" class="error-message">{{ emailError }}</p>
			</div>

			<div class="form-group">
				<label for="name">Name</label>
				<input
					type="name"
					id="name"
					v-model="name"
					placeholder="Enter Name"
					required
				/>
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
				<p v-if="!passwordError" class="info-message">
					* Password must contain at least:<br />
					6 characters<br />
					1 uppercase letter <br />1 number <br />
					1 special character
				</p>
				<p v-if="passwordError" class="error-message">
					{{ passwordError }}
				</p>
			</div>

			<div class="form-group">
				<label for="confirmPassword">Confirm Password</label>
				<input
					type="password"
					id="confirmPassword"
					v-model="confirmPassword"
					placeholder="Enter Password Again"
					required
					:class="{ 'input-error': confirmPasswordError }"
					@input="clearErrors('confirmPassword')"
				/>
				<p v-if="confirmPasswordError" class="error-message">
					{{ confirmPasswordError }}
				</p>
			</div>

			<p v-if="generalError" class="error-message general-error">
				{{ generalError }}
			</p>

			<button type="submit" class="submit-btn">Register</button>
		</form>
		<div class="divider">OR</div>

		<button @click="signInWithGoogle" class="google-signin-btn">
			<img src="@\assets\logo_google_g_icon.png" alt="Google logo" />
			Sign In with Google
		</button>

		<p v-if="googleError" class="error-message general-error">
			{{ googleError }}
		</p>
		<p class="toggle-link">
			<span>Already have an account?</span>
			<router-link to="/login">Log in</router-link>
		</p>
	</div>
</template>

<script>
import {
	getAuth,
	createUserWithEmailAndPassword,
	updateProfile,
	GoogleAuthProvider,
	signInWithPopup,
	getAdditionalUserInfo,
} from "firebase/auth";

import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

// helper function to be called in register()
async function createUserDocument(user) {
	// Check if user object is valid
	if (!user || !user.uid) {
		console.error(
			"createUserDocument: Invalid user object provided.",
			user
		);
		return;
	}

	const db = getFirestore(); // Get Firestore instance
	const userDocRef = doc(db, "Users", user.uid); // Reference to Users/{uid}
	// await user.reload();

	// sending user data as fields in firestore database
	const userData = {
		uid: user.uid,
		email: user.email || "",
		// Ensure displayName reflects the latest update if possible
		displayName: user.displayName || "", // Use Auth profile's displayName
		//photoURL: user.photoURL || '',
		//createdAt: serverTimestamp(),
		//providerId: user.providerData?.[0]?.providerId || 'unknown',
	};

	try {
		console.log(
			`Attempting to create user document for UID: ${user.uid} with data:`,
			userData
		);
		await setDoc(userDocRef, userData);
		console.log(
			`User document created/updated successfully for UID: ${user.uid}`
		);
	} catch (error) {
		console.error("Error creating user document in Firestore:", error);
		// Consider how to handle this error in the UI if necessary
	}
}

export default {
	name: "RegisterForm",
	data() {
		return {
			email: "",
			name: "",
			password: "",
			confirmPassword: "",
			emailError: "",
			passwordError: "",
			confirmPasswordError: "",
			generalError: "",
		};
	},
	methods: {
		clearErrors(field = null) {
			if (field === "email" || !field) this.emailError = "";
			if (field === "password" || !field) this.passwordError = "";
			if (field === "confirmPassword" || !field)
				this.confirmPasswordError = "";
			if (!field) this.generalError = "";
		},
		clearForm() {
			this.email = "";
			this.password = "";
			this.confirmPassword = "";
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
			} else if (this.password.length < 6) {
				this.passwordError =
					"Password must be at least 6 characters long";
				isValid = false;
			} else {
				const specialCharRegex =
					/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
				const numberRegex = /\d/;
				const uppercaseRegex = /[A-Z]/;

				if (!specialCharRegex.test(this.password)) {
					this.passwordError =
						"Password must contain at least one special character.";
					isValid = false;
				} else if (!numberRegex.test(this.password)) {
					this.passwordError =
						"Password must contain at least one number.";
					isValid = false;
				} else if (!uppercaseRegex.test(this.password)) {
					this.passwordError =
						"Password must contain at least one uppercase letter.";
					isValid = false;
				}
			}

			if (!this.confirmPassword) {
				this.confirmPasswordError = "Please confirm your password.";
				isValid = false;
			} else if (
				this.password &&
				this.confirmPassword !== this.password
			) {
				this.confirmPasswordError = "Passwords do not match.";
				isValid = false;
			}

			return isValid;
		},
		async register() {
			if (!this.validateForm()) {
				return;
			}

			this.clearErrors();
			try {
				var user;
				console.log("Attempting Firebase registration...");
				const auth = getAuth();
				await createUserWithEmailAndPassword(
					auth,
					this.email,
					this.password
				).then((userCredential) => {
					user = userCredential.user;
					console.log("User created: ", user);
				});

				// set display name
				await updateProfile(user, {
					displayName: this.name,
				}).then(() => {
					console.log("Display Name is ", user.displayName);
				});

				// create User Document in Firestore Database
				await createUserDocument(user);

				this.clearForm();
				// Redirect after successful registration

				this.$router.push("/dashboard");
			} catch (error) {
				console.error(
					"Firebase registration error:",
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

				// TAccess Google APIs. Potentially used later on
				// const credential = GoogleAuthProvider.credentialFromResult(result);
				// const token = credential.accessToken;

				//signed in user
				const user = result.user;

				console.log("Google Sign-In Successful:", user.displayName);

				// check if user has an account already, if not, create user document in Firestore Database
				const additionalInfo = getAdditionalUserInfo(result);
				if (additionalInfo?.isNewUser) {
					console.log(
						"New user detected via Google Sign-In (RegisterForm)."
					);
					// Pass the user object from the Google sign-in result
					await createUserDocument(user);
				} else {
					console.log(
						"Existing user detected via Google Sign-In (RegisterForm)."
					);
				}

				this.clearForm();
				this.$router.push("/dashboard"); // Redirect after successful Google login
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
				case "auth/email-already-in-use":
					this.emailError =
						"This email has already been registered with another account. Please use a different email.";
					break;
				case "auth/operation-not-allowed":
					this.generalError =
						"Email/password accounts are not enabled in Firebase.";
					break;
				case "auth/weak-password":
					this.passwordError =
						"Password is too weak. Password must contain at least: \n6 characters\n1 uppercase letter\n1 number\n1 special character";
					break;
				default:
					this.generalError =
						"Registration failed. Please try again.";
			}
		},
	},
};
</script>

<style scoped>
/* Copy relevant styles from Auth.vue - form container, inputs, labels, buttons, errors, links */
.auth-form-container {
	text-align: left;
	max-width: 450px;
	margin: auto;
	background: white;
	padding: 30px 40px;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
input[type="name"],
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

.error-message,
.info-message {
	color: #dc3545;
	font-size: 12px;
	margin-top: 6px;
}

.info-message {
	color: #666;
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
	background-color: #ffffff; /* White background */
	color: #444; /* Dark grey text */
	border: 1px solid #ccc; /* Subtle border */
	padding: 10px 15px;
	border-radius: 5px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 600; /* Slightly bolder */
	width: 100%;
	margin: 0 auto 15px auto; /* Center and add margin below */
	transition: background-color 0.2s ease, box-shadow 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.google-signin-btn:hover {
	background-color: #f8f8f8; /* Slight grey on hover */
	border-color: #bbb;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.google-signin-btn img {
	width: 18px;
	height: 18px;
	margin-right: 10px;
}
</style>
