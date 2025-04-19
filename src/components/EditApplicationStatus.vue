<template>
    <form class="edit-status-form">
        <h3>Edit Application Status</h3>
        <div
            v-for="(stage, index) in editableStagesArray"
            :key="index"
            class="status-stage"
        >
            <label>Stage Name</label>
            <input type="text" v-model="stage.name" />
            <label>Date</label>
            <input type="date" v-model="stage.date" />
            <button type="button" @click="removeStage(index)">Remove</button>
        </div>
        <br />
        <div>
            <button type="button" @click="addStage">Add Stage</button>
            <button type="button" @click="cancelEdit" class="cancel-btn">
                Reset
            </button>
            <button
                type="button"
                @click="saveStatusTimeline"
                class="save-status-btn"
            >
                Save Status
            </button>
        </div>
    </form>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { DateTime } from "luxon";

const emit = defineEmits(["showToast", "status-updated"]);

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
        alert("You cannot remove the 'Applied' stage.");
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
            alert("Error: Illogical date sequence in status timeline.");
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
        alert(
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
        alert(
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
    gap: 16px;
    align-items: center;
    margin-bottom: 12px;
    border: 1px solid #eee;
    padding: 10px;
    border-radius: 6px;
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

.cancel-btn {
    padding: 10px 16px;
    background-color: #6c757d; /* Grey background */
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    position: absolute;
    bottom: 12px; /* Place it 12px from the bottom */
    right: 120px; /* Place it 120px from the right, which is to the left of the Save Status button */
}

.cancel-btn:hover {
    background-color: #5a6268; /* Darker grey on hover */
}

.save-status-btn {
    padding: 10px 10px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    position: absolute; /* Position the button absolutely within the form */
    bottom: 12px; /* Place it 12px from the bottom of the container */
    right: 12px; /* Place it 12px from the right of the container */
}

.save-status-btn:hover {
    background-color: #218838;
}
</style>
