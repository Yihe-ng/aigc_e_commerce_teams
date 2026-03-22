"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchCalendarEvents } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const result = await fetchCalendarEvents();
        if (isMounted) {
          setData(result);
        }
      } catch (error) {
        console.error("加载数据失败:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">加载中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">营销日程</h1>

        {/* TODO: 实现页面内容 */}
        <Card>
          <CardHeader>
            <CardTitle>内容区域</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar></Calendar>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
