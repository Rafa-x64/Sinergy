export interface ResponseDTO{
    status: 'ok' | 'error'
    message: string
    data?: Object
}
