# Power of 9 reachable-surface checklist

Canonical contract: white `#FFFFFF` canvas; black `#050605` shell; white cards; `#E3E1DC` borders; `#B58A29` / `#80672F` gold; `#F7F5F0` only as a secondary surface; 10px minimum readable copy; 10–12px cards; 16px gutters; 44px controls.

## Entry, public, auth
- [x] Root entry loading/error copy
- [x] Role gate/loading state
- [x] Public index and KaraaScreen wrapper
- [x] Login, role/account selector, loading/auth states

## Shared shell and primitives
- [x] Canonical theme tokens and screen canvas
- [x] App bar, utility sheets, cards, lists, status, images and progress
- [x] Floating role bottom navigation and icon masks
- [x] Focus/motion treatment
- [x] Modal controls and 44px targets

## Customer/demo
- [x] Explorer home, search, nine vertical grid, watch list and continuation panels
- [x] All nine vertical detail variants
- [x] Generic subvertical listings and Healthcare deep listing
- [x] Deep project page
- [x] Universal project Timeline / Overview / Documents / Media / gallery / modals
- [x] Portfolio dashboard, project list, privacy and project detail
- [x] Tender board and customer overview
- [x] Tender showcase/detail tabs, analytics, calendar and filter modal
- [x] Customer chat/support and new-query/ticket modals

## Employee/demo
- [x] Attendance
- [x] Projects and project detail
- [x] Tasks and forms
- [x] Conversations/chat

## Management/demo
- [x] Management dashboard and all detail panels
- [x] Command Centre
- [x] Geo Location listing
- [x] Live Workforce Map, sheet and actions
- [x] Management chat/support

## Authenticated API workspaces
- [x] `/customer` and customer project/conversation features
- [x] `/employee` and attendance/projects/tasks/conversation features
- [x] `/management` and management feature workspace

## Verification matrix
- [ ] 320px screenshot sweep
- [ ] 390px screenshot sweep
- [ ] 480px screenshot sweep
- [ ] Public/auth screenshot family
- [ ] Customer, employee and management role screenshots
- [ ] Deep vertical/subvertical/project/tender screenshots
- [ ] Command Centre and Geo/Map screenshots
- [ ] Focused Jest tests
- [ ] Full mobile Jest suite
- [ ] Typecheck
- [ ] Image guard
- [ ] Production web export
- [ ] Hard-coded legacy-color audit

The verification boxes are checked only after the corresponding command/artifact exists in the current working tree.
