/**
 *  计算爱心坐标
 * @param {number} t 当前时钟  0< t < 2π
 * @param {number} centerX 爱心的原点x轴坐标
 * @param {number} centerY 爱心原点的y轴坐标
 * @param {number} scale 爱心函数输出值的放大系数
 */
export function calculateHeartPoint(t, centerX, centerY, scale) {
    const x_math = 16 * Math.pow(Math.sin(t), 3)
    const y_math = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))

    const finalX = x_math * scale + centerX
    const finalY = y_math * scale + centerY

    return { x: finalX, y: finalY }
}
/**
 *  以指数函数计算点向中心点移动的距离
 * @param {{x: number, y: number}} point 当前点
 * @param {number} centerX 中心点x轴坐标
 * @param {number} centerY 中心点y轴坐标
 * @param {number} scale 缩放系数
 *
 * */
export function _applyInwardForce(point, centerX, centerY, scale) {
    /**
     * log(x) 0< x < 1 时，值域为 -∞ < y < 0
     * 即 当随机数越小被数值越大，即越靠近中心点,大部分在边缘
     */
    const ratio_x = -scale * Math.log(Math.random())
    const ratio_y = -scale * Math.log(Math.random())
    /**
     * x₂-x₁ x轴方向的距离 y₂-y₁ y轴方向的距离
     * 即在x轴和y轴方向上，去靠近中心点不同的距离
     */
    const dx = (point.x - centerX) * ratio_x
    const dy = (point.y - centerY) * ratio_y

    return { x: point.x - dx, y: point.y - dy }
}
/**
 *  以指数函数计算点向中心点移动的距离，同时向垂直方向移动，
 * @param {{x: number, y: number}} point 当前点
 * @param {number} centerX 中心点x轴坐标
 * @param {number} centerY 中心点y轴坐标
 * @param {number} scale 缩放系数
 * @param {number} spread 偏转系数
 *
 * */
export function applyInwardForce(point, centerX, centerY, beta, spread) {
    const ratio = -beta * Math.log(Math.random())
    const dx_inward = (centerX - point.x) * ratio
    const dy_inward = (centerY - point.y) * ratio

    const dx_perp = -dy_inward
    const dy_perp = dx_inward

    const spreadFactor = (Math.random() - 0.5) * spread

    const final_dx = dx_inward + dx_perp * spreadFactor
    const final_dy = dy_inward + dy_perp * spreadFactor

    return { x: point.x + final_dx, y: point.y + final_dy }
}
/**
 * 心跳曲线函数，模拟心跳的节拍。
 * 它的原理是利用正弦函数 sin() 的周期性，生成一个平滑波动的数值。
 * 输入 p (由时间 tick 计算而来)，输出一个在正负数之间变化的值，代表心跳的力度和方向。
 * @param {number} p - 时间参数
 */

export function curve(p) {
    return (2 * Math.sin(4 * p)) / (2 * Math.PI)
}
/**
 * 心脏主体搏动函数，计算粒子跳动时的目标位置。
 * @param {number} x, y - 粒子的原始坐标
 * @param {number} centerX, centerY - 中心点
 * @param {number} ratio - 当前的搏动强度 (由 curve 函数计算)
 */
export function calc_position(x, y, centerX, centerY, ratio) {
    const force = 1 / ((x - centerX) ** 2 + (y - centerY) ** 2) ** 0.49

    const dx = ratio * force * (x - centerX)
    const dy = ratio * force * (y - centerY)

    return { x: x - dx, y: y - dy }
}
/**
 * 高斯随机函数
 * @returns
 */
export function gaussianRandom() {
    let u = 0,
        v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    num = num / 10.0 + 0.5
    if (num > 1 || num < 0) return gaussianRandom()
    return num * 2 - 1
}
