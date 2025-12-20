"use client";
import React, { useState, useEffect } from "react";
import StudentLayout from "../../../components/StudentLayout"; // <--- Import New Layout
import { CheckCircle, Briefcase, Clock } from "lucide-react";

export default function StudentDashboard() {
  const [userName, setUserName] = useState("Student");
  const [isOpenToWork, setIsOpenToWork] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserName(JSON.parse(storedUser).name);
    }
  }, []);

  return (
    <StudentLayout>
      <div className="p-8">
        
        {/* Header Section */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Hello, {userName}!</h1>
            <p className="text-gray-500 mt-1">Here is what's happening with your placements today.</p>
          </div>
          
          {/* THE TOGGLE SWITCH */}
          <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full shadow-sm border border-gray-200">
            <div 
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${isOpenToWork ? 'bg-green-500' : 'bg-gray-300'}`}
              onClick={() => setIsOpenToWork(!isOpenToWork)}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${isOpenToWork ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
            <span className={`text-sm font-semibold ${isOpenToWork ? 'text-green-600' : 'text-gray-500'}`}>
              {isOpenToWork ? "Open to Placement" : "Opted Out"}
            </span>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Applied Jobs" value="12" icon={Briefcase} color="blue" />
          <StatCard title="Interviews Scheduled" value="3" icon={Clock} color="orange" />
          <StatCard title="Offers Received" value="1" icon={CheckCircle} color="green" />
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Recent Applications</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center shadow-sm text-lg font-bold text-blue-600">G</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Software Engineer</h4>
                    <p className="text-sm text-gray-500">Google - Bangalore</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                  Under Review
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`p-4 rounded-lg ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
}
