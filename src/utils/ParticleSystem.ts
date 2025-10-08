// --- 粒子类定义 (无改动) ---
class Particle {
    x: number
    y: number
    originX: number
    originY: number
    vx: number
    vy: number
    size: number
    color: string
    constructor(
        initialX: number,
        initialY: number,
        originX: number,
        originY: number,
        baseParticleSize: number,
        particleColor: string
    ) {
        this.originX = originX
        this.originY = originY
        this.x = initialX
        this.y = initialY
        this.vx = 0
        this.vy = 0
        this.size = baseParticleSize * (Math.random() * 0.5 + 0.5)
        this.color = particleColor
    }
    update(attractionForce: number, wanderStrength: number, friction: number): void {
        const baseDx = this.originX - this.x
        const baseDy = this.originY - this.y
        this.vx += baseDx * attractionForce + (Math.random() - 0.5) * wanderStrength
        this.vy += baseDy * attractionForce + (Math.random() - 0.5) * wanderStrength
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

// --- 动画引擎类 ---
export class ParticleSystem {
    #canvas: HTMLCanvasElement
    #ctx: CanvasRenderingContext2D
    #particles: Particle[] = []
    #animationFrameId?: number

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas
        const context = canvas.getContext("2d", { willReadFrequently: true })
        if (!context) {
            throw new Error("Could not get 2D context from canvas")
        }
        this.#ctx = context

        this.resize = this.resize.bind(this)
    }

    public start() {
        setTimeout(() => {
            this.resize()
            window.addEventListener("resize", this.#debouncedResize)
        }, 100)
    }

    public stop() {
        window.removeEventListener("resize", this.#debouncedResize)
        if (this.#animationFrameId) {
            cancelAnimationFrame(this.#animationFrameId)
        }
    }

    public resize() {
        if (this.#animationFrameId) {
            cancelAnimationFrame(this.#animationFrameId)
        }
        const rect = this.#canvas.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        this.#canvas.width = rect.width * dpr
        this.#canvas.height = rect.height * dpr
        this.#ctx.scale(dpr, dpr)
        this.#initializeParticles()
        this.#animate()
    }

    #initializeParticles() {
        const canvasWidth = this.#canvas.clientWidth
        const canvasHeight = this.#canvas.clientHeight
        const DESIGN_BASE_WIDTH = 1200
        const MIN_LAYOUT_SCALE = 0.6
        const MAX_LAYOUT_SCALE = 1.0
        const layoutScale = Math.max(MIN_LAYOUT_SCALE, Math.min(MAX_LAYOUT_SCALE, canvasWidth / DESIGN_BASE_WIDTH))
        const MIN_TEXT_OFFSET_PERCENT = 0.22
        const MAX_TEXT_OFFSET_PERCENT = 0.45
        const normalizedScale = (layoutScale - MIN_LAYOUT_SCALE) / (MAX_LAYOUT_SCALE - MIN_LAYOUT_SCALE)
        const dynamicTextOffsetPercent =
            MIN_TEXT_OFFSET_PERCENT + (MAX_TEXT_OFFSET_PERCENT - MIN_TEXT_OFFSET_PERCENT) * normalizedScale
        const heartYOffset = -canvasHeight * 0.1
        const textYOffset = canvasHeight * dynamicTextOffsetPercent
        const heartCenterX = canvasWidth / 2
        const heartCenterY = canvasHeight / 2 + heartYOffset
        const textCenterX = canvasWidth / 2
        const textCenterY = canvasHeight / 2 + textYOffset
        const scale = 20 * layoutScale
        const PARTICLE_COUNT = 3500
        const PARTICLE_SIZE = 1.5 * layoutScale
        const HEART_PARTICLE_COLOR = "rgba(255, 50, 80, 0.9)"
        const INNER_PARTICLE_RATIO = 0.5
        const INNER_PARTICLE_JITTER = 20 * layoutScale
        const TEXT_TO_DISPLAY = "I LOVE YOU"
        const FONT_SIZE = Math.round(80 * layoutScale)
        const TEXT_PARTICLE_COLOR = "rgba(255, 255, 200, 0.9)"
        this.#particles = []
        const textPoints = this.#getTextPoints(TEXT_TO_DISPLAY, FONT_SIZE, textCenterX, textCenterY)
        const heartPoints = Array.from({ length: Math.ceil((2 * Math.PI) / 0.01) }, (_, i) => {
            const t = i * 0.01
            const x = 16 * Math.pow(Math.sin(t), 3)
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
            return [x, y]
        })
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const [anchorMathX, anchorMathY] = heartPoints[Math.floor(Math.random() * heartPoints.length)] as [
                number,
                number
            ]
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
            this.#particles.push(
                new Particle(anchorCanvasX, anchorCanvasY, originX, originY, PARTICLE_SIZE, HEART_PARTICLE_COLOR)
            )
        }
        for (const [x, y] of textPoints) {
            this.#particles.push(new Particle(x, y, x, y, PARTICLE_SIZE, TEXT_PARTICLE_COLOR))
        }
    }

    #animate = () => {
        const ATTRACTION_FORCE = 0.01
        const WANDER_STRENGTH = 0.1
        const FRICTION = 0.93
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height)
        this.#particles.forEach((p) => {
            p.update(ATTRACTION_FORCE, WANDER_STRENGTH, FRICTION)
            p.draw(this.#ctx)
        })
        this.#animationFrameId = requestAnimationFrame(this.#animate)
    }

    #getTextPoints(text: string, fontSize: number, textCenterX: number, textCenterY: number): Array<[number, number]> {
        const offscreenCanvas = document.createElement("canvas")
        const tempCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true })!
        const dpr = window.devicePixelRatio || 1
        offscreenCanvas.width = this.#canvas.width
        offscreenCanvas.height = this.#canvas.height

        tempCtx.font = `bold ${fontSize * dpr}px sans-serif` // 在离屏Canvas上绘制时也考虑dpr
        tempCtx.fillStyle = "white"
        tempCtx.textAlign = "center"
        tempCtx.textBaseline = "middle"
        tempCtx.fillText(text, textCenterX * dpr, textCenterY * dpr)

        const imageData = tempCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height)
        const data = imageData.data
        const points: Array<[number, number]> = []
        const samplingStep = 4

        for (let y = 0; y < offscreenCanvas.height; y += samplingStep) {
            for (let x = 0; x < offscreenCanvas.width; x += samplingStep) {
                const index = (y * offscreenCanvas.width + x) * 4 + 3
                if (index < data.length) {
                    // --- 修复 2: 使用非空断言 `!` ---
                    const alpha = data[index]!
                    if (alpha > 128) {
                        points.push([x / dpr, y / dpr])
                    }
                }
            }
        }
        return points
    }

    #debouncedResize = this.#debounce(this.resize, 250)

    #debounce(func: (...args: any[]) => void, delay: number): (...args: any[]) => void {
        let timeout: number
        return function (this: any, ...args: any[]) {
            clearTimeout(timeout)
            timeout = window.setTimeout(() => func.apply(this, args), delay)
        }
    }
}
