import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import FreeSpot from "../models/free-spot.model";

type UploadedFile = { buffer: Buffer };
type UploadedFiles = { [key: string]: UploadedFile[] };

export class FreeSpotService {
  private uploadBufferToCloudinary = (buffer: Buffer): Promise<any> => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "free-spots", resource_type: "image" },
        (error: any, result: any) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  };

  async createSpot(
    userId: string,
    input: {
      title: string;
      description: string;
      address: string;
      city: string;
      province?: string;
      latitude: number;
      longitude: number;
      directions?: string;
      terrain?: string;
      amenities?: string[];
    },
    files?: UploadedFiles
  ): Promise<any> {
    const {
      title,
      description,
      address,
      city,
      province,
      latitude,
      longitude,
      directions,
      terrain,
      amenities,
    } = input;

    // Upload images
    let images: string[] = [];
    if (files?.images) {
      for (const file of files.images) {
        const result = await this.uploadBufferToCloudinary(file.buffer);
        images.push(result.secure_url);
      }
    }

    const spot = new FreeSpot({
      title,
      description,
      address,
      city,
      province,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      images,
      directions,
      terrain: terrain || "other",
      amenities: amenities || [],
      author: userId,
    });

    await spot.save();
    await spot.populate("author", "username avatarUrl");
    return spot;
  }

  async getSpots(params: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    terrain?: string;
    author?: string;
    status?: string;
  }): Promise<{ spots: any[]; total: number; currentPage: number }> {
    const { page = 1, limit = 20, search, city, terrain, author, status } = params;
    const skip = (page - 1) * limit;

    const query: any = author ? {} : { status: "active" };
    if (status) query.status = status;
    else if (!author) query.status = "active";

    if (author) query.author = author;
    if (city) query.city = { $regex: city, $options: "i" };
    if (terrain) query.terrain = terrain;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const [spots, total] = await Promise.all([
      FreeSpot.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username avatarUrl"),
      FreeSpot.countDocuments(query),
    ]);

    return { spots, total, currentPage: page };
  }

  async getNearby(
    lat: number,
    lng: number,
    radiusKm: number = 50
  ): Promise<any[]> {
    const spots = await FreeSpot.find({
      status: "active",
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    })
      .limit(30)
      .populate("author", "username avatarUrl");
    return spots;
  }

  private async findSpotByIdOrSlug(idOrSlug: string): Promise<any> {
    return await FreeSpot.findOne({
      $or: [{ _id: idOrSlug.match(/^[a-f\d]{24}$/i) ? idOrSlug : null }, { slug: idOrSlug }]
    });
  }

  async getSpotById(id: string): Promise<any> {
    const spot = await FreeSpot.findOne({
      $or: [{ _id: id.match(/^[a-f\d]{24}$/i) ? id : null }, { slug: id }],
      status: { $ne: "hidden" },
    }).populate("author", "username avatarUrl");

    if (!spot) throw new Error("Địa điểm không tồn tại");

    console.log("FETCHED SPOT:", spot.title, "likes count:", spot.likes?.length, "likes array:", spot.likes);

    // Atomically increment viewCount in the database without saving the whole document
    await FreeSpot.updateOne({ _id: spot._id }, { $inc: { viewCount: 1 } });
    spot.viewCount = ((spot.viewCount as number) || 0) + 1;

    return spot;
  }

  async toggleLike(
    spotId: string,
    userId: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    const spot = await this.findSpotByIdOrSlug(spotId);
    if (!spot) throw new Error("Địa điểm không tồn tại");

    const alreadyLiked = spot.likes?.some(
      (id: any) => id && id.toString() === userId
    );

    console.log("TOGGLE LIKE - spot:", spot.title, "user:", userId, "alreadyLiked:", alreadyLiked, "current likes:", spot.likes);

    const update = alreadyLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updated = await FreeSpot.findByIdAndUpdate(spot._id, update, {
      new: true,
    });
    const newCount = updated?.likes?.length ?? 0;
    await FreeSpot.updateOne({ _id: spot._id }, { likeCount: newCount });

    console.log("TOGGLE LIKE - updated likes count:", newCount, "updated likes array:", updated?.likes);

    return { liked: !alreadyLiked, likeCount: newCount };
  }

  async updateSpot(
    spotId: string,
    userId: string,
    input: {
      title?: string;
      description?: string;
      address?: string;
      city?: string;
      province?: string;
      latitude?: number;
      longitude?: number;
      directions?: string;
      terrain?: string;
      amenities?: string[];
    },
    files?: { [key: string]: { buffer: Buffer }[] }
  ): Promise<any> {
    const spot = await this.findSpotByIdOrSlug(spotId);
    if (!spot) throw new Error("Địa điểm không tồn tại");
    if (spot.author?.toString() !== userId)
      throw new Error("Không có quyền chỉnh sửa");

    const { title, description, address, city, province, latitude, longitude, directions, terrain, amenities } = input;

    if (title) spot.title = title;
    if (description) spot.description = description;
    if (address) spot.address = address;
    if (city) spot.city = city;
    if (province !== undefined) spot.province = province;
    if (directions !== undefined) spot.directions = directions;
    if (terrain) spot.terrain = terrain as any;
    if (amenities) spot.amenities = amenities as any;
    if (latitude && longitude) {
      spot.location = { type: "Point", coordinates: [longitude, latitude] } as any;
    }

    // Upload new images if provided
    if (files?.images && files.images.length > 0) {
      const newImages: string[] = [];
      for (const file of files.images) {
        const result = await this.uploadBufferToCloudinary(file.buffer);
        newImages.push(result.secure_url);
      }
      spot.images = newImages as any;
    }

    spot.updatedAt = new Date();
    await spot.save();
    await spot.populate("author", "username avatarUrl");
    return spot;
  }

  async deleteSpot(spotId: string, userId: string): Promise<void> {
    const spot = await this.findSpotByIdOrSlug(spotId);
    if (!spot) throw new Error("Địa điểm không tồn tại");
    if (spot.author?.toString() !== userId)
      throw new Error("Không có quyền xóa");
    await spot.deleteOne();
  }

  async addComment(
    spotId: string,
    userId: string,
    content: string
  ): Promise<any> {
    const spot = await this.findSpotByIdOrSlug(spotId);
    if (!spot) throw new Error("Địa điểm không tồn tại");

    const comment = { user: userId, content, createdAt: new Date() };

    const updated = await FreeSpot.findByIdAndUpdate(
      spot._id,
      {
        $push: { comments: comment },
        $inc: { commentCount: 1 }
      },
      { new: true }
    ).populate("comments.user", "username avatarUrl");

    if (!updated) throw new Error("Không thể thêm bình luận");

    // Return the last added comment
    const saved = updated.comments[updated.comments.length - 1];
    return saved;
  }
}
