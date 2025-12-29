"use client";
import React, { useMemo, useState } from "react";
import CollegeLayout from "../../../components/CollegeLayout";
import {
  Search,
  ChevronDown,
  Filter,
  Download
} from "lucide-react";
import TopBarActions from "../../../components/TopBarActions";

const trendData = [
  { month: "Jul", offers: 20, accepted: 12, year: "2024", degree: "B.Tech", branch: "All" },
  { month: "Aug", offers: 45, accepted: 35, year: "2024", degree: "B.Tech", branch: "All" },
  { month: "Sep", offers: 120, accepted: 90, year: "2024", degree: "B.Tech", branch: "All" },
  { month: "Oct", offers: 180, accepted: 140, year: "2024", degree: "B.Tech", branch: "All" },
  { month: "Nov", offers: 260, accepted: 210, year: "2024", degree: "B.Tech", branch: "All" },
  { month: "Dec", offers: 220, accepted: 180, year: "2024", degree: "B.Tech", branch: "All" },
  { month: "Jan", offers: 150, accepted: 120, year: "2024", degree: "B.Tech", branch: "All" },
  { month: "Feb", offers: 100, accepted: 80, year: "2024", degree: "B.Tech", branch: "All" },
];

const departmentData = [
  { branch: "Computer Science", male: "98%", female: "99%", total: "98.5%", year: "2024", degree: "B.Tech" },
  { branch: "Electronics", male: "92%", female: "94%", total: "93%", year: "2024", degree: "B.Tech" },
  { branch: "Mechanical", male: "84%", female: "88%", total: "86%", year: "2024", degree: "B.Tech" },
];

const recruiters = [
  { name: "Accenture", offers: 124, progress: 85, year: "2024", degree: "B.Tech", branch: "All" },
  { name: "TCS", offers: 98, progress: 72, year: "2024", degree: "B.Tech", branch: "All" },
  { name: "Infosys", offers: 76, progress: 54, year: "2024", degree: "B.Tech", branch: "All" },
];

export default function CollegeStatisticsPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("Academic Year 2024");
  const [degreeFilter, setDegreeFilter] = useState("Degree: B.Tech");
  const [branchFilter, setBranchFilter] = useState("Branch: All");
  const [showFilters, setShowFilters] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const filteredTrendData = useMemo(() => {
    const yearKey = yearFilter.includes("2024") ? "2024" : yearFilter.includes("2023") ? "2023" : "2022";
    const degreeKey = degreeFilter.includes("B.Tech") ? "B.Tech" : degreeFilter.includes("M.Tech") ? "M.Tech" : "MBA";
    const branchKey = branchFilter.includes("All") ? "All" : branchFilter.split(": ")[1] || "All";

    return trendData.filter((item) => {
      const matchesYear = item.year === yearKey;
      const matchesDegree = item.degree === degreeKey;
      const matchesBranch = item.branch === "All" || branchKey === "All" || item.branch === branchKey;
      return matchesYear && matchesDegree && matchesBranch;
    });
  }, [yearFilter, degreeFilter, branchFilter]);

  const chart = useMemo(() => {
    const width = 600;
    const height = 200;
    const dataToUse = filteredTrendData.length > 0 ? filteredTrendData : trendData;
    const maxValue = 260;
    const step = width / (dataToUse.length - 1);
    const buildPath = (key: "offers" | "accepted") =>
      dataToUse
        .map((point, index) => {
          const x = index * step;
          const y = height - (point[key] / maxValue) * height;
          return `${index === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");
    return {
      width,
      height,
      maxValue,
      offersPath: buildPath("offers"),
      acceptedPath: buildPath("accepted"),
      data: dataToUse,
    };
  }, [filteredTrendData]);

  const yTicks = [0, 50, 100, 150, 200, 250];

  const handleExport = () => {
    setExportMessage("Export started. Use the print dialog to save as PDF.");
    window.print();
  };

  const filteredRecruiters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const yearKey = yearFilter.includes("2024") ? "2024" : yearFilter.includes("2023") ? "2023" : "2022";
    const degreeKey = degreeFilter.includes("B.Tech") ? "B.Tech" : degreeFilter.includes("M.Tech") ? "M.Tech" : "MBA";
    const branchKey = branchFilter.includes("All") ? "All" : branchFilter.split(": ")[1] || "All";

    let filtered = recruiters.filter((item) => {
      const matchesSearch = !term || item.name.toLowerCase().includes(term);
      const matchesYear = item.year === yearKey;
      const matchesDegree = item.degree === degreeKey;
      const matchesBranch = item.branch === "All" || branchKey === "All" || item.branch === branchKey;
      return matchesSearch && matchesYear && matchesDegree && matchesBranch;
    });

    return filtered.length > 0 ? filtered : recruiters;
  }, [searchTerm, yearFilter, degreeFilter, branchFilter]);

  const filteredDepartmentData = useMemo(() => {
    const yearKey = yearFilter.includes("2024") ? "2024" : yearFilter.includes("2023") ? "2023" : "2022";
    const degreeKey = degreeFilter.includes("B.Tech") ? "B.Tech" : degreeFilter.includes("M.Tech") ? "M.Tech" : "MBA";

    return departmentData.filter((item) => {
      const matchesYear = item.year === yearKey;
      const matchesDegree = item.degree === degreeKey;
      return matchesYear && matchesDegree;
    });
  }, [yearFilter, degreeFilter]);

  return (
    <CollegeLayout>
      <div className="px-8 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Placement Statistics</h1>
            <p className="text-sm text-slate-500">Deep dive into recruitment performance metrics.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <Search size={16} className="text-slate-400" />
              <input
                placeholder="Search data points..."
                className="outline-none text-sm w-44 text-slate-600"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <TopBarActions settingsPath="/college/settings" />
          </div>
        </header>

        {exportMessage && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {exportMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          {["Overview", "Demographics", "Company Performance", "Year-over-Year"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                activeTab === tab ? "bg-blue-50 text-blue-700" : "bg-white border border-slate-200 text-slate-500"
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="appearance-none border border-slate-200 rounded-lg px-3 py-2 pr-7 text-sm text-slate-600 bg-white"
              >
                <option>Academic Year 2024</option>
                <option>Academic Year 2023</option>
                <option>Academic Year 2022</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-2.5 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={degreeFilter}
                onChange={(event) => setDegreeFilter(event.target.value)}
                className="appearance-none border border-slate-200 rounded-lg px-3 py-2 pr-7 text-sm text-slate-600 bg-white"
              >
                <option>Degree: B.Tech</option>
                <option>Degree: M.Tech</option>
                <option>Degree: MBA</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-2.5 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={branchFilter}
                onChange={(event) => setBranchFilter(event.target.value)}
                className="appearance-none border border-slate-200 rounded-lg px-3 py-2 pr-7 text-sm text-slate-600 bg-white"
              >
                <option>Branch: All</option>
                <option>Branch: CSE</option>
                <option>Branch: ECE</option>
                <option>Branch: ME</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-2.5 text-slate-400" />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center"
            >
              <Filter size={16} />
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold"
            >
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-800 mb-2">Applied Filters</div>
            <div className="text-xs text-slate-500">
              {yearFilter} · {degreeFilter} · {branchFilter}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="mt-4 text-xs text-blue-600 font-semibold"
            >
              Close filters
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Placement Rate", value: "87.4%", change: "+4.2%", detail: "736 of 842 eligible students placed" },
            { label: "Avg Package", value: "Rs 12.5 L", change: "+15%", detail: "Median Rs 10.2 L | Highest Rs 45.0 L" },
            { label: "Active Companies", value: "142", change: "+0.0%", detail: "G M A 139" },
            { label: "Offer Letters", value: "985", change: "1.3x", detail: "Average 1.3 offers per student" },
          ].map((card) => (
            <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-xs text-slate-500 uppercase">{card.label}</div>
              <div className="text-2xl font-semibold text-slate-900 mt-2">{card.value}</div>
              <div className="text-xs text-emerald-500 mt-1">{card.change}</div>
              <div className="text-xs text-slate-400 mt-2">{card.detail}</div>
              <div className="mt-3 h-1 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-3/5 bg-blue-600"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">Placement Trends Over Time</div>
                <div className="text-xs text-slate-500">Month-wise analysis of offers rolled out vs accepted.</div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span> Offers
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Accepted
                </span>
              </div>
            </div>
            <div className="relative">
              <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="w-full h-52">
                {yTicks.map((tick) => {
                  const y = chart.height - (tick / chart.maxValue) * chart.height;
                  return (
                    <line
                      key={tick}
                      x1={0}
                      x2={chart.width}
                      y1={y}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                    />
                  );
                })}
                <path d={chart.offersPath} fill="none" stroke="#2563EB" strokeWidth="3" />
                <path d={chart.acceptedPath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeDasharray="5 5" />
                {chart.data.map((point, index) => {
                  const x = (chart.width / (chart.data.length - 1)) * index;
                  const offersY = chart.height - (point.offers / chart.maxValue) * chart.height;
                  const acceptedY = chart.height - (point.accepted / chart.maxValue) * chart.height;
                  return (
                    <g key={point.month}>
                      <circle cx={x} cy={offersY} r="4" fill="#2563EB" />
                      <circle cx={x} cy={acceptedY} r="4" fill="#10B981" />
                    </g>
                  );
                })}
              </svg>
              <div className="mt-3 grid text-xs text-slate-500" style={{ gridTemplateColumns: `repeat(${chart.data.length}, minmax(0, 1fr))` }}>
                {chart.data.map((point) => (
                  <div key={point.month} className="text-center">{point.month}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-800">Salary Range Analysis</div>
            <div className="text-xs text-slate-500">Breakdown of CTC offered</div>
            <div className="mt-6 flex flex-col items-center">
              <div className="relative h-32 w-32 rounded-full border-[10px] border-slate-100 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[10px] border-blue-500 border-t-emerald-400 border-r-blue-400"></div>
                <div className="text-center text-xs text-slate-400">Avg</div>
              </div>
              <div className="mt-6 w-full space-y-2 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Super Dream (&gt;20L)</span>
                  <span className="text-slate-700">18%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dream (10-20L)</span>
                  <span className="text-slate-700">32%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Standard (5-10L)</span>
                  <span className="text-slate-700">40%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Basic (&lt;5L)</span>
                  <span className="text-slate-700">10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">Department Performance</div>
                <div className="text-xs text-slate-500">Placement % by branch and gender</div>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="text-xs text-blue-600 font-semibold"
              >
                Full Report
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 uppercase">
                <tr>
                  <th className="py-2">Branch</th>
                  <th className="py-2">Male</th>
                  <th className="py-2">Female</th>
                  <th className="py-2">Total %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredDepartmentData.length > 0 ? filteredDepartmentData : departmentData).map((row) => (
                  <tr key={row.branch}>
                    <td className="py-3 text-slate-700">{row.branch}</td>
                    <td className="py-3">
                      <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">{row.male}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{row.female}</span>
                    </td>
                    <td className="py-3 text-slate-600">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">Top Recruiters</div>
                <div className="text-xs text-slate-500">By number of offers rolled out</div>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">This Year</span>
            </div>
            <div className="space-y-4">
              {filteredRecruiters.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm text-slate-700 mb-2">
                    <span>{item.name}</span>
                    <span className="text-slate-500">{item.offers}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>
              ))}
              {filteredRecruiters.length === 0 && (
                <div className="text-xs text-slate-400">No recruiters match this search.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CollegeLayout>
  );
}
