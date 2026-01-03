"use client";
import React, { useEffect, useMemo, useState } from "react";
import CompanyLayout from "../../../components/CompanyLayout";
import {
  Search,
  Users,
  Calendar,
  Building2,
  ChevronDown,
  X
} from "lucide-react";
import api from "@/lib/api";
import TopBarActions from "../../../components/TopBarActions";

type Partnership = {
  _id: string;
  status: "Pending" | "Active" | "Rejected";
  requesterId: { _id: string; name: string; email: string; role: string };
  recipientId: { _id: string; name: string; email: string; role: string };
};

type College = {
  _id: string;
  name: string;
  email: string;
  branch?: string;
  region?: string;
};

export default function CampusNetworkPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [requests, setRequests] = useState<Partnership[]>([]);
  const [drivesData, setDrivesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("All India");
  const [streamFilter, setStreamFilter] = useState("All");
  const [actionMessage, setActionMessage] = useState("");
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [discoverResults, setDiscoverResults] = useState<College[] | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  const getStoredUser = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return { error: "Session missing. Please log in again." };
    }
    try {
      const user = JSON.parse(storedUser);
      return { user };
    } catch {
      return { error: "Session data is corrupted. Please log in again." };
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { user, error } = getStoredUser();
      if (!user) {
        setErrorMsg(error || "Session missing. Please log in again.");
        setLoading(false);
        return;
      }
      if (!user._id) {
        setErrorMsg("User session is incomplete. Please log in again.");
        setLoading(false);
        return;
      }

      const [collegesRes, requestsRes, drivesRes] = await Promise.all([
        api.get("/api/network/search-colleges"),
        api.get(`/api/network/requests/${user._id}`),
        api.get(`/api/jobs/company/${user._id}`).catch(() => ({ data: [] })),
      ]);
      setColleges(collegesRes.data || []);
      setRequests(requestsRes.data || []);
      setDrivesData(drivesRes.data || []);
    } catch (error) {
      setErrorMsg("Failed to load campus network. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setDiscoverResults(null);
    setShowAllRecommended(false);
  }, [regionFilter, streamFilter]);

  const getStatus = (collegeId: string) => {
    const req = requests.find(
      (item) => item.requesterId?._id === collegeId || item.recipientId?._id === collegeId
    );
    return req ? req.status : null;
  };

  const handleConnect = async (collegeId: string) => {
    try {
      const { user, error } = getStoredUser();
      if (!user) {
        setActionMessage(error || "Session missing. Please log in again.");
        return;
      }
      await api.post("/api/network/connect", { requesterId: user._id, recipientId: collegeId });
      setActionMessage("Invite sent to college.");
      loadData();
    } catch (error: any) {
      setActionMessage(error.response?.data?.message || "Failed to send invite.");
    }
  };

  const handleRespond = async (partnershipId: string, status: "Active" | "Rejected") => {
    try {
      await api.put("/api/network/respond", { partnershipId, status });
      setActionMessage(status === "Active" ? "Request accepted." : "Request declined.");
      loadData();
    } catch (error: any) {
      setActionMessage(error.response?.data?.message || "Action failed.");
    }
  };

  const handleViewCollege = (college?: College) => {
    if (!college) {
      setActionMessage("College details are unavailable.");
      return;
    }
    setSelectedCollege(college);
  };

  const connectedPartners = requests.filter((req) => req.status === "Active");
  const incomingRequests = requests.filter(
    (req) => req.status === "Pending" && req.requesterId?.role === "college"
  );
  const upcomingDrives = (drivesData?.filter((drive) => drive.status === "Open") || []).length || 0;

  const filteredColleges = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return colleges.filter((college) => {
      const matchesSearch =
        !term ||
        college.name.toLowerCase().includes(term) ||
        college.email.toLowerCase().includes(term);
      const matchesStream =
        streamFilter === "All" || (college.branch || "").toLowerCase() === streamFilter.toLowerCase();
      const matchesRegion =
        regionFilter === "All India" || (college.region || "").toLowerCase() === regionFilter.toLowerCase();
      return matchesSearch && matchesStream && matchesRegion;
    });
  }, [colleges, searchTerm, streamFilter, regionFilter]);

  const visibleRecommended = (discoverResults || filteredColleges).slice(
    0,
    showAllRecommended ? undefined : 4
  );
  const inviteList = colleges.filter((college) => {
    const term = inviteSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      college.name.toLowerCase().includes(term) ||
      college.email.toLowerCase().includes(term)
    );
  });

  const handleFindMatches = () => {
    const matches = filteredColleges;
    setDiscoverResults(matches);
    setShowAllRecommended(true);
    setActionMessage(matches.length ? "Updated recommendations based on filters." : "No colleges match those filters.");
  };

  return (
    <CompanyLayout>
      <div className="px-8 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Campus Network</h1>
            <span className="text-sm text-slate-400">Partner Management</span>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Requests</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                placeholder="Find colleges..."
                className="outline-none text-sm w-48 text-slate-600"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <TopBarActions settingsPath="/company/settings" />
            <button
              onClick={() => setShowInvitePanel(true)}
              className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold"
            >
              Invite College
            </button>
          </div>
        </header>

        {showInvitePanel && (
          <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-800">Invite Colleges</div>
              <button
                type="button"
                onClick={() => setShowInvitePanel(false)}
                className="text-slate-500 hover:text-slate-700 transition-colors duration-200 flex items-center justify-center"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-4">
              <Search size={16} className="text-slate-400" />
              <input
                placeholder="Search colleges to invite..."
                className="outline-none text-sm w-full text-slate-600 bg-transparent"
                value={inviteSearch}
                onChange={(event) => setInviteSearch(event.target.value)}
              />
            </div>
            {loading ? (
              <div className="text-xs text-slate-500">Loading colleges...</div>
            ) : inviteList.length === 0 ? (
              <div className="text-xs text-slate-400">No colleges match that search.</div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {inviteList.map((college) => {
                  const status = getStatus(college._id);
                  return (
                    <div
                      key={college._id}
                      className="flex items-center justify-between border border-slate-100 rounded-xl p-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{college.name}</div>
                        <div className="text-xs text-slate-500">{college.email}</div>
                      </div>
                      {status ? (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          status === "Active" ? "bg-emerald-50 text-emerald-600" :
                          status === "Pending" ? "bg-amber-50 text-amber-600" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {status}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnect(college._id)}
                          className="text-sm text-blue-600 font-semibold"
                        >
                          Send Invite
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {actionMessage && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {actionMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500">Connected Partners</div>
            <div className="text-2xl font-semibold text-slate-900">{connectedPartners.length}</div>
            <div className="text-xs text-emerald-500 mt-1">+8 this month</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500">Pending Requests</div>
            <div className="text-2xl font-semibold text-slate-900">{incomingRequests.length}</div>
            <div className="text-xs text-slate-400 mt-1">Action required</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500">Upcoming Drives</div>
            <div className="text-2xl font-semibold text-slate-900">{upcomingDrives}</div>
            <div className="text-xs text-slate-400 mt-1">Next: Tomorrow</div>
          </div>
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-400">Network Insight</div>
            <div className="text-lg font-semibold mt-2">Tier 1 Coverage</div>
            <div className="text-xs text-slate-300 mt-2">You are connected with 85% of top colleges.</div>
            <button className="mt-4 w-full rounded-lg border border-slate-700 py-2 text-xs font-semibold text-white">
              Explore Missing
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-slate-800">
                  Incoming Requests <span className="text-xs text-slate-400">({incomingRequests.length})</span>
                </div>
                <div className="text-xs text-slate-400">Sort by: Relevance</div>
              </div>
              {loading ? (
                <div className="text-xs text-slate-500">Loading requests...</div>
              ) : incomingRequests.length === 0 ? (
                <div className="text-xs text-slate-400">No new campus requests.</div>
              ) : (
                <div className="space-y-4">
                  {incomingRequests.map((req) => {
                    const college = req.requesterId;
                    return (
                      <div key={req._id} className="border border-slate-100 rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <Building2 size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{college.name}</div>
                              <div className="text-xs text-slate-500">{college.email}</div>
                              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">Engineering</span>
                                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">Placement Cell Active</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">Received 2h ago</div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleRespond(req._id, "Active")}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
                          >
                            Accept Request
                          </button>
                          <button
                            onClick={() => handleRespond(req._id, "Rejected")}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewCollege(college)}
                            className="ml-auto text-sm text-blue-600 font-semibold"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-800 mb-4">All Campuses</div>
              {filteredColleges.length === 0 ? (
                <div className="text-xs text-slate-400">No colleges match the search.</div>
              ) : (
                <div className="space-y-3">
                  {filteredColleges.slice(0, 6).map((college) => {
                    const status = getStatus(college._id);
                    return (
                      <div key={college._id} className="flex items-center justify-between border border-slate-100 rounded-xl p-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{college.name}</div>
                          <div className="text-xs text-slate-500">{college.email}</div>
                        </div>
                        {status ? (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            status === "Active" ? "bg-emerald-50 text-emerald-600" :
                            status === "Pending" ? "bg-amber-50 text-amber-600" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {status}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConnect(college._id)}
                            className="text-sm text-blue-600 font-semibold"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-800 mb-4">Discover Colleges</div>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs text-slate-500">Region</label>
                  <div className="relative mt-2">
                    <select
                      value={regionFilter}
                      onChange={(event) => setRegionFilter(event.target.value)}
                      className="appearance-none w-full border border-slate-200 rounded-lg px-3 py-2 pr-7 text-sm text-slate-600 bg-white"
                    >
                      <option>All India</option>
                      <option>South</option>
                      <option>North</option>
                      <option>West</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2 top-2.5 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Stream</label>
                  <div className="relative mt-2">
                    <select
                      value={streamFilter}
                      onChange={(event) => setStreamFilter(event.target.value)}
                      className="appearance-none w-full border border-slate-200 rounded-lg px-3 py-2 pr-7 text-sm text-slate-600 bg-white"
                    >
                      <option>All</option>
                      <option>CSE</option>
                      <option>ECE</option>
                      <option>IT</option>
                      <option>ME</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2 top-2.5 text-slate-400" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFindMatches}
                  className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-semibold"
                >
                  Find Matches
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-slate-800">Recommended</div>
                <button
                  type="button"
                  onClick={() => setShowAllRecommended(true)}
                  className="text-xs text-blue-600 font-semibold"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {visibleRecommended.map((college) => {
                  const status = getStatus(college._id);
                  return (
                    <div key={college._id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-semibold">
                          {college.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800">{college.name}</div>
                          <div className="text-xs text-slate-500">{college.branch || "Engineering"}</div>
                        </div>
                      </div>
                      {status ? (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          status === "Active" ? "bg-emerald-50 text-emerald-600" :
                          status === "Pending" ? "bg-amber-50 text-amber-600" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {status}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnect(college._id)}
                          className="text-xs text-blue-600 font-semibold"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  );
                })}
                {visibleRecommended.length === 0 && (
                  <div className="text-xs text-slate-400">No recommendations yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedCollege && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-slate-500">College profile</div>
                  <div className="text-lg font-semibold text-slate-800">{selectedCollege.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCollege(null)}
                  className="text-slate-500 hover:text-slate-700 transition-colors duration-200 flex items-center justify-center"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div>
                  <div className="text-xs text-slate-400">Email</div>
                  <div className="font-semibold text-slate-700">{selectedCollege.email}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Branch focus</div>
                  <div className="font-semibold text-slate-700">{selectedCollege.branch || "Engineering"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Region</div>
                  <div className="font-semibold text-slate-700">{(selectedCollege as any).region || "Not specified"}</div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                {getStatus(selectedCollege._id) ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCollege(null)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
                  >
                    Done
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleConnect(selectedCollege._id);
                      setSelectedCollege(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
                  >
                    Send Invite
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
