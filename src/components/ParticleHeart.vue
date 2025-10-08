<template>
    <div class="particle-container">
        <canvas ref="heartCanvas"></canvas>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"

const heartCanvas = ref<HTMLCanvasElement | null>(null)

function generateTextPoints(
    text: string,
    canvasWidth: number,
    canvasHeight: number,
    fontSize: number,
    textCenterX: number,
    textCenterY: number
): Array<[number, number]> {
    const offscreenCanvas = document.createElement("canvas")
    const ctx = offscreenCanvas.getContext("2d")!
    offscreenCanvas.width = canvasWidth
    offscreenCanvas.height = canvasHeight
    ctx.font = `bold ${fontSize}px Arial`
    ctx.fillStyle = "#fff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text, textCenterX, textCenterY)
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
    const data = imageData.data
    const points: Array<[number, number]> = []
    const step = 4
    for (let y = 0; y < canvasHeight; y += step) {
        for (let x = 0; x < canvasWidth; x += step) {
            const alpha = data[(y * canvasWidth + x) * 4 + 3]
            if (alpha > 128) {
                points.push([x, y])
            }
        }
    }
    return points
}

class Particle {
    x: number
    y: number
    originX: number
    originY: number
    vx: number
    vy: number
    size: number
    color: string
    chamber: "RA" | "LA" | "RV" | "LV" | "TEXT"

    constructor(
        initialX: number,
        initialY: number,
        originX: number,
        originY: number,
        baseParticleSize: number,
        particleColor: string,
        centerX: number,
        centerY: number,
        isTextParticle: boolean = false
    ) {
        this.originX = originX
        this.originY = originY
        this.x = initialX
        this.y = initialY
        this.vx = 0
        this.vy = 0
        this.size = baseParticleSize * (Math.random() * 0.5 + 0.5)
        this.color = particleColor

        if (isTextParticle) {
            this.chamber = "TEXT"
        } else {
            if (originX < centerX && originY < centerY) this.chamber = "RA"
            else if (originX >= centerX && originY < centerY) this.chamber = "LA"
            else if (originX < centerX && originY >= centerY) this.chamber = "RV"
            else this.chamber = "LV"
        }
    }

    // --- 已移除心跳逻辑的简化版 update 方法 ---
    update(attractionForce: number, wanderStrength: number, friction: number): void {
        const baseDx = this.originX - this.x
        const baseDy = this.originY - this.y
        this.vx += baseDx * attractionForce + (Math.random() - 0.5) * wanderStrength
        this.vy += baseDy * attractionForce + (Math.random() - 0.5) * wanderStrength

        // --- 所有心跳相关的 if 判断和力计算都已移除 ---

        this.vx *= friction
        this.vy *= friction
        this.x += this.vx
        this.y += this.vy
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
    }
}

onMounted(() => {
    let animationFrameId: number

    // 将 onUnmounted 移到顶层，并只清理 animationFrame
    onUnmounted(() => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId)
        }
    })

    setTimeout(() => {
        const canvas = heartCanvas.value!
        if (!canvas) return
        const ctx = canvas.getContext("2d")!
        const rect = canvas.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)
        const canvasWidth = rect.width
        const canvasHeight = rect.height

        const heartYOffset = -canvasHeight * 0.1
        const textYOffset = canvasHeight * 0.39
        const heartCenterX = canvasWidth / 2
        const heartCenterY = canvasHeight / 2 + heartYOffset
        const textCenterX = canvasWidth / 2
        const textCenterY = canvasHeight / 2 + textYOffset

        // --- 参数定义 (移除了所有 BEAT 相关的参数) ---
        const scale = 20
        const PARTICLE_COUNT = 3500
        const ATTRACTION_FORCE = 0.01
        const WANDER_STRENGTH = 0.1
        const FRICTION = 0.93
        const PARTICLE_SIZE = 1.5
        const HEART_PARTICLE_COLOR = "rgba(255, 50, 80, 0.9)"
        const INNER_PARTICLE_RATIO = 0.5
        const INNER_PARTICLE_JITTER = 20
        const TEXT_TO_DISPLAY = "I LOVE YOU"
        const FONT_SIZE = 80
        const TEXT_PARTICLE_COLOR = "rgba(255, 255, 200, 0.9)"

        const particles: Particle[] = []

        const heartPoints = Array.from({ length: Math.ceil((2 * Math.PI) / 0.01) }, (_, i) => {
            const t = i * 0.01
            const x = 16 * Math.pow(Math.sin(t), 3)
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
            return [x, y]
        })
        const textPoints = generateTextPoints(
            TEXT_TO_DISPLAY,
            canvasWidth,
            canvasHeight,
            FONT_SIZE,
            textCenterX,
            textCenterY
        )

        // --- 创建粒子 (逻辑不变) ---
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // @ts-expect-error
            const [anchorMathX, anchorMathY] = heartPoints[Math.floor(Math.random() * heartPoints.length)]
            const anchorCanvasX = heartCenterX + anchorMathX * scale
            const anchorCanvasY = heartCenterY + anchorMathY * scale
            let originX: number, originY: number

            if (Math.random() < INNER_PARTICLE_RATIO) {
                const distanceFactor = Math.random() * 0.25 + 0.7
                originX =
                    heartCenterX + anchorMathX * distanceFactor * scale + (Math.random() - 0.5) * INNER_PARTICLE_JITTER
                originY =
                    heartCenterY + anchorMathY * distanceFactor * scale + (Math.random() - 0.5) * INNER_PARTICLE_JITTER
            } else {
                originX = anchorCanvasX
                originY = anchorCanvasY
            }
            particles.push(
                new Particle(
                    anchorCanvasX,
                    anchorCanvasY,
                    originX,
                    originY,
                    PARTICLE_SIZE,
                    HEART_PARTICLE_COLOR,
                    heartCenterX,
                    heartCenterY,
                    false
                )
            )
        }
        for (const [x, y] of textPoints) {
            particles.push(
                new Particle(x, y, x, y, PARTICLE_SIZE, TEXT_PARTICLE_COLOR, heartCenterX, heartCenterY, true)
            )
        }

        // --- 简化的动画循环 ---
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // --- 移除了能量衰减的计算 ---

            particles.forEach((p) => {
                // --- update 调用也已简化 ---
                p.update(ATTRACTION_FORCE, WANDER_STRENGTH, FRICTION)
                p.draw(ctx)
            })
            animationFrameId = requestAnimationFrame(animate)
        }

        // --- 不再有 setInterval, 直接启动动画 ---
        animate()
    }, 10)
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
