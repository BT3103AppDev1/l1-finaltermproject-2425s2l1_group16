<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { resetPoints } from './utils/resetPoints'

export default {
  name: 'App',
  setup() {
    const auth = getAuth();

    onMounted(() => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          await resetPoints();
        }
      });
    });
  }
}
</script>

<style>
* {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

html, body {
  height: 100%;
}

#app {
  min-height: 100vh;
  display: flex;
  padding-top: 20px;
}

h1, h2 {
  font-weight: bold;
}
</style>