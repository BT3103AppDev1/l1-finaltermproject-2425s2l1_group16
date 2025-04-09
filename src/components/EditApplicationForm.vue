<template>
    <form class="edit-application-form">
      <div class="form-group">
        <label>Company Name</label>
        <input type="text" v-model="localApp.company" />
      </div>
  
      <div class="form-group">
        <label>Job Role</label>
        <input type="text" v-model="localApp.position" />
      </div>
  
      <div class="form-group">
        <label>Portal Username</label>
        <input type="text" v-model="localApp.username" />
      </div>
  
      <div class="form-group">
        <label>Portal Password</label>
        <input :type="showPassword ? 'text' : 'password'" v-model="localApp.password" />
        <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
          {{ showPassword ? 'Hide' : 'Show' }}
        </button>
      </div>
  
      <button type="button" class="update-btn" @click="confirmUpdate">Confirm Update</button>
  
      <hr />

      <div class="form-group">
        <label>Job Description</label>
        <textarea rows="3" v-model="localApp.description"></textarea>
      </div>
  
      <div class="form-group">
        <label>Personal Notes</label>
        <textarea rows="3" v-model="localApp.notes"></textarea>
      </div>
    </form>
</template>

<script setup>
import { ref, reactive, watch, onMounted, defineProps } from 'vue';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

const emit = defineEmits(['showToast', 'application-updated']);

const showPassword = ref(false);

const localApp = reactive({
  company: '',
  position: '',
  username: '',
  password: '',
  description: '',
  notes: ''
});

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

const originalApp = ref({});

const docPath = doc(db, 'Users', props.userId, 'application_folder', props.appId);

onMounted(async () => {
  const snap = await getDoc(docPath);
  if (snap.exists()) {
    const data = snap.data();
    Object.assign(localApp, data);
    originalApp.value = { ...data };
  }
});

const confirmUpdate = async () => {
  const updates = {};
  ['company', 'position', 'username', 'password'].forEach((field) => {
    if (localApp[field] !== originalApp.value[field]) {
      updates[field] = localApp[field];
    }
  });

  if (Object.keys(updates).length > 0) {
    await updateDoc(docPath, updates);
    Object.assign(originalApp.value, updates);
    emit('showToast', 'Application Updated');
    emit('application-updated', 'Application Updated (Confirmed)');
  }
};

// watcher for autosaving details
watch(
  () => [localApp.description, localApp.notes],
  async ([newDesc, newNotes], [oldDesc, oldNotes]) => {
    const updates = {};
    if (newDesc !== originalApp.value.description) updates.description = newDesc;
    if (newNotes !== originalApp.value.notes) updates.notes = newNotes;

    if (Object.keys(updates).length > 0) {
      await updateDoc(docPath, updates);
      Object.assign(originalApp.value, updates);
      emit('showToast', 'Application Updated');
      emit('application-updated');
    }
  }
);
</script>

<style scoped>
.edit-application-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 4px;
}

input,
textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

.update-btn {
  padding: 10px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.update-btn:hover {
  background-color: #2563eb;
}

.toggle-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 4px 8px;
  margin-top: 6px;
  width: fit-content;
}
</style>