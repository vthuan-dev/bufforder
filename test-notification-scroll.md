# 🧪 Test Plan: Notification Scroll Fix

## Changes Applied

### 1. MyPage.tsx
- ✅ Added `min-h-0` to scroll container
- ✅ Removed `layout` prop from motion.div notification items
- ✅ Kept proper flex structure with `flex-shrink-0` on header/footer

### 2. index.css
- ✅ Added `.custom-scrollbar` styles
- ✅ Added webkit scrollbar styling
- ✅ Added Firefox scrollbar support
- ✅ Added iOS smooth scroll support
- ✅ Added overscroll-behavior

## Testing Steps

### Desktop Testing (Chrome/Edge/Firefox)

#### Test 1: Basic Scroll
1. Login to the app
2. Navigate to My Page
3. Click the Bell icon (notifications)
4. **Expected**: Notification drawer opens from bottom
5. If you have < 5 notifications, create more test notifications
6. **Expected**: Can scroll up/down smoothly
7. **Expected**: Custom scrollbar visible on right side
8. **Expected**: Scrollbar changes color on hover

#### Test 2: Many Notifications
1. Ensure you have 20+ notifications
2. Open notification drawer
3. **Expected**: Can see first ~5-6 notifications
4. Scroll down
5. **Expected**: Can reach bottom notifications
6. **Expected**: No content is cut off or hidden
7. **Expected**: Smooth scroll behavior

#### Test 3: Expand/Collapse
1. Open notification drawer
2. Find a long notification with "Show more" button
3. Click "Show more"
4. **Expected**: Notification expands
5. **Expected**: Scroll position maintained
6. **Expected**: Can still scroll normally
7. Click "Show less"
8. **Expected**: Notification collapses
9. **Expected**: Scroll still works

#### Test 4: Mark as Read
1. Open notification drawer
2. Scroll to middle of list
3. Click checkmark on an unread notification
4. **Expected**: Notification marked as read (style changes)
5. **Expected**: Scroll position maintained
6. **Expected**: No jump or layout shift

### Mobile Testing (iOS Safari/Chrome)

#### Test 5: Touch Scroll
1. Open app on mobile device
2. Navigate to My Page
3. Open notifications
4. **Expected**: Can swipe up/down to scroll
5. **Expected**: Smooth momentum scrolling
6. **Expected**: Scroll doesn't close the drawer
7. **Expected**: Can reach all notifications

#### Test 6: iOS Bounce
1. On iOS device, open notifications
2. Scroll to top
3. Try to scroll up more
4. **Expected**: Slight bounce effect (iOS native)
5. **Expected**: Doesn't scroll parent page
6. Scroll to bottom
7. Try to scroll down more
8. **Expected**: Slight bounce effect
9. **Expected**: Doesn't scroll parent page

#### Test 7: Drawer Interaction
1. Open notifications on mobile
2. Tap outside drawer (dark overlay)
3. **Expected**: Drawer closes
4. Open again
5. Scroll notifications
6. Tap a notification
7. **Expected**: Notification interaction works
8. **Expected**: Drawer doesn't close accidentally

### Edge Cases

#### Test 8: Single Notification
1. Clear all notifications
2. Create 1 new notification
3. Open drawer
4. **Expected**: Single notification displays correctly
5. **Expected**: No scrollbar (not needed)
6. **Expected**: Centered layout looks good

#### Test 9: Empty State
1. Clear all notifications
2. Open drawer
3. **Expected**: "No notifications" message displays
4. **Expected**: Bell icon and text centered
5. **Expected**: No scroll issues

#### Test 10: 100+ Notifications
1. Create many test notifications (if possible)
2. Open drawer
3. **Expected**: Can scroll through all
4. **Expected**: Performance is acceptable
5. **Expected**: No lag or stutter
6. **Expected**: Scrollbar proportional to content

### Performance Testing

#### Test 11: Animation Performance
1. Open notification drawer
2. Observe drawer slide-up animation
3. **Expected**: Smooth 60fps animation
4. Scroll notifications
5. **Expected**: Smooth scrolling
6. Close drawer
7. **Expected**: Smooth slide-down animation

#### Test 12: Memory/CPU
1. Open DevTools > Performance
2. Start recording
3. Open notifications
4. Scroll up and down multiple times
5. Expand/collapse notifications
6. Stop recording
7. **Expected**: No memory leaks
8. **Expected**: CPU usage reasonable
9. **Expected**: No layout thrashing

## Success Criteria

### Must Have ✅
- [ ] Can scroll through all notifications
- [ ] No content is hidden or cut off
- [ ] Scrollbar visible and functional
- [ ] Smooth scroll on desktop
- [ ] Touch scroll works on mobile
- [ ] No layout shifts when expanding notifications
- [ ] Drawer doesn't close when scrolling

### Nice to Have 🎯
- [ ] Custom scrollbar styling matches design
- [ ] Momentum scrolling on iOS
- [ ] Scroll position maintained on interactions
- [ ] Performance is smooth (60fps)
- [ ] Works on all browsers (Chrome, Firefox, Safari, Edge)

## Rollback Plan

If issues occur:
1. Revert changes to `MyPage.tsx`
2. Remove custom scrollbar CSS from `index.css`
3. Investigate alternative solutions:
   - Use react-window for virtual scrolling
   - Implement pagination
   - Use different modal library

## Notes

- The fix is minimal and non-breaking
- Only affects notification drawer
- No changes to API or backend
- CSS is scoped to `.custom-scrollbar` class
- Compatible with existing animations
