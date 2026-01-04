<script setup>
defineProps({
    type: String
})
</script>

<template>
    <div class="holder-container">
        <svg viewBox="0 0 150 40" class="holder-svg">
            <!-- Handle -->
            <rect x="50" y="18" width="80" height="4" fill="#a16207" rx="2" />
            <!-- Metal Clamp Mechanism -->
            <path d="M50,20 L30,10 L10,10 Q5,10 5,20 Q5,30 10,30 L30,30 L50,20" fill="none" stroke="#cbd5e1" stroke-width="3" />
            <circle cx="50" cy="20" r="3" fill="#64748b" />
        </svg>
    </div>
</template>

<style scoped>
.holder-container {
    width: 100px;
    height: 30px;
}
.holder-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
}
</style>
