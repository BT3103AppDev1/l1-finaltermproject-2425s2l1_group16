<template>
  <div class="dashboard-wrapper">
    <div class="dashboard">
      <div class="header">
        <div class="logo-title-wrapper">
          <img
            src="../assets/logo-placeholder.png"
            alt="InternTrack Logo"
            class="logo-img"
          />
          <h1 class="main-title">Welcome!</h1>
        </div>
        <div class="profile-icon">
          <font-awesome-icon icon="fa-solid fa-user-circle" />
        </div>
      </div>
      <!-- for testing, please delete later -->
      <div class="sub-header">
        <p>For testing only: Welcome {{ userId }}!</p>
        <button @click="signOutUser">Log Out</button>
      </div>
      <div class="sub-header">
        <p>{{ summaryStats }}</p>
        <div class="sub-header-buttons">
          <div class="search-wrapper">
            <input
              type="text"
              placeholder="Search a company or role"
              class="search-input"
              v-model="searchQuery"
            />
            <button class="search-btn">
              <font-awesome-icon
                class="search-icon"
                icon="fa-solid fa-search"
              />
            </button>
          </div>
          <button @click="showForm = true">+ Add New Application</button>
        </div>
      </div>

      <div class="main-content">
        <div class="application-cycles">
          <h3>Application Cycles</h3>
          <div class="cycle-list">
            <div
              v-for="(cycle, index) in applicationCycles"
              :key="index"
              class="cycle-row"
            >
              <button
                @click="selectCycle(cycle)"
                :class="[
                  'cycle-button',
                  { 'active-cycle': selectedCycle === cycle },
                ]"
              >
                {{ formatCycleName(cycle) }}
              </button>
              <!-- Settings Icon -->
              <div class="cycle-settings-wrapper">
                <button
                  @click="openCycleSettingsModal(cycle)"
                  class="settings-button"
                >
                  <font-awesome-icon icon="fa-solid fa-gear" />
                </button>
              </div>
            </div>
          </div>

          <button @click="showCreateNewCyclePrompt" class="create-cycle-button">
            + Create New Cycle
          </button>
        </div>

        <div
          ref="kanban"
          class="kanban"
          @dragover="handleAutoScroll"
          @wheel="handleHorizontalScroll"
        >
          <div
            v-for="(applications, status) in filteredApplications"
            :key="status"
            class="column"
            @dragover.prevent
            @drop="drop(status, null)"
          >
            <h3>{{ statusLabels[status] }}</h3>

            <div
              v-for="(app, index) in collapsed[status] &&
              applications.length >= 5
                ? applications.slice(0, 5)
                : applications"
              :key="app.id"
              class="task"
              draggable="true"
              @dragstart="dragStart(app, status, index)"
              @dragover.prevent
              @drop="drop(status, index)"
              @click="
                (event) => {
                  // Check if the click originated from the CompleteInterview component
                  if (event.target.closest('.complete-interview-page')) {
                    return;
                  }
                  openPopup(app.id);
                }
              "
            >
              <div class="task-content">
                <span class="company">{{ app.company }}</span>
                <span class="position">{{ app.position }}</span>
                <span class="status"
                  >{{ app.status }} on {{ app.last_status_date }}</span
                >
                <div class="task-buttons">
                  <button
                    v-if="status === 'Interview'"
                    class="add-btn"
                    @click.stop="openAddInterviewModal(app.id)"
                  >
                    <font-awesome-icon
                      class="add-icon"
                      icon="fa-solid fa-plus"
                    />
                  </button>
                  <button
                    class="delete-btn"
                    @click.stop="confirmDelete(app, status)"
                  >
                    <font-awesome-icon
                      class="trash-icon"
                      icon="fa-solid fa-trash"
                    />
                  </button>
                </div>
                <CompleteInterview
                  v-if="status === 'Interview'"
                  :company="app.company"
                  :role="app.position"
                  :appId="app.id"
                />
              </div>
            </div>
            <button
              v-if="applications.length >= 5"
              @click="toggleCollapse(status)"
              class="collapse-btn"
            >
              {{ collapsed[status] ? "Show More" : "Show Less" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <teleport to="body">
    <AddApplicationForm
      v-if="showForm"
      @close="showForm = false"
      @application-added="handleApplicationAdded"
      :userId="userId"
      :currentCycle="selectedCycle"
    />
  </teleport>

  <teleport to="body">
    <div
      v-if="showCycleSettingsModal"
      class="modal-overlay"
      @click.self="closeCycleSettingsModal"
    >
      <div class="modal-content">
        <h3>Settings for "{{ formatCycleName(selectedCycleForSettings) }}"</h3>

        <div class="settings-options">
          <button @click="startRenameCycle(selectedCycleForSettings)">
            <font-awesome-icon icon="fa-solid fa-pen" />
            Rename Cycle
          </button>

          <button @click="confirmDeleteCycle(selectedCycleForSettings)">
            <font-awesome-icon icon="fa-solid fa-trash" />
            Delete Cycle
          </button>
        </div>

        <div class="modal-actions">
          <button @click="closeCycleSettingsModal">Close</button>
        </div>
      </div>
    </div>
  </teleport>

  <teleport to="body">
    <div
      v-if="showDropConfirmModal"
      class="modal-overlay"
      @click.self="showDropConfirmModal = false"
    >
      <div class="modal-content">
        <h3>Confirm Status Change</h3>
        <p>
          You are moving
          <strong>{{ pendingDrop?.app.company }}</strong> to
          <strong>{{ pendingDrop?.to }}</strong
          ><br />
        </p>

        <div
          v-if="
            pendingDrop?.to === 'Interview' || pendingDrop?.to === 'Assessment'
          "
        >
          <label for="stageName">Enter Stage Name:</label>
          <input
            type="text"
            id="stageName"
            v-model="stageName"
            placeholder="Enter stage name"
          />
        </div>

        <div
          v-if="
            pendingDrop?.to !== 'Applied' && pendingDrop?.to !== 'Turned Down'
          "
        >
          <label for="responseDate">Select Response Date:</label>
          <input
            type="date"
            id="responseDate"
            v-model="responseDate"
            :max="maxDate"
            required
          />
        </div>

        <div class="modal-actions">
          <button @click="confirmDropStatus">Confirm</button>
          <button @click="showDropConfirmModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </teleport>

  <teleport to="body">
    <div
      v-if="showAppDeleteModal"
      class="modal-overlay"
      @click.self="showAppDeleteModal = false"
    >
      <div class="modal-content">
        <h3>Are you sure you want to delete this application?</h3>
        <p>This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="performDelete" class="delete-button">Delete</button>
          <button @click="showAppDeleteModal = false" class="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </teleport>

  <teleport to="body">
    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      @click.self="showDeleteModal = false"
    >
      <div class="modal-content">
        <h3>
          Are you sure you want to delete "{{ formatCycleName(cycleToDelete) }}"
          application cycle?
        </h3>
        <p>This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="performDeleteCycle">Delete</button>
          <button @click="showDeleteModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </teleport>

  <teleport to="body">
    <ApplicationCard
      v-if="showPopup"
      :show="showPopup"
      :appId="selectedAppId"
      :userId="userId"
      :selectedCycle="selectedCycle"
      @close="closePopup"
    />
  </teleport>

  <teleport to="body">
    <div
      v-if="showAddInterviewModal"
      class="modal-overlay"
      @click.self="showAddInterviewModal = false"
    >
      <div class="modal-content">
        <h3>Add New Interview Stage</h3>
        <div class="input-group">
          <label>Interview Key:</label>
          <input
            type="text"
            :value="`Interview Number: ${computedInterviewKey.split('_')[1]}`"
            disabled
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="customStageName">Interview Name:</label>
          <input
            type="text"
            id="customStageName"
            v-model="customStageName"
            placeholder="e.g. HR Interview"
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="newInterviewDate">Select Date:</label>
          <input
            type="date"
            id="newInterviewDate"
            v-model="newInterviewDate"
            class="input-field"
            :max="maxDate"
          />
        </div>
        <div class="modal-actions">
          <button class="confirm-button" @click="addInterviewSubStage">
            Confirm
          </button>
          <button class="cancel-button" @click="showAddInterviewModal = false">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { DateTime } from "luxon";
import AddApplicationForm from "@/components/AddApplicationForm.vue";
import ApplicationCard from "@/components/ApplicationCard.vue";
import CompleteInterview from "@/components/CompleteInterview.vue";

export default {
  components: {
    AddApplicationForm,
    CompleteInterview,
    ApplicationCard,
  },

  setup() {
    // for logout (testing)
    const signOutUser = async () => {
      const auth = getAuth();
      try {
        await signOut(auth);
        console.log("User signed out successfully.");
        userId.value = null;
        router.push("/login");
      } catch (error) {
        console.error("Sign out error:", error);
      }
    };

    const userId = ref(null);
    const router = useRouter();
    const selectedAppId = ref(null);
    const showPopup = ref(false);

    const openPopup = (appId) => {
      selectedAppId.value = appId;
      showPopup.value = true;
    };

    const closePopup = () => {
      showPopup.value = false;
      selectedAppId.value = null;
    };

    const jobApplications = ref({
      Applied: [],
      Assessment: [],
      Interview: [],
      Offered: [],
      Rejected: [],
      "Turned Down": [],
    });

    const statusLabels = {
      Applied: "Applied",
      Assessment: "Assessment",
      Interview: "Interview",
      Offered: "Offered",
      Rejected: "Rejected",
      "Turned Down": "Turned Down",
    };

    const draggedApplication = ref(null);
    const sourceStatus = ref(null);
    const sourceIndex = ref(null);
    const showForm = ref(false);
    const showDeleteModal = ref(false);
    const showAppDeleteModal = ref(false);
    const appToDelete = ref(null);
    const appStatusToDelete = ref(null);

    const confirmDelete = (app, status) => {
      appToDelete.value = app;
      appStatusToDelete.value = status;
      showAppDeleteModal.value = true;
    };

    const performDelete = async () => {
      if (
        !appToDelete.value ||
        !appStatusToDelete.value ||
        !selectedCycle.value
      )
        return;

      try {
        const appRef = doc(
          db,
          "Users",
          userId.value,
          selectedCycle.value,
          appToDelete.value.id
        );

        await deleteDoc(appRef);

        const applicationsRef = collection(
          db,
          "Users",
          userId.value,
          selectedCycle.value
        );

        // -1 of the rank of everything after that application
        const deletedAppIndex = jobApplications.value[
          appStatusToDelete.value
        ].findIndex((app) => app.id === appToDelete.value.id);

        jobApplications.value[appStatusToDelete.value] = jobApplications.value[
          appStatusToDelete.value
        ].filter((item) => item.id !== appToDelete.value.id);

        // for rank update
        for (
          let i = deletedAppIndex;
          i < jobApplications.value[appStatusToDelete.value].length;
          i++
        ) {
          const app = jobApplications.value[appStatusToDelete.value][i];
          const appRef = doc(
            db,
            "Users",
            userId.value,
            selectedCycle.value,
            app.id
          );
          await updateDoc(appRef, { rank: i });
        }

        jobApplications.value[appStatusToDelete.value] = jobApplications.value[
          appStatusToDelete.value
        ].filter((item) => item.id !== appToDelete.value.id);

        showAppDeleteModal.value = false;
        appToDelete.value = null;
        appStatusToDelete.value = null;
      } catch (err) {
        console.error("Failed to delete:", err);
      }
    };

    const showCycleSettingsModal = ref(false);
    const selectedCycleForSettings = ref(null);

    const openCycleSettingsModal = (cycle) => {
      selectedCycleForSettings.value = cycle;
      showCycleSettingsModal.value = true;
    };

    const closeCycleSettingsModal = () => {
      showCycleSettingsModal.value = false;
      selectedCycleForSettings.value = null;
    };

    const applicationCycles = ref([]);
    const selectedCycle = ref(null);
    const displayCycles = computed(() => {
      return applicationCycles.value.map((cycle) => cycle.replace(/_/g, " "));
    });

    const fetchApplicationCycles = async () => {
      if (userId.value) {
        const userMetadataRef = doc(
          db,
          "Users",
          userId.value,
          "user_metadata",
          "cycles_list"
        );
        const docSnap = await getDoc(userMetadataRef);
        if (docSnap.exists() && docSnap.data().cycles) {
          applicationCycles.value = docSnap.data().cycles;
        } else {
          applicationCycles.value = [];
        }
      }
    };

    const loadApplications = async (selectedCycle = null) => {
      console.log();
      if (!userId.value) {
        console.log("User ID is not set. Waiting...");
        return;
      }

      if (!selectedCycle) {
        jobApplications.value = {
          Applied: [],
          Assessment: [],
          Interview: [],
          Offered: [],
          Rejected: [],
          "Turned Down": [],
        };
        return; // Don't load anything if no cycle is selected (or 'All Cycles' is active)
      }

      const applicationsRef = collection(
        db,
        "Users",
        userId.value,
        selectedCycle // Use the selected cycle as the subcollection name
      );

      const querySnapshot = await getDocs(applicationsRef);

      jobApplications.value = {
        Applied: [],
        Assessment: [],
        Interview: [],
        Offered: [],
        Rejected: [],
        "Turned Down": [],
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status;
        const stages = data.stages;
        console.log(stages);

        let latestStatus = null;
        let latestDate = null;

        for (let [stage, stageDetails] of Object.entries(stages)) {
          const stageDate =
            stageDetails && stageDetails.date
              ? DateTime.fromISO(stageDetails.date, {
                  zone: "Asia/Singapore",
                })
              : null;

          if (stageDate && (!latestDate || stageDate > latestDate)) {
            latestStatus = stage;
            latestDate = stageDate;
          }
        }

        const formattedLastStatusDate = latestDate
          ? latestDate.toLocaleString(DateTime.DATE_SHORT)
          : "N/A";

        jobApplications.value[status].push({
          id: doc.id,
          company: data.company,
          position: data.position,
          status: data.status,
          last_status_date: formattedLastStatusDate,
          dateApplied: data.date_applied,
          rank: data.rank ?? 0,
          // not sure if this is needed
          notes: data.notes,
          cycle: selectedCycle, // Store the cycle for filtering if needed later
        });
      });

      // list cards in each status according to their user-assigned rank
      Object.keys(jobApplications.value).forEach((status) => {
        jobApplications.value[status].sort(
          (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
        );
      });
    };

    const selectCycle = async (cycle) => {
      selectedCycle.value = cycle;
      console.log("Selected Cycle:", cycle);
      loadApplications(cycle);
      try {
        const userMetadataRef = doc(
          db,
          "Users",
          userId.value,
          "user_metadata",
          "cycles_list"
        );
        await updateDoc(userMetadataRef, { lastSelectedCycle: cycle });
      } catch (error) {
        console.error("Error updating last selected cycle:", error);
      }
    };

    // Ref for showing the create new cycle prompt
    const showCreateNewCyclePromptFlag = ref(false);
    const newCycleInputPrompt = ref("");

    // Function to show the create new cycle prompt
    const showCreateNewCyclePrompt = () => {
      const newCycleInput = prompt(
        "Enter a name for the new application cycle:",
        "Untitled Application Cycle"
      );
      if (newCycleInput) {
        createNewCycle(newCycleInput);
      }
    };

    // Function to create a new cycle (moved from the previous response)
    const createNewCycle = async (newCycleInput) => {
      const newCycleName = newCycleInput
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
      if (applicationCycles.value.includes(newCycleName)) {
        alert("A cycle with this name already exists.");
        return;
      }
      try {
        const userMetadataRef = doc(
          db,
          "Users",
          userId.value,
          "user_metadata",
          "cycles_list"
        );
        const docSnap = await getDoc(userMetadataRef);
        let existingCyclesArray =
          docSnap.exists() && docSnap.data().cycles
            ? [...docSnap.data().cycles]
            : [];
        existingCyclesArray.push(newCycleName);
        await setDoc(userMetadataRef, { cycles: existingCyclesArray });
        await fetchApplicationCycles(); // Refresh the sidebar list
        selectCycle(newCycleName); // Automatically switch to the new cycle
      } catch (error) {
        console.error("Error creating new cycle:", error);
        alert("Failed to create new cycle.");
      }
    };

    // Refs and methods for renaming
    const cycleToRename = ref(null);
    const newCycleNameInput = ref("");

    const startRenameCycle = (cycle) => {
      cycleToRename.value = cycle;
      newCycleNameInput.value = cycle; // Optionally pre-fill with the current name

      const newName = prompt("Enter new name for cycle:", cycle);
      if (newName && newName.trim() !== "") {
        renameCycle(cycle, newName);
      }

      // Close the settings modal after action is complete
      closeCycleSettingsModal();
    };

    const renameCycle = async (oldCycleName, newCycleInput) => {
      if (!oldCycleName || !newCycleInput) return;

      const newCycleName = newCycleInput
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

      if (
        newCycleName === oldCycleName ||
        applicationCycles.value.includes(newCycleName)
      ) {
        if (newCycleName === oldCycleName) {
          // Name hasn't changed
        } else {
          alert("A cycle with this name already exists.");
        }
        cycleToRename.value = null;
        newCycleNameInput.value = "";
        return;
      }

      try {
        // Initialize Firestore batch
        const batch = writeBatch(db);

        // First, copy all documents from the old collection to the new one
        const oldCollectionRef = collection(
          db,
          "Users",
          userId.value,
          oldCycleName
        );
        const querySnapshot = await getDocs(oldCollectionRef);

        // For each document in the old collection, create a new one in the new collection
        querySnapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          data.cycle = newCycleName;
          const newDocRef = doc(
            db,
            "Users",
            userId.value,
            newCycleName,
            docSnapshot.id
          ); // Correct usage of doc
          batch.set(newDocRef, data); // Add to batch
        });

        // Now update the cycles list metadata
        const userMetadataRef = doc(
          db,
          "Users",
          userId.value,
          "user_metadata",
          "cycles_list"
        );
        const docSnap = await getDoc(userMetadataRef);

        if (docSnap.exists() && docSnap.data().cycles) {
          const updatedCycles = docSnap
            .data()
            .cycles.map((cycle) =>
              cycle === oldCycleName ? newCycleName : cycle
            );

          const lastSelected =
            docSnap.data().lastSelectedCycle === oldCycleName
              ? newCycleName
              : docSnap.data().lastSelectedCycle;

          batch.set(userMetadataRef, {
            cycles: updatedCycles,
            lastSelectedCycle: lastSelected,
          }); // Update metadata in batch

          // Add delete operations for the old collection documents
          querySnapshot.docs.forEach((docSnapshot) => {
            const docRefToDelete = doc(
              db,
              "Users",
              userId.value,
              oldCycleName,
              docSnapshot.id
            ); // Correct usage of doc
            batch.delete(docRefToDelete); // Add delete to batch
          });
        }

        // Commit all batched operations
        await batch.commit();

        await fetchApplicationCycles(); // Refresh the sidebar

        if (selectedCycle.value === oldCycleName) {
          selectCycle(newCycleName); // Switch to the renamed cycle
        }

        cycleToRename.value = null;
        newCycleNameInput.value = "";
      } catch (error) {
        console.error("Error renaming cycle:", error);
        alert("Failed to rename cycle: " + error.message);
      }
    };

    const cycleToDelete = ref(null);

    const confirmDeleteCycle = (cycle) => {
      cycleToDelete.value = cycle;
      showDeleteModal.value = true;
      closeCycleSettingsModal();
      console.log(
        "Confirm Delete Cycle:",
        cycleToDelete.value,
        showDeleteModal.value
      );
    };

    const performDeleteCycle = async () => {
      if (!cycleToDelete.value) return;

      try {
        const userMetadataRef = doc(
          db,
          "Users",
          userId.value,
          "user_metadata",
          "cycles_list"
        );
        const docSnap = await getDoc(userMetadataRef);
        if (docSnap.exists() && docSnap.data().cycles) {
          const updatedCycles = docSnap
            .data()
            .cycles.filter((cycle) => cycle !== cycleToDelete.value);
          const lastSelected =
            docSnap.data().lastSelectedCycle === cycleToDelete.value &&
            updatedCycles.length > 0
              ? updatedCycles[0]
              : docSnap.data().lastSelectedCycle;
          await setDoc(userMetadataRef, {
            cycles: updatedCycles,
            lastSelectedCycle: lastSelected,
          });
          // Delete the entire subcollection for this cycle
          const applicationsRef = collection(
            db,
            "Users",
            userId.value,
            cycleToDelete.value
          );
          const querySnapshot = await getDocs(applicationsRef);
          const deletePromises = querySnapshot.docs.map((doc) =>
            deleteDoc(doc.ref)
          );
          await Promise.all(deletePromises);

          await fetchApplicationCycles(); // Refresh the sidebar
          selectedCycle.value =
            updatedCycles.length > 0 ? updatedCycles[0] : null;
          loadApplications(selectedCycle.value);
        }
        showDeleteModal.value = false;
        cycleToDelete.value = null;
      } catch (error) {
        console.error("Error deleting cycle:", error);
        alert("Failed to delete cycle.");
      }
    };

    watch(userId, (newUserId) => {
      if (newUserId) {
        loadApplications();
      }
    });

    // for collapsed button
    const collapsed = ref({
      Applied: true,
      Assessment: true,
      Interview: true,
      Offered: true,
      Rejected: true,
      "Turned Down": true,
    });

    onMounted(() => {
      const auth = getAuth();

      onAuthStateChanged(auth, async (user) => {
        if (user) {
          userId.value = user.uid;
          console.log("Logged in!", userId.value);
          await fetchApplicationCycles();
          const userMetadataRef = doc(
            db,
            "Users",
            userId.value,
            "user_metadata",
            "cycles_list"
          );
          const docSnap = await getDoc(userMetadataRef);
          if (
            docSnap.exists() &&
            docSnap.data().lastSelectedCycle &&
            applicationCycles.value.includes(docSnap.data().lastSelectedCycle)
          ) {
            selectedCycle.value = docSnap.data().lastSelectedCycle;
          } else if (applicationCycles.value.length > 0) {
            selectedCycle.value = applicationCycles.value[0]; // Optionally select the first cycle if no last selected or if the last selected is no longer valid
          } else {
            selectedCycle.value = null; // No cycles exist
          }
          loadApplications(selectedCycle.value);
        } else {
          router.push("/login");
          console.log("Not logged in..");
        }
      });

      // If user is already logged in on mount
      if (getAuth().currentUser) {
        userId.value = getAuth().currentUser.uid;
        fetchApplicationCycles();
        loadApplications(selectedCycle.value); // Load based on initial selectedCycle
      }
    });

    const handleHorizontalScroll = (event) => {
      const container = kanban.value;
      if (!container) return;

      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        container.scrollLeft += event.deltaX;
      }
    };

    const summaryStats = computed(() => {
      if (!selectedCycle.value) {
        return "";
      }
      const statusCounts = Object.keys(jobApplications.value).map((status) => {
        return `${jobApplications.value[status].length} ${statusLabels[status]}`;
      });
      return statusCounts.join(" | ");
    });

    const dragStart = (app, status, index) => {
      draggedApplication.value = app;
      sourceStatus.value = status;
      sourceIndex.value = index;
    };

    const pendingDrop = ref(null);
    const showDropConfirmModal = ref(false);

    const statusChangeTime = ref(null);

    const drop = async (newStatus, dropIndex = null) => {
      if (!draggedApplication.value || !selectedCycle.value) return;

      // shifting within the same status
      if (sourceStatus.value === newStatus) {
        const columnApps = jobApplications.value[newStatus];

        // shifting to the same place, no shift
        if (dropIndex === null) {
          draggedApplication.value = null;
          sourceStatus.value = null;
          sourceIndex.value = null;
          return;
        }

        const movedApp = columnApps.splice(sourceIndex.value, 1)[0];
        columnApps.splice(dropIndex, 0, movedApp);

        // shifting the ranks around within the same status
        for (let i = 0; i < columnApps.length; i++) {
          const appRef = doc(
            db,
            "Users",
            userId.value,
            selectedCycle.value,
            columnApps[i].id
          );
          await updateDoc(appRef, { rank: i });
        }

        draggedApplication.value = null;
        sourceStatus.value = null;
        sourceIndex.value = null;

        return;
      }

      // application is shifted to a new status
      const statusUpdateDate = DateTime.now().setZone("Asia/Singapore").toISO();
      statusChangeTime.value = statusUpdateDate;

      pendingDrop.value = {
        app: draggedApplication.value,
        from: sourceStatus.value,
        to: newStatus,
      };

      showDropConfirmModal.value = true;

      // Clear drag state
      draggedApplication.value = null;
      sourceStatus.value = null;
    };

    // for number of working days
    const calculateWorkingDays = (startDate, endDate) => {
      const start = DateTime.fromISO(startDate, {
        zone: "Asia/Singapore",
      }).startOf("day");
      const end = DateTime.fromISO(endDate, {
        zone: "Asia/Singapore",
      }).startOf("day");

      let currentDate = start;
      let workingDays = 0;

      while (currentDate <= end) {
        // check if it's a weekday (not Sunday or Saturday)
        if (currentDate.weekday !== 6 && currentDate.weekday !== 7) {
          workingDays++;
        }
        currentDate = currentDate.plus({ days: 1 });
      }

      return workingDays;
    };

    const responseDate = ref(
      DateTime.now().setZone("Asia/Singapore").toISODate()
    ); // default to today's date
    const stageName = ref("");
    const maxDate = ref(DateTime.now().setZone("Asia/Singapore").toISODate());

    const confirmDropStatus = async () => {
      if (!pendingDrop.value || !selectedCycle.value) return;

      const { app, from, to } = pendingDrop.value;

      const sourceDocRef = doc(
        db,
        "Users",
        userId.value,
        selectedCycle.value,
        app.id
      );

      try {
        const update_date = DateTime.now().setZone("Asia/Singapore").toISO();

        const responseDateAtMidnightString = DateTime.fromISO(
          responseDate.value,
          { zone: "Asia/Singapore" }
        )
          .startOf("day")
          .toISO();

        const formattedLastStatusDate = DateTime.fromISO(
          responseDateAtMidnightString
        ).toLocaleString(DateTime.DATE_SHORT);

        const updates = {
          status: to,
          last_updated: update_date,
          last_status_date: formattedLastStatusDate,
        };

        // for working days calculation + most frequent day a company responds
        const docSnapshot = await getDoc(sourceDocRef);

        if (!docSnapshot.exists()) {
          console.error("Document not found");
          return;
        }

        const appData = docSnapshot.data();
        const stages = appData.stages;

        let totalWorkingDays = 0;
        const stagesWithDates = [];

        const responseDaysMap = {};

        for (let [stage, stageDetails] of Object.entries(stages)) {
          if (stageDetails && stageDetails.date) {
            const stageDate = DateTime.fromISO(stageDetails.date, {
              zone: "Asia/Singapore",
            }).toJSDate();
            stagesWithDates.push({ stage, date: stageDate });

            // "Applied" and "Turned Down" stages are not stages that the company responds
            if (stage !== "applied" && stage !== "turned down") {
              const dayOfWeek = stageDate.getDay();
              // only care about work days (Mon to Fri, dayOfWeek 1 to 5)
              if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                responseDaysMap[dayOfWeek] =
                  (responseDaysMap[dayOfWeek] || 0) + 1;
              }
            }
          }
        }

        stagesWithDates.sort((a, b) => a.date - b.date);

        for (let i = 0; i < stagesWithDates.length - 1; i++) {
          const currentStage = stagesWithDates[i];
          const nextStage = stagesWithDates[i + 1];
          console.log(stagesWithDates);

          totalWorkingDays += calculateWorkingDays(
            currentStage.date,
            nextStage.date
          );
        }

        // "Applied" and "Turned Down" stages are not stages that the company responds
        if (to !== "Applied" && to !== "Turned Down") {
          // time taken to the new status?
          const latestDate = stagesWithDates[stagesWithDates.length - 1].date;
          const isoDate = DateTime.fromJSDate(latestDate)
            .setZone("Asia/Singapore")
            .toISO();
          console.log(isoDate);
          totalWorkingDays += calculateWorkingDays(
            isoDate,
            responseDateAtMidnightString
          );

          const responseDate = DateTime.fromISO(responseDateAtMidnightString, {
            zone: "Asia/Singapore",
          });
          const dayOfWeek = responseDate.weekday;

          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            responseDaysMap[dayOfWeek] = (responseDaysMap[dayOfWeek] || 0) + 1;
          }
        }

        // makes updates["average_working_days"] = 0
        if (totalWorkingDays <= 0) {
          updates["average_working_days"] = 0;
          // minus to account for the intervals between each stage transition
        } else {
          updates["average_working_days"] = Math.round(
            (totalWorkingDays - stagesWithDates.length) / stagesWithDates.length
          );
        }
        updates["response_days_map"] = { ...responseDaysMap };
        //

        if (to === "Interview") {
          // change to "interview"
          const type = to.toLowerCase();

          const existingStages = Object.keys(stages).filter((stage) =>
            stage.startsWith(type)
          );

          // Extract numbers from the stage names, if they exist (e.g., "interview_1" => 1)
          const stageNumbers = existingStages
            .map((stage) => {
              const match = stage.match(new RegExp(`${type}_(\\d+)`)); // Regex to match "interview_1"
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter((num) => num > 0);

          // If no valid stages exist, default to 1 (for "interview_1"), otherwise take the max number + 1
          const nextNum =
            stageNumbers.length > 0 ? Math.max(...stageNumbers) + 1 : 1;

          // Create the new stage with the next available number (either "interview_1" or the next number)
          const newStage = {
            name: stageName.value,
            date: responseDateAtMidnightString,
          };
          if (to === "Interview") {
            newStage.isCompleted = false;
          }
          updates[`stages.${type}_${nextNum}`] = newStage;
        } else {
          // For other statuses like "Applied", there's no applied_1, applied_2
          // Also, it does not make sense to use response date for Applied and Turned Down when response date is for a company
          if (to !== "Applied" && to !== "Turned Down") {
            updates[`stages.${to.toLowerCase()}`] = {
              date: responseDateAtMidnightString,
            };
          } else {
            updates[`stages.${to.toLowerCase()}`] = {
              date: update_date,
            };
          }
        }

        // Update Firestore
        await updateDoc(sourceDocRef, updates);

        // edit ranks of new status
        const targetColumn = jobApplications.value[to];
        for (let i = 0; i < targetColumn.length; i++) {
          const app = targetColumn[i];
          const appRef = doc(
            db,
            "Users",
            userId.value,
            "application_folder",
            app.id
          );
          await updateDoc(appRef, { rank: i + 1 }); // Shift rank by 1
        }

        // Remove the application from the old column
        jobApplications.value[from] = jobApplications.value[from].filter(
          (item) => item.id !== app.id
        );

        jobApplications.value[from].forEach(async (item, index) => {
          const appRef = doc(
            db,
            "Users",
            userId.value,
            selectedCycle.value,
            item.id
          );
          await updateDoc(appRef, { rank: index });
        });

        // Ensure the new column is an array (fixes empty column issue)
        if (!jobApplications.value[to]) {
          jobApplications.value[to] = [];
        }

        // Add the application to the new column (force reactivity)
        jobApplications.value[to].unshift({
          ...app,
          status: to,
          last_status_date: formattedLastStatusDate,
          rank: 0,
        });

        // clear inputs after confirmation
        stageName.value = "";
        responseDate.value = DateTime.now()
          .setZone("Asia/Singapore")
          .toISODate();

        showDropConfirmModal.value = false;
        pendingDrop.value = null;
      } catch (err) {
        console.error("Error confirming status change:", err);
      }
    };

    const handleApplicationAdded = (newApp) => {
      fetchApplicationCycles();
      if (
        selectedCycle.value === null ||
        selectedCycle.value === newApp.cycle
      ) {
        loadApplications(selectedCycle.value);
      }
      showForm.value = false;
    };

    const kanban = ref(null);

    const handleAutoScroll = (e) => {
      const scrollMargin = 100;
      const scrollSpeed = 10;
      const container = kanban.value;

      if (!container) return;

      const { left, right } = container.getBoundingClientRect();
      const mouseX = e.clientX;

      if (mouseX > right - scrollMargin) {
        container.scrollLeft += scrollSpeed;
      } else if (mouseX < left + scrollMargin) {
        container.scrollLeft -= scrollSpeed;
      }
    };

    // when pop-up is opened, only scroll the pop-ups
    watch(showPopup, (newVal) => {
      if (newVal) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });

    watch(showForm, (newVal) => {
      if (newVal) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });

    // for searching filter function
    const searchQuery = ref("");
    const filteredApplications = computed(() => {
      if (!searchQuery.value) {
        return jobApplications.value;
      } else {
        const lowerCaseSearchQuery = searchQuery.value.toLowerCase();
        return Object.keys(jobApplications.value).reduce((acc, status) => {
          acc[status] = jobApplications.value[status].filter(
            (app) =>
              app.company.toLowerCase().includes(lowerCaseSearchQuery) ||
              app.position.toLowerCase().includes(lowerCaseSearchQuery)
          );
          return acc;
        }, {});
      }
    });

    // for adding in stages when in interview
    const customStageName = ref("");
    const showAddInterviewModal = ref(false);
    const newInterviewAppId = ref(null);
    const newInterviewDate = ref(DateTime.now().toISODate());

    const computedInterviewKey = ref("");

    const openAddInterviewModal = async (appId) => {
      newInterviewAppId.value = appId;
      newInterviewDate.value = DateTime.now().toISODate();

      const appRef = doc(
        db,
        "Users",
        userId.value,
        "application_folder",
        appId
      );
      const snapshot = await getDoc(appRef);

      if (!snapshot.exists()) return;

      const data = snapshot.data();
      const stages = data.stages || {};
      const interviewKeys = Object.keys(stages).filter((key) =>
        key.startsWith("interview_")
      );

      const nextIndex = interviewKeys.length + 1;
      computedInterviewKey.value = `interview_${nextIndex}`;

      showAddInterviewModal.value = true;
    };

    const addInterviewSubStage = async () => {
      const appRef = doc(
        db,
        "Users",
        userId.value,
        "application_folder",
        newInterviewAppId.value
      );
      const snapshot = await getDoc(appRef);

      if (!snapshot.exists()) {
        console.error("Application not found");
        return;
      }

      const formattedDate = DateTime.fromISO(newInterviewDate.value)
        .setZone("Asia/Singapore")
        .toISO();

      const dateInShort = DateTime.fromISO(newInterviewDate.value)
        .setZone("Asia/Singapore")
        .toLocaleString(DateTime.DATE_SHORT);

      const newStage = {
        name: customStageName.value || computedInterviewKey.value, // fallback to key if empty
        date: formattedDate,
        isCompleted: false,
      };

      const stages = snapshot.data().stages || {};

      let totalWorkingDays = 0;
      const stagesWithDates = [];
      const responseDaysMap = {};

      for (let [stage, stageDetails] of Object.entries(stages)) {
        console.log("Stage:", stage, "Details:", stageDetails);
        if (stageDetails && stageDetails.date) {
          const stageDate = DateTime.fromISO(stageDetails.date, {
            zone: "Asia/Singapore",
          }).toJSDate();
          stagesWithDates.push({ stage, date: stageDate });

          if (stage !== "applied" && stage !== "turned down") {
            const dayOfWeek = stageDate.getDay();
            // Only consider weekdays (Monday to Friday)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              responseDaysMap[dayOfWeek] =
                (responseDaysMap[dayOfWeek] || 0) + 1;
            }
          }
        }
      }

      // Sort stages by date
      stagesWithDates.sort((a, b) => a.date - b.date);

      // Calculate working days between interview stages
      for (let i = 0; i < stagesWithDates.length - 1; i++) {
        const currentStage = stagesWithDates[i];
        const nextStage = stagesWithDates[i + 1];

        let currentStageDateISO = new Date(currentStage.date).toISOString();
        let nextStageDateISO = new Date(nextStage.date).toISOString();
        let currentStageDate = DateTime.fromISO(currentStageDateISO, {
          zone: "Asia/Singapore",
        });
        let nextStageDate = DateTime.fromISO(nextStageDateISO, {
          zone: "Asia/Singapore",
        });

        totalWorkingDays += calculateWorkingDays(
          currentStageDate.toISO(),
          nextStageDate.toISO()
        );
      }

      // calculate the working days between the next interview stage here
      const latestStage = stagesWithDates[stagesWithDates.length - 1];
      let latestStageDateISO = new Date(latestStage.date).toISOString();
      let nextInterviewStageDateISO = DateTime.fromISO(newInterviewDate.value)
        .setZone("Asia/Singapore")
        .toJSDate()
        .toISOString();
      totalWorkingDays += calculateWorkingDays(
        latestStageDateISO,
        nextInterviewStageDateISO
      );

      // Calculate average working days and store it in the updates object
      const averageWorkingDays =
        totalWorkingDays > 0
          ? Math.round(
              (totalWorkingDays - stagesWithDates.length) /
                stagesWithDates.length
            )
          : 0;

      const updates = {
        [`stages.${computedInterviewKey.value}`]: newStage,
        last_status_date: dateInShort,
        average_working_days: averageWorkingDays,
        response_days_map: { ...responseDaysMap },
      };

      await updateDoc(appRef, updates);

      console.log(`Added ${computedInterviewKey.value}`);

      // force reactivity
      const appIndex = jobApplications.value["Interview"].findIndex(
        (app) => app.id === newInterviewAppId.value
      );
      if (appIndex !== -1) {
        jobApplications.value["Interview"][appIndex].last_status_date =
          dateInShort;
      }

      showAddInterviewModal.value = false;
      customStageName.value = ""; // reset field
    };

    // prevent scroll up and down when modal is open
    watch(showAddInterviewModal, (newVal) => {
      if (newVal) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });

    //to collapse the cards
    const toggleCollapse = (status) => {
      collapsed.value[status] = !collapsed.value[status];
    };

    return {
      // testing
      signOutUser,
      userId,
      router,
      jobApplications,
      statusLabels,
      dragStart,
      drop,
      showForm,
      handleApplicationAdded,
      confirmDelete,
      performDelete,
      showAppDeleteModal,
      showDeleteModal,
      // pop-up of the application cards
      openPopup,
      closePopup,
      showPopup,
      selectedAppId,
      // drop confirmation functionality
      drop,
      confirmDropStatus,
      pendingDrop,
      showDropConfirmModal,
      // show time
      statusChangeTime,
      // for working days calculation
      calculateWorkingDays,
      // for user-input dates and stageName
      responseDate,
      maxDate,
      stageName,
      // for summary stats
      summaryStats,
      // for scrolling when draggin apps
      kanban,
      handleAutoScroll,
      handleHorizontalScroll,
      // for filtering
      searchQuery,
      filteredApplications,
      // application cycles
      applicationCycles,
      selectedCycle,
      selectCycle,
      showCreateNewCyclePrompt,

      //rename cycles
      cycleToRename,
      newCycleNameInput,
      startRenameCycle,
      renameCycle,

      //deleting cycles
      confirmDeleteCycle,
      performDeleteCycle,
      showDeleteModal,
      cycleToDelete,

      showCycleSettingsModal,
      selectedCycleForSettings,
      openCycleSettingsModal,
      closeCycleSettingsModal,
      //for stages
      showAddInterviewModal,
      newInterviewAppId,
      newInterviewDate,
      computedInterviewKey,
      openAddInterviewModal,
      addInterviewSubStage,
      customStageName,
      //for collpase function
      collapsed,
      toggleCollapse,
    };
  },
  methods: {
    formatCycleName(cycleName) {
      return cycleName
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    },
  },
};
</script>

<style scoped>
.logo-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  height: 50px;
  width: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #c24600;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.dashboard-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  height: 100vh;
}

.dashboard {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1400px;
}

.main-content {
  display: flex;
  gap: 20px;
  justify-content: space-between;
  width: 100%;
  padding-bottom: 20px;
}

.cycle-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  text-align: center;
}

.cycle-list p {
  font-size: 12px;
  color: black;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-icon {
  font-size: 40px;
  color: #333;
  cursor: pointer;
}

.sub-header {
  font-size: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-header-buttons {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.search-wrapper {
  display: flex;
  align-items: center;
  background-color: #c2470064;
  padding: 0px 10px;
  border-radius: 20px;
}

.search-input {
  border: none;
  outline: none;
  background-color: transparent;
  padding: 8px;
  width: 170px;
  height: 20px;
  border-radius: 20px;
}

.search-icon {
  width: 15px;
}

button {
  background-color: transparent; /* Blue button color */
  color: black;
  font-size: 16px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.kanban {
  display: flex;
  gap: 20px;
  justify-content: flex-start;
  width: 100%;
  margin-top: 10px;
  padding: 10px;
  overflow-x: auto;
  /* hide scrolls */
  scrollbar-width: none;
  -ms-overflow-style: none;
  min-height: 800px;
}

/* gives the effect of hiding the highlights */
.kanban::selection {
  background: #c24600;
}

.application-cycles {
  width: 160px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
  padding: 15px;
  margin-top: 20px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.column {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  padding: 15px;
  min-width: 220px;
  border-radius: 8px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.column h3,
.application-cycles h3 {
  text-align: center;
  background-color: #c24600;
  color: #ffffff;
  padding: 10px;
  border-radius: 5px;
  margin-top: 0;
  font-size: 16px;
  font-weight: bold;
  min-width: 100px;
}

.application-cycles h3 {
  font-size: 12px;
}

.task {
  background-color: #f0f0f0;
  padding: 10px;
  margin: 8px 0;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-direction: column;
  min-height: 100px;
  height: auto;
  position: relative;
  max-width: 100%;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company {
  font-size: 18px;
  font-weight: bold;
  color: black;
}

.position,
.status {
  font-size: 12px;
  color: black;
  margin-bottom: 4px;
}

.task:hover {
  background-color: #e2e2e2;
  cursor: grab;
}

.add-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 80%;
  position: absolute;
  top: 7px;
  right: 25px;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 80%;
  position: absolute;
  top: 7px;
  right: 2px;
}

.delete-btn:hover,
.add-btn:hover {
  background: rgba(211, 211, 211, 0.8);
}

.trash-icon {
  width: 12px;
}

.modal-content h3 {
  margin: 0 0 10px;
  font-weight: bold;
}

.modal-content p {
  margin-bottom: 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-actions button {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.input-group {
  margin-bottom: 15px;
}

.input-field {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
}

.confirm-button,
.delete-button {
  width: 100px;
  padding: 8px 0;
  border: none;
  border-radius: 5px;
  background-color: #c24600;
  color: white;
  font-weight: bold;
  cursor: pointer;
  text-align: center;
}

.delete-button {
  background-color: red;
}

.confirm-button:hover {
  background: #fc640d;
}

.cancel-button {
  width: 100px;
  background-color: #e2e8f0;
  color: #334155;
}

.cycle-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  text-align: center;
  align-items: stretch;
}

.cycle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  padding: 0; /* Remove padding from the row itself */
}

.cycle-button {
  all: unset;
  display: flex;
  flex-direction: column; /* Allow vertical stacking of text */
  justify-content: center;
  align-items: flex-start; /* Align text to the left */
  flex-grow: 1;
  text-align: center;
  font-size: 14px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  box-sizing: border-box;
  line-height: 1.2;
  white-space: normal; /* Allow text to wrap */
  word-wrap: break-word; /* Ensure long words break onto the next line */
  overflow: hidden;
  width: calc(100% - 30px); /* Adjust width to accommodate icon */
  border-right: 1px solid #eee; /* Optional: visual separator */
  border-radius: 6px 0 0 6px; /* Apply border-radius to the button side */
  min-height: 40px; /* Ensure it has a minimum height */
}

.cycle-button:hover {
  background-color: #f0f0f0;
}

.active-cycle {
  background-color: #c24600;
  color: white;
  font-weight: bold;
  border-radius: 6px !important; /* Override individual border-radius */
}

.cycle-settings-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  flex-shrink: 0;
}

.cycle-settings-wrapper button {
  all: unset;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 5px;
  border-radius: 0 6px 6px 0; /* Apply border-radius to the icon side */
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.cycle-settings-wrapper button:hover {
  background-color: #eee;
}

.cycle-settings-wrapper .font-awesome-icon {
  font-size: 16px;
  color: #555;
}

.collapse-btn {
  background-color: #c24600;
  padding: 8px 12px;
  font-size: 14px;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  margin-top: 10px;
}

.collapse-btn:hover {
  background-color: #fc640d;
}
</style>
