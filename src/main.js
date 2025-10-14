import { calculateHeartPoint, applyInwardForce, curve } from "./math.js"
import "./style.css"
import Particle from "./particle.js"

/** @type {HTMLCanvasElement | null} */
const canvas = document.getElementById("heartCanvas")
let tick = 0

if (canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (ctx) {
        let animationFrameId

        const init = () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)

            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.scale(dpr, dpr)

            const canvasWidth = rect.width
            const canvasHeight = rect.height
            const centerX = canvasWidth / 2
            let centerY = canvasHeight / 2

            const shortestSide = Math.min(canvasWidth, canvasHeight)

            //  这里的 “34” 是一个魔法数字，
            const scale = shortestSide / 34

            const heartCenterY = centerY - canvasHeight * 0.05 // 向上移 5%

            // 文字的位置完全依赖于心形的中心和大小
            const textYOffset = scale * 0.2
            const textCenterY = heartCenterY + textYOffset

            const FONT_SIZE = Math.round(scale * 2.6) // 调整 “2.2” 这个系数来改变文字大小

            const HIGHLIGHT_CHANCE = 0.05
            const TEXT_TO_DISPLAY = "I LOVE YOU"
            const heartCenterX = centerX
            const textCenterX = centerX

            function getTextPointsFromMainCanvas() {
                // 在主画布上绘制文字
                ctx.font = `bold ${FONT_SIZE}px sans-serif`
                ctx.fillStyle = "white"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText(TEXT_TO_DISPLAY, textCenterX, textCenterY)

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imageData.data
                const points = []
                const step = 5 // 采样步长

                // 逐步的采取画布上有颜色的点
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
            // ========================================================================

            const textPoints = getTextPointsFromMainCanvas()

            const skeletonPoints = []
            for (let i = 0; i < 1200; i++) {
                const t = Math.random() * 2 * Math.PI
                skeletonPoints.push(calculateHeartPoint(t, heartCenterX, heartCenterY, scale))
            }
            // 爱心骨架 有除亮点以外的最高亮度
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
            // 填充层 无需随机采样
            for (let i = 0; i < 2000; i++) {
                const p = skeletonPoints[Math.floor(Math.random() * skeletonPoints.length)]
                const point = applyInwardForce(p, heartCenterX, heartCenterY, 0.14, 0.5)
                // 填充层 作为氛围感的存在，亮度不应过高
                let brightness = 0.5
                if (Math.random() < HIGHLIGHT_CHANCE) brightness = 0.95
                allInitialPoints.push({ ...point, brightness, type: "CENTER" })
            }
            // 文字 亮度要略微低一点
            textPoints.forEach((p) => {
                allInitialPoints.push({ ...p, brightness: 0.6, type: "TEXT" })
            })

            const particles = allInitialPoints.map((p) => new Particle(p.type, p.x, p.y, p.brightness))

            function animate() {
                const frame = tick / 140
                const ratio = 30 * curve(frame)
                ctx.clearRect(0, 0, canvas.width, canvas.height)
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
