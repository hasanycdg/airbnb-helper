/**
 * Seed: "Demo Property Management Tirol" with three properties, full guide
 * content, QR codes, media, recommendations, inventory, cleaning tasks,
 * issues, guest questions, message templates and ~30 days of analytics.
 *
 * Run with: npm run db:seed   (wipes existing data — development only)
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import type { Locale, Prisma } from "@prisma/client";

const db = new PrismaClient();

const PASSWORD_HASH = bcrypt.hashSync("password123", 10);
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86_400_000);
const token = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`;
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

async function wipe() {
  await db.translation.deleteMany();
  await db.auditLog.deleteMany();
  await db.adminSetting.deleteMany();
  await db.organization.deleteMany(); // cascades to all tenant data
  await db.user.deleteMany();
}

async function main() {
  console.log("🌱 Seeding StayGuide Pro …");
  await wipe();

  // ── Users ───────────────────────────────────────────────────────────────
  const owner = await db.user.create({
    data: { email: "owner@demo-tirol.test", name: "Anna Gruber", hashedPassword: PASSWORD_HASH },
  });
  const manager = await db.user.create({
    data: { email: "manager@demo-tirol.test", name: "Marco Hofer", hashedPassword: PASSWORD_HASH },
  });
  const cleaner = await db.user.create({
    data: { email: "cleaner@demo-tirol.test", name: "Sofia Klein", hashedPassword: PASSWORD_HASH },
  });
  await db.user.create({
    data: {
      email: "admin@stayguide.test",
      name: "Platform Admin",
      hashedPassword: PASSWORD_HASH,
      isSuperAdmin: true,
    },
  });

  // ── Organization + members + subscription ────────────────────────────────
  const org = await db.organization.create({
    data: {
      name: "Demo Property Management Tirol",
      slug: "demo-tirol",
      primaryColor: "#0F766E",
      defaultLocale: "EN",
      supportedLocales: ["EN", "DE", "IT"],
      trialEndsAt: daysFromNow(40),
      members: {
        create: [
          { userId: owner.id, role: "OWNER" },
          { userId: manager.id, role: "MANAGER" },
          { userId: cleaner.id, role: "CLEANER" },
        ],
      },
      subscription: {
        create: {
          plan: "PREMIUM",
          status: "ACTIVE",
          currentPeriodEnd: daysFromNow(25),
          stripeCustomerId: "cus_demo",
        },
      },
    },
  });

  const template = await db.cleaningChecklistTemplate.create({
    data: {
      organizationId: org.id,
      name: "Standard turnover",
      isDefault: true,
      items: {
        create: DEFAULT_CHECKLIST.map((c, i) => ({ label: c.label, room: c.room, order: i })),
      },
    },
  });

  // ── Properties ────────────────────────────────────────────────────────────
  const innsbruck = await createProperty(org.id, {
    name: "Innsbruck Altstadt",
    publicName: "City Apartment Innsbruck",
    slug: "city-apartment-innsbruck",
    city: "Innsbruck",
    address: "Herzog-Friedrich-Straße 21",
    postal: "6020",
    cover:
      "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1200&q=70",
    wifi: { name: "Altstadt-Guest", pass: "Inn2024bruck" },
    parking: "Public garage 'Markthalle' 150m away (€18/day). No private parking.",
    locales: ["EN", "DE", "IT"],
  });

  const studio = await createProperty(org.id, {
    name: "Mountain View Studio",
    publicName: "Mountain View Studio",
    slug: "mountain-view-studio",
    city: "Innsbruck",
    address: "Hungerburg 4",
    postal: "6020",
    cover:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=70",
    wifi: { name: "MountainView", pass: "alpenglow22" },
    parking: "One free private parking spot in front of the building (spot #4).",
    locales: ["EN", "DE"],
  });

  const lodge = await createProperty(org.id, {
    name: "Ski Lodge Stubai",
    publicName: "Ski Lodge Stubai",
    slug: "ski-lodge-stubai",
    city: "Neustift im Stubaital",
    address: "Dorf 12",
    postal: "6167",
    cover:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=70",
    wifi: { name: "StubaiLodge", pass: "snow-fun-2024" },
    parking: "Two private spots in the garage. Ski bus stop 'Dorf' is 80m away.",
    locales: ["EN", "DE", "IT"],
  });

  const properties = [innsbruck, studio, lodge];

  // ── Media (video FAQ) for Innsbruck ────────────────────────────────────────
  const sections = await db.guideSection.findMany({ where: { propertyId: innsbruck.id } });
  const sectionBySlug = Object.fromEntries(sections.map((s) => [s.slug, s]));

  const keyboxVideo = await db.guideMedia.create({
    data: {
      propertyId: innsbruck.id,
      type: "VIDEO",
      url: "https://cdn.example.com/demo/keybox.mp4",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=60",
      title: "How to open the keybox",
      topic: "keybox",
      durationSeconds: 48,
      transcript:
        "The keybox is to the right of the main door. Enter the code 4-7-2-9, then slide the cover down to release the key.",
      sections: { connect: [{ id: sectionBySlug["keybox"].id }, { id: sectionBySlug["check-in"].id }] },
    },
  });
  await db.guideMedia.create({
    data: {
      propertyId: innsbruck.id,
      type: "VIDEO",
      url: "https://cdn.example.com/demo/heating.mp4",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=600&q=60",
      title: "Using the heating",
      topic: "heating",
      durationSeconds: 65,
      transcript:
        "The thermostat is on the hallway wall. Turn the dial to set the temperature. It takes about 20 minutes to warm up.",
      sections: { connect: [{ id: sectionBySlug["heating"].id }] },
    },
  });

  // ── Translations (DE) for a couple of Innsbruck sections ───────────────────
  await db.translation.createMany({
    data: [
      {
        entityType: "GuideSection",
        entityId: sectionBySlug["wifi"].id,
        field: "title",
        locale: "DE",
        value: "WLAN",
      },
      {
        entityType: "GuideSection",
        entityId: sectionBySlug["wifi"].id,
        field: "content",
        locale: "DE",
        value:
          "Verbinde dich mit dem Netzwerk **Altstadt-Guest**.\n\nPasswort: **Inn2024bruck**\n\nDas WLAN ist im ganzen Apartment verfügbar.",
        isMachine: true,
      },
      {
        entityType: "GuideSection",
        entityId: sectionBySlug["checkout"].id,
        field: "title",
        locale: "DE",
        value: "Check-out",
      },
    ],
  });

  // ── QR codes for Innsbruck ─────────────────────────────────────────────────
  const guideUrl = (slug: string, hash = "") => `/g/${slug}${hash}`;
  await db.qRCode.createMany({
    data: [
      { propertyId: innsbruck.id, type: "FULL_GUIDE", label: "Full guide", token: token("g"), targetPath: guideUrl(innsbruck.slug), scanCount: 184 },
      { propertyId: innsbruck.id, type: "WIFI", label: "WiFi", token: token("w"), targetPath: guideUrl(innsbruck.slug, "#wifi"), sectionId: sectionBySlug["wifi"].id, scanCount: 96 },
      { propertyId: innsbruck.id, type: "PARKING", label: "Parking", token: token("p"), targetPath: guideUrl(innsbruck.slug, "#parking"), sectionId: sectionBySlug["parking"].id, scanCount: 54 },
      { propertyId: innsbruck.id, type: "CHECKOUT", label: "Checkout", token: token("c"), targetPath: guideUrl(innsbruck.slug, "#checkout"), sectionId: sectionBySlug["checkout"].id, scanCount: 38 },
      { propertyId: innsbruck.id, type: "ISSUE_REPORT", label: "Report a problem", token: token("i"), targetPath: `/g/${innsbruck.slug}/report`, scanCount: 11 },
    ],
  });

  // ── Guest stays ─────────────────────────────────────────────────────────────
  const currentStay = await db.guestStay.create({
    data: {
      propertyId: innsbruck.id,
      guestName: "Julia Weber",
      guestEmail: "julia.weber@example.com",
      locale: "DE",
      checkIn: daysAgo(1),
      checkOut: daysFromNow(3),
      numGuests: 2,
      bookingCode: "HMABCD1234",
    },
  });
  const pastStay = await db.guestStay.create({
    data: {
      propertyId: innsbruck.id,
      guestName: "Tom Bakker",
      guestEmail: "tom.bakker@example.com",
      locale: "NL",
      checkIn: daysAgo(12),
      checkOut: daysAgo(5),
      numGuests: 3,
    },
  });

  // ── Satisfaction checks ─────────────────────────────────────────────────────
  await db.satisfactionCheck.create({
    data: {
      propertyId: innsbruck.id,
      guestStayId: currentStay.id,
      token: token("s"),
      status: "GOOD",
      respondedAt: daysAgo(0),
    },
  });
  const problemCheck = await db.satisfactionCheck.create({
    data: {
      propertyId: innsbruck.id,
      guestStayId: pastStay.id,
      token: token("s"),
      status: "PROBLEM",
      problemCategory: "HEATING",
      comment: "The bedroom radiator stayed cold the first night.",
      respondedAt: daysAgo(11),
    },
  });

  // ── Issues ─────────────────────────────────────────────────────────────────
  const issueHeating = await db.issue.create({
    data: {
      propertyId: innsbruck.id,
      organizationId: org.id,
      guestStayId: pastStay.id,
      satisfactionCheckId: problemCheck.id,
      title: "Bedroom radiator not heating",
      category: "HEATING",
      description: "Radiator in the main bedroom stays cold even when turned up fully.",
      urgency: "HIGH",
      status: "RESOLVED",
      source: "SATISFACTION",
      roomLocation: "Bedroom",
      guestName: "Tom Bakker",
      assignedToId: manager.id,
      resolvedAt: daysAgo(10),
      comments: {
        create: [
          { authorId: manager.id, body: "Bled the radiator, works now. Will check again next turnover.", isInternal: true },
          { authorId: manager.id, body: "Hi Tom, so sorry about that — the radiator is fixed now. Please let us know if it happens again.", isInternal: false },
        ],
      },
    },
  });
  await db.issue.create({
    data: {
      propertyId: innsbruck.id,
      organizationId: org.id,
      title: "WiFi slow in the evening",
      category: "WIFI",
      description: "Guest reports buffering on Netflix around 9pm.",
      urgency: "MEDIUM",
      status: "IN_PROGRESS",
      source: "GUEST",
      guestName: "Julia Weber",
      assignedToId: manager.id,
    },
  });
  await db.issue.create({
    data: {
      propertyId: lodge.id,
      organizationId: org.id,
      title: "Missing coffee capsules",
      category: "MISSING_ITEM",
      description: "No Nespresso capsules left in the kitchen.",
      urgency: "LOW",
      status: "NEW",
      source: "GUEST",
    },
  });

  // ── Guest questions + AI logs ────────────────────────────────────────────────
  const qa: [string, Locale, boolean, string | null][] = [
    ["How do I turn on the heating?", "EN", true, sectionBySlug["heating"].id],
    ["What is the WiFi password?", "EN", true, sectionBySlug["wifi"].id],
    ["Wie funktioniert der Schlüsselkasten?", "DE", true, sectionBySlug["keybox"].id],
    ["Where can I park my car?", "EN", true, sectionBySlug["parking"].id],
    ["Is there a washing machine?", "EN", false, null],
    ["Can I check in earlier than 3pm?", "EN", false, null],
    ["Do you allow pets?", "DE", false, null],
  ];
  for (const [question, locale, answered, sectionId] of qa) {
    const gq = await db.guestQuestion.create({
      data: {
        propertyId: innsbruck.id,
        question,
        locale,
        answered,
        answerText: answered ? "Answered from the approved guide content." : null,
        matchedSectionId: sectionId,
        confidence: answered ? 0.82 : 0.21,
        escalated: !answered,
        suggestedFaq: !answered,
        createdAt: daysAgo(Math.floor(Math.random() * 20)),
      },
    });
    await db.aIAnswerLog.create({
      data: {
        propertyId: innsbruck.id,
        guestQuestionId: gq.id,
        prompt: question,
        response: answered ? "Approved answer returned to guest." : "Fallback: not sure, contacting host.",
        model: "fallback-retrieval",
        locale,
        confidence: answered ? 0.82 : 0.21,
        usedSectionIds: sectionId ? [sectionId] : [],
        fallback: !answered,
        createdAt: daysAgo(Math.floor(Math.random() * 20)),
      },
    });
  }

  // ── Cleaning tasks ───────────────────────────────────────────────────────────
  await db.cleaningTask.create({
    data: {
      propertyId: innsbruck.id,
      organizationId: org.id,
      templateId: template.id,
      title: "Turnover after Tom Bakker",
      status: "INSPECTED",
      assignedToId: cleaner.id,
      inspectedById: manager.id,
      dueAt: daysAgo(5),
      startedAt: daysAgo(5),
      completedAt: daysAgo(5),
      inspectedAt: daysAgo(5),
      readyForNextGuest: true,
      items: { create: DEFAULT_CHECKLIST.map((c, i) => ({ label: c.label, room: c.room, order: i, isDone: true, doneAt: daysAgo(5) })) },
    },
  });
  await db.cleaningTask.create({
    data: {
      propertyId: innsbruck.id,
      organizationId: org.id,
      templateId: template.id,
      title: "Turnover after Julia Weber",
      status: "PENDING",
      assignedToId: cleaner.id,
      dueAt: daysFromNow(3),
      items: { create: DEFAULT_CHECKLIST.map((c, i) => ({ label: c.label, room: c.room, order: i })) },
    },
  });
  await db.cleaningTask.create({
    data: {
      propertyId: lodge.id,
      organizationId: org.id,
      templateId: template.id,
      title: "Weekly deep clean",
      status: "IN_PROGRESS",
      assignedToId: cleaner.id,
      dueAt: daysFromNow(1),
      startedAt: daysAgo(0),
      items: { create: DEFAULT_CHECKLIST.map((c, i) => ({ label: c.label, room: c.room, order: i, isDone: i < 4, doneAt: i < 4 ? daysAgo(0) : null })) },
    },
  });

  // ── Restock tasks ──────────────────────────────────────────────────────────
  const lowItems = await db.inventoryItem.findMany({
    where: { propertyId: innsbruck.id, currentStatus: { in: ["LOW", "EMPTY"] } },
  });
  for (const item of lowItems) {
    await db.restockTask.create({
      data: {
        propertyId: innsbruck.id,
        inventoryItemId: item.id,
        title: `Restock ${item.name}`,
        status: "PENDING",
        assignedToId: cleaner.id,
        dueAt: daysFromNow(2),
      },
    });
  }

  // ── Review request ──────────────────────────────────────────────────────────
  await db.reviewRequest.create({
    data: {
      propertyId: innsbruck.id,
      guestStayId: pastStay.id,
      status: "READY",
      draftMessage:
        "Hi Tom, thanks for staying at City Apartment Innsbruck! We hope you enjoyed your trip. If you have a moment, a short review would mean a lot to us.",
      hostReviewDraft:
        "Tom was a wonderful guest — communicative, tidy, and respectful of the apartment. Welcome back anytime!",
      hasUnresolvedIssues: false,
    },
  });

  // ── Message templates (org-global) ───────────────────────────────────────────
  await db.messageTemplate.createMany({
    data: [
      {
        organizationId: org.id,
        type: "PRE_ARRIVAL",
        name: "Pre-arrival info",
        locale: "EN",
        subject: "Your stay at {{property_name}} — everything you need",
        body:
          "Hi {{guest_name}},\n\nWe're looking forward to welcoming you to {{property_name}}! Check-in is from {{check_in_time}}.\n\nYour digital guide (WiFi, keybox, parking, local tips): {{guide_link}}\n\nSee you soon!\n{{host_name}}",
      },
      {
        organizationId: org.id,
        type: "CHECK_IN_DAY",
        name: "Check-in day",
        locale: "EN",
        subject: "Welcome to {{property_name}}!",
        body:
          "Hi {{guest_name}}, welcome! Here's your guide with the keybox code and everything else: {{guide_link}}. WiFi: {{wifi_name}}. Enjoy your stay!",
      },
      {
        organizationId: org.id,
        type: "CHECKOUT_REMINDER",
        name: "Checkout reminder",
        locale: "EN",
        subject: "Checkout tomorrow at {{check_out_time}}",
        body:
          "Hi {{guest_name}}, just a reminder that checkout is tomorrow by {{check_out_time}}. Checkout steps are in your guide: {{guide_link}}. Safe travels!",
      },
      {
        organizationId: org.id,
        type: "REVIEW_REQUEST",
        name: "Review request",
        locale: "EN",
        subject: "Thanks for staying with us",
        body:
          "Hi {{guest_name}}, thank you for staying at {{property_name}}! If you enjoyed it, we'd be grateful for a quick review.",
      },
    ],
  });

  // ── Analytics: ~30 days of events ─────────────────────────────────────────────
  const eventTypes = ["GUIDE_VIEW", "SECTION_VIEW", "QR_SCAN", "AI_QUESTION"] as const;
  const locales: Locale[] = ["EN", "DE", "IT", "NL", "FR"];
  const analyticsRows: Prisma.AnalyticsEventCreateManyInput[] = [];
  const viewRows: Prisma.GuestGuideViewEventCreateManyInput[] = [];
  for (let i = 0; i < 320; i++) {
    const property = pick(properties);
    const type = pick(eventTypes as unknown as string[]) as (typeof eventTypes)[number];
    const createdAt = daysAgo(Math.floor(Math.random() * 30));
    const locale = pick(locales);
    analyticsRows.push({ organizationId: org.id, propertyId: property.id, type, locale, createdAt });
    if (type === "GUIDE_VIEW" || type === "SECTION_VIEW") {
      viewRows.push({ propertyId: property.id, locale, createdAt });
    }
  }
  await db.analyticsEvent.createMany({ data: analyticsRows });
  await db.guestGuideViewEvent.createMany({ data: viewRows });

  // ── Audit + admin settings ────────────────────────────────────────────────────
  await db.auditLog.createMany({
    data: [
      { organizationId: org.id, actorUserId: owner.id, action: "organization.create", targetType: "Organization", targetId: org.id },
      { organizationId: org.id, actorUserId: manager.id, action: "issue.resolve", targetType: "Issue", targetId: issueHeating.id },
    ],
  });
  await db.adminSetting.createMany({
    data: [
      { key: "platform.maintenanceMode", value: false },
      { key: "platform.signupsEnabled", value: true },
    ],
  });

  console.log("✅ Seed complete.");
  console.log("   Demo org:   Demo Property Management Tirol (/g/city-apartment-innsbruck)");
  console.log("   Owner:      owner@demo-tirol.test / password123");
  console.log("   Manager:    manager@demo-tirol.test / password123");
  console.log("   Cleaner:    cleaner@demo-tirol.test / password123");
  console.log("   Superadmin: admin@stayguide.test / password123");
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const DEFAULT_CHECKLIST = [
  { label: "Bedsheets changed", room: "Bedroom" },
  { label: "Towels replaced", room: "Bathroom" },
  { label: "Bathroom cleaned", room: "Bathroom" },
  { label: "Kitchen cleaned", room: "Kitchen" },
  { label: "Trash removed", room: "General" },
  { label: "Floors cleaned", room: "General" },
  { label: "Windows checked", room: "General" },
  { label: "Heating set to default", room: "General" },
  { label: "Keys returned to keybox", room: "Entrance" },
  { label: "Supplies checked & restocked", room: "General" },
  { label: "Photos uploaded", room: "General" },
];

const INVENTORY = [
  { name: "Toilet paper", category: "Bathroom", unit: "rolls" },
  { name: "Soap", category: "Bathroom", unit: "bottles" },
  { name: "Shampoo", category: "Bathroom", unit: "bottles" },
  { name: "Coffee", category: "Kitchen", unit: "packs" },
  { name: "Tea", category: "Kitchen", unit: "boxes" },
  { name: "Dishwasher tabs", category: "Kitchen", unit: "tabs" },
  { name: "Trash bags", category: "Cleaning", unit: "rolls" },
  { name: "Towels", category: "Linen", unit: "pcs" },
  { name: "Batteries", category: "Maintenance", unit: "pcs" },
  { name: "Light bulbs", category: "Maintenance", unit: "pcs" },
];

interface PropertyInput {
  name: string;
  publicName: string;
  slug: string;
  city: string;
  address: string;
  postal: string;
  cover: string;
  wifi: { name: string; pass: string };
  parking: string;
  locales: Locale[];
}

function sectionContent(slug: string, p: PropertyInput): { title: string; short: string; content: string; type: string; icon: string } {
  const map: Record<string, { title: string; short: string; content: string; type: string; icon: string }> = {
    welcome: { title: "Welcome", short: "We're glad you're here", type: "WELCOME", icon: "Hand", content: `Welcome to **${p.publicName}**! We've put together everything you need for a smooth stay. Use the search bar or ask the assistant anytime.` },
    "check-in": { title: "Check-in", short: "Self check-in from 3pm", type: "CHECK_IN", icon: "LogIn", content: `Check-in is from **15:00**. Self check-in via the keybox next to the main door at ${p.address}, ${p.city}. See the keybox section for the code and a short video.` },
    parking: { title: "Parking", short: "Where to leave your car", type: "PARKING", icon: "ParkingCircle", content: p.parking },
    keybox: { title: "Keybox", short: "Getting your keys", type: "KEYBOX", icon: "KeyRound", content: "The keybox is to the right of the main door. Enter your code, then slide the cover down. Watch the short video for help." },
    wifi: { title: "WiFi", short: "Get online", type: "WIFI", icon: "Wifi", content: `Connect to **${p.wifi.name}**.\n\nPassword: **${p.wifi.pass}**\n\nWiFi covers the whole apartment.` },
    heating: { title: "Heating", short: "Stay warm", type: "HEATING", icon: "Thermometer", content: "The thermostat is on the hallway wall. Turn the dial to your preferred temperature — it takes ~20 minutes to warm up. Please don't open windows while heating." },
    trash: { title: "Trash & recycling", short: "How we separate waste", type: "TRASH", icon: "Trash2", content: "Tirol separates waste: **Restmüll** (grey), **Bio** (brown), **Papier** (red), **Plastik/Metall** (yellow), **Glas** (containers outside). Bins are in the courtyard." },
    checkout: { title: "Checkout", short: "Before you leave", type: "CHECKOUT", icon: "LogOut", content: "Checkout is by **10:00**. Please: load & start the dishwasher, take out the trash, close the windows, and drop the keys back in the keybox. Safe travels!" },
    recommendations: { title: "Local recommendations", short: "Our favourite spots", type: "LOCAL_RECOMMENDATIONS", icon: "Sparkles", content: "Browse our hand-picked restaurants, supermarkets and activities in the recommendations tab." },
  };
  return map[slug];
}

async function createProperty(orgId: string, p: PropertyInput) {
  const slugs = ["welcome", "check-in", "parking", "keybox", "wifi", "heating", "trash", "checkout", "recommendations"];
  const property = await db.property.create({
    data: {
      organizationId: orgId,
      name: p.name,
      publicName: p.publicName,
      slug: p.slug,
      addressLine: p.address,
      city: p.city,
      country: "Austria",
      postalCode: p.postal,
      timezone: "Europe/Vienna",
      maxGuests: 4,
      baseLocale: "EN",
      supportedLocales: p.locales,
      hostName: "Anna Gruber",
      hostEmail: "owner@demo-tirol.test",
      hostPhone: "+43 660 1234567",
      emergencyContacts: [
        { label: "Host (Anna)", phone: "+43 660 1234567" },
        { label: "European emergency", phone: "112" },
      ],
      wifiName: p.wifi.name,
      wifiPassword: p.wifi.pass,
      parkingInfo: p.parking,
      houseRules: "No smoking indoors. No parties. Quiet hours 22:00–07:00.",
      quietHoursFrom: "22:00",
      quietHoursTo: "07:00",
      coverImageUrl: p.cover,
      isPublished: true,
      aiEnabled: true,
      sections: {
        create: slugs.map((slug, i) => {
          const c = sectionContent(slug, p);
          return {
            type: c.type as never,
            slug,
            title: c.title,
            shortDescription: c.short,
            content: c.content,
            icon: c.icon,
            order: i,
          };
        }),
      },
      inventoryItems: {
        create: INVENTORY.map((it, i) => ({
          name: it.name,
          category: it.category,
          unit: it.unit,
          quantity: [2, 0, 5, 1][i % 4],
          threshold: 2,
          currentStatus: (["OK", "EMPTY", "OK", "LOW"] as const)[i % 4],
        })),
      },
      recommendations: {
        create: [
          { category: "RESTAURANT", title: "Die Wilderin", description: "Seasonal regional cooking, great atmosphere.", address: `${p.city}`, order: 0 },
          { category: "BREAKFAST", title: "Café Munding", description: "Austria's oldest café-konditorei. Try the strudel.", order: 1 },
          { category: "SUPERMARKET", title: "MPREIS", description: "Closest supermarket, 5 min walk.", order: 2 },
          { category: "SKI_RENTAL", title: "Sport Okay", description: "Ski & boot rental, friendly staff.", order: 3 },
          { category: "PHARMACY", title: "Stadt-Apotheke", description: "Open Mon–Sat. Closest pharmacy.", order: 4 },
        ],
      },
    },
  });
  return property;
}

main()
  .then(async () => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
