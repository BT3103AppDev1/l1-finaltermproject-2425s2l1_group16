<template>
    <div class="statistics-page">
        <div class="statistics-container">
            <div class="statistics-line">
                <div class="stat-item" :class="{ highlighted: current_stage === 'Applied' }">
                    <h3 class="stat-label">Applied</h3>
                    <h2 class="stat-value">{{ number_applied }}</h2>
                </div>
                <div class="divider"></div>
                <div class="stat-item" :class="{ highlighted: current_stage === 'Interview' }">
                    <h3 class="stat-label">Interviewed</h3>
                    <h2 class="stat-value">{{ number_interviewed }}</h2>
                </div>
                <div class="divider"></div>
                <div class="stat-item" :class="{ highlighted: current_stage === 'Offered' }">
                    <h3 class="stat-label">Offered</h3>
                    <h2 class="stat-value">{{ number_offered }}</h2>
                </div>
                <div class="divider"></div>
                <div class="stat-item" :class="{ highlighted: current_stage === 'Rejected' }">
                    <h3 class="stat-label">Rejected</h3>
                    <h2 class="stat-value">{{ number_rejected }}</h2>
                </div>
            </div>
        </div>

        <div class="statistics-container">
            <div class="pie-chart">
                <p>Pie chart goes here</p>
            </div>
        </div>

        <div class="statistics-container">
            <p v-if="response_timeMessage !== 'Not enough data available to estimate average response time'" class="response-text">{{ company }} typically responds in:</p>
            <h1 class="response-time" :class="{ 'not-enough-text': response_timeMessage === 'Not enough data available to estimate average response time' }">{{ response_timeMessage }}</h1>
            
            <!-- Conditionally show response speed only if enough data is available -->
            <!-- If response is < 7 days = fast 
            If response is >= 7 days & < 14 days = medium
            If not, slow -->
            <p v-if="response_timeMessage !== 'Not enough data available to estimate average response time'" class="response-status">
                This is considered 
                <span v-if="response_time < 7" class="fast-text">fast</span>
                <span v-else-if="response_time >= 7 && response_time < 14" class="medium-text">medium</span>
                <span v-else class="slow-text">slow</span>
            </p>
        </div>

        <div class="statistics-container">
            <div class="response-header">
                <p class="response-title">Responses Tracked</p>
                <div class="divider-vertical"></div>
                <p class="response-subtext">{{ mostFrequentResponseDay }}</p>
            </div>
            <div class="bar-chart">
                <p>Bar chart goes here</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '@/firebase';
import { doc, getDoc, collectionGroup, query, where, getDocs } from 'firebase/firestore';

const number_applied = ref(0);
const number_interviewed = ref(0);
const number_offered = ref(0);
const number_rejected = ref(0);
const current_stage = ref(0);
const company = ref('');
const response_time = ref(0);
const response_timeMessage = ref('');
const responseDaysMap = ref({});

const props = defineProps(['appId']);

onMounted(async () => {
    // Change this to the actual user
    const docPath = doc(db, "Users", "insights_me", "application_folder", props.appId);

    const myDocSnap = await getDoc(docPath);

    if (!myDocSnap.exists()) {
        console.error("No such document!");
        return;
    }

    const myData = myDocSnap.data();
    const position = myData.position;
    current_stage.value = myData.status;
    company.value = myData.company;

    // Query across all users
    // Will need to double-check when we have multiple application folders
    const q = query(
        collectionGroup(db, "application_folder"),
        where("company", "==", company.value),
        where("position", "==", position)
    );

    const querySnapshot = await getDocs(q);

    const stats = {
        Applied: 0,
        Interview: 0,
        Offered: 0,
        Rejected: 0,
    };

    let totalResponseTime = 0;
    let totalUsers = 0;

    querySnapshot.forEach(doc => {
        const status = doc.data().status;
        if (status in stats) stats[status]++;

        const application = doc.data();
        if (application.average_working_days) {
            totalResponseTime += application.average_working_days;
            totalUsers++;
        }

        if (totalUsers > 9) {
            response_time.value = Math.round(totalResponseTime / totalUsers);
            response_timeMessage.value = `${response_time.value} Days`;
        } else {
            response_timeMessage.value = 'Not enough data available to estimate average response time';
        }

        const daysMap = application.response_days_map;
        if (daysMap) {
            for (let day in daysMap) {
                responseDaysMap.value[day] = (responseDaysMap.value[day] || 0) + daysMap[day];
            }
        }
    });

    number_applied.value = stats.Applied;
    number_interviewed.value = stats.Interview;
    number_offered.value = stats.Offered;
    number_rejected.value = stats.Rejected;
});

const mostFrequentResponseDay = computed(() => {
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const entries = Object.entries(responseDaysMap.value);
    if (entries.length === 0) return 'No data available';
    // to get the highest counts
    const sortedEntries = entries.sort((a, b) => b[1] - a[1]);
    const mostFrequentDay = sortedEntries[0][0];
    const dayName = weekdayNames[mostFrequentDay];
    return `${company.value} usually responds on ${dayName}s`;
});
</script>

<style scoped>
.statistics-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin: auto;
}

.statistics-container {
    background-color: #f4f4f4;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
}

.statistics-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.stat-item {
    text-align: center;
    flex: 1;
}

.stat-label {
    font-size: 14px;
    font-weight: 500;
    color: #444;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
}

.highlighted .stat-label {
    color: #d67b35;
    font-weight: bold;
}

.highlighted .stat-value {
    color: #d67b35;
    font-weight: bold;
}

.pie-chart, .bar-chart{
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    height: 300px;
}

.bar-chart {
    margin-top:12px;
}

.divider {
    width: 1px;
    background-color: #bbb;
    height: 40px;
}

.response-text {
    font-size: 16px;
}

.response-time {
    font-size: 32px;
    font-weight: bold;
}

.not-enough-text {
    font-size: 16px;
}

.response-status {
    font-size: 14px;
}

.response-speed {
    font-weight: bold;
    font-size: 14px;
}

.fast-text {
    color: #37c559;
    font-weight: bold;
}

.medium-text {
    color: #c24600;
    font-weight: bold;
}

.slow-text {
    color: #ee3f3c;
    font-weight: bold;
}

.response-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 14px;
    color: #444;
    font-weight: 500;
    white-space: nowrap; /* Ensures text does not go to the next line if no space */
}

.response-title {
    margin-right: 8px;
}

.divider-vertical {
    width: 1px;
    background-color: #bbb;
    height: 15px;
    margin-top: 5px;
    margin-bottom: 5px;
}

.response-subtext {
    color: #777;
    margin-left: 8px;
}
</style>