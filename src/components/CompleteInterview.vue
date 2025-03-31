<template>
    <div class="complete-interview-page">
        <button @click="openModal" class="complete-button">Complete Interview</button>

        <div v-if="isModalOpen" class="modal">
            <div class="modal-content">
                <span class="close" @click="closeModal">&times;</span>
                <h2 class="modal-title">Document Your Interview Questions</h2>
                <p class="modal-description">Your submissions will be anonymised. These questions will help your peers in their interview preparation and we hope that one day you will benefit from this same help too!</p>
                <label for="questionType">Question Type*</label>
                <select v-model="questionType" id="questionType">
                    <option value="Technical">Technical</option>
                    <option value="Current Affairs">Current Affairs</option>
                    <option value="General">General</option>
                    <!-- Add more options as needed -->
                </select>
                <label for="question">Question*</label>
                <input type="text" v-model="question" id="question" placeholder="How would you make a circle?">
                <label for="description">Description</label>
                <textarea v-model="description" id="description" placeholder="Your description here..."></textarea>
                <div class="modal-actions">
                    <button @click="handleSubmit" class="submit-button">Submit</button>
                    <button @click="closeModal" class="cancel-button">Cancel</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CompleteInterview',
    data() {
        return {
            isModalOpen: false,
            questionType: 'Technical',
            question: '',
            description: '',
        };
    },
    methods: {
        openModal() {
            this.isModalOpen = true;
        },
        closeModal() {
            this.isModalOpen = false;
        },
        handleSubmit() {
            alert(`Question: ${this.question}\nDescription: ${this.description}`);
            this.closeModal(); 
        }
    }
};
</script>

<style scoped>
.complete-interview-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: auto;
}

.complete-button {
    padding: 10px 20px;
    font-size: 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.complete-button:hover {
    background-color: #45a049;
}

.modal {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    width: 400px; /* Adjust width as needed */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    position: relative;
    color: black;
}

.modal-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
    color: black;
}

.modal-description {
    font-size: 14px;
    color: #666;
    margin-bottom: 20px;
}

.close {
    color: #aaa;
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 24px;
    cursor: pointer;
}

.close:hover {
    color: black;
}

label {
    font-weight: bold;
    margin-top: 10px;
}

input, select, textarea {
    width: 100%;
    padding: 10px;
    margin-top: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

textarea {
    height: 80px; /* Adjust height as needed */
}

.modal-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
}

.submit-button {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
}

.submit-button:hover {
    background-color: #45a049;
}

.cancel-button {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
}

.cancel-button:hover {
    background-color: #e53935;
}
</style>