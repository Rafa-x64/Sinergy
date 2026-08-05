export interface VuetifyForm {
    validate: () => Promise<{ valid: boolean, errors: unknown[] }>
    reset: () => void
    resetValidation: () => void
}
