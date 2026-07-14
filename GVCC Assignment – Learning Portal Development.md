# **GVCC Assignment – Learning Portal Development**

## **Objective**

Build a **Learning Portal** using the technology stack of your choice (e.g., MERN, Flutter, React, Angular, Vue, Django, Spring Boot, etc.). The focus of this assignment is to demonstrate your understanding of frontend development, backend integration, media handling, and user experience.

## **Functional Requirements**

### **1. Learning Portal**

Create a portal where students can access learning videos.

### **2. Screenshot Protection**

Implement a mechanism to **discourage or prevent users from taking screenshots** while viewing the learning content.

**Note:** Different platforms have different capabilities and limitations. Implement the best possible solution supported by your chosen technology stack and document your approach.

### **3. Video Bookmark Feature**

Implement a bookmark functionality with the following behavior:

* Students should be able to create **multiple bookmarks** for a single video.
* Each bookmark must store:
  + Bookmark Name (optional)
  + Timestamp
  + Video ID
* Display all saved bookmarks for a video.
* Students should be able to click any bookmark to continue watching from that exact timestamp.

### **Example**

Suppose a student is watching a video:

* Bookmark 1 → **02:02**
* Bookmark 2 → **10:45**
* Bookmark 3 → **18:30**

When the student clicks the bookmark at **10:45**, the video should resume playback from **10:45**, **not** from **00:00**.

## **Expected Features**

* Student-friendly UI
* Video player
* Create multiple bookmarks
* View all bookmarks
* Resume playback from bookmarked timestamp
* Persistent bookmark storage (Database/Local Storage/Backend API)
* Screenshot prevention mechanism

## **Bonus Features (Optional)**

* Edit/Delete bookmarks
* Bookmark titles or notes
* Continue Watching feature
* Watch progress indicator
* Recently watched videos
* Authentication (Login/Signup)
* Responsive UI for desktop and mobile

## **Evaluation Criteria**

* Functionality (40%)
* Code Quality & Project Structure (20%)
* UI/UX (15%)
* Database/API Design (15%)
* Innovation & Bonus Features (10%)

## **Submission Requirements**

* Source Code (GitHub Repository)
* README with setup instructions
* Screenshots or screen recording of the application
* Live deployment link (Optional)