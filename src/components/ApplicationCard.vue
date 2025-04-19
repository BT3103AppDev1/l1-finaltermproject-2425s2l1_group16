<script setup>
import Statistics from "../components/Statistics.vue";
import ApplicationDetails from "../components/ApplicationDetails.vue";
import EditApplicationForm from "../components/EditApplicationForm.vue";
import EditApplicationStatus from "../components/EditApplicationStatus.vue";
import { ref, computed } from "vue";

const props = defineProps({
    show: Boolean,
    appId: String,
    userId: String,
    cycle: {
        type: String,
        required: true,
    },
});

console.log(
    "Cycle prop received in ApplicationCard:",
    props.cycle || "undefined"
);

// to close pop-up when clicked outside of the pop-up + update the clicktoedit fields
const editFormRef = ref(null);
const emit = defineEmits(["close"]);
const handleOverlayClick = async (e) => {
    if (
        activeTab.value === "edit-application" &&
        editFormRef.value?.saveAutoFields
    ) {
        await editFormRef.value.saveAutoFields();
    }
    emit("close");
};

// get the company name from the child (ApplicationDetails.vue)
const childCompany = ref("");

const handleCompanyUpdate = (companyName) => {
    childCompany.value = companyName;
};

// truncate company name if more than 10 characters
const truncatedCompany = computed(() => {
    if (childCompany.value.length > 10) {
        return childCompany.value.slice(0, 10) + "...";
    }
    return childCompany.value;
});

// Manage the state for the active tab
// Default is Application Details
const activeTab = ref("application-details");

const switchTab = async (tabName) => {
    if (
        activeTab.value === "edit-application" &&
        tabName !== "edit-application" &&
        editFormRef.value?.saveAutoFields
    ) {
        await editFormRef.value.saveAutoFields();
    }
    activeTab.value = tabName;
};

const toastMessage = ref("");

const showToast = (message) => {
    toastMessage.value = message;
    setTimeout(() => {
        toastMessage.value = "";
    }, 3000);
};

const detailsKey = ref(0);

// forces reactivity
const handleConfirmedUpdate = (msg) => {
    showToast(msg);
    activeTab.value = "application-details";
    detailsKey.value++;
};

const handleStatusUpdate = (message) => {
    console.log("Application updated:", message);
    // Emit an event to the Dashboard to reload applications
    emit("reload-applications");
    emit("close"); // Close the popup, which will trigger a reload in Dashboard
    // OR you could emit a specific 'reload-applications' event
    // emit('reload-applications');
    showToastMessage(message);
};
</script>

<template>
    <div
        v-show="show"
        id="popup-overlay"
        class="popup-overlay"
        @click="handleOverlayClick"
    >
        <div class="application-info-pop-up" @click.stop>
            <!-- place X button at top right of the pop-up -->
            <button @click="$emit('close')" class="close-btn">&times;</button>
            <div class="popup-header">
                <h1 class="company-name">{{ truncatedCompany }}</h1>
                <div class="action-links">
                    <a
                        href="#"
                        class="link-btn"
                        @click.prevent="switchTab('application-details')"
                        :class="{
                            'active-tab': activeTab === 'application-details',
                        }"
                        >Application Details</a
                    ><span class="separator"> | </span>
                    <a
                        href="#"
                        class="link-btn"
                        @click.prevent="switchTab('edit-application')"
                        :class="{
                            'active-tab': activeTab === 'edit-application',
                        }"
                        >Edit Application</a
                    ><span class="separator"> | </span>

                    <a
                        href="#"
                        class="link-btn"
                        @click.prevent="switchTab('edit-status')"
                        :class="{ 'active-tab': activeTab === 'edit-status' }"
                        >Edit Status</a
                    ><span class="separator"> | </span>

                    <a
                        href="#"
                        class="link-btn"
                        @click.prevent="switchTab('insights')"
                        :class="{ 'active-tab': activeTab === 'insights' }"
                        >Insights & Statistics</a
                    ><span class="separator"> | </span>
                    <a href="#" class="link-btn">Interview Questions</a>
                </div>
            </div>
            <div class="box">
                <section
                    v-if="activeTab === 'application-details'"
                    class="application-info"
                >
                    <h2 class="application-details-title">
                        Application Details
                    </h2>
                    <ApplicationDetails
                        :appId="appId"
                        @passCompany="handleCompanyUpdate"
                        :userId="userId"
                        :cycle="props.cycle"
                        @close="props.onClose"
                        :key="detailsKey"
                    />
                </section>
                <section
                    v-if="activeTab === 'edit-application'"
                    class="application-info"
                >
                    <h2 class="application-details-title">Edit Application</h2>
                    <EditApplicationForm
                        ref="editFormRef"
                        :appId="appId"
                        :userId="userId"
                        :cycle="props.cycle"
                        @close="props.onClose"
                        @application-updated="handleConfirmedUpdate"
                        @auto-save-update="
                            showToast('Application Updated (Auto-Saved)')
                        "
                    />
                </section>
                <section
                    v-if="activeTab === 'edit-status'"
                    class="application-info"
                >
                    <h2 class="application-details-title">
                        Edit Application Status
                    </h2>
                    <EditApplicationStatus
                        :appId="appId"
                        :userId="userId"
                        :cycle="props.cycle"
                        @close="props.onClose"
                        @status-updated-manual="handleStatusUpdate"
                        @auto-save-update="
                            showToast('Application Status Updated')
                        "
                    />
                </section>
                <section v-if="activeTab === 'insights'" class="insights">
                    <h2 class="application-details-title">
                        Insights & Statistics
                    </h2>
                    <Statistics :appId="appId" :userId="userId" />
                </section>
            </div>
        </div>
    </div>
    <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
</template>

<style scoped>
.popup-header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 10px 20px;
    background-color: #f0f0f0;
    border-radius: 10px;
    margin-bottom: -30px;
}

.application-details-title {
    padding: 12px;
    padding-top: 0;
    padding-bottom: 0;
}

.insights-title {
    padding: 12px;
    padding-top: 0;
    padding-bottom: 0;
}

.company-name {
    margin-left: 10px;
}

.action-links {
    display: flex;
    margin-left: 15px;
    margin-top: 5px;
}

.action-links a {
    color: #d67b35;
    font-size: 14px;
}

.action-links a:hover {
    text-decoration: underline;
    background-color: transparent;
}

.active-tab {
    font-weight: bold;
}

.separator {
    color: #d67b35;
    font-size: 16px;
    margin: 0 5px;
}

.box {
    background-color: #f0f0f0;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.application-info,
.insights {
    flex: 1;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    margin: 10px;
    max-height: 610px;
    overflow-y: auto; /* ensures it's scrollable */
}

.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
}

.application-info-pop-up {
    position: relative;
    width: 100%;
    max-width: 1000px;
}

.close-btn {
    position: absolute;
    top: 5px;
    right: 8px;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #64748b;
    z-index: 10;
    padding: 4px;
    line-height: 1;
}

.close-btn:hover {
    color: #475569;
}

.toast {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background-color: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
}
</style>
