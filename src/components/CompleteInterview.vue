<template>
    <div class="complete-interview-page" @click.stop>
        <button 
            @click.stop.prevent="openModal" 
            class="complete-button"
        >Complete Interview</button>

        <div v-if="isModalOpen" class="modal" @click.stop>
            <div class="modal-content" @click.stop>
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
            // Get all documents and find the highest question number from document IDs
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
                // Validate that all required fields are filled
                for (const entry of this.questionEntries) {
                    if (!entry.question || !entry.questionType) {
                        alert('Please fill in all required fields marked with *');
                        return;
                    }
                }

                // Get the starting question number for this batch
                let nextQuestionNumber = await this.getNextQuestionNumber();

                // Submit each question entry
                for (const entry of this.questionEntries) {
                    const docId = `question_${nextQuestionNumber}`;

                    const questionData = {
                        company: this.company,
                        description: entry.description || '',
                        question: entry.question,
                        report: 0,
                        role: this.role,
                        type: entry.questionType,
                        upvote: 0,
                        userID: 1
                    };

                    // Add the main document with specific ID
                    const questionsRef = collection(db, 'InterviewQuestions');
                    const questionDocRef = doc(questionsRef, docId);
                    await setDoc(questionDocRef, questionData);

                    // Create report collection with 'insights_me' document
                    const reportRef = collection(questionDocRef, 'report');
                    await setDoc(doc(reportRef, 'insights_me'), {
                        reasons: [],
                        username: []
                    });

                    // Create upvote collection with 'insights_me' document
                    const upvoteRef = collection(questionDocRef, 'upvote');
                    await setDoc(doc(upvoteRef, 'insights_me'), {
                        username: []
                    });

                    // Increment the number for the next question
                    nextQuestionNumber++;
                }

                alert('Questions submitted successfully!');
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
    margin: 24px 0;
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
</style>