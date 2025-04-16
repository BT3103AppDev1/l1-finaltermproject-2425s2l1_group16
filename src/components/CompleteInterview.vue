<template>
    <div class="complete-interview-page">
        <button 
            @click.prevent="openModal" 
            class="complete-button"
        >Complete Interview</button>

        <div v-if="isModalOpen" class="modal" @mousedown.self="closeModal">
            <div class="modal-content">
                <span class="close" @click="closeModal">&times;</span>
                <h2 class="modal-title">Document Your Interview Questions</h2>
                <p class="modal-description">Your submissions will be anonymised. These questions will help your peers in their interview preparation and we hope that one day you will benefit from this same help too!</p>
                
                <!-- Round Navigation -->
                <div class="round-navigation">
                    <button 
                        @click="previousRound" 
                        class="nav-button" 
                        :disabled="currentRoundIndex === 0"
                    >
                        ← Previous Round
                    </button>
                    <span class="round-indicator">Round {{ currentRoundIndex + 1 }} of {{ interviewRounds.length }}</span>
                    <button 
                        @click="nextRound" 
                        class="nav-button" 
                        :disabled="currentRoundIndex === interviewRounds.length - 1"
                    >
                        Next Round →
                    </button>
                    <button 
                        v-if="interviewRounds.length > 1"
                        @click.stop="deleteCurrentRound" 
                        class="delete-round-button"
                    >
                        Delete Round
                    </button>
                </div>

                <!-- Current Round Info -->
                <div class="round-info">
                    <div class="round-header">
                        <input 
                            type="text" 
                            v-model="currentRound.roundName" 
                            placeholder="Round Name (e.g. Technical Round, HR Round)"
                            class="round-name-input"
                        >
                        <input 
                            type="date" 
                            v-model="currentRound.date"
                            class="round-date-input"
                        >
                    </div>

                    <!-- Question entries for current round -->
                    <div v-for="(entry, index) in currentRound.questions" :key="index" class="question-entry">
                        <label :for="'questionType' + index">Question Type*</label>
                        <select v-model="entry.questionType" :id="'questionType' + index">
                            <option value="Technical">Technical</option>
                            <option value="Behavioral">Behavioral</option>
                            <option value="General">General</option>
                            <option value="Current Affairs">Current Affairs</option>
                        </select>
                        
                        <label :for="'question' + index">Question*</label>
                        <input type="text" v-model="entry.question" :id="'question' + index" placeholder="How would you make a circle?">
                        
                        <label :for="'description' + index">Description</label>
                        <textarea v-model="entry.description" :id="'description' + index" placeholder="Your description here..."></textarea>
                        
                        <button v-if="index > 0" @click.stop="removeQuestion(index)" class="remove-button">Remove</button>
                    </div>

                    <!-- Add question button -->
                    <button @click="addQuestion" class="add-button">
                        <span class="plus-icon">+</span> Add Another Question
                    </button>
                </div>

                <!-- Add new round button -->
                <button @click="addNewRound" class="add-round-button">
                    <span class="plus-icon">+</span> Add New Round
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
import { collection, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore'

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
        },
        appId: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isModalOpen: false,
            currentRoundIndex: 0,
            interviewRounds: [{
                roundName: '',
                date: new Date().toISOString().split('T')[0],
                questions: [{
                    questionType: 'Technical',
                    question: '',
                    description: ''
                }]
            }]
        };
    },
    computed: {
        currentRound() {
            return this.interviewRounds[this.currentRoundIndex];
        }
    },
    methods: {
        openModal(event) {
            event.stopPropagation();
            this.isModalOpen = true;
        },
        closeModal(event) {
            if (event) event.stopPropagation();
            this.isModalOpen = false;
            this.resetForm();
        },
        resetForm() {
            this.currentRoundIndex = 0;
            this.interviewRounds = [{
                roundName: '',
                date: new Date().toISOString().split('T')[0],
                questions: [{
                    questionType: 'Technical',
                    question: '',
                    description: ''
                }]
            }];
        },
        previousRound() {
            if (this.currentRoundIndex > 0) {
                this.currentRoundIndex--;
            }
        },
        nextRound() {
            if (this.currentRoundIndex < this.interviewRounds.length - 1) {
                this.currentRoundIndex++;
            }
        },
        addNewRound() {
            this.interviewRounds.push({
                roundName: '',
                date: new Date().toISOString().split('T')[0],
                questions: [{
                    questionType: 'Technical',
                    question: '',
                    description: ''
                }]
            });
            this.currentRoundIndex = this.interviewRounds.length - 1;
        },
        addQuestion() {
            this.currentRound.questions.push({
                questionType: 'Technical',
                question: '',
                description: ''
            });
        },
        removeQuestion(index) {
            this.currentRound.questions.splice(index, 1);
        },
        deleteCurrentRound() {
            if (this.interviewRounds.length > 1) {
                this.interviewRounds.splice(this.currentRoundIndex, 1);
                if (this.currentRoundIndex === this.interviewRounds.length) {
                    this.currentRoundIndex--;
                }
            }
        },
        async getNextQuestionNumber() {
            const querySnapshot = await getDocs(collection(db, 'InterviewQuestions'));
            let maxNumber = 0;
            
            querySnapshot.forEach((doc) => {
                const docId = doc.id;
                if (docId.startsWith('question_')) {
                    const numberStr = docId.split('_')[1];
                    const number = parseInt(numberStr);
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            });
            
            return maxNumber + 1;
        },
        async handleSubmit() {
            try {
                // Validate all rounds
                for (const round of this.interviewRounds) {
                    if (!round.roundName) {
                        alert('Please provide a name for each round');
                        return;
                    }
                    for (const entry of round.questions) {
                        if (!entry.question || !entry.questionType) {
                            alert('Please fill in all required fields marked with *');
                            return;
                        }
                    }
                }

                let nextQuestionNumber = await this.getNextQuestionNumber();
                console.log('Starting question number:', nextQuestionNumber);

                // Submit questions for each round
                for (const round of this.interviewRounds) {
                    for (const entry of round.questions) {
                        const docId = `question_${nextQuestionNumber}`;
                        console.log('Processing question:', docId);

                        const questionData = {
                            company: this.company,
                            description: entry.description || '',
                            question: entry.question,
                            role: this.role,
                            type: entry.questionType,
                            userID: 1,
                            roundName: round.roundName,
                            interviewDate: round.date,
                            status: "Checked",
                            upvoteCount: 0,
                            reportCount: 0
                        };

                        console.log('Question data:', questionData);

                        try {
                            // Add the main document
                            const questionsRef = collection(db, 'InterviewQuestions');
                            const questionDocRef = doc(questionsRef, docId);
                            await setDoc(questionDocRef, questionData);
                            console.log('Question document created:', docId);

                            // Create report collection
                            const reportRef = collection(questionDocRef, 'report');
                            await setDoc(doc(reportRef, 'insights_me'), {
                                reasons: [],
                                username: []
                            });
                            console.log('Report collection created for:', docId);

                            // Create upvote collection
                            const upvoteRef = collection(questionDocRef, 'upvote');
                            await setDoc(doc(upvoteRef, 'insights_me'), {
                                username: []
                            });
                            console.log('Upvote collection created for:', docId);

                            nextQuestionNumber++;
                        } catch (error) {
                            console.error('Error creating question:', docId, error);
                            throw new Error(`Failed to create question ${docId}: ${error.message}`);
                        }
                    }
                }

                // Update the application with interview completion info
                try {
                    // First check if the application document exists
                    const appRef = doc(db, 'Users', 'insights_me', 'application_folder', this.appId);
                    const appDoc = await getDocs(collection(db, 'Users', 'insights_me', 'application_folder'));
                    
                    console.log('Checking application document:', this.appId);
                    console.log('Available application documents:', appDoc.docs.map(doc => doc.id));

                    // Create the document if it doesn't exist
                    const updateData = {
                        interviewCompleted: true,
                        interviewRounds: this.interviewRounds.length,
                        lastInterviewDate: this.interviewRounds[this.interviewRounds.length - 1].date
                    };

                    if (!appDoc.docs.find(doc => doc.id === this.appId)) {
                        console.log('Application document does not exist, creating new one');
                        await setDoc(appRef, updateData);
                    } else {
                        console.log('Application document exists, updating');
                        await updateDoc(appRef, updateData);
                    }
                    
                    console.log('Application updated successfully');
                } catch (error) {
                    console.error('Error updating application:', error);
                    // Continue even if application update fails
                    console.log('Continuing despite application update error');
                }

                alert('Questions submitted successfully!');
                this.closeModal();
            } catch (error) {
                console.error('Error in handleSubmit:', error);
                alert(`Error submitting questions: ${error.message}. Please try again.`);
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
    border-radius: 12px;
    padding: 40px;
    width: 800px;
    min-height: 500px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    position: relative;
    color: black;
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
}

.modal-title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 16px;
    color: #1a1a1a;
}

.modal-description {
    font-size: 16px;
    color: #666;
    margin-bottom: 32px;
    line-height: 1.6;
}

.question-entry {
    border: 1px solid #e0e0e0;
    padding: 24px;
    margin: 20px 0;
    border-radius: 8px;
    background-color: #fafafa;
    position: relative;
}

label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
    font-size: 15px;
}

input, select, textarea {
    width: 100%;
    padding: 12px;
    margin-bottom: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-size: 15px;
    background-color: white;
    transition: border-color 0.2s ease;
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #4CAF50;
}

textarea {
    height: 120px;
    resize: vertical;
}

.add-button {
    width: 100%;
    padding: 16px;
    margin: 24px 0 8px 0;
    background-color: #f0f9f0;
    color: #4CAF50;
    border: 2px dashed #4CAF50;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.add-button:hover {
    background-color: #e8f5e9;
}

.plus-icon {
    font-size: 20px;
    margin-right: 8px;
}

.modal-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: auto;
    padding-top: 32px;
}

.submit-button, .cancel-button {
    padding: 12px 28px;
    font-size: 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;
    min-width: 120px;
    text-align: center;
}

.submit-button {
    background-color: #4CAF50;
    color: white;
    border: none;
}

.submit-button:hover {
    background-color: #45a049;
}

.cancel-button {
    background-color: #f44336;
    color: white;
    border: none;
}

.cancel-button:hover {
    background-color: #d32f2f;
}

.remove-button {
    position: absolute;
    top: 16px;
    right: 16px;
    background-color: #f44336;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease;
}

.remove-button:hover {
    background-color: #d32f2f;
}

.close {
    position: absolute;
    top: 24px;
    right: 24px;
    font-size: 28px;
    color: #666;
    cursor: pointer;
    transition: color 0.2s ease;
}

.close:hover {
    color: #333;
}

.round-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 8px;
}

.nav-button {
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease;
}

.nav-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.round-indicator {
    font-size: 16px;
    font-weight: 500;
    color: #333;
}

.round-header {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
}

.round-name-input {
    flex: 2;
}

.round-date-input {
    flex: 1;
}

.add-round-button {
    width: 100%;
    padding: 16px;
    margin: 8px 0;
    background-color: #e3f2fd;
    color: #1976d2;
    border: 2px dashed #1976d2;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.add-round-button:hover {
    background-color: #bbdefb;
}

.delete-round-button {
    padding: 8px 16px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease;
    margin-left: 10px;
}

.delete-round-button:hover {
    background-color: #d32f2f;
}
</style>