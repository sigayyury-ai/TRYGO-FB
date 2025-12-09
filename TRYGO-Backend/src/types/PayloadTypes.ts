export interface Payload {
    id: string;
    name?: string;
}

export interface ResetCodePayload {
    email: string;
    resetCode: number;
}
