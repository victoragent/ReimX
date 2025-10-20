import { aggregateForSafeWallet, aggregateSalariesForSafeWallet } from "@/lib/safewallet";

const baseReimbursement = {
  amountOriginal: 0,
  currency: "USD",
  exchangeRateToUsd: 1,
  amountUsdEquivalent: 0,
  exchangeRateSource: "mock",
  exchangeRateTime: new Date(),
  isManualRate: false,
  convertedBy: null,
  chain: "evm",
  receiptUrl: null,
  status: "approved",
  reviewerId: null,
  approverId: "admin",
  txHash: null,
  reviewComment: null,
  reviewedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  applicantId: "user_1",
  applicant: {
    id: "user_1",
    username: "Alice",
    email: "alice@example.com",
    evmAddress: "0xAlice",
    solanaAddress: null
  }
} as const;

describe("aggregateForSafeWallet", () => {
  it("groups reimbursements by applicant and converts to USDT", () => {
    const aggregation = aggregateForSafeWallet([
      {
        ...baseReimbursement,
        id: "reimb_1",
        title: "Flight",
        description: "NYC trip",
        amountOriginal: 1000,
        amountUsdEquivalent: 1000
      },
      {
        ...baseReimbursement,
        id: "reimb_2",
        title: "Hotel",
        description: "3 nights",
        amountOriginal: 5000,
        currency: "RMB",
        exchangeRateToUsd: 0.14,
        amountUsdEquivalent: 700
      },
      {
        ...baseReimbursement,
        id: "reimb_3",
        applicantId: "user_2",
        applicant: {
          id: "user_2",
          username: "Bob",
          email: "bob@example.com",
          evmAddress: null,
          solanaAddress: null
        },
        title: "Taxi",
        description: null,
        amountOriginal: 300,
        amountUsdEquivalent: 300
      }
    ]);

    expect(aggregation.items).toHaveLength(3);
    expect(aggregation.batches).toHaveLength(2);

    const aliceBatch = aggregation.batches.find((batch) => batch.applicantId === "user_1");
    expect(aliceBatch).toBeDefined();
    expect(aliceBatch?.totalAmountUsdt).toBeCloseTo(1700);
    expect(aliceBatch?.reimbursementIds).toEqual(["reimb_1", "reimb_2"]);

    const safewalletTx = aggregation.safewalletPayload.transactions.find((tx) => tx.metadata.applicantId === "user_1");
    expect(safewalletTx).toBeDefined();
    expect(safewalletTx?.to).toBe("0xAlice");
    expect(Number(safewalletTx?.value)).toBeGreaterThan(0);

    const issues = aggregation.issues.filter((issue) => issue.applicantId === "user_2");
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("missing_evm_address");
  });
});

describe("aggregateSalariesForSafeWallet", () => {
  it("aggregates salary payments per user", () => {
    const aggregation = aggregateSalariesForSafeWallet([
      {
        id: "salary_1",
        userId: "user_1",
        month: "2024-08",
        amountUsdt: 3000,
        status: "pending",
        scheduledAt: new Date(),
        paidAt: null,
        transactionHash: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: "user_1",
          username: "Alice",
          email: "alice@example.com",
          evmAddress: "0xAlice",
          solanaAddress: null
        }
      },
      {
        id: "salary_2",
        userId: "user_2",
        month: "2024-08",
        amountUsdt: 2500,
        status: "pending",
        scheduledAt: new Date(),
        paidAt: null,
        transactionHash: null,
        notes: "Part-time",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: "user_2",
          username: "Bob",
          email: "bob@example.com",
          evmAddress: null,
          solanaAddress: null
        }
      }
    ]);

    expect(aggregation.items).toHaveLength(2);
    expect(aggregation.batches).toHaveLength(2);

    const aliceBatch = aggregation.batches.find((batch) => batch.applicantId === "user_1");
    expect(aliceBatch?.totalAmountUsdt).toBeCloseTo(3000);
    const issues = aggregation.issues.map((issue) => issue.applicantId);
    expect(issues).toContain("user_2");
    const safeTx = aggregation.safewalletPayload.transactions.find((tx) => tx.metadata.applicantId === "user_1");
    expect(safeTx).toBeDefined();
    expect(Number(safeTx?.value)).toBeGreaterThan(0);
  });
});
