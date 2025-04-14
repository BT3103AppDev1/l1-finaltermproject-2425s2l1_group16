<template>
    <div class="complete-interview-page">
        <button @click="openModal" class="complete-button">Complete Interview</button>

        <div v-if="isModalOpen" class="modal">
            <div class="modal-content">
                <span class="close" @click="closeModal">&times;</span>
                <h2 class="modal-title">Document Your Interview Questions</h2>
                <p class="modal-description">Your submissions will be anonymised. These questions will help your peers in their interview preparation and we hope that one day you will benefit from this same help too!</p>
                
                <!-- Question entries -->
                <div v-for="(entry, index) in questionEntries" :key="index" class="question-entry">
                    <label :for="'questionType' + index">Question Type*</label>
                    <select v-model="entry.questionType" :id="'questionType' + index">
                        <option value="Technical">Technical</option>
                        <option value="Behavioral">Behavioral</option>
                    </select>
                    
                    <label :for="'question' + index">Question*</label>
                    <input type="text" v-model="entry.question" :id="'question' + index" placeholder="How would you make a circle?">
                    
                    <label :for="'description' + index">Description</label>
                    <textarea v-model="entry.description" :id="'description' + index" placeholder="Your description here..."></textarea>
                    
                    <!-- Remove button for all entries except the first one -->
                    <button v-if="index > 0" @click="removeEntry(index)" class="remove-button">Remove</button>
                </div>

                <!-- Add question button -->
                <button @click="addQuestionEntry" class="add-button">
                    <span class="plus-icon">+</span> Add Another Question
                </button>

                <div class="modal-actions">
                    <button @click="handleSubmit" class="submit-button">Submit</button>
                    <button @click="closeModal" class="cancel-button">Cancel</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { db } from '@/firebase'
import { collection, getDocs, setDoc, doc } from 'firebase/firestore'

export default {
    name: 'CompleteInterview',
    props: {
        company: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isModalOpen: false,
            questionEntries: [{
                questionType: 'Technical',
                question: '',
                description: ''
            }]
        };
    },
    methods: {
        openModal() {
            this.isModalOpen = true;
        },
        closeModal() {
            this.isModalOpen = false;
            this.resetForm();
        },
        resetForm() {
            this.questionEntries = [{
                questionType: 'Technical',
                question: '',
                description: ''
            }];
        },
        addQuestionEntry() {
            this.questionEntries.push({
                questionType: 'Technical',
                question: '',
                description: ''
            });
        },
        removeEntry(index) {
            this.questionEntries.splice(index, 1);
        },
        async getNextQuestionNumber() {
            const querySnapshot = await getDocs(collection(db, 'InterviewQuestions'));
            return querySnapshot.size + 1;
        },
        async handleSubmit() {
            try {
                // Get the next question number
                const nextNumber = await this.getNextQuestionNumber();
                const docId = `question_${nextNumber}`;

                const questionData = {
                    company: this.company,
                    description: this.description,
                    question: this.question,
                    report: 0,
                    role: this.role,
                    type: this.questionType,
                    upvote: 0,
                    userID: 1
                };

                // Use setDoc with a specific document ID instead of addDoc
                await setDoc(doc(db, 'InterviewQuestions', docId), questionData);

                alert('Question submitted successfully!');
                this.closeModal();
            } catch (error) {
                console.error('Error submitting question:', error);
                alert('Error submitting question. Please try again.');
            }
        }
    }
};
</script>

<style scoped>
.complete-interview-page {
    width: 100%;
    display: block;
    margin: 4px 0 0 0;
}

.complete-button {
    padding: 6px 12px;
    font-size: 13px;
    background-color: #cb4e00;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    margin: 0;
    transition: background-color 0.2s ease;
}

.complete-button:hover {
    background-color: #863200;
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
    width: 400px;
    max-height: 80vh; 
    overflow-y: auto; 
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    position: relative;
    color: black;
    font-family: Arial, sans-serif;
}


.modal-content::-webkit-scrollbar {
    width: 8px;
}

.modal-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
    background: #555;
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
    font-family: Arial, sans-serif;
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
    font-family: Arial, sans-serif;
}

textarea {
    height: 80px; /* Adjust height as needed */
}

input::placeholder, textarea::placeholder {
    font-family: Arial, sans-serif;
    color: #666;
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

.question-entry {
    border: 1px solid #eee;
    padding: 15px;
    margin: 15px 0;
    border-radius: 4px;
    position: relative;
}

.add-button {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    background-color: #e8f5e9;
    color: #4CAF50;
    border: 1px dashed #4CAF50;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Arial, sans-serif;
}

.add-button:hover {
    background-color: #c8e6c9;
}

.plus-icon {
    font-size: 18px;
    margin-right: 8px;
}

.remove-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: #f44336;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.remove-button:hover {
    background-color: #d32f2f;
}

/* Ensure consistent font for all inputs */
input, select, textarea, button {
    font-family: Arial, sans-serif;
}

input::placeholder, textarea::placeholder {
    font-family: Arial, sans-serif;
}
</style>