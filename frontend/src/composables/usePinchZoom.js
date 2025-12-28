import { onMounted, onUnmounted, ref } from 'vue'

export function usePinchZoom(targetRef, options = {}) {
    const {
        onPinch, // ({ scale, delta, center }) => {}
        onPan,   // ({ deltaX, deltaY }) => {}
        onStart, // () => {}
        onEnd    // () => {}
    } = options

    const isZooming = ref(false)
    const isPanning = ref(false)

    // State
    let startDist = 0
    let startZoom = 1 // Not strictly tracked here, we emit deltas
    let startPoints = []

    // Helper: Distance between two points
    const getDistance = (p1, p2) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
    }

    // Helper: Midpoint
    const getMidpoint = (p1, p2) => {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        }
    }

    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            e.preventDefault() // Prevent browser zoom
            isZooming.value = true

            const p1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
            const p2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }

            startDist = getDistance(p1, p2)
            startPoints = [p1, p2]

            if (onStart) onStart()
        } else if (e.touches.length === 1) {
            // Check if we should block one-finger interactions?
            // Usually sim handles one-finger drag. 
            // We only care about 2-finger pinch/pan OR strictly separate pan mode?
            // For this requirement, "enable zooming in mobile mode", standard is 2-finger pinch.
            // We will NOT interfere with 1-finger events unless configured to do so (like a specific pan tool)
            // But usually 2-finger pan accompanies pinch.
        }
    }

    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && isZooming.value) {
            e.preventDefault()

            const p1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
            const p2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }

            const dist = getDistance(p1, p2)

            // Calculate Zoom Delta
            if (startDist > 0) {
                const deltaScale = dist / startDist

                // Calculate Pan Delta (Movement of midpoint)
                const startMid = getMidpoint(startPoints[0], startPoints[1])
                const currentMid = getMidpoint(p1, p2)

                const deltaX = currentMid.x - startMid.x
                const deltaY = currentMid.y - startMid.y

                if (onPinch) {
                    onPinch({
                        deltaScale, // Multiplier (e.g. 1.05 or 0.95)
                        center: currentMid
                    })
                }

                if (onPan) {
                    onPan({
                        deltaX,
                        deltaY
                    })
                }

                // Update start for next frame to get incremental deltas
                startDist = dist
                startPoints = [p1, p2]
            }
        }
    }

    const handleTouchEnd = (e) => {
        if (e.touches.length < 2) {
            isZooming.value = false
            if (onEnd) onEnd()
        }
    }

    onMounted(() => {
        const el = targetRef.value
        if (!el) return

        // Passive false to allow preventDefault
        el.addEventListener('touchstart', handleTouchStart, { passive: false })
        el.addEventListener('touchmove', handleTouchMove, { passive: false })
        el.addEventListener('touchend', handleTouchEnd)
    })

    onUnmounted(() => {
        const el = targetRef.value
        if (!el) return

        el.removeEventListener('touchstart', handleTouchStart)
        el.removeEventListener('touchmove', handleTouchMove)
        el.removeEventListener('touchend', handleTouchEnd)
    })

    return {
        isZooming
    }
}
