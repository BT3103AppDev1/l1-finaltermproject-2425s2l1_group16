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
            <p class="response-text">Singtel typically responds in:</p>
            <h1 class="response-time">{{ response_time }} Days</h1>
            <!-- If response is < 7 days = fast 
                 If response is >= 7 days & < 14 days = medium
                 If not, slow -->
            <p class="response-status">This is considered 
                <span v-if="response_time < 7" class="fast-text">fast</span>
                <span v-else-if="response_time >= 7 && response_time < 14" class="medium-text">medium</span>
                <span v-else class="slow-text">slow</span>
            </p>
        </div>

        <div class="statistics-container">
            <div class="response-header">
                <p class="response-title">Responses Tracked</p>
                <div class="divider-vertical"></div>
                <p class="response-subtext">Singtel usually responds on Thursdays</p>
            </div>
            <div class="bar-chart">
                <p>Bar chart goes here</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db } from '@/firebase';
import { doc, getDoc, collectionGroup, query, where, getDocs } from 'firebase/firestore';

const number_applied = ref(0);
const number_interviewed = ref(0);
const number_offered = ref(0);
const number_rejected = ref(0);
const current_stage = ref(0);
// need to work on this
const response_time = 100;

onMounted(async () => {
  // Change this to the actual user
  const myDocRef = doc(db, "Users", "insights_me", "application_folder", "3JQC4QcVShXVJzX3lPJM");
  const myDocSnap = await getDoc(myDocRef);

  if (!myDocSnap.exists()) {
    console.error("No such document!");
    return;
  }

  const myData = myDocSnap.data();
  const company = myData.company;
  const position = myData.position;
  current_stage.value = myData.status;

  // Query across all users
  // Will need to double-check when we have multiple application folders
  const q = query(
    collectionGroup(db, "application_folder"),
    where("company", "==", company),
    where("position", "==", position)
  );

  const querySnapshot = await getDocs(q);

  const stats = {
    Applied: 0,
    Interview: 0,
    Offered: 0,
    Rejected: 0,
  };

  querySnapshot.forEach(doc => {
    const status = doc.data().status;
    if (status in stats) stats[status]++;
  });

  number_applied.value = stats.Applied;
  number_interviewed.value = stats.Interview;
  number_offered.value = stats.Offered;
  number_rejected.value = stats.Rejected;
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
    color: #555;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #222;
}

.highlighted .stat-label {
    color: #d67b35;
    font-weight: bold;
}

.highlighted .stat-value {
    color: #d67b35;
    font-weight: bold;
}

.pie-chart {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
}

.divider {
    width: 1px;
    background-color: #bbb;
    height: 40px;
}

.response-text {
    font-size: 16px;
    color: #555;
}

.response-time {
    font-size: 32px;
    font-weight: bold;
    color: #222;
}

.response-status {
    font-size: 14px;
    color: #666;
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
    font-size: 12px;
    margin-left: 8px;
}

.bar-chart {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    margin-top: 12px;
}
</style>