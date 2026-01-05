import { Request, Response } from "express";
import mongoose from "mongoose";
import xlsx from "xlsx";
import PlacementRecord from "../models/PlacementRecord";
import User from "../models/User";
import Job from "../models/Job";
import Partnership from "../models/Partnership";

type AuthRequest = Request & { userId?: string };

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const normalizeText = (value: any) =>
  String(value ?? "").trim();

const normalizeDepartment = (value: any) =>
  normalizeText(value).toUpperCase();

const normalizeYear = (value: any) =>
  normalizeText(value).replace(/^class\s+of\s+/i, "");

const isAllValue = (value: string) =>
  value.toLowerCase() === "all";

const parseNumber = (value: any) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseOfferDate = (value: any) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = xlsx.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return null;
};

const getCollegeContext = async (req: AuthRequest) => {
  if (!req.userId) {
    throw { status: 401, message: "Not authorized" };
  }
  const user = await User.findById(req.userId).select("role collegeId");
  if (!user) {
    throw { status: 404, message: "User not found." };
  }
  if (user.role === "college") {
    return { collegeId: String(user._id) };
  }
  if (user.role === "college_member") {
    if (!user.collegeId) {
      throw { status: 400, message: "College profile missing." };
    }
    return { collegeId: String(user.collegeId) };
  }
  throw { status: 403, message: "Not authorized." };
};

export const uploadPlacementRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest & { file?: Express.Multer.File };
    const { collegeId } = await getCollegeContext(authReq);

    const file = authReq.file;
    const classYear = normalizeYear(req.body.classYear);
    const department = normalizeDepartment(req.body.department);
    const replace = String(req.body.replace || "").toLowerCase() === "true";

    if (!file) {
      res.status(400).json({ message: "Excel file is required." });
      return;
    }
    if (!classYear || isAllValue(classYear) || !department || department === "ALL") {
      res.status(400).json({ message: "Class year and department are required." });
      return;
    }

    const existingCount = await PlacementRecord.countDocuments({
      collegeId,
      classYear,
      department,
    });
    if (existingCount > 0 && !replace) {
      res.status(409).json({
        message: "Records already exist for this year and department.",
        existingCount,
      });
      return;
    }

    const workbook = xlsx.read(file.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      res.status(400).json({ message: "No worksheet found in file." });
      return;
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: "",
    });

    const headerMap: Record<string, string> = {
      studentid: "studentId",
      studentname: "studentName",
      department: "department",
      classyear: "classYear",
      companyname: "companyName",
      jobprofile: "jobProfile",
      offersreceived: "offersReceived",
      ctclpa: "ctcLpa",
      placedstatus: "placedStatus",
      offerdate: "offerDate",
    };

    let skipped = 0;
    let mismatchedDepartment = 0;
    let mismatchedYear = 0;
    let missingFields = 0;

    const records = rows
      .map((row) => {
        const mapped: Record<string, any> = {};
        Object.entries(row).forEach(([key, value]) => {
          const normalizedKey = normalizeHeader(key);
          const targetKey = headerMap[normalizedKey];
          if (targetKey) {
            mapped[targetKey] = value;
          }
        });
        return mapped;
      })
      .flatMap((row) => {
        const studentId = normalizeText(row.studentId);
        const studentName = normalizeText(row.studentName);
        const rowDepartment = normalizeDepartment(row.department);
        const rowYear = normalizeYear(row.classYear);
        const companyName = normalizeText(row.companyName);
        const jobProfile = normalizeText(row.jobProfile);
        const offersReceived = parseNumber(row.offersReceived);
        const ctcLpa = parseNumber(row.ctcLpa);
        const placedStatusValue = normalizeText(row.placedStatus).toLowerCase();
        const placedStatus = placedStatusValue === "yes" ? "Yes" : "No";
        const offerDate = parseOfferDate(row.offerDate);

        if (
          !studentId ||
          !studentName ||
          !rowDepartment ||
          !rowYear
        ) {
          missingFields += 1;
          return [];
        }

        if (placedStatus === "Yes") {
          if (!companyName || !jobProfile || !offerDate) {
            missingFields += 1;
            return [];
          }
        }

        if (rowDepartment !== department) {
          mismatchedDepartment += 1;
          return [];
        }
        if (rowYear !== classYear) {
          mismatchedYear += 1;
          return [];
        }

        const safeCompany = placedStatus === "Yes" ? companyName : companyName || "Unplaced";
        const safeProfile = placedStatus === "Yes" ? jobProfile : jobProfile || "Unplaced";

        return [
          {
            collegeId: new mongoose.Types.ObjectId(collegeId),
            studentId,
            studentName,
            department: rowDepartment,
            classYear: rowYear,
            companyName: safeCompany,
            jobProfile: safeProfile,
            offersReceived: placedStatus === "Yes" ? offersReceived : 0,
            ctcLpa: placedStatus === "Yes" ? ctcLpa : 0,
            placedStatus,
            offerDate: placedStatus === "Yes" ? offerDate : null,
          },
        ];
      });

    skipped = mismatchedDepartment + mismatchedYear + missingFields;

    if (!records.length) {
      res.status(400).json({
        message: "No valid records found in the upload.",
        skipped,
        mismatchedDepartment,
        mismatchedYear,
        missingFields,
      });
      return;
    }

    if (existingCount > 0 && replace) {
      await PlacementRecord.deleteMany({ collegeId, classYear, department });
    }

    await PlacementRecord.insertMany(records);

    res.status(201).json({
      message: "Placement records uploaded.",
      imported: records.length,
      skipped,
      mismatchedDepartment,
      mismatchedYear,
      missingFields,
      replaced: existingCount > 0 && replace,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Upload failed." });
  }
};

export const getPlacementFilters = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { collegeId } = await getCollegeContext(authReq);

    const records = await PlacementRecord.find({ collegeId })
      .select("classYear department")
      .lean();

    const yearsSet = new Set<string>();
    const departmentsByYear: Record<string, Set<string>> = {};
    const allDepartments = new Set<string>();

    records.forEach((record) => {
      const year = record.classYear;
      const department = record.department;
      yearsSet.add(year);
      allDepartments.add(department);
      if (!departmentsByYear[year]) {
        departmentsByYear[year] = new Set();
      }
      departmentsByYear[year].add(department);
    });

    const years = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    const departments = Array.from(allDepartments).sort();
    const departmentsMap: Record<string, string[]> = {};

    Object.entries(departmentsByYear).forEach(([year, deptSet]) => {
      departmentsMap[year] = Array.from(deptSet).sort();
    });

    res.json({ years, departments, departmentsByYear: departmentsMap });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Failed to load filters." });
  }
};

export const getPlacementRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { collegeId } = await getCollegeContext(authReq);
    const year = normalizeYear(req.query.year);
    const department = normalizeDepartment(req.query.department);
    const limit = Number(req.query.limit ?? 0);
    const skip = Number(req.query.skip ?? 0);

    const filter: Record<string, any> = { collegeId };
    if (year && !isAllValue(year)) {
      filter.classYear = year;
    }
    if (department && department !== "ALL") {
      filter.department = department;
    }

    const total = await PlacementRecord.countDocuments(filter);
    const query = PlacementRecord.find(filter).sort({ studentName: 1, studentId: 1 });
    if (Number.isFinite(skip) && skip > 0) {
      query.skip(skip);
    }
    if (Number.isFinite(limit) && limit > 0) {
      query.limit(limit);
    }
    const records = await query.lean();

    res.json({ total, records });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Failed to load records." });
  }
};

export const getPlacementStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { collegeId } = await getCollegeContext(authReq);
    const year = normalizeYear(req.query.year);
    const department = normalizeDepartment(req.query.department);

    const filter: Record<string, any> = { collegeId };
    if (year && !isAllValue(year)) {
      filter.classYear = year;
    }
    if (department && department !== "ALL") {
      filter.department = department;
    }

    const records = await PlacementRecord.find(filter).lean();
    const availableData = records.length > 0;

    const totalStudentSet = new Set<string>();
    const placedStudentSet = new Set<string>();
    const jobProfilesSet = new Set<string>();
    let totalOffers = 0;

    const placedByDepartment: Record<string, Set<string>> = {};
    const studentCtcMap = new Map<string, number>();

    records.forEach((record) => {
      totalStudentSet.add(record.studentId);
      if (record.offersReceived > 0 || record.placedStatus === "Yes") {
        placedStudentSet.add(record.studentId);
        if (!placedByDepartment[record.department]) {
          placedByDepartment[record.department] = new Set();
        }
        placedByDepartment[record.department].add(record.studentId);
      }
      if (record.jobProfile) {
        jobProfilesSet.add(record.jobProfile);
      }
      totalOffers += record.offersReceived || 0;

      if (record.ctcLpa && Number.isFinite(record.ctcLpa)) {
        const current = studentCtcMap.get(record.studentId) || 0;
        if (record.ctcLpa > current) {
          studentCtcMap.set(record.studentId, record.ctcLpa);
        }
      }
    });

    const totalStudents = totalStudentSet.size;
    const placedStudents = placedStudentSet.size;
    const jobProfiles = jobProfilesSet.size;

    const eligibleCounts = await User.aggregate([
      {
        $match: {
          role: "student",
          collegeId: new mongoose.Types.ObjectId(collegeId),
        },
      },
      {
        $group: {
          _id: { $toUpper: { $ifNull: ["$branch", "UNSPECIFIED"] } },
          count: { $sum: 1 },
        },
      },
    ]);

    const eligibleByDepartment: Record<string, number> = {};
    eligibleCounts.forEach((item) => {
      const key = String(item._id || "UNSPECIFIED");
      eligibleByDepartment[key] = item.count;
    });

    const departmentSet = new Set<string>([
      ...Object.keys(eligibleByDepartment),
      ...Object.keys(placedByDepartment),
    ]);
    const departments = Array.from(departmentSet).sort();
    const selectedDepartment = department && department !== "ALL" ? department : null;

    const analytics = departments.map((dept) => {
      const mask = selectedDepartment && dept !== selectedDepartment;
      return {
        department: dept,
        eligible: mask ? 0 : eligibleByDepartment[dept] || 0,
        placed: mask ? 0 : placedByDepartment[dept]?.size || 0,
      };
    });

    const analyticsMax = analytics.reduce((max, item) => {
      return Math.max(max, item.eligible, item.placed);
    }, 0);

    const ctcValues = Array.from(studentCtcMap.values());
    const ctcTotal = ctcValues.length;
    const averageCtc =
      ctcTotal > 0
        ? Number((ctcValues.reduce((sum, value) => sum + value, 0) / ctcTotal).toFixed(1))
        : 0;

    const salaryBuckets = [
      { label: "5 - 10 LPA", min: 5, max: 10 },
      { label: "10 - 15 LPA", min: 10, max: 15 },
      { label: "15 - 20 LPA", min: 15, max: 20 },
      { label: "> 20 LPA", min: 20 },
    ];

    const salaryCounts = salaryBuckets.map((bucket) => {
      const count = ctcValues.filter((value) => {
        if (bucket.min !== undefined && bucket.max !== undefined) {
          return value >= bucket.min && value < bucket.max;
        }
        if (bucket.min !== undefined && bucket.max === undefined) {
          return value >= bucket.min;
        }
        return false;
      }).length;
      return count;
    });

    const salaryTotal = salaryCounts.reduce((sum, count) => sum + count, 0);
    const salaryRanges = salaryBuckets.map((bucket, index) => {
      const count = salaryCounts[index];
      const percent = salaryTotal > 0 ? Math.round((count / salaryTotal) * 100) : 0;
      return { label: bucket.label, count, percent };
    });

    const monthlyMap = new Map<
      string,
      { date: Date; students: Set<string> }
    >();

    records.forEach((record) => {
      if (!record.offerDate) return;
      const date = new Date(record.offerDate);
      if (Number.isNaN(date.getTime())) return;
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const key = monthStart.toISOString();
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { date: monthStart, students: new Set() });
      }
      monthlyMap.get(key)?.students.add(record.studentId);
    });

    const includeYearLabel = !year || isAllValue(year);
    const months = Array.from(monthlyMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((entry) => {
        const monthLabel = entry.date.toLocaleString("en-US", {
          month: "short",
          year: includeYearLabel ? "2-digit" : undefined,
        });
        const placed = entry.students.size;
        const unplaced = Math.max(totalStudents - placed, 0);
        return {
          label: monthLabel,
          placed,
          unplaced,
          total: totalStudents,
        };
      });

    res.json({
      availableData,
      totals: {
        totalStudents,
        jobProfiles,
        totalOffers,
        placedStudents,
      },
      analytics: {
        departments: analytics,
        max: analyticsMax,
      },
      salary: {
        average: averageCtc,
        ranges: salaryRanges,
      },
      trends: {
        months,
      },
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Failed to load stats." });
  }
};

export const getPlacementCompanies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { collegeId } = await getCollegeContext(authReq);
    const year = normalizeYear(req.query.year);
    const department = normalizeDepartment(req.query.department);
    const filter = String(req.query.filter || "participated").toLowerCase();

    const recordFilter: Record<string, any> = { collegeId };
    if (year && !isAllValue(year)) {
      recordFilter.classYear = year;
    }
    if (department && department !== "ALL") {
      recordFilter.department = department;
    }

    const records = await PlacementRecord.find(recordFilter).lean();
    const jobs = await Job.find({ collegeId: new mongoose.Types.ObjectId(collegeId) })
      .populate("companyId", "name")
      .lean();

    const companyUsers = await User.find({ role: "company" }).select("_id name");
    const companyNameLookup = new Map<string, string>();
    companyUsers.forEach((user) => {
      const key = normalizeText(user.name).toLowerCase();
      if (!companyNameLookup.has(key)) {
        companyNameLookup.set(key, String(user._id));
      }
    });

    const partnerships = await Partnership.find({
      status: "Active",
      $or: [{ requesterId: collegeId }, { recipientId: collegeId }],
    }).lean();

    const activeCompanyIds = new Set<string>();
    partnerships.forEach((item: any) => {
      const requesterId = String(item.requesterId);
      const recipientId = String(item.recipientId);
      const companyId = requesterId === collegeId ? recipientId : requesterId;
      activeCompanyIds.add(companyId);
    });

    const normalizeCompanyKey = (name: string) => normalizeText(name).toLowerCase();

    const companyMap = new Map<
      string,
      {
        name: string;
        companyId?: string;
        isExternal: boolean;
        hasRecords: boolean;
        hasDrives: boolean;
        totalOffers: number;
        placedStudents: Set<string>;
        ctcValues: number[];
        jobProfiles: Set<string>;
        driveCount: number;
      }
    >();

    records.forEach((record) => {
      const hasOffer = record.offersReceived > 0 || record.placedStatus === "Yes";
      if (!hasOffer) return;
      const key = normalizeCompanyKey(record.companyName);
      const existing = companyMap.get(key);
      const companyId = companyNameLookup.get(key);
      if (!existing) {
        companyMap.set(key, {
          name: record.companyName,
          companyId,
          isExternal: !companyId,
          hasRecords: true,
          hasDrives: false,
          totalOffers: record.offersReceived || 0,
          placedStudents: new Set(
            record.offersReceived > 0 || record.placedStatus === "Yes"
              ? [record.studentId]
              : []
          ),
          ctcValues: record.ctcLpa ? [record.ctcLpa] : [],
          jobProfiles: new Set(record.jobProfile ? [record.jobProfile] : []),
          driveCount: 0,
        });
      } else {
        existing.hasRecords = true;
        existing.totalOffers += record.offersReceived || 0;
        if (record.offersReceived > 0 || record.placedStatus === "Yes") {
          existing.placedStudents.add(record.studentId);
        }
        if (record.ctcLpa) {
          existing.ctcValues.push(record.ctcLpa);
        }
        if (record.jobProfile) {
          existing.jobProfiles.add(record.jobProfile);
        }
      }
    });

    jobs.forEach((job: any) => {
      const companyName = job.companyId?.name || "Company";
      const key = normalizeCompanyKey(companyName);
      const existing = companyMap.get(key);
      if (!existing) {
        companyMap.set(key, {
          name: companyName,
          companyId: job.companyId?._id ? String(job.companyId._id) : undefined,
          isExternal: !job.companyId?._id,
          hasRecords: false,
          hasDrives: true,
          totalOffers: 0,
          placedStudents: new Set(),
          ctcValues: [],
          jobProfiles: new Set(job.title ? [job.title] : []),
          driveCount: 1,
        });
      } else {
        existing.hasDrives = true;
        existing.driveCount += 1;
        if (job.title) {
          existing.jobProfiles.add(job.title);
        }
      }
    });

    let companies = Array.from(companyMap.values()).map((company) => {
      const avgCtc =
        company.ctcValues.length > 0
          ? Number(
              (
                company.ctcValues.reduce((sum, value) => sum + value, 0) /
                company.ctcValues.length
              ).toFixed(1)
            )
          : 0;
      const maxCtc =
        company.ctcValues.length > 0 ? Math.max(...company.ctcValues) : 0;
      const isActivePartner = company.companyId
        ? activeCompanyIds.has(company.companyId)
        : false;
      return {
        name: company.name,
        companyId: company.companyId,
        isExternal: company.isExternal,
        hasRecords: company.hasRecords,
        hasDrives: company.hasDrives,
        isActivePartner,
        totalOffers: company.totalOffers,
        placedStudents: company.placedStudents.size,
        averageCtc: avgCtc,
        maxCtc,
        driveCount: company.driveCount,
        jobProfiles: company.jobProfiles.size,
      };
    });

    if (filter === "active") {
      companies = companies.filter((company) => company.isActivePartner);
    } else if (filter === "participated") {
      companies = companies.filter((company) => company.hasRecords || company.hasDrives);
    } else {
      companies = companies.filter((company) => company.hasDrives);
    }

    companies.sort((a, b) => b.driveCount - a.driveCount || a.name.localeCompare(b.name));

    res.json({ companies });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Failed to load companies." });
  }
};
