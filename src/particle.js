import { calc_position, gaussianRandom } from "./math.js"

export default class Particle {
    constructor(type, originX, originY, brightness = 0.7) {
        this.type = type
        this.originX = originX
        this.originY = originY
        this.x = originX
        this.y = originY
        this.brightness = brightness
        this.hue = 0
    }

    update(centerX, centerY, ratio, tick) {
        let targetX, targetY

        if (this.type === "TEXT") {
            const textRatio = ratio * 0.35
            ;({ x: targetX, y: targetY } = calc_position(this.originX, this.originY, centerX, centerY, textRatio))
        } else {
            ;({ x: targetX, y: targetY } = calc_position(this.originX, this.originY, centerX, centerY, ratio))
        }

        const dx_attraction = this.originX - this.x
        const dy_attraction = this.originY - this.y
        const attraction = 0.02

        const wanderStrength = 1.2
        const randomForceX = gaussianRandom() * wanderStrength
        const randomForceY = gaussianRandom() * wanderStrength

        const easing = 0.08
        this.x += (targetX - this.x) * easing + dx_attraction * attraction + randomForceX
        this.y += (targetY - this.y) * easing + dy_attraction * attraction + randomForceY

        const HUE_SPREAD = 0.3
        const HUE_SHIFT_SPEED = 0.5
        const positionOffset = this.y * HUE_SPREAD
        const timeOffset = tick * HUE_SHIFT_SPEED
        this.hue = (positionOffset + timeOffset) % 360
    }

    draw(ctx) {
        const lightness = this.brightness * 100
        ctx.fillStyle = `hsl(${this.hue}, 100%, ${lightness}%)`

        ctx.beginPath()
        ctx.arc(this.x, this.y, 1, 0, Math.PI * 2)
        ctx.fill()
    }
}
