<template>
    <div class="statistics-page">
        <div class="statistics-container">
            <div class="statistics-line">
                <div class="stat-item highlighted">
                    <h3 class="stat-label">Applied</h3>
                    <h2 class="stat-value">{{ number_applied }}</h2>
                </div>
                <div class="divider"></div>
                <div class="stat-item">
                    <h3 class="stat-label">Interviewed</h3>
                    <h2 class="stat-value">{{ number_interviewed }}</h2>
                </div>
                <div class="divider"></div>
                <div class="stat-item">
                    <h3 class="stat-label">Offered</h3>
                    <h2 class="stat-value">{{ number_offered }}</h2>
                </div>
                <div class="divider"></div>
                <div class="stat-item">
                    <h3 class="stat-label">Rejected</h3>
                    <h2 class="stat-value">{{ number_rejected }}</h2>
                </div>
            </div>
        </div>

        <div class="statistics-container">
            <p class="response-text">Singtel typically responds in:</p>
            <h1 class="response-time">{{ response_time }} Days</h1>
            <p class="response-status">This is considered <span class="fast-text">fast</span></p>
        </div>

        <div class="statistics-container">
            <div class="response-header">
                <p>Responses Tracked</p>
                <p class="response-subtext">Singtel usually responds on Thursdays</p>
            </div>
            <div class="graph-placeholder">
                <p>Graph goes here</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Statistics',
    data() {
        return {
            number_applied: 127,
            number_interviewed: 98,
            number_offered: 3,
            number_rejected: 67,
            response_time: 12
        }
    }
};
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

.fast-text {
    color: orange;
    font-weight: bold;
}

.response-header {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #444;
    font-weight: 500;
}

.response-subtext {
    color: #777;
}

.graph-placeholder {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    margin-top: 12px;
}
</style>