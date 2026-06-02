import "dotenv/config";

import { MONGO_URI } from "../constants/env";
import {
  AmenityModel,
  AvailabilityModel,
  BookingModel,
  PropertyModel,
  ReviewModel,
  SiteModel,
  UserModel,
} from "@/models";
import { hashValue } from "@/utils/bcrypt";
import mongoose from "mongoose";

// ===== AMENITIES DATA =====
const amenities = [
  // Basic
  { name: "Điện", description: "Có nguồn điện", icon: "⚡", category: "basic" },
  { name: "Nước", description: "Nước sạch", icon: "💧", category: "basic" },
  { name: "Toilet", description: "Nhà vệ sinh", icon: "🚽", category: "basic" },
  { name: "Tắm nước nóng", description: "Vòi sen nước nóng", icon: "🚿", category: "basic" },
  { name: "Bãi đỗ xe", description: "Chỗ đậu xe", icon: "🅿️", category: "basic" },
  { name: "Wifi", description: "Internet không dây", icon: "📶", category: "basic" },

  // Comfort
  { name: "Điều hòa", description: "Máy lạnh/sưởi", icon: "❄️", category: "comfort" },
  { name: "Quạt", description: "Quạt máy", icon: "🌀", category: "comfort" },
  { name: "Giường ngủ", description: "Giường/đệm", icon: "🛏️", category: "comfort" },
  { name: "Bếp", description: "Bếp nấu ăn", icon: "🍳", category: "comfort" },
  { name: "Tủ lạnh", description: "Tủ lạnh mini", icon: "🧊", category: "comfort" },
  { name: "Bàn ghế", description: "Bàn ghế ngồi", icon: "🪑", category: "comfort" },
  { name: "Lò sưởi", description: "Lò sưởi trong nhà", icon: "🔥", category: "comfort" },

  // Safety
  { name: "Bộ cứu thương", description: "Hộp sơ cứu", icon: "🏥", category: "safety" },
  { name: "Bình cứu hỏa", description: "Thiết bị chữa cháy", icon: "🧯", category: "safety" },
  { name: "Đèn pin", description: "Đèn chiếu sáng dự phòng", icon: "🔦", category: "safety" },
  { name: "Khóa an toàn", description: "Khóa cửa an toàn", icon: "🔒", category: "safety" },

  // Outdoor
  { name: "Lò nướng BBQ", description: "Bếp nướng ngoài trời", icon: "🔥", category: "outdoor" },
  {
    name: "Bàn ghế ngoài trời",
    description: "Khu vực ngồi ngoài trời",
    icon: "🏕️",
    category: "outdoor",
  },
  { name: "Võng", description: "Võng xích đu", icon: "🌴", category: "outdoor" },
  { name: "Lửa trại", description: "Chỗ đốt lửa trại", icon: "🔥", category: "outdoor" },
  { name: "View núi", description: "Tầm nhìn ra núi", icon: "⛰️", category: "outdoor" },
  { name: "View biển", description: "Tầm nhìn ra biển", icon: "🌊", category: "outdoor" },
  { name: "View hồ", description: "Tầm nhìn ra hồ", icon: "🏞️", category: "outdoor" },

  // Special
  { name: "Cho phép thú cưng", description: "Chấp nhận thú cưng", icon: "🐕", category: "special" },
  { name: "Phù hợp trẻ em", description: "An toàn cho trẻ em", icon: "👶", category: "special" },
  {
    name: "Khu vực riêng tư",
    description: "Không gian riêng biệt",
    icon: "🔐",
    category: "special",
  },
  { name: "Hồ bơi", description: "Bể bơi", icon: "🏊", category: "special" },
  { name: "Spa/Jacuzzi", description: "Bồn tắm nước nóng", icon: "♨️", category: "special" },
];

// ===== USERS DATA =====
const users = [
  // Admin
  {
    name: "Admin",
    username: "admin",
    email: "admin@hipcamp.vn",
    password: "Admin@123",
    role: "admin",
    isVerified: true,
  },
  // Hosts
  {
    name: "Nguyễn Văn Anh",
    username: "nguyenvananh",
    email: "host1@hipcamp.vn",
    password: "Host@123",
    role: "user",
    isVerified: true,
    phone: "0901234567",
  },
  {
    name: "Trần Thị Bình",
    username: "tranthibinh",
    email: "host2@hipcamp.vn",
    password: "Host@123",
    role: "user",
    isVerified: true,
    phone: "0901234568",
  },
  {
    name: "Lê Minh Châu",
    username: "leminhchau",
    email: "host3@hipcamp.vn",
    password: "Host@123",
    role: "user",
    isVerified: true,
    phone: "0901234569",
  },
  {
    name: "Phạm Văn Dũng",
    username: "phamvandung",
    email: "host4@hipcamp.vn",
    password: "Host@123",
    role: "user",
    isVerified: true,
    phone: "0901234570",
  },
  // Guests
  {
    name: "Hoàng Thị Mai",
    username: "hoangthimai",
    email: "guest1@hipcamp.vn",
    password: "Guest@123",
    role: "user",
    isVerified: true,
    phone: "0902234567",
  },
  {
    name: "Đỗ Văn Nam",
    username: "dovannam",
    email: "guest2@hipcamp.vn",
    password: "Guest@123",
    role: "user",
    isVerified: true,
    phone: "0902234568",
  },
  {
    name: "Vũ Thị Oanh",
    username: "vuthioanh",
    email: "guest3@hipcamp.vn",
    password: "Guest@123",
    role: "user",
    isVerified: true,
    phone: "0902234569",
  },
];

// ===== CAMPSITES DATA =====
const campsitesData = [
  {
    name: "Mountain View Glamping Đà Lạt",
    slug: "mountain-view-glamping-da-lat",
    tagline: "Cắm trại sang trọng giữa núi rừng Đà Lạt",
    description:
      "Trải nghiệm cắm trại cao cấp với lều glamping được trang bị đầy đủ tiện nghi, tầm nhìn tuyệt đẹp ra thung lũng và núi rừng Đà Lạt. Nơi đây hoàn hảo cho những ai muốn kết nối với thiên nhiên mà vẫn tận hưởng sự thoải mái.",
    location: {
      address: "123 Đường Trần Phú",
      city: "Đà Lạt",
      state: "Lâm Đồng",
      country: "Vietnam",
      zipCode: "670000",
      coordinates: { lat: 11.9404, lng: 108.4583 },
    },
    propertyType: "glamping",
    capacity: { maxGuests: 4, maxVehicles: 2, maxPets: 1 },
    pricing: {
      basePrice: 800000,
      weekendPrice: 1200000,
      cleaningFee: 150000,
      petFee: 100000,
      extraGuestFee: 150000,
    },
    rules: {
      checkIn: "14:00",
      checkOut: "11:00",
      minNights: 1,
      maxNights: 14,
      allowPets: true,
      allowChildren: true,
      allowSmoking: false,
      allowEvents: false,
      quietHours: "22:00 - 07:00",
    },
    images: [
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d",
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4",
      "https://images.unsplash.com/photo-1445308394109-4ec2920981b1",
    ],
    isInstantBook: true,
    amenityNames: [
      "Điện",
      "Nước",
      "Toilet",
      "Tắm nước nóng",
      "Wifi",
      "Giường ngủ",
      "Lò sưởi",
      "View núi",
    ],
    activityNames: ["Trekking", "Ngắm sao", "Chụp ảnh", "Yoga"],
  },
  {
    name: "Beachside Camping Nha Trang",
    slug: "beachside-camping-nha-trang",
    tagline: "Cắm trại bên bờ biển xanh ngắt",
    description:
      "Thức dậy với tiếng sóng biển, tận hưởng bình minh tuyệt đẹp và làn nước trong xanh của biển Nha Trang. Khu cắm trại với các lều trại tiện nghi, phù hợp cho gia đình và nhóm bạn.",
    location: {
      address: "456 Đường Trần Phú",
      city: "Nha Trang",
      state: "Khánh Hòa",
      country: "Vietnam",
      zipCode: "650000",
      coordinates: { lat: 12.2388, lng: 109.1967 },
    },
    propertyType: "tent",
    capacity: { maxGuests: 6, maxVehicles: 3, maxPets: 2 },
    pricing: {
      basePrice: 500000,
      weekendPrice: 700000,
      cleaningFee: 100000,
      petFee: 80000,
      extraGuestFee: 100000,
    },
    rules: {
      checkIn: "13:00",
      checkOut: "12:00",
      minNights: 1,
      maxNights: 7,
      allowPets: true,
      allowChildren: true,
      allowSmoking: true,
      allowEvents: true,
      quietHours: "23:00 - 06:00",
    },
    images: [
      "https://images.unsplash.com/photo-1504851149312-7a075b496cc7",
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57",
    ],
    isInstantBook: false,
    amenityNames: [
      "Điện",
      "Nước",
      "Toilet",
      "Tắm nước nóng",
      "Bãi đỗ xe",
      "Lò nướng BBQ",
      "View biển",
    ],
    activityNames: ["Bơi lội", "Câu cá", "Lặn biển", "Chụp ảnh"],
  },
  {
    name: "Forest Cabin Sapa",
    slug: "forest-cabin-sapa",
    tagline: "Nhà gỗ giữa rừng thông Sapa",
    description:
      "Ngôi nhà gỗ ấm cúng nằm giữa rừng thông, view ruộng bậc thang tuyệt đẹp. Lý tưởng cho những ai muốn trốn khỏi thành phố và tận hưởng không khí trong lành của núi rừng Sapa.",
    location: {
      address: "789 Thôn Tả Van",
      city: "Sapa",
      state: "Lào Cai",
      country: "Vietnam",
      zipCode: "330000",
      coordinates: { lat: 22.3364, lng: 103.8438 },
    },
    propertyType: "cabin",
    capacity: { maxGuests: 5, maxVehicles: 2, maxPets: 0 },
    pricing: {
      basePrice: 1000000,
      weekendPrice: 1500000,
      cleaningFee: 200000,
      petFee: 0,
      extraGuestFee: 200000,
    },
    rules: {
      checkIn: "14:00",
      checkOut: "11:00",
      minNights: 2,
      maxNights: 10,
      allowPets: false,
      allowChildren: true,
      allowSmoking: false,
      allowEvents: false,
      quietHours: "22:00 - 07:00",
    },
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
    ],
    isInstantBook: true,
    amenityNames: [
      "Điện",
      "Nước",
      "Toilet",
      "Tắm nước nóng",
      "Bếp",
      "Tủ lạnh",
      "Lò sưởi",
      "View núi",
    ],
    activityNames: ["Trekking", "Leo núi", "Ngắm chim", "Văn hóa địa phương", "Chụp ảnh"],
  },
  {
    name: "Lakeside RV Park Đại Lải",
    slug: "lakeside-rv-park-dai-lai",
    tagline: "Khu cắm trại xe RV bên hồ Đại Lải",
    description:
      "Khu cắm trại dành cho xe RV/caravan với đầy đủ tiện nghi, view hồ Đại Lải tuyệt đẹp. Có khu vực BBQ, vui chơi cho trẻ em và nhiều hoạt động thể thao nước.",
    location: {
      address: "Hồ Đại Lải",
      city: "Phúc Yên",
      state: "Vĩnh Phúc",
      country: "Vietnam",
      zipCode: "280000",
      coordinates: { lat: 21.2833, lng: 105.55 },
    },
    propertyType: "rv",
    capacity: { maxGuests: 8, maxVehicles: 4, maxPets: 3 },
    pricing: {
      basePrice: 600000,
      weekendPrice: 900000,
      cleaningFee: 120000,
      petFee: 100000,
      extraGuestFee: 120000,
    },
    rules: {
      checkIn: "12:00",
      checkOut: "12:00",
      minNights: 1,
      maxNights: 14,
      allowPets: true,
      allowChildren: true,
      allowSmoking: true,
      allowEvents: true,
      quietHours: "23:00 - 07:00",
    },
    images: ["https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7"],
    isInstantBook: true,
    amenityNames: [
      "Điện",
      "Nước",
      "Toilet",
      "Tắm nước nóng",
      "Bãi đỗ xe",
      "Wifi",
      "Lò nướng BBQ",
      "View hồ",
    ],
    activityNames: ["Bơi lội", "Câu cá", "Chèo thuyền", "Xe đạp địa hình"],
  },
  {
    name: "Treehouse Paradise Phú Quốc",
    slug: "treehouse-paradise-phu-quoc",
    tagline: "Nhà trên cây độc đáo giữa rừng nhiệt đới",
    description:
      "Trải nghiệm độc đáo khi ngủ trên cây giữa rừng nhiệt đới Phú Quốc. Nhà trên cây được thiết kế sang trọng với tầm nhìn ra biển, kết hợp hoàn hảo giữa phiêu lưu và thoải mái.",
    location: {
      address: "Rừng quốc gia Phú Quốc",
      city: "Phú Quốc",
      state: "Kiên Giang",
      country: "Vietnam",
      zipCode: "920000",
      coordinates: { lat: 10.2899, lng: 103.984 },
    },
    propertyType: "treehouse",
    capacity: { maxGuests: 3, maxVehicles: 1, maxPets: 0 },
    pricing: {
      basePrice: 1500000,
      weekendPrice: 2000000,
      cleaningFee: 200000,
      petFee: 0,
      extraGuestFee: 300000,
    },
    rules: {
      checkIn: "15:00",
      checkOut: "10:00",
      minNights: 2,
      maxNights: 5,
      allowPets: false,
      allowChildren: false,
      allowSmoking: false,
      allowEvents: false,
      quietHours: "22:00 - 07:00",
    },
    images: ["https://images.unsplash.com/photo-1520520731457-9283dd14aa66"],
    isInstantBook: false,
    amenityNames: ["Điện", "Nước", "Toilet", "Giường ngủ", "Quạt", "Khu vực riêng tư", "View biển"],
    activityNames: ["Ngắm chim", "Ngắm sao", "Yoga", "Thiền", "Chụp ảnh"],
  },
  {
    name: "Eco Farm Stay Mộc Châu",
    slug: "eco-farm-stay-moc-chau",
    tagline: "Nghỉ dưỡng tại trang trại sinh thái Mộc Châu",
    description:
      "Trải nghiệm cuộc sống nông trại giữa đồi chè xanh mướt và núi non Mộc Châu. Tham gia các hoạt động nông nghiệp, thưởng thức sản phẩm hữu cơ tươi ngon mỗi ngày.",
    location: {
      address: "Cao nguyên Mộc Châu",
      city: "Mộc Châu",
      state: "Sơn La",
      country: "Vietnam",
      zipCode: "340000",
      coordinates: { lat: 20.8333, lng: 104.6833 },
    },
    propertyType: "cabin",
    capacity: { maxGuests: 6, maxVehicles: 2, maxPets: 2 },
    pricing: {
      basePrice: 700000,
      weekendPrice: 1000000,
      cleaningFee: 120000,
      petFee: 80000,
      extraGuestFee: 100000,
    },
    rules: {
      checkIn: "14:00",
      checkOut: "11:00",
      minNights: 1,
      maxNights: 7,
      allowPets: true,
      allowChildren: true,
      allowSmoking: false,
      allowEvents: true,
      quietHours: "22:00 - 07:00",
    },
    images: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b"],
    isInstantBook: true,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Bếp", "View núi", "Phù hợp trẻ em"],
    activityNames: ["Nông trại", "Đi bộ ngắn", "Chụp ảnh", "Văn hóa địa phương"],
  },
  {
    name: "Desert Oasis Ninh Thuận",
    slug: "desert-oasis-ninh-thuan",
    tagline: "Ốc đảo giữa sa mạc Ninh Thuận",
    description:
      "Cắm trại độc đáo giữa đồi cát vàng và vườn nho xanh mát. Trải nghiệm hoàng hôn tuyệt đẹp trên sa mạc, đêm đầy sao và văn hóa Chăm đặc sắc.",
    location: {
      address: "Bàu Trắng",
      city: "Ninh Phước",
      state: "Ninh Thuận",
      country: "Vietnam",
      zipCode: "590000",
      coordinates: { lat: 11.7833, lng: 108.9667 },
    },
    propertyType: "glamping",
    capacity: { maxGuests: 4, maxVehicles: 2, maxPets: 1 },
    pricing: {
      basePrice: 900000,
      weekendPrice: 1300000,
      cleaningFee: 150000,
      petFee: 100000,
      extraGuestFee: 150000,
    },
    rules: {
      checkIn: "14:00",
      checkOut: "11:00",
      minNights: 1,
      maxNights: 5,
      allowPets: true,
      allowChildren: true,
      allowSmoking: true,
      allowEvents: false,
      quietHours: "23:00 - 06:00",
    },
    images: ["https://images.unsplash.com/photo-1496545672447-f699b503d270"],
    isInstantBook: true,
    amenityNames: ["Điện", "Nước", "Toilet", "Giường ngủ", "Quạt", "Điều hòa", "Lò nướng BBQ"],
    activityNames: ["ATV", "Ngắm sao", "Chụp ảnh", "Văn hóa địa phương"],
  },
  {
    name: "Riverside Camping Hội An",
    slug: "riverside-camping-hoi-an",
    tagline: "Cắm trại bên bờ sông Thu Bồn",
    description:
      "Tận hưởng không gian yên bình bên bờ sông, cách phố cổ Hội An chỉ 15 phút. Hoàn hảo để khám phá di sản văn hóa và thư giãn giữa thiên nhiên.",
    location: {
      address: "Bờ sông Thu Bồn",
      city: "Hội An",
      state: "Quảng Nam",
      country: "Vietnam",
      zipCode: "560000",
      coordinates: { lat: 15.8794, lng: 108.335 },
    },
    propertyType: "tent",
    capacity: { maxGuests: 5, maxVehicles: 2, maxPets: 2 },
    pricing: {
      basePrice: 450000,
      weekendPrice: 650000,
      cleaningFee: 80000,
      petFee: 70000,
      extraGuestFee: 80000,
    },
    rules: {
      checkIn: "13:00",
      checkOut: "12:00",
      minNights: 1,
      maxNights: 7,
      allowPets: true,
      allowChildren: true,
      allowSmoking: true,
      allowEvents: true,
      quietHours: "22:00 - 07:00",
    },
    images: ["https://images.unsplash.com/photo-1478131143081-80f7f84ca84d"],
    isInstantBook: false,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Wifi", "Lò nướng BBQ"],
    activityNames: ["Câu cá", "Chèo thuyền", "Xe đạp địa hình", "Văn hóa địa phương"],
  },
  {
    name: "Mountain Retreat Tam Đảo",
    slug: "mountain-retreat-tam-dao",
    tagline: "Khu nghỉ dưỡng núi non Tam Đảo",
    description:
      "Bungalow sang trọng với tầm nhìn 360 độ ra núi non Tam Đảo. Không khí mát mẻ quanh năm, thích hợp cho những ai muốn trốn nóng thành phố.",
    location: {
      address: "Thị trấn Tam Đảo",
      city: "Tam Đảo",
      state: "Vĩnh Phúc",
      country: "Vietnam",
      zipCode: "280000",
      coordinates: { lat: 21.4583, lng: 105.6417 },
    },
    propertyType: "cabin",
    capacity: { maxGuests: 4, maxVehicles: 2, maxPets: 0 },
    pricing: {
      basePrice: 850000,
      weekendPrice: 1200000,
      cleaningFee: 150000,
      petFee: 0,
      extraGuestFee: 150000,
    },
    rules: {
      checkIn: "14:00",
      checkOut: "11:00",
      minNights: 1,
      maxNights: 10,
      allowPets: false,
      allowChildren: true,
      allowSmoking: false,
      allowEvents: false,
      quietHours: "22:00 - 07:00",
    },
    images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4"],
    isInstantBook: true,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Wifi", "Lò sưởi", "View núi"],
    activityNames: ["Trekking", "Ngắm chim", "Chụp ảnh", "Yoga"],
  },
  {
    name: "Beach Bungalow Quy Nhơn",
    slug: "beach-bungalow-quy-nhon",
    tagline: "Bungalow bên bãi biển hoang sơ Quy Nhơn",
    description:
      "Nghỉ dưỡng tại bungalow gỗ trên bờ biển yên tĩnh, view hoàng hôn tuyệt đẹp. Thích hợp cho các cặp đôi hoặc gia đình nhỏ tìm kiếm sự riêng tư.",
    location: {
      address: "Bãi Xép",
      city: "Quy Nhơn",
      state: "Bình Định",
      country: "Vietnam",
      zipCode: "590000",
      coordinates: { lat: 13.7667, lng: 109.2167 },
    },
    propertyType: "cabin",
    capacity: { maxGuests: 3, maxVehicles: 1, maxPets: 1 },
    pricing: {
      basePrice: 950000,
      weekendPrice: 1400000,
      cleaningFee: 120000,
      petFee: 100000,
      extraGuestFee: 180000,
    },
    rules: {
      checkIn: "14:00",
      checkOut: "11:00",
      minNights: 2,
      maxNights: 7,
      allowPets: true,
      allowChildren: true,
      allowSmoking: false,
      allowEvents: false,
      quietHours: "22:00 - 07:00",
    },
    images: ["https://images.unsplash.com/photo-1510414842594-a61c69b5ae57"],
    isInstantBook: true,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Bếp", "Quạt", "View biển"],
    activityNames: ["Bơi lội", "Lặn biển", "Chụp ảnh", "Yoga"],
  },
  {
    name: "Coffee Farm Glamping Buôn Ma Thuột",
    slug: "coffee-farm-glamping-buon-ma-thuot",
    tagline: "Glamping giữa vườn cà phê Tây Nguyên",
    description:
      "Trải nghiệm sống giữa đồn điền cà phê, thưởng thức cà phê rang xay tươi mỗi sáng. Tìm hiểu quy trình trồng và rang cà phê truyền thống.",
    location: {
      address: "Đồn điền cà phê",
      city: "Buôn Ma Thuột",
      state: "Đắk Lắk",
      country: "Vietnam",
      zipCode: "630000",
      coordinates: { lat: 12.6667, lng: 108.05 },
    },
    propertyType: "glamping",
    capacity: { maxGuests: 5, maxVehicles: 2, maxPets: 1 },
    pricing: {
      basePrice: 750000,
      weekendPrice: 1050000,
      cleaningFee: 130000,
      petFee: 90000,
      extraGuestFee: 120000,
    },
    rules: {
      checkIn: "13:00",
      checkOut: "12:00",
      minNights: 1,
      maxNights: 5,
      allowPets: true,
      allowChildren: true,
      allowSmoking: false,
      allowEvents: true,
      quietHours: "22:00 - 07:00",
    },
    images: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4"],
    isInstantBook: false,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Giường ngủ", "Lò nướng BBQ"],
    activityNames: ["Nông trại", "Đi bộ ngắn", "Văn hóa địa phương", "Chụp ảnh"],
  },
  {
    name: "Jungle Treehouse Cát Tiên",
    slug: "jungle-treehouse-cat-tien",
    tagline: "Nhà trên cây trong rừng quốc gia Cát Tiên",
    description:
      "Phiêu lưu độc đáo giữa rừng nhiệt đới, gần gũi động vật hoang dã. Lý tưởng cho những người yêu thiên nhiên và thích khám phá.",
    location: {
      address: "Vườn quốc gia Cát Tiên",
      city: "Tân Phú",
      state: "Đồng Nai",
      country: "Vietnam",
      zipCode: "760000",
      coordinates: { lat: 11.4333, lng: 107.4167 },
    },
    propertyType: "treehouse",
    capacity: { maxGuests: 4, maxVehicles: 2, maxPets: 0 },
    pricing: {
      basePrice: 1200000,
      weekendPrice: 1700000,
      cleaningFee: 180000,
      petFee: 0,
      extraGuestFee: 250000,
    },
    rules: {
      checkIn: "14:00",
      checkOut: "11:00",
      minNights: 2,
      maxNights: 5,
      allowPets: false,
      allowChildren: false,
      allowSmoking: false,
      allowEvents: false,
      quietHours: "21:00 - 06:00",
    },
    images: ["https://images.unsplash.com/photo-1520520731457-9283dd14aa66"],
    isInstantBook: false,
    amenityNames: ["Điện", "Nước", "Toilet", "Giường ngủ", "Khu vực riêng tư", "Bộ cứu thương"],
    activityNames: ["Ngắm chim", "Safari", "Trekking", "Chụp ảnh"],
  },
  {
    name: "Floating Cabin Cần Thơ",
    slug: "floating-cabin-can-tho",
    tagline: "Nhà nổi trên sông Hậu",
    description:
      "Trải nghiệm cuộc sống sông nước miền Tây, thưởng thức ẩm thực địa phương và tham quan chợ nổi Cái Răng vào buổi sáng sớm.",
    location: {
      address: "Sông Hậu",
      city: "Cần Thơ",
      state: "Cần Thơ",
      country: "Vietnam",
      zipCode: "900000",
      coordinates: { lat: 10.0333, lng: 105.7833 },
    },
    propertyType: "cabin",
    capacity: { maxGuests: 6, maxVehicles: 0, maxPets: 0 },
    pricing: {
      basePrice: 650000,
      weekendPrice: 900000,
      cleaningFee: 100000,
      petFee: 0,
      extraGuestFee: 100000,
    },
    rules: {
      checkIn: "14:00",
      checkOut: "11:00",
      minNights: 1,
      maxNights: 5,
      allowPets: false,
      allowChildren: true,
      allowSmoking: false,
      allowEvents: false,
      quietHours: "22:00 - 06:00",
    },
    images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4"],
    isInstantBook: true,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Bếp", "Quạt"],
    activityNames: ["Chèo thuyền", "Câu cá", "Văn hóa địa phương", "Chụp ảnh"],
  },
  {
    name: "Rock Climbing Base Hạ Long",
    slug: "rock-climbing-base-ha-long",
    tagline: "Căn cứ leo núi tại đảo Cát Bà",
    description:
      "Thiên đường cho người yêu thích leo núi đá, với các tuyến leo từ dễ đến khó. View vịnh Hạ Long tuyệt đẹp từ đỉnh núi.",
    location: {
      address: "Đảo Cát Bà",
      city: "Cát Bà",
      state: "Hải Phòng",
      country: "Vietnam",
      zipCode: "180000",
      coordinates: { lat: 20.7272, lng: 107.0461 },
    },
    propertyType: "cabin",
    capacity: { maxGuests: 8, maxVehicles: 2, maxPets: 1 },
    pricing: {
      basePrice: 550000,
      weekendPrice: 800000,
      cleaningFee: 120000,
      petFee: 80000,
      extraGuestFee: 90000,
    },
    rules: {
      checkIn: "13:00",
      checkOut: "12:00",
      minNights: 1,
      maxNights: 10,
      allowPets: true,
      allowChildren: true,
      allowSmoking: true,
      allowEvents: true,
      quietHours: "23:00 - 06:00",
    },
    images: ["https://images.unsplash.com/photo-1478131143081-80f7f84ca84d"],
    isInstantBook: true,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Bãi đỗ xe", "View biển"],
    activityNames: ["Rock climbing", "Leo núi", "Chèo thuyền", "Lặn biển"],
  },
  {
    name: "Tea Hills Retreat Bảo Lộc",
    slug: "tea-hills-retreat-bao-loc",
    tagline: "Nghỉ dưỡng trên đồi chè Bảo Lộc",
    description:
      "Thư giãn giữa những đồi chè xanh ngút ngàn, không khí mát mẻ quanh năm. Tham gia hái chè và học cách pha trà truyền thống.",
    location: {
      address: "Đồi chè Bảo Lộc",
      city: "Bảo Lộc",
      state: "Lâm Đồng",
      country: "Vietnam",
      zipCode: "670000",
      coordinates: { lat: 11.5333, lng: 107.8 },
    },
    propertyType: "glamping",
    capacity: { maxGuests: 4, maxVehicles: 2, maxPets: 1 },
    pricing: {
      basePrice: 800000,
      weekendPrice: 1150000,
      cleaningFee: 140000,
      petFee: 90000,
      extraGuestFee: 140000,
    },
    rules: {
      checkIn: "14:00",
      checkOut: "11:00",
      minNights: 1,
      maxNights: 7,
      allowPets: true,
      allowChildren: true,
      allowSmoking: false,
      allowEvents: false,
      quietHours: "22:00 - 07:00",
    },
    images: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4"],
    isInstantBook: true,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Giường ngủ", "Wifi", "View núi"],
    activityNames: ["Nông trại", "Đi bộ ngắn", "Chụp ảnh", "Yoga"],
  },
  {
    name: "Volcano Camping Chư Đăng Ya",
    slug: "volcano-camping-chu-dang-ya",
    tagline: "Cắm trải tại miệng núi lửa Chư Đăng Ya",
    description:
      "Trải nghiệm độc đáo cắm trại trên miệng núi lửa đã ngủ yên, tầm nhìn 360 độ ra Tây Nguyên hùng vĩ. Ngắm bình minh và hoàng hôn tuyệt đẹp.",
    location: {
      address: "Núi lửa Chư Đăng Ya",
      city: "Krông Pắc",
      state: "Đắk Lắk",
      country: "Vietnam",
      zipCode: "630000",
      coordinates: { lat: 12.9167, lng: 108.2667 },
    },
    propertyType: "tent",
    capacity: { maxGuests: 6, maxVehicles: 3, maxPets: 2 },
    pricing: {
      basePrice: 400000,
      weekendPrice: 600000,
      cleaningFee: 80000,
      petFee: 70000,
      extraGuestFee: 70000,
    },
    rules: {
      checkIn: "12:00",
      checkOut: "12:00",
      minNights: 1,
      maxNights: 3,
      allowPets: true,
      allowChildren: true,
      allowSmoking: true,
      allowEvents: true,
      quietHours: "23:00 - 06:00",
    },
    images: ["https://images.unsplash.com/photo-1478131143081-80f7f84ca84d"],
    isInstantBook: false,
    amenityNames: ["Điện", "Nước", "Toilet", "Lửa trại", "Lò nướng BBQ"],
    activityNames: ["Trekking", "Ngắm sao", "Chụp ảnh", "Leo núi"],
  },
  {
    name: "Mangrove Forest Stay Cần Giờ",
    slug: "mangrove-forest-stay-can-gio",
    tagline: "Lưu trú giữa rừng ngập mặn Cần Giờ",
    description:
      "Khám phá hệ sinh thái rừng ngập mặn độc đáo, quan sát động vật hoang dã và tìm hiểu về bảo tồn môi trường. Gần Sài Gòn, lý tưởng cho chuyến đi cuối tuần.",
    location: {
      address: "Khu sinh thái rừng ngập mặn",
      city: "Cần Giờ",
      state: "Hồ Chí Minh",
      country: "Vietnam",
      zipCode: "700000",
      coordinates: { lat: 10.4, lng: 106.95 },
    },
    propertyType: "cabin",
    capacity: { maxGuests: 5, maxVehicles: 2, maxPets: 0 },
    pricing: {
      basePrice: 500000,
      weekendPrice: 750000,
      cleaningFee: 100000,
      petFee: 0,
      extraGuestFee: 80000,
    },
    rules: {
      checkIn: "14:00",
      checkOut: "11:00",
      minNights: 1,
      maxNights: 3,
      allowPets: false,
      allowChildren: true,
      allowSmoking: false,
      allowEvents: false,
      quietHours: "22:00 - 06:00",
    },
    images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4"],
    isInstantBook: true,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Quạt", "Bộ cứu thương"],
    activityNames: ["Chèo thuyền", "Ngắm chim", "Safari", "Chụp ảnh"],
  },
  {
    name: "Waterfall Glamping Đambri",
    slug: "waterfall-glamping-dambri",
    tagline: "Glamping bên thác Đambri hùng vĩ",
    description:
      "Ngủ dậy với âm thanh thác nước, tận hưởng không gian mát mẻ và trong lành. Lều glamping cao cấp với đầy đủ tiện nghi hiện đại.",
    location: {
      address: "Thác Đambri",
      city: "Bảo Lộc",
      state: "Lâm Đồng",
      country: "Vietnam",
      zipCode: "670000",
      coordinates: { lat: 11.5667, lng: 107.7833 },
    },
    propertyType: "glamping",
    capacity: { maxGuests: 4, maxVehicles: 2, maxPets: 1 },
    pricing: {
      basePrice: 1100000,
      weekendPrice: 1600000,
      cleaningFee: 180000,
      petFee: 100000,
      extraGuestFee: 200000,
    },
    rules: {
      checkIn: "14:00",
      checkOut: "11:00",
      minNights: 2,
      maxNights: 5,
      allowPets: true,
      allowChildren: true,
      allowSmoking: false,
      allowEvents: false,
      quietHours: "22:00 - 07:00",
    },
    images: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4"],
    isInstantBook: true,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Giường ngủ", "Wifi", "Điều hòa"],
    activityNames: ["Trekking", "Bơi lội", "Chụp ảnh", "Yoga"],
  },
  {
    name: "Stargazing Camp Phan Rang",
    slug: "stargazing-camp-phan-rang",
    tagline: "Khu cắm trại ngắm sao Phan Rang",
    description:
      "Bầu trời đêm trong trẻo hoàn hảo cho việc ngắm sao, xa ánh sáng thành phố. Có kính thiên văn và hướng dẫn viên thiên văn học.",
    location: {
      address: "Vĩnh Hải",
      city: "Phan Rang-Tháp Chàm",
      state: "Ninh Thuận",
      country: "Vietnam",
      zipCode: "590000",
      coordinates: { lat: 11.5667, lng: 108.9833 },
    },
    propertyType: "tent",
    capacity: { maxGuests: 10, maxVehicles: 4, maxPets: 2 },
    pricing: {
      basePrice: 350000,
      weekendPrice: 500000,
      cleaningFee: 70000,
      petFee: 60000,
      extraGuestFee: 60000,
    },
    rules: {
      checkIn: "15:00",
      checkOut: "10:00",
      minNights: 1,
      maxNights: 3,
      allowPets: true,
      allowChildren: true,
      allowSmoking: true,
      allowEvents: true,
      quietHours: "24:00 - 06:00",
    },
    images: ["https://images.unsplash.com/photo-1478131143081-80f7f84ca84d"],
    isInstantBook: false,
    amenityNames: ["Điện", "Nước", "Toilet", "Lửa trại", "Lò nướng BBQ"],
    activityNames: ["Ngắm sao", "Chụp ảnh", "Lửa trại", "Thiền"],
  },
  {
    name: "Pine Forest Campground Ba Vì",
    slug: "pine-forest-campground-ba-vi",
    tagline: "Khu cắm trại rừng thông - Chọn chỗ khi đến",
    description:
      "Khu cắm trại rộng lớn giữa rừng thông Ba Vì với 15 vị trí cắm trại. Khách được tự do chọn chỗ khi check-in, không cần đặt vị trí cụ thể. Tất cả các vị trí đều có cùng mức giá và tiện nghi.",
    location: {
      address: "Vườn Quốc gia Ba Vì",
      city: "Ba Vì",
      state: "Hà Nội",
      country: "Vietnam",
      zipCode: "100000",
      coordinates: { lat: 21.0833, lng: 105.3667 },
    },
    propertyType: "tent",
    capacity: { maxGuests: 4, maxVehicles: 2, maxPets: 1 },
    pricing: {
      basePrice: 300000,
      weekendPrice: 450000,
      cleaningFee: 50000,
      petFee: 50000,
      extraGuestFee: 50000,
    },
    rules: {
      checkIn: "12:00",
      checkOut: "11:00",
      minNights: 1,
      maxNights: 7,
      allowPets: true,
      allowChildren: true,
      allowSmoking: true,
      allowEvents: true,
      quietHours: "22:00 - 07:00",
    },
    images: [
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d",
      "https://images.unsplash.com/photo-1504851149312-7a075b496cc7",
    ],
    isInstantBook: true,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Bãi đỗ xe", "Lửa trại", "Wifi"],
    activityNames: ["Trekking", "Xe đạp địa hình", "Ngắm chim", "Chụp ảnh"],
    isUndesignated: true, // Flag to create undesignated sites
    numberOfSites: 15, // Number of undesignated sites to create
  },
  {
    name: "Lakeside Retreat Hòa Bình",
    slug: "lakeside-retreat-hoa-binh",
    tagline: "Bờ hồ yên bình - 2 vị trí tiện nghi",
    description:
      "Khu cắm trại nhỏ xinh bên bờ hồ Hòa Bình với 2 vị trí cắm trại. Khách được tự do chọn chỗ khi check-in. Cả 2 vị trí đều có view hồ tuyệt đẹp và tiện nghi đầy đủ.",
    location: {
      address: "Hồ Hòa Bình",
      city: "Hòa Bình",
      state: "Hòa Bình",
      country: "Vietnam",
      zipCode: "35000",
      coordinates: { lat: 20.8142, lng: 105.3381 },
    },
    propertyType: "tent",
    capacity: { maxGuests: 4, maxVehicles: 2, maxPets: 2 },
    pricing: {
      basePrice: 350000,
      weekendPrice: 500000,
      cleaningFee: 50000,
      petFee: 30000,
      extraGuestFee: 50000,
    },
    rules: {
      checkIn: "13:00",
      checkOut: "11:00",
      minNights: 1,
      maxNights: 5,
      allowPets: true,
      allowChildren: true,
      allowSmoking: false,
      allowEvents: false,
      quietHours: "22:00 - 06:00",
    },
    images: [
      "https://images.unsplash.com/photo-1504851149312-7a075b496cc7",
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d",
    ],
    isInstantBook: true,
    amenityNames: ["Điện", "Nước", "Toilet", "Tắm nước nóng", "Lửa trại", "Lò nướng BBQ"],
    activityNames: ["Câu cá", "Chèo kayak", "Ngắm hoàng hôn", "Chụp ảnh"],
    isUndesignated: true,
    numberOfSites: 2, // Only 2 sites for easy testing
  },
];

async function seedDatabase() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️  Clearing existing Hipcamp data...");
    // Drop old collections to remove old indexes
    await mongoose.connection.db
      ?.collection("availabilities")
      .drop()
      .catch(() => { });
    await AmenityModel.deleteMany({});
    await ReviewModel.deleteMany({});
    await BookingModel.deleteMany({});
    await AvailabilityModel.deleteMany({});
    await SiteModel.deleteMany({});
    await PropertyModel.deleteMany({});
    // Keep existing users, only add new ones
    console.log("✅ Cleared Hipcamp data");

    // ===== SEED AMENITIES =====
    console.log("🏕️  Seeding amenities...");
    const createdAmenities = await AmenityModel.insertMany(amenities);
    console.log(`✅ Created ${createdAmenities.length} amenities`);

    // ===== SEED USERS =====
    console.log("👤 Seeding users...");
    const createdUsers = [];
    for (const userData of users) {
      const existingUser = await UserModel.findOne({ email: userData.email });
      if (!existingUser) {
        const hashedPassword = await hashValue(userData.password);
        const user = await UserModel.create({
          ...userData,
          password: hashedPassword,
        });
        createdUsers.push(user);
      } else {
        createdUsers.push(existingUser);
      }
    }
    console.log(`✅ Created/found ${createdUsers.length} users`);

    // Get hosts and guests
    const hosts = createdUsers.filter((u) => u.email.startsWith("host"));
    const guests = createdUsers.filter((u) => u.email.startsWith("guest"));

    // ===== SEED PROPERTIES & SITES =====
    console.log("🏕️  Seeding properties and sites...");
    const createdProperties = [];
    const createdSites = [];

    for (let i = 0; i < campsitesData.length; i++) {
      const data = campsitesData[i];
      const host = hosts[i % hosts.length];

      if (!data || !host) continue;

      // Find amenity IDs
      const amenityIds = await AmenityModel.find({
        name: { $in: data.amenityNames },
      }).select("_id");

      // Create Property
      const property = await PropertyModel.create({
        name: data.name,
        slug: data.slug,
        tagline: data.tagline,
        description: data.description,
        host: host._id,
        location: {
          address: data.location.address,
          city: data.location.city,
          state: data.location.state,
          country: data.location.country,
          zipCode: data.location.zipCode,
          coordinates: {
            type: "Point" as const,
            coordinates: [data.location.coordinates.lng, data.location.coordinates.lat],
          },
        },
        propertyType:
          data.propertyType === "tent"
            ? "campground"
            : data.propertyType === "rv"
              ? "campground"
              : data.propertyType === "cabin"
                ? "ranch"
                : data.propertyType === "glamping"
                  ? "farm"
                  : "private_land",
        landSize: {
          value: Math.floor(Math.random() * 200) + 50, // 50-250 acres
          unit: "acres" as const,
        },
        rules: [
          {
            text: data.rules.allowPets ? "Cho phép thú cưng" : "Không cho phép thú cưng",
            category: "pets",
            order: 1,
          },
          { text: `Giờ yên tĩnh: ${data.rules.quietHours}`, category: "noise", order: 2 },
          {
            text: data.rules.allowSmoking ? "Cho phép hút thuốc" : "Không hút thuốc",
            category: "general",
            order: 3,
          },
        ],
        photos: data.images.map((url: string, idx: number) => ({
          url,
          isCover: idx === 0,
          order: idx,
        })),
        isActive: true,
      });

      createdProperties.push(property);

      // Create multiple Sites for each Property
      // Check if this is an undesignated property (grouped sites)
      const isUndesignated = (data as any).isUndesignated === true;
      const numSites = isUndesignated
        ? (data as any).numberOfSites || 10
        : Math.floor(Math.random() * 4) + 2; // 2-5 sites for normal properties

      const accommodationType =
        data.propertyType === "glamping" ? "safari_tent" : data.propertyType;

      // Site names for variety
      const siteNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];

      for (let siteIdx = 0; siteIdx < numSites; siteIdx++) {
        // Generate slightly different coordinates for each site (within 0.01 degree)
        const siteCoords = [
          data.location.coordinates.lng + (Math.random() * 0.01 - 0.005),
          data.location.coordinates.lat + (Math.random() * 0.01 - 0.005),
        ];

        // For undesignated sites, all have same price
        // For designated sites, vary pricing slightly
        const priceVariation = isUndesignated ? 1.0 : Math.random() * 0.3 + 0.85; // 85%-115%
        const siteBasePrice = Math.round((data.pricing.basePrice * priceVariation) / 10000) * 10000;
        const siteWeekendPrice = data.pricing.weekendPrice
          ? Math.round((data.pricing.weekendPrice * priceVariation) / 10000) * 10000
          : undefined;

        // For undesignated, all sites have same capacity
        const siteCapacity = isUndesignated
          ? {
            maxGuests: data.capacity.maxGuests,
            maxAdults: data.capacity.maxGuests,
            maxPets: data.capacity.maxPets || 0,
            maxVehicles: data.capacity.maxVehicles || 1,
          }
          : {
            maxGuests: Math.max(1, data.capacity.maxGuests + Math.floor(Math.random() * 3) - 1),
            maxAdults: data.capacity.maxGuests,
            maxPets: data.capacity.maxPets || 0,
            maxVehicles: data.capacity.maxVehicles || 1,
          };

        const site = await SiteModel.create({
          name: isUndesignated
            ? `${data.name} - Site ${siteIdx + 1}`
            : `${data.name} - Site ${siteNames[siteIdx] || siteIdx + 1}`,
          slug: isUndesignated
            ? `${data.slug}-site-${siteIdx + 1}`
            : `${data.slug}-site-${siteNames[siteIdx]?.toLowerCase() || siteIdx + 1}`,
          description: isUndesignated
            ? `One of ${numSites} tent camping sites in this campground. Choose your spot upon arrival - all sites have the same amenities and pricing.`
            : `${accommodationType === "tent" ? "Tent camping site" : accommodationType === "rv" ? "RV camping site" : "Lodging accommodation"} with ${siteCapacity.maxGuests} guest capacity`,
          property: property._id,
          accommodationType,
          lodgingProvided: data.propertyType === "tent" ? "bring_your_own" : "structure_provided",
          siteLocation: {
            coordinates: {
              type: "Point",
              coordinates: siteCoords,
            },
            mapPinLabel: isUndesignated
              ? `Site ${siteIdx + 1}`
              : `Site ${siteNames[siteIdx] || siteIdx + 1}`,
            relativeDescription: isUndesignated
              ? "Throughout the pine forest"
              : siteIdx === 0
                ? "Near entrance"
                : siteIdx === 1
                  ? "By the river"
                  : siteIdx === 2
                    ? "In the meadow"
                    : "Forest area",
          },
          capacity: siteCapacity,
          pricing: {
            basePrice: siteBasePrice,
            currency: "VND",
            cleaningFee: data.pricing.cleaningFee || 0,
            petFee: data.pricing.petFee || 0,
            additionalGuestFee: data.pricing.extraGuestFee || 0,
            weekendPrice: siteWeekendPrice,
            seasonalPricing: [],
          },
          amenities: amenityIds.map((a: any) => a._id), // Array of Amenity ObjectIds
          bookingSettings: {
            minimumNights: data.rules.minNights,
            maximumNights: data.rules.maxNights,
            checkInTime: data.rules.checkIn,
            checkOutTime: data.rules.checkOut,
            instantBook: data.isInstantBook,
            advanceNotice: 1,
            preparationTime: 0,
            allowSameDayBooking: true,
          },
          photos: data.images.map((url: string, idx: number) => ({
            url,
            isCover: idx === 0,
            order: idx,
          })),
          isActive: true,
        });

        createdSites.push(site);
      }

      // Update property's totalSites count after creating all sites
      await PropertyModel.findByIdAndUpdate(property._id, {
        $set: {
          "stats.totalSites": numSites,
          "stats.activeSites": numSites,
          minPrice: Math.min(...createdSites.slice(-numSites).map((s) => s.pricing.basePrice)),
        },
      });
    }
    console.log(
      `✅ Created ${createdProperties.length} properties and ${createdSites.length} sites`
    );

    // ===== SEED BOOKINGS =====
    console.log("📅 Seeding bookings...");
    const bookingsData = [
      // Completed bookings (can be reviewed)
      {
        campsiteIndex: 0,
        guestIndex: 0,
        checkIn: new Date("2024-11-01"),
        checkOut: new Date("2024-11-05"),
        numberOfGuests: 2,
        numberOfPets: 0,
        numberOfVehicles: 1,
        status: "completed",
        paymentStatus: "paid",
      },
      {
        campsiteIndex: 1,
        guestIndex: 1,
        checkIn: new Date("2024-10-15"),
        checkOut: new Date("2024-10-18"),
        numberOfGuests: 4,
        numberOfPets: 1,
        numberOfVehicles: 1,
        status: "completed",
        paymentStatus: "paid",
      },
      {
        campsiteIndex: 2,
        guestIndex: 2,
        checkIn: new Date("2024-09-20"),
        checkOut: new Date("2024-09-23"),
        numberOfGuests: 3,
        numberOfPets: 0,
        numberOfVehicles: 1,
        status: "completed",
        paymentStatus: "paid",
      },
      {
        campsiteIndex: 0,
        guestIndex: 2,
        checkIn: new Date("2024-08-10"),
        checkOut: new Date("2024-08-14"),
        numberOfGuests: 2,
        numberOfPets: 0,
        numberOfVehicles: 1,
        status: "completed",
        paymentStatus: "paid",
      },
      {
        campsiteIndex: 3,
        guestIndex: 0,
        checkIn: new Date("2024-07-05"),
        checkOut: new Date("2024-07-08"),
        numberOfGuests: 5,
        numberOfPets: 1,
        numberOfVehicles: 2,
        status: "completed",
        paymentStatus: "paid",
      },
      {
        campsiteIndex: 1,
        guestIndex: 2,
        checkIn: new Date("2024-06-20"),
        checkOut: new Date("2024-06-23"),
        numberOfGuests: 2,
        numberOfPets: 0,
        numberOfVehicles: 1,
        status: "completed",
        paymentStatus: "paid",
      },
      {
        campsiteIndex: 4,
        guestIndex: 1,
        checkIn: new Date("2024-05-15"),
        checkOut: new Date("2024-05-18"),
        numberOfGuests: 4,
        numberOfPets: 2,
        numberOfVehicles: 2,
        status: "completed",
        paymentStatus: "paid",
      },
      {
        campsiteIndex: 2,
        guestIndex: 0,
        checkIn: new Date("2024-04-10"),
        checkOut: new Date("2024-04-13"),
        numberOfGuests: 3,
        numberOfPets: 0,
        numberOfVehicles: 1,
        status: "completed",
        paymentStatus: "paid",
      },
      // Future confirmed bookings
      {
        campsiteIndex: 5,
        guestIndex: 1,
        checkIn: new Date("2025-12-10"),
        checkOut: new Date("2025-12-12"),
        numberOfGuests: 4,
        numberOfPets: 1,
        numberOfVehicles: 2,
        status: "confirmed",
        paymentStatus: "paid",
      },
      {
        campsiteIndex: 2,
        guestIndex: 2,
        checkIn: new Date("2025-12-15"),
        checkOut: new Date("2025-12-18"),
        numberOfGuests: 3,
        numberOfPets: 0,
        numberOfVehicles: 1,
        status: "pending",
        paymentStatus: "pending",
      },
    ];

    const createdBookings = [];
    for (const bookingData of bookingsData) {
      const property = createdProperties[bookingData.campsiteIndex];
      const site = createdSites[bookingData.campsiteIndex];
      const guest = guests[bookingData.guestIndex];
      const host = hosts[bookingData.campsiteIndex % hosts.length];

      if (!property || !site || !guest || !host) continue;

      const nights = Math.ceil(
        (bookingData.checkOut.getTime() - bookingData.checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      const basePrice = site.pricing.basePrice;
      const subtotal = basePrice * nights;
      const cleaningFee = site.pricing.cleaningFee || 0;
      const petFee = bookingData.numberOfPets > 0 ? site.pricing.petFee || 0 : 0;
      const serviceFee = Math.round(subtotal * 0.1);
      const tax = Math.round((subtotal + cleaningFee + petFee + serviceFee) * 0.1);
      const total = subtotal + cleaningFee + petFee + serviceFee + tax;

      const booking = await BookingModel.create({
        code: `BK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        property: property._id,
        site: site._id,
        guest: guest._id,
        host: host._id,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        nights,
        numberOfGuests: bookingData.numberOfGuests,
        numberOfPets: bookingData.numberOfPets,
        numberOfVehicles: bookingData.numberOfVehicles,
        pricing: {
          basePrice,
          totalNights: nights,
          subtotal,
          cleaningFee,
          petFee,
          serviceFee,
          tax,
          total,
        },
        status: bookingData.status,
        payment: {
          method: "card",
          status: bookingData.paymentStatus,
        },
      });

      createdBookings.push(booking);
    }
    console.log(`✅ Created ${createdBookings.length} bookings`);

    // ===== SEED AVAILABILITY =====
    console.log("📅 Seeding availability...");
    const availabilityRecords = [];

    for (const site of createdSites) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create 90 days of availability (next 3 months)
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        // Randomly block some dates for variety
        const randomBlock = Math.random();
        let isAvailable = true;
        let blockType = undefined;
        let reason = undefined;
        let price = undefined;

        // 10% chance of being booked
        if (randomBlock < 0.1) {
          isAvailable = false;
          blockType = "booked";
          reason = "Đã được đặt";
        }
        // 5% chance of maintenance
        else if (randomBlock < 0.15) {
          isAvailable = false;
          blockType = "maintenance";
          reason = "Bảo trì định kỳ";
        }
        // 5% chance of being blocked by host
        else if (randomBlock < 0.2) {
          isAvailable = false;
          blockType = "blocked";
          reason = "Chủ nhà tạm khóa";
        }
        // 10% chance of weekend pricing (higher price)
        else if (date.getDay() === 0 || date.getDay() === 6) {
          if (site.pricing.weekendPrice) {
            price = site.pricing.weekendPrice;
          }
        }

        availabilityRecords.push({
          site: site._id,
          date,
          isAvailable,
          blockType,
          reason,
          price,
        });
      }
    }

    await AvailabilityModel.insertMany(availabilityRecords);
    console.log(`✅ Created ${availabilityRecords.length} availability records`);

    // ===== SEED REVIEWS =====
    console.log("⭐ Seeding reviews...");
    const completedBookings = createdBookings.filter((b) => b.status === "completed");

    const reviewTemplates = [
      {
        ratings: { cleanliness: 5, accuracy: 5, location: 5, value: 5, communication: 5 },
        title: "Trải nghiệm tuyệt vời!",
        comment:
          "Chúng tôi đã có một kỳ nghỉ tuyệt vời tại đây. View đẹp, không khí trong lành, chủ nhà thân thiện. Sẽ quay lại lần sau!",
        pros: ["View đẹp", "Sạch sẽ", "Chủ nhà nhiệt tình"],
        cons: ["Wifi hơi yếu"],
        isFeatured: true,
        hasResponse: true,
      },
      {
        ratings: { cleanliness: 4, accuracy: 5, location: 5, value: 4, communication: 5 },
        title: "Rất đáng để thử!",
        comment:
          "Địa điểm yên tĩnh, phù hợp cho gia đình. Tiện nghi đầy đủ, chủ nhà support rất tốt. Giá cả hợp lý.",
        pros: ["Yên tĩnh", "Phù hợp gia đình", "Giá tốt"],
        cons: ["Đường vào hơi khó"],
        isFeatured: false,
        hasResponse: true,
      },
      {
        ratings: { cleanliness: 5, accuracy: 4, location: 4, value: 5, communication: 5 },
        title: "Nơi nghỉ dưỡng lý tưởng",
        comment:
          "Campsite rất sạch sẽ và thoáng mát. Hoạt động ngoài trời phong phú, con cái rất thích. Chắc chắn sẽ quay lại!",
        pros: ["Sạch sẽ", "Nhiều hoạt động", "Thân thiện với trẻ em"],
        cons: [],
        isFeatured: true,
        hasResponse: false,
      },
      {
        ratings: { cleanliness: 4, accuracy: 4, location: 5, value: 4, communication: 4 },
        title: "Tốt cho nhóm bạn",
        comment:
          "Không gian rộng rãi, phù hợp đi nhóm. Có khu nấu ăn tiện lợi. View núi rất đẹp vào buổi sáng.",
        pros: ["Rộng rãi", "View đẹp", "Khu BBQ tiện lợi"],
        cons: ["Nhà vệ sinh chung hơi xa"],
        isFeatured: false,
        hasResponse: false,
      },
      {
        ratings: { cleanliness: 5, accuracy: 5, location: 4, value: 5, communication: 5 },
        title: "Hoàn hảo cho pet!",
        comment:
          "Chủ nhà rất thân thiện với pet. Khu vực rộng để cún chạy nhảy. Mọi thứ đều sạch sẽ và tiện nghi.",
        pros: ["Pet friendly", "Khu vực rộng", "Chủ nhà tuyệt vời"],
        cons: ["Hơi xa siêu thị"],
        isFeatured: false,
        hasResponse: true,
      },
    ];

    const reviewsToCreate = [];
    for (let i = 0; i < Math.min(completedBookings.length, 20); i++) {
      const booking = completedBookings[i];
      if (!booking) continue;

      const template = reviewTemplates[i % reviewTemplates.length];
      if (!template) continue;

      // Calculate overall rating
      const overallRating =
        Math.round(
          ((template.ratings.cleanliness +
            template.ratings.accuracy +
            template.ratings.location +
            template.ratings.value +
            template.ratings.communication) /
            5) *
          10
        ) / 10;

      const review: any = {
        booking: booking._id,
        property: booking.property,
        site: booking.site,
        guest: booking.guest,
        host: booking.host,
        propertyRatings: {
          location: template.ratings.location,
          communication: template.ratings.communication,
          value: template.ratings.value,
        },
        siteRatings: {
          cleanliness: template.ratings.cleanliness,
          accuracy: template.ratings.accuracy,
          amenities: Math.round((template.ratings.cleanliness + template.ratings.accuracy) / 2),
        },
        overallRating,
        title: template.title,
        comment: template.comment,
        pros: template.pros,
        cons: template.cons,
        images: [],
        isPublished: true,
        isFeatured: template.isFeatured,
        isVerified: true,
        helpfulCount: Math.floor(Math.random() * 20),
        notHelpfulCount: Math.floor(Math.random() * 3),
      };

      if (template.hasResponse) {
        review.hostResponse = {
          comment: "Cảm ơn bạn rất nhiều! Rất vui vì bạn đã có trải nghiệm tốt. Hẹn gặp lại!",
          respondedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        };
      }

      reviewsToCreate.push(review);
      booking.reviewed = true;
      booking.review = review.booking;
    }

    const createdReviews = await ReviewModel.insertMany(reviewsToCreate);
    await Promise.all(completedBookings.slice(0, reviewsToCreate.length).map((b) => b.save()));

    console.log(`✅ Created ${createdReviews.length} reviews`);

    // Update property and site ratings
    const propertiesWithReviews = [
      ...new Set(createdReviews.map((r: any) => r.property.toString())),
    ];
    const sitesWithReviews = [...new Set(createdReviews.map((r: any) => r.site.toString()))];

    for (const propertyId of propertiesWithReviews) {
      const reviews = await ReviewModel.find({ property: propertyId, isPublished: true });
      if (reviews.length === 0) continue;

      const totalPropertyRatings = reviews.reduce(
        (acc, review: any) => {
          acc.location += review.propertyRatings.location;
          acc.communication += review.propertyRatings.communication;
          acc.value += review.propertyRatings.value;
          acc.overall += review.overallRating;
          return acc;
        },
        { location: 0, communication: 0, value: 0, overall: 0 }
      );

      const count = reviews.length;
      await PropertyModel.findByIdAndUpdate(propertyId, {
        rating: {
          average: Math.round((totalPropertyRatings.overall / count) * 10) / 10,
          count,
          breakdown: {
            location: Math.round((totalPropertyRatings.location / count) * 10) / 10,
            communication: Math.round((totalPropertyRatings.communication / count) * 10) / 10,
            value: Math.round((totalPropertyRatings.value / count) * 10) / 10,
          },
        },
      });
    }

    for (const siteId of sitesWithReviews) {
      const reviews = await ReviewModel.find({ site: siteId, isPublished: true });
      if (reviews.length === 0) continue;

      const totalSiteRatings = reviews.reduce(
        (acc, review: any) => {
          acc.cleanliness += review.siteRatings.cleanliness;
          acc.accuracy += review.siteRatings.accuracy;
          acc.amenities += review.siteRatings.amenities;
          acc.overall += review.overallRating;
          return acc;
        },
        { cleanliness: 0, accuracy: 0, amenities: 0, overall: 0 }
      );

      const count = reviews.length;
      await SiteModel.findByIdAndUpdate(siteId, {
        rating: {
          average: Math.round((totalSiteRatings.overall / count) * 10) / 10,
          count,
          breakdown: {
            cleanliness: Math.round((totalSiteRatings.cleanliness / count) * 10) / 10,
            accuracy: Math.round((totalSiteRatings.accuracy / count) * 10) / 10,
            amenities: Math.round((totalSiteRatings.amenities / count) * 10) / 10,
          },
        },
      });
    }

    console.log(
      `✅ Updated ratings for ${propertiesWithReviews.length} properties and ${sitesWithReviews.length} sites`
    );

    console.log("\n🎉 Database seeded successfully!");
    console.log("📊 Summary:");
    console.log(`   - Amenities: ${createdAmenities.length}`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Properties: ${createdProperties.length}`);
    console.log(`   - Sites: ${createdSites.length}`);
    console.log(`   - Availability: ${availabilityRecords.length}`);
    console.log(`   - Bookings: ${createdBookings.length}`);
    console.log(`   - Reviews: ${createdReviews.length}`);
    console.log("\n👤 Test accounts:");
    console.log("   Admin: admin@hipcamp.vn / Admin@123");
    console.log("   Host: host1@hipcamp.vn / Host@123");
    console.log("   Guest: guest1@hipcamp.vn / Guest@123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
