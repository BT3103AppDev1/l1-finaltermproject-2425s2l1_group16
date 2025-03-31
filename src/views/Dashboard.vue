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
                <div
                    v-for="(app, index) in applications"
                    :key="app.id"
                    class="task"
                    draggable="true"
                    @dragstart="dragStart(app, status, index)"
                    @dragover.prevent
                    @drop="drop(status)"
                >
                    <div class="task-content">
                        <strong>{{ app.company }}</strong> - {{ app.position }}
                        <CompleteInterview 
                            v-if="status === 'Interview'" 
                            :company="app.company"
                            :role="app.position"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { db } from "@/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import AddApplicationForm from "@/components/AddApplicationForm.vue";
import CompleteInterview from "@/components/CompleteInterview.vue";

export default {
    components: { 
        AddApplicationForm,
        CompleteInterview 
    },

    setup() {
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

        const loadApplications = async () => {
            const userId = "Cu8w7qKqftnyhdddVufn";
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

            const userId = "Cu8w7qKqftnyhdddVufn"; 
            const sourceDocRef = doc(
                db,
                "Users",
                userId,
                "application_folder",
                draggedApplication.value.id
            );

            try {
                await updateDoc(sourceDocRef, { status: newStatus });

                jobApplications.value[sourceStatus.value] =
                    jobApplications.value[sourceStatus.value] =
                        jobApplications.value[sourceStatus.value].filter(
                            (app) => app.id !== draggedApplication.value.id
                        );

                if (!jobApplications.value[newStatus]) {
                    jobApplications.value[newStatus] = [];
                }

                jobApplications.value[newStatus] = [
                    ...jobApplications.value[newStatus],
                    {
                        ...draggedApplication.value,
                        status: newStatus,
                    },
                ];

                draggedApplication.value = null;
                sourceStatus.value = null;
            } catch (error) {
                console.error("Error updating Firestore:", error);
            }
        };

        const handleApplicationAdded = (newApp) => {
            jobApplications.value.Applied.push(newApp);
            showForm.value = false; 
        };

        return {
            jobApplications,
            statusLabels,
            dragStart,
            drop,
            showForm,
            handleApplicationAdded,
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

.task-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.task {
    background-color: white;
    padding: 10px;
    margin: 8px 0;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: grab;
}

.task:hover {
    background-color: #e2e2e2; /* Slightly darker on hover */
}
</style>
