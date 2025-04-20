<template>
    <form class="edit-status-form">
        <div
            v-for="(stage, index) in editableStagesArray"
            :key="index"
            class="status-stage"
        >
            <div class="input-group">
                <label>Stage Name</label>
                <input type="text" v-model="stage.name" />
            </div>
            <div class="input-group">
                <label>Date</label>
                <input type="date" v-model="stage.date" />
            </div>
            <button type="button" @click="removeStage(index)" class="remove-button">Remove</button>
        </div>
        <br />
        <div>
            <button type="button" @click="addStage" class="add-btn">+ Add Stage</button>
            <div class="form-actions">
                <button type="button" @click="cancelEdit" class="cancel-btn">
                    Reset
                </button>
                <button type="button" @click="saveStatusTimeline" class="save-status-btn">
                    Save Status
                </button>
            </div>
        </div>
    </form>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { DateTime } from "luxon";
import { useToast } from 'vue-toastification'

const emit = defineEmits(["showToast", "status-updated"]);
const toast = useToast()
const editableStagesArray = ref([]);
const originalStagesMap = ref({});
const terminalStatuses = ["Rejected", "Turned Down"];

const props = defineProps({
    userId: {
        type: String,
        required: true,
    },
    appId: {
        type: String,
        required: true,
    },
    cycle: {
        type: String,
        required: true,
    },
});

const docPath = doc(db, "Users", props.userId, props.cycle, props.appId);

onMounted(async () => {
    const snap = await getDoc(docPath);
    if (snap.exists() && snap.data().stages) {
        originalStagesMap.value = { ...snap.data().stages };
        editableStagesArray.value = Object.entries(snap.data().stages).map(
            ([name, details]) => {
                // Format the date to YYYY-MM-DD for the input type="date"
                const formattedDate = details.date
                    ? DateTime.fromISO(details.date).toISODate()
                    : DateTime.now().toISODate(); // Or handle null dates as needed
                return { name, date: formattedDate };
            }
        );
        // Sort the editable array for better initial display (optional, but good UX)
        editableStagesArray.value.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );
    } else {
        originalStagesMap.value = {};
        editableStagesArray.value = [];
    }
});

const cancelEdit = () => {
    editableStagesArray.value = Object.entries(originalStagesMap.value).map(
        ([name, details]) => {
            // Format the original date to the format used by input[type="date"]
            const formattedDate = details.date
                ? DateTime.fromISO(details.date).toISODate()
                : DateTime.now().toISODate(); // Or handle null dates as needed
            return { name, date: formattedDate };
        }
    );
};

const addStage = () => {
    editableStagesArray.value.push({
        name: "",
        date: DateTime.now().toISODate(),
    });
};

const removeStage = (index) => {
    if (editableStagesArray.value[index].name.toLowerCase() === "applied") {
        toast.error("You cannot remove the 'Applied' stage.");
        return;
    }
    editableStagesArray.value.splice(index, 1);
};

const saveStatusTimeline = async () => {
    // 1. Error Handling (36B) - Check for illogical date sequences
    for (let i = 0; i < editableStagesArray.value.length - 1; i++) {
        if (
            editableStagesArray.value[i].date &&
            editableStagesArray.value[i + 1].date &&
            new Date(editableStagesArray.value[i].date) >
                new Date(editableStagesArray.value[i + 1].date)
        ) {
            toast.error("Error: Illogical date sequence in status timeline.");
            return;
        }
    }

    // 2. Error Handling (36B) - Movement to/from Terminal Statuses and back to "Applied"

    // Determine the current latest status (might need a more robust way to define "current")
    const sortedStages = [...editableStagesArray.value].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );
    const currentLatestStageName =
        sortedStages.length > 0
            ? sortedStages[sortedStages.length - 1].name
            : "Applied"; // Default to 'Applied' if no stages

    // Check if the current latest status is terminal and the user is adding or modifying further stages
    if (terminalStatuses.includes(currentLatestStageName)) {
        toast.error(
            `Error: Cannot add or modify stages after a terminal status "${currentLatestStageName}".`
        );
        return;
    }

    // Check if the user is trying to set a stage back to "Applied" after a non-"Applied" stage existed
    const hasNonAppliedStageInitially = Object.keys(
        originalStagesMap.value
    ).some((stage) => stage.toLowerCase() !== "applied");
    const isSettingToApplied = editableStagesArray.value.some(
        (stage) => stage.name.toLowerCase() === "applied"
    );

    if (
        hasNonAppliedStageInitially &&
        isSettingToApplied &&
        Object.keys(originalStagesMap.value).length > 1
    ) {
        toast.error(
            "Error: Cannot set a stage back to 'Applied' after the application has progressed beyond it."
        );
        return;
    }

    // 3. Update Firebase with the stages map
    const updatedStagesMap = {};
    editableStagesArray.value.forEach((stage) => {
        updatedStagesMap[stage.name] = { date: stage.date };
        // If your stage details had other fields, you'd need to handle preserving them
    });

    if (
        JSON.stringify(updatedStagesMap) !==
        JSON.stringify(originalStagesMap.value)
    ) {
        try {
            await updateDoc(docPath, { stages: updatedStagesMap });
            originalStagesMap.value = { ...updatedStagesMap };
            emit("showToast", "Application Status Updated");

            // --- Determine the new overall status based on updatedStagesMap ---
            let newOverallStatus = "Applied"; // Default status
            const sortedStagesForStatus = Object.keys(updatedStagesMap).sort(
                (a, b) =>
                    new Date(updatedStagesMap[a].date) -
                    new Date(updatedStagesMap[b].date)
            );

            if (sortedStagesForStatus.length > 0) {
                const latestStageName =
                    sortedStagesForStatus[sortedStagesForStatus.length - 1];
                // Implement your status mapping logic here (same as in confirmDropStatus)
                if (latestStageName.toLowerCase().includes("assessment")) {
                    newOverallStatus = "Assessment";
                } else if (
                    latestStageName.toLowerCase().includes("interview")
                ) {
                    newOverallStatus = "Interview";
                } else if (latestStageName.toLowerCase().includes("offer")) {
                    newOverallStatus = "Offered";
                } else if (
                    latestStageName.toLowerCase().includes("reject") ||
                    latestStageName.toLowerCase().includes("decline")
                ) {
                    newOverallStatus = "Rejected";
                } else if (
                    latestStageName.toLowerCase().includes("turned down")
                ) {
                    newOverallStatus = "Turned Down";
                } else if (
                    sortedStagesForStatus[0].toLowerCase() !== "applied"
                ) {
                    newOverallStatus = latestStageName;
                }
            }

            // --- Update the overall 'status' field in Firebase ---
            await updateDoc(docPath, { status: newOverallStatus });
            // Emit new status for Kanban board to update locally
            emit("status-updated-manual", {
                appId: props.appId,
                newStatus: newOverallStatus,
            });
        } catch (error) {
            console.error("Error updating application status:", error);
            emit("showToast", "Error updating status.");
        }
    } else {
        emit("showToast", "No status changes to save.");
    }
};
</script>

<style scoped>
.edit-status-form {
    padding: 12px;
    position: relative; /* Make the container position relative */
}

h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-weight: bold;
}

.status-stage {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    margin-bottom: 12px;
    border: 1px solid #eee;
    padding: 12px;
    border-radius: 6px;
    background-color: #fafafa;
}

.status-stage label {
    font-weight: bold;
    min-width: 100px;
}

.status-stage input[type="text"],
.status-stage input[type="date"] {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    flex-grow: 1;
}

.status-stage button {
    padding: 8px 12px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.status-stage button:hover {
    background-color: #d32f2f;
}

.input-group {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 160px;
}

.input-group label {
	font-weight: 600;
	margin-bottom: 4px;
	font-size: 0.9rem;
}

.input-group input {
	padding: 8px;
	border: 1px solid #ccc;
	border-radius: 4px;
	font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.cancel-btn {
  padding: 10px 16px;
  background-color: #e2e8f0;
  color: #334155;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 120px;
}

.save-status-btn {
  padding: 10px 16px;
  background-color: #c24600;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 120px;
}

.save-status-btn:hover {
  background-color: #fc640d;
}

.remove-button {
    padding: 8px;
	border: 1px solid #ccc;
	border-radius: 4px;
    margin-top: 25px;
}

.add-btn {
    width: 100%;
    padding: 16px;
    background-color: #f0f9f0;
    color: #4caf50;
    border: 2px dashed #4caf50;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}
</style>
