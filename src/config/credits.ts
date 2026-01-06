/**
 * 💰 Credit System Configuration
 * 
 * Core principle: 1 Credit = 1€
 * This file contains all credit-related pricing and configuration
 */

// Credit pack types
export interface CreditPack {
    id: string;
    name: string;
    nameSk: string;
    credits: number;
    price: number; // in EUR
    discount: number; // percentage
    featured?: boolean;
}

// Available credit packs
export const CREDIT_PACKS: CreditPack[] = [
    {
        id: 'start',
        name: 'Start',
        nameSk: 'Štart',
        credits: 5,
        price: 5,
        discount: 0,
    },
    {
        id: 'basic',
        name: 'Basic',
        nameSk: 'Základ',
        credits: 10,
        price: 9,
        discount: 10,
    },
    {
        id: 'seller',
        name: 'Seller',
        nameSk: 'Predajca',
        credits: 25,
        price: 20,
        discount: 20,
        featured: true, // Highlighted pack
    },
    {
        id: 'pro',
        name: 'Pro',
        nameSk: 'Profi',
        credits: 50,
        price: 35,
        discount: 30,
    },
    {
        id: 'dealer',
        name: 'Dealer',
        nameSk: 'Dealer',
        credits: 100,
        price: 60,
        discount: 40,
    },
];

// Action costs in credits
export interface ActionCost {
    id: string;
    name: string;
    nameSk: string;
    credits: number;
    duration: string;
    durationDays?: number;
    description: string;
    descriptionSk: string;
}

export const ACTION_COSTS: ActionCost[] = [
    {
        id: 'publish',
        name: 'Publish Ad',
        nameSk: 'Zverejniť inzerát',
        credits: 1,
        duration: '30 days',
        durationDays: 30,
        description: 'Publish a new car listing',
        descriptionSk: 'Zverejnite nový inzerát',
    },
    {
        id: 'prolong',
        name: 'Prolong Ad',
        nameSk: 'Predĺžiť inzerát',
        credits: 1,
        duration: '+30 days',
        durationDays: 30,
        description: 'Extend listing by 30 more days',
        descriptionSk: 'Predĺžte inzerát o ďalších 30 dní',
    },
    {
        id: 'top',
        name: 'Top Ad',
        nameSk: 'Topovanie',
        credits: 3,
        duration: '7 days',
        durationDays: 7,
        description: 'Move to #1 position group with gold border',
        descriptionSk: 'Presuňte na prvé miesto so zlatým orámovaním',
    },
    {
        id: 'highlight',
        name: 'Highlight',
        nameSk: 'Zvýraznenie',
        credits: 2,
        duration: '7 days',
        durationDays: 7,
        description: 'Bigger thumbnail with golden glow effect',
        descriptionSk: 'Väčší náhľad so zlatým efektom',
    },
    {
        id: 'bump',
        name: 'Bump to Top',
        nameSk: 'Vyzdvihnúť',
        credits: 1,
        duration: 'Instant',
        description: 'Reset published_at to NOW (appears fresh)',
        descriptionSk: 'Obnoviť dátum zverejnenia',
    },
];

// Dealer bulk discounts
export interface BulkDiscount {
    action: string;
    quantity: number;
    normalCost: number;
    discountedCost: number;
    discount: number; // percentage
}

export const DEALER_BULK_DISCOUNTS: BulkDiscount[] = [
    {
        action: 'prolong',
        quantity: 10,
        normalCost: 10,
        discountedCost: 8,
        discount: 20,
    },
    {
        action: 'top',
        quantity: 5,
        normalCost: 15,
        discountedCost: 12,
        discount: 20,
    },
];

// Ad expiration settings
export const AD_DURATION_DAYS = 30;
export const PREMIUM_DURATION_DAYS = 7;
export const SOLD_VISIBILITY_DAYS = 4;

// Photo limits
export const BASIC_PHOTO_LIMIT = 10;
export const PREMIUM_PHOTO_LIMIT = 30;

/**
 * Calculate the effective price per credit for a pack
 */
export function getPricePerCredit(pack: CreditPack): number {
    return Math.round((pack.price / pack.credits) * 100) / 100;
}

/**
 * Get total credits user can afford with given balance
 */
export function getAffordableActions(
    creditBalance: number,
    actionId: string
): number {
    const action = ACTION_COSTS.find((a) => a.id === actionId);
    if (!action) return 0;
    return Math.floor(creditBalance / action.credits);
}

/**
 * Check if user has enough credits for an action
 */
export function canAffordAction(
    creditBalance: number,
    actionId: string,
    quantity: number = 1
): boolean {
    const action = ACTION_COSTS.find((a) => a.id === actionId);
    if (!action) return false;
    return creditBalance >= action.credits * quantity;
}

/**
 * Get the featured/recommended pack
 */
export function getFeaturedPack(): CreditPack | undefined {
    return CREDIT_PACKS.find((pack) => pack.featured);
}
