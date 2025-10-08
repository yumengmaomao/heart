<template>
    <div id="app">
        <ParticleHeart />
    </div>
</template>

<script setup>
import ParticleHeart from "./components/ParticleHeart.vue"
</script>

<style>
html,
body {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background-color: #000;
}

#app {
    width: 100%;
    height: 100%;
}
</style>
