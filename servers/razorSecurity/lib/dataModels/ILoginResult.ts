export interface ILoginResult {
    isValid: boolean,
    tokenRes?: {
        token: string,
        tokenExpiry?: number
    }
    userInfo?: any
    error?: string
}