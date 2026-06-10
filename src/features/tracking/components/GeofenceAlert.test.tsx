import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeofenceAlert } from './GeofenceAlert';
import type { RouteWaypoint } from '../types';


const pickupWaypoint: RouteWaypoint = {
    id: 'wp-pickup',
    coordinates: { lat: 28.6, lng: 77.2, timestamp: Date.now() },
    label: 'Delhi Warehouse',
    type: 'pickup',
    geofenceRadius: 200,
    triggered: false,
};

const dropWaypoint: RouteWaypoint = {
    id: 'wp-drop',
    coordinates: { lat: 29.0, lng: 78.0, timestamp: Date.now() },
    label: 'Mumbai Depot',
    type: 'drop',
    geofenceRadius: 200,
    triggered: false,
};

const midWaypoint: RouteWaypoint = {
    id: 'wp-mid',
    coordinates: { lat: 28.8, lng: 77.5, timestamp: Date.now() },
    label: 'Rest Stop',
    type: 'waypoint',
    geofenceRadius: 150,
    triggered: false,
};

describe('GeofenceAlert', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders approaching alert with waypoint label and distance', () => {
        render(
            <GeofenceAlert
                waypoint={pickupWaypoint}
                distance={350}
                status="approaching"
                onDismiss={vi.fn()}
            />,
        );

        expect(screen.getByText(/Near Delhi Warehouse/i)).toBeInTheDocument();
        expect(screen.getByText(/350m/i)).toBeInTheDocument();
        expect(screen.getByText(/Approaching/i)).toBeInTheDocument();
        expect(screen.getByText(/Pickup/i)).toBeInTheDocument();
    });

    it('renders entered alert with waypoint label and distance', () => {
        render(
            <GeofenceAlert
                waypoint={dropWaypoint}
                distance={50}
                status="entered"
                onDismiss={vi.fn()}
            />,
        );

        expect(screen.getByText(/Arrived at Mumbai Depot/i)).toBeInTheDocument();
        expect(screen.getByText(/50m/i)).toBeInTheDocument();
        expect(screen.getByText(/Geofence Alert/i)).toBeInTheDocument();
        expect(screen.getByText(/Drop-off/i)).toBeInTheDocument();
    });

    it('formats distance > 1km as km', () => {
        render(
            <GeofenceAlert
                waypoint={pickupWaypoint}
                distance={1500}
                status="approaching"
                onDismiss={vi.fn()}
            />,
        );

        expect(screen.getByText(/1.5km/i)).toBeInTheDocument();
    });

    it('auto-dismisses approaching alert after 4 seconds', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date', 'performance'] });
        const onDismiss = vi.fn();
        render(
            <GeofenceAlert
                waypoint={pickupWaypoint}
                distance={350}
                status="approaching"
                onDismiss={onDismiss}
            />,
        );

        expect(onDismiss).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(4000);
        });

        expect(onDismiss).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it('auto-dismisses entered alert after 6 seconds', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date', 'performance'] });
        const onDismiss = vi.fn();
        render(
            <GeofenceAlert
                waypoint={dropWaypoint}
                distance={50}
                status="entered"
                onDismiss={onDismiss}
            />,
        );

        expect(onDismiss).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(6000);
        });

        expect(onDismiss).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it('shows dismiss button that calls onDismiss', async () => {
        const onDismiss = vi.fn();
        render(
            <GeofenceAlert
                waypoint={pickupWaypoint}
                distance={350}
                status="approaching"
                onDismiss={onDismiss}
            />,
        );

        const dismissBtn = screen.getByText(/Dismiss/i);
        await userEvent.click(dismissBtn);

        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('shows informational action label for pickup without onAction', () => {
        render(
            <GeofenceAlert
                waypoint={pickupWaypoint}
                distance={100}
                status="entered"
                onDismiss={vi.fn()}
            />,
        );

        expect(screen.getByText(/Call Shipper/i)).toBeInTheDocument();
    });

    it('shows informational action label for drop without onAction', () => {
        render(
            <GeofenceAlert
                waypoint={dropWaypoint}
                distance={100}
                status="entered"
                onDismiss={vi.fn()}
            />,
        );

        expect(screen.getByText(/Capture POD/i)).toBeInTheDocument();
    });

    it('shows clickable action button when onAction is provided for pickup', async () => {
        const onAction = vi.fn();
        render(
            <GeofenceAlert
                waypoint={pickupWaypoint}
                distance={100}
                status="entered"
                onDismiss={vi.fn()}
                onAction={onAction}
            />,
        );

        const actionBtn = screen.getByRole('button', { name: /Call Shipper/i });
        await userEvent.click(actionBtn);

        expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('shows clickable action button when onAction is provided for drop', async () => {
        const onAction = vi.fn();
        render(
            <GeofenceAlert
                waypoint={dropWaypoint}
                distance={100}
                status="entered"
                onDismiss={vi.fn()}
                onAction={onAction}
            />,
        );

        const actionBtn = screen.getByRole('button', { name: /Capture POD/i });
        await userEvent.click(actionBtn);

        expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('does not show action label for midpoint waypoint', () => {
        render(
            <GeofenceAlert
                waypoint={midWaypoint}
                distance={100}
                status="approaching"
                onDismiss={vi.fn()}
            />,
        );

        expect(screen.queryByText(/Call Shipper/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Capture POD/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Waypoint/i)).toBeInTheDocument();
    });
});