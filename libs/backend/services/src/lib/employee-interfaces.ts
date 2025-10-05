/**
 * Additional interfaces and types for comprehensive Employee Service
 * These would typically be in separate files or shared modules
 */

export interface EmployeeCapability {
  id: string;
  employeeId: string;
  capabilityType: 'SKILL' | 'EQUIPMENT' | 'CERTIFICATION' | 'LANGUAGE' | 'SOFTWARE';
  name: string;
  proficiencyLevel: 'NOVICE' | 'BEGINNER' | 'COMPETENT' | 'PROFICIENT' | 'EXPERT';
  verificationMethod: 'SELF_REPORTED' | 'MANAGER_VERIFIED' | 'CERTIFIED' | 'TESTED';
  lastVerified: Date;
  expiryDate?: Date;
  notes?: string;
  isActive: boolean;
}

export interface EmployeeDevelopmentPlan {
  id: string;
  employeeId: string;
  planType: 'ANNUAL' | 'QUARTERLY' | 'PROJECT_BASED' | 'ROLE_TRANSITION';
  title: string;
  description: string;
  objectives: Array<{
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    progress: number; // 0-100
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
    metrics?: Array<{ name: string; target: number; current: number; unit: string }>;
  }>;
  skillGaps: Array<{
    skill: string;
    currentLevel: number;
    targetLevel: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    developmentActions: string[]
  }>;
  trainingPlan: Array<{
    trainingId: string;
    trainingName: string;
    priority: number;
    estimatedDuration: number;
    targetCompletionDate: Date;
    cost?: number;
  }>;
  mentorId?: string;
  reviewSchedule: Array<{
    reviewDate: Date;
    reviewType: 'PROGRESS_CHECK' | 'MILESTONE_REVIEW' | 'FINAL_ASSESSMENT';
    completed: boolean;
    notes?: string;
  }>;
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
}

export interface WorkforceAnalytics {
  cafeId: string;
  analysisDate: Date;
  staffingLevels: {
    optimal: Record<string, number>; // by hour of day
    current: Record<string, number>;
    variance: Record<string, number>;
    recommendations: string[]
  }
  skillMatrix: {
    requiredSkills: Record<string, number>; // skill -> count needed
    availableSkills: Record<string, number>; // skill -> count available
    skillGaps: Record<string, number>; // skill -> shortage
    crossTrainingOpportunities: Array<{
      employeeId: string;
      fromSkill: string;
      toSkill: string;
      effort: 'LOW' | 'MEDIUM' | 'HIGH';
      impact: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  }
  costOptimization: {
    currentLaborCost: number;
    optimizedLaborCost: number;
    potentialSavings: number;
    savingsOpportunities: Array<{
      type: 'SCHEDULING' | 'CROSS_TRAINING' | 'AUTOMATION' | 'EFFICIENCY';
      description: string;
      estimatedSavings: number;
      implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  }
  predictiveInsights: {
    expectedTurnover: Array<{
      employeeId: string;
      riskScore: number; // 0-100
      reasons: string[]
      retentionActions: string[]
    }>;
    performanceTrends: Array<{
      employeeId: string;
      trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
      confidenceLevel: number;
      interventionRecommended: boolean;
    }>;
    trainingNeeds: Array<{
      skill: string;
      urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      affectedEmployees: number;
      businessImpact: string;
    }>;
  }
}

export interface EmployeeEngagement {
  id: string;
  employeeId: string;
  surveyDate: Date;
  surveyType: 'ANNUAL' | 'QUARTERLY' | 'PULSE' | 'EXIT' | 'ONBOARDING';
  overallSatisfaction: number; // 1-10
  responses: Record<string, number | string>; // question -> response
  categories: {
    jobSatisfaction: number;
    workLifeBalance: number;
    compensation: number;
    management: number;
    careerDevelopment: number;
    workEnvironment: number;
    communication: number;
    recognition: number;
  }
  comments: Array<{
    question: string;
    response: string;
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  }>;
  actionItems: Array<{
    category: string;
    issue: string;
    suggestedAction: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    assignedTo?: string;
    dueDate?: Date;
  }>;
  anonymized: boolean;
  followUpRequired: boolean;
}

export interface ComplianceRecord {
  id: string;
  employeeId: string;
  complianceType: 'LABOR_LAW' | 'SAFETY' | 'CERTIFICATION' | 'POLICY' | 'REGULATORY';
  requirement: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'EXPIRED' | 'WARNING';
  lastChecked: Date;
  expiryDate?: Date;
  violationDetails?: string;
  correctiveActions?: Array<{
    action: string;
    assignedTo: string;
    dueDate: Date;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  }>;
  auditTrail: Array<{
    date: Date;
    action: string;
    performedBy: string;
    details: string;
  }>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  businessImpact: string;
}

export interface EmployeeRecognition {
  id: string;
  employeeId: string;
  nominatedBy: string;
  recognitionType: 'PEER_NOMINATION' | 'MANAGER_RECOGNITION' | 'CUSTOMER_FEEDBACK' | 'ACHIEVEMENT' | 'MILESTONE';
  category: 'PERFORMANCE' | 'TEAMWORK' | 'INNOVATION' | 'CUSTOMER_SERVICE' | 'LEADERSHIP' | 'SAFETY';
  title: string;
  description: string;
  impact: string;
  witnesses?: string[]
  customerFeedback?: {
    rating: number;
    comments: string;
    verified: boolean;
  }
  reward?: {
    type: 'MONETARY' | 'TIME_OFF' | 'GIFT_CARD' | 'CERTIFICATE' | 'PUBLIC_RECOGNITION';
    value?: number;
    details: string;
  }
  publiclyVisible: boolean;
  dateAwarded: Date;
  quarterlyTotal: number;
  yearlyTotal: number;
}

export interface EmployeeWellness {
  id: string;
  employeeId: string;
  wellnessDate: Date;
  metrics: {
    stressLevel: number; // 1-10
    energyLevel: number; // 1-10
    jobSatisfaction: number; // 1-10
    workLifeBalance: number; // 1-10
    healthStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  }
  concerns: Array<{
    category: 'PHYSICAL' | 'MENTAL' | 'WORKPLACE' | 'PERSONAL';
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }>;
  supportProvided: Array<{
    type: 'EAP_REFERRAL' | 'SCHEDULE_ADJUSTMENT' | 'WORKLOAD_REDUCTION' | 'TRAINING' | 'COUNSELING';
    description: string;
    providedBy: string;
    date: Date;
  }>;
  followUpRequired: boolean;
  followUpDate?: Date;
  confidential: boolean;
}

export interface ScheduleOptimizationResult {
  optimizationId: string;
  cafeId: string;
  optimizationDate: Date;
  period: { start: Date; end: Date }
  algorithm: 'GENETIC' | 'SIMULATED_ANNEALING' | 'LINEAR_PROGRAMMING' | 'MACHINE_LEARNING';
  objectives: {
    minimizeLaborCost: number; // weight 0-1
    maximizeCustomerService: number; // weight 0-1
    maximizeEmployeeSatisfaction: number; // weight 0-1
    minimizeOvertime: number; // weight 0-1
    balanceWorkload: number; // weight 0-1
  }
  constraints: {
    respectAvailability: boolean;
    minimumStaffingLevels: Record<string, number>; // by time period
    maximumConsecutiveHours: number;
    minimumRestBetweenShifts: number;
    skillRequirements: Record<string, string[]>; // time period -> required skills
  }
  results: {
    beforeOptimization: {
      totalLaborCost: number;
      overtimeHours: number;
      staffingGaps: number;
      employeeSatisfactionScore: number;
    }
    afterOptimization: {
      totalLaborCost: number;
      overtimeHours: number;
      staffingGaps: number;
      employeeSatisfactionScore: number;
    }
    improvements: {
      costReduction: number;
      overtimeReduction: number;
      gapReduction: number;
      satisfactionIncrease: number;
    }
  }
  schedule: Array<{
    employeeId: string;
    shifts: Array<{
      startTime: Date;
      endTime: Date;
      role: string;
      location: string;
      confidence: number; // 0-1
    }>;
  }>;
  qualityScore: number; // 0-100
  implementationRecommendations: string[]
}

export interface EmployeeCareerPath {
  id: string;
  employeeId: string;
  currentRole: string;
  targetRole: string;
  pathType: 'PROMOTION' | 'LATERAL_MOVE' | 'SKILL_DEVELOPMENT' | 'LEADERSHIP_TRACK';
  estimatedDuration: number; // months
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    requirements: Array<{
      type: 'SKILL' | 'EXPERIENCE' | 'CERTIFICATION' | 'PERFORMANCE' | 'EDUCATION';
      description: string;
      completed: boolean;
      completedDate?: Date;
    }>;
    targetDate: Date;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  }>;
  mentorId?: string;
  sponsorId?: string;
  progressPercentage: number; // 0-100
  nextSteps: string[]
  blockers: Array<{
    issue: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    mitigation: string;
  }>;
  successMetrics: Array<{
    metric: string;
    target: number;
    current: number;
    unit: string;
  }>;
  lastReviewDate: Date;
  nextReviewDate: Date;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
}

export interface AIInsight {
  id: string;
  type: 'PERFORMANCE_PREDICTION' | 'TURNOVER_RISK' | 'SKILL_GAP' | 'SCHEDULE_OPTIMIZATION' | 'COST_SAVING';
  entityType: 'EMPLOYEE' | 'TEAM' | 'CAFE' | 'COMPANY';
  entityId: string;
  insight: string;
  confidence: number; // 0-100
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';
  recommendations: Array<{
    action: string;
    priority: number;
    estimatedImpact: string;
    estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
    cost?: number;
  }>;
  dataPoints: Array<{
    source: string;
    value: any;
    weight: number;
  }>;
  generatedAt: Date;
  validUntil?: Date;
  actionTaken?: {
    action: string;
    takenBy: string;
    takenAt: Date;
    result?: string;
  }
  feedbackRating?: number; // 1-5, how useful was this insight
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: 'CONTRACT' | 'HANDBOOK' | 'POLICY' | 'TRAINING_CERTIFICATE' | 'PERFORMANCE_REVIEW' | 'DISCIPLINARY' | 'PERSONAL';
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  expiryDate?: Date;
  tags: string[]
  isConfidential: boolean;
  accessLevel: 'EMPLOYEE_ONLY' | 'MANAGER_ONLY' | 'HR_ONLY' | 'PUBLIC';
  signatureRequired: boolean;
  signedAt?: Date;
  signedBy?: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';
}

// Audit and compliance interfaces
export interface EmployeeAuditLog {
  id: string;
  employeeId: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  ipAddress: string;
  userAgent?: string;
  details: Record<string, any>;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  }
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  complianceFlags?: string[]
}

export interface EmployeePrivacySettings {
  employeeId: string;
  personalInfoVisible: boolean;
  photoVisible: boolean;
  contactInfoVisible: boolean;
  scheduleVisible: boolean;
  performanceVisible: boolean;
  allowDataSharing: boolean;
  marketingOptIn: boolean;
  dataRetentionPeriod: number; // months
  lastUpdated: Date;
  consentGiven: boolean;
  consentDate?: Date;
}

// Integration interfaces
export interface PayrollIntegration {
  employeeId: string;
  payrollSystemId: string;
  lastSyncDate: Date;
  syncStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'PARTIAL';
  syncErrors?: string[]
  payrollData: {
    employeeNumber: string;
    department: string;
    costCenter: string;
    taxSettings: Record<string, any>;
    benefitSettings: Record<string, any>;
  }
}

export interface HRISIntegration {
  employeeId: string;
  hrisSystemId: string;
  externalEmployeeId: string;
  lastSyncDate: Date;
  syncStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  syncedFields: string[]
  conflictResolution: Record<string, 'LOCAL' | 'REMOTE' | 'MANUAL'>;
}