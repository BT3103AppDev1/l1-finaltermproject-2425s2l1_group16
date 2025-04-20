<template>
    <div class="application-details-card">
        <div class="detail-item">
            <label>Company Name:</label>
            <input type="text" v-model="localApp.company" disabled />
        </div>

        <div class="detail-item">
            <label>Role Applied:</label>
            <input type="text" v-model="localApp.position" disabled />
        </div>

        <div class="detail-item">
            <label>Last Status Date: </label>
            <input type="text" v-model="localApp.last_status_date" disabled />
        </div>

        <div class="detail-item">
            <label>Job Portal URL:</label>
            <input type="text" v-model="localApp.url" disabled />
        </div>

        <div class="job-portal-fields">
            <div class="detail-item half-width">
                <label>Job Portal Username:</label>
                <input type="text" v-model="localApp.username" disabled />
            </div>

            <div class="detail-item half-width">
                <label>Job Portal Password:</label>
                <div class="password-wrapper">
                    <input
                        :type="showPassword ? 'text' : 'password'"
                        v-model="localApp.password"
                        disabled
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

        <div class="detail-item">
            <label>Job Description:</label>
            <textarea
                rows="3"
                v-model="localApp.description"
                disabled
            ></textarea>
        </div>

        <div class="detail-item">
            <label>Personal Notes:</label>
            <textarea rows="3" v-model="localApp.notes" disabled></textarea>
        </div>

        <div class="detail-item">
            <label>Application Journey:</label>
        </div>

        <div class="node-timeline">
            <template
                v-for="([stage, details], index) in sortedStages"
                :key="index"
            >
                <div
                    class="timeline-node"
                    :class="getStageColor(details.status || stage)"
                >
                    <div class="node-circle"></div>
                    <div class="node-label">
                        <strong>{{ formatStageLabel(stage) }}</strong>
                        <div class="node-date">
                            {{ formatDate(details.date) }}
                        </div>
                    </div>
                </div>
                <div
                    v-if="index !== sortedStages.length - 1"
                    class="timeline-arrow"
                >
                    →
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useToast } from "vue-toastification";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { getAuth } from "firebase/auth";

const toast = useToast();
const showPassword = ref(false);

// Get current user
const auth = getAuth();
const user = auth.currentUser;

// firestore data
const localApp = reactive({
    company: "",
    position: "",
    status: "",
    last_status_date: "",
    url: "",
    username: "",
    password: "",
    description: "",
    notes: "",
    stage_sequence: []
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

const docPath = doc(db, "Users", props.userId, props.cycle, props.appId);

const emit = defineEmits();

//stages node
const stages = ref({});

onMounted(async () => {
    const docSnap = await getDoc(docPath);
    if (docSnap.exists()) {
        const data = docSnap.data();
        Object.assign(localApp, data);
        stages.value = data.stages || {};
        emit("passCompany", localApp.company);
    } else {
        console.error("No such document!");
    }
});

const sortedStages = computed(() => {
    const entries = Object.entries(stages.value || {});

    return localApp.stage_sequence.map(stageKey => {
        const stageDetails = entries.find(([key]) => key === stageKey);

        if (stageDetails) {
            return stageDetails;
        }

        return [stageKey, { name: stageKey, date: '' }];
    });
});

const formatStageLabel = (key) => {
    const stage = stages.value[key];
    if (stage && stage.name && key.startsWith("interview_")) {
        return stage.name; // Return the custom name if it exists for interview stages
    }
    return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

// filter for status to get colour
const getStageColor = (stage) => {
    const statusKey = stage.toLowerCase();
    if (statusKey.includes("applied")) return "node-applied";
    if (statusKey.includes("assessment")) return "node-assessment";
    if (statusKey.includes("interview")) return "node-interview";
    if (statusKey.includes("offered")) return "node-offered";
    if (statusKey.includes("rejected")) return "node-rejected";
    if (statusKey.includes("turn")) return "node-turned-down";
    return "node-default";
};

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString();
};
</script>

<style scoped>
.application-details-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 12px;
    background-color: white;
    border-radius: 12px;
}

.detail-item {
    display: flex;
    flex-direction: column;
}

.detail-item label {
    font-weight: 600;
    margin-bottom: 8px;
    color: #334155;
}

.detail-item input,
.detail-item select {
    padding: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    background-color: #f1f5f9;
    color: #334155;
}

textarea {
    resize: none;
    height: 120px;
    background-color: #f1f5f9;
    padding: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    color: #334155;
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

.node-timeline {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    gap: 35px;
    margin-top: 12px;
    padding-left: 10px;
    position: relative;
    overflow-x: auto;
    scrollbar-width: thin;
}

.timeline-node {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    flex-direction: column;
}

.node-circle {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: #ccc;
}

.node-label {
    display: flex;
    flex-direction: column;
    font-size: 0.95rem;
    color: navy;
    text-align: center;
}

.node-date {
    font-size: 0.8rem;
    color: black;
}

.timeline-arrow {
    font-size: 1.25rem;
    color: black;
    margin-left: 5px;
    margin-top: -10px;
}

/* colours for the different stages */
.node-applied .node-circle {
    background-color: turquoise;
}
.node-assessment .node-circle {
    background-color: orange;
}
.node-interview .node-circle {
    background-color: purple;
}
.node-offered .node-circle {
    background-color: green;
}
.node-rejected .node-circle {
    background-color: red;
}
.node-turned-down .node-circle {
    background-color: grey;
}
.node-default .node-circle {
    background-color: black;
}

.job-portal-fields {
    display: flex;
    gap: 20px;
    width: 100%;
}

.job-portal-fields .detail-item {
    flex: 1;
}

.job-portal-fields .half-width {
    width: 100%;
}

.password-input {
    width: 100%;
}
</style>
