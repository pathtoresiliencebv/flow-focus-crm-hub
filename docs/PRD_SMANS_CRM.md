# SMANS CRM - Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** January 9, 2025  
**Status:** Active  
**Backend Platform:** Convex  

---

## 📋 DOCUMENT INFORMATION

**Document Owner:** SMANS BV Development Team  
**Last Updated:** January 9, 2025  
**Review Cycle:** Quarterly  
**Distribution:** Internal - All Stakeholders  

---

## 📑 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Core Features](#4-core-features)
5. [Technical Architecture](#5-technical-architecture)
6. [Mobile Applications](#6-mobile-applications)
7. [Workflows](#7-workflows)
8. [Database Architecture](#8-database-architecture)
9. [Security & Compliance](#9-security--compliance)
10. [Design System](#10-design-system)
11. [Integration Points](#11-integration-points)
12. [Performance Requirements](#12-performance-requirements)
13. [Testing Strategy](#13-testing-strategy)
14. [Deployment & Operations](#14-deployment--operations)
15. [Future Roadmap](#15-future-roadmap)
16. [Appendices](#16-appendices)

---

# 1. EXECUTIVE SUMMARY

## 1.1 Product Vision

SMANS CRM is a comprehensive digital platform designed to revolutionize operations for window installation companies (kozijnenbedrijven). The system transforms traditional paper-based workflows into a seamless digital experience, connecting office staff with field installers in real-time.

## 1.2 Problem Statement

Window installation companies face several operational challenges:

- **Manual Paperwork**: Time-consuming manual forms and documentation
- **Poor Communication**: Lack of real-time communication between office and field workers
- **No Visibility**: Limited insight into project status and installer activities
- **Language Barriers**: Communication difficulties with Polish-speaking workers
- **Administrative Burden**: Hours spent on invoicing, quotes, and work orders
- **Data Loss**: Physical documents get lost or damaged
- **Customer Experience**: Delayed responses and unprofessional documentation

## 1.3 Solution Overview

SMANS CRM provides:

- **Web Application**: Full-featured CRM for office staff
- **Mobile Apps**: iOS and Android apps for installers with offline support
- **Multi-Language**: Support for Dutch, English, and Polish with real-time translation
- **Automation**: Automated PDF generation, email delivery, and workflows
- **Real-Time**: Live updates across all devices using Convex reactive queries
- **Digital Signatures**: Professional work orders with customer signatures
- **GPS Tracking**: Location-based project check-in/check-out

## 1.4 Target Market

**Primary Users:**
- Small to medium-sized window installation companies (5-50 employees)
- Based in Netherlands and Belgium
- Mix of Dutch and Polish-speaking workforce
- 10-100 projects per month

**User Personas:**
1. **Office Manager (Administrator)**: Manages company operations, oversees all projects
2. **Administrative Staff**: Handles quotes, invoices, planning
3. **Sales Person**: Creates quotes, manages customer relationships
4. **Field Installer (Monteur)**: Executes projects on-site, mobile-first user
5. **Viewer**: Limited read-only access for stakeholders

## 1.5 Key Differentiators

| Feature | SMANS CRM | Competitors |
|---------|-----------|-------------|
| Multi-language chat with translation | ✅ Built-in | ❌ Not available |
| Mobile-first installer experience | ✅ Native apps | ⚠️ Limited |
| Offline capabilities | ✅ Full offline | ❌ Online only |
| Digital work orders with signatures | ✅ Automated | ⚠️ Manual |
| Real-time updates | ✅ Convex reactivity | ⚠️ Polling |
| GPS tracking | ✅ Check-in/out | ❌ Not available |
| Receipt scanning | ✅ Built-in | ❌ Separate app |

## 1.6 Success Metrics

**Target KPIs (Year 1):**
- User Adoption: 95% of installers using mobile app
- Project Completion Rate: 90% with digital work orders
- Average Customer Satisfaction: 4.5+ out of 5 stars
- Quote Conversion Rate: 35%+ (industry average: 25%)
- Time Savings: 40% reduction in administrative time
- Customer Response Time: < 2 hours (vs. 24 hours industry average)

---

# 2. PRODUCT OVERVIEW

## 2.1 What is SMANS CRM?

SMANS CRM is a cloud-based Customer Relationship Management system specifically designed for the window installation industry. It combines traditional CRM capabilities with specialized features for project management, installer coordination, and customer communication.

### Core Capabilities:

1. **Customer Management**: Complete CRM with contact management, history tracking, and communication logs
2. **Project Management**: End-to-end project lifecycle from quote to completion
3. **Financial Management**: Quote generation, invoice creation, payment tracking
4. **Planning & Scheduling**: Visual calendar with installer assignment and customer notifications
5. **Mobile Execution**: Field installers complete projects with photos, signatures, and time tracking
6. **Communication**: Real-time chat with automatic translation
7. **Document Management**: Automated PDF generation for quotes, invoices, and work orders
8. **Receipt Management**: Expense tracking with approval workflow

## 2.2 Platform Components

### 2.2.1 Web Application

**Technology:**
- React 18 + TypeScript
- Vite build system
- Convex React client
- Shadcn/ui component library
- Tailwind CSS

**Features:**
- Desktop-optimized responsive design
- Full CRM capabilities
- Advanced reporting and analytics
- Admin configuration
- Multi-tab workflows

**Target Users:** Administrator, Administratie, Verkoper

### 2.2.2 iOS Mobile App

**Technology:**
- React + Capacitor 7
- Native iOS integration
- Face ID / Touch ID

**Features:**
- Native camera integration
- GPS tracking
- Offline-first architecture
- Push notifications
- Haptic feedback

**Target Users:** Installateur (Monteur)

### 2.2.3 Android Mobile App

**Technology:**
- React + Capacitor 7
- Native Android integration
- Fingerprint authentication

**Features:**
- Native camera integration
- GPS tracking
- Offline-first architecture
- Push notifications
- Vibration patterns

**Target Users:** Installateur (Monteur)

## 2.3 Supported Languages

### Interface Languages:
- 🇳🇱 **Dutch (Nederlands)**: Primary language
- 🇬🇧 **English**: Secondary language
- 🇵🇱 **Polish (Polski)**: For Polish workforce

### Translation Features:
- Automatic language detection in chat messages
- Real-time translation via Google Translate API
- Display of both original and translated text
- Per-user language preferences

## 2.4 Browser & Device Support

### Web Application:
- ✅ Chrome 90+ (recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ Internet Explorer (not supported)

### Mobile Apps:
- ✅ iOS 14.0 or later
- ✅ Android 8.0 (API level 26) or later

### Screen Sizes:
- Web: 1280x720 minimum (optimized for 1920x1080)
- Mobile: 375x667 minimum (iPhone SE) to 428x926 (iPhone 14 Pro Max)
- Tablet: 768x1024 (iPad Mini) to 1024x1366 (iPad Pro)

---

# 3. USER ROLES & PERMISSIONS

## 3.1 Role Hierarchy

SMANS CRM implements a hierarchical role-based access control (RBAC) system with 5 distinct roles:

```
1. Administrator     → Full system access
2. Administratie     → Financial & administrative tasks
3. Verkoper          → Sales & customer management
4. Installateur      → Project execution (field work)
5. Bekijker          → Read-only access
```

## 3.2 Role Definitions

### 3.2.1 👑 Administrator

**Description:** Complete system access with all permissions. Can manage users, configure system settings, and override all restrictions.

**Typical Users:** Company owner, IT manager, System administrator

**Daily Workflow:**
1. Review dashboard metrics
2. Manage user accounts and permissions
3. Configure system settings
4. Review completed projects
5. Generate management reports
6. Handle escalated issues

**Access Level:** ALL MODULES

**Key Permissions:**
- ✅ Full CRUD on all data
- ✅ User management (create, edit, delete, assign roles)
- ✅ System configuration
- ✅ Financial data access
- ✅ Delete projects, customers, invoices
- ✅ Override planning conflicts
- ✅ Export all data
- ✅ Access audit logs

**UI Access:**
- All menu items visible
- All buttons/actions enabled
- Admin-only settings pages
- System configuration panels

### 3.2.2 📋 Administratie (Administrative)

**Description:** Handles financial and administrative tasks. Can create quotes, invoices, manage planning, but cannot delete projects or manage users.

**Typical Users:** Office manager, Administrative assistant, Bookkeeper

**Daily Workflow:**
1. Process incoming customer inquiries
2. Create and send quotes
3. Generate invoices from completed projects
4. Plan installer schedules
5. Approve/reject receipts
6. Send customer communications
7. Track payments

**Access Level:** FINANCIAL + PLANNING

**Key Permissions:**
- ✅ View all customers (read-only)
- ✅ View all projects
- ✅ Create and edit quotes
- ✅ Create and edit invoices
- ✅ Create planning for installers
- ✅ Approve/reject receipts
- ✅ View all reports
- ❌ Delete projects
- ❌ Manage users
- ❌ Edit customers
- ❌ System settings

**Data Visibility:**
- Can see ALL projects (not limited to own)
- Can see ALL quotes and invoices
- Can see ALL planning items
- Cannot see user passwords or system config

### 3.2.3 💼 Verkoper (Salesperson)

**Description:** Manages sales pipeline, creates quotes, and handles customer relationships. Can only see own projects and customers.

**Typical Users:** Sales representative, Account manager

**Daily Workflow:**
1. Follow up on leads
2. Create quotes for potential customers
3. Track quote approval status
4. Convert approved quotes to projects
5. Communicate with customers
6. Review own project pipeline
7. Track commission/sales metrics

**Access Level:** SALES + OWN PROJECTS

**Key Permissions:**
- ✅ Create and edit customers
- ✅ Create and edit quotes
- ✅ View and create projects (own only)
- ✅ Edit own projects
- ✅ Create planning for own projects
- ✅ Chat with all users
- ✅ View reports (filtered to own data)
- ❌ View other users' projects
- ❌ Delete anything
- ❌ Approve receipts
- ❌ Manage invoices

**Data Visibility Rule:**
```typescript
// Projects: Only where user_id = current user
const myProjects = convex.query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return await ctx.db
      .query("projects")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .collect();
  }
});
```

### 3.2.4 🔧 Installateur (Installer/Monteur)

**Description:** Field worker who executes projects. Mobile-first user with access only to assigned projects. Primary user of mobile apps.

**Typical Users:** Window installers, Field technicians, Monteurs

**Daily Workflow:**
1. Check daily schedule on mobile app
2. Navigate to project location
3. GPS check-in at project site
4. Review project tasks
5. Complete work, take photos
6. Mark tasks as completed
7. Upload receipts for materials
8. Complete 7-step completion wizard
9. Get customer signature
10. GPS check-out

**Access Level:** ASSIGNED PROJECTS ONLY (MOBILE)

**Key Permissions:**
- ✅ View assigned projects only
- ✅ Update project status (start/complete)
- ✅ Mark tasks as completed
- ✅ Upload photos (before/during/after)
- ✅ Upload receipts
- ✅ Complete work orders with signatures
- ✅ Chat with administrators
- ✅ View customer contact info (for assigned projects)
- ✅ GPS check-in/check-out
- ❌ Create projects
- ❌ Edit planning
- ❌ View other installers' projects
- ❌ Access financial data (quotes/invoices)
- ❌ Delete anything

**Data Visibility Rule:**
```typescript
// Projects: Only where assigned_user_id = current user
const myAssignedProjects = convex.query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return await ctx.db
      .query("projects")
      .filter(q => q.eq(q.field("assignedUserId"), identity.subject))
      .collect();
  }
});
```

**Mobile-Specific Features:**
- Offline mode for working without internet
- Camera integration for photos
- GPS tracking for location verification
- Push notifications for new assignments
- Biometric authentication

### 3.2.5 👁️ Bekijker (Viewer)

**Description:** Read-only access for stakeholders who need visibility but should not make changes.

**Typical Users:** Company partners, External auditors, Investors

**Daily Workflow:**
1. Review project progress
2. View reports and metrics
3. Monitor customer satisfaction
4. Track financial performance
5. No editing capabilities

**Access Level:** READ-ONLY

**Key Permissions:**
- ✅ View customers
- ✅ View projects
- ✅ View quotes (no amounts)
- ✅ View invoices (no amounts)
- ✅ View planning
- ✅ View reports
- ❌ NO editing anywhere
- ❌ NO chat access
- ❌ NO file uploads
- ❌ NO data export

## 3.3 Permission Matrix

Complete permission breakdown by module and action:

| Module | Administrator | Administratie | Verkoper | Installateur | Bekijker |
|--------|--------------|---------------|----------|--------------|----------|
| **Customers** | | | | | |
| View | ✅ All | ✅ All | ✅ All | ✅ Assigned only | ✅ All |
| Create | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Projects** | | | | | |
| View | ✅ All | ✅ All | ✅ Own | ✅ Assigned | ✅ All |
| Create | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit | ✅ | ✅ | ✅ Own | ✅ Assigned | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Quotes** | | | | | |
| View | ✅ All | ✅ All | ✅ Own | ❌ | ✅ All |
| Create | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit | ✅ | ✅ | ✅ Own | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Invoices** | | | | | |
| View | ✅ | ✅ | ❌ | ❌ | ✅ |
| Create | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Planning** | | | | | |
| View | ✅ All | ✅ All | ✅ Own | ✅ Assigned | ✅ All |
| Create | ✅ | ✅ | ✅ Own | ❌ | ❌ |
| Edit | ✅ | ✅ | ✅ Own | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Chat** | | | | | |
| Access | ✅ | ✅ | ✅ | ✅ With admins | ❌ |
| **Receipts** | | | | | |
| View | ✅ All | ✅ All | ✅ Own | ✅ Own | ❌ |
| Upload | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve/Reject | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reports** | | | | | |
| View | ✅ All | ✅ All | ✅ Own data | ✅ Own data | ✅ Limited |
| Export | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Users** | | | | | |
| View | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign Roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Settings** | | | | | |
| View | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit | ✅ | ❌ | ❌ | ❌ | ❌ |

## 3.4 Permission Implementation

### 3.4.1 Convex Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const userRole = v.union(
  v.literal("Administrator"),
  v.literal("Administratie"),
  v.literal("Verkoper"),
  v.literal("Installateur"),
  v.literal("Bekijker")
);

export const appPermission = v.union(
  v.literal("customers_view"),
  v.literal("customers_edit"),
  v.literal("customers_delete"),
  v.literal("projects_view"),
  v.literal("projects_edit"),
  v.literal("projects_delete"),
  v.literal("invoices_view"),
  v.literal("invoices_edit"),
  v.literal("invoices_delete"),
  v.literal("users_view"),
  v.literal("users_edit"),
  v.literal("users_delete"),
  v.literal("reports_view"),
  v.literal("settings_edit")
);

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    role: userRole,
    status: v.union(v.literal("Actief"), v.literal("Inactief")),
    phone: v.optional(v.string()),
    language: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),
  
  rolePermissions: defineTable({
    role: userRole,
    permission: appPermission,
  }).index("by_role", ["role"]),
});
```

### 3.4.2 Authorization Helpers

```typescript
// convex/lib/auth.ts
import { query } from "./_generated/server";
import { UserRole } from "./schema";

export async function getUserRole(ctx): Promise<UserRole> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
    .first();
    
  return user?.role || "Bekijker";
}

export async function hasPermission(
  ctx,
  permission: string
): Promise<boolean> {
  const role = await getUserRole(ctx);
  
  // Administrator has all permissions
  if (role === "Administrator") return true;
  
  const rolePermission = await ctx.db
    .query("rolePermissions")
    .withIndex("by_role", q => q.eq("role", role))
    .filter(q => q.eq(q.field("permission"), permission))
    .first();
    
  return rolePermission !== null;
}

export function requirePermission(permission: string) {
  return async (ctx) => {
    const hasAccess = await hasPermission(ctx, permission);
    if (!hasAccess) {
      throw new Error(`Permission denied: ${permission}`);
    }
  };
}
```

### 3.4.3 Usage in Queries/Mutations

```typescript
// convex/customers.ts
import { query, mutation } from "./_generated/server";
import { getUserRole, requirePermission } from "./lib/auth";

// View customers - all roles except rules apply
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    return await ctx.db.query("customers").collect();
  }
});

// Edit customer - requires permission
export const update = mutation({
  handler: async (ctx, args) => {
    await requirePermission("customers_edit")(ctx);
    
    await ctx.db.patch(args.id, {
      ...args.data,
      updatedAt: Date.now(),
    });
  }
});

// Delete customer - Administrator only
export const deleteCustomer = mutation({
  handler: async (ctx, args) => {
    const role = await getUserRole(ctx);
    if (role !== "Administrator") {
      throw new Error("Only administrators can delete customers");
    }
    
    await ctx.db.delete(args.id);
  }
});
```

---

# 4. CORE FEATURES

## 4.1 Customer Management (CRM)

### 4.1.1 Overview
Complete customer relationship management with contact tracking, history, and communication logs.

### 4.1.2 Functional Requirements

**FR-CRM-001: Customer CRUD Operations**
- System shall allow creation of customer records with required fields
- System shall support editing customer information
- System shall allow viewing customer details
- System shall allow deletion by Administrator only

**FR-CRM-002: Customer Data Fields**
Required fields:
- Name (company or person)
- Email address (validated format)
- Phone number (format: +31 6 12345678)
- Address (street, city, postal code, country)

Optional fields:
- Company name
- KVK number (Chamber of Commerce)
- BTW number (VAT)
- Website
- Notes
- Preferred language
- Contact person
- Alternative phone
- Invoice email

**FR-CRM-003: Customer Search**
- Search by name (fuzzy matching)
- Search by email
- Search by phone
- Search by city
- Filter by status (active/inactive)
- Sort by name, created date, last contact

**FR-CRM-004: Customer History**
System shall display:
- All quotes sent to customer
- All projects for customer
- All invoices
- Communication history
- Last contact date
- Total revenue from customer

### 4.1.3 User Stories

**US-CRM-001**
```
As an Administrator
I want to create new customer records quickly
So that I can start creating quotes immediately

Acceptance Criteria:
- Can create customer in < 30 seconds
- Email validation prevents duplicates
- Required fields are clearly marked
- Form shows validation errors inline
```

**US-CRM-002**
```
As a Verkoper
I want to search customers by name or company
So that I can find existing customers fast

Acceptance Criteria:
- Search works with partial names
- Results appear in < 1 second
- Shows up to 50 results
- Highlights search term in results
```

**US-CRM-003**
```
As an Installateur
I want to see customer contact info for my assigned projects
So that I can call them if needed

Acceptance Criteria:
- Phone number is tap-to-call
- Address opens in Maps app
- Email is tap-to-email
- Only assigned project customers visible
```

### 4.1.4 Technical Specifications

**Convex Schema:**
```typescript
// convex/schema.ts
customers: defineTable({
  name: v.string(),
  email: v.string(),
  phone: v.string(),
  address: v.object({
    street: v.string(),
    city: v.string(),
    postalCode: v.string(),
    country: v.string(),
  }),
  companyName: v.optional(v.string()),
  kvkNumber: v.optional(v.string()),
  btwNumber: v.optional(v.string()),
  website: v.optional(v.string()),
  notes: v.optional(v.string()),
  preferredLanguage: v.optional(v.string()),
  contactPerson: v.optional(v.string()),
  alternativePhone: v.optional(v.string()),
  invoiceEmail: v.optional(v.string()),
  status: v.union(v.literal("active"), v.literal("inactive")),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_email", ["email"])
  .index("by_name", ["name"])
  .index("by_status", ["status"])
  .searchIndex("search_name", {
    searchField: "name",
    filterFields: ["status"],
  }),
```

**Convex Queries:**
```typescript
// convex/customers.ts
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    return await ctx.db
      .query("customers")
      .filter(q => q.eq(q.field("status"), "active"))
      .order("desc")
      .take(100);
  },
});

export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    return await ctx.db
      .query("customers")
      .withSearchIndex("search_name", q =>
        q.search("name", args.searchTerm)
          .eq("status", "active")
      )
      .take(50);
  },
});

export const getById = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

**Convex Mutations:**
```typescript
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.object({
      street: v.string(),
      city: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),
    // ... other optional fields
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // Check permission
    await requirePermission("customers_edit")(ctx);
    
    // Check for duplicate email
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_email", q => q.eq("email", args.email))
      .first();
      
    if (existing) {
      throw new Error("Customer with this email already exists");
    }
    
    const user = await getUserByIdentity(ctx, identity);
    
    return await ctx.db.insert("customers", {
      ...args,
      status: "active",
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("customers"),
    // ... all updatable fields as optional
  },
  handler: async (ctx, args) => {
    await requirePermission("customers_edit")(ctx);
    
    const { id, ...data } = args;
    
    await ctx.db.patch(id, {
      ...data,
      updatedAt: Date.now(),
    });
  },
});
```

### 4.1.5 Validation Rules

| Field | Validation |
|-------|------------|
| Name | Required, 2-100 characters |
| Email | Required, valid email format, unique |
| Phone | Required, valid phone format (E.164) |
| Postal Code | Format: 1234AB (NL) or 1000 (BE) |
| KVK Number | 8 digits (if provided) |
| BTW Number | NL123456789B01 format (if provided) |
| Website | Valid URL format (if provided) |

### 4.1.6 Business Rules

**BR-CRM-001**: Duplicate email addresses are not allowed  
**BR-CRM-002**: Only Administrator can delete customers  
**BR-CRM-003**: Cannot delete customer with active projects  
**BR-CRM-004**: Inactive customers don't appear in dropdowns  
**BR-CRM-005**: Customer data is visible to all authenticated users  

---

## 4.2 Project Management

### 4.2.1 Overview
Complete project lifecycle management from planning to completion with status automation.

### 4.2.2 Project Status Workflow

```
TE-PLANNEN → GEPLAND → IN-UITVOERING → AFGEROND
                ↓
            HERKEURING (if needed)
```

**Status Definitions:**
- **TE-PLANNEN**: Project created, awaiting planning assignment
- **GEPLAND**: Planning created, installer assigned, date set
- **IN-UITVOERING**: Installer has started work (GPS check-in)
- **HERKEURING**: Project needs re-inspection
- **AFGEROND**: Project completed with werkbon generated

### 4.2.3 Functional Requirements

**FR-PROJ-001: Project Creation**
- Create from approved quote (automatic)
- Create manually with customer selection
- Auto-populate from quote data
- Assign tasks from quote items

**FR-PROJ-002: Project Fields**
Required:
- Title
- Customer (linked to customers collection)
- Description
- Status (default: te-plannen)

Optional:
- Quote reference
- Project value (€)
- Expected start date
- Expected duration (hours)
- Special instructions
- Materials list

**FR-PROJ-003: Task Management**
- Add tasks to project
- Tasks can be checkboxes or info blocks
- Reorder tasks
- Mark tasks complete (Installateur)
- Track completion percentage

**FR-PROJ-004: Project Assignment**
- Assign to Installateur user
- Multiple installers per project (team)
- Assignment via planning creation

**FR-PROJ-005: Project Visibility**
- Administrator: All projects
- Administratie: All projects
- Verkoper: Only own projects (created by user)
- Installateur: Only assigned projects
- Bekijker: All projects (read-only)

### 4.2.4 User Stories

**US-PROJ-001**
```
As an Admin
I want to create a project from an approved quote
So that the quote data carries over automatically

Acceptance Criteria:
- Click "Create Project" on quote detail
- All quote data pre-fills
- Quote items become project tasks
- Project status is "te-plannen"
- Quote is marked as "converted"
```

**US-PROJ-002**
```
As an Installateur
I want to see only my assigned projects on mobile
So that I focus on my work without distractions

Acceptance Criteria:
- Project list shows only assigned projects
- Sorted by planning date (soonest first)
- Shows customer name and address
- Shows task completion percentage
- Can filter by status
```

**US-PROJ-003**
```
As an Administratie
I want to see all projects regardless of who created them
So that I can plan installers efficiently

Acceptance Criteria:
- Project list shows all projects
- Can filter by status, installer, date
- Can see who created each project
- Can reassign installers
```

### 4.2.5 Technical Specifications

**Convex Schema:**
```typescript
projects: defineTable({
  title: v.string(),
  customerId: v.id("customers"),
  quoteId: v.optional(v.id("quotes")),
  description: v.optional(v.string()),
  value: v.optional(v.number()),
  status: v.union(
    v.literal("te-plannen"),
    v.literal("gepland"),
    v.literal("in-uitvoering"),
    v.literal("herkeuring"),
    v.literal("afgerond")
  ),
  assignedUserId: v.optional(v.id("users")),
  createdBy: v.id("users"),
  expectedStartDate: v.optional(v.number()),
  expectedDuration: v.optional(v.number()),
  specialInstructions: v.optional(v.string()),
  completionDate: v.optional(v.number()),
  completionId: v.optional(v.id("projectCompletions")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_status", ["status"])
  .index("by_customer", ["customerId"])
  .index("by_assigned_user", ["assignedUserId"])
  .index("by_created_by", ["createdBy"]),

projectTasks: defineTable({
  projectId: v.id("projects"),
  blockTitle: v.string(),
  taskDescription: v.optional(v.string()),
  isInfoBlock: v.boolean(),
  infoText: v.optional(v.string()),
  isCompleted: v.boolean(),
  orderIndex: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_project", ["projectId"]),
```

**Convex Queries with Role-Based Filtering:**
```typescript
// convex/projects.ts
export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    const role = user.role;
    
    let query = ctx.db.query("projects");
    
    // Apply role-based filtering
    if (role === "Installateur") {
      // Only assigned projects
      query = query
        .withIndex("by_assigned_user", q =>
          q.eq("assignedUserId", user._id)
        );
    } else if (role === "Verkoper") {
      // Only own projects
      query = query
        .withIndex("by_created_by", q =>
          q.eq("createdBy", user._id)
        );
    }
    // Administrator, Administratie, Bekijker see all
    
    // Apply status filter if provided
    if (args.status) {
      query = query.filter(q =>
        q.eq(q.field("status"), args.status)
      );
    }
    
    const projects = await query.order("desc").take(100);
    
    // Hydrate with customer and tasks
    return await Promise.all(
      projects.map(async project => {
        const customer = await ctx.db.get(project.customerId);
        const tasks = await ctx.db
          .query("projectTasks")
          .withIndex("by_project", q =>
            q.eq("projectId", project._id)
          )
          .collect();
          
        return {
          ...project,
          customer,
          tasks,
          completionPercentage: calculateCompletion(tasks),
        };
      })
    );
  },
});

function calculateCompletion(tasks) {
  const completableTasks = tasks.filter(t => !t.isInfoBlock);
  if (completableTasks.length === 0) return 100;
  
  const completed = completableTasks.filter(t => t.isCompleted).length;
  return Math.round((completed / completableTasks.length) * 100);
}

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const project = await ctx.db.get(args.id);
    if (!project) return null;
    
    // Check access based on role
    const user = await getUserByIdentity(ctx, identity);
    const hasAccess = await canAccessProject(ctx, user, project);
    
    if (!hasAccess) {
      throw new Error("You don't have access to this project");
    }
    
    // Hydrate full project data
    const customer = await ctx.db.get(project.customerId);
    const tasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_project", q => q.eq("projectId", args.id))
      .order("asc", "orderIndex")
      .collect();
      
    const assignedUser = project.assignedUserId
      ? await ctx.db.get(project.assignedUserId)
      : null;
      
    return {
      ...project,
      customer,
      tasks,
      assignedUser,
    };
  },
});

async function canAccessProject(ctx, user, project) {
  if (["Administrator", "Administratie", "Bekijker"].includes(user.role)) {
    return true;
  }
  
  if (user.role === "Installateur") {
    return project.assignedUserId === user._id;
  }
  
  if (user.role === "Verkoper") {
    return project.createdBy === user._id;
  }
  
  return false;
}
```

**Project Status Automation:**
```typescript
// convex/projects.ts

// Called when planning is created
export const updateStatusToGepland = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      status: "gepland",
      updatedAt: Date.now(),
    });
  },
});

// Called when installer starts work
export const startProject = mutation({
  args: {
    projectId: v.id("projects"),
    gpsCoords: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      accuracy: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    const project = await ctx.db.get(args.projectId);
    
    // Verify user is assigned to project
    if (project.assignedUserId !== user._id) {
      throw new Error("You are not assigned to this project");
    }
    
    // Create work time log entry
    const workLogId = await ctx.db.insert("workTimeLogs", {
      projectId: args.projectId,
      userId: user._id,
      startTime: Date.now(),
      startGps: args.gpsCoords,
      status: "in-progress",
    });
    
    // Update project status
    await ctx.db.patch(args.projectId, {
      status: "in-uitvoering",
      updatedAt: Date.now(),
    });
    
    return workLogId;
  },
});

// Called when project completion wizard is finished
export const completeProject = mutation({
  args: {
    projectId: v.id("projects"),
    completionId: v.id("projectCompletions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      status: "afgerond",
      completionDate: Date.now(),
      completionId: args.completionId,
      updatedAt: Date.now(),
    });
  },
});
```

### 4.2.6 Business Rules

**BR-PROJ-001**: Projects cannot be deleted once status is "afgerond"  
**BR-PROJ-002**: Only assigned installer can start project  
**BR-PROJ-003**: Status automatically changes when planning created  
**BR-PROJ-004**: Installateur can only complete assigned projects  
**BR-PROJ-005**: Verkoper sees only projects they created  

---

## 4.3 Quote System

### 4.3.1 Overview
Professional quote generation with PDF output, email delivery, and approval workflow.

### 4.3.2 Functional Requirements

**FR-QUOTE-001: Quote Builder**
- Line items with description, quantity, unit price
- Automatic subtotal calculation
- VAT calculation (21%, 9%, 0%)
- Discount (percentage or fixed amount)
- Total calculation
- Quote validity period (default 30 days)

**FR-QUOTE-002: PDF Generation**
- Professional branded template
- Company logo and details
- Customer information
- Line items table
- Terms and conditions
- Digital signature option
- Save to Convex file storage

**FR-QUOTE-003: Email Delivery**
- Send quote PDF to customer email
- Professional email template
- CC to creator
- Track sent date
- Resend functionality

**FR-QUOTE-004: Quote Status**
- Draft: Being edited
- Sent: Emailed to customer
- Approved: Customer accepted
- Rejected: Customer declined
- Expired: Validity period passed
- Converted: Turned into project

**FR-QUOTE-005: Quote Approval**
- Customer can approve via email link
- Automatic project creation on approval
- Notification to sales person

### 4.3.3 Technical Specifications

**Convex Schema:**
```typescript
quotes: defineTable({
  quoteNumber: v.string(), // Auto-generated: QUO-2025-001
  customerId: v.id("customers"),
  title: v.string(),
  description: v.optional(v.string()),
  status: v.union(
    v.literal("draft"),
    v.literal("sent"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("expired"),
    v.literal("converted")
  ),
  subtotal: v.number(),
  vatRate: v.number(), // e.g., 21
  vatAmount: v.number(),
  discountType: v.union(v.literal("percentage"), v.literal("fixed")),
  discountValue: v.number(),
  discountAmount: v.number(),
  total: v.number(),
  validityDays: v.number(), // default 30
  validUntil: v.number(),
  terms: v.optional(v.string()),
  pdfFileId: v.optional(v.id("_storage")),
  sentAt: v.optional(v.number()),
  approvedAt: v.optional(v.number()),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_customer", ["customerId"])
  .index("by_status", ["status"])
  .index("by_quote_number", ["quoteNumber"]),

quoteItems: defineTable({
  quoteId: v.id("quotes"),
  description: v.string(),
  quantity: v.number(),
  unitPrice: v.number(),
  total: v.number(),
  orderIndex: v.number(),
})
  .index("by_quote", ["quoteId"]),
```

**Quote Calculations (Convex Action):**
```typescript
// convex/quotes.ts
export const calculateQuoteTotals = internalMutation({
  args: {
    subtotal: v.number(),
    vatRate: v.number(),
    discountType: v.string(),
    discountValue: v.number(),
  },
  handler: async (ctx, args) => {
    const { subtotal, vatRate, discountType, discountValue } = args;
    
    // Calculate discount amount
    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = subtotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }
    
    // Calculate VAT and total
    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatAmount = subtotalAfterDiscount * (vatRate / 100);
    const total = subtotalAfterDiscount + vatAmount;
    
    return {
      discountAmount,
      vatAmount,
      total,
    };
  },
});

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    title: v.string(),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
    })),
    vatRate: v.number(),
    discountType: v.optional(v.string()),
    discountValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    // Generate quote number
    const quoteNumber = await generateQuoteNumber(ctx);
    
    // Calculate subtotal from items
    const subtotal = args.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    );
    
    // Calculate totals
    const { discountAmount, vatAmount, total } = await calculateQuoteTotals(ctx, {
      subtotal,
      vatRate: args.vatRate,
      discountType: args.discountType || "fixed",
      discountValue: args.discountValue || 0,
    });
    
    // Create quote
    const quoteId = await ctx.db.insert("quotes", {
      quoteNumber,
      customerId: args.customerId,
      title: args.title,
      status: "draft",
      subtotal,
      vatRate: args.vatRate,
      vatAmount,
      discountType: args.discountType || "fixed",
      discountValue: args.discountValue || 0,
      discountAmount,
      total,
      validityDays: 30,
      validUntil: Date.now() + (30 * 24 * 60 * 60 * 1000),
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Insert quote items
    for (let i = 0; i < args.items.length; i++) {
      const item = args.items[i];
      await ctx.db.insert("quoteItems", {
        quoteId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        orderIndex: i,
      });
    }
    
    return quoteId;
  },
});
```

**PDF Generation (Convex Action):**
```typescript
// convex/quotes.ts
export const generateQuotePDF = action({
  args: { quoteId: v.id("quotes") },
  handler: async (ctx, args) => {
    // Fetch quote data
    const quote = await ctx.runQuery(api.quotes.getById, {
      id: args.quoteId,
    });
    
    // Generate HTML from template
    const html = generateQuoteHTML(quote);
    
    // Call external PDF service (e.g., PDFShift, DocRaptor)
    const response = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(process.env.PDFSHIFT_API_KEY + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: html,
        landscape: false,
        use_print: true,
      }),
    });
    
    if (!response.ok) {
      throw new Error("PDF generation failed");
    }
    
    const pdfBuffer = await response.arrayBuffer();
    
    // Upload to Convex storage
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    const storageId = await ctx.storage.store(blob);
    
    // Update quote with PDF reference
    await ctx.runMutation(api.quotes.updatePDFReference, {
      quoteId: args.quoteId,
      pdfFileId: storageId,
    });
    
    return storageId;
  },
});

function generateQuoteHTML(quote) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .company-logo { max-width: 200px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f0f0f0; }
    .total-row { font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>OFFERTE</h1>
    <p>Offerte Nummer: ${quote.quoteNumber}</p>
    <p>Datum: ${new Date(quote.createdAt).toLocaleDateString("nl-NL")}</p>
  </div>
  
  <div class="info-grid">
    <div>
      <h3>SMANS BV</h3>
      <p>Bedrijfstraat 123<br>1234 AB Amsterdam<br>+31 6 12345678<br>info@smans.nl</p>
    </div>
    <div>
      <h3>Klant</h3>
      <p>${quote.customer.name}<br>
      ${quote.customer.address.street}<br>
      ${quote.customer.address.postalCode} ${quote.customer.address.city}<br>
      ${quote.customer.email}</p>
    </div>
  </div>
  
  <h3>${quote.title}</h3>
  
  <table>
    <thead>
      <tr>
        <th>Omschrijving</th>
        <th>Aantal</th>
        <th>Prijs per stuk</th>
        <th>Totaal</th>
      </tr>
    </thead>
    <tbody>
      ${quote.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>€${item.unitPrice.toFixed(2)}</td>
          <td>€${item.total.toFixed(2)}</td>
        </tr>
      `).join("")}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3">Subtotaal</td>
        <td>€${quote.subtotal.toFixed(2)}</td>
      </tr>
      ${quote.discountAmount > 0 ? `
      <tr>
        <td colspan="3">Korting (${quote.discountType === "percentage" ? quote.discountValue + "%" : "€" + quote.discountValue})</td>
        <td>-€${quote.discountAmount.toFixed(2)}</td>
      </tr>
      ` : ""}
      <tr>
        <td colspan="3">BTW (${quote.vatRate}%)</td>
        <td>€${quote.vatAmount.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="3">TOTAAL</td>
        <td>€${quote.total.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
  
  <p><strong>Deze offerte is geldig tot: ${new Date(quote.validUntil).toLocaleDateString("nl-NL")}</strong></p>
  
  <p><small>Algemene voorwaarden zijn van toepassing. Betaling binnen 30 dagen na factuurdatum.</small></p>
</body>
</html>
  `;
}
```

**Email Sending (Convex Action):**
```typescript
// convex/quotes.ts
export const sendQuoteEmail = action({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.runQuery(api.quotes.getById, {
      id: args.quoteId,
    });
    
    if (!quote.pdfFileId) {
      throw new Error("Quote PDF must be generated first");
    }
    
    // Get PDF URL
    const pdfUrl = await ctx.storage.getUrl(quote.pdfFileId);
    
    // Send email via SMTP service (e.g., Resend)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SMANS BV <offerte@smans.nl>",
        to: [quote.customer.email],
        subject: `Offerte ${quote.quoteNumber} - ${quote.title}`,
        html: generateQuoteEmailHTML(quote),
        attachments: [
          {
            filename: `Offerte-${quote.quoteNumber}.pdf`,
            path: pdfUrl,
          },
        ],
      }),
    });
    
    if (!response.ok) {
      throw new Error("Email sending failed");
    }
    
    // Update quote status
    await ctx.runMutation(api.quotes.markAsSent, {
      quoteId: args.quoteId,
    });
    
    return { success: true };
  },
});

function generateQuoteEmailHTML(quote) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Beste ${quote.customer.contactPerson || quote.customer.name},</h2>
  
  <p>Hierbij ontvangt u onze offerte voor: <strong>${quote.title}</strong></p>
  
  <p>Offerte nummer: <strong>${quote.quoteNumber}</strong><br>
  Totaalbedrag: <strong>€${quote.total.toFixed(2)}</strong> (incl. BTW)<br>
  Geldig tot: <strong>${new Date(quote.validUntil).toLocaleDateString("nl-NL")}</strong></p>
  
  <p>De offerte vindt u als bijlage bij deze e-mail.</p>
  
  <p>Heeft u vragen over deze offerte? Neem dan gerust contact met ons op.</p>
  
  <p>Met vriendelijke groet,<br>
  SMANS BV</p>
  
  <hr>
  <p style="font-size: 12px; color: #666;">
    SMANS BV | Bedrijfstraat 123, 1234 AB Amsterdam<br>
    Tel: +31 6 12345678 | Email: info@smans.nl | Web: www.smans.nl
  </p>
</body>
</html>
  `;
}
```

---

*[Continue with sections 4.4-16 in next message...]*


