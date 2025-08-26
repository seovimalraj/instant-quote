import { describe, it, expect, vi } from 'vitest';
import { minutesNeededForItem, earliestSlot } from '../../src/lib/capacity';

let order: any;
let mockClient: any;
vi.mock('../../src/lib/supabase/server', () => ({ createClient: () => mockClient }));

describe('capacity utilities', () => {
  it('extracts reserved minutes from item', () => {
    expect(minutesNeededForItem({ capacity_minutes_reserved: 30 })).toBe(30);
    expect(minutesNeededForItem({ pricing_breakdown: { capacity_minutes: 15 } })).toBe(15);
    expect(minutesNeededForItem({})).toBe(0);
  });

  it('finds earliest slot with available capacity', async () => {
    order = vi.fn().mockResolvedValue({
      data: [
        { day: '2024-01-01', minutes_available: 480, minutes_reserved: 470 },
        { day: '2024-01-02', minutes_available: 480, minutes_reserved: 480 },
        { day: '2024-01-03', minutes_available: 480, minutes_reserved: 100 },
      ],
      error: null,
    });
    mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({ order }),
            }),
          }),
        }),
      }),
    } as any;
    vi.mock('../../src/lib/supabase/server', () => ({ createClient: () => mockClient }));
    const res = await earliestSlot({ machineId: 'm1', minutesRequired: 100, startDate: new Date('2024-01-01'), maxDays: 5 });
    expect(res).toEqual({ date: '2024-01-03', minutes: 380 });
    vi.restoreAllMocks();
  });
});
