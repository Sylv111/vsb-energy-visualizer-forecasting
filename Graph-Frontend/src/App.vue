<template>
  <div id="app">
    <main class="main-content">
      <router-view />
    </main>

    <footer class="footer">
      <p>&copy; 2024 Universal CSV Processor - Data Visualization Tool</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}



.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

.footer {
  background-color: #f8f9fa;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
  border-top: 1px solid #e9ecef;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}
</style> 