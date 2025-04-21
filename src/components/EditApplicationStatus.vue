<template>
    <form class="edit-status-form">
        <div
            v-for="(stage, index) in editableStagesArray"
            :key="stage.key"
            class="status-stage"
        >
            <div class="input-group stage-name-display">
                <label :for="'stage-name-' + index">Stage Name</label>
                <span :id="'stage-name-' + index" class="stage-name-text">{{
                    stage.displayName || formatStageKey(stage.key)
                }}</span>
            </div>
            <div class="input-group">
                <label :for="'stage-date-' + index">Date</label>
                <input
                    :id="'stage-date-' + index"
                    type="date"
                    v-model="stage.date"
                    :max="currentDate"
                />
            </div>
        </div>
        <div class="form-actions">
            <button type="button" @click="cancelEdit" class="cancel-btn">
                Reset Dates
            </button>
            <button
                type="button"
                @click="saveStatusTimeline"
                class="save-status-btn"
            >
                Save Dates
            </button>
        </div>
    </form>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { DateTime } from "luxon";
import { useToast } from "vue-toastification";

const emit = defineEmits(["showToast", "status-updated-manual"]);
const toast = useToast();

const editableStagesArray = ref([]); // Will store objects like { key, displayName, date }
const originalStagesMap = ref({}); // Still stores the raw Firestore stage map
const statusLevelMap = {
    Applied: 0,
    Assessment: 1,
    Interview: 2,
    Offered: 3,
    Rejected: 3,
    "Turned Down": 4, // Key needs to match result of getBaseStageName
};
const currentDate = DateTime.now().toISODate();

const props = defineProps({
    userId: { type: String, required: true },
    appId: { type: String, required: true },
    cycle: { type: String, required: true },
});

const docPath = doc(db, "Users", props.userId, props.cycle, props.appId);

// Function to create the stage object for the editable array
const createEditableStageObject = ([key, details]) => ({
    key: key, // The original Firestore key (e.g., "interview_1")
    displayName: details.name || null, // The specific name field if it exists (e.g., "Interview")
    date: details.date
        ? DateTime.fromISO(details.date).toISODate()
        : DateTime.now().toISODate(),
});

onMounted(async () => {
    try {
        const snap = await getDoc(docPath);
        if (snap.exists() && snap.data().stages) {
            const stages = snap.data().stages;
            originalStagesMap.value = JSON.parse(JSON.stringify(stages)); // Deep copy

            // Create the array with the new structure
            editableStagesArray.value = Object.entries(stages).map(
                createEditableStageObject
            );

            // Sort by date
            editableStagesArray.value.sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
            );
        } else {
            console.warn(`No stages found for docPath: ${docPath.path}`);
            originalStagesMap.value = {};
            editableStagesArray.value = [];
        }
    } catch (error) {
        console.error("Error fetching application stages:", error);
        toast.error("Failed to load application stages.");
        originalStagesMap.value = {};
        editableStagesArray.value = [];
    }
});

const cancelEdit = () => {
    // Rebuild the array from the original map using the same logic as onMounted
    editableStagesArray.value = Object.entries(originalStagesMap.value).map(
        createEditableStageObject
    );
    // Re-sort
    editableStagesArray.value.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    toast.info("Date changes reset.");
};

// Gets base name FROM THE KEY for level mapping (e.g., "interview_1" -> "Interview")
const getBaseStageNameFromKey = (stageKey) => {
    if (!stageKey) return "";
    const base = stageKey.split(/[_ ]/)[0];
    return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
};

// Formats the KEY for display only when details.name is not available
const formatStageKey = (stageKey) => {
    if (!stageKey) return "";
    const parts = stageKey.split(/[_ ]/);
    return parts
        .map((part, index) =>
            index === 0
                ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                : part
        )
        .join(" ");
};

const saveStatusTimeline = async () => {
    // Create the map using the stage.key for Firestore keys
    const updatedStagesMap = Object.fromEntries(
        editableStagesArray.value
            .filter((stage) => stage.key) // Ensure stage has a key
            .map((stage) => [
                stage.key, // <--- Use stage.key
                // Reconstruct the details, preserving other fields if necessary in future
                // For now, just updating the date based on current logic
                {
                    ...(originalStagesMap.value[stage.key] || {}), // Keep original fields
                    date: stage.date
                        ? DateTime.fromISO(stage.date).toISODate()
                        : null, // Update the date
                },
            ])
    );

    // Validation
    const sortedStagesForValidation = [...editableStagesArray.value]
        .filter((stage) => stage.date)
        .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

    for (let i = 0; i < sortedStagesForValidation.length - 1; i++) {
        const current = sortedStagesForValidation[i];
        const next = sortedStagesForValidation[i + 1];

        // Use the KEY to get the base name for level lookup
        const currentBaseName = getBaseStageNameFromKey(current.key); // <--- Use stage.key
        const nextBaseName = getBaseStageNameFromKey(next.key); // <--- Use stage.key

        const currentLevel = statusLevelMap[currentBaseName] ?? 99;
        const nextLevel = statusLevelMap[nextBaseName] ?? 99;
        const datesAreSame = current.date === next.date;

        if (currentLevel > nextLevel && !datesAreSame) {
            // Use formatStageKey in the error message for consistency if displayName isn't available
            const currentDisplayName =
                current.displayName || formatStageKey(current.key);
            const nextDisplayName =
                next.displayName || formatStageKey(next.key);
            toast.error(
                `Invalid Date Order: "${currentDisplayName}" on ${current.date} cannot be dated before "${nextDisplayName}" on ${next.date}.`
            );
            return;
        }
    }

    // --- Check for Actual Changes ---
    const originalComparableMap = Object.fromEntries(
        Object.entries(originalStagesMap.value).map(([key, details]) => [
            key,
            details.date ? DateTime.fromISO(details.date).toISODate() : null,
        ])
    );
    const updatedComparableMap = Object.fromEntries(
        // Use editableStagesArray directly as updatedStagesMap contains more than just date now
        editableStagesArray.value.map((stage) => [
            stage.key,
            stage.date ? DateTime.fromISO(stage.date).toISODate() : null,
        ])
    );

    if (
        JSON.stringify(originalComparableMap) ===
        JSON.stringify(updatedComparableMap)
    ) {
        toast.info("No date changes detected to save.");
        return;
    }

    // Save to Firebase
    try {
        // 1. Update the stages map (updatedStagesMap now contains full stage data with updated date)
        await updateDoc(docPath, { stages: updatedStagesMap });

        // 2. Update overall status (logic remains similar, uses keys)
        let newOverallStatus = "Applied";
        const sortedSavedStages = Object.entries(updatedStagesMap) // Use the map we are saving
            .filter(([, details]) => details.date)
            .sort(
                ([, a], [, b]) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
            );

        if (sortedSavedStages.length > 0) {
            const latestStageKey = sortedSavedStages.at(-1)[0]; // Get the key
            const latestStageBaseName = getBaseStageNameFromKey(latestStageKey); // Use key

            if (latestStageBaseName === "Assessment")
                newOverallStatus = "Assessment";
            else if (latestStageBaseName === "Interview")
                newOverallStatus = "Interview";
            else if (latestStageBaseName === "Offered")
                newOverallStatus = "Offered";
            else if (latestStageBaseName === "Rejected")
                newOverallStatus = "Rejected";
            else if (latestStageBaseName === "Turned down")
                newOverallStatus = "Turned Down"; // Check case
            else if (latestStageBaseName !== "Applied")
                newOverallStatus = latestStageBaseName;
        }

        await updateDoc(docPath, { status: newOverallStatus });

        // 3. Update local original map
        // Important: Since updatedStagesMap now contains potentially more than just date,
        // ensure it reflects the actual saved structure accurately.
        originalStagesMap.value = JSON.parse(JSON.stringify(updatedStagesMap));

        // 4. Notify success and emit
        toast.success("Application timeline and status updated!");
        emit("status-updated-manual", {
            appId: props.appId,
            newStatus: newOverallStatus,
        });
    } catch (error) {
        console.error("Error saving timeline:", error);
        toast.error(`Error saving timeline: ${error.message}`);
    }
};
</script>

<style scoped>
/* Styles remain the same */
.edit-status-form {
    padding: 12px;
    position: relative;
}

.status-stage {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end; /* Align bottom of label/input */
    margin-bottom: 16px;
    border: 1px solid #eee;
    padding: 12px;
    border-radius: 6px;
    background-color: #fafafa;
}

.input-group {
    display: flex;
    flex-direction: column;
    flex: 1; /* Allow groups to grow */
    min-width: 180px; /* Adjust min-width as needed */
}

.input-group label {
    font-weight: 600;
    margin-bottom: 4px;
    font-size: 0.9rem;
    color: #333;
}

/* Style for the non-editable stage name display */
.stage-name-display {
    flex-basis: 220px; /* Give name a bit more base width */
    flex-grow: 1.5; /* Allow name to grow slightly more if space allows */
}

.stage-name-text {
    padding: 8px;
    font-size: 1rem;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-height: 38px; /* Match input height */
    display: flex;
    align-items: center;
    color: #555;
    box-sizing: border-box;
    white-space: nowrap; /* Prevent wrapping */
    overflow: hidden; /* Hide overflow */
    text-overflow: ellipsis; /* Add ellipsis if text overflows */
}

.input-group input[type="date"] {
    padding: 7px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    height: 38px; /* Explicit height */
    box-sizing: border-box;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    flex-wrap: wrap;
}

.cancel-btn,
.save-status-btn {
    padding: 10px 16px;
    font-weight: bold;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    min-width: 120px;
    text-align: center;
}

.cancel-btn {
    background-color: #e2e8f0;
    color: #334155;
}
.cancel-btn:hover {
    background-color: #cbd5e1;
}

.save-status-btn {
    background-color: #c24600;
    color: white;
}

.save-status-btn:hover {
    background-color: #fc640d;
}
</style>
