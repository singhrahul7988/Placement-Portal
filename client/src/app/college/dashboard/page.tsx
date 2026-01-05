"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import CollegeLayout from "../../../components/CollegeLayout";
import {
  Users,
  Briefcase,
  CheckCircle,
  TrendingUp,
  Search,
  ChevronDown,
  ArrowUpRight,
  CalendarCheck,
  ClipboardList,
  UploadCloud,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import TopBarActions from "../../../components/TopBarActions";
import api from "@/lib/api";

type DashboardStats = {
  availableData: boolean;
  totals: {
    totalStudents: number;
    jobProfiles: number;
    totalOffers: number;
    placedStudents: number;
  };
  analytics: {
    departments: { department: string; eligible: number; placed: number }[];
    max: number;
  };
  salary: {
    average: number;
    ranges: { label: string; count: number; percent: number }[];
  };
  trends: {
    months: { label: string; placed: number; unplaced: number; total: number }[];
  };
};

type PlacementRecord = {
  _id: string;
  studentId: string;
  studentName: string;
  department: string;
  classYear: string;
  companyName: string;
  jobProfile: string;
  offersReceived: number;
  ctcLpa: number;
  placedStatus: string;
  offerDate?: string;
};

type CompanySummary = {
  name: string;
  isExternal: boolean;
  isActivePartner: boolean;
  hasDrives: boolean;
  hasRecords: boolean;
  totalOffers: number;
  placedStudents: number;
  averageCtc: number;
  maxCtc: number;
  driveCount: number;
  jobProfiles: number;
};

type DriveItem = {
  id: string;
  company: string;
  role: string;
  date: string;
  status: string;
};

const actionItems = [
  { title: "Resume submission deadline", detail: "Google drives resume list due by 5 PM.", tag: "2 left" },
  { title: "Pre-placement talk: Cisco", detail: "Mandatory for all CS students.", tag: "Today" },
];

const defaultYears = Array.from({ length: 11 }, (_, index) => String(2020 + index));
const defaultDepartments = ["COE", "ECE", "COPC", "ENC"];

const getCollegeIdFromStorage = () => {
  if (typeof window === "undefined") return "";
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return "";
  try {
    const user = JSON.parse(storedUser);
    return user.role === "college" ? user._id : user.collegeId;
  } catch {
    return "";
  }
};

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

export default function CollegeDashboard() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [yearFilter, setYearFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [availableYears, setAvailableYears] = useState<string[]>(defaultYears);
  const [allDepartments, setAllDepartments] = useState<string[]>(defaultDepartments);
  const [departmentsByYear, setDepartmentsByYear] = useState<Record<string, string[]>>({});
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [drives, setDrives] = useState<DriveItem[]>([]);
  const [records, setRecords] = useState<PlacementRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pendingUpload, setPendingUpload] = useState<File | null>(null);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companyFilter, setCompanyFilter] = useState("participated");
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const { data } = await api.get("/api/placements/filters");
        const years = data?.years || [];
        const departments = data?.departments || [];
        const byYear = data?.departmentsByYear || {};
        if (years.length > 0) {
          const mergedYears = Array.from(new Set([...defaultYears, ...years])).sort();
          setAvailableYears(mergedYears);
        }
        if (departments.length > 0) {
          const mergedDepartments = Array.from(new Set([...defaultDepartments, ...departments])).sort();
          setAllDepartments(mergedDepartments);
        }
        if (Object.keys(byYear).length > 0) {
          setDepartmentsByYear(byYear);
        }
      } catch {
        setAvailableYears(defaultYears);
        setAllDepartments(defaultDepartments);
        setDepartmentsByYear({});
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const yearDepartments = departmentsByYear[yearFilter] || [];
    const validDepartments =
      yearFilter !== "all"
        ? yearDepartments.length > 0
          ? Array.from(new Set([...allDepartments, ...yearDepartments]))
          : allDepartments
        : allDepartments;
    if (departmentFilter !== "all" && !validDepartments.includes(departmentFilter)) {
      setDepartmentFilter("all");
    }
  }, [yearFilter, departmentsByYear, allDepartments, departmentFilter]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError("");
        const params = new URLSearchParams({
          year: yearFilter,
          department: departmentFilter,
        });
        const { data } = await api.get(`/api/placements/stats?${params.toString()}`);
        setStats(data);
      } catch {
        setStatsError("Unable to load dashboard data.");
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [yearFilter, departmentFilter]);

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const collegeId = getCollegeIdFromStorage();
        if (!collegeId) return;
        const { data } = await api.get(`/api/jobs/feed/${collegeId}`);
        const mapped = (data || []).map((drive: any) => ({
          id: drive._id,
          company: drive.companyId?.name || "Company",
          role: drive.title || "Role",
          date: drive.deadline ? new Date(drive.deadline).toLocaleDateString() : "N/A",
          status: drive.status || "Open",
        }));
        setDrives(mapped);
      } catch {
        setDrives([]);
      }
    };
    fetchDrives();
  }, []);

  useEffect(() => {
    if (activeTab !== "Placement Records") return;
    const fetchRecords = async () => {
      try {
        setRecordsLoading(true);
        const params = new URLSearchParams({
          year: yearFilter,
          department: departmentFilter,
        });
        const { data } = await api.get(`/api/placements/records?${params.toString()}`);
        setRecords(data?.records || []);
      } catch {
        setRecords([]);
      } finally {
        setRecordsLoading(false);
      }
    };
    fetchRecords();
  }, [activeTab, yearFilter, departmentFilter]);

  useEffect(() => {
    if (activeTab !== "Companies") return;
    const fetchCompanies = async () => {
      try {
        setCompaniesLoading(true);
        const params = new URLSearchParams({
          year: yearFilter,
          department: departmentFilter,
          filter: companyFilter,
        });
        const { data } = await api.get(`/api/placements/companies?${params.toString()}`);
        setCompanies(data?.companies || []);
      } catch {
        setCompanies([]);
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, [activeTab, yearFilter, departmentFilter, companyFilter]);

  const handleExport = () => {
    const header = ["Company", "Role", "Date", "Status"];
    const rows = drives.map((drive) => [drive.company, drive.role, drive.date, drive.status]);
    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "college_overview.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (forceReplace = false, fileOverride?: File | null) => {
    const file = fileOverride || uploadFile;
    if (!file) {
      setUploadError("Select an Excel file to upload.");
      return;
    }
    if (yearFilter === "all" || departmentFilter === "all") {
      setUploadError("Select a specific year and department before uploading.");
      return;
    }

    try {
      setUploadError("");
      const params = new URLSearchParams({
        year: yearFilter,
        department: departmentFilter,
        limit: "1",
      });
      const { data } = await api.get(`/api/placements/records?${params.toString()}`);
      if (data?.total > 0 && !forceReplace) {
        setPendingUpload(file);
        setConfirmOpen(true);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("classYear", yearFilter);
      formData.append("department", departmentFilter);
      formData.append("replace", String(forceReplace));

      const response = await api.post("/api/placements/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const message = response?.data?.message || "Upload complete.";
      const summary = `Imported ${response?.data?.imported || 0} rows, skipped ${response?.data?.skipped || 0}.`;
      setUploadMessage(`${message} ${summary}`.trim());
      setUploadFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setConfirmOpen(false);
      setConfirmText("");
      setPendingUpload(null);
      const statsParams = new URLSearchParams({
        year: yearFilter,
        department: departmentFilter,
      });
      const [statsResponse, recordsResponse] = await Promise.all([
        api.get(`/api/placements/stats?${statsParams.toString()}`),
        api.get(`/api/placements/records?${statsParams.toString()}`),
      ]);
      setStats(statsResponse.data);
      setRecords(recordsResponse?.data?.records || []);
    } catch (error: any) {
      setUploadError(error?.response?.data?.message || "Upload failed.");
    }
  };

  const handleConfirmUpload = () => {
    if (confirmText !== "confirm") {
      setUploadError('Type "confirm" to replace existing records.');
      return;
    }
    handleUpload(true, pendingUpload);
  };

  const filteredDrives = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return drives;
    return drives.filter((drive) =>
      `${drive.company} ${drive.role}`.toLowerCase().includes(term)
    );
  }, [drives, searchTerm]);

  const filteredActions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return actionItems;
    return actionItems.filter((item) =>
      `${item.title} ${item.detail}`.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) =>
      `${record.studentId} ${record.studentName} ${record.companyName} ${record.jobProfile}`
        .toLowerCase()
        .includes(term)
    );
  }, [records, searchTerm]);

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((company) =>
      company.name.toLowerCase().includes(term)
    );
  }, [companies, searchTerm]);

  const statCards = [
    {
      title: "Total Students",
      value: stats?.totals.totalStudents ?? 0,
      icon: Users,
      color: "blue",
      detail: "From placement records",
    },
    {
      title: "Job Profiles",
      value: stats?.totals.jobProfiles ?? 0,
      icon: Briefcase,
      color: "green",
      detail: "Unique roles offered",
    },
    {
      title: "Total Offers",
      value: stats?.totals.totalOffers ?? 0,
      icon: CheckCircle,
      color: "amber",
      detail: "Sum of offers received",
    },
    {
      title: "Placed Students",
      value: stats?.totals.placedStudents ?? 0,
      icon: TrendingUp,
      color: "purple",
      detail: "Unique students with offers",
    },
  ];

  const analyticsData = stats?.analytics?.departments || [];
  const chartHeight = 220;
  const chartLabelHeight = 24;
  const chartMax = Math.max(stats?.analytics?.max || 0, 10);
  const tickCount = 6;
  const tickStep = Math.ceil(chartMax / tickCount);
  const chartTicks = Array.from({ length: tickCount + 1 }, (_, index) => chartMax - index * tickStep);
  const scaleValue = (value: number) => (value / chartMax) * chartHeight;

  const trends = stats?.trends?.months || [];
  const trendMax = Math.max(
    1,
    ...trends.map((item) => Math.max(item.total, item.placed, item.unplaced))
  );
  const trendWidth = 520;
  const trendHeight = 160;
  const buildTrendPath = (key: "total" | "placed" | "unplaced") => {
    if (trends.length === 0) return "";
    const step = trends.length > 1 ? trendWidth / (trends.length - 1) : trendWidth;
    return trends
      .map((point, index) => {
        const x = index * step;
        const y = trendHeight - (point[key] / trendMax) * trendHeight;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const noDataForYear = stats && !stats.availableData && yearFilter !== "all";

  const yearDepartments = departmentsByYear[yearFilter] || [];
  const departmentOptions =
    yearFilter !== "all"
      ? yearDepartments.length > 0
        ? Array.from(new Set([...allDepartments, ...yearDepartments]))
        : allDepartments
      : allDepartments;

  return (
    <CollegeLayout>
      <div className="px-8 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Placement Overview</h1>
            <p className="text-sm text-slate-500">Welcome back, here is what is happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <Search size={16} className="text-slate-400" />
              <input
                placeholder="Search..."
                className="outline-none text-sm w-40 text-slate-600"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <TopBarActions settingsPath="/college/settings" />
          </div>
        </header>

        {statsError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {statsError}
          </div>
        )}

        {noDataForYear && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No data is available for the selected year.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          {["Overview", "Trends", "Companies", "Placement Records"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm px-3 py-1.5 rounded-lg hover:bg-white ${
                activeTab === tab ? "text-blue-600 font-semibold" : "text-slate-500"
              }`}
            >
              {tab}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="appearance-none flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 pr-7 text-sm text-slate-600"
              >
                <option value="all">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>{`Class of ${year}`}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-2.5 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="appearance-none flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 pr-7 text-sm text-slate-600"
              >
                <option value="all">All Departments</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-2.5 text-slate-400" />
            </div>
            {activeTab === "Overview" && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold shadow-sm"
              >
                Export
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </div>

        {activeTab === "Overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {statCards.map((stat) => (
                <div key={stat.title} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-slate-500">{stat.title}</div>
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                        stat.color === "blue"
                          ? "bg-blue-50 text-blue-600"
                          : stat.color === "green"
                          ? "bg-emerald-50 text-emerald-600"
                          : stat.color === "amber"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      <stat.icon size={18} />
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {statsLoading ? "..." : stat.value}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{stat.detail}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 mb-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Placement Analytics</h3>
                    <p className="text-xs text-slate-500">Eligible vs placed students across departments.</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs bg-white border border-slate-200 rounded-full px-4 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]"></span>
                      <span className="text-slate-600">Eligible</span>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]"></span>
                      <span className="text-slate-600">Placed</span>
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-[40px_1fr] gap-6">
                  <div className="flex flex-col justify-between text-[11px] text-slate-400" style={{ height: `${chartHeight}px` }}>
                    {chartTicks.map((value) => (
                      <div key={value} className="text-right">{value}</div>
                    ))}
                  </div>
                  <div>
                    <div className="relative" style={{ height: `${chartHeight}px` }}>
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {chartTicks.map((value) => (
                          <div key={value} className="border-b border-slate-200"></div>
                        ))}
                      </div>
                      <div className="relative flex items-end gap-4 px-1 h-full">
                        {analyticsData.map((item) => (
                          <div key={item.department} className="flex items-end justify-center flex-1">
                            <div className="flex items-end justify-center gap-4 w-full">
                              <div
                                className="w-4 rounded-t-sm bg-[#2563EB]"
                                style={{ height: `${scaleValue(item.eligible)}px` }}
                              ></div>
                              <div
                                className="w-4 rounded-t-sm bg-[#10B981]"
                                style={{ height: `${scaleValue(item.placed)}px` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 border-t border-slate-200"></div>
                    <div className="mt-2 flex items-center gap-4 px-1" style={{ height: `${chartLabelHeight}px` }}>
                      {analyticsData.map((item) => (
                        <span key={item.department} className="flex-1 text-center text-xs text-slate-500">
                          {item.department}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Salary Packages</h3>
                <p className="text-xs text-slate-500 mt-1">Distribution by LPA</p>

                <div className="mt-6 flex flex-col items-center">
                  <div className="relative h-36 w-36 rounded-full border-[10px] border-slate-100 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[10px] border-blue-500 border-t-emerald-400 border-r-blue-400"></div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400">Avg</div>
                      <div className="text-lg font-semibold text-slate-900">
                        {stats?.salary?.average || 0} L
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 w-full space-y-3 text-xs text-slate-500">
                    {stats?.salary?.ranges?.map((range) => (
                      <div key={range.label} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-600"></span> {range.label}
                        <span className="ml-auto text-slate-700">{range.percent}%</span>
                      </div>
                    ))}
                    {!stats?.salary?.ranges?.length && (
                      <div className="text-xs text-slate-400">No salary data yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Upcoming Campus Drives</h3>
                    <p className="text-xs text-slate-500">Next drives for the college</p>
                  </div>
                  <button
                    onClick={() => router.push("/college/drives")}
                    className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {filteredDrives.length === 0 ? (
                    <div className="text-xs text-slate-400">No drives found.</div>
                  ) : (
                    filteredDrives.map((drive) => (
                      <div key={drive.id} className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-semibold">
                            {drive.company[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{drive.company}</div>
                            <div className="text-xs text-slate-500">{drive.role}</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">{drive.date}</div>
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${
                            drive.status === "Open"
                              ? "bg-emerald-50 text-emerald-600"
                              : drive.status === "Interviewing"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {drive.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">Action Items</h3>
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="text-slate-400"
                    aria-label="Clear search filters"
                    title="Clear search filters"
                  >
                    <ClipboardList size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {filteredActions.map((item) => (
                    <div key={item.title} className="border border-slate-100 rounded-lg px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <CalendarCheck size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                          <div className="text-xs text-slate-500">{item.detail}</div>
                          <span className="inline-flex mt-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {item.tag}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "Trends" && (
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Placement Trend</div>
                  <div className="text-xs text-slate-500">Monthly placed vs unplaced</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span> Total
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Placed
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span> Unplaced
                  </span>
                </div>
              </div>
              {trends.length === 0 ? (
                <div className="text-xs text-slate-400">No trend data available.</div>
              ) : (
                <>
                  <svg viewBox={`0 0 ${trendWidth} ${trendHeight}`} className="w-full h-44">
                    <path d={buildTrendPath("total")} fill="none" stroke="#2563EB" strokeWidth="2.5" />
                    <path d={buildTrendPath("placed")} fill="none" stroke="#10B981" strokeWidth="2.5" strokeDasharray="4 4" />
                    <path d={buildTrendPath("unplaced")} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="6 6" />
                  </svg>
                  <div
                    className="mt-3 grid text-xs text-slate-500"
                    style={{ gridTemplateColumns: `repeat(${trends.length}, minmax(0, 1fr))` }}
                  >
                    {trends.map((point) => (
                      <div key={point.label} className="text-center">{point.label}</div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-800">Current Split</div>
              <div className="text-xs text-slate-500">Total, placed, and unplaced students</div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total students</span>
                  <span className="font-semibold text-slate-800">{stats?.totals.totalStudents || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Placed students</span>
                  <span className="font-semibold text-slate-800">{stats?.totals.placedStudents || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Unplaced students</span>
                  <span className="font-semibold text-slate-800">
                    {Math.max((stats?.totals.totalStudents || 0) - (stats?.totals.placedStudents || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Companies" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">Participating Companies</div>
                <div className="text-xs text-slate-500">Filters cover posted drives, active partners, and placements.</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={companyFilter}
                    onChange={(event) => setCompanyFilter(event.target.value)}
                    className="appearance-none border border-slate-200 rounded-lg px-3 py-2 pr-7 text-sm text-slate-600 bg-white"
                  >
                    <option value="participated">Participated</option>
                    <option value="posted">Posted Drives</option>
                    <option value="active">Active Partners</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2 top-2.5 text-slate-400" />
                </div>
              </div>
            </div>

            {companiesLoading ? (
              <div className="text-xs text-slate-500">Loading companies...</div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-xs text-slate-400">No companies match the current filters.</div>
            ) : (
              <div className="space-y-3">
                {filteredCompanies.map((company) => (
                  <div key={company.name} className="flex flex-wrap items-center gap-4 border border-slate-100 rounded-xl p-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-semibold">
                      {company.name[0]}
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-800">{company.name}</div>
                        {company.isExternal && (
                          <span className="text-[10px] uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            External
                          </span>
                        )}
                        {company.isActivePartner && (
                          <span className="text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {company.jobProfiles} roles - {company.driveCount} drives
                      </div>
                    </div>
                    <div className="min-w-[120px] text-sm text-slate-600">
                      <div className="text-xs text-slate-400">Total Offers</div>
                      <div className="font-semibold text-slate-800">{company.totalOffers}</div>
                    </div>
                    <div className="min-w-[120px] text-sm text-slate-600">
                      <div className="text-xs text-slate-400">Placed Students</div>
                      <div className="font-semibold text-slate-800">{company.placedStudents}</div>
                    </div>
                    <div className="min-w-[120px] text-sm text-slate-600">
                      <div className="text-xs text-slate-400">Avg CTC</div>
                      <div className="font-semibold text-slate-800">{company.averageCtc} L</div>
                    </div>
                    <div className="min-w-[120px] text-sm text-slate-600">
                      <div className="text-xs text-slate-400">Max CTC</div>
                      <div className="font-semibold text-slate-800">{company.maxCtc} L</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Placement Records" && (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Placement Record Upload</div>
                  <div className="text-xs text-slate-500">
                    Upload a single-department Excel file for the selected year.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpload()}
                  className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold"
                >
                  <UploadCloud size={16} />
                  Upload
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                  className="text-sm text-slate-500"
                />
                <div className="text-xs text-slate-400">
                  Required columns: Student_ID, Student_Name, Department, Class_Year, Company_Name, Job_Profile,
                  Offers_Received, CTC_LPA, Placed_Status, Offer_Date.
                </div>
              </div>
              {uploadMessage && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {uploadMessage}
                </div>
              )}
              {uploadError && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 text-xs text-slate-500">
                <span>Placement Records</span>
                <span>Showing {filteredRecords.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Company</th>
                      <th className="p-4">Job Profile</th>
                      <th className="p-4">Offers</th>
                      <th className="p-4">CTC (LPA)</th>
                      <th className="p-4">Placed</th>
                      <th className="p-4">Offer Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {recordsLoading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">Loading records...</td>
                      </tr>
                    ) : filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">No records found.</td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => (
                        <tr key={record._id} className="hover:bg-slate-50">
                          <td className="p-4">
                            <div className="font-semibold text-slate-800">{record.studentName}</div>
                            <div className="text-xs text-slate-500">{record.studentId}</div>
                          </td>
                          <td className="p-4 text-slate-500">{record.department}</td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-800">{record.companyName}</div>
                          </td>
                          <td className="p-4 text-slate-500">{record.jobProfile}</td>
                          <td className="p-4 text-slate-500">{record.offersReceived}</td>
                          <td className="p-4 text-slate-500">{record.ctcLpa}</td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                record.placedStatus === "Yes"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {record.placedStatus}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{formatDate(record.offerDate)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg max-w-md w-full p-6">
            <div className="flex items-center gap-2 text-slate-800 mb-2">
              <Building2 size={18} />
              <div className="text-sm font-semibold">Replace existing records?</div>
            </div>
            <div className="text-xs text-slate-500">
              Records already exist for Class of {yearFilter} and {departmentFilter}. Type
              <span className="font-semibold text-slate-700"> confirm</span> to replace them.
            </div>
            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              className="mt-4 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="confirm"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText("");
                  setPendingUpload(null);
                }}
                className="text-sm text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Confirm replace
              </button>
            </div>
          </div>
        </div>
      )}
    </CollegeLayout>
  );
}
