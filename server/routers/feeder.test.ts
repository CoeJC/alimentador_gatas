import { describe, it, expect, beforeEach, vi } from "vitest";
import { feederRouter } from "./feeder";
import * as db from "../db";

// Mock das funções do banco de dados
vi.mock("../db", () => ({
  getOrCreateDeviceStatus: vi.fn(),
  updateDeviceStatus: vi.fn(),
  addFeedingSession: vi.fn(),
  getFeedingHistory: vi.fn(),
  getFeedingSchedules: vi.fn(),
  updateFeedingSchedule: vi.fn(),
  createPendingCommand: vi.fn(),
  getPendingCommands: vi.fn(),
  acknowledgeCommand: vi.fn(),
  completeCommand: vi.fn(),
}));

describe("feederRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("feedManually", () => {
    it("should record a manual feeding session", async () => {
      const caller = feederRouter.createCaller({
        user: {
          id: 1,
          openId: "test-user",
          email: "test@example.com",
          name: "Test User",
          loginMethod: "test",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      vi.mocked(db.createPendingCommand).mockResolvedValue(undefined);
      vi.mocked(db.addFeedingSession).mockResolvedValue(undefined);

      const result = await caller.feedManually({ mealNumber: 1 });

      expect(result).toEqual({
        success: true,
        message: "Alimentação manual acionada",
      });
      expect(db.createPendingCommand).toHaveBeenCalledWith("feed_meal_1");
      expect(db.addFeedingSession).toHaveBeenCalledWith("manual", 1);
    });

    it("should validate meal number is between 1 and 2", async () => {
      const caller = feederRouter.createCaller({
        user: {
          id: 1,
          openId: "test-user",
          email: "test@example.com",
          name: "Test User",
          loginMethod: "test",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.feedManually({ mealNumber: 3 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("getStatus", () => {
    it("should return device status and schedules", async () => {
      const mockStatus = {
        id: 1,
        meal1Completed: 0,
        meal2Completed: 0,
        currentTime: "10:30",
        nextMealTime: "12:00",
        isOnline: 1,
        lastHeartbeat: new Date(),
        updatedAt: new Date(),
      };

      const mockSchedules = [
        { id: 1, mealNumber: 1, hour: 8, minute: 0, enabled: 1, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, mealNumber: 2, hour: 18, minute: 0, enabled: 1, createdAt: new Date(), updatedAt: new Date() },
      ];

      vi.mocked(db.getOrCreateDeviceStatus).mockResolvedValue(mockStatus as any);
      vi.mocked(db.getFeedingSchedules).mockResolvedValue(mockSchedules as any);

      const caller = feederRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getStatus();

      expect(result.device).toEqual(mockStatus);
      expect(result.schedules).toEqual(mockSchedules);
    });
  });

  describe("updateDeviceStatus", () => {
    it("should update device status", async () => {
      const mockStatus = {
        id: 1,
        meal1Completed: 1,
        meal2Completed: 0,
        currentTime: "10:30",
        nextMealTime: "18:00",
        isOnline: 1,
        lastHeartbeat: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.updateDeviceStatus).mockResolvedValue([mockStatus] as any);

      const caller = feederRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.updateDeviceStatus({
        meal1Completed: 1,
        currentTime: "10:30",
        isOnline: 1,
      });

      expect(result.success).toBe(true);
      expect(db.updateDeviceStatus).toHaveBeenCalledWith({
        meal1Completed: 1,
        meal2Completed: undefined,
        currentTime: "10:30",
        nextMealTime: undefined,
        isOnline: 1,
      });
    });
  });

  describe("getHistory", () => {
    it("should return feeding history with default limit", async () => {
      const mockHistory = [
        {
          id: 1,
          type: "manual" as const,
          mealNumber: 1,
          timestamp: new Date(),
          createdAt: new Date(),
        },
        {
          id: 2,
          type: "automatic" as const,
          mealNumber: 2,
          timestamp: new Date(),
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getFeedingHistory).mockResolvedValue(mockHistory as any);

      const caller = feederRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getHistory({});

      expect(result).toEqual(mockHistory);
      expect(db.getFeedingHistory).toHaveBeenCalledWith(20);
    });

    it("should respect custom limit", async () => {
      vi.mocked(db.getFeedingHistory).mockResolvedValue([]);

      const caller = feederRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      await caller.getHistory({ limit: 50 });

      expect(db.getFeedingHistory).toHaveBeenCalledWith(50);
    });
  });

  describe("recordAutoFeeding", () => {
    it("should record an automatic feeding session", async () => {
      vi.mocked(db.addFeedingSession).mockResolvedValue(undefined);

      const caller = feederRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.recordAutoFeeding({ mealNumber: 1 });

      expect(result).toEqual({ success: true });
      expect(db.addFeedingSession).toHaveBeenCalledWith("automatic", 1);
    });
  });
});
