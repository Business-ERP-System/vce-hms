
export const FULL_SQL_SCHEMA = `-- =============================================
-- Database: Visionary Care HMS (Specialist Eye Hospital)
-- Target Engine: Microsoft SQL Server 2019+
-- Generated for: SuperAdmin Control Panel
-- =============================================

USE [master]
GO
CREATE DATABASE [VisionaryCareHMS]
GO
USE [VisionaryCareHMS]
GO

-- 1. SECURITY & RBAC ---------------------------------------------------------
CREATE TABLE [dbo].[Roles] (
    [RoleID] INT PRIMARY KEY IDENTITY(1,1),
    [RoleName] NVARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE [dbo].[Permissions] (
    [PermissionID] INT PRIMARY KEY IDENTITY(1,1),
    [RoleID] INT FOREIGN KEY REFERENCES [Roles]([RoleID]),
    [ModuleName] NVARCHAR(100) NOT NULL,
    [CanList] BIT DEFAULT 0,
    [CanView] BIT DEFAULT 0,
    [CanAdd] BIT DEFAULT 0,
    [CanEdit] BIT DEFAULT 0,
    [CanDelete] BIT DEFAULT 0,
    [CanExport] BIT DEFAULT 0
);

CREATE TABLE [dbo].[Employees] (
    [EmployeeID] NVARCHAR(20) PRIMARY KEY,
    [FullName] NVARCHAR(200) NOT NULL,
    [RoleID] INT FOREIGN KEY REFERENCES [Roles]([RoleID]),
    [Department] NVARCHAR(100),
    [ContactNo] NVARCHAR(20),
    [Shift] NVARCHAR(20),
    [Status] NVARCHAR(20) DEFAULT 'Active'
);

-- 2. INFRASTRUCTURE MASTER ---------------------------------------------------
CREATE TABLE [dbo].[Floors] (
    [FloorID] INT PRIMARY KEY IDENTITY(1,1),
    [FloorName] NVARCHAR(50) NOT NULL,
    [Level] INT NOT NULL
);

CREATE TABLE [dbo].[Wards] (
    [WardID] INT PRIMARY KEY IDENTITY(1,1),
    [WardName] NVARCHAR(50) NOT NULL,
    [FloorID] INT FOREIGN KEY REFERENCES [Floors]([FloorID]),
    [Description] NVARCHAR(MAX)
);

CREATE TABLE [dbo].[Beds] (
    [BedID] INT PRIMARY KEY IDENTITY(1,1),
    [BedNumber] NVARCHAR(20) NOT NULL,
    [WardID] INT FOREIGN KEY REFERENCES [Wards]([WardID]),
    [RoomNo] NVARCHAR(20),
    [Status] NVARCHAR(20) DEFAULT 'Available'
);

CREATE TABLE [dbo].[ClinicalRooms] (
    [RoomID] INT PRIMARY KEY IDENTITY(1,1),
    [RoomNumber] NVARCHAR(20) NOT NULL,
    [RoomType] NVARCHAR(20), -- OPD, Lab, OT
    [LoadCapacity] INT DEFAULT 10
);

-- 3. PATIENT & CLINICAL ------------------------------------------------------
CREATE TABLE [dbo].[Patients] (
    [UHID] NVARCHAR(20) PRIMARY KEY,
    [FullName] NVARCHAR(200) NOT NULL,
    [Age] INT,
    [AgeMonths] INT DEFAULT 0,
    [Gender] NVARCHAR(10),
    [DOB] DATE,
    [ContactNo] NVARCHAR(20) NOT NULL,
    [Village] NVARCHAR(100),
    [PostOffice] NVARCHAR(100),
    [District] NVARCHAR(100),
    [MRLocation] NVARCHAR(50),
    [NextOfKin] NVARCHAR(100),
    [RegDate] DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE [dbo].[Refractions] (
    [RefractionID] INT PRIMARY KEY IDENTITY(1,1),
    [UHID] NVARCHAR(20) FOREIGN KEY REFERENCES [Patients]([UHID]),
    [ExamDate] DATETIME2 DEFAULT GETDATE(),
    -- Right Eye (OD)
    [OD_SPH] NVARCHAR(10), [OD_CYL] NVARCHAR(10), [OD_AXIS] NVARCHAR(10), [OD_VA] NVARCHAR(10),
    -- Left Eye (OS)
    [OS_SPH] NVARCHAR(10), [OS_CYL] NVARCHAR(10), [OS_AXIS] NVARCHAR(10), [OS_VA] NVARCHAR(10),
    [IOP_OD] NVARCHAR(10), [IOP_OS] NVARCHAR(10),
    [ClinicalNotes] NVARCHAR(MAX)
);

CREATE TABLE [dbo].[Prescriptions] (
    [RxID] NVARCHAR(20) PRIMARY KEY,
    [UHID] NVARCHAR(20) FOREIGN KEY REFERENCES [Patients]([UHID]),
    [DoctorID] NVARCHAR(20) FOREIGN KEY REFERENCES [Employees]([EmployeeID]),
    [Diagnosis] NVARCHAR(MAX),
    [Advice] NVARCHAR(MAX),
    [RxDate] DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE [dbo].[PrescriptionDetails] (
    [DetailID] INT PRIMARY KEY IDENTITY(1,1),
    [RxID] NVARCHAR(20) FOREIGN KEY REFERENCES [Prescriptions]([RxID]),
    [MedicineName] NVARCHAR(200),
    [Dosage] NVARCHAR(50),
    [Duration] NVARCHAR(50),
    [Instruction] NVARCHAR(200)
);

-- 4. COMMERCIAL & INVENTORY --------------------------------------------------
CREATE TABLE [dbo].[Products] (
    [ProductID] INT PRIMARY KEY IDENTITY(1,1),
    [Name] NVARCHAR(200) NOT NULL,
    [Category] NVARCHAR(50), -- Med, Frame, Lens
    [StockQty] INT DEFAULT 0,
    [UnitPrice] DECIMAL(18,2),
    [SupplierID] NVARCHAR(20)
);

CREATE TABLE [dbo].[Invoices] (
    [InvoiceNo] NVARCHAR(20) PRIMARY KEY,
    [UHID] NVARCHAR(20) FOREIGN KEY REFERENCES [Patients]([UHID]),
    [DeptName] NVARCHAR(50),
    [TotalAmount] DECIMAL(18,2),
    [Discount] DECIMAL(18,2) DEFAULT 0,
    [PaymentStatus] NVARCHAR(20),
    [PaymentMethod] NVARCHAR(20),
    [CreatedAt] DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE [dbo].[InvoiceItems] (
    [ItemID] INT PRIMARY KEY IDENTITY(1,1),
    [InvoiceNo] NVARCHAR(20) FOREIGN KEY REFERENCES [Invoices]([InvoiceNo]),
    [Description] NVARCHAR(200),
    [Qty] INT,
    [Price] DECIMAL(18,2)
);

CREATE TABLE [dbo].[Ledger] (
    [TxnID] INT PRIMARY KEY IDENTITY(1,1),
    [Date] DATE DEFAULT GETDATE(),
    [Category] NVARCHAR(20), -- Income/Expense
    [Description] NVARCHAR(MAX),
    [Amount] DECIMAL(18,2),
    [PaymentMethod] NVARCHAR(20)
);

-- 5. PROCEDURES --------------------------------------------------------------
GO
CREATE PROCEDURE [dbo].[sp_GetRoomLoad]
    @RoomNo NVARCHAR(20)
AS
BEGIN
    SELECT COUNT(*) FROM Patients WHERE assignedRoom = @RoomNo AND status = 'OPD'
END
GO
`;
