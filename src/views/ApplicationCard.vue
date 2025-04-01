<script setup>
import Statistics from '../components/Statistics.vue'
import ApplicationDetails from '../components/ApplicationDetails.vue'

import { ref } from 'vue';

const showPopup = ref(false);

const togglePopup = () => {
  showPopup.value = !showPopup.value;
};

// close popup if clicked outside the box
const closePopup = (e) => {
  if (e.target.id == 'popup-overlay') {
    showPopup.value = false;
  }
}

const receivedCompany = ref('');

const handleCompanyUpdate = (companyName) => {
  receivedCompany.value = companyName;
};
</script>

<template>
  <!-- To be implemented in the actual Kanban Board (this is removed later)-->
  <div class="pop-up-button">
    <button @click="togglePopup">Open Application Information</button>
  </div>

  <div v-show="showPopup" id="popup-overlay" class="popup-overlay" @click="closePopup">
      <div class="application-info-pop-up">
        <!-- place X button at top right of the pop-up -->
        <button @click="togglePopup" class="close-btn">&times;</button>
        <div class="popup-header">
          <h1 class="company-name">{{ receivedCompany }}</h1>
          <div class="action-links">
            <a href="#" class="link-btn">Application Details</a><span class="separator"> | </span>
            <a href="#" class="link-btn">Edit Application</a><span class="separator"> | </span>
            <a href="#" class="link-btn">Delete Application</a><span class="separator"> | </span>
            <a href="#" class="link-btn">Insights & Statistics</a><span class="separator"> | </span>
            <a href="#" class="link-btn">Interview Questions</a>
          </div>
        </div>
        <div class="box">
          <section class="application-info">
            <h2>Application Details</h2>
            <ApplicationDetails @passCompany="handleCompanyUpdate" />
          </section>
          <section class="insights">
            <h2>Insights & Statistics</h2>
            <Statistics />
          </section>
        </div>
    </div>
  </div>
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
}

.separator {
  color: #d67b35;
  font-size: 16px;
  margin: 0 5px;
}

.box {
  display: flex;
  background-color: #f0f0f0;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  gap: 30px;
  justify-content: space-between;
}

.application-info, .insights {
  flex: 1;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 10px; 
  max-height: 610px;
}

.application-info {
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
  top: 2px;
  right: 6px;
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
</style>