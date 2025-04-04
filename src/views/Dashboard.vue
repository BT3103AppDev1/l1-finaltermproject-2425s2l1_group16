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
                    <div class="task-content">
                        <span class="company">{{ app.company }}</span>
                        <span class="position">{{ app.position }}</span>
                        <span class="status">{{ app.status }} on {{ app.last_updated }}</span>
                    </div>
                    <button class="delete-btn" @click.stop="confirmDelete(app, status)">🗑️</button>
                </div>
            </div>
        </div>
    </div>

    <teleport to="body">
        <div v-if="showDropConfirmModal" class="modal-overlay">
            <div class="modal-content">
            <h3>Confirm Status Change</h3>
            <p>
            You are moving <strong>{{ pendingDrop?.app.company }}</strong>
            to <strong>{{ pendingDrop?.to }}</strong><br/>
            </p>

            <!-- only when you are shifting to interview or assessment statuses -->
            <div v-if="pendingDrop?.to === 'Interview' || pendingDrop?.to === 'Assessment'">
                <label for="stageName">Enter Stage Name:</label>
                <input
                    type="text"
                    id="stageName"
                    v-model="stageName"
                    placeholder="Enter stage name"
                />
            </div>

            <div v-if="pendingDrop?.to !== 'Applied' && pendingDrop?.to !== 'Turned Down'">
                <label for="responseDate">Select Response Date:</label>
                <input
                    type="date"
                    id="responseDate"
                    v-model="responseDate"
                    :max="maxDate"
                    required
                />
            </div>

            <div class="modal-actions">
                <button @click="confirmDropStatus">Confirm</button>
                <button @click="showDropConfirmModal = false">Cancel</button>
            </div>
            </div>
        </div>
    </teleport>

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
import { ref, onMounted, computed } from "vue";
import { db } from "@/firebase";
import { collection, getDocs, doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { DateTime } from 'luxon';
import AddApplicationForm from "@/components/AddApplicationForm.vue";
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
                    last_updated: new Date(data.last_updated).toLocaleDateString('en-GB'),
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

        const pendingDrop = ref(null);
        const showDropConfirmModal = ref(false);

        const statusChangeTime = ref(null);

        const drop = async (newStatus) => {
            if (!draggedApplication.value || sourceStatus.value == newStatus) return;

            const statusUpdateDate = DateTime.now()
                .setZone('Asia/Singapore')
                .toISO();
            statusChangeTime.value = statusUpdateDate;

            pendingDrop.value = {
                app: draggedApplication.value,
                from: sourceStatus.value,
                to: newStatus
            };

            showDropConfirmModal.value = true;

            // Clear drag state
            draggedApplication.value = null;
            sourceStatus.value = null;
        };

        // for number of working days
        const calculateWorkingDays = (startDate, endDate) => {
            const start = DateTime.fromISO(startDate, { zone: 'Asia/Singapore' }).startOf('day');
            const end = DateTime.fromISO(endDate, { zone: 'Asia/Singapore' }).startOf('day');

            let currentDate = start;
            let workingDays = 0;

            while (currentDate <= end) {
                // check if it's a weekday (not Sunday or Saturday)
                if (currentDate.weekday !== 6 && currentDate.weekday !== 7) {
                    workingDays++;
                }
                currentDate = currentDate.plus({ days: 1 });
            }

            return workingDays;
        };

        const responseDate = ref("");
        const stageName = ref("");
        const maxDate = ref(
            DateTime.now().setZone('Asia/Singapore').toISODate()
        );

        const confirmDropStatus = async () => {
            if (!pendingDrop.value) return;

            const { app, from, to } = pendingDrop.value;
            const userId = "insights_me";
            const sourceDocRef = doc(db, "Users", userId, "application_folder", app.id);
            
            try {
                const update_date = DateTime.now().setZone('Asia/Singapore').toISO();

                const responseDateAtMidnightString = DateTime.fromISO(responseDate.value, { zone: 'Asia/Singapore' })
                    .startOf('day')
                    .toISO();

                const updates = {
                    status: to,
                    last_updated: update_date,
                };

                // for working days calculation + most frequent day a company responds
                const docSnapshot = await getDoc(sourceDocRef);
                
                if (!docSnapshot.exists()) {
                    console.error("Document not found");
                    return;
                }

                const appData = docSnapshot.data();
                const stages = appData.stages;

                let totalWorkingDays = 0;
                const stagesWithDates = [];

                const responseDaysMap = {}; 

                for (let [stage, stageDetails] of Object.entries(stages)) {
                    if (stageDetails && stageDetails.date) {
                        const stageDate = DateTime.fromISO(stageDetails.date, { zone: 'Asia/Singapore' }).toJSDate();
                        stagesWithDates.push({ stage, date: stageDate });

                        // "Applied" and "Turned Down" stages are not stages that the compny responds
                        if (stage !== "applied" && stage !== "turned down") {
                            const dayOfWeek = stageDate.getDay();
                            // only care about work days (Mon to Fri, dayOfWeek 1 to 5)
                            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                                responseDaysMap[dayOfWeek] = (responseDaysMap[dayOfWeek] || 0) + 1;
                            }
                        }
                    }
                }

                stagesWithDates.sort((a, b) => a.date - b.date);

                for (let i = 0; i < stagesWithDates.length - 1; i++) {
                    const currentStage = stagesWithDates[i];
                    const nextStage = stagesWithDates[i + 1];

                    totalWorkingDays += calculateWorkingDays(currentStage.date, nextStage.date);
                }

                // "Applied" and "Turned Down" stages are not stages that the company responds
                if (to !== "Applied" && to !== "Turned Down") {
                    // time taken to the new status?
                    const latestDate =  stagesWithDates[stagesWithDates.length - 1].date
                    const isoDate = DateTime.fromJSDate(latestDate).setZone('Asia/Singapore').toISO();
                    console.log(isoDate);
                    totalWorkingDays += calculateWorkingDays(isoDate, responseDateAtMidnightString);

                    const responseDate = DateTime.fromISO(responseDateAtMidnightString, { zone: 'Asia/Singapore' });
                    const dayOfWeek = responseDate.weekday;

                    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                        responseDaysMap[dayOfWeek] = (responseDaysMap[dayOfWeek] || 0) + 1;
                    }
                }

                if (totalWorkingDays < 0) {
                    totalWorkingDays = 0;
                }

                // minus to account for the intervals between each stage transition
                updates["working_days"] = totalWorkingDays - (stagesWithDates.length);
                updates["average_working_days"] = Math.round((totalWorkingDays - (stagesWithDates.length)) / (stagesWithDates.length));

                updates["response_days_map"] = { ...responseDaysMap };
                //

                if (to === "Interview" || to === "Assessment") {
                    // change to "interview" or "assessment"
                    const type = to.toLowerCase();

                    const existingStages = Object.keys(stages).filter(stage => stage.startsWith(type));

                    // Extract numbers from the stage names, if they exist (e.g., "interview_1" => 1)
                    const stageNumbers = existingStages
                        .map(stage => {
                            const match = stage.match(new RegExp(`${type}_(\\d+)`)); // Regex to match "interview_1"
                            return match ? parseInt(match[1], 10) : 0;
                        })
                        .filter(num => num > 0);

                    // If no valid stages exist, default to 1 (for "interview_1"), otherwise take the max number + 1
                    const nextNum = stageNumbers.length > 0 ? Math.max(...stageNumbers) + 1 : 1;

                    // Create the new stage with the next available number (either "interview_1" or the next number)
                    updates[`stages.${type}_${nextNum}`] = {
                        name: stageName.value,
                        date: responseDateAtMidnightString,
                    };
                } else {
                    // For other statuses like "Applied", there's no applied_1, applied_2
                    // Also, it does not make sense to use response date for Applied and Turned Down when response date is for a company
                    if (to !== "Applied" && to !== "Turned Down") {
                        updates[`stages.${to.toLowerCase()}`] = {
                            date: responseDateAtMidnightString,
                        };
                    } else {
                        updates[`stages.${to.toLowerCase()}`] = {
                            date: update_date
                        };
                    }
                }

                // Update Firestore
                await updateDoc(sourceDocRef, updates);

                // Remove the application from the old column
                jobApplications.value[from] = jobApplications.value[from].filter(
                    (item) => item.id !== app.id
                );

                // Ensure the new column is an array (fixes empty column issue)
                if (!jobApplications.value[to]) {
                    jobApplications.value[to] = [];
                }

                // Add the application to the new column (force reactivity)
                jobApplications.value[to].push({ ...app, status: to });

                showDropConfirmModal.value = false;
                pendingDrop.value = null;
            } catch (err) {
                console.error("Error confirming status change:", err);
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
            // pop-up of the application cards
            openPopup,
            closePopup,
            showPopup,
            selectedAppId,
            // drop confirmation functionality
            drop,
            confirmDropStatus,
            pendingDrop,
            showDropConfirmModal,
            // show time
            statusChangeTime,
            // for working days calculation
            calculateWorkingDays,
            // for user-input dates and stageName
            responseDate,
            maxDate,
            stageName,
        };
    }
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

.dashboard {
    justify-content: center;
    align-items: center;
    /* margin-right: 30px; */
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
    justify-content: space-between;
}

.column {
    display: flex;
    flex-direction: column;
    background-color: #ffffff; /* White column background */
    padding: 15px;
    width: 250px;
    min-height: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.column h3 {
    text-align: center;
    background-color: #c24600; /* Light grey for the column header */
    color: #ffffff; /* Dark text */
    padding: 10px;
    border-radius: 5px;
    margin-top: 0;
    font-size: 14px;
    font-weight: bold;
}

.task {
    background-color: #f0f0f0; /* Light background for tasks */
    padding: 10px;
    margin: 10px 0;
    border-radius: 5px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    flex-direction: column;
    height: 90px;
}

.task-content {
    display: flex;
    flex-direction: column;
}

.company {
    font-size: 16px;
    font-weight: bold;
}

.position, .status {
    font-size: 10px;
}

.task:hover {
    background-color: #e2e2e2; /* Slightly darker on hover */
}

.delete-btn {
  background: none;
  border: none;
  color: red;
  font-size: 16px;
  float: right;
  cursor: pointer;
  margin-left: 111px;
  padding: 4px;
  margin-top:-63px;
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
