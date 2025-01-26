# **Dartmouth ListServ Email Filter App**
**DALI Challenge - Jacob Zhang**

## Project Description  
This application automatically archives unwanted emails from Dartmouth’s Listserv based on a user-defined blacklist. Since Gmail does not allow direct filtering for Listserv emails (as they originate from the Listserv and not the individual club email), this project provides a workaround. Users can modify their blacklist via the frontend interface, and the backend runs every minute to archive all emails from blacklisted senders.  

Currently, this service is limited to my personal use, as allowing others to use it might conflict with the intended purpose of Listserv. This project serves as a **proof of concept** rather than a widely available tool.

---

## Deployed Application  
- **Frontend:** [Vercel Deployment](https://dali-challenge-frontend-b1e2h7k0d-jacobs-projects-8d043269.vercel.app/)  
- **Backend:** [Heroku Deployment](https://dali-challenge-11251b65b2f7.herokuapp.com/)  

---

## 📸 Screenshots / Demo Video  
- [Demo Video](https://drive.google.com/file/d/1cvOUkOpKbmMSPvC0xP3zEgduuJEbqgbC/view?usp=drive_link)  

---

## ⚙️ Setup Instructions  
### **Prerequisites**  
- Create `.env` files for both backend and frontend.  
- Ensure you have a **Google Cloud Project** with Gmail API access.  
- Set up **Firebase Firestore** for storing blacklisted senders.

### **Steps to Run Locally**  

1. **Clone the repository**  
  ```sh
   git clone https://github.com/yourusername/dartmouth-email-filter.git
   cd dartmouth-email-filter
   ```

2. **Set up authentication & environment variables**
  ```sh
  download /frontend/.env and /backend/.env
  ```

3. **Generate an authentication token**
  ```sh
  node backend/src/auth.js
  ```

4 **Start the backend server**
  ```sh
  node backend/src/server.js
  ```

5. **Start the frontend**
  ```sh
  cd frontend
  npm install
  npm run dev
  ```

## Learning Journey

**Inspiration**
Receiving constant spam from Listserv emails was frustrating, so I wanted to create a solution that would automatically clean up my inbox.

**Potential Impact**
At this stage, I am not making this publicly available since it might conflict with Listserv's intended functionality. However, this proof of concept demonstrates a potential way for users to manage unwanted emails more efficiently.

**New Technologies Learned**
Google’s Gmail API: Implemented OAuth authentication and email processing.
Heroku & Vercel: First time deploying a full-stack project on these platforms.
Firebase Firestore: Used to store and manage the email blacklist.
OAuth Refresh Tokens: Shifted from using access tokens to refresh tokens for persistent authentication.

**Why These Technologies?**
Node.js & Express: I had prior experience, making backend development more efficient.
Firebase: A free, scalable NoSQL database with easy integration.
Heroku & Vercel: Free-tier hosting with simple CI/CD integration.

**Challenges & Lessons Learned**
1. Environment Variables in Heroku:
The Firebase service account key was too long to store directly in Heroku.
Solution: Converted it to Base64 encoding for storage and decoded it dynamically at runtime.

2. Handling Authentication Properly:
Initially used access tokens, but they expire every hour.
Solution: Switched to refresh tokens, which never expire unless revoked or unused for six months.

3. Directory Structure & Deployment Issues:
Originally structured the project with separate frontend and backend directories.
This led to version control and deployment issues when handling them as independent repositories.
Lesson learned: For future projects, I may prefer a monorepo approach for easier deployment and CI/CD management.
