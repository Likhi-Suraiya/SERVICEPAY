import { useEffect, useMemo, useState } from 'react';

/**
 * Comprehensive media query hook for responsive design
 *
 * @returns Object containing device type information and breakpoint states
 *
 * @example
 * const { isDesktop, isTablet, deviceType } = useDeviceBreakpoints();
 *
 * if (isDesktop) {
 *   // Render desktop layout
 * }
 *
 * @example
 * // Using with conditional rendering
 * {deviceType === 'small-mobile' && <SmallMobileComponent />}
 * {isDesktop && <DesktopComponent />}
 */
export function useDeviceBreakpoints() {
    // Define standard breakpoints matching Tailwind's defaults with mobile-first approach
    const breakpoints = useMemo(
        () => ({
            smallMobile: '(max-width: 375px)',
            largeMobile: '(min-width: 376px) and (max-width: 767px)',
            tablet: '(min-width: 768px) and (max-width: 1023px)',
            desktop: '(min-width: 1024px)',
            touch: '(hover: none) and (pointer: coarse)',
        }),
        []
    );

    // Track all breakpoints simultaneously
    const [breakpointStates, setBreakpointStates] = useState(() => ({
        isSmallMobile: window.matchMedia(breakpoints.smallMobile).matches,
        isLargeMobile: window.matchMedia(breakpoints.largeMobile).matches,
        isTablet: window.matchMedia(breakpoints.tablet).matches,
        isDesktop: window.matchMedia(breakpoints.desktop).matches,
        isTouch: window.matchMedia(breakpoints.touch).matches,
    }));

    useEffect(() => {
        const mediaQueries = {
            smallMobile: window.matchMedia(breakpoints.smallMobile),
            largeMobile: window.matchMedia(breakpoints.largeMobile),
            tablet: window.matchMedia(breakpoints.tablet),
            desktop: window.matchMedia(breakpoints.desktop),
            touch: window.matchMedia(breakpoints.touch),
        };

        // Initial state check
        const getStates = () => ({
            isSmallMobile: mediaQueries.smallMobile.matches,
            isLargeMobile: mediaQueries.largeMobile.matches,
            isTablet: mediaQueries.tablet.matches,
            isDesktop: mediaQueries.desktop.matches,
            isTouch: mediaQueries.touch.matches,
        });

        // Update states when any media query changes
        const handleChange = () => {
            setBreakpointStates(getStates());
        };

        // Add listeners to all media queries
        Object.values(mediaQueries).forEach((mq) => {
            mq.addEventListener('change', handleChange);
        });

        // Clean up listeners
        return () => {
            Object.values(mediaQueries).forEach((mq) => {
                mq.removeEventListener('change', handleChange);
            });
        };
    }, [breakpoints]);

    // Calculate derived properties
    const deviceType =
        breakpointStates.isSmallMobile
            ? 'small-mobile'
            : breakpointStates.isLargeMobile
            ? 'large-mobile'
            : breakpointStates.isTablet
            ? 'tablet'
            : 'desktop';

    const isMobile = breakpointStates.isSmallMobile || breakpointStates.isLargeMobile;

    return {
        ...breakpointStates,
        deviceType,
        isMobile,
    };
}

/**
 * Custom hook to check a specific media query
 *
 * @param query - Media query string (e.g., '(min-width: 768px)')
 * @returns Boolean indicating if the media query matches
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 *
 * @example
 * const isPortrait = useMediaQuery('(orientation: portrait)');
 */
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia(query);
        const listener = () => setMatches(media.matches);

        // Initial check
        listener();

        // Add listener
        media.addEventListener('change', listener);

        // Cleanup
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
}

// Predefined hooks for common breakpoints
export const useIsSmallMobile = () => useMediaQuery('(max-width: 375px)');
export const useIsLargeMobile = () => useMediaQuery('(min-width: 376px) and (max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsTouchDevice = () => useMediaQuery('(hover: none) and (pointer: coarse)');
export const useIsPortrait = () => useMediaQuery('(orientation: portrait)');
export const useIsLandscape = () => useMediaQuery('(orientation: landscape)');