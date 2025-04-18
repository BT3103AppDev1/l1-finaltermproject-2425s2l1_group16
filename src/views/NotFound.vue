<template>
    <div class="not-found-container">
      <h1>404</h1>
      <p class="message">Oops! The page you're looking for doesn't exist.</p>
      <router-link to="/dashboard" class="home-link">Go back to Dashboard</router-link>
    </div>
  </template>
  
  <script>
  export default {
    name: "NotFound",
  };
  </script>
  
  <style scoped>
  .not-found-container {
    text-align: center;
    margin-top: 100px;
    padding: 20px;
  }
  
  h1 {
    font-size: 80px;
    color: #c24600;
    margin-bottom: 10px;
  }
  
  .message {
    font-size: 18px;
    color: #555;
    margin-bottom: 20px;
  }
  
  .home-link {
    display: inline-block;
    padding: 10px 20px;
    background-color: #c24600;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
  }
  
  .home-link:hover {
    background-color: #fc640d;
  }
  </style>  