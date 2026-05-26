User & Access control

User
- id
- fullName
- email
- phone
- password
- role
- status
- isEmailVerified
- isPhoneVerified
- resetToken
- resetTokenExpiry
- profileImageUrl
- profileImagePublicId
- district
- sector
- cell
- village
- lastLoginAt
- passwordChangedAt
- createdAt
- updatedAt

User 1 ─── 0/1 Farmer
User 1 ─── 0/1 Institution
User 1 ─── 0/1 CooperativeManager
User 1 ─── many Notifications
User 1 ─── many AnalyticsReports

Enums: 
Role: FARMER, INSTITUTION, COOPERATIVE_MANAGER, ADMIN, GOVERNMENT_PARTNER
UserStatus: PENDING, ACTIVE, SUSPENDED, DEACTIVATED

Farmer Identity

Farmer
- id
- userId
- nationalId
- dateOfBirth
- gender
- farmingExperienceYears
- primaryCrop
- credibilityStatus
- cooperativeId
- createdAt
- updatedAt

User 1 ─── 1 Farmer
Farmer 1 ─── many Farms
Farmer 1 ─── many Livestock
Farmer 1 ─── many FinancialSummaries
Farmer 1 ─── many CreditScores
Farmer 1 ─── many LoanApplications
Farmer 1 ─── many Loans
Farmer 1 ─── many Recommendations
Cooperative 1 ─── many Farmers


Financial Institution

Institution
- id
- userId
- name
- type
- licenseNumber
- phone
- email
- address
- district
- sector
- status
- createdAt
- updatedAt

Enums: 
InstitutionType: SACCO, MICROFINANCE, BANK, NGO, GOVERNMENT_PROGRAM
InstitutionStatus: PENDING, ACTIVE, SUSPENDED

Cooperative

Cooperative
- id
- name
- registrationNumber
- district
- sector
- cell
- village
- status
- createdAt
- updatedAt

CooperativeManager
- id
- userId
- cooperativeId
- position
- createdAt
- updatedAt

CooperativeMember
- id
- cooperativeId
- farmerId
- joinedAt
- status

User 1 ─── 1 CooperativeManager
Cooperative 1 ─── many CooperativeManagers
Cooperative 1 ─── many CooperativeMembers
Cooperative 1 ─── many Farmers
Farmer 1 ─── 0/1 CooperativeMember


Farm Management

Farm
- id
- farmerId
- name
- landSize
- landUnit
- ownershipType
- soilType
- province
- district
- sector
- cell
- village
- latitude
- longitude
- createdAt
- updatedAt

Farmer 1 ─── many Farms
Farm 1 ─── many Crops

Enums:
LandUnit: HECTARE, ACRE
OwnershipType: OWNED, RENTED, FAMILY_LAND, COOPERATIVE_LAND


Crop & Farming Season

Crop
- id
- farmId
- cropName
- cropType
- seasonId
- plantingDate
- expectedHarvestDate
- actualHarvestDate
- status
- createdAt
- updatedAt

FarmingSeason
- id
- name
- year
- startDate
- endDate
- createdAt

Farm 1 ─── many Crops
FarmingSeason 1 ─── many Crops
Crop 1 ─── many InputCosts
Crop 1 ─── many YieldRecords

Enums:
CropStatus: PLANNED, PLANTED, GROWING, HARVESTED, FAILED


Livestock Records

Livestock
- id
- farmerId
- type
- quantity
- purpose
- estimatedValue
- createdAt
- updatedAt

Farmer 1 ─── many Livestock

Enums:
LivestockPurpose: MILK, MEAT, EGGS, BREEDING, FARM_WORK, OTHER


Input Cost Tracking

InputCost
- id
- cropId
- type
- name
- quantity
- unit
- unitCost
- totalCost
- dateUsed
- notes
- createdAt

Crop 1 ─── many InputCosts

Enums:
InputType: SEED, FERTILIZER, PESTICIDE, LABOR, IRRIGATION, TRANSPORT, EQUIPMENT, OTHER


YieldRecord
- id
- cropId
- expectedYield
- actualYield
- unit
- harvestDate
- qualityGrade
- notes
- createdAt

Crop 1 ─── many YieldRecords

ProductivityRecord
- id
- farmerId
- seasonId
- totalExpectedYield
- totalActualYield
- productivityRate
- createdAt

Farmer 1 ─── many ProductivityRecords
FarmingSeason 1 ─── many ProductivityRecords


Market Price & Financial Performance

MarketPrice
- id
- cropName
- marketLocation
- pricePerUnit
- unit
- recordedAt

FarmExpense
- id
- farmerId
- cropId
- type
- amount
- description
- expenseDate
- createdAt

FinancialSummary
- id
- farmerId
- seasonId
- totalIncome
- totalExpenses
- netProfit
- cashFlowStatus
- createdAt

Farmer 1 ─── many FinancialSummaries
FarmingSeason 1 ─── many FinancialSummaries
Farmer 1 ─── many FarmExpenses
Crop 1 ─── many FarmExpenses

CashFlowStatus: POSITIVE, NEUTRAL, NEGATIVE



Credit Scoring Engine

CreditScore
- id
- farmerId
- score
- riskLevel
- yieldConsistencyScore
- farmingHistoryScore
- incomeStabilityScore
- repaymentBehaviorScore
- productivityScore
- generatedAt

CreditScoreFactor
- id
- creditScoreId
- factorName
- factorValue
- weight
- description

RiskAssessment
- id
- farmerId
- creditScoreId
- riskLevel
- reason
- recommendedAction
- createdAt

Farmer 1 ─── many CreditScores
CreditScore 1 ─── many CreditScoreFactors
CreditScore 1 ─── 0/1 RiskAssessment
Farmer 1 ─── many RiskAssessments

Enums:
RiskLevel: LOW, MEDIUM, HIGH, VERY_HIGH


Loan Management

LoanApplication
- id
- farmerId
- institutionId
- creditScoreId
- requestedAmount
- recommendedAmount
- approvedAmount
- purpose
- status
- reviewedById
- reviewedAt
- rejectionReason
- createdAt
- updatedAt

Loan
- id
- loanApplicationId
- farmerId
- institutionId
- principalAmount
- interestRate
- totalPayable
- disbursedAmount
- disbursedAt
- startDate
- endDate
- status
- createdAt
- updatedAt

LoanStatusHistory
- id
- loanId
- status
- changedById
- note
- createdAt

Farmer 1 ─── many LoanApplications
Institution 1 ─── many LoanApplications
CreditScore 1 ─── many LoanApplications
LoanApplication 1 ─── 0/1 Loan
Farmer 1 ─── many Loans
Institution 1 ─── many Loans
Loan 1 ─── many LoanStatusHistory
User 1 ─── many LoanStatusHistory

Enums:
LoanApplicationStatus: PENDING, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED
LoanStatus: ACTIVE, DISBURSED, COMPLETED, DEFAULTED, CANCELLED


Repayment System

RepaymentSchedule
- id
- loanId
- dueDate
- expectedAmount
- status
- createdAt

Repayment
- id
- loanId
- repaymentScheduleId
- amountPaid
- paymentMethod
- transactionReference
- paidAt
- createdAt

Loan 1 ─── many RepaymentSchedules
Loan 1 ─── many Repayments
RepaymentSchedule 1 ─── many Repayments

Enums:
RepaymentScheduleStatus: UPCOMING, DUE, PARTIALLY_PAID, PAID, OVERDUE
PaymentMethod: MOBILE_MONEY, BANK_TRANSFER, CASH, OTHER



Recommendations & Advisory

Recommendation
- id
- farmerId
- type
- title
- message
- priority
- isRead
- createdAt

Farmer 1 ─── many Recommendations

Enums: 
RecommendationType: LOAN_AMOUNT, FINANCIAL_IMPROVEMENT, REPAYMENT_STRATEGY, PRODUCTIVITY, RISK_REDUCTION
Priority: LOW, MEDIUM, HIGH


Notifications


Notification
- id
- userId
- title
- message
- type
- isRead
- createdAt

User 1 ─── many Notifications

Enums:
NotificationType: LOAN_APPROVAL, REPAYMENT_REMINDER, CREDIT_SCORE_UPDATE, MISSING_DATA_ALERT, COOPERATIVE_ANNOUNCEMENT, GENERAL


Analytics & Reports

AnalyticsReport
- id
- reportType
- title
- data : data should be Json because reports can have different structures depending on report type.
- generatedById
- createdAt

User 1 ─── many AnalyticsReports

Enums:
ReportType: FARMER_GROWTH, PRODUCTIVITY, LOAN_ANALYTICS, REGIONAL_PERFORMANCE, FINANCIAL_INCLUSION


Primary Green: #22c55e
Dark Text: #111827
Light Background: #f9fafb
Border Gray: #e5e7eb
Muted Gray: #6b7280