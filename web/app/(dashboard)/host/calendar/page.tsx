'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar as CalendarIcon, Info, ShieldAlert, Loader2, DollarSign, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getMyProperties, getSitesByProperty } from '@/lib/property-site-api';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function HostCalendarPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Date selection
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);

  // Availability calendar details
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [availabilityData, setAvailabilityData] = useState<any>({ bookings: [], blocks: [] });
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Seasonal pricing form
  const [seasonalPricing, setSeasonalPricing] = useState<any[]>([]);
  const [newRule, setNewRule] = useState({
    name: '',
    startDate: '',
    endDate: '',
    price: '',
  });

  // Load properties on mount
  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await getMyProperties();
        console.log('getMyProperties response:', res);

        let list: any[] = [];
        if (res && res.properties && Array.isArray(res.properties)) {
          list = res.properties;
        } else if (res && res.data?.properties && Array.isArray(res.data.properties)) {
          list = res.data.properties;
        } else if (res && Array.isArray(res.data)) {
          list = res.data;
        } else if (Array.isArray(res)) {
          list = res;
        }

        setProperties(list);
        if (list.length > 0) {
          setSelectedPropertyId(list[0]._id);
        }
      } catch (err) {
        toast.error('Lỗi khi tải danh sách khu cắm trại');
      }
    }
    loadProperties();
  }, []);

  // Load sites when property changes
  useEffect(() => {
    async function loadSites() {
      if (!selectedPropertyId) return;
      try {
        const res = await getSitesByProperty(selectedPropertyId);
        // getSitesByProperty returns the axios response.data, which is likely { success, data: { sites, pagination } } or { sites }
        const sitesList = res?.data?.sites || res?.sites || [];
        setSites(sitesList);
        if (sitesList.length > 0) {
          setSelectedSiteId(sitesList[0]._id);
        } else {
          setSelectedSiteId('');
        }
      } catch (err) {
        toast.error('Lỗi khi tải các site con');
      }
    }
    loadSites();
  }, [selectedPropertyId]);

  // Fetch calendar availability when site or month changes
  useEffect(() => {
    async function fetchCalendar() {
      if (!selectedSiteId) return;
      setLoadingCalendar(true);
      try {
        const token = localStorage.getItem('accessToken');
        const monthStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}`;
        const res = await fetch(`${API}/sites/${selectedSiteId}/availability-calendar?month=${monthStr}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAvailabilityData(data.data || { bookings: [], blocks: [] });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCalendar(false);
      }
    }

    // Load site details for seasonal pricing
    async function loadSiteDetails() {
      if (!selectedSiteId) return;
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API}/sites/${selectedSiteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSeasonalPricing(data.data?.pricing?.seasonalPricing || []);
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchCalendar();
    loadSiteDetails();
    setSelectedDays([]); // Reset selection when site changes
  }, [selectedSiteId, calendarMonth]);

  // Action: Block Selected Days
  const handleBlockDates = async () => {
    if (selectedDays.length === 0 || !selectedSiteId) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const formattedDates = selectedDays.map(d => d.toISOString().split('T')[0]);
      const res = await fetch(`${API}/sites/${selectedSiteId}/block-dates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dates: formattedDates,
          reason: 'Bảo trì định kỳ / Chủ nhà đóng',
        }),
      });

      if (res.ok) {
        toast.success(`Đã chặn thành công ${selectedDays.length} ngày`);
        setSelectedDays([]);
        // Refresh calendar
        const monthStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}`;
        const calRes = await fetch(`${API}/sites/${selectedSiteId}/availability-calendar?month=${monthStr}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (calRes.ok) {
          const calData = await calRes.json();
          setAvailabilityData(calData.data);
        }
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Lỗi khi đóng lịch');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Unblock Selected Days
  const handleUnblockDates = async () => {
    if (selectedDays.length === 0 || !selectedSiteId) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const formattedDates = selectedDays.map(d => d.toISOString().split('T')[0]);
      const res = await fetch(`${API}/sites/${selectedSiteId}/block-dates`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dates: formattedDates,
        }),
      });

      if (res.ok) {
        toast.success(`Đã mở chặn thành công ${selectedDays.length} ngày`);
        setSelectedDays([]);
        // Refresh calendar
        const monthStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}`;
        const calRes = await fetch(`${API}/sites/${selectedSiteId}/availability-calendar?month=${monthStr}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (calRes.ok) {
          const calData = await calRes.json();
          setAvailabilityData(calData.data);
        }
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Lỗi khi mở lịch');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Add Seasonal Pricing Rule
  const handleAddSeasonalRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.startDate || !newRule.endDate || !newRule.price || !selectedSiteId) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const updatedRules = [
        ...seasonalPricing.map(r => ({
          name: r.name,
          startDate: r.startDate,
          endDate: r.endDate,
          price: r.price,
        })),
        {
          name: newRule.name,
          startDate: newRule.startDate,
          endDate: newRule.endDate,
          price: Number(newRule.price),
        },
      ];

      const res = await fetch(`${API}/sites/${selectedSiteId}/seasonal-pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seasonalPricing: updatedRules }),
      });

      if (res.ok) {
        toast.success('Thêm cấu hình giá mùa vụ thành công');
        const data = await res.json();
        setSeasonalPricing(data.data?.pricing?.seasonalPricing || []);
        setNewRule({ name: '', startDate: '', endDate: '', price: '' });
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Lỗi cấu hình giá mùa vụ');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Delete Seasonal Rule
  const handleDeleteSeasonalRule = async (indexToDelete: number) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const updatedRules = seasonalPricing
        .filter((_, idx) => idx !== indexToDelete)
        .map(r => ({
          name: r.name,
          startDate: r.startDate,
          endDate: r.endDate,
          price: r.price,
        }));

      const res = await fetch(`${API}/sites/${selectedSiteId}/seasonal-pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seasonalPricing: updatedRules }),
      });

      if (res.ok) {
        toast.success('Đã xoá cấu hình giá');
        const data = await res.json();
        setSeasonalPricing(data.data?.pricing?.seasonalPricing || []);
      } else {
        toast.error('Lỗi khi xoá cấu hình');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to color code calendar cells
  const getDayClassName = (date: Date) => {
    // Check if is manual blocked
    const dateStr = date.toISOString().split('T')[0];
    const isManualBlock = availabilityData.blocks?.some(
      (b: any) => b.date?.split('T')[0] === dateStr && !b.isAvailable
    );
    if (isManualBlock) return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 font-bold border border-red-300';

    // Check if booked
    const isBooked = availabilityData.bookings?.some((b: any) => {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      // Clean time values for exact matches
      const checkInStr = checkIn.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];
      return dateStr >= checkInStr && dateStr <= checkOutStr;
    });

    if (isBooked) return 'bg-slate-200 text-slate-800 dark:bg-slate-800/80 dark:text-slate-400 line-through';

    return 'hover:bg-indigo-50 hover:text-indigo-900';
  };

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-650 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Quản Lý Lịch & Giá Mùa Vụ
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Thiết lập trạng thái hoạt động của bãi cắm trại và quản lý các khoảng giá đặc biệt theo các mùa trong năm.
        </p>
      </div>

      {/* Property and Site Selectors */}
      <div className="grid gap-4 md:grid-cols-2 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-850">
        <div className="space-y-1.5">
          <Label htmlFor="property" className="text-xs font-bold uppercase tracking-wider text-slate-400">Khu cắm trại chính</Label>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger id="property" className="bg-transparent border-slate-200 dark:border-slate-800 rounded-xl h-11">
              <SelectValue placeholder="Chọn khu cắm trại" />
            </SelectTrigger>
            <SelectContent>
              {properties.map(p => (
                <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="site" className="text-xs font-bold uppercase tracking-wider text-slate-400">Vị trí cắm trại cụ thể (Site)</Label>
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId} disabled={sites.length === 0}>
            <SelectTrigger id="site" className="bg-transparent border-slate-200 dark:border-slate-800 rounded-xl h-11">
              <SelectValue placeholder={sites.length === 0 ? 'Khu đất chưa có site nào' : 'Chọn site'} />
            </SelectTrigger>
            <SelectContent>
              {sites.map(s => (
                <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedSiteId ? (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-850">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-md font-extrabold text-slate-800 dark:text-white">Lịch hoạt động</CardTitle>
                  <CardDescription className="text-xs">Chọn các ngày trên lịch để đóng bãi hoặc mở lại.</CardDescription>
                </div>
                {loadingCalendar && <Loader2 className="h-4 w-4 animate-spin text-indigo-650" />}
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Calendar
                  mode="multiple"
                  selected={selectedDays}
                  onSelect={(days) => setSelectedDays(days || [])}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900/40 p-4"
                  modifiers={{
                    blocked: (date) => {
                      const dateStr = date.toISOString().split('T')[0];
                      return !!availabilityData.blocks?.some(
                        (b: any) => b.date?.split('T')[0] === dateStr && !b.isAvailable
                      );
                    },
                    booked: (date) => {
                      const dateStr = date.toISOString().split('T')[0];
                      return !!availabilityData.bookings?.some((b: any) => {
                        const checkIn = new Date(b.checkIn);
                        const checkOut = new Date(b.checkOut);
                        const checkInStr = checkIn.toISOString().split('T')[0];
                        const checkOutStr = checkOut.toISOString().split('T')[0];
                        return dateStr >= checkInStr && dateStr <= checkOutStr;
                      });
                    }
                  }}
                  modifiersClassNames={{
                    selected: 'bg-indigo-600 text-white font-extrabold rounded-lg',
                    blocked: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 font-bold border border-red-300',
                    booked: 'bg-slate-200 text-slate-800 dark:bg-slate-800/80 dark:text-slate-400 line-through'
                  }}
                />

                {/* Control Panel */}
                <div className="flex-1 w-full space-y-4">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3 border border-slate-100 dark:border-slate-850">
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Thông tin lựa chọn</h4>
                    <p className="text-sm font-semibold">
                      Đang chọn: <span className="text-indigo-600 font-extrabold">{selectedDays.length} ngày</span>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        disabled={selectedDays.length === 0 || actionLoading}
                        onClick={handleBlockDates}
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Chặn lịch'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-slate-200"
                        disabled={selectedDays.length === 0 || actionLoading}
                        onClick={handleUnblockDates}
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mở lịch'}
                      </Button>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="text-xs space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <h4 className="font-extrabold uppercase text-slate-400 tracking-wider text-[10px]">Chú thích lịch</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-white border border-slate-200 inline-block" />
                        <span className="text-slate-500 font-medium">Hoạt động bình thường</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-red-100 border border-red-300 inline-block" />
                        <span className="text-slate-500 font-medium">Chủ nhà chặn đóng</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-slate-200 inline-block line-through" />
                        <span className="text-slate-500 font-medium">Đã được khách đặt</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-indigo-600 inline-block" />
                        <span className="text-slate-500 font-medium">Các ngày đang chọn</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* List of bookings in month */}
            <Card className="border border-slate-200/80 dark:border-slate-850">
              <CardHeader className="pb-3">
                <CardTitle className="text-md font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-indigo-500" />
                  Danh sách đặt phòng trong tháng
                </CardTitle>
                <CardDescription className="text-xs">
                  Danh sách các booking của site này trong tháng {calendarMonth.getMonth() + 1}/{calendarMonth.getFullYear()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availabilityData.bookings?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Chưa có khách cắm trại trong tháng này</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {availabilityData.bookings?.map((b: any) => (
                      <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-slate-200">{b.guestName}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(b.checkIn).toLocaleDateString('vi-VN')} - {new Date(b.checkOut).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600 dark:text-indigo-400">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.totalPrice)}
                          </p>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 mt-0.5 capitalize">
                            {b.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pricing Panel */}
          <div className="space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-850">
              <CardHeader>
                <CardTitle className="text-md font-extrabold text-slate-800 dark:text-white">Thiết lập giá mùa vụ</CardTitle>
                <CardDescription className="text-xs">Cấu hình mức giá đặc biệt cho mùa cao điểm hoặc dịp lễ.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleAddSeasonalRule} className="space-y-3.5">
                  <div className="space-y-1">
                    <Label htmlFor="rule-name" className="text-xs font-semibold text-slate-500">Tên mùa vụ / Dịp lễ</Label>
                    <Input
                      id="rule-name"
                      placeholder="Ví dụ: Lễ Tết, Mùa Hè 2026"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="start" className="text-xs font-semibold text-slate-500">Bắt đầu</Label>
                      <Input
                        id="start"
                        type="date"
                        value={newRule.startDate}
                        onChange={(e) => setNewRule({ ...newRule, startDate: e.target.value })}
                        className="rounded-xl h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="end" className="text-xs font-semibold text-slate-500">Kết thúc</Label>
                      <Input
                        id="end"
                        type="date"
                        value={newRule.endDate}
                        onChange={(e) => setNewRule({ ...newRule, endDate: e.target.value })}
                        className="rounded-xl h-10 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="price" className="text-xs font-semibold text-slate-500">Giá mới mỗi đêm (₫)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="price"
                        type="number"
                        placeholder="Giá/đêm"
                        value={newRule.price}
                        onChange={(e) => setNewRule({ ...newRule, price: e.target.value })}
                        className="rounded-xl h-10 pl-9 text-xs"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 text-xs font-bold" disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Thêm cấu hình giá'}
                  </Button>
                </form>

                <Separator />

                {/* List of rules */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Các mùa đã cấu hình</h4>
                  {seasonalPricing.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Chưa có mức giá mùa vụ nào</p>
                  ) : (
                    <div className="space-y-3.5">
                      {seasonalPricing.map((rule, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850 flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{rule.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {new Date(rule.startDate).toLocaleDateString('vi-VN')} - {new Date(rule.endDate).toLocaleDateString('vi-VN')}
                            </p>
                            <p className="text-xs font-black text-indigo-650 dark:text-indigo-400 mt-1.5">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rule.price)} / đêm
                            </p>
                          </div>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg" onClick={() => handleDeleteSeasonalRule(idx)}>
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 rounded-2xl">
          <CalendarIcon className="h-12 w-12 text-slate-300 animate-pulse" />
          <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">Chưa lựa chọn site</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            Vui lòng chọn khu cắm trại chính và bãi cắm chi tiết (Site) ở bộ lọc phía trên để quản lý lịch hoạt động và cấu hình giá mùa vụ.
          </p>
        </div>
      )}
    </div>
  );
}
