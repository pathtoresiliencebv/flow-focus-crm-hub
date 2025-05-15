
// Mock customer data
export const mockCustomers = [
  { id: 1, name: "Jan de Vries", email: "jan@example.com", phone: "06-12345678", status: "Actief" },
  { id: 2, name: "Marie Jansen", email: "marie@example.com", phone: "06-23456789", status: "In behandeling" },
  { id: 3, name: "Peter Bakker", email: "peter@example.com", phone: "06-34567890", status: "Actief" },
  { id: 4, name: "Sara Visser", email: "sara@example.com", phone: "06-45678901", status: "Inactief" },
  { id: 5, name: "Thomas Mulder", email: "thomas@example.com", phone: "06-56789012", status: "Actief" },
];

// Mock project data
export const mockProjects = [
  { id: 1, title: "Renovatie woonkamer", customer: "Jan de Vries", status: "In uitvoering", date: "15-05-2025", value: "4,500" },
  { id: 2, title: "Nieuwe kozijnen achtergevel", customer: "Marie Jansen", status: "Gepland", date: "20-05-2025", value: "2,800" },
  { id: 3, title: "Vervangen voordeur", customer: "Peter Bakker", status: "Afgerond", date: "10-05-2025", value: "1,250" },
  { id: 4, title: "Isolatieglas installatie", customer: "Sara Visser", status: "In uitvoering", date: "17-05-2025", value: "3,600" },
  { id: 5, title: "Kunststof kozijnen", customer: "Thomas Mulder", status: "Gepland", date: "25-05-2025", value: "5,200" },
  { id: 6, title: "Badkamerraam", customer: "Jan de Vries", status: "Afgerond", date: "05-04-2025", value: "1,200" },
  { id: 7, title: "Schuifpui woonkamer", customer: "Marie Jansen", status: "In uitvoering", date: "12-05-2025", value: "6,800" },
  { id: 8, title: "Dakraam zolder", customer: "Peter Bakker", status: "Gepland", date: "28-05-2025", value: "1,850" },
];

// Mock appointment data
export const mockAppointments = [
  { id: 1, date: "15-05-2025", time: "09:00", customer: "Jan de Vries", type: "Meting" },
  { id: 2, date: "15-05-2025", time: "13:30", customer: "Marie Jansen", type: "Adviesgesprek" },
  { id: 3, date: "17-05-2025", time: "10:00", customer: "Peter Bakker", type: "Installatie" },
  { id: 4, date: "18-05-2025", time: "14:00", customer: "Sara Visser", type: "Meting" },
  { id: 5, date: "20-05-2025", time: "11:30", customer: "Thomas Mulder", type: "Installatie" },
];

// Mock inventory data
export const mockInventory = [
  { id: 1, name: "Kunststof kozijn", type: "Vast", material: "PVC", stock: 15, price: "350" },
  { id: 2, name: "Aluminium kozijn", type: "Draai-kiep", material: "Aluminium", stock: 8, price: "480" },
  { id: 3, name: "Houten kozijn", type: "Schuif", material: "Hardhout", stock: 12, price: "420" },
  { id: 4, name: "Triple glas", type: "HR+++", material: "Glas", stock: 20, price: "180" },
  { id: 5, name: "Dubbel glas", type: "HR++", material: "Glas", stock: 25, price: "120" },
  { id: 6, name: "Vensterbank", type: "Standaard", material: "Composiet", stock: 30, price: "85" },
  { id: 7, name: "Afstandhouders", type: "Warm-edge", material: "Kunststof", stock: 4, price: "35" },
];

// Mock invoice data
export const mockInvoices = [
  { id: 1, number: "INV-2025-1001", customer: "Jan de Vries", project: "Renovatie woonkamer", date: "05-05-2025", dueDate: "19-05-2025", status: "Betaald", amount: "5,445.00" },
  { id: 2, number: "INV-2025-1002", customer: "Marie Jansen", project: "Nieuwe kozijnen achtergevel", date: "08-05-2025", dueDate: "22-05-2025", status: "Verzonden", amount: "3,388.00" },
  { id: 3, number: "INV-2025-1003", customer: "Peter Bakker", project: "Vervangen voordeur", date: "10-05-2025", dueDate: "24-05-2025", status: "Concept", amount: "1,512.50" },
  { id: 4, number: "INV-2025-1004", customer: "Sara Visser", project: "Isolatieglas installatie", date: "12-05-2025", dueDate: "26-05-2025", status: "Verzonden", amount: "4,356.00" },
  { id: 5, number: "INV-2025-1005", customer: "Thomas Mulder", project: "Kunststof kozijnen", date: "15-05-2025", dueDate: "29-05-2025", status: "Concept", amount: "6,292.00" },
  { id: 6, number: "INV-2025-1006", customer: "Jan de Vries", project: "Badkamerraam", date: "02-04-2025", dueDate: "16-04-2025", status: "Betaald", amount: "1,452.00" },
];
