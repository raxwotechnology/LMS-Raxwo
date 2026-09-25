import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await getAuthFromRequest(request);

    if (!auth || !auth.user) {
      return NextResponse.json({
        success: false,
        message: 'Not authorized'
      }, { status: 401 });
    }

    return NextResponse.json({
      message: 'Admin dashboard data',
      metrics: [
        { label: "Total earnings", value: "$17,280", icon: "📈", color: "#22C55E" },
        { label: "Earnings to paid", value: "$1,280", icon: "📉", color: "#EF4444" },
        { label: "Total enrollments", value: "427", icon: "📄", color: "#3B82F6" },
        { label: "Paid enrollments", value: "419", icon: "🔒", color: "#8B5CF6" },
        { label: "Pending enrollments", value: "8", icon: "⏰", color: "#F59E0B" },
        { label: "Course returns", value: "1", icon: "🔄", color: "#EF4444" },
      ],
      topCourses: [
        { name: "UX for business", enrollments: 163, price: "$49.99", color: "#8B5CF6" },
        { name: "Social media for freelancers", enrollments: 149, price: "$34.99", color: "#C4B5FD" },
        { name: "Create your first ebook", enrollments: 120, price: "$29.99", color: "#DDD6FE" },
      ],
      totalSales: 25000,
      status: 'success'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Server error'
    }, { status: 500 });
  }
}
