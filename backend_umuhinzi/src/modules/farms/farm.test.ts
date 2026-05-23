import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret";

const prismaMock: any = {
  user: {
    findUnique: jest.fn(),
  },
  farm: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $connect: jest.fn(),
  $queryRaw: jest.fn(),
};

let app: any;

beforeAll(async () => {
  await jest.unstable_mockModule("../../lib/prisma.js", () => ({ prisma: prismaMock }));
  app = (await import("../../app.js")).default;
});

const farmerToken = jwt.sign({ userId: "farmer-user", role: "FARMER" }, process.env.JWT_SECRET as string);
const adminToken = jwt.sign({ userId: "admin-user", role: "ADMIN" }, process.env.JWT_SECRET as string);
const farmerUserId = "farmer-user";
const adminUserId = "admin-user";

beforeEach(() => {
  jest.clearAllMocks();

  prismaMock.user.findUnique.mockImplementation(async (args: any) => {
    const { where } = args;

    if (where.id === farmerUserId) {
      return {
        id: farmerUserId,
        role: "FARMER",
        status: "ACTIVE",
        farmerProfile: { id: "farmer-1" },
      };
    }

    if (where.id === adminUserId) {
      return {
        id: adminUserId,
        role: "ADMIN",
        status: "ACTIVE",
        farmerProfile: null,
      };
    }

    return null;
  });
});

describe("Farm endpoints", () => {
  it("creates a farm", async () => {
    prismaMock.farm.create.mockResolvedValue({ id: "farm-1", name: "Alpha Farm" });

    const response = await request(app)
      .post("/api/farms")
      .set("Authorization", `Bearer ${farmerToken}`)
      .send({
        name: "Alpha Farm",
        landSize: 2,
        landUnit: "HECTARE",
        ownershipType: "OWNED",
        soilType: "LOAM",
        province: "Kigali",
        district: "Gasabo",
        sector: "Kacyiru",
        cell: "Kamatamu",
        village: "Muganza",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("Alpha Farm");
  });

  it("returns validation errors", async () => {
    const response = await request(app)
      .post("/api/farms")
      .set("Authorization", `Bearer ${farmerToken}`)
      .send({ name: "Al", landSize: -2 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("lists the authenticated farmer farms", async () => {
    prismaMock.farm.findMany.mockResolvedValue([{ id: "farm-1", name: "Alpha Farm" }]);
    prismaMock.farm.count.mockResolvedValue(1);

    const response = await request(app)
      .get("/api/farms/me")
      .set("Authorization", `Bearer ${farmerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it("blocks farmer access to the admin listing", async () => {
    const response = await request(app)
      .get("/api/admin/farms")
      .set("Authorization", `Bearer ${farmerToken}`);

    expect(response.status).toBe(403);
  });

  it("allows admin access to the admin listing", async () => {
    prismaMock.farm.findMany.mockResolvedValue([{ id: "farm-1", name: "Alpha Farm" }]);
    prismaMock.farm.count.mockResolvedValue(1);

    const response = await request(app)
      .get("/api/admin/farms")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });
});
