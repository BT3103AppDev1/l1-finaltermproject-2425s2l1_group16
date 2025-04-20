<template>
    <form class="edit-status-form">
        <div
            v-for="(stage, index) in editableStagesArray"
            :key="stage.name"
            class="status-stage"
        >
            <div class="input-group stage-name-display">
                <label :for="'stage-name-' + index">Stage Name</label>
                <span :id="'stage-name-' + index" class="stage-name-text">{{
                    formatStageName(stage.name)
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

const editableStagesArray = ref([]);
const originalStagesMap = ref({});
// Removed unused terminalStatuses
const statusLevelMap = {
    Applied: 0,
    Assessment: 1,
    Interview: 2,
    Offered: 3,
    Rejected: 3, // same level as Offered
    "Turned Down": 4,
};

// currentDate for the max attribute in date input
const currentDate = DateTime.now().toISODate(); // Format: YYYY-MM-DD

const props = defineProps({
    userId: { type: String, required: true },
    appId: { type: String, required: true },
    cycle: { type: String, required: true },
});

const docPath = doc(db, "Users", props.userId, props.cycle, props.appId);

onMounted(async () => {
    try {
        const snap = await getDoc(docPath);
        if (snap.exists() && snap.data().stages) {
            const stages = snap.data().stages;
            // Deep copy for original map to prevent mutation issues
            originalStagesMap.value = JSON.parse(JSON.stringify(stages));

            editableStagesArray.value = Object.entries(stages).map(
                ([name, details]) => ({
                    name,
                    date: details.date
                        ? DateTime.fromISO(details.date).toISODate()
                        : DateTime.now().toISODate(), // Default to today if null/undefined
                })
            );

            // Sort for initial visual consistency
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
    // Reset based on the stored original map
    editableStagesArray.value = Object.entries(originalStagesMap.value).map(
        ([name, details]) => ({
            name,
            date: details.date
                ? DateTime.fromISO(details.date).toISODate()
                : DateTime.now().toISODate(),
        })
    );
    // Re-sort after resetting for visual consistency
    editableStagesArray.value.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    toast.info("Date changes reset.");
};

// Helper to normalize stage names for level lookup
const getBaseStageName = (stageName) => {
    if (!stageName) return "";
    // Handle potential variations like "Interview_Round1", "Assessment HR" -> "Interview", "Assessment"
    const base = stageName.split(/[_ ]/)[0]; // Split by underscore or space, take first part
    return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase(); // Capitalize first letter, rest lower
};

const formatStageName = (stageName) => {
    if (!stageName) return "";
    // Split by underscore or space
    const parts = stageName.split(/[_ ]/);
    // Capitalize the first part (e.g., "Interview") and leave the second part as is (e.g., "1")
    return parts
        .map(
            (part, index) =>
                index === 0
                    ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() // Capitalize the first part
                    : part // Keep the second part as is
        )
        .join(" "); // Join parts with a space
};

const saveStatusTimeline = async () => {
    // Create the map of stages to be saved *before* sorting for validation
    const updatedStagesMap = Object.fromEntries(
        editableStagesArray.value
            .filter((stage) => stage.name) // Ensure stage has a name
            .map((stage) => [
                stage.name,
                // Ensure date is stored consistently (e.g., YYYY-MM-DD or null)
                {
                    date: stage.date
                        ? DateTime.fromISO(stage.date).toISODate()
                        : null,
                },
            ])
    );

    // Validation
    // Create a sorted array from the edited data for validation checks
    const sortedStagesForValidation = [...editableStagesArray.value]
        .filter((stage) => stage.date) // Only consider stages with dates for sorting/validation
        .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

    // Check for illogical status level progression based on dates
    for (let i = 0; i < sortedStagesForValidation.length - 1; i++) {
        const current = sortedStagesForValidation[i];
        const next = sortedStagesForValidation[i + 1];

        // Use helper to get base name for level lookup
        const currentBaseName = getBaseStageName(current.name);
        const nextBaseName = getBaseStageName(next.name);

        // Lookup level, provide high number for unknown stages
        const currentLevel = statusLevelMap[currentBaseName] ?? 99;
        const nextLevel = statusLevelMap[nextBaseName] ?? 99;

        // Compare dates (YYYY-MM-DD strings are safe for direct comparison here)
        const datesAreSame = current.date === next.date;

        // Throw an error if
        // The current stage (earlier/same date) has a higher level than the next stage and Their dates are different (meaning 'current' is strictly earlier)
        if (currentLevel > nextLevel && !datesAreSame) {
            toast.error(
                // Updated error message for clarity
                `Invalid Date Order: "${formatStageName(current.name)}" on ${
                    current.date
                } cannot be dated before "${formatStageName(next.name)}" on ${
                    next.date
                }.`
            );
            return; // Stop the save process
        }
        // If dates are the same (datesAreSame is true), this check is skipped.
        // If level progression is correct (currentLevel <= nextLevel), it's also skipped.
    }

    // --- Check for Actual Changes ---
    // Convert original map values to comparable format (YYYY-MM-DD or null)
    const originalComparableMap = Object.fromEntries(
        Object.entries(originalStagesMap.value).map(([name, details]) => [
            name,
            details.date ? DateTime.fromISO(details.date).toISODate() : null,
        ])
    );
    const updatedComparableMap = Object.fromEntries(
        Object.entries(updatedStagesMap).map(([name, details]) => [
            name,
            details.date, // Already in YYYY-MM-DD or null from creation
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
        // 1. Update the stages map
        await updateDoc(docPath, { stages: updatedStagesMap });

        // 2. Update the overall status field based on the *new* latest stage/date
        let newOverallStatus = "Applied"; // Default
        // Re-sort the updated map entries to find the latest for status update
        const sortedSavedStages = Object.entries(updatedStagesMap)
            .filter(([, details]) => details.date) // Only consider stages with dates
            .sort(
                ([, a], [, b]) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
            );

        if (sortedSavedStages.length > 0) {
            const latestStageName = sortedSavedStages.at(-1)[0]; // Get the name of the latest stage
            const latestStageBaseName = getBaseStageName(latestStageName); // Use base name for status mapping

            // Determine overall status based on the latest stage name/level
            if (latestStageBaseName === "Assessment")
                newOverallStatus = "Assessment";
            else if (latestStageBaseName === "Interview")
                newOverallStatus = "Interview";
            else if (latestStageBaseName === "Offered")
                newOverallStatus = "Offered";
            else if (latestStageBaseName === "Rejected")
                newOverallStatus = "Rejected";
            else if (latestStageBaseName === "Turned down")
                newOverallStatus = "Turned Down";
            // Match case or handle in helper
            else if (latestStageBaseName !== "Applied")
                newOverallStatus = latestStageBaseName; // Use base name if not standard but not Applied
            // else it remains "Applied"
        }

        // Update the overall status field in Firebase
        await updateDoc(docPath, { status: newOverallStatus });

        // 3. Update local original map to reflect the saved state
        originalStagesMap.value = JSON.parse(JSON.stringify(updatedStagesMap)); // Deep copy

        // 4. Notify success and emit update event
        toast.success("Application timeline and status updated!");
        emit("status-updated-manual", {
            // Use the defined emit
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
