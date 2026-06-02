import { ErrorFactory } from "@/errors";
import { PropertyModel, SiteModel, type SiteDocument } from "@/models";
import appAssert from "@/utils/app-assert";
import type { CreateSiteInput } from "@/validators/site.validator";
import mongoose from "mongoose";

export class SiteBulkService {
  /**
   * Create undesignated site group (bulk create)
   * Host điền 1 form → backend tạo nhiều sites cùng config
   */
  async createUndesignatedGroup(
    hostId: string,
    input: CreateSiteInput & { numberOfSites: number }
  ): Promise<{
    groupId: mongoose.Types.ObjectId;
    sites: SiteDocument[];
    totalCreated: number;
  }> {
    const { property: propertyId, numberOfSites, ...siteConfig } = input;

    // Validate numberOfSites
    appAssert(
      numberOfSites >= 1 && numberOfSites <= 100,
      ErrorFactory.badRequest("Số lượng sites phải từ 1-100")
    );

    // Verify property exists and belongs to host
    const property = await PropertyModel.findById(propertyId);
    appAssert(property, ErrorFactory.resourceNotFound("Property"));
    appAssert(
      property.host.toString() === hostId,
      ErrorFactory.forbidden("Bạn không có quyền thêm site vào property này")
    );

    // Force siteType to undesignated
    appAssert(
      (siteConfig as any).siteType === "undesignated",
      ErrorFactory.badRequest("Phương thức này chỉ dành cho undesignated sites")
    );

    // Generate unique groupId for this group
    const groupId = new mongoose.Types.ObjectId();

    // Prepare bulk site data
    const sitesData = [];
    for (let i = 1; i <= numberOfSites; i++) {
      // Generate unique slug for each site
      const baseSlug = this.generateSlug(siteConfig.name);
      const slug = `${baseSlug}-site-${i}`;

      // Check duplicate slug
      const existingSite = await SiteModel.findOne({ property: propertyId, slug });
      appAssert(!existingSite, ErrorFactory.conflict(`Slug ${slug} đã tồn tại`));

      sitesData.push({
        ...siteConfig,
        name: `${siteConfig.name} - Site ${i}`,
        slug,
        property: propertyId,
        siteType: "undesignated",
        groupedSiteInfo: {
          isGrouped: true,
          groupId,
          totalSitesInGroup: numberOfSites,
        },
      });
    }

    // Bulk insert all sites
    const createdSites = await SiteModel.insertMany(sitesData);

    // Update property's totalSites count
    await PropertyModel.findByIdAndUpdate(propertyId, {
      $inc: { totalSites: numberOfSites },
    });

    return {
      groupId,
      sites: createdSites as unknown as SiteDocument[],
      totalCreated: createdSites.length,
    };
  }

  /**
   * Update all sites in undesignated group
   * Host sửa 1 lần → tất cả sites trong group được update
   */
  async updateUndesignatedGroup(
    hostId: string,
    groupId: string,
    updates: Partial<CreateSiteInput>
  ): Promise<{
    modifiedCount: number;
    sites: SiteDocument[];
  }> {
    // Get all sites in group
    const sitesInGroup = await SiteModel.find({
      "groupedSiteInfo.groupId": groupId,
      "groupedSiteInfo.isGrouped": true,
    }).populate("property");

    appAssert(sitesInGroup.length > 0, ErrorFactory.resourceNotFound("Undesignated group"));

    // Verify ownership (check first site's property)
    const property = sitesInGroup[0]!.property as any;
    appAssert(
      property.host.toString() === hostId,
      ErrorFactory.forbidden("Bạn không có quyền chỉnh sửa group này")
    );

    // Update all sites in group
    const updateResult = await SiteModel.updateMany(
      {
        "groupedSiteInfo.groupId": groupId,
        "groupedSiteInfo.isGrouped": true,
      },
      { $set: updates }
    );

    // Fetch updated sites
    const updatedSites = await SiteModel.find({
      "groupedSiteInfo.groupId": groupId,
      "groupedSiteInfo.isGrouped": true,
    });

    return {
      modifiedCount: updateResult.modifiedCount,
      sites: updatedSites,
    };
  }

  /**
   * Delete undesignated group (soft delete all sites in group)
   */
  async deleteUndesignatedGroup(
    hostId: string,
    groupId: string
  ): Promise<{
    deletedCount: number;
  }> {
    // Get all sites in group
    const sitesInGroup = await SiteModel.find({
      "groupedSiteInfo.groupId": groupId,
      "groupedSiteInfo.isGrouped": true,
    }).populate("property");

    appAssert(sitesInGroup.length > 0, ErrorFactory.resourceNotFound("Undesignated group"));

    // Verify ownership
    const property = sitesInGroup[0]!.property as any;
    appAssert(
      property.host.toString() === hostId,
      ErrorFactory.forbidden("Bạn không có quyền xóa group này")
    );

    // Soft delete all sites (deactivate)
    await Promise.all(sitesInGroup.map((site) => site.deactivate()));

    // Update property's totalSites count
    await PropertyModel.findByIdAndUpdate(property._id, {
      $inc: { totalSites: -sitesInGroup.length },
    });

    return {
      deletedCount: sitesInGroup.length,
    };
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 200);
  }
}

export default new SiteBulkService();
