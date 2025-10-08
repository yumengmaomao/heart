<template>
    <div class="particle-container">
        <canvas ref="heartCanvas"></canvas>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import { ParticleSystem } from "../utils/ParticleSystem"

const heartCanvas = ref<HTMLCanvasElement | null>(null)

let particleSystem: ParticleSystem | null = null

onMounted(() => {
    if (heartCanvas.value) {
        particleSystem = new ParticleSystem(heartCanvas.value)

        particleSystem.start()
    }
})

onUnmounted(() => {
    if (particleSystem) {
        particleSystem.stop()
    }
})
</script>

<style scoped>
.particle-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #000;
}
canvas {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
