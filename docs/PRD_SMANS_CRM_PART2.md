# SMANS CRM - Product Requirements Document (PART 2)

**Version:** 1.0  
**Date:** January 9, 2025  
**Continued from:** [PRD_SMANS_CRM.md](./PRD_SMANS_CRM.md)

---

## 4.4 Invoice System

### 4.4.1 Overview
Complete invoice management with payment tracking and automated PDF generation.

### 4.4.2 Functional Requirements

**FR-INV-001: Invoice Creation**
- Create from completed projects
- Create from quotes
- Create manually
- Auto-populate customer and line items
- Multiple invoice types: Standard, Proforma, Credit Note

**FR-INV-002: Invoice Fields**
Required:
- Invoice number (auto-generated: INV-2025-001)
- Customer
- Invoice date
- Due date (default: +30 days)
- Line items
- Payment terms

Optional:
- Purchase order reference
- Notes
- Payment instructions

**FR-INV-003: Payment Tracking**
- Payment status: Unpaid, Partially Paid, Paid, Overdue
- Payment date tracking
- Payment method tracking
- Payment amount tracking
- Automatic overdue detection

**FR-INV-004: Invoice Status**
- Draft: Being edited
- Sent: Emailed to customer
- Paid: Full payment received
- Partially Paid: Partial payment received
- Overdue: Due date passed, not paid
- Cancelled: Invoice cancelled

**FR-INV-005: Reminders**
- Automatic payment reminders
- 7 days before due date
- On due date
- 7, 14, 30 days after due date

### 4.4.3 Access Control

**IMPORTANT:** Only Administrator and Administratie roles have access to invoices.

| Role | View | Create | Edit | Delete | Payment Tracking |
|------|------|--------|------|--------|------------------|
| Administrator | ✅ | ✅ | ✅ | ✅ | ✅ |
| Administratie | ✅ | ✅ | ✅ | ❌ | ✅ |
| Verkoper | ❌ | ❌ | ❌ | ❌ | ❌ |
| Installateur | ❌ | ❌ | ❌ | ❌ | ❌ |
| Bekijker | ✅ | ❌ | ❌ | ❌ | ❌ |

### 4.4.4 Technical Specifications

**Convex Schema:**
```typescript
invoices: defineTable({
  invoiceNumber: v.string(), // INV-2025-001
  customerId: v.id("customers"),
  projectId: v.optional(v.id("projects")),
  quoteId: v.optional(v.id("quotes")),
  type: v.union(
    v.literal("standard"),
    v.literal("proforma"),
    v.literal("credit_note")
  ),
  status: v.union(
    v.literal("draft"),
    v.literal("sent"),
    v.literal("paid"),
    v.literal("partially_paid"),
    v.literal("overdue"),
    v.literal("cancelled")
  ),
  invoiceDate: v.number(),
  dueDate: v.number(),
  subtotal: v.number(),
  vatRate: v.number(),
  vatAmount: v.number(),
  discountAmount: v.number(),
  total: v.number(),
  paidAmount: v.number(),
  remainingAmount: v.number(),
  paymentTerms: v.string(), // e.g., "30 days"
  purchaseOrder: v.optional(v.string()),
  notes: v.optional(v.string()),
  pdfFileId: v.optional(v.id("_storage")),
  sentAt: v.optional(v.number()),
  paidAt: v.optional(v.number()),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_customer", ["customerId"])
  .index("by_status", ["status"])
  .index("by_invoice_number", ["invoiceNumber"])
  .index("by_due_date", ["dueDate"]),

invoiceItems: defineTable({
  invoiceId: v.id("invoices"),
  description: v.string(),
  quantity: v.number(),
  unitPrice: v.number(),
  total: v.number(),
  orderIndex: v.number(),
}).index("by_invoice", ["invoiceId"]),

invoicePayments: defineTable({
  invoiceId: v.id("invoices"),
  amount: v.number(),
  paymentDate: v.number(),
  paymentMethod: v.string(), // "bank_transfer", "cash", "card"
  reference: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdBy: v.id("users"),
  createdAt: v.number(),
}).index("by_invoice", ["invoiceId"]),
```

**Convex Queries with Access Control:**
```typescript
// convex/invoices.ts
export const list = query({
  args: {
    status: v.optional(v.string()),
    customerId: v.optional(v.id("customers")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    // Check role - only Administrator and Administratie
    if (!["Administrator", "Administratie", "Bekijker"].includes(user.role)) {
      throw new Error("Access denied: Invoices are only accessible to administrators and administrative staff");
    }
    
    let query = ctx.db.query("invoices");
    
    // Apply filters
    if (args.status) {
      query = query
        .withIndex("by_status", q => q.eq("status", args.status));
    }
    
    if (args.customerId) {
      query = query
        .withIndex("by_customer", q => q.eq("customerId", args.customerId));
    }
    
    const invoices = await query.order("desc").take(100);
    
    // Hydrate with customer data
    return await Promise.all(
      invoices.map(async invoice => {
        const customer = await ctx.db.get(invoice.customerId);
        const items = await ctx.db
          .query("invoiceItems")
          .withIndex("by_invoice", q => q.eq("invoiceId", invoice._id))
          .collect();
          
        return {
          ...invoice,
          customer,
          items,
        };
      })
    );
  },
});

// Check for overdue invoices (Convex Scheduled Job)
export const checkOverdueInvoices = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find unpaid invoices past due date
    const overdueInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_due_date")
      .filter(q =>
        q.and(
          q.lt(q.field("dueDate"), now),
          q.neq(q.field("status"), "paid"),
          q.neq(q.field("status"), "cancelled")
        )
      )
      .collect();
      
    // Update status to overdue
    for (const invoice of overdueInvoices) {
      await ctx.db.patch(invoice._id, {
        status: "overdue",
        updatedAt: now,
      });
    }
    
    return { updated: overdueInvoices.length };
  },
});
```

**Scheduled Job Configuration:**
```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for overdue invoices daily at 9 AM
crons.daily(
  "check overdue invoices",
  { hourUTC: 7 }, // 9 AM CEST = 7 AM UTC
  internal.invoices.checkOverdueInvoices
);

export default crons;
```

**Payment Recording:**
```typescript
// convex/invoices.ts
export const recordPayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
    amount: v.number(),
    paymentDate: v.number(),
    paymentMethod: v.string(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    // Check permission
    if (!["Administrator", "Administratie"].includes(user.role)) {
      throw new Error("Access denied");
    }
    
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    
    // Record payment
    await ctx.db.insert("invoicePayments", {
      invoiceId: args.invoiceId,
      amount: args.amount,
      paymentDate: args.paymentDate,
      paymentMethod: args.paymentMethod,
      reference: args.reference,
      notes: args.notes,
      createdBy: user._id,
      createdAt: Date.now(),
    });
    
    // Update invoice amounts
    const newPaidAmount = invoice.paidAmount + args.amount;
    const newRemainingAmount = invoice.total - newPaidAmount;
    
    let newStatus = invoice.status;
    if (newRemainingAmount <= 0) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partially_paid";
    }
    
    await ctx.db.patch(args.invoiceId, {
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      status: newStatus,
      paidAt: newRemainingAmount <= 0 ? Date.now() : invoice.paidAt,
      updatedAt: Date.now(),
    });
    
    return { success: true, newStatus };
  },
});
```

---

## 4.5 Planning System

### 4.5.1 Overview
Visual calendar-based planning with installer assignment and customer notifications.

### 4.5.2 Functional Requirements

**FR-PLAN-001: Calendar Views**
- Day view: Hourly breakdown
- Week view: 7 days overview
- Month view: Full month calendar
- List view: Chronological list

**FR-PLAN-002: Planning Items**
- Link to project (optional)
- Link to customer (required)
- Assign installer(s) (single or multiple)
- Set date and time (start/end)
- Expected duration
- Location/address
- Special instructions
- Planning type: Customer appointment, Internal meeting, Maintenance

**FR-PLAN-003: Customer Notifications**
- Send appointment confirmation email
- Include iCal attachment
- Option to notify via SMS (optional)
- Automated reminder 24 hours before
- Customer can confirm/reschedule via link

**FR-PLAN-004: Conflict Detection**
- Warn when installer is double-booked
- Suggest alternative times
- Show installer availability
- Calculate travel time between appointments

**FR-PLAN-005: Drag & Drop**
- Drag planning items to reschedule
- Drag to reassign installers
- Visual feedback during drag
- Auto-save on drop

### 4.5.3 User Stories

**US-PLAN-001**
```
As an Administratie
I want to drag-and-drop projects on the calendar
So that I can quickly schedule installers

Acceptance Criteria:
- Can drag unscheduled projects from sidebar
- Can drop on specific date/time slot
- Installer auto-assigned based on drop location
- Project status updates to "gepland"
- Confirmation shown on successful drop
```

**US-PLAN-002**
```
As an Installateur
I want to see my daily schedule on mobile
So that I know where to go and when

Acceptance Criteria:
- Shows today's appointments by default
- Sorted by time (earliest first)
- Shows customer name, address, time
- Can tap address to open navigation
- Can tap phone to call customer
- Shows project details on tap
```

**US-PLAN-003**
```
As a Customer
I want to receive appointment confirmation
So that I know when the installer will arrive

Acceptance Criteria:
- Receives email within 5 minutes of planning
- Email includes date, time, expected duration
- Email includes installer name and photo
- Email includes company contact info
- iCal attachment can be added to calendar
- Receives reminder 24 hours before
```

### 4.5.4 Technical Specifications

**Convex Schema:**
```typescript
planningItems: defineTable({
  projectId: v.optional(v.id("projects")),
  customerId: v.id("customers"),
  assignedUserId: v.id("users"), // Primary installer
  additionalUserIds: v.optional(v.array(v.id("users"))), // Team members
  title: v.string(),
  description: v.optional(v.string()),
  startDate: v.number(), // Unix timestamp
  startTime: v.string(), // "09:00"
  endTime: v.string(), // "17:00"
  expectedDurationMinutes: v.number(),
  location: v.optional(v.string()),
  specialInstructions: v.optional(v.string()),
  planningType: v.union(
    v.literal("customer"),
    v.literal("internal"),
    v.literal("maintenance")
  ),
  status: v.union(
    v.literal("Gepland"),
    v.literal("Bevestigd"),
    v.literal("Afgerond"),
    v.literal("Geannuleerd")
  ),
  notifyCustomer: v.boolean(),
  notifySms: v.boolean(),
  customerNotifiedAt: v.optional(v.number()),
  customerConfirmedAt: v.optional(v.number()),
  reminderSentAt: v.optional(v.number()),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_assigned_user", ["assignedUserId"])
  .index("by_date", ["startDate"])
  .index("by_customer", ["customerId"])
  .index("by_project", ["projectId"]),
```

**Calendar Data Query:**
```typescript
// convex/planning.ts
export const getCalendarData = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    let query = ctx.db.query("planningItems");
    
    // Filter by user if Installateur
    if (user.role === "Installateur") {
      query = query.withIndex("by_assigned_user", q =>
        q.eq("assignedUserId", user._id)
      );
    } else if (args.userId) {
      // Filter by specific user if provided
      query = query.withIndex("by_assigned_user", q =>
        q.eq("assignedUserId", args.userId)
      );
    }
    
    // Filter by date range
    const items = await query.collect();
    const filtered = items.filter(item =>
      item.startDate >= args.startDate &&
      item.startDate <= args.endDate
    );
    
    // Hydrate with related data
    return await Promise.all(
      filtered.map(async item => {
        const customer = await ctx.db.get(item.customerId);
        const assignedUser = await ctx.db.get(item.assignedUserId);
        const project = item.projectId
          ? await ctx.db.get(item.projectId)
          : null;
          
        return {
          ...item,
          customer,
          assignedUser,
          project,
        };
      })
    );
  },
});
```

**Conflict Detection:**
```typescript
// convex/planning.ts
export const checkConflicts = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    excludeId: v.optional(v.id("planningItems")),
  },
  handler: async (ctx, args) => {
    // Get all planning items for user on this date
    const items = await ctx.db
      .query("planningItems")
      .withIndex("by_assigned_user", q =>
        q.eq("assignedUserId", args.userId)
      )
      .filter(q => q.eq(q.field("startDate"), args.startDate))
      .collect();
      
    // Filter out current item if editing
    const relevantItems = args.excludeId
      ? items.filter(item => item._id !== args.excludeId)
      : items;
      
    // Check for overlaps
    const conflicts = relevantItems.filter(item => {
      return timeOverlaps(
        args.startTime,
        args.endTime,
        item.startTime,
        item.endTime
      );
    });
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts: await Promise.all(
        conflicts.map(async item => ({
          ...item,
          customer: await ctx.db.get(item.customerId),
        }))
      ),
    };
  },
});

function timeOverlaps(start1, end1, start2, end2) {
  // Convert time strings to minutes
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  
  // Check overlap
  return s1 < e2 && e1 > s2;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
```

**Customer Notification (Convex Action):**
```typescript
// convex/planning.ts
export const sendCustomerNotification = action({
  args: {
    planningItemId: v.id("planningItems"),
  },
  handler: async (ctx, args) => {
    const planning = await ctx.runQuery(api.planning.getById, {
      id: args.planningItemId,
    });
    
    if (!planning.notifyCustomer) {
      return { success: false, reason: "Customer notification disabled" };
    }
    
    // Generate iCal attachment
    const icalContent = generateICalEvent(planning);
    
    // Send email
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SMANS BV <afspraak@smans.nl>",
        to: [planning.customer.email],
        subject: `Bevestiging afspraak ${new Date(planning.startDate).toLocaleDateString("nl-NL")}`,
        html: generateAppointmentEmailHTML(planning),
        attachments: [
          {
            filename: "afspraak.ics",
            content: Buffer.from(icalContent).toString("base64"),
          },
        ],
      }),
    });
    
    if (!response.ok) {
      throw new Error("Email sending failed");
    }
    
    // Update planning
    await ctx.runMutation(api.planning.markAsNotified, {
      planningItemId: args.planningItemId,
    });
    
    // Schedule reminder for 24 hours before
    const reminderTime = planning.startDate - (24 * 60 * 60 * 1000);
    await ctx.scheduler.runAt(reminderTime, internal.planning.sendReminder, {
      planningItemId: args.planningItemId,
    });
    
    return { success: true };
  },
});

function generateICalEvent(planning) {
  const startDateTime = new Date(planning.startDate);
  const [startHours, startMinutes] = planning.startTime.split(":").map(Number);
  startDateTime.setHours(startHours, startMinutes, 0, 0);
  
  const [endHours, endMinutes] = planning.endTime.split(":").map(Number);
  const endDateTime = new Date(planning.startDate);
  endDateTime.setHours(endHours, endMinutes, 0, 0);
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SMANS BV//CRM//NL
BEGIN:VEVENT
UID:${planning._id}@smans.nl
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(startDateTime)}
DTEND:${formatICalDate(endDateTime)}
SUMMARY:${planning.title}
DESCRIPTION:${planning.description || "Afspraak met SMANS BV"}
LOCATION:${planning.location || planning.customer.address.street}
ORGANIZER;CN=SMANS BV:mailto:info@smans.nl
ATTENDEE;CN=${planning.customer.name}:mailto:${planning.customer.email}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

function formatICalDate(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}
```

---

## 4.6 Chat System with Translation

### 4.6.1 Overview
Real-time messaging with automatic language detection and translation for multi-lingual teams.

### 4.6.2 Functional Requirements

**FR-CHAT-001: Direct Messaging**
- One-on-one conversations
- Real-time message delivery (< 1 second)
- Read receipts
- Online/offline status
- Typing indicators

**FR-CHAT-002: Multi-Language Support**
- Automatic language detection (Dutch, English, Polish)
- Real-time translation via Google Translate API
- Display both original and translated text
- Per-user language preferences
- Translation caching for performance

**FR-CHAT-003: Message Features**
- Text messages (max 2000 characters)
- File sharing (images, PDFs, max 10MB)
- Link previews
- Emoji support
- Message search

**FR-CHAT-004: Conversation Management**
- Conversation list with last message preview
- Unread message count
- Archive conversations
- Delete conversations (own messages only)
- Pin important conversations

**FR-CHAT-005: Access Control**
- Administrator: Can chat with everyone
- Administratie: Can chat with everyone
- Verkoper: Can chat with everyone
- Installateur: Can ONLY chat with Administrators and Administratie
- Bekijker: No chat access

### 4.6.3 Technical Specifications

**Convex Schema:**
```typescript
directMessages: defineTable({
  fromUserId: v.id("users"),
  toUserId: v.id("users"),
  content: v.string(),
  originalLanguage: v.string(), // "nl", "en", "pl"
  translatedContent: v.optional(v.object({
    nl: v.optional(v.string()),
    en: v.optional(v.string()),
    pl: v.optional(v.string()),
  })),
  fileId: v.optional(v.id("_storage")),
  fileName: v.optional(v.string()),
  fileType: v.optional(v.string()),
  fileSize: v.optional(v.number()),
  isRead: v.boolean(),
  readAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_from_user", ["fromUserId"])
  .index("by_to_user", ["toUserId"])
  .index("by_conversation", ["fromUserId", "toUserId"]),

userPresence: defineTable({
  userId: v.id("users"),
  status: v.union(v.literal("online"), v.literal("offline")),
  lastSeen: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"]),
```

**Convex Queries - Reactive Conversations:**
```typescript
// convex/chat.ts
export const getConversations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    // Check access
    if (user.role === "Bekijker") {
      throw new Error("Viewers don't have chat access");
    }
    
    // Get all messages where user is sender or receiver
    const sentMessages = await ctx.db
      .query("directMessages")
      .withIndex("by_from_user", q => q.eq("fromUserId", user._id))
      .collect();
      
    const receivedMessages = await ctx.db
      .query("directMessages")
      .withIndex("by_to_user", q => q.eq("toUserId", user._id))
      .collect();
      
    // Group by conversation partner
    const conversationMap = new Map();
    
    for (const msg of [...sentMessages, ...receivedMessages]) {
      const partnerId = msg.fromUserId === user._id
        ? msg.toUserId
        : msg.fromUserId;
        
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, []);
      }
      conversationMap.get(partnerId).push(msg);
    }
    
    // Build conversation list
    const conversations = await Promise.all(
      Array.from(conversationMap.entries()).map(async ([partnerId, messages]) => {
        const partner = await ctx.db.get(partnerId);
        const sortedMessages = messages.sort((a, b) => b.createdAt - a.createdAt);
        const lastMessage = sortedMessages[0];
        const unreadCount = messages.filter(
          m => m.toUserId === user._id && !m.isRead
        ).length;
        
        // Get presence
        const presence = await ctx.db
          .query("userPresence")
          .withIndex("by_user", q => q.eq("userId", partnerId))
          .first();
        
        return {
          partner,
          lastMessage,
          unreadCount,
          isOnline: presence?.status === "online",
          lastSeen: presence?.lastSeen,
        };
      })
    );
    
    // Sort by last message time
    return conversations.sort((a, b) =>
      b.lastMessage.createdAt - a.lastMessage.createdAt
    );
  },
});

export const getMessages = query({
  args: {
    partnerId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    // Check access
    if (user.role === "Bekijker") {
      throw new Error("Access denied");
    }
    
    // Check if Installateur can chat with this person
    if (user.role === "Installateur") {
      const partner = await ctx.db.get(args.partnerId);
      if (!["Administrator", "Administratie"].includes(partner.role)) {
        throw new Error("Installers can only chat with administrators");
      }
    }
    
    // Get all messages in conversation
    const messages = await ctx.db.query("directMessages").collect();
    const conversationMessages = messages.filter(
      m =>
        (m.fromUserId === user._id && m.toUserId === args.partnerId) ||
        (m.fromUserId === args.partnerId && m.toUserId === user._id)
    );
    
    // Sort by time
    const sorted = conversationMessages.sort((a, b) => a.createdAt - b.createdAt);
    
    // Apply limit if provided
    const limited = args.limit
      ? sorted.slice(-args.limit)
      : sorted;
      
    return limited;
  },
});
```

**Send Message with Translation (Convex Action):**
```typescript
// convex/chat.ts
export const sendMessage = mutation({
  args: {
    toUserId: v.id("users"),
    content: v.string(),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    // Check access
    if (user.role === "Bekijker") {
      throw new Error("Access denied");
    }
    
    // Check Installateur restrictions
    if (user.role === "Installateur") {
      const recipient = await ctx.db.get(args.toUserId);
      if (!["Administrator", "Administratie"].includes(recipient.role)) {
        throw new Error("Installers can only chat with administrators");
      }
    }
    
    // Detect language
    const detectedLanguage = await detectLanguage(args.content);
    
    // Create message
    const messageId = await ctx.db.insert("directMessages", {
      fromUserId: user._id,
      toUserId: args.toUserId,
      content: args.content,
      originalLanguage: detectedLanguage,
      fileId: args.fileId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      isRead: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Schedule translation in background
    await ctx.scheduler.runAfter(0, internal.chat.translateMessage, {
      messageId,
    });
    
    return messageId;
  },
});

// Internal mutation to translate message
export const translateMessage = internalMutation({
  args: { messageId: v.id("directMessages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;
    
    const recipient = await ctx.db.get(message.toUserId);
    const recipientLanguage = recipient.language || "nl";
    
    // Skip if already in recipient's language
    if (message.originalLanguage === recipientLanguage) {
      return;
    }
    
    // Translate to recipient's language
    const translated = await translateText(
      message.content,
      message.originalLanguage,
      recipientLanguage
    );
    
    // Update message with translation
    await ctx.db.patch(args.messageId, {
      translatedContent: {
        [recipientLanguage]: translated,
      },
      updatedAt: Date.now(),
    });
  },
});

// External API call for language detection
async function detectLanguage(text: string): Promise<string> {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2/detect?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text }),
    }
  );
  
  const data = await response.json();
  const detected = data.data.detections[0][0].language;
  
  // Map to supported languages
  if (detected.startsWith("nl")) return "nl";
  if (detected.startsWith("pl")) return "pl";
  return "en"; // default
}

// External API call for translation
async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string> {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: from,
        target: to,
        format: "text",
      }),
    }
  );
  
  const data = await response.json();
  return data.data.translations[0].translatedText;
}
```

**Presence Tracking:**
```typescript
// convex/chat.ts
export const updatePresence = mutation({
  args: {
    status: v.union(v.literal("online"), v.literal("offline")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    const existing = await ctx.db
      .query("userPresence")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .first();
      
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        lastSeen: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userPresence", {
        userId: user._id,
        status: args.status,
        lastSeen: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Automatically mark users as offline after 5 minutes
export const cleanupStalePresence = internalMutation({
  handler: async (ctx) => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    const stalePresences = await ctx.db
      .query("userPresence")
      .filter(q =>
        q.and(
          q.eq(q.field("status"), "online"),
          q.lt(q.field("updatedAt"), fiveMinutesAgo)
        )
      )
      .collect();
      
    for (const presence of stalePresences) {
      await ctx.db.patch(presence._id, {
        status: "offline",
        updatedAt: Date.now(),
      });
    }
    
    return { cleaned: stalePresences.length };
  },
});
```

---

## 4.7 Receipt System (Bonnetjes)

### 4.7.1 Overview
Mobile receipt scanning with approval workflow for expense tracking.

### 4.7.2 Functional Requirements

**FR-RECEIPT-001: Receipt Upload**
- Camera integration (native)
- Gallery selection fallback
- Image compression (max 2MB)
- Preview before upload
- Multiple receipts per upload

**FR-RECEIPT-002: Receipt Data**
Required:
- Photo/scan of receipt
- Amount (€)
- Category (material, tools, fuel, parking, other)
- Date

Optional:
- Supplier name
- Description/notes
- Project reference
- VAT amount

**FR-RECEIPT-003: Approval Workflow**
- Status: Pending → Approved / Rejected
- Only Administrator and Administratie can approve
- Rejection requires reason
- Notification on status change

**FR-RECEIPT-004: OCR (Optional Future Feature)**
- Extract amount automatically
- Extract date automatically
- Extract supplier name
- User confirms/corrects extracted data

### 4.7.3 User Stories

**US-RECEIPT-001**
```
As an Installateur
I want to scan receipts with my phone camera
So that I don't lose paper receipts

Acceptance Criteria:
- Can open camera from receipt screen
- Photo is compressed automatically
- Can add amount and category before upload
- Upload completes in < 10 seconds
- Success confirmation shown
```

**US-RECEIPT-002**
```
As an Administratie
I want to approve/reject receipts in bulk
So that I can process expenses efficiently

Acceptance Criteria:
- Can select multiple receipts
- Can approve all selected at once
- Can reject with single reason for all
- Filtered view shows only pending
- Notification sent to uploader
```

### 4.7.4 Technical Specifications

**Convex Schema:**
```typescript
receipts: defineTable({
  userId: v.id("users"),
  projectId: v.optional(v.id("projects")),
  amount: v.number(),
  category: v.union(
    v.literal("material"),
    v.literal("tools"),
    v.literal("fuel"),
    v.literal("parking"),
    v.literal("other")
  ),
  receiptDate: v.number(),
  supplier: v.optional(v.string()),
  description: v.optional(v.string()),
  vatAmount: v.optional(v.number()),
  receiptFileId: v.id("_storage"),
  fileName: v.string(),
  fileSize: v.number(),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected")
  ),
  approvedBy: v.optional(v.id("users")),
  approvedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_project", ["projectId"]),
```

**Upload Receipt (Mobile):**
```typescript
// convex/receipts.ts
export const create = mutation({
  args: {
    amount: v.number(),
    category: v.string(),
    receiptDate: v.number(),
    supplier: v.optional(v.string()),
    description: v.optional(v.string()),
    vatAmount: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    receiptFileId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    const receiptId = await ctx.db.insert("receipts", {
      userId: user._id,
      amount: args.amount,
      category: args.category,
      receiptDate: args.receiptDate,
      supplier: args.supplier,
      description: args.description,
      vatAmount: args.vatAmount,
      projectId: args.projectId,
      receiptFileId: args.receiptFileId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Notify administrators
    await ctx.scheduler.runAfter(0, internal.receipts.notifyAdmins, {
      receiptId,
    });
    
    return receiptId;
  },
});

export const approve = mutation({
  args: {
    receiptId: v.id("receipts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    // Check permission
    if (!["Administrator", "Administratie"].includes(user.role)) {
      throw new Error("Only administrators can approve receipts");
    }
    
    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) throw new Error("Receipt not found");
    
    await ctx.db.patch(args.receiptId, {
      status: "approved",
      approvedBy: user._id,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Notify uploader
    await ctx.scheduler.runAfter(0, internal.receipts.notifyUser, {
      receiptId: args.receiptId,
      status: "approved",
    });
    
    return { success: true };
  },
});

export const reject = mutation({
  args: {
    receiptId: v.id("receipts"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    // Check permission
    if (!["Administrator", "Administratie"].includes(user.role)) {
      throw new Error("Only administrators can reject receipts");
    }
    
    await ctx.db.patch(args.receiptId, {
      status: "rejected",
      approvedBy: user._id,
      approvedAt: Date.now(),
      rejectionReason: args.reason,
      updatedAt: Date.now(),
    });
    
    // Notify uploader
    await ctx.scheduler.runAfter(0, internal.receipts.notifyUser, {
      receiptId: args.receiptId,
      status: "rejected",
    });
    
    return { success: true };
  },
});
```

---

## 4.8 Work Order System (Werkbon)

### 4.8.1 Overview
7-step completion wizard for creating professional work orders with photos, signatures, and automated PDF delivery.

### 4.8.2 7-Step Completion Wizard

**Step 1: Project Information**
- Pre-filled customer data
- Work performed description (required)
- Materials used (optional)

**Step 2: Before Photos**
- Category: 'before'
- Optional (0-10 photos)
- Compressed automatically

**Step 3: During Photos**
- Category: 'during'  
- Optional (0-10 photos)
- Shows progress

**Step 4: After Photos**
- Category: 'after'
- Recommended (0-15 photos)
- Final result

**Step 5: Customer Satisfaction**
- 1-5 star rating (required)
- Feedback text (optional)

**Step 6: Signatures**
- Customer signature (required)
- Installer signature (required)
- Canvas-based capture
- Saved as base64 PNG

**Step 7: Final Review**
- Recommendations for customer (optional)
- Internal notes (optional)
- Follow-up required checkbox
- Summary preview

### 4.8.3 Functional Requirements

**FR-WERK-001: Completion Creation**
- Only assigned installer can complete
- Requires GPS check-in first
- All required fields must be filled
- Validates before submission

**FR-WERK-002: Photo Management**
- Image compression (1920x1920 max, 85% quality)
- Category tagging
- Thumbnail generation
- Stored in Convex storage

**FR-WERK-003: PDF Generation**
- Professional branded template
- All completion data included
- Photo grids by category
- Task checklist
- Signatures
- Auto-generated filename

**FR-WERK-004: Email Delivery**
- Automatic email to customer
- PDF attached
- Professional template
- CC to installer and admin
- Tracked sent status

**FR-WERK-005: Work Time Tracking**
- GPS check-in on project start
- GPS check-out on completion
- Automatic duration calculation
- Location verification

### 4.8.4 Technical Specifications

**Convex Schema:**
```typescript
projectCompletions: defineTable({
  projectId: v.id("projects"),
  installerId: v.id("users"),
  workTimeLogId: v.optional(v.id("workTimeLogs")),
  completionDate: v.number(),
  workPerformed: v.string(),
  materialsUsed: v.optional(v.string()),
  recommendations: v.optional(v.string()),
  internalNotes: v.optional(v.string()),
  requiresFollowUp: v.boolean(),
  customerSatisfaction: v.number(), // 1-5
  customerFeedback: v.optional(v.string()),
  customerSignature: v.string(), // base64 PNG
  installerSignature: v.string(), // base64 PNG
  pdfFileId: v.optional(v.id("_storage")),
  status: v.union(
    v.literal("draft"),
    v.literal("completed"),
    v.literal("email_sent")
  ),
  emailSentAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_project", ["projectId"])
  .index("by_installer", ["installerId"]),

completionPhotos: defineTable({
  completionId: v.id("projectCompletions"),
  photoFileId: v.id("_storage"),
  category: v.union(
    v.literal("before"),
    v.literal("during"),
    v.literal("after"),
    v.literal("detail"),
    v.literal("overview")
  ),
  description: v.optional(v.string()),
  fileName: v.string(),
  fileSize: v.number(),
  uploadedAt: v.number(),
}).index("by_completion", ["completionId"]),

workTimeLogs: defineTable({
  projectId: v.id("projects"),
  userId: v.id("users"),
  startTime: v.number(),
  endTime: v.optional(v.number()),
  startGps: v.optional(v.object({
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.number(),
  })),
  endGps: v.optional(v.object({
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.number(),
  })),
  status: v.union(
    v.literal("in-progress"),
    v.literal("completed"),
    v.literal("auto-ended")
  ),
  durationMinutes: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_project", ["projectId"])
  .index("by_user", ["userId"]),
```

**Create Completion:**
```typescript
// convex/completions.ts
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    workTimeLogId: v.optional(v.id("workTimeLogs")),
    workPerformed: v.string(),
    materialsUsed: v.optional(v.string()),
    recommendations: v.optional(v.string()),
    internalNotes: v.optional(v.string()),
    requiresFollowUp: v.boolean(),
    customerSatisfaction: v.number(),
    customerFeedback: v.optional(v.string()),
    customerSignature: v.string(),
    installerSignature: v.string(),
    photos: v.array(v.object({
      fileId: v.id("_storage"),
      category: v.string(),
      description: v.optional(v.string()),
      fileName: v.string(),
      fileSize: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await getUserByIdentity(ctx, identity);
    
    // Verify project assignment
    const project = await ctx.db.get(args.projectId);
    if (project.assignedUserId !== user._id) {
      throw new Error("You are not assigned to this project");
    }
    
    // Create completion
    const completionId = await ctx.db.insert("projectCompletions", {
      projectId: args.projectId,
      installerId: user._id,
      workTimeLogId: args.workTimeLogId,
      completionDate: Date.now(),
      workPerformed: args.workPerformed,
      materialsUsed: args.materialsUsed,
      recommendations: args.recommendations,
      internalNotes: args.internalNotes,
      requiresFollowUp: args.requiresFollowUp,
      customerSatisfaction: args.customerSatisfaction,
      customerFeedback: args.customerFeedback,
      customerSignature: args.customerSignature,
      installerSignature: args.installerSignature,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Insert photos
    for (const photo of args.photos) {
      await ctx.db.insert("completionPhotos", {
        completionId,
        photoFileId: photo.fileId,
        category: photo.category,
        description: photo.description,
        fileName: photo.fileName,
        fileSize: photo.fileSize,
        uploadedAt: Date.now(),
      });
    }
    
    // End work time log
    if (args.workTimeLogId) {
      const workLog = await ctx.db.get(args.workTimeLogId);
      const duration = Math.round((Date.now() - workLog.startTime) / 60000);
      
      await ctx.db.patch(args.workTimeLogId, {
        endTime: Date.now(),
        status: "completed",
        durationMinutes: duration,
        updatedAt: Date.now(),
      });
    }
    
    // Update project status
    await ctx.db.patch(args.projectId, {
      status: "afgerond",
      completionDate: Date.now(),
      completionId,
      updatedAt: Date.now(),
    });
    
    // Schedule PDF generation and email
    await ctx.scheduler.runAfter(0, internal.completions.generatePDFAndEmail, {
      completionId,
    });
    
    return completionId;
  },
});
```

**Generate PDF and Send Email (Convex Action):**
```typescript
// convex/completions.ts
export const generatePDFAndEmail = internalAction({
  args: { completionId: v.id("projectCompletions") },
  handler: async (ctx, args) => {
    // Fetch completion with all data
    const completion = await ctx.runQuery(internal.completions.getFull, {
      id: args.completionId,
    });
    
    // Generate HTML
    const html = generateWorkOrderHTML(completion);
    
    // Call PDF generation service
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
    
    // Upload PDF to storage
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    const pdfFileId = await ctx.storage.store(blob);
    
    // Update completion with PDF
    await ctx.runMutation(internal.completions.updatePDF, {
      completionId: args.completionId,
      pdfFileId,
    });
    
    // Get PDF URL
    const pdfUrl = await ctx.storage.getUrl(pdfFileId);
    
    // Send email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SMANS BV <werkbon@smans.nl>",
        to: [completion.customer.email],
        cc: [completion.installer.email],
        subject: `Werkbon - ${completion.project.title}`,
        html: generateWorkOrderEmailHTML(completion),
        attachments: [
          {
            filename: `Werkbon-${completion.project.title}.pdf`,
            path: pdfUrl,
          },
        ],
      }),
    });
    
    if (!emailResponse.ok) {
      throw new Error("Email sending failed");
    }
    
    // Update completion status
    await ctx.runMutation(internal.completions.markEmailSent, {
      completionId: args.completionId,
    });
    
    return { success: true };
  },
});

function generateWorkOrderHTML(completion) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #B91C1C; padding-bottom: 20px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
    .info-box h3 { margin-top: 0; color: #B91C1C; }
    .section { margin: 30px 0; }
    .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
    .photo-grid img { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 40px 0; }
    .signature-box { border: 2px solid #ddd; padding: 20px; text-align: center; border-radius: 8px; }
    .signature-box img { max-width: 100%; max-height: 150px; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
    .rating { font-size: 24px; color: #FFC107; }
  </style>
</head>
<body>
  <div class="header">
    <h1>WERKBON</h1>
    <p>Project: ${completion.project.title}</p>
    <p>Datum: ${new Date(completion.completionDate).toLocaleDateString("nl-NL")}</p>
  </div>
  
  <div class="info-grid">
    <div class="info-box">
      <h3>Klant</h3>
      <p><strong>${completion.customer.name}</strong></p>
      <p>${completion.customer.address.street}<br>
      ${completion.customer.address.postalCode} ${completion.customer.address.city}</p>
      <p>Tel: ${completion.customer.phone}<br>
      Email: ${completion.customer.email}</p>
    </div>
    <div class="info-box">
      <h3>Monteur</h3>
      <p><strong>${completion.installer.fullName}</strong></p>
      <p>Tel: ${completion.installer.phone || "-"}<br>
      Email: ${completion.installer.email}</p>
      <p>Werktijd: ${completion.workTimeLog?.durationMinutes || "-"} minuten</p>
    </div>
  </div>
  
  <div class="section">
    <h3>Uitgevoerde Werkzaamheden</h3>
    <p>${completion.workPerformed}</p>
  </div>
  
  ${completion.materialsUsed ? `
  <div class="section">
    <h3>Gebruikte Materialen</h3>
    <p>${completion.materialsUsed}</p>
  </div>
  ` : ""}
  
  ${completion.photos.before.length > 0 ? `
  <div class="section">
    <h3>Foto's Voor</h3>
    <div class="photo-grid">
      ${completion.photos.before.map(photo => `
        <img src="${photo.url}" alt="Voor foto">
      `).join("")}
    </div>
  </div>
  ` : ""}
  
  ${completion.photos.during.length > 0 ? `
  <div class="section">
    <h3>Foto's Tijdens</h3>
    <div class="photo-grid">
      ${completion.photos.during.map(photo => `
        <img src="${photo.url}" alt="Tijdens foto">
      `).join("")}
    </div>
  </div>
  ` : ""}
  
  ${completion.photos.after.length > 0 ? `
  <div class="section">
    <h3>Foto's Na</h3>
    <div class="photo-grid">
      ${completion.photos.after.map(photo => `
        <img src="${photo.url}" alt="Na foto">
      `).join("")}
    </div>
  </div>
  ` : ""}
  
  <div class="section">
    <h3>Klanttevredenheid</h3>
    <div class="rating">
      ${"★".repeat(completion.customerSatisfaction)}${"☆".repeat(5 - completion.customerSatisfaction)}
    </div>
    ${completion.customerFeedback ? `<p>${completion.customerFeedback}</p>` : ""}
  </div>
  
  ${completion.recommendations ? `
  <div class="section">
    <h3>Aanbevelingen</h3>
    <p>${completion.recommendations}</p>
  </div>
  ` : ""}
  
  <div class="signatures">
    <div class="signature-box">
      <h4>Handtekening Klant</h4>
      <img src="${completion.customerSignature}" alt="Klant handtekening">
      <p>${completion.customer.name}</p>
    </div>
    <div class="signature-box">
      <h4>Handtekening Monteur</h4>
      <img src="${completion.installerSignature}" alt="Monteur handtekening">
      <p>${completion.installer.fullName}</p>
    </div>
  </div>
  
  <div class="footer">
    <p><strong>SMANS BV</strong></p>
    <p>Bedrijfstraat 123, 1234 AB Amsterdam</p>
    <p>Tel: +31 6 12345678 | Email: info@smans.nl | Web: www.smans.nl</p>
    <p>KVK: 12345678 | BTW: NL123456789B01</p>
  </div>
</body>
</html>
  `;
}
```

---

*[Document continues with sections 5-16 covering Technical Architecture, Mobile Apps, Database Schema, Security, Design System, Integrations, Performance, Testing, Deployment, and Future Roadmap...]*

**TO BE CONTINUED IN NEXT UPDATE**

The full PRD is being built progressively. Current status:
- ✅ Part 1: Sections 1-3 + Features 4.1-4.3 (Customer, Project, Quote)
- ✅ Part 2: Features 4.4-4.8 (Invoice, Planning, Chat, Receipts, Werkbon)
- 🔄 Remaining: Sections 5-16 (Technical details, Architecture, Mobile, Design, etc.)


