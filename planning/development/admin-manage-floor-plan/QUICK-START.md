# Floor Plan Management Feature - Quick Start Guide

## ✅ Completed Setup

All components have been successfully implemented and are ready to use!

### What's Been Installed

- **HeroUI** (@heroui/react) - Modern UI component library (NextUI successor)
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Sonner** - Toast notifications
- **Framer Motion** - Animation library (HeroUI dependency)

### Files Created

```
app/
├── admin/
│   └── manage-floor-plan/
│       ├── page.tsx                    # List view with table
│       └── [id]/
│           └── page.tsx                # Create/Edit form
├── layout.tsx                          # Updated with HeroUI Provider & Toaster
└── providers.tsx                       # HeroUI Provider wrapper

utils/
└── validation/
    └── floorPlanSchema.ts             # Zod validation schema

public/
└── floor-plans/                       # Directory for floor plan images
```

## 🚀 How to Use

### 1. Access the Feature

Navigate to: **http://localhost:3000/admin/manage-floor-plan**

### 2. Create a Floor Plan

1. Click the **"Add New Floor Plan"** button
2. Fill in the form:
   - **Name** (required): e.g., "Building A - Floor 5"
   - **Building** (optional): e.g., "Building A"
   - **Floor** (optional): e.g., "5"
   - **Image Path** (required): `/floor-plans/your-image.png`
   - **Image Width/Height** (optional): Dimensions in pixels
   - **Active** toggle: Enable/disable the floor plan
3. Click **"Create"**

### 3. Add Floor Plan Images

**Before entering the image path:**

1. Save your floor plan image as PNG or JPG (max 2MB recommended)
2. Copy the file to: `public/floor-plans/`
3. Use the path format: `/floor-plans/your-image.png`

**Example:**
```bash
# Copy your image
cp ~/Downloads/building-a-floor-5.png public/floor-plans/

# Use this path in the form:
/floor-plans/building-a-floor-5.png
```

### 4. Edit a Floor Plan

1. Click the **"Edit"** button on any row
2. Update the fields as needed
3. Click **"Update"**

### 5. Delete a Floor Plan

1. Click the **"Delete"** button on any row
2. Confirm the deletion in the modal
3. The floor plan will be soft-deleted (not permanently removed from database)

## 🎨 Features Included

- ✅ Responsive table with pagination
- ✅ Real-time form validation
- ✅ Toast notifications for success/error messages
- ✅ Loading states and spinners
- ✅ Empty states when no data
- ✅ Confirmation modal for delete
- ✅ Active/Inactive status chips
- ✅ Mobile-responsive design
- ✅ TypeScript type safety
- ✅ Data-testid attributes for E2E testing

## 🔍 Testing the Feature

### Manual Testing Checklist

1. **List Page**
   - [ ] Visit `/admin/manage-floor-plan`
   - [ ] Verify table shows existing floor plans
   - [ ] Check pagination works (if more than 20 items)
   - [ ] Verify "Add New" button navigates to form

2. **Create Form**
   - [ ] Click "Add New Floor Plan"
   - [ ] Try submitting with empty name (should show error)
   - [ ] Try invalid image path format (should show error)
   - [ ] Fill valid data and submit
   - [ ] Verify toast appears
   - [ ] Verify redirects to list page
   - [ ] Verify new floor plan appears in table

3. **Edit Form**
   - [ ] Click "Edit" on any floor plan
   - [ ] Verify form is pre-filled with existing data
   - [ ] Modify some fields
   - [ ] Click "Update"
   - [ ] Verify toast appears
   - [ ] Verify changes reflected in table

4. **Delete**
   - [ ] Click "Delete" on any floor plan
   - [ ] Verify confirmation modal appears
   - [ ] Click "Delete" to confirm
   - [ ] Verify toast appears
   - [ ] Verify floor plan removed from table

## 🎯 Next Steps

### Add Navigation Link to Admin Dashboard

You'll need to add a link to the admin dashboard to access this feature easily.

**Example location:** `app/admin/dashboard/page.tsx` or similar

```tsx
<Link href="/admin/manage-floor-plan">
  <Card>
    <CardBody>
      <h3>Manage Floor Plans</h3>
      <p>Create and manage floor plans for hot desking</p>
    </CardBody>
  </Card>
</Link>
```

### Sample Floor Plan Images

For testing, you can:
1. Create a simple floor plan using any drawing tool
2. Export as PNG (recommended: 1200x800px or similar)
3. Save to `public/floor-plans/`

### Backend Requirements

Ensure your backend is running with the floor plan API endpoints:
- `GET /api/floor-plans` - List floor plans
- `GET /api/floor-plans/:id` - Get single floor plan
- `POST /api/floor-plans` - Create floor plan
- `PUT /api/floor-plans/:id` - Update floor plan
- `DELETE /api/floor-plans/:id` - Delete floor plan

## 🐛 Troubleshooting

### Images not showing?
- Verify the image exists in `public/floor-plans/`
- Check the path starts with `/floor-plans/` (not `public/floor-plans/`)
- Try accessing the image directly: `http://localhost:3000/floor-plans/your-image.png`

### TypeScript errors?
- All known errors have been resolved
- If you see new errors, run: `npm run build` to check

### Form not submitting?
- Check browser console for API errors
- Verify backend is running on the correct port
- Check authentication token is set in localStorage

### Toast notifications not appearing?
- Toaster component has been added to the root layout
- Check browser console for errors
- Verify sonner package is installed

## 📝 Summary

The floor plan management feature is **fully implemented and ready to use**! 

- Built with modern stack (HeroUI, React Hook Form, Zod)
- Follows best practices for form handling and validation
- Includes comprehensive error handling
- Mobile-responsive design
- Ready for E2E testing (data-testid attributes included)

Enjoy managing your floor plans! 🎉
