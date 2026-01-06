import { POST as CreateRecord } from "@/app/api/assets/[id]/records/route";
import { PATCH as UpdateRecord, DELETE as DeleteRecord } from "@/app/api/assets/records/[recordId]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { Decimal } from "@prisma/client/runtime/library";

// Mock next-auth
jest.mock("next-auth", () => ({
    getServerSession: jest.fn()
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
    prisma: {
        asset: {
            findUnique: jest.fn(),
            update: jest.fn()
        },
        assetRecord: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        $transaction: jest.fn((callback) => callback(require("@/lib/prisma").prisma))
    }
}));

describe("Asset Logic (Recalculation)", () => {
    const mockUser = { id: "user-1", email: "user@example.com", role: "user" };

    beforeEach(() => {
        jest.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });
    });

    describe("POST /api/assets/[id]/records", () => {
        it("should calculate CONSUMPTION correctly", async () => {
            // Setup: Asset with current value 1000
            (prisma.asset.findUnique as jest.Mock).mockResolvedValue({
                id: "asset-1",
                userId: mockUser.id,
                currentValue: new Decimal(1000)
            });

            // Input: Consume -100
            const payload = {
                type: "CONSUMPTION",
                amount: -100,
                date: "2024-01-02"
            };

            const req = {
                json: async () => payload,
            } as any;

            // Call API (passing params via second arg mock)
            // Note: Route handlers signature is (req, { params })
            await CreateRecord(req, { params: { id: "asset-1" } });

            // Expect update to asset
            expect(prisma.asset.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: "asset-1" },
                data: {
                    currentValue: new Decimal(900) // 1000 - 100
                }
            }));
        });

        it("should calculate REVALUATION correctly", async () => {
            // Setup: Asset with current value 1000
            (prisma.asset.findUnique as jest.Mock).mockResolvedValue({
                id: "asset-1",
                userId: mockUser.id,
                currentValue: new Decimal(1000)
            });

            // Input: Revalue to 1200
            const payload = {
                type: "REVALUATION",
                amount: 1200,
                date: "2024-01-02"
            };

            const req = {
                json: async () => payload,
            } as any;

            await CreateRecord(req, { params: { id: "asset-1" } });

            // Expect record creation with calculated delta
            expect(prisma.assetRecord.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    amountChange: new Decimal(200), // 1200 - 1000
                    valueAfter: new Decimal(1200)
                })
            }));

            // Expect asset update
            expect(prisma.asset.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: "asset-1" },
                data: { currentValue: new Decimal(1200) }
            }));
        });
    });

    describe("PATCH /api/assets/records/[recordId]", () => {
        it("should recalculate history when editing a record", async () => {
            // Scenario:
            // 1. Initial: 1000
            // 2. Consumption: -100 (Recorded) -> Value 900
            // 3. User updates Consumption to -200
            // Expect: Final Value 800

            const mockAsset = {
                id: "asset-1",
                initialValue: new Decimal(1000),
                currentValue: new Decimal(900)
            };

            const mockRecord = {
                id: "rec-1",
                assetId: "asset-1",
                userId: mockUser.id,
                type: "CONSUMPTION",
                amountChange: new Decimal(-100),
                valueAfter: new Decimal(900),
                date: new Date("2024-01-02")
            };

            // Setup findUnique for record check
            (prisma.assetRecord.findUnique as jest.Mock).mockResolvedValue({
                ...mockRecord,
                asset: mockAsset
            });

            // Setup findUnique for replay (inside transaction) -> simulates fetching asset
            // Setup findMany for replay -> returns ordered records (Initial + The Edited Record)
            // *Crucially*, the transactional update happens BEFORE replay.
            // So findMany should simulate returning the UPDATED record state if we were using a real DB.
            // But with Mocks, we have to cheat or mock the sequence.

            // Let's assume the code calls update first, then findMany.
            // We mock findMany to return the Modified list.
            const mockRecordsList = [
                {
                    id: "rec-init",
                    type: "INITIAL",
                    amountChange: new Decimal(0),
                    valueAfter: new Decimal(1000),
                    date: new Date("2024-01-01")
                },
                {
                    id: "rec-1",
                    type: "CONSUMPTION",
                    amountChange: new Decimal(-200), // Already updated in our "mock db" view
                    valueAfter: new Decimal(900), // Old value, needs recalculation
                    date: new Date("2024-01-02")
                }
            ];

            (prisma.asset.findUnique as jest.Mock).mockResolvedValue(mockAsset);
            (prisma.assetRecord.findMany as jest.Mock).mockResolvedValue(mockRecordsList);

            const payload = { amount: -200 };
            const req = { json: async () => payload } as any;

            await UpdateRecord(req, { params: { recordId: "rec-1" } });

            // During replay loop:
            // 1. Initial: Val=1000
            // 2. Consumption: -200. New Val = 800.
            // expect update to be called for rec-1 with new valueAfter

            const updateCalls = (prisma.assetRecord.update as jest.Mock).mock.calls;
            // First call is the API update (changing amount)
            expect(updateCalls[0][0].where.id).toBe("rec-1");
            expect(updateCalls[0][0].data.amountChange).toEqual(new Decimal(-200));

            // Second call (inside replay) updates valueAfter
            // Note: The logic in route.ts updates record if calculated values diff from stored.
            // In our mock list, valueAfter is 900. Calculated is 800. So it should update.
            const replayUpdate = updateCalls.find((call: any) => call[0].data.valueAfter);
            expect(replayUpdate).toBeDefined();
            expect(replayUpdate[0].data.valueAfter).toEqual(new Decimal(800));

            // Final asset update
            expect(prisma.asset.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: "asset-1" },
                data: { currentValue: new Decimal(800) }
            }));
        });
    });
});
