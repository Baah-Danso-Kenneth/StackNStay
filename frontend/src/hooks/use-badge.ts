import { useState, useEffect, useCallback, createElement } from "react";
import { useAuth } from "./use-auth";
import {
    getAllUserBadges,
    getAllBadgeTypes,
    hasBadge as checkHasBadge,
    BADGE_TYPES as BADGE_TYPES_CONST,
    type BadgeMetadata,
    type BadgeTypeInfo,
} from "@/lib/badge";
import { Award, Home, Star, Plane, Zap, Trophy, Globe, DollarSign, LucideIcon } from "lucide-react";

// Re-export BADGE_TYPES for convenience
export const BADGE_TYPES = BADGE_TYPES_CONST;

// Extended badge type with UI properties
export interface BadgeWithUI extends BadgeMetadata {
    id: number;
    typeInfo: BadgeTypeInfo | null;
    icon: React.ReactNode;
    color: string;
}

// Badge type to icon component mapping
const BADGE_ICON_COMPONENTS: Record<number, LucideIcon> = {
    [BADGE_TYPES.FIRST_BOOKING]: Award,
    [BADGE_TYPES.FIRST_LISTING]: Home,
    [BADGE_TYPES.SUPERHOST]: Star,
    [BADGE_TYPES.FREQUENT_TRAVELER]: Plane,
    [BADGE_TYPES.EARLY_ADOPTER]: Zap,
    [BADGE_TYPES.PERFECT_HOST]: Trophy,
    [BADGE_TYPES.GLOBE_TROTTER]: Globe,
    [BADGE_TYPES.TOP_EARNER]: DollarSign,
};

// Helper function to get badge icon
const getBadgeIcon = (badgeType: number): React.ReactNode => {
    const IconComponent = BADGE_ICON_COMPONENTS[badgeType] || Award;
    return createElement(IconComponent, { className: "w-8 h-8" });
};

// Badge type to color mapping
const BADGE_COLORS: Record<number, string> = {
    [BADGE_TYPES.FIRST_BOOKING]: "#a855f7", // purple
    [BADGE_TYPES.FIRST_LISTING]: "#3b82f6", // blue
    [BADGE_TYPES.SUPERHOST]: "#eab308", // yellow
    [BADGE_TYPES.FREQUENT_TRAVELER]: "#06b6d4", // cyan
    [BADGE_TYPES.EARLY_ADOPTER]: "#8b5cf6", // violet
    [BADGE_TYPES.PERFECT_HOST]: "#f59e0b", // amber
    [BADGE_TYPES.GLOBE_TROTTER]: "#10b981", // emerald
    [BADGE_TYPES.TOP_EARNER]: "#22c55e", // green
};

/**
 * Custom hook for managing badge data
 * Fetches user badges and badge type information from the blockchain
 */
export function useBadges(userAddress?: string) {
    const { userData } = useAuth();
    const [badges, setBadges] = useState<BadgeWithUI[]>([]);
    const [allBadgeTypes, setAllBadgeTypes] = useState<(BadgeTypeInfo & { type: number })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use provided address or fall back to authenticated user's address
    const targetAddress = userAddress || userData?.profile.stxAddress.testnet;

    /**
     * Fetch all badge types from the contract
     */
    const fetchBadgeTypes = useCallback(async () => {
        try {
            console.log("📋 Fetching all badge types...");
            const types = await getAllBadgeTypes();
            setAllBadgeTypes(types);
            console.log(`✅ Loaded ${types.length} badge types`);
            return types;
        } catch (err) {
            console.error("Error fetching badge types:", err);
            throw err;
        }
    }, []);

    /**
     * Fetch all badges for the current user
     */
    const fetchUserBadges = useCallback(async () => {
        if (!targetAddress) {
            console.log("⚠️ No user address available");
            return [];
        }

        try {
            console.log(`🎖️ Fetching badges for ${targetAddress}...`);
            const userBadges = await getAllUserBadges(targetAddress);
            console.log(`✅ Found ${userBadges.length} badges for user`);

            // Enhance badges with UI properties
            const enhancedBadges: BadgeWithUI[] = await Promise.all(
                userBadges.map(async (badge) => {
                    const typeInfo = allBadgeTypes.find(t => t.type === badge.badgeType);

                    return {
                        ...badge,
                        typeInfo: typeInfo || null,
                        icon: getBadgeIcon(badge.badgeType),
                        color: BADGE_COLORS[badge.badgeType] || "#a855f7",
                    };
                })
            );

            setBadges(enhancedBadges);
            return enhancedBadges;
        } catch (err) {
            console.error("Error fetching user badges:", err);
            throw err;
        }
    }, [targetAddress, allBadgeTypes]);

    /**
     * Check if user has a specific badge type
     */
    const hasBadge = useCallback(
        async (badgeType: number): Promise<boolean> => {
            if (!targetAddress) return false;

            try {
                return await checkHasBadge(targetAddress, badgeType);
            } catch (err) {
                console.error(`Error checking badge ${badgeType}:`, err);
                return false;
            }
        },
        [targetAddress]
    );

    /**
     * Manually refresh badge data
     */
    const refetchBadges = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            await fetchBadgeTypes();
            await fetchUserBadges();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch badges";
            setError(errorMessage);
            console.error("Error refetching badges:", err);
        } finally {
            setIsLoading(false);
        }
    }, [fetchBadgeTypes, fetchUserBadges]);

    /**
     * Initial data fetch on mount or when user changes
     */
    useEffect(() => {
        let isMounted = true;

        const loadBadgeData = async () => {
            if (!targetAddress) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // First fetch badge types, then user badges
                await fetchBadgeTypes();

                if (isMounted) {
                    await fetchUserBadges();
                }
            } catch (err) {
                if (isMounted) {
                    const errorMessage = err instanceof Error ? err.message : "Failed to load badges";
                    setError(errorMessage);
                    console.error("Error loading badge data:", err);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadBadgeData();

        return () => {
            isMounted = false;
        };
    }, [targetAddress, fetchBadgeTypes, fetchUserBadges]);

    return {
        badges,
        allBadgeTypes,
        isLoading,
        error,
        hasBadge,
        refetchBadges,
        BADGE_TYPES,
    };
}
