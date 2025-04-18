<template>
    <div class="statistics-page">
        <div class="statistics-container">
            <div class="statistics-line">
                <div class="stat-item" :class="{ highlighted: current_stage === 'Applied' }">
                    <h3 class="stat-label">Applied</h3>
                    <h2 class="stat-value">{{ number_applied }}</h2>
                </div>
                <div class="divider"></div>
                <div class="stat-item" :class="{ highlighted: current_stage === 'Assessment' }">
                    <h3 class="stat-label">Assessment</h3>
                    <h2 class="stat-value">{{ number_assessment }}</h2>
                </div>
                <div class="divider"></div>
                <div class="stat-item" :class="{ highlighted: current_stage === 'Interview' }">
                    <h3 class="stat-label">Interview</h3>
                    <h2 class="stat-value">{{ number_interviewed }}</h2>
                </div>
                <div class="divider"></div>
                <div class="stat-item" :class="{ highlighted: current_stage === 'Offered' }">
                    <h3 class="stat-label">Offered</h3>
                    <h2 class="stat-value">{{ number_offered }}</h2>
                </div>
                <div class="divider"></div>
                <div class="stat-item" :class="{ highlighted: current_stage === 'Turned Down' }">
                    <h3 class="stat-label">Turned Down</h3>
                    <h2 class="stat-value">{{ number_turned_down }}</h2>
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
                <template v-if="hasPieData">
                    <VChart class="chart" :option="pieOptions" autoresize />
                </template>
                <template v-else>
                    <p class="not-enough-text">Not enough data available to display pie chart</p>
                </template>
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
            <template v-if="hasBarData">
                <div class="response-header">
                    <p class="response-title">Responses Tracked</p>
                    <div class="divider-vertical"></div>
                    <p class="response-subtext">{{ mostFrequentResponseDay }}</p>
                </div>
            </template>
                <template v-else>
                <p class="not-enough-text-response">Not enough data available to estimate response trends</p>
            </template>
            <div class="bar-chart">
                <template v-if="hasBarData">
                    <VChart class="chart" :option="barOptions" autoresize />
                </template>
                <template v-else>
                    <p class="not-enough-text">Not enough data available to display bar chart</p>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '@/firebase';
import { doc, getDoc, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { use } from 'echarts/core';
import VChart from 'vue-echarts';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';

// charts stuff
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  BarChart,
  GridComponent
]);

const number_applied = ref(0);
const number_assessment = ref(0);
const number_interviewed = ref(0);
const number_offered = ref(0);
const number_rejected = ref(0);
const number_turned_down = ref(0);
const current_stage = ref(0);
const company = ref('');
const position = ref('');
const response_time = ref(0);
const response_timeMessage = ref('');
const responseDaysMap = ref({});

// count if same company + role
const totalPieUsers = ref(0);
// count if same company only
const totalBarUsers = ref(0);

const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  appId: {
    type: String,
    required: true
  }
});

onMounted(async () => {
    const docPath = doc(db, "Users", props.userId, "application_folder", props.appId);

    const myDocSnap = await getDoc(docPath);

    if (!myDocSnap.exists()) {
        console.error("No such document!");
        return;
    }

    const myData = myDocSnap.data();
    position.value = myData.position;
    current_stage.value = myData.status;
    company.value = myData.company;

    // Query across all users
    // Will need to double-check when we have multiple application folders
    const q = query(
        collectionGroup(db, "application_folder"),
        where("company", "==", company.value),
        where("position", "==", position.value)
    );

    const querySnapshot = await getDocs(q);

    const stats = {
        Applied: 0,
        Assessment: 0,
        Interview: 0,
        Offered: 0,
        Rejected: 0,
        "Turned Down": 0,
    };

    const uniquePieUsers = new Set();
    let totalResponseTime = 0;
    let totalUsers = 0;

    querySnapshot.forEach(doc => {
        const status = doc.data().status;
        if (status in stats) stats[status]++;

        const application = doc.data();
        const parentPath = doc.ref.parent.parent?.path;
        if (parentPath) uniquePieUsers.add(parentPath);

        if (application.average_working_days) {
            totalResponseTime += application.average_working_days;
            totalUsers++;
        }
    });

    totalPieUsers.value = uniquePieUsers.size;

    if (totalUsers > 9) {
        response_time.value = Math.round(totalResponseTime / totalUsers);
        response_timeMessage.value = `${response_time.value} Days`;
    } else {
        response_timeMessage.value = 'Not enough data available to estimate average response time';
    }

    const barQuery = query(
        collectionGroup(db, "application_folder"),
        where("company", "==", company.value)
    );

    const barQuerySnapshot = await getDocs(barQuery);
    const uniqueBarUsers = new Set();

    barQuerySnapshot.forEach(doc => {
        const application = doc.data();
        const daysMap = application.response_days_map;
        if (daysMap) {
            for (let day in daysMap) {
                responseDaysMap.value[day] = (responseDaysMap.value[day] || 0) + daysMap[day];
            }
            const parentPath = doc.ref.parent.parent?.path;
            if (parentPath) uniqueBarUsers.add(parentPath);
        }
    });

    totalBarUsers.value = uniqueBarUsers.size;

    number_applied.value = stats.Applied;
    number_assessment.value = stats.Assessment;
    number_interviewed.value = stats.Interview;
    number_offered.value = stats.Offered;
    number_rejected.value = stats.Rejected;
    number_turned_down.value = stats['Turned Down'];
});

const mostFrequentResponseDay = computed(() => {
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const entries = Object.entries(responseDaysMap.value);
    if (entries.length === 0) return 'No data available';
    // to get the highest counts
    const sortedEntries = entries.sort((a, b) => b[1] - a[1]);
    const maxCount = sortedEntries[0][1];
    const mostFrequentDays = sortedEntries.filter(entry => entry[1] === maxCount)
                                          .map(entry => weekdayNames[entry[0]]);
    const dayList = mostFrequentDays.join(' and ');
    return `${company.value} usually responds on ${dayList}`;
});

// Pie chart data
const pieOptions = computed(() => {
    const themeColor = '#c24600';
    const translucent = '#c2460033';
    const borderColor = '#ffffff'; 
    const borderWidth = 2;

    const stageData = [
        { name: 'Applied', value: number_applied.value },
        { name: 'Assessment', value: number_assessment.value },
        { name: 'Interview', value: number_interviewed.value },
        { name: 'Offered', value: number_offered.value },
        { name: 'Turned Down', value: number_turned_down.value },
        { name: 'Rejected', value: number_rejected.value },
    ];

    const coloredData = stageData.map((stage) => ({
        ...stage,
        itemStyle: {
        color: stage.name === current_stage.value ? themeColor : translucent,
        borderColor,
        borderWidth,
        },
    }));

    return {
        title: {
            text: `Pooled Application Statistics for ${company.value}'s ${position.value} Role`,
            left: 'center',
            textStyle: {
                fontSize: 18,
                fontWeight: 'bold',
            }
        },
        tooltip: {
            trigger: 'item'
        },
        series: [
        {
            name: 'Applications',
            type: 'pie',
            radius: '60%',
            avoidLabelOverlap: false,
            label: {
            show: true,
            formatter: '{b}'
            },
            data: coloredData,
            emphasis: {
            itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
            }
        }
        ]
    };
});

// bar chart data
const barOptions = computed(() => {
    const themeColor = '#c24600';
    const translucent = '#c2460033';

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const values = [1, 2, 3, 4, 5].map(day => responseDaysMap.value[day] || 0);

    const max = Math.max(...values);
    const colors = values.map(v => (v === max && max > 0 ? themeColor : translucent));

    return {
        title: {
            text: `${company.value} Responds Rates`,
            left: 'center',
            top: 10,
            textStyle: {
                fontSize: 18,
                fontWeight: 'bold',
        }
        },
        xAxis: {
            type: 'category',
            data: labels,
            axisLabel: { fontSize: 12 },

        },
        yAxis: {
            type: 'value',
            axisLabel: { fontSize: 12 },
            splitLine: { show: false }  
        },
        series: [
        {
            data: values.map((v, i) => ({
            value: v,
            itemStyle: {
                color: colors[i],
                borderColor: '#fff',
                borderWidth: 1
            }
            })),
            type: 'bar',
            barWidth: '50%',
        }
        ],
        tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
        }
    };
});

const hasPieData = computed(() => totalPieUsers.value >= 10);
const hasBarData = computed(() => totalBarUsers.value >= 10);
</script>

<style scoped>
.statistics-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin: auto;
    padding: 12px;
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
    padding-top: 20px;
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

.not-enough-text-response {
    font-size: 14px;
    display: flex;
    align-items: center;
    font-weight: 500;
    color: #444;
    justify-content: flex-start;
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

.chart {
  width: 100%;
  height: 100%;
}
</style>