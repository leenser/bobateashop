#  Sprint 1 – Project Setup and Core Order System  
**Team 81 – Boba Tea POS System**

---

## Overview
Set up Flask backend and React frontend with Tailwind CSS for the restaurant POS system.  
Implement core ordering functionality with a live product catalog and cart management.  
This sprint’s focus: establishing a **working MVP** across full stack.

---

## Progress Summary
- **Total Tasks:** 16  
- **Completed:** 12  
- **In Progress:** 2  
- **Not Started:** 2  
- **Sprint Completion:** ~80% ✅  

---

## Backend Tasks

### [x] S1-1 – Set up Flask Project Structure
**Priority:** P0  **Estimate:** 3 pts  **Assigned:** Benjamin Aleman  
**Status:** ✅ Completed  
**Depends on:** N/A  
**Notes:**  
Benji configured Flask app directories, installed dependencies (Flask, CORS, psycopg2), and created `.env` template.  

---

### [x] S1-2 – Flask-Session State Management  
**Priority:** P0  **Estimate:** 2 pts  **Assigned:** Benjamin Aleman  
**Status:** ✅ Completed  
**Notes:**  
Implemented server-side sessions and JWT utilities for cart persistence and user state.  

---

### [x] S1-7 – DatabaseManager Class  
**Priority:** P0  **Estimate:** 3 pts  **Assigned:** Leenser Thomas, Sangkarshan Singh  
**Status:** ✅ Completed  
**Notes:**  
Designed centralized DB connector using psycopg2 with CRUD operations, connection pooling, and error handling.  

---

### [x] S1-8 – PostgreSQL Schema Setup  
**Priority:** P0  **Estimate:** 3 pts  **Assigned:** Sangkarshan Singh, Leenser Thomas  
**Status:** ✅ Completed  
**Notes:**  
Implemented SQL schema and seed scripts for product/category tables.  

---

### [x] S1-9 – Cart Management API  
**Priority:** P0  **Estimate:** 3 pts  **Assigned:** Leenser Thomas, Sangkarshan Singh  
**Status:** ✅ Completed  
**Notes:**  
Developed endpoints for add/retrieve/remove cart items; validated session-based persistence.  

---

### [x] S1-10 – Cart Modification API  
**Priority:** P0  **Estimate:** 2 pts  **Assigned:** Leenser Thomas, Sangkarshan Singh  
**Status:** ✅ Completed  
**Notes:**  
Added PUT/PATCH/DELETE endpoints for updating cart quantities and customizations.  

---

### [x] S1-11 – Product API Endpoints  
**Priority:** P0  **Estimate:** 3 pts  **Assigned:** Leenser Thomas, Sangkarshan Singh  
**Status:** ✅ Completed  
**Notes:**  
Endpoints for `/api/products`, `/api/products/:id`, and `/api/categories` verified with Postman and front-end fetches.

---

##  Frontend Tasks

### [x] S1-3 – Set up React Project with Tailwind CSS  
**Priority:** P0  **Estimate:** 3 pts  **Assigned:** Sangkarshan Singh  
**Status:** ✅ Completed  
**Notes:**  
Initialized React (Vite) app, configured Tailwind, React Router, and Axios defaults.  

---

### [x] S1-4 – OrderView Layout  
**Priority:** P0  **Estimate:** 3 pts  **Assigned:** Lucas Sauvage  
**Status:** ✅ Completed  
**Notes:**  
Built responsive grid layout for kiosk view with navigation header and cart section.  

---

### [x] S1-5 – Product Grid with Filtering  
**Priority:** P0  **Estimate:** 4 pts  **Assigned:** Lucas Sauvage  
**Status:** ✅ Completed  
**Notes:**  
Developed ProductGrid component with category buttons, search, and API integration.  

---

### [x] S1-6 – Cart Display Panel  
**Priority:** P0  **Estimate:** 3 pts  **Assigned:** Santosh Kota  
**Status:** ✅ Completed  
**Notes:**  
Implemented cart sidebar with live totals, empty state handling, and responsive design.  

---

### [x] S1-12 – Product Customization Panel  
**Priority:** P0  **Estimate:** 3 pts  **Assigned:** Lucas Sauvage  
**Status:** ✅ Completed  
**Notes:**  
Created modal UI for size/topping selections with price recalculation and validation.  

---

### [x] S1-13 – Add-to-Cart Functionality  
**Priority:** P0  **Estimate:** 3 pts  **Assigned:** Lucas Sauvage  
**Status:** ✅ Completed  
**Notes:**  
Connected front-end cart actions to backend API with optimistic UI updates.  

---

### [x] S1-14 – Cart Item Management UI  
**Priority:** P0  **Estimate:** 2 pts  **Assigned:** Santosh Kota  
**Status:** ✅ Completed  
**Notes:**  
Added quantity controls, remove buttons, and confirmation modals.  

---

### [ ] S1-15 – Keyboard Navigation & Accessibility  
**Priority:** P1  **Estimate:** 2 pts  **Assigned:** Santosh Kota  
**Status:** 🟡 In Progress  
**Notes:**  
Adds tab navigation, ARIA roles, and focus management for kiosk users.  

---

### [ ] S1-16 – Unit Tests for Cart Logic  
**Priority:** P1  **Estimate:** 2 pts  **Assigned:** Benjamin Aleman  
**Status:** 🟡 In Progress  
**Notes:**  
Implements Jest/Vitest + Pytest coverage for cart and API operations.  

---

## Story Point Summary

| Member | Tasks Completed | Story Points |
|:--|:--|:--:|
| **Lucas Sauvage** | S1-4, S1-5, S1-9, S1-12, S1-13, S1-14 | 15 |
| **Leenser Thomas** | S1-7, S1-8, S1-9, S1-10, S1-11 | 14 |
| **Sangkarshan Singh** | S1-3, S1-7, S1-8, S1-9, S1-10, S1-11 | 14 |
| **Benjamin Aleman** | S1-1, S1-2, S1-16 | 7 |
| **Santosh Kota** | S1-6, S1-14, S1-15 | 7 |

---

## Sprint Metrics
- **Estimated Effort:** 56 pts  
- **Completed:** 48 pts  
- **Velocity:** 48 pts / sprint  
- **Next Focus:** Integrate checkout persistence, dashboard, and reporting for Sprint 2.  

---

