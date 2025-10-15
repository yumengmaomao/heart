let lastTimeString = ""
let charParticleMap = {}
let nextAvailableParticleIndex = 0

export function resetTimerState() {
    lastTimeString = ""
    charParticleMap = {}
    nextAvailableParticleIndex = 0
}

/**
 * 为单个字符生成粒子坐标点“字模”
 */
function generateCharacterPoints(ctx, canvas, char, fontSize) {
    const dpr = window.devicePixelRatio || 1
    console.log(ctx)
    ctx.font = `bold ${fontSize}px Bitmap`
    ctx.fillStyle = "white"
    ctx.textBaseline = "middle"
    const baselineX = 25
    const baselineY = 25
    ctx.fillText(char, baselineX, baselineY)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const points = []
    let step = 3
    const width = ctx.measureText(char).width
    if (canvas.getBoundingClientRect().width < 425) step = 6
    for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
            const alpha = data[(y * canvas.width + x) * 4 + 3]
            if (alpha > 128) {
                points.push({ x: (x - baselineX) / dpr, y: (y - baselineY) / dpr })
            }
        }
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    return { points, width }
}
export function createTimerTemplates(ctx, canvas, fontSize) {
    const templates = {}
    const timerChars = "0123456789时分秒天月年" // 添加 "月" 和 "年"

    timerChars.split("").forEach((char) => {
        templates[char] = generateCharacterPoints(ctx, canvas, char, fontSize)
    })

    return templates
}

/**
 * 格式化时间，支持年、月、日
 */
export function formatTime(ms) {
    if (ms < 0) ms = 0
    const totalSeconds = Math.floor(ms / 1000)

    const SECONDS_IN_A_DAY = 86400
    const DAYS_IN_A_MONTH = 31
    const MONTHS_IN_A_YEAR = 12

    const totalDays = Math.floor(totalSeconds / SECONDS_IN_A_DAY)
    const totalMonths = Math.floor(totalDays / DAYS_IN_A_MONTH)
    const years = Math.floor(totalMonths / MONTHS_IN_A_YEAR)

    if (years > 0) {
        const months = String(totalMonths % MONTHS_IN_A_YEAR).padStart(2, "0")
        const days = String(totalDays % DAYS_IN_A_MONTH).padStart(2, "0")
        return `${years}年${months}月${days}天`
    } else if (totalMonths > 0) {
        const days = String(totalDays % DAYS_IN_A_MONTH).padStart(2, "0")
        const remainingSeconds = totalSeconds % SECONDS_IN_A_DAY
        const h = String(Math.floor(remainingSeconds / 3600)).padStart(2, "0")
        return `${String(totalMonths).padStart(2, "0")}月${days}天${h}时`
    } else if (totalDays > 0) {
        const remainingSeconds = totalSeconds % SECONDS_IN_A_DAY
        const h = String(Math.floor(remainingSeconds / 3600)).padStart(2, "0")
        const m = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, "0")
        return `${String(totalDays).padStart(2, "0")}天${h}时${m}分`
    } else {
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0")
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")
        const s = String(totalSeconds % 60).padStart(2, "0")
        return `${h}时${m}分${s}秒`
    }
}

const isDigit = (char) => char >= "0" && char <= "9"
const isUnit = (char) => ["年", "月", "天", "时", "分", "秒"].includes(char)

export function calculateTimerWidth(templates, timeString) {
    let totalWidth = 0
    const charSpacing = 4
    const unitWidth = templates["时"]?.width || 0

    for (let i = 0; i < timeString.length; i++) {
        const char = timeString[i]
        const nextChar = timeString[i + 1]
        const template = templates[char]

        if (template) {
            if (isDigit(char) && nextChar && isUnit(nextChar)) {
                totalWidth += unitWidth + charSpacing
            } else {
                totalWidth += template.width + charSpacing
            }
        }
    }
    return totalWidth > 0 ? totalWidth - charSpacing : 0
}

function _assignParticlesToChar(particlesForSlot, template, currentX, baseY, targetWidth, particleType) {
    const requiredCount = template.points.length
    const centeringOffset = (targetWidth - template.width) / 2

    for (let i = 0; i < particlesForSlot.length; i++) {
        const p = particlesForSlot[i]

        p.type = particleType

        if (i < requiredCount) {
            const point = template.points[i]
            p.originX = currentX + centeringOffset + point.x
            p.originY = baseY + point.y + 25
            p.alpha = 1.0
        } else {
            p.alpha = 0.0
        }
    }
}

export function updateTimerParticles(timerParticles, startTime, templates, ctx, baseX = 10, baseY = 20) {
    const timeString = formatTime(Date.now() - startTime)
    let currentX = baseX
    const charSpacing = 4
    const isFirstRender = !lastTimeString
    const unitWidth = templates["时"]?.width || 0

    const yearUnitIndex = timeString.indexOf("年")

    if (!isFirstRender && timeString.length < lastTimeString.length) {
        for (let i = timeString.length; i < Object.keys(charParticleMap).length; i++) {
            const mapEntry = charParticleMap[i]
            if (mapEntry && mapEntry.particles) {
                mapEntry.particles.forEach((p) => {
                    p.alpha = 0.0
                    p.type = "TIMER"
                })
            }
        }
    }

    for (let i = 0; i < timeString.length; i++) {
        const newChar = timeString[i]
        const oldChar = lastTimeString[i] || null
        const template = { ...templates[newChar], char: newChar }

        const nextChar = timeString[i + 1]
        let targetWidth = template.width
        if (isDigit(newChar) && nextChar && isUnit(nextChar)) {
            targetWidth = unitWidth
        }

        const particleType = yearUnitIndex !== -1 && i < yearUnitIndex && isDigit(newChar) ? "TEXT" : "TIMER"

        const mapEntry = charParticleMap[i]
        const currentType = mapEntry?.particles[0]?.type

        if (isFirstRender || newChar !== oldChar || particleType !== currentType) {
            const requiredParticlesCount = template.points.length
            let particlesForSlot

            if (isFirstRender || !mapEntry) {
                particlesForSlot = timerParticles.slice(
                    nextAvailableParticleIndex,
                    nextAvailableParticleIndex + requiredParticlesCount
                )
                nextAvailableParticleIndex += requiredParticlesCount
            } else {
                particlesForSlot = mapEntry.particles
                const currentCount = particlesForSlot.length
                if (requiredParticlesCount > currentCount) {
                    const diff = requiredParticlesCount - currentCount
                    const newParticles = timerParticles.slice(
                        nextAvailableParticleIndex,
                        nextAvailableParticleIndex + diff
                    )
                    particlesForSlot = particlesForSlot.concat(newParticles)
                    nextAvailableParticleIndex += diff
                }
            }

            _assignParticlesToChar(particlesForSlot, template, currentX, baseY, targetWidth, particleType)

            charParticleMap[i] = {
                char: newChar,
                particles: particlesForSlot
            }
        }

        currentX += targetWidth + charSpacing
    }

    lastTimeString = timeString
}
