
import { MENU_GROUPS } from '../../constants';

export interface MigrationModule {
    name: string;
    legacyTable: string;
    description: string;
    category: string;
    sqlScript?: string;
}

// Map system modules to legacy table names and provide custom scripts where needed
const MODULE_MAPPING: Record<string, Partial<MigrationModule>> = {
    'Patient List': {
        legacyTable: 'Legacy_Patients_Master',
        description: 'Comprehensive patient demographics and registration history.',
        sqlScript: `
-- PATIENT MASTER DATA EXPORT
SELECT 
    PatientID as id,
    FirstName + ' ' + LastName as name,
    DATEDIFF(hour,DateOfBirth,GETDATE())/8766 as age,
    Gender as gender,
    Mobile as contact,
    Email as email,
    Address as village,
    District as district,
    RegistrationDate as lastVisit,
    'Active' as status
FROM Legacy_Patients_Master
FOR JSON PATH;
        `
    },
    'Billing & POS': {
        legacyTable: 'Legacy_Billing_Transactions',
        description: 'All financial transactions, invoices, and payment records.',
        sqlScript: `
-- BILLING & TRANSACTIONS (VOUCHERS)
SELECT 
    InvoiceID as id,
    PatientID as patientId,
    BillAmount as amount,
    TaxAmount as tax,
    Discount as discount,
    PaymentMode as paymentMethod,
    TransactionDate as date,
    'Legacy Migration' as description
FROM Legacy_Billing_Transactions
FOR JSON PATH;
        `
    },
    'EMR (Medical Records)': {
        legacyTable: 'Legacy_EMR_Data',
        description: 'Clinical findings, diagnosis history, and doctor consultation notes.',
        sqlScript: `
-- CLINICAL RECORDS (EMR/OPD)
SELECT 
    RecordID as id,
    PatientID as patientId,
    ChiefComplaint as complaint,
    Diagnosis as diagnosis,
    ClinicalNotes as notes,
    DoctorID as doctorId,
    VisitDate as date
FROM Legacy_EMR_Data
FOR JSON PATH;
        `
    },
    'IPD & Bed Mgmt': {
        legacyTable: 'Legacy_IPD_Admissions',
        description: 'In-patient admissions, bed allocations, and discharge records.',
        sqlScript: `
-- IPD & BED MANAGEMENT
SELECT 
    AdmissionID as id,
    PatientID as patientId,
    BedNumber as bedId,
    WardName as ward,
    AdmissionDate as date,
    DischargeDate as dischargeDate,
    'Migrated' as status
FROM Legacy_IPD_Admissions
FOR JSON PATH;
        `
    },
    'Pharmacy & Optical': {
        legacyTable: 'Legacy_Inventory_Master',
        description: 'Medicine stock, optical frames, and lens inventory.',
        sqlScript: `
-- PHARMACY & OPTICAL INVENTORY
SELECT 
    ItemID as id,
    ItemName as name,
    Category as category,
    CurrentStock as stock,
    UnitPrice as price,
    ExpiryDate as expiry
FROM Legacy_Inventory_Master
FOR JSON PATH;
        `
    },
    'Financial Ledger': {
        legacyTable: 'Legacy_Finance_Accounts',
        description: 'General ledger, account balances, and financial masters.',
        sqlScript: `
-- FINANCIAL LEDGER & MASTER
SELECT 
    AccountID as id,
    AccountName as name,
    OpeningBalance as balance,
    AccountGroup as category,
    'Active' as status
FROM Legacy_Finance_Accounts
FOR JSON PATH;
        `
    },
    'HR & Staff': {
        legacyTable: 'Legacy_HR_Employees',
        description: 'Employee profiles, designations, and department data.',
        sqlScript: `
-- HR & STAFF DATA
SELECT 
    EmployeeID as id,
    EmpName as name,
    Designation as role,
    Department as department,
    JoinDate as date,
    'Active' as status
FROM Legacy_HR_Employees
FOR JSON PATH;
        `
    }
};

export const getMigrationModules = (): MigrationModule[] => {
    const modules: MigrationModule[] = [];

    MENU_GROUPS.forEach(group => {
        group.items.forEach(item => {
            // Skip utility/meta modules
            if (['Dashboard', 'User Manual', 'System Settings', 'Database Management', 'Legacy Migration Bridge'].includes(item.name)) {
                return;
            }

            const mapping = MODULE_MAPPING[item.name] || {};
            const legacyTable = mapping.legacyTable || `Legacy_${item.name.replace(/[^a-zA-Z0-9]/g, '_')}_Table`;
            
            modules.push({
                name: item.name,
                legacyTable: legacyTable,
                description: mapping.description || `Migration bridge for ${item.name} module data.`,
                category: group.group,
                sqlScript: mapping.sqlScript || `
-- AUTO-GENERATED EXPORT SCRIPT FOR ${item.name.toUpperCase()}
-- This script performs a generic dump of the legacy table.
-- Please verify column names in your MSSQL environment.

SELECT * 
FROM ${legacyTable}
FOR JSON PATH;
                `
            });
        });
    });

    return modules;
};

export const generateMigrationScript = (moduleName: string): string => {
    const modules = getMigrationModules();
    const module = modules.find(m => m.name === moduleName);
    return module?.sqlScript || '-- Script not found';
};
