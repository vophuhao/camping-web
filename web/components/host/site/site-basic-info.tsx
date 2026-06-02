/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SiteBasicInfoProps {
  data: {
    name: string;
    description: string;
    siteClass?: "basic" | "vip";
  };
  onChange: (data: any) => void;
}

export function SiteBasicInfo({ data, onChange }: SiteBasicInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-3xl font-semibold text-gray-900 mb-4">
          Thông tin cơ bản về Site
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="siteName">
            Tên Site <span className="text-red-500">*</span>
          </Label>
          <Input
            id="siteName"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="VD: Site A1 - Bên Suối"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tên ngắn gọn, dễ nhớ để phân biệt các site
          </p>
        </div>

        <div>
          <Label htmlFor="siteClass">Phân loại Site</Label>
          <Select
            value={data.siteClass || "basic"}
            onValueChange={(v) => onChange({ siteClass: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Chọn loại site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Cơ bản (Standard)</SelectItem>
              <SelectItem value="vip">VIP (Premium)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Phân loại giúp khách hàng dễ dàng tìm kiếm và so sánh mức độ tiện nghi của bãi cắm.
          </p>
        </div>

        <div>
          <Label htmlFor="siteDescription">
            Mô tả Site <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="siteDescription"
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Mô tả vị trí, đặc điểm nổi bật, cảnh quan xung quanh của site này..."
            rows={6}
            maxLength={2000}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            {data.description?.length || 0}/2000 ký tự
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Mẹo viết mô tả hấp dẫn:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Mô tả vị trí cụ thể (gần suối, trên đồi, trong rừng...)</li>
            <li>Đề cập đến view, cảnh quan đặc biệt</li>
            <li>Nêu rõ điểm nổi bật (yên tĩnh, riêng tư, dễ tiếp cận...)</li>
            <li>Gợi ý hoạt động phù hợp với site này</li>
          </ul>
        </div>
      </div>
    </div>
  );
}