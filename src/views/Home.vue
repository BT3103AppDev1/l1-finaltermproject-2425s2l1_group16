<template>
  <div class="home">
    <h1>Welcome to the Application</h1>
    <h2>I created different links and files for each of our functionalities so that we may better work on them seperately then combine them later.</h2>
    <h2>If you need to go back to this page, just navigate back.</h2>
    <nav>
      <ul>
        <li><router-link to="/dashboard">Dashboard</router-link></li>
        <li><router-link to="/interview-questions">Interview Questions</router-link></li>
        <li><router-link to="/login">Login</router-link></li>
        <li><router-link to="/registration">Registration</router-link></li>
      </ul>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
nav ul {
  list-style-type: none;
  padding: 0;
}
nav li {
  margin: 10px 0;
}
</style>
