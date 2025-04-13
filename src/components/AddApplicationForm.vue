<template>
    <div class="modal" @click.self="$emit('close')">
        <div class="modal-content">
            <h3>Add New Application</h3>
            <form @submit.prevent="submitApplication">
                <label>Company:</label>
                <input type="text" v-model="company" required />

                <label>Position:</label>
                <input type="text" v-model="position" required />

                <label>Job Type:</label>
                <input type="text" v-model="jobType" />

                <label>Location:</label>
                <input type="text" v-model="location" />

                <label>Salary (Optional):</label>
                <input type="text" v-model="salary" />

                <label>Notes:</label>
                <textarea v-model="notes"></textarea>

                <label>Date Applied:</label>
                <input 
                    type="date"
                    v-model="dateApplied"
                    :max="maxDate"
                    required
                />

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
import { collection, doc, setDoc, getDocs, updateDoc, query, where } from "firebase/firestore";
import { DateTime } from 'luxon';

export default {
    props: {
        userId: { 
            type: String,
            required: true
        }
    },

    emits: ["close", "application-added"],

    setup(props, { emit }) {
        const company = ref("");
        const position = ref("");
        const jobType = ref("");
        const location = ref("");
        const salary = ref("");
        const notes = ref("");
        const dateApplied = ref(DateTime.now().setZone('Asia/Singapore').toISODate()); // default to today's date
        const maxDate = ref(DateTime.now().setZone('Asia/Singapore').toISODate());

        const jobApplications = ref({
            Applied: [],
            Assessment: [],
            Interview: [],
            Offered: [],
            Rejected: [],
            "Turned Down": []
        });

        const submitApplication = async () => {
            if (!company.value || !position.value) return;

            const applicationsRef = collection(db, "Users", props.userId, "application_folder");

            const querySnapshot = await getDocs(query(applicationsRef, where("status", "==", "Applied")));
            const appliedApplications = querySnapshot.docs.map(doc => doc.data());

            console.log("hi", appliedApplications)

            // ensure that the application will be on the top upon creation
            const updatePromises = appliedApplications.map((data, index) => {
                const docRef = querySnapshot.docs[index].ref;
                const newRank = (data.rank || 0) + 1;
                return updateDoc(docRef, { rank: newRank });
            });

            await Promise.all(updatePromises);

            const newApplicationRef = doc(applicationsRef);

            const dateAppliedISO = DateTime.fromISO(dateApplied.value).toISO();

            const newApplication = {
                id: newApplicationRef.id,
                company: company.value,
                position: position.value,
                date_applied: dateAppliedISO,
                status: "Applied",
                notes: notes.value,
                last_updated: dateAppliedISO,
                last_status_date: DateTime.fromISO(dateApplied.value).toLocaleString(DateTime.DATE_SHORT),
                rank: 0,
                stages: {
                    applied: {
                        date: dateAppliedISO,
                    }
                },
                // i think can remove the below
                job_type: jobType.value || null,
                location: location.value || null,
                salary: salary.value || null,
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
            dateApplied,
            maxDate,
            submitApplication,
            jobApplications,
        };
    },
};
</script>

<style scoped>
.modal {
    position: fixed;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    overflow: hidden;
}

.modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 400px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

input, textarea {
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
