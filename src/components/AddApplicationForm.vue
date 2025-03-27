<template>
    <div class="modal">
        <div class="modal-content">
            <h3>Add New Application</h3>
            <form @submit.prevent="submitApplication">
                <label>Company:</label>
                <input type="text" v-model="company" required />

                <label>Position:</label>
                <input type="text" v-model="position" required />

                <label>Job Type:</label>
                <input type="text" v-model="jobType" required />

                <label>Location:</label>
                <input type="text" v-model="location" required />

                <label>Salary (Optional):</label>
                <input type="text" v-model="salary" />

                <label>Notes:</label>
                <textarea v-model="notes"></textarea>

                <div class="buttons">
                    <button type="button" @click="$emit('close')">
                        Cancel
                    </button>
                    <button type="submit">Add</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
import { ref } from "vue";
import { db } from "@/firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export default {
    emits: ["close", "application-added"],

    setup(_, { emit }) {
        const company = ref("");
        const position = ref("");
        const jobType = ref("");
        const location = ref("");
        const salary = ref("");
        const notes = ref("");

        const submitApplication = async () => {
            if (!company.value || !position.value || !jobType.value) return;

            const userId = "Cu8w7qKqftnyhdddVufn"; // Replace with dynamic user ID if necessary
            const newApplicationRef = doc(
                collection(db, "Users", userId, "application_folder")
            );
            const dateApplied = new Date().toISOString();

            const newApplication = {
                id: newApplicationRef.id,
                company: company.value,
                position: position.value,
                job_type: jobType.value,
                location: location.value,
                salary: salary.value || null,
                date_applied: dateApplied,
                status: "Applied",
                notes: notes.value,
                last_updated: dateApplied,
            };

            await setDoc(newApplicationRef, newApplication);

            emit("application-added", newApplication);
            emit("close");
        };

        return {
            company,
            position,
            jobType,
            location,
            salary,
            notes,
            submitApplication,
        };
    },
};
</script>

<style scoped>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 400px;
    max-width: 90%;
}

input,
textarea {
    width: 100%;
    padding: 8px;
    margin: 5px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
}

button {
    padding: 8px 12px;
    border: none;
    background: #007bff;
    color: white;
    border-radius: 5px;
    cursor: pointer;
}

button:hover {
    background: #0056b3;
}

button[type="button"] {
    background: #888;
}
</style>
