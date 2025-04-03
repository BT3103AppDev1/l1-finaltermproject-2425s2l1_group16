<template>
    <div class="dashboard">
        <div class="header">
            <h2>Job Applications</h2>
            <button @click="showForm = true">+ Add New Application</button>
        </div>

        <!-- Show the Add Application Form -->
        <AddApplicationForm
            v-if="showForm"
            @close="showForm = false"
            @application-added="handleApplicationAdded"
        />

        <div class="kanban">
            <div
                v-for="(applications, status) in jobApplications"
                :key="status"
                class="column"
                @dragover.prevent
                @drop="drop(status)"
            >
                <h3>{{ statusLabels[status] }}</h3>
                <!-- the applications here -->
                <div
                    v-for="(app, index) in applications"
                    :key="app.id"
                    class="task"
                    draggable="true"
                    @dragstart="dragStart(app, status, index)"
                    @dragover.prevent
                    @drop="drop(status)"
                    @click="openPopup(app.id)"
                >
                <strong>{{ app.company }}</strong> - {{ app.position }}
                <button class="delete-btn" @click.stop="confirmDelete(app, status)">🗑️</button>
                </div>
            </div>
        </div>
    </div>
    <teleport to="body">
        <div v-if="showDeleteModal" class="modal-overlay">
            <div class="modal-content">
                 <h3>Are you sure you want to delete this application?</h3>
                 <p>This action cannot be undone.</p>
                <div class="modal-actions">
                    <button @click="performDelete">Confirm</button>
                    <button @click="showDeleteModal = false">Cancel</button>
                </div>
            </div>
        </div>
    </teleport>

    <teleport to="body">
        <ApplicationCard 
            v-if="showPopup" 
            :show="showPopup"
            :appId="selectedAppId" 
            @close="closePopup" 
        />
    </teleport>
</template>

<script>
import { ref, onMounted } from "vue";
import { db } from "@/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import AddApplicationForm from "@/components/AddApplicationForm.vue";
import { deleteDoc } from "firebase/firestore";
import ApplicationCard from '@/components/ApplicationCard.vue';

export default {
    components: { AddApplicationForm, ApplicationCard },

    setup() {
        const selectedAppId = ref(null);
        const showPopup = ref(false);

        const openPopup = (appId) => {
            selectedAppId.value = appId;
            showPopup.value = true;
        };

        const closePopup = () => {
            showPopup.value = false;
            selectedAppId.value = null;
        };

        const jobApplications = ref({
            Applied: [],
            Assessment: [],
            Interview: [],
            Offered: [],
            Rejected: [],
            "Turned Down": [],
        });

        const statusLabels = {
            Applied: "Applied",
            Assessment: "Assessment",
            Interview: "Interview",
            Offered: "Offered",
            Rejected: "Rejected",
            "Turned Down": "Turned Down",
        };

        const draggedApplication = ref(null);
        const sourceStatus = ref(null);
        const sourceIndex = ref(null);
        const showForm = ref(false);
        const showDeleteModal = ref(false);
        const appToDelete = ref(null);
        const appStatusToDelete = ref(null);

        const confirmDelete = (app, status) => {
            appToDelete.value = app;
            appStatusToDelete.value = status;
            showDeleteModal.value = true;
        };

        const performDelete = async () => {
            if (!appToDelete.value || !appStatusToDelete.value) return;

            try {
                const userId = "insights_me";
                const appRef = doc(db, "Users", userId, "application_folder", appToDelete.value.id);

                await deleteDoc(appRef);

                jobApplications.value[appStatusToDelete.value] =
                jobApplications.value[appStatusToDelete.value].filter(
                    (item) => item.id !== appToDelete.value.id
                );

                showDeleteModal.value = false;
                appToDelete.value = null;
                appStatusToDelete.value = null;
            } catch (err) {
                console.error("Failed to delete:", err);
            }
        };

        const loadApplications = async () => {
            // CHANGE THIS TO THE USER_ID
            const userId = "insights_me";
            const applicationsRef = collection(
                db,
                "Users",
                userId,
                "application_folder"
            );
            
            const querySnapshot = await getDocs(applicationsRef);

            jobApplications.value = {
                Applied: [],
                Assessment: [],
                Interview: [],
                Offered: [],
                Rejected: [],
                "Turned Down": [],
            };

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const status = data.status;
                jobApplications.value[status].push({
                    id: doc.id,
                    company: data.company,
                    position: data.position,
                    status: data.status,
                    dateApplied: data.date_applied,
                    notes: data.notes,
                });
            });
        };

        onMounted(() => {
            loadApplications();
        });

        const dragStart = (app, status, index) => {
            draggedApplication.value = app;
            sourceStatus.value = status;
            sourceIndex.value = index;
        };

        const drop = async (newStatus) => {
            if (!draggedApplication.value || sourceStatus.value == newStatus)
                return;

            const userId = "insights_me"; // Replace with dynamic user ID
            const sourceDocRef = doc(
                db,
                "Users",
                userId,
                "application_folder",
                draggedApplication.value.id
            );

            try {
                // Update Firestore
                await updateDoc(sourceDocRef, { status: newStatus });

                // Remove the application from the old column
                jobApplications.value[sourceStatus.value] =
                    jobApplications.value[sourceStatus.value] =
                        jobApplications.value[sourceStatus.value].filter(
                            (app) => app.id !== draggedApplication.value.id
                        );

                // Ensure the new column is an array (fixes empty column issue)
                if (!jobApplications.value[newStatus]) {
                    jobApplications.value[newStatus] = [];
                }

                // Add the application to the new column (force reactivity)
                jobApplications.value[newStatus] = [
                    ...jobApplications.value[newStatus],
                    {
                        ...draggedApplication.value,
                        status: newStatus,
                    },
                ];

                // Reset draggedApplication
                draggedApplication.value = null;
                sourceStatus.value = null;
            } catch (error) {
                console.error("Error updating Firestore:", error);
            }
        };

        const handleApplicationAdded = (newApp) => {
            jobApplications.value.Applied.push(newApp);
            showForm.value = false; // Hide form after submission
        };

        return {
            jobApplications,
            statusLabels,
            dragStart,
            drop,
            showForm,
            handleApplicationAdded,
            confirmDelete,
            performDelete,
            showDeleteModal,
            openPopup,
            closePopup,
            showPopup,
            selectedAppId
        };
    },
};
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5); /* Dark overlay */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

/* Modal Content */
.modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 400px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f0f0f0; /* Light background */
}

.dashboard {
    max-width: 1200px;
    margin: auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

button {
    background-color: #007bff; /* Blue button color */
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

button:hover {
    background-color: #0056b3; /* Darker blue on hover */
}

.kanban {
    display: flex;
    gap: 20px;
    overflow-x: auto;
}

.column {
    display: flex;
    flex-direction: column;
    background-color: #ffffff; /* White column background */
    padding: 15px;
    width: 200px;
    min-height: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.column h3 {
    text-align: center;
    background-color: #f1f1f1; /* Light grey for the column header */
    color: #333; /* Dark text */
    padding: 10px;
    border-radius: 5px;
    margin-top: 0;
}

.task {
    background-color: #f0f0f0; /* Light background for tasks */
    padding: 10px;
    margin: 10px 0;
    border-radius: 5px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.task:hover {
    background-color: #e2e2e2; /* Slightly darker on hover */
}

.delete-btn {
  background: none;
  border: none;
  color: red;
  font-size: 1rem;
  float: right;
  cursor: pointer;
  margin-left: auto;
  padding: 4px;
}

.delete-btn:hover {
  color: darkred;
}

.modal-content h3 {
  margin: 0 0 10px;
}

.modal-content p {
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-actions button {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.modal-actions button:first-child {
  background-color: red;
  color: white;
}

.modal-actions button:last-child {
  background-color: #e2e8f0;
  color: #334155;
}
</style>
