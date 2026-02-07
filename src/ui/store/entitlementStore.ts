import { create } from 'zustand';
import { Entitlements, loadEntitlements, setEntitlement } from '../../data/entitlements/EntitlementService';

interface EntitlementState {
  entitlements: Entitlements;
  load: () => Promise<void>;
  toggle: (key: keyof Entitlements) => Promise<void>;
}

const defaultEntitlements: Entitlements = {
  premium_training: false,
  online_video: false,
  advanced_stats: false,
};

export const useEntitlementStore = create<EntitlementState>((set, get) => ({
  entitlements: defaultEntitlements,
  load: async () => {
    const data = await loadEntitlements();
    set({ entitlements: data });
  },
  toggle: async (key) => {
    const current = get().entitlements[key];
    const next = await setEntitlement(key as any, !current);
    set({ entitlements: next });
  },
}));
