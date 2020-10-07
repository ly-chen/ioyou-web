# ioyou
A campus-centric social media platform that allows students to trade physical and online resources including campus news, homework help, errands, etc. using a quid-pro-quo credit system wherein tasks and services can be posted and claimed for credits.

# Implementation Details
## Auth Flow:
Sign-up form uses internal Firebase auth as well as cloud functions to check validity of user and generate their profile / starting credits. Basic regex checks for the correct .edu email address, which must be confirmed, and verification flow is handled by Firebase.

## Social Feed:
Posts and comments are stored in NoSQL database, retrieved using search, and filtered for each specific user given their level of access. The system is currently broken up into academic categories which require credits to post, and one catch-all miscellanious bulletin for general or meta-level posts.

## Credit System:
Handled by cloud functions which can trigger manually and automatically: posters can assign credits to individuals or credits will be automatically awarded past a certain time. Security is ensured with client-level and back-end functions to check validity of credits when a user attempts to utilize credits in any way.

## UI/UX:
React + React Bootstrap was used to design the layout of the pages and allow for responsive SPA on desktop and mobile browsers.

# How to use
Currently closed beta for UChicago students hosted at https://ioyou-71889.web.app/
Contact me to collaborate, give suggestions, provide criticism, etc.
