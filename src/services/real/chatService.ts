import type {
    IChatService,
    SendMessageRequest,
    SendMessageResponse,
} from '../types'
import { apiClient } from '../apiClient'

export const chatService: IChatService = {
    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
        const res = await apiClient.post<SendMessageResponse>('/chat/message', request)
        return res.data
    },
}