import { calculateHeartPoint, applyInwardForce, curve } from "./math.js"
import "./style.css"
import {
    createTimerTemplates,
    updateTimerParticles,
    resetTimerState,
    formatTime,
    calculateTimerWidth
} from "./timer.js"
import Particle from "./particle.js"

/** @type {HTMLCanvasElement | null} */
const canvas = document.getElementById("heartCanvas")

if (canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (ctx) {
        let animationFrameId
        let tick = 0
        let startTime = 0
        let timerTemplates = {}

        const init = () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)
            resetTimerState()

            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.scale(dpr, dpr)

            const canvasWidth = rect.width
            const canvasHeight = rect.height
            const centerX = canvasWidth / 2
            let centerY = canvasHeight / 2

            let shouldShowInfo = true

            const shortestSide = Math.min(canvasWidth, canvasHeight)
            const scale = shortestSide / 34

            let HEADING_FONT_SIZE, TIMER_FONT_SIZE, ILOVEYOU_FONT_SIZE
            let headingStartX, headingTextAlign

            if (canvasWidth <= 425) {
                shouldShowInfo = true
                headingStartX = centerX
                headingTextAlign = "center"
                HEADING_FONT_SIZE = Math.round(scale * 3.0)
                TIMER_FONT_SIZE = Math.round(scale * 2.8)
                ILOVEYOU_FONT_SIZE = Math.round(scale * 2.4)
            } else if (canvasWidth > 425 && canvasWidth < 1024) {
                shouldShowInfo = false
                HEADING_FONT_SIZE = 0
                TIMER_FONT_SIZE = 0
                ILOVEYOU_FONT_SIZE = Math.round(scale * 2.6)
            } else {
                shouldShowInfo = true
                headingStartX = 20
                headingTextAlign = "left"
                HEADING_FONT_SIZE = Math.round(scale * 2.2)
                TIMER_FONT_SIZE = Math.round(scale * 2.2)
                ILOVEYOU_FONT_SIZE = Math.round(scale * 2.6)
            }

            const HEADING_Y = canvasHeight * 0.05
            const TIMER_Y = HEADING_Y + HEADING_FONT_SIZE * 1.2

            const heartCenterY = centerY - canvasHeight * 0.05
            const textYOffset = scale * 0.2
            const textCenterY = heartCenterY + textYOffset

            const HIGHLIGHT_CHANCE = 0.05
            const TEXT_TO_DISPLAY = "I LOVE YOU"
            const HEADING_TEXT = "我们的爱已经跳动"
            const heartCenterX = centerX

            function generatePointsForText(
                text,
                centerX,
                centerY,
                fontSize,
                textAlign = "center",
                textBaseline = "middle"
            ) {
                ctx.font = `bold ${fontSize}px sans-serif`
                ctx.fillStyle = "white"
                ctx.textAlign = textAlign
                ctx.textBaseline = textBaseline
                ctx.fillText(text, centerX, centerY)

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imageData.data
                const points = []
                const step = 4

                for (let y = 0; y < canvas.height; y += step) {
                    for (let x = 0; x < canvas.width; x += step) {
                        const index = (y * canvas.width + x) * 4 + 3
                        if (index < data.length) {
                            const alpha = data[index]
                            if (alpha > 128) {
                                points.push({ x: x / dpr, y: y / dpr })
                            }
                        }
                    }
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height)
                return points
            }

            let headingPoints = []
            if (shouldShowInfo) {
                headingPoints = generatePointsForText(
                    HEADING_TEXT,
                    headingStartX,
                    HEADING_Y,
                    HEADING_FONT_SIZE,
                    headingTextAlign,
                    "top"
                )
            }
            const textPoints = generatePointsForText(TEXT_TO_DISPLAY, centerX, textCenterY, ILOVEYOU_FONT_SIZE)

            const skeletonPoints = []
            for (let i = 0; i < 1200; i++) {
                const t = Math.random() * 2 * Math.PI
                skeletonPoints.push(calculateHeartPoint(t, heartCenterX, heartCenterY, scale))
            }

            const allInitialPoints = []
            skeletonPoints.forEach((p) => allInitialPoints.push({ ...p, brightness: 0.85, type: "OUTLINE" }))

            for (let i = 0; i < 4000; i++) {
                const t = Math.random() * 2 * Math.PI
                const randomOutlinePoint = calculateHeartPoint(t, heartCenterX, heartCenterY, scale)
                const point = applyInwardForce(randomOutlinePoint, heartCenterX, heartCenterY, 0.05, 0.4)
                let brightness = 0.8
                if (Math.random() < HIGHLIGHT_CHANCE) brightness = 0.95
                allInitialPoints.push({ ...point, brightness, type: "EDGE" })
            }

            for (let i = 0; i < 2000; i++) {
                const p = skeletonPoints[Math.floor(Math.random() * skeletonPoints.length)]
                const point = applyInwardForce(p, heartCenterX, heartCenterY, 0.14, 0.5)
                let brightness = 0.5
                if (Math.random() < HIGHLIGHT_CHANCE) brightness = 0.95
                allInitialPoints.push({ ...point, brightness, type: "CENTER" })
            }

            textPoints.forEach((p) => {
                allInitialPoints.push({ ...p, brightness: 0.6, type: "TEXT" })
            })
            headingPoints.forEach((p) => {
                allInitialPoints.push({ ...p, brightness: 0.6, type: "TEXT" })
            })

            timerTemplates = createTimerTemplates(ctx, canvas, TIMER_FONT_SIZE)

            const TOTAL_TIMER_PARTICLES = 3000
            const timerParticles = []
            for (let i = 0; i < TOTAL_TIMER_PARTICLES; i++) {
                const p = new Particle("TIMER", 0, 0, 0.8)
                p.alpha = 0
                timerParticles.push(p)
            }

            const particles = [
                ...allInitialPoints.map((p) => new Particle(p.type, p.x, p.y, p.brightness)),
                ...timerParticles
            ]

            if (startTime === 0) {
                startTime = Date.now()
            }

            function animate() {
                const frame = tick / 100
                const ratio = 30 * curve(frame)
                ctx.clearRect(0, 0, canvas.width, canvas.height)

                if (shouldShowInfo) {
                    let timerStartX
                    const currentTimeString = formatTime(Date.now() - startTime)
                    const totalTimerWidth = calculateTimerWidth(timerTemplates, currentTimeString)

                    if (canvasWidth <= 425) {
                        timerStartX = (canvasWidth - totalTimerWidth) / 2
                    } else {
                        timerStartX = 20
                    }
                    updateTimerParticles(timerParticles, startTime, timerTemplates, ctx, timerStartX, TIMER_Y)
                }

                particles.forEach((particle) => {
                    particle.update(heartCenterX, heartCenterY, ratio, tick)
                    particle.draw(ctx)
                })
                tick++
                animationFrameId = requestAnimationFrame(animate)
            }
            animate()
        }

        init()
        const debouncedInit = debounce(init, 250)
        window.addEventListener("resize", debouncedInit)

        window.addEventListener("beforeunload", () => {
            window.removeEventListener("resize", debouncedInit)
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
        })
    }
}

function debounce(func, delay) {
    let timeout
    return function (...args) {
        clearTimeout(timeout)
        timeout = setTimeout(() => func.apply(this, args), delay)
    }
}
