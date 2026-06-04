// One-off authenticated smoke test. Mints session cookies (same jose scheme as
// src/lib/auth.ts) for the seeded owner + super admin, then hits every module
// route and reports the HTTP status. Run: node scripts/smoke-auth.mjs
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const db = new PrismaClient();
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-insecure-secret-change-me-in-production-0000",
);
const BASE = "http://localhost:3000";

function mint(u, orgId) {
  return new SignJWT({
    userId: u.id,
    email: u.email,
    name: u.name,
    isSuperAdmin: u.isSuperAdmin,
    activeOrgId: orgId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

async function hit(path, cookie) {
  try {
    const res = await fetch(BASE + path, {
      headers: { cookie: `stayguide_session=${cookie}` },
      redirect: "manual",
    });
    const flag = res.status === 200 ? "✓" : res.status >= 300 && res.status < 400 ? "↪" : "✗";
    console.log(`  ${flag} ${res.status}  ${path}`);
    return res.status;
  } catch (e) {
    console.log(`  ✗ ERR  ${path}  ${e.message}`);
    return 0;
  }
}

const owner = await db.user.findUnique({
  where: { email: "owner@demo-tirol.test" },
  include: { memberships: true },
});
const admin = await db.user.findUnique({ where: { email: "admin@stayguide.test" } });
const property = await db.property.findFirst({ where: { organizationId: owner.memberships[0].organizationId } });

const ownerCookie = await mint(owner, owner.memberships[0].organizationId);
const adminCookie = await mint(admin, null);
const pid = property.id;

console.log("\n=== Host app (owner) ===");
let fails = 0;
for (const p of [
  "/dashboard", "/properties", `/properties/${pid}`, `/properties/${pid}/guide`,
  `/properties/${pid}/media`, `/properties/${pid}/qr`, `/properties/${pid}/recommendations`,
  `/properties/${pid}/ai`, `/properties/${pid}/analytics`,
  "/issues", "/cleaning", "/inventory", "/messages", "/questions", "/reviews",
  "/analytics", "/settings/team", "/settings/billing", "/settings/organization", "/templates",
]) {
  if ((await hit(p, ownerCookie)) !== 200) fails++;
}

console.log("\n=== Admin (super admin) ===");
for (const p of ["/admin", "/admin/organizations", "/admin/users", "/admin/subscriptions", "/admin/logs"]) {
  if ((await hit(p, adminCookie)) !== 200) fails++;
}

console.log(`\n${fails === 0 ? "✅ ALL AUTHED ROUTES OK" : `⚠️ ${fails} route(s) not 200`}`);
await db.$disconnect();
process.exit(0);
