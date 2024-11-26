# MERN Project 2024 Requirements

## ADMIN SIDE REQUIREMENTS

### Product/Service Management (45 points total)
- Basic CRUD with bootstrap datatables + multiple photo upload (10 pts)
- Advanced CRUD with MUI datatables + expandable rows (15 pts)
- Enhanced CRUD with MUI datatables + bulk delete feature (20 pts)

### Transaction Management (20 points total)
- Update transaction status (5 pts)
- Send email notifications to customers with transaction details including:
  * List of products/services
  * Subtotals and grand total
  * Updated status (5 pts)
- Implement FCM push notifications:
  * Store FCM registration token in database
  * Send status updates to customers (10 pts)

### Review Management (5 points)
- Admin ability to delete customer reviews (5 pts)

### Analytics (25 points total)
- Monthly sales line charts showing all months (10 pts)
- Advanced sales charts with date range filter (15 pts)






## CLIENT SIDE REQUIREMENTS

### User Authentication (30 points total)
- Basic username/password authentication (5 pts)
- Firebase authentication implementation (10 pts)
- Social login integration:
  * Facebook or Gmail login using react-facebook-login or similar (15 pts)
  * Firebase social authentication integration ✅

### User Profile Management (15 points total)
- Basic profile update with photo upload (5 pts)
- Advanced profile update using Firebase storage (10 pts)

### Review System (25 points total)
- Create product/service reviews with ratings (10 pts)
- Update own reviews functionality (5 pts)
- Bad words filter implementation using bad-words package (10 pts)

### Product Interaction Features (40 points total)
- Product filtering system:
  * Price filter (5 pts)
  * Category filter (5 pts)
  * Ratings filter (5 pts)
- Product list pagination on homepage (10 pts)
- Infinite scroll implementation (15 pts)

### Form Validation (10 points)
- Implement validation using YUP formik/React Hook Form for:
  * Product CRUD forms
  * User login forms
  * Profile update forms (10 pts)

### UI/UX Design (45 points total)
- Basic CSS implementation (10 pts)
- Bootstrap components integration (15 pts)
- Material UI (MUI) components implementation (20 pts)






## SHARED/COMMON REQUIREMENTS

### Transaction Processing (10 points)
- Complete transaction functionality (10 pts)

### Project Assessment (40 points total)
- Attendance tracking (10 pts)
  * 2 points deduction per absence
- Program execution quality/error handling (10 pts)
- Project contribution assessment (10 pts)
- Functional requirements completeness (10 pts)

## Technical Notes
- All file uploads must support multiple photos
- Product details should be displayed in expandable/collapsible rows
- Bulk delete must utilize checkboxes
- Transaction emails must include detailed breakdowns
- FCM registration tokens must be stored in database
- Form validation required across all user inputs
- Social login must be fully integrated with application flow

## Completion Status
✅ Facebook/Gmail login implementation completed








## Sir dalisay requirements
ITCP318 Integrative Programming and Technology 

MP1
Product/Service CRUD bootstrap datatables. upload multiple photos 10pts

Product/Service CRUD MUI datatables (gregnb/mui-datatables). upload multiple photos. product/service details are on an expandable/collapsible rows 15pts 

Product/Service CRUD MUI datatables (gregnb/mui-datatables). upload multiple photos. product/service details are on an expandable/collapsible rows. bulk delete using checkboxes 20pts 

mp2 User functions 20pts
username and password authentication 5pts 
user profile update with photo upload. 5pts 
username and password firebase authentication 10pts
user profile update with photo upload using firebase storage. 10pts

mp3 review ratings 20pts 

users who availed of the product/service can write a review and rate the product service 10pts
users can update their own review rating. 5pts
admin can delete a review 5pts.  

term test lab 30pts
completed transaction. 10pts
admin updates the status of the transaction. 5pts 
email the customer of the updated transaction details. the email contains the list of products/services, their subtotal and grand total. 5pts

use FCM push notifications to inform the customer of the updated transaction. store the FCM registration token on the database 10pts
 

unit 1
filter/mask bad words from reviews. bad-words package 10pts
form validation on product and user forms. (product crud, user login, update profile) YUP formik React Hook Form 10pts

unit 2
user interface design css 10pts
user interface design css and bootstrap components 15pts
user interface design css and Material UI (MUI) components 20pts

quiz 1 product filter 15pts
price filter 5pts
category filter 5pts 
ratings filter 5pts

quiz 2
monthly sales charts. all months on the chart label. line chart 10pts 
sales charts with date range filter.  line or bar chart 15pts

quiz 3
pagination on products list on homepage. 10pts
infinite scroll on products list on homepage. 15pts

quiz 4 
facebook or gmail login 15pts react-facebook-login or similar packages.
facebook or gmail login firebase 15pts

quiz 5 attendance 10pts
2pts deduction for each meeting of being absent.


term test LEC
functional requirements completeness 10pts
program execution (errors).  10pts
project contribution 10pts