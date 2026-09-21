# Changelog

All notable changes to this project are documented in this file.

## [Unreleased] - 2026-09-21

### Added
- **24-Hour Calendar & Time Picker**: Created `DateTimePicker24h` with a complete 42-day monthly calendar grid (including previous/next month dates) and dual scrollable columns for 00–23 hours and 00–59 minutes without AM/PM.
- **Timeline Activity Editing**: Added inline edit button (`Pencil` icon) to timeline cards with an Edit modal and backend `PUT /api/leads/:id/activities/:activityId` endpoint.
- **Custom Task Types**: Added "Other" option in the Follow-ups & Reminders task type dropdown, enabling users to enter custom task types.
- **Project Documentation**: Added root `README.md`, backend `README.md`, frontend `README.md`, and comprehensive JSDoc/TSDoc annotations.

### Changed
- **Log Activity**: Removed redundant "Title" input field; timeline cards now automatically display the activity type label.
- **Header Alignment**: Horizontally aligned the back arrow button with the lead title row and neatly indented the contact subtext for mobile and desktop.
