<template>
	<!-- Back Button -->

	<!--Main profile view  -->
	<div class="profile-container">
		<button @click="goBack" class="back-button" title="Go back">
			<img src="@/assets/back_icon.svg" alt="Back" />
		</button>
		<h2>User Profile</h2>

		<div v-if="isLoading" class="loading-message">Loading profile...</div>
		<div v-if="!isLoading && !user" class="error-message">
			Could not load user profile. Please log in.
		</div>

		<div v-if="!isLoading && user" class="profile-display">
			<p v-if="generalSuccess" class="success-message general-feedback">
				{{ generalSuccess }}
			</p>
			<p v-if="generalError" class="error-message general-feedback">
				{{ generalError }}
			</p>

			<div class="profile-section display-section">
				<h3>Display Name</h3>
				<div class="info-row">
					<span>{{ currentDisplayName || "Not Set" }}</span>
					<button
						@click="openNameModal"
						class="edit-btn"
						title="Edit Name"
					>
						<img src="@\assets\edit_icon.svg" />
					</button>
				</div>
			</div>

			<div class="profile-section display-section">
				<h3>Email Address</h3>
				<div class="info-row">
					<span>{{ email }}</span>
				</div>
			</div>

			<div class="profile-section display-section">
				<h3>Password</h3>
				<div class="info-row">
					<span>********</span>
					<button
						@click="showPasswordModal = true"
						class="edit-btn"
						title="Change Password"
					>
						<img src="@/assets/edit_icon.svg" />
					</button>
				</div>
			</div>
		</div>

		<div
			v-if="showNameModal"
			class="modal-overlay"
			@click.self="closeNameModal"
		>
			<div class="modal-content">
				<h2>Update Display Name</h2>
				<div class="form-group">
					<label for="modalDisplayName">New Name:</label>
					<input
						type="text"
						id="modalDisplayName"
						v-model.trim="modalNewDisplayName"
					/>
				</div>
				<p v-if="nameError" class="error-message">{{ nameError }}</p>
				<p v-if="nameSuccess" class="success-message">
					{{ nameSuccess }}
				</p>
				<div class="modal-actions">
					<button @click="closeNameModal" class="btn cancel-button">
						Cancel
					</button>
					<button
						@click="submitNameUpdate"
						:disabled="
							isNameUpdating ||
							!modalNewDisplayName ||
							modalNewDisplayName === currentDisplayName
						"
						class="btn save-button"
					>
						<span v-if="isNameUpdating">Saving...</span>
						<span v-else>Save Name</span>
					</button>
				</div>
			</div>
		</div>

		<div
			v-if="showPasswordModal"
			class="modal-overlay"
			@click.self="closePasswordModal"
		>
			<div class="modal-content">
				<h2>Change Password</h2>
				<form @submit.prevent="submitPasswordChange">
					<p class="info-message">
						Requires current password for security.
					</p>
					<div class="form-group">
						<label for="modalCurrentPassword"
							>Current Password:</label
						>
						<input
							type="password"
							id="modalCurrentPassword"
							v-model="modalCurrentPassword"
							required
						/>
					</div>
					<div class="form-group">
						<label for="modalNewPassword">New Password:</label>
						<input
							type="password"
							id="modalNewPassword"
							v-model="modalNewPassword"
							required
						/>
						<p class="info-message">* Min. 6 characters.</p>
					</div>
					<div class="form-group">
						<label for="modalConfirmNewPassword"
							>Confirm New Password:</label
						>
						<input
							type="password"
							id="modalConfirmNewPassword"
							v-model="modalConfirmNewPassword"
							required
						/>
					</div>
					<p v-if="passwordError" class="error-message">
						{{ passwordError }}
					</p>
					<p v-if="passwordSuccess" class="success-message">
						{{ passwordSuccess }}
					</p>
					<div class="modal-actions">
						<button
							type="button"
							@click="closePasswordModal"
							class="btn cancel-button"
						>
							Cancel
						</button>
						<button
							type="submit"
							:disabled="
								isPasswordUpdating ||
								!modalCurrentPassword ||
								!modalNewPassword ||
								!modalConfirmNewPassword
							"
							class="btn save-button"
						>
							<span v-if="isPasswordUpdating">Changing...</span>
							<span v-else>Change Password</span>
						</button>
					</div>
				</form>
			</div>
		</div>
		<div class="logout-section">
	<button class="logout-button" @click="handleLogout">
		Log Out
	</button>
</div>
	</div>
</template>

<script>
import {
	getAuth,
	onAuthStateChanged,
	updateProfile,
	updatePassword,
	EmailAuthProvider,
	reauthenticateWithCredential,
	signOut,
} from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";

export default {
	name: "UserProfilePage",
	data() {
		return {
			user: null,
			isLoading: true,
			// User data display
			currentDisplayName: "",
			email: "",

			// Modal Visibility
			showNameModal: false,
			showPasswordModal: false,

			// Modal Form Fields
			modalNewDisplayName: "",
			modalCurrentPassword: "",
			modalNewPassword: "",
			modalConfirmNewPassword: "",

			// Loading States
			isNameUpdating: false,
			isPasswordUpdating: false,

			// Feedback Messages
			generalError: "",
			generalSuccess: "",
			nameError: "",
			nameSuccess: "",
			passwordError: "",
			passwordSuccess: "",
		};
	},
	methods: {
		// Back button
		goBack() {
			this.$router.push("/dashboard"); // Change '/dashboard' to your desired route
		},

		// Page Initialization
		fetchUserProfile() {
			const auth = getAuth();
			onAuthStateChanged(auth, (currentUser) => {
				this.isLoading = false;
				if (currentUser) {
					this.user = currentUser;
					this.currentDisplayName = currentUser.displayName;
					this.email = currentUser.email;
					console.log("User profile loaded:", currentUser);
				} else {
					this.user = null;
					console.log("No user logged in.");
					this.generalError =
						"You must be logged in to view your profile.";
				}
			});
		},

		// Modal Control
		openNameModal() {
			this.clearAllFeedback();
			this.modalNewDisplayName = this.currentDisplayName || "";
			this.showNameModal = true;
		},
		closeNameModal() {
			this.showNameModal = false;
			this.modalNewDisplayName = "";
			this.clearFeedback("name");
		},
		openPasswordModal() {
			this.clearAllFeedback();
			this.modalCurrentPassword = "";
			this.modalNewPassword = "";
			this.modalConfirmNewPassword = "";
			this.showPasswordModal = true;
		},
		closePasswordModal() {
			this.showPasswordModal = false;
			this.clearFeedback("password");
		},

		// Display Name Logic
		async submitNameUpdate() {
			if (
				!this.user ||
				!this.modalNewDisplayName ||
				this.modalNewDisplayName === this.currentDisplayName
			) {
				this.nameError =
					"New name cannot be empty or the same as the current name.";
				return;
			}
			this.clearFeedback("name");
			this.isNameUpdating = true;
			const auth = getAuth();
			const current_user = auth.currentUser;
			try {
				// Update Auth Profile
				await updateProfile(auth.currentUser, {
					displayName: this.modalNewDisplayName,
				});

				// Update Firestore
				const db = getFirestore();
				const userDocRef = doc(db, "Users", current_user.uid);
				const userDoc = await getDoc(userDocRef);
				if (
					userDoc.exists() &&
					userDoc.data().displayName !== this.modalNewDisplayName
				) {
					await updateDoc(userDocRef, {
						displayName: this.modalNewDisplayName,
					});
				}

				// Update local state & give feedback IN MODAL
				this.currentDisplayName = this.modalNewDisplayName;
				this.nameSuccess = "Display name updated!";

				// Close modal after a short delay
				setTimeout(() => {
					this.closeNameModal();
					this.generalSuccess = "Display name updated successfully!";
				}, 1500);
			} catch (error) {
				console.error("Error updating display name:", error);
				this.nameError = `Failed to update name: ${error.message}`; // Show error IN MODAL
			} finally {
				this.isNameUpdating = false;
			}
		},

		// Change password logic
		async submitPasswordChange() {
			this.clearFeedback("password");
			// Validate passwords
			if (
				!this.modalCurrentPassword ||
				!this.modalNewPassword ||
				!this.modalConfirmNewPassword
			) {
				this.passwordError = "All password fields are required.";
				return;
			}
			if (this.modalNewPassword.length < 6) {
				this.passwordError =
					"New password must be at least 6 characters.";
				return;
			}
			if (this.modalNewPassword !== this.modalConfirmNewPassword) {
				this.passwordError = "New passwords do not match.";
				return;
			}
			if (this.modalNewPassword === this.modalCurrentPassword) {
				this.passwordError =
					"New password cannot be the same as the current one.";
				return;
			}

			this.isPasswordUpdating = true;
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) {
				this.passwordError = "User not found.";
				this.isPasswordUpdating = false;
				return;
			}

			// Re-authenticate
			const credential = EmailAuthProvider.credential(
				user.email,
				this.modalCurrentPassword
			);
			try {
				await reauthenticateWithCredential(user, credential);
				// Re-auth successful, now update password
				try {
					await updatePassword(user, this.modalNewPassword);
					this.passwordSuccess = "Password changed!"; // Show success IN MODAL

					// Close modal after delay
					setTimeout(() => {
						this.closePasswordModal();
						this.generalSuccess = "Password changed successfully!";
					}, 1500);
				} catch (updateError) {
					// Handle update error IN MODAL
					if (updateError.code === "auth/weak-password") {
						this.passwordError = "New password is too weak.";
					} else {
						this.passwordError = `Update failed: ${updateError.message}`;
					}
				}
			} catch (reauthError) {
				// Handle re-auth error IN MODAL
				if (
					reauthError.code === "auth/wrong-password" ||
					reauthError.code === "auth/invalid-credential"
				) {
					this.passwordError = "Incorrect current password.";
				} else if (reauthError.code === "auth/too-many-requests") {
					this.passwordError = "Too many attempts. Try again later.";
				} else {
					this.passwordError = `Auth error: ${reauthError.message}`;
				}
			} finally {
				this.isPasswordUpdating = false;
			}
		},

		// --- Helpers ---
		clearAllFeedback() {
			this.generalError = "";
			this.generalSuccess = "";
			this.nameError = "";
			this.nameSuccess = "";
			this.passwordError = "";
			this.passwordSuccess = "";
			// pictureError/Success REMOVED
		},
		clearFeedback(section) {
			// Clear specific section + general
			this[`${section}Error`] = "";
			this[`${section}Success`] = "";
			this.generalError = ""; // Also clear general on specific interaction
			this.generalSuccess = "";
		},

		handleLogout() {
			this.signOutUser();
		},

		async signOutUser() {
			const auth = getAuth();
			try {
				await signOut(auth);
				console.log("User signed out successfully.");
				this.$router.push("/login");
			} catch (error) {
				console.error("Sign out error:", error);
			}
		},
	},
	mounted() {
		this.fetchUserProfile();
		this.$emit("initial-name", this.currentDisplayName);
	},
};
</script>

<style scoped>
/* --- Base Container --- */
.profile-container {
	max-width: 650px;
	margin: 2rem auto;
	padding: 30px 35px;
	background-color: #fff;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	border: 1px solid #e0e0e0;
}

h2 {
	text-align: center;
	color: #333;
	margin-bottom: 30px;
}

/* --- Loading/Initial Error --- */
.loading-message,
.error-message {
	text-align: center;
	color: #666;
	font-style: italic;
	margin: 20px 0;
	padding: 15px;
	border-radius: 4px;
}
.error-message {
	background-color: #f8d7da;
	border: 1px solid #f5c6cb;
	color: #721c24;
	font-style: normal;
}

/* --- General Feedback Area --- */
.general-feedback {
	text-align: center;
	padding: 10px;
	border-radius: 4px;
	margin-bottom: 20px;
	font-weight: 500;
	font-size: 0.95em;
}
.general-feedback.success-message {
	background-color: #d4edda;
	border: 1px solid #c3e6cb;
	color: #155724;
}
.general-feedback.error-message {
	background-color: #f8d7da;
	border: 1px solid #f5c6cb;
	color: #721c24;
}

/* --- Profile Display Sections --- */
.profile-display {
	display: flex;
	flex-direction: column;
	gap: 15px;
}

.profile-section.display-section {
	border: 1px solid #eee;
	padding: 15px 20px;
	border-radius: 6px;
	background-color: #fdfdfd;
}

.profile-section h3 {
	color: #555;
	margin-top: 0;
	margin-bottom: 12px;
	font-size: 1.05em;
	font-weight: 600;
	border-bottom: 1px solid #f0f0f0;
	padding-bottom: 8px;
}

.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 1em;
	color: #333;
}
.info-row span {
	word-break: break-all;
	margin-right: 10px;
}

.edit-btn {
	background: none;
	border: none;
	font-size: 1.2em;
	cursor: pointer;
	color: #007bff;
	padding: 5px;
	line-height: 1;
	border-radius: 4px;
	transition: background-color 0.2s;
}
.edit-btn:hover {
	background-color: #e9ecef;
	color: #0056b3;
}

/* --- Modal Styles --- */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.6);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.modal-content {
	background-color: #fff;
	padding: 25px 30px;
	border-radius: 8px;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
	width: 90%;
	max-width: 500px;
	z-index: 1001;
}

.modal-content h3 {
	text-align: center;
	margin-top: 0;
	margin-bottom: 20px;
	color: #333;
	font-size: 1.3em;
	border-bottom: none;
}

.modal-content label {
	display: block;
	margin-bottom: 6px;
	font-weight: 600;
	font-size: 0.9em;
	color: #333;
}
.modal-content input[type="text"],
.modal-content input[type="password"] {
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #ccc;
	border-radius: 4px;
	box-sizing: border-box;
	font-size: 1em;
}

.modal-content .error-message,
.modal-content .success-message {
	text-align: center;
	margin-top: 10px;
	font-size: 0.9em;
}
.modal-content .info-message {
	font-size: 0.8em;
	color: #666;
	margin-top: 3px;
}

.info-message {
	margin-bottom: 10px;
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 25px;
	padding-top: 15px;
	border-top: 1px solid #eee;
}

.btn {
	padding: 9px 16px;
	border: none;
	border-radius: 5px;
	cursor: pointer;
	font-size: 0.9em;
	font-weight: 600;
	transition: background-color 0.2s ease, opacity 0.2s ease;
}

.btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
	background-color: #0056b3;
}

.btn-secondary:hover:not(:disabled) {
	background-color: #5a6268;
}

/* Back Button */
.back-button {
	/* position: absolute; */
	top: 20px;
	left: 20px;
	display: flex;
	align-items: center;
	gap: 8px;
	background-color: transparent;
	border: none;
	font-size: 1em;
	cursor: pointer;
	border-radius: 5px;
	transition: background-color 0.2s;
}

.back-button:hover {
	background-color: #f0f0f0;
}

.save-button {
	width: 140px;
    padding: 8px 0;
    border: none;
    border-radius: 5px;
    background-color: #c24600;
    color: white;
    font-weight: bold;
    cursor: pointer;
    text-align: center;
}

.save-button:hover {
	background: #fc640d;
}

.cancel-button {
    width: 140px;
    background-color: #e2e8f0;
    color: #334155;
}

.logout-section {
	margin-top: 30px;
	text-align: center;
}

.logout-button {
	padding: 10px 20px;
	background-color: #ef4444;
	color: white;
	border: none;
	border-radius: 5px;
	cursor: pointer;
	font-weight: bold;
	transition: background-color 0.2s ease;
	width: 100%;
}

.logout-button:hover {
	background-color: #dc2626;
}
</style>
