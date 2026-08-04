<template>
    <div class="sinergy-chip">
        <div class="sinergy-chip-content">
            <div class="logo-wrapper">
                <span class="logo-text">
                    Sinergy
                    <v-icon class="logo-icon" size="small">mdi-vuetify</v-icon>
                </span>
            </div>
            <span class="logo-subtitle d-none d-lg-block">
                Control total, cero sorpresas
            </span>
        </div>
    </div>
</template>

<style scoped>
.sinergy-chip {
    display: inline-block;
    background: linear-gradient(135deg, #2563EB, #1D4ED8);
    border-radius: 12px;
    padding: 10px 18px;
    margin: 4px;
    width: auto;
    max-width: 100%;
    transition: all 0.3s ease;
}

.sinergy-chip-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.logo-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-text {
    font-size: clamp(18px, 2.5vw, 24px);
    font-weight: 700;
    color: white;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.logo-icon {
    color: rgba(255, 255, 255, 0.8);
}

.logo-subtitle {
    font-size: clamp(10px, 1.2vw, 13px);
    color: rgba(255, 255, 255, 0.85);
    text-align: center;
    font-weight: 400;
    letter-spacing: 0.3px;
}

/* Hover effect para desktop */
@media (hover: hover) {
    .sinergy-chip:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
}

/* Ajustes para móviles */
@media (max-width: 600px) {
    .sinergy-chip {
        padding: 6px 14px;
        border-radius: 10px;
        margin: 2px;
    }

    .sinergy-chip-content {
        gap: 1px;
    }

    .logo-text {
        gap: 4px;
    }

    .logo-icon {
        font-size: 16px !important;
    }
}
</style>
