<template>
    <form class="edit-application-form">
        <div class="form-group">
            <label>Company Name:</label>
            <input type="text" v-model="localApp.company" class="locked-fields" disabled />
        </div>

        <div class="form-group">
            <label>Role Applied:</label>
            <input type="text" v-model="localApp.position" class="locked-fields" disabled />
        </div>

        <div class="form-group">
            <label>Last Status Date:</label>
            <input type="text" v-model="localApp.last_status_date" class="locked-fields" disabled />
        </div>

        <div class="form-group">
            <label>Job Portal URL:</label>
            <input type="text" v-model="localApp.url" />
        </div>

        <div class="job-portal-fields">
            <div class="form-group half-width">
                <label>Job Portal Username:</label>
                <input type="text" v-model="localApp.username" />
            </div>

            <div class="form-group half-width">
                <label>Job Portal Password:</label>
                <div>
                    <input
                        :type="showPassword ? 'text' : 'password'"
                        v-model="localApp.password"
                        class="password-input"
                    />
                    <button
                        type="button"
                        class="toggle-btn"
                        @click="showPassword = !showPassword"
                    >
                        {{ showPassword ? "Hide" : "Show" }}
                    </button>
                </div>
            </div>
        </div>

        <button type="button" class="update-btn" @click="confirmUpdate">
            Confirm Update
        </button>

        <hr />

        <div class="form-group">
            <label>Job Description</label>
            <textarea rows="3" v-model="localApp.description"></textarea>
        </div>

        <div class="form-group">
            <label>Personal Notes</label>
            <textarea rows="3" v-model="localApp.notes"></textarea>
        </div>
    </form>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from "vue";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";

const emit = defineEmits(["showToast", "application-updated"]);

const showPassword = ref(false);

const localApp = reactive({
    company: "",
    position: "",
    url: "",
    username: "",
    password: "",
    description: "",
    notes: "",
    last_status_date: ""
});

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

const originalApp = ref({});

const docPath = doc(db, "Users", props.userId, props.cycle, props.appId);

onMounted(async () => {
    const snap = await getDoc(docPath);
    if (snap.exists()) {
        const data = snap.data();
        Object.assign(localApp, data);
        originalApp.value = { ...data };
    }
});

const confirmUpdate = async () => {
    const updates = {};
    ["url", "username", "password"].forEach((field) => {
        if (localApp[field] !== originalApp.value[field]) {
            updates[field] = localApp[field];
        }
    });

    if (Object.keys(updates).length > 0) {
        await updateDoc(docPath, updates);
        Object.assign(originalApp.value, updates);
        emit("showToast", "Application Updated");
        emit("application-updated", "Application Updated (Confirmed)");
    }
};

//auto save details
const saveAutoFields = async () => {
    const updates = {};
    if (localApp.description !== originalApp.value.description) {
        updates.description = localApp.description;
    }
    if (localApp.notes !== originalApp.value.notes) {
        updates.notes = localApp.notes;
    }

    if (Object.keys(updates).length > 0) {
        await updateDoc(docPath, updates);
        Object.assign(originalApp.value, updates);
        emit("showToast", "Application Updated");
        emit("application-updated");
    }
};

defineExpose({ saveAutoFields });
</script>

<style scoped>
.edit-application-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 12px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    font-weight: 600;
    margin-bottom: 8px;
    color: #334155;
}

input,
textarea {
    padding: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
}

textarea {
    resize: none;
    height: 120px;
}

.update-btn {
    padding: 10px;
    background-color: #c24600;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
}

.update-btn:hover {
    background-color: #fc640d;
}

.toggle-btn {
    background: none;
    border: none;
    color: #c24600;
    font-size: 0.875rem;
    cursor: pointer;
    margin-left: 2px;
    margin-top: 8px;
    transition: color 0.2s ease;
}

.toggle-btn:hover {
    color: #fc640d;
}

.locked-fields {
    border-radius: 8px;
    font-size: 1rem;
    background-color: #f1f5f9;
    color: #334155;
}

.job-portal-fields {
    display: flex;
    gap: 20px;
    width: 100%;
}

.job-portal-fields .form-group {
    flex: 1;
}

.job-portal-fields .half-width {
    width: 100%;
}

.password-input {
    width: 100%;
}
</style>
