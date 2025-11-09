**SalesScout** is a deal tracking application that monitors and aggregates sales deals from forums.

---

### **Project Overview**

* Full stack **TypeScript** application with **Express** backend and **React** frontend
* Uses **MongoDB** for data storage
* **JWT-based authentication**
* **Rate limiting** and **security middleware**

---

### **Backend Architecture**

* **Express** server written in TypeScript
* **MongoDB models:** `Deal`, `Query`, `User`
* **Scheduler service** for running periodic deal scraping
* **Cheerio-based** web scraping of deal forums
* **Webhook notifications** for query matches

---

### **API Routes**

* `/api/users` – Authentication and user management
* `/api/deals` – Deal retrieval and manual scraping triggers
* `/api/queries` – CRUD operations for deal monitoring queries

---

### **Frontend Pages**

* `/login`, `/register` – User authentication
* `/dashboard` – Overview with recent deals and active queries
* `/deals` – Deal browsing with filters and search
* `/queries` – Query management interface
* `/queries/new` – Create new monitoring query
* `/queries/:id` – Query details and matched deals
* `/queries/:id/edit` – Edit existing query
* `/profile` – User profile management
