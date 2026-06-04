import { ChatDrawer } from '../features/chatbot/components/ChatDrawer'

// Thin wrapper — all chatbot logic now lives in ChatDrawer + ChatContext.
// Preserved as a named export for backward compatibility (App.tsx, tests).
export default function AIChatbot() {
  return <ChatDrawer />
}
