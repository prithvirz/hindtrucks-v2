// ─── Push Notifications Feature: TypeScript Interfaces ───

export type NotificationType =
    | 'new_load'
    | 'accepted'
    | 'status_update'
    | 'earnings'
    | 'announcement'
    | 'trip_reminder'
    | 'geofence_alert'
    | 'chat_message'
    | 'system_announcement';

export interface PushPayload {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    deepLink?: string;
    entityId?: string;
    imageUrl?: string;
    requireInteraction?: boolean;
    scheduledAt?: string;
    ttlSeconds?: number;
    actions?: NotificationAction[];
    expiresAt?: number;
}

export interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

export interface PushNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    deepLink?: string;
    read: boolean;
    receivedAt: number;
    expiresAt?: number;
}

export interface NotificationPermissionState {
    push: PermissionState;
    needsPrompt: boolean;
    promptedBefore: boolean;
}

export interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    userAgent: string;
    platform: string;
    language: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
    new_load: 'New Load',
    accepted: 'Accepted',
    status_update: 'Status Update',
    earnings: 'Earnings',
    announcement: 'Announcement',
    trip_reminder: 'Trip Reminder',
    geofence_alert: 'Geofence Alert',
    chat_message: 'Chat Message',
    system_announcement: 'System',
};

export const NOTIFICATION_PERMISSION_KEY = 'ht_push_permission_prompted';
export const NOTIFICATION_PRMPT_COOLDOWN_DAYS = 7;