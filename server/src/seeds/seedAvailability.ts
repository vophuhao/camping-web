import "dotenv/config";

import { MONGO_URI } from "../constants/env";
import { AvailabilityModel, PropertyModel, SiteModel } from "@/models";
import mongoose from "mongoose";

/**
 * Seed Availability data for testing calendar blocking
 * - Blocks specific dates for both designated and undesignated sites
 * - Creates various block types (booked, blocked, maintenance)
 */

async function seedAvailability() {
  try {
    console.log("🌱 Starting Availability Seeding...");

    // Connect to database
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing availability data
    await AvailabilityModel.deleteMany({});
    console.log("🗑️  Cleared existing availability data");

    // Find designated property (Tam Đảo Eco Camp)
    const designatedProperty = await PropertyModel.findOne({
      name: { $regex: /Tam Đảo/i },
    }).lean();

    if (!designatedProperty) {
      throw new Error("❌ Designated property not found. Run seedHipcamp first!");
    }

    // Find undesignated property (Pine Forest)
    const undesignatedProperty = await PropertyModel.findOne({
      name: { $regex: /Pine Forest/i },
    }).lean();

    if (!undesignatedProperty) {
      throw new Error("❌ Undesignated property not found. Run seedHipcamp first!");
    }

    // Find small undesignated property (Lakeside Retreat) - for easy testing
    const smallUndesignatedProperty = await PropertyModel.findOne({
      name: { $regex: /Lakeside Retreat/i },
    }).lean();

    if (!smallUndesignatedProperty) {
      throw new Error("❌ Small undesignated property not found. Run seedHipcamp first!");
    }

    console.log(`\n📍 Found designated property: ${designatedProperty.name}`);
    console.log(`📍 Found undesignated property (large): ${undesignatedProperty.name}`);
    console.log(`📍 Found undesignated property (small): ${smallUndesignatedProperty.name}`);

    // Get sites for each property
    const designatedSites = await SiteModel.find({
      property: designatedProperty._id,
      siteType: "designated",
      isActive: true,
    })
      .limit(2)
      .lean();

    const undesignatedSites = await SiteModel.find({
      property: undesignatedProperty._id,
      siteType: "undesignated",
      isActive: true,
    })
      .limit(5)
      .lean();

    const smallUndesignatedSites = await SiteModel.find({
      property: smallUndesignatedProperty._id,
      siteType: "undesignated",
      isActive: true,
    }).lean(); // Get all 2 sites

    if (designatedSites.length === 0) {
      throw new Error("❌ No designated sites found!");
    }

    if (undesignatedSites.length === 0) {
      throw new Error("❌ No undesignated sites found!");
    }

    if (smallUndesignatedSites.length === 0) {
      throw new Error("❌ No small undesignated sites found!");
    }

    console.log(`\n🏕️  Found ${designatedSites.length} designated sites`);
    console.log(`🏕️  Found ${undesignatedSites.length} large undesignated sites`);
    console.log(`🏕️  Found ${smallUndesignatedSites.length} small undesignated sites`);

    // Helper function to create date range
    const createDateRange = (startDaysFromNow: number, numberOfDays: number): Date[] => {
      const dates: Date[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = startDaysFromNow; i < startDaysFromNow + numberOfDays; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
      return dates;
    };

    const availabilityRecords: any[] = [];

    // ===== DESIGNATED SITES AVAILABILITY =====
    console.log("\n🗓️  Creating availability for DESIGNATED sites...");

    designatedSites.forEach((site, index) => {
      console.log(`   Site ${index + 1}: ${site.name}`);

      // Block dates 5-7 days from now (booked)
      const bookedDates = createDateRange(5, 3);
      bookedDates.forEach((date) => {
        availabilityRecords.push({
          site: site._id,
          date,
          isAvailable: false,
          blockType: "booked",
          reason: "Đã có khách đặt chỗ",
        });
      });

      // Block dates 12-14 days from now (maintenance)
      const maintenanceDates = createDateRange(12, 3);
      maintenanceDates.forEach((date) => {
        availabilityRecords.push({
          site: site._id,
          date,
          isAvailable: false,
          blockType: "maintenance",
          reason: "Bảo trì định kỳ",
        });
      });

      // Block dates 20-25 days from now (blocked by host)
      const blockedDates = createDateRange(20, 6);
      blockedDates.forEach((date) => {
        availabilityRecords.push({
          site: site._id,
          date,
          isAvailable: false,
          blockType: "blocked",
          reason: "Chủ nhà tạm khóa lịch",
        });
      });

      // Block some weekend dates (30-35 days) with higher price
      const weekendDates = createDateRange(30, 2); // Sat-Sun
      weekendDates.forEach((date) => {
        availabilityRecords.push({
          site: site._id,
          date,
          isAvailable: false,
          blockType: "booked",
          reason: "Đã đặt trước cho cuối tuần",
          price: site.pricing.basePrice * 1.5, // 50% markup
        });
      });
    });

    // ===== UNDESIGNATED SITES AVAILABILITY =====
    console.log("\n🗓️  Creating availability for UNDESIGNATED sites...");

    undesignatedSites.forEach((site, index) => {
      console.log(`   Site ${index + 1}: ${site.name}`);

      // Block dates 3-5 days from now (booked)
      const bookedDates = createDateRange(3, 3);
      bookedDates.forEach((date) => {
        availabilityRecords.push({
          site: site._id,
          date,
          isAvailable: false,
          blockType: "booked",
          reason: "Site đã được đặt",
        });
      });

      // Block different dates for different sites to show auto-assignment logic
      // Site 1: block 10-12
      // Site 2: block 11-13
      // Site 3: block 12-14
      const offset = index * 1; // Stagger blocking
      const staggeredDates = createDateRange(10 + offset, 3);
      staggeredDates.forEach((date) => {
        availabilityRecords.push({
          site: site._id,
          date,
          isAvailable: false,
          blockType: "booked",
          reason: `Site ${index + 1} đã được đặt`,
        });
      });

      // Block seasonal dates (60-90 days) - summer season
      if (index < 3) {
        // Only block first 3 sites
        const seasonalDates = createDateRange(60, 30);
        seasonalDates.forEach((date) => {
          availabilityRecords.push({
            site: site._id,
            date,
            isAvailable: false,
            blockType: "seasonal",
            reason: "Mùa cao điểm - đã full",
          });
        });
      }
    });

    // ===== SMALL UNDESIGNATED SITES AVAILABILITY (2 sites) =====
    console.log(
      "\n🗓️  Creating availability for SMALL UNDESIGNATED sites (2 sites for easy testing)..."
    );

    // Block BOTH sites on days 7-9 (all sites blocked = calendar disabled)
    smallUndesignatedSites.forEach((site, index) => {
      console.log(`   Site ${index + 1}: ${site.name}`);

      // Block days 7-9 for BOTH sites
      const allBlockedDates = createDateRange(7, 3);
      allBlockedDates.forEach((date) => {
        availabilityRecords.push({
          site: site._id,
          date,
          isAvailable: false,
          blockType: "booked",
          reason: "Cả 2 site đều đã đặt - Calendar sẽ disabled",
        });
      });
    });

    // Block ONLY site 1 on days 15-17 (1 site blocked, 1 available = calendar still selectable)
    if (smallUndesignatedSites.length > 0 && smallUndesignatedSites[0]) {
      const blockedOneSiteDates = createDateRange(15, 3);
      blockedOneSiteDates.forEach((date) => {
        availabilityRecords.push({
          site: smallUndesignatedSites[0]!._id,
          date,
          isAvailable: false,
          blockType: "booked",
          reason: "Chỉ site 1 blocked, site 2 vẫn available - Calendar vẫn chọn được",
        });
      });
    }

    console.log("   ℹ️  Days 7-9: BOTH sites blocked → Calendar DISABLED");
    console.log("   ℹ️  Days 15-17: Only site 1 blocked → Calendar SELECTABLE");

    // Insert all availability records
    if (availabilityRecords.length > 0) {
      await AvailabilityModel.insertMany(availabilityRecords);
      console.log(`\n✅ Created ${availabilityRecords.length} availability records`);
    }

    // Summary
    console.log("\n📊 SUMMARY:");
    console.log("─────────────────────────────────────");

    const designatedBlocked = availabilityRecords.filter((r) =>
      designatedSites.some((s) => s._id.toString() === r.site.toString())
    );
    const undesignatedBlocked = availabilityRecords.filter((r) =>
      undesignatedSites.some((s) => s._id.toString() === r.site.toString())
    );
    const smallUndesignatedBlocked = availabilityRecords.filter((r) =>
      smallUndesignatedSites.some((s) => s._id.toString() === r.site.toString())
    );

    console.log(`📍 Designated Property: ${designatedProperty.name}`);
    console.log(`   - Sites: ${designatedSites.length}`);
    console.log(`   - Blocked dates: ${designatedBlocked.length}`);
    designatedSites.forEach((site) => {
      const siteBlocked = designatedBlocked.filter(
        (r) => r.site.toString() === site._id.toString()
      );
      console.log(`   - ${site.name}: ${siteBlocked.length} blocked dates`);
    });

    console.log(`\n📍 Undesignated Property: ${undesignatedProperty.name}`);
    console.log(`   - Sites: ${undesignatedSites.length}`);
    console.log(`   - Blocked dates: ${undesignatedBlocked.length}`);
    undesignatedSites.forEach((site) => {
      const siteBlocked = undesignatedBlocked.filter(
        (r) => r.site.toString() === site._id.toString()
      );
      console.log(`   - ${site.name}: ${siteBlocked.length} blocked dates`);
    });

    console.log(`\n📍 Small Undesignated Property (TEST): ${smallUndesignatedProperty.name}`);
    console.log(`   - Sites: ${smallUndesignatedSites.length}`);
    console.log(`   - Blocked dates: ${smallUndesignatedBlocked.length}`);
    smallUndesignatedSites.forEach((site) => {
      const siteBlocked = smallUndesignatedBlocked.filter(
        (r) => r.site.toString() === site._id.toString()
      );
      console.log(`   - ${site.name}: ${siteBlocked.length} blocked dates`);
    });

    console.log("\n🎯 Testing Instructions:");
    console.log("─────────────────────────────────────");
    console.log("1. Go to designated property page:");
    console.log(`   /land/${designatedProperty.slug}`);
    console.log("   - Calendar should show blocked dates:");
    console.log("   - Days 5-7 (booked)");
    console.log("   - Days 12-14 (maintenance)");
    console.log("   - Days 20-25 (blocked)");
    console.log("   - Days 30-31 (booked weekend)");

    console.log("\n2. Go to undesignated property page:");
    console.log(`   /land/${undesignatedProperty.slug}`);
    console.log("   - Calendar should show blocked dates:");
    console.log("   - Days 3-5 (booked)");
    console.log("   - Days 10-15 (staggered across sites)");
    console.log("   - Days 60-90 (seasonal, first 3 sites)");

    console.log("\n3. Go to SMALL undesignated property (BEST FOR TESTING):");
    console.log(`   /land/${smallUndesignatedProperty.slug}`);
    console.log("   ✅ Days 7-9: BOTH sites blocked → Calendar DISABLED");
    console.log("   ✅ Days 15-17: Only site 1 blocked → Calendar SELECTABLE (site 2 available)");
    console.log("   - This demonstrates the intersection logic perfectly!");

    console.log("\n4. Try booking:");
    console.log("   - Select available dates");
    console.log("   - Blocked dates should be disabled (strikethrough)");
    console.log("   - For undesignated: available site auto-assigned");

    console.log("\n✨ Availability seeding completed!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding availability:", error);
    process.exit(1);
  }
}

// Run the seed function
seedAvailability();
