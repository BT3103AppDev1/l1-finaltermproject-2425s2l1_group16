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
</script>

<template>
  <div class="pop-up-button">
    <button @click="togglePopup">Open Application Information</button>
  </div>



  <div v-show="showPopup" id="popup-overlay" class="popup-overlay" @click="closePopup">
      <div class="application-info-pop-up">
         <!-- place X button at top right of the pop-up -->
   <button @click="togglePopup" class="close-btn">&times;</button>
        <div class="box">
          <section class="application-info">
            <h2>Application Information</h2>
            <ApplicationDetails />
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
.box {
  display: flex;
  background-color: #f0f0f0;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
}

.application-info, .insights {
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 10px; 
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