import { render, screen } from '@testing-library/react';
import { NavHUD } from './NavHUD';
import type { Coordinates } from '../types';
import type { RoutePoI } from '../services/overpass';
import type { RouteStep } from '../services/routing';

// Mock distanceToNextPoi from overpass service
vi.mock('../services/overpass', () => ({
    distanceToNextPoi: vi.fn((_pos: Coordinates, pois: RoutePoI[], category?: string) => {
        const filtered = category ? pois.filter((p) => p.category === category) : pois;
        if (!filtered.length) return null;
        // Return first matching POI with a fixed distance for testing
        return { poi: filtered[0], distanceM: 5000 };
    }),
}));

const position: Coordinates = {
    lat: 28.6,
    lng: 77.2,
    timestamp: Date.now(),
    speed: 13.9, // ~50 km/h
};

const pois: RoutePoI[] = [
    { id: 'fuel-1', category: 'fuel', name: 'Fuel Station', lat: 28.61, lng: 77.21 },
    { id: 'dhaba-1', category: 'dhaba', name: 'Dhaba', lat: 28.62, lng: 77.22 },
    { id: 'toll-1', category: 'toll', name: 'Toll Plaza', lat: 28.63, lng: 77.23 },
];

const currentStep: RouteStep = {
    instruction: 'Turn left onto NH-8',
    distanceMeters: 500,
    maneuver: 'turn-left',
    durationSeconds: 30,
    streetName: 'NH-8',
};

describe('NavHUD', () => {
    it('renders speed from position.speed (m/s → km/h)', () => {
        render(
            <NavHUD
                position={position}
                distanceRemainingM={10000}
                durationRemainingS={600}
                currentStep={null}
                pois={[]}
            />,
        );

        // 13.9 m/s * 3.6 = 50.04 km/h → rounded to 50
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('km/h')).toBeInTheDocument();
    });

    it('renders dash when speed is null', () => {
        const noSpeedPos: Coordinates = { lat: 28.6, lng: 77.2, timestamp: Date.now() };
        render(
            <NavHUD
                position={noSpeedPos}
                distanceRemainingM={10000}
                durationRemainingS={600}
                currentStep={null}
                pois={[]}
            />,
        );

        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders distance remaining in km when >= 1000m', () => {
        render(
            <NavHUD
                position={position}
                distanceRemainingM={15000}
                durationRemainingS={600}
                currentStep={null}
                pois={[]}
            />,
        );

        expect(screen.getByText('15.0 km')).toBeInTheDocument();
        expect(screen.getByText('left')).toBeInTheDocument();
    });

    it('renders distance remaining in m when < 1000m', () => {
        render(
            <NavHUD
                position={position}
                distanceRemainingM={500}
                durationRemainingS={30}
                currentStep={null}
                pois={[]}
            />,
        );

        expect(screen.getByText('500 m')).toBeInTheDocument();
    });

    it('renders ETA from duration remaining', () => {
        render(
            <NavHUD
                position={position}
                distanceRemainingM={10000}
                durationRemainingS={600}
                currentStep={null}
                pois={[]}
            />,
        );

        expect(screen.getByText('ETA')).toBeInTheDocument();
    });

    it('renders turn instruction with maneuver icon', () => {
        render(
            <NavHUD
                position={position}
                distanceRemainingM={10000}
                durationRemainingS={600}
                currentStep={currentStep}
                pois={[]}
            />,
        );

        expect(screen.getByText(/Turn left onto NH-8/i)).toBeInTheDocument();
        expect(screen.getByText('500 m')).toBeInTheDocument();
        // turn-left → ↰
        expect(screen.getByText('↰')).toBeInTheDocument();
    });

    it('renders duration remaining text', () => {
        render(
            <NavHUD
                position={position}
                distanceRemainingM={10000}
                durationRemainingS={3600}
                currentStep={null}
                pois={[]}
            />,
        );

        // 3600s = 1h 0m
        expect(screen.getByText(/1h 0m remaining/i)).toBeInTheDocument();
    });

    it('renders duration remaining in minutes when < 1 hour', () => {
        render(
            <NavHUD
                position={position}
                distanceRemainingM={5000}
                durationRemainingS={600}
                currentStep={null}
                pois={[]}
            />,
        );

        // 600s = 10 min
        expect(screen.getByText(/10 min remaining/i)).toBeInTheDocument();
    });

    it('renders null position gracefully', () => {
        render(
            <NavHUD
                position={null}
                distanceRemainingM={null}
                durationRemainingS={null}
                currentStep={null}
                pois={[]}
            />,
        );

        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders POI distances when available', () => {
        render(
            <NavHUD
                position={position}
                distanceRemainingM={10000}
                durationRemainingS={600}
                currentStep={null}
                pois={pois}
            />,
        );

        // Mock returns distanceM: 5000 for all POIs
        // fuel: 5000m < 30000 → shown as "5.0 km"
        expect(screen.getByText('⛽')).toBeInTheDocument();
        // dhaba: 5000m < 20000 → shown
        expect(screen.getByText('🍽')).toBeInTheDocument();
        // toll: 5000m < 50000 → shown
        expect(screen.getByText('🚧')).toBeInTheDocument();
    });
});