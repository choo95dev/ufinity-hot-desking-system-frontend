# Admin Manage Floor Plan - Implementation Plan

## Overview
Create an admin interface for managing floor plans with a list view and separate form page for creating/editing floor plans. Users can manage floor plan metadata and link image files stored in the public folder.

## Requirements Summary
- **List View**: Table showing all floor plans with edit/delete actions (similar to bookings page)
- **Form Page**: Separate page for creating and editing floor plans
- **Image Handling**: Manual file path entry (images stored in `/public/floor-plans/`)
- **Operations**: Create, Edit, Delete/Deactivate, View Details
- **Features**: Form validation, error handling, toast notifications, pagination
- **Navigation**: Link from admin dashboard, click to navigate to edit page
- **Image Restrictions**: PNG/JPG only, 2MB or less

## Pages Structure

### 1. List Page: `/app/admin/manage-floor-plan/page.tsx`
**Purpose**: Display all floor plans in a paginated table

**Features**:
- Table with columns: ID, Name, Building, Floor, Active Status, Actions
- Pagination controls (similar to bookings)
- "Add New Floor Plan" button
- Edit button (navigate to form page with ID)
- Delete/Deactivate button with confirmation modal
- Search/filter by building, floor, active status

**Components Needed**:
- `FloorPlanTable` component
- `FloorPlanRow` component
- `PaginationControls` component (reusable)
- `DeleteConfirmModal` component
- `StatusBadge` component

### 2. Form Page: `/app/admin/manage-floor-plan/[id]/page.tsx` (with 'new' for create)
**Purpose**: Create or edit a single floor plan

**Features**:
- Form fields: Name, Building, Floor, Image URL/Path, Is Active
- Manual image path entry (user copies file to public folder first)
- Form validation
- Save/Update button
- Cancel button (navigate back)
- Toast notifications on success/error

**Form Fields**:
```typescript
interface FloorPlanFormData {
  name: string;              // Required, max 255 chars
  building: string;          // Optional, max 100 chars
  floor: string;             // Optional, max 50 chars
  image_url: string;         // Required, max 500 chars, format: /floor-plans/filename.png
  image_width?: number;      // Optional, positive integer
  image_height?: number;     // Optional, positive integer
  is_active: boolean;        // Default: true
}
```

## API Integration

### Backend Endpoints (Already Available)
```typescript
// List all floor plans
FloorPlansService.getApiFloorPlans(page, limit, building?, floor?, isActive?)

// Get single floor plan
FloorPlansService.getApiFloorPlans1(id)

// Create floor plan
FloorPlansService.postApiFloorPlans(data)

// Update floor plan
FloorPlansService.putApiFloorPlans(id, data)

// Delete floor plan (soft delete)
FloorPlansService.deleteApiFloorPlans(id)

// Toggle active status
FloorPlansService.patchApiFloorPlansActivate(id, { is_active: boolean })
```

### API Integration Pattern
```typescript
import { FloorPlansService, OpenAPI } from '@/src/api';

// Set token from localStorage
OpenAPI.TOKEN = localStorage.getItem('token') || '';

// Example: Fetch floor plans
const fetchFloorPlans = async (page: number) => {
  try {
    const response = await FloorPlansService.getApiFloorPlans(page, 20);
    return response.data;
  } catch (error) {
    console.error('Error fetching floor plans:', error);
    throw error;
  }
};
```

## Component Structure

```
app/admin/manage-floor-plan/
├── page.tsx                          # List view page
├── [id]/
│   └── page.tsx                      # Form page (create/edit)
└── components/
    ├── FloorPlanTable.tsx            # NextUI Table component
    ├── FloorPlanForm.tsx             # Form with react-hook-form
    ├── DeleteConfirmModal.tsx        # NextUI Modal for confirmation
    └── ImagePathInput.tsx            # Custom NextUI Input with validation
```

## State Management

### List Page State
```typescript
interface FloorPlanListState {
  floorPlans: FloorPlan[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  isLoading: boolean;
  error: string | null;
  filters: {
    building: string;
    floor: string;
    isActive: boolean | null;
  };
  deleteModalOpen: boolean;
  selectedFloorPlanId: number | null;
}
```

### Form Page State
```typescript
// Form state managed by react-hook-form
// Only need additional state for:
interface FormPageState {
  isLoading: boolean; // For edit mode - loading existing data
  mode: 'create' | 'edit';
}

// react-hook-form handles:
// - formData (via useForm)
// - errors (via formState.errors)
// - isSubmitting (via formState.isSubmitting)
```

## Form Validation Rules (react-hook-form)

```typescript
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Zod schema for validation
const floorPlanSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  
  building: z.string()
    .max(100, 'Building must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  floor: z.string()
    .max(50, 'Floor must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  
  image_url: z.string()
    .min(1, 'Image path is required')
    .max(500, 'Image path must be less than 500 characters')
    .refine(
      (val) => val.startsWith('/floor-plans/'),
      'Image path must start with /floor-plans/'
    )
    .refine(
      (val) => /\.(png|jpg|jpeg)$/i.test(val),
      'Image must be PNG or JPG format'
    ),
  
  image_width: z.number()
    .positive('Image width must be a positive number')
    .optional()
    .or(z.literal(undefined)),
  
  image_height: z.number()
    .positive('Image height must be a positive number')
    .optional()
    .or(z.literal(undefined)),
  
  is_active: z.boolean().default(true),
});

type FloorPlanFormData = z.infer<typeof floorPlanSchema>;

// Usage in component:
// const { control, handleSubmit, formState: { errors } } = useForm<FloorPlanFormData>({
//   resolver: zodResolver(floorPlanSchema),
//   defaultValues: { ... }
// });
```

## Navigation Flow

```
Admin Dashboard
    ↓
[Manage Floor Plans] button
    ↓
List Page (/admin/manage-floor-plan)
    ↓
    ├─→ [Add New] button → Form Page (/admin/manage-floor-plan/new)
    │                           ↓
    │                       [Save] → Toast → List Page
    │
    ├─→ [Edit] button → Form Page (/admin/manage-floor-plan/[id])
    │                       ↓
    │                   [Update] → Toast → List Page
    │
    └─→ [Delete] button → Confirmation Modal
                              ↓
                          [Confirm] → API Delete → Toast → Refresh List
```

## UI Design Specifications

### List Page Layout
```
┌─────────────────────────────────────────────────────────┐
│ Manage Floor Plans                    [+ Add New]       │
├─────────────────────────────────────────────────────────┤
│ Filters: [Building ▼] [Floor ▼] [Status ▼] [Clear]    │
├─────────────────────────────────────────────────────────┤
│ ID │ Name              │ Building  │ Floor │ Active │   │
├────┼───────────────────┼───────────┼───────┼────────┼───┤
│ 1  │ Building A - Fl 5 │ Building A│   5   │   ✓    │ ⋮ │
│ 2  │ Building B - Fl 3 │ Building B│   3   │   ✓    │ ⋮ │
├─────────────────────────────────────────────────────────┤
│ Showing 1-20 of 45          [◄] [1][2][3] [►]         │
└─────────────────────────────────────────────────────────┘
```

### Form Page Layout
```
┌─────────────────────────────────────────────────────────┐
│ [← Back] Create/Edit Floor Plan                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Name *                                                   │
│ [_____________________________________]                  │
│                                                          │
│ Building                                                 │
│ [_____________________________________]                  │
│                                                          │
│ Floor                                                    │
│ [_____________________________________]                  │
│                                                          │
│ Image Path *                                             │
│ [/floor-plans/________________________]                  │
│ ℹ️ Copy your image file to public/floor-plans/ first    │
│ Supported: PNG, JPG (max 2MB)                           │
│                                                          │
│ Image Width (optional)                                   │
│ [_____________________________________]                  │
│                                                          │
│ Image Height (optional)                                  │
│ [_____________________________________]                  │
│                                                          │
│ □ Active                                                 │
│                                                          │
│             [Cancel]  [Save/Update]                      │
└─────────────────────────────────────────────────────────┘
```

## Toast Notifications

### Success Messages
- "Floor plan created successfully"
- "Floor plan updated successfully"
- "Floor plan deleted successfully"
- "Floor plan activated/deactivated successfully"

### Error Messages
- "Failed to create floor plan: [error message]"
- "Failed to update floor plan: [error message]"
- "Failed to delete floor plan: [error message]"
- "Failed to load floor plans: [error message]"
- "Floor plan not found"

## Implementation Steps

### Phase 1: Setup and Dependencies (Day 1)
1. Install required dependencies
   ```bash
   npm install @nextui-org/react framer-motion
   npm install react-hook-form @hookform/resolvers zod
   npm install sonner
   ```

2. Configure NextUI
   - Update `tailwind.config.js` with NextUI plugin
   - Create providers wrapper with NextUIProvider
   - Update `app/layout.tsx` to use Providers

3. Create directory structure
   ```bash
   mkdir -p app/admin/manage-floor-plan/[id]
   mkdir -p app/admin/manage-floor-plan/components
   ```

### Phase 2: List Page (Day 2)
4. Create List Page (`app/admin/manage-floor-plan/page.tsx`)
   - Set up page structure with authentication check
   - Implement NextUI Table component
   - Add NextUI Pagination
   - Integrate FloorPlansService API
   - Add loading spinner and empty states
   - Add NextUI Modal for delete confirmation

5. Add filtering functionality (optional)
   - NextUI Select for building dropdown
   - NextUI Select for floor dropdown
   - NextUI Select for active status filter

### Phase 3: Form Page (Day 3-4)
6. Create Zod validation schema
   - Define floorPlanSchema with all validation rules
   - Export TypeScript type from schema

7. Create Form Page (`app/admin/manage-floor-plan/[id]/page.tsx`)
   - Set up react-hook-form with zodResolver
   - Handle both create (id='new') and edit modes
   - Fetch existing data for edit mode and reset form
   - Implement onSubmit handler

8. Build form UI with NextUI components
   - Use Controller for each form field
   - NextUI Input components with validation
   - NextUI Switch for is_active toggle
   - NextUI Button for submit/cancel
   - Display validation errors from react-hook-form
   - Add helper text for image path field

### Phase 4: Toast and Navigation (Day 5)
9. Add Toast Notifications with Sonner
    - Set up Toaster component in layout
    - Add toast.success() for successful operations
    - Add toast.error() for failed operations
    - Test all toast notifications

10. Add Navigation Link to Admin Dashboard
    - Update admin dashboard layout
    - Add "Manage Floor Plans" menu item or card
    - Add proper routing
    - Test navigation flow

### Phase 5: Testing and Refinement (Day 6-7)
11. Manual Testing
    - Test create flow with valid/invalid data
    - Test edit flow
    - Test delete flow
    - Test pagination
    - Test filtering
    - Test navigation
    - Test error handling

13. Edge Cases and Error Handling
    - Handle network errors
    - Handle authentication errors (redirect to login)
    - Handle permission errors
    - Handle not found errors
    - Add loading skeletons
    - Add empty states

14. Code Review and Cleanup
    - Remove console.logs
    - Add TypeScript types
    - Add comments for complex logic
    - Extract reusable utilities
    - Ensure consistent styling

## Code Snippets

### List Page Example Structure
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
} from '@nextui-org/react';
import { FloorPlansService, OpenAPI, FloorPlan } from '@/src/api';
import { toast } from 'sonner';

export default function ManageFloorPlanPage() {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    OpenAPI.TOKEN = token;
    fetchFloorPlans();
  }, [currentPage]);

  const fetchFloorPlans = async () => {
    setIsLoading(true);
    try {
      const response = await FloorPlansService.getApiFloorPlans(currentPage, 20);
      setFloorPlans(response.data || []);
      setTotalPages(Math.ceil((response.pagination?.total || 0) / 20));
    } catch (err) {
      toast.error('Failed to load floor plans');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setSelectedId(id);
    onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedId) return;
    
    try {
      await FloorPlansService.deleteApiFloorPlans(selectedId);
      toast.success('Floor plan deleted successfully');
      fetchFloorPlans();
      onClose();
    } catch (err) {
      toast.error('Failed to delete floor plan');
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Floor Plans</h1>
        <Button
          color="primary"
          onPress={() => router.push('/admin/manage-floor-plan/new')}
        >
          Add New Floor Plan
        </Button>
      </div>

      <Table aria-label="Floor plans table">
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>NAME</TableColumn>
          <TableColumn>BUILDING</TableColumn>
          <TableColumn>FLOOR</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          loadingContent={<Spinner />}
          emptyContent="No floor plans found"
        >
          {floorPlans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>{plan.id}</TableCell>
              <TableCell>{plan.name}</TableCell>
              <TableCell>{plan.building || '-'}</TableCell>
              <TableCell>{plan.floor || '-'}</TableCell>
              <TableCell>
                <Chip color={plan.is_active ? 'success' : 'default'} size="sm">
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={() => router.push(`/admin/manage-floor-plan/${plan.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onPress={() => handleDeleteClick(plan.id!)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-center mt-4">
        <Pagination
          total={totalPages}
          page={currentPage}
          onChange={setCurrentPage}
        />
      </div>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>
            Are you sure you want to delete this floor plan?
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDeleteConfirm}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
```

### Form Page Example Structure
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Input,
  Button,
  Switch,
  Card,
  CardBody,
  CardHeader,
} from '@nextui-org/react';
import { FloorPlansService, OpenAPI } from '@/src/api';
import { toast } from 'sonner';

const floorPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  building: z.string().max(100).optional().or(z.literal('')),
  floor: z.string().max(50).optional().or(z.literal('')),
  image_url: z.string()
    .min(1, 'Image path is required')
    .refine(val => val.startsWith('/floor-plans/'), 'Must start with /floor-plans/')
    .refine(val => /\.(png|jpg|jpeg)$/i.test(val), 'Must be PNG or JPG'),
  image_width: z.number().positive().optional(),
  image_height: z.number().positive().optional(),
  is_active: z.boolean().default(true),
});

type FloorPlanFormData = z.infer<typeof floorPlanSchema>;

export default function FloorPlanFormPage() {
  const params = useParams();
  const router = useRouter();
  const isEditMode = params.id !== 'new';
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FloorPlanFormData>({
    resolver: zodResolver(floorPlanSchema),
    defaultValues: {
      name: '',
      building: '',
      floor: '',
      image_url: '/floor-plans/',
      is_active: true,
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    OpenAPI.TOKEN = token;

    if (isEditMode) {
      loadFloorPlan();
    }
  }, []);

  const loadFloorPlan = async () => {
    setIsLoading(true);
    try {
      const response = await FloorPlansService.getApiFloorPlans1(Number(params.id));
      reset(response.data);
    } catch (err) {
      toast.error('Failed to load floor plan');
      console.error(err);
      router.push('/admin/manage-floor-plan');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FloorPlanFormData) => {
    try {
      if (isEditMode) {
        await FloorPlansService.putApiFloorPlans(Number(params.id), data);
        toast.success('Floor plan updated successfully');
      } else {
        await FloorPlansService.postApiFloorPlans(data);
        toast.success('Floor plan created successfully');
      }
      router.push('/admin/manage-floor-plan');
    } catch (err) {
      toast.error('Failed to save floor plan');
      console.error(err);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Button
        variant="light"
        onPress={() => router.back()}
        className="mb-4"
      >
        ← Back
      </Button>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Floor Plan' : 'Create Floor Plan'}
          </h1>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Name"
                  isRequired
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                />
              )}
            />

            <Controller
              name="building"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Building"
                  isInvalid={!!errors.building}
                  errorMessage={errors.building?.message}
                />
              )}
            />

            <Controller
              name="floor"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Floor"
                  isInvalid={!!errors.floor}
                  errorMessage={errors.floor?.message}
                />
              )}
            />

            <Controller
              name="image_url"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Image Path"
                  isRequired
                  description="Copy image to public/floor-plans/ first. Format: /floor-plans/filename.png"
                  isInvalid={!!errors.image_url}
                  errorMessage={errors.image_url?.message}
                />
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="image_width"
                control={control}
                render={({ field: { onChange, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Image Width (px)"
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                    isInvalid={!!errors.image_width}
                    errorMessage={errors.image_width?.message}
                  />
                )}
              />

              <Controller
                name="image_height"
                control={control}
                render={({ field: { onChange, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Image Height (px)"
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                    isInvalid={!!errors.image_height}
                    errorMessage={errors.image_height?.message}
                  />
                )}
              />
            </div>

            <Controller
              name="is_active"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switch isSelected={value} onValueChange={onChange}>
                  Active
                </Switch>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="light"
                onPress={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                isLoading={isSubmitting}
              >
                {isEditMode ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
```

## File Upload Instructions for Users

Create a help text or instructions panel in the form:

```markdown
### How to add a floor plan image:

1. Save your floor plan image as PNG or JPG (max 2MB)
2. Name it descriptively (e.g., `building-a-floor-5.png`)
3. Copy the file to: `<project-root>/public/floor-plans/`
4. Enter the path in the "Image Path" field: `/floor-plans/your-image.png`
5. Optionally, enter the image dimensions (width and height in pixels)

Note: The image will be accessible at `http://localhost:3000/floor-plans/your-image.png`
```

## Future Improvements (Phase 2)

### Short-term
1. **Image Preview**: Show preview of the image when path is entered
2. **Image Dimension Auto-detect**: Use Image API to auto-populate width/height
3. **Bulk Operations**: Select multiple floor plans for batch delete/activate
4. **Export/Import**: CSV export and import for floor plans
5. **Audit Log**: Show who created/modified floor plans and when

### Long-term
1. **Backend Image Upload API**: Create multipart/form-data endpoint
2. **Drag & Drop Upload**: Implement drag-and-drop file upload
3. **Image Optimization**: Compress and resize images automatically
4. **Cloud Storage**: Migrate from public folder to S3/Azure Blob
5. **Resource Linking**: Add ability to link resources to floor plan
6. **Interactive Floor Map**: Show resources on floor plan with drag-and-drop positioning
7. **Floor Plan Templates**: Provide common layouts as templates
8. **Version Control**: Track floor plan changes over time

## Testing Checklist

### Functional Testing
- [ ] List page displays all floor plans
- [ ] Pagination works correctly
- [ ] Filters work (building, floor, status)
- [ ] Create new floor plan with valid data
- [ ] Create fails with invalid data (shows errors)
- [ ] Edit existing floor plan
- [ ] Delete floor plan with confirmation
- [ ] Toggle active/inactive status
- [ ] Navigation from dashboard works
- [ ] Navigation to edit page works
- [ ] Cancel button returns to list
- [ ] Authentication required (redirects if not logged in)
- [ ] Admin-only access enforced

### Error Handling
- [ ] Network error shows appropriate message
- [ ] API error shows appropriate message
- [ ] Invalid form data shows field-specific errors
- [ ] Not found error handled gracefully
- [ ] Unauthorized access handled (redirect)

### UI/UX
- [ ] Loading states show spinners/skeletons
- [ ] Empty state shows helpful message
- [ ] Toast notifications appear and dismiss
- [ ] Form fields have proper labels
- [ ] Required fields marked with asterisk
- [ ] Help text for image path is clear
- [ ] Buttons disabled during submission
- [ ] Table is responsive on mobile
- [ ] Form is responsive on mobile

## Dependencies

### Already Installed
- Next.js 16.1.6
- React 19.2.3
- Tailwind CSS
- TypeScript
- OpenAPI Generated API Client (FloorPlansService)

### Need to Install
```bash
# NextUI and required dependencies
npm install @nextui-org/react framer-motion

# React Hook Form and Zod for validation
npm install react-hook-form @hookform/resolvers zod

# Toast notifications
npm install sonner
```

### NextUI Configuration
Add NextUI to your `tailwind.config.js`:
```javascript
import { nextui } from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [nextui()],
};
```

Wrap your app with NextUI Provider in `app/providers.tsx`:
```typescript
'use client';

import { NextUIProvider } from '@nextui-org/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <NextUIProvider>{children}</NextUIProvider>;
}
```

## File Checklist

### Pages
- [ ] `app/admin/manage-floor-plan/page.tsx` - List view
- [ ] `app/admin/manage-floor-plan/[id]/page.tsx` - Form view

### Components (Most built-in with NextUI)
- [ ] `app/admin/manage-floor-plan/components/ImagePathHelper.tsx` (optional helper text component)

### Utilities
- [ ] `utils/validation/floorPlanSchema.ts` - Zod validation schema
- [ ] `app/providers.tsx` - NextUI Provider wrapper (if not exists)

### Utilities
- [ ] `utils/validation/floorPlanValidation.ts`
- [ ] `utils/formatters.ts` (if needed for dates, etc.)

## Notes
- Ensure consistent styling with existing admin pages (bookings, resources, etc.)
- Reuse pagination component from bookings page
- Follow existing error handling patterns
- Use same authentication check pattern as other admin pages
- Keep form simple and focused on core functionality
- Document manual image upload process clearly
- Plan for future API-based upload in code structure (use abstraction)

## Success Criteria
1. Admin can view all floor plans in a paginated table
2. Admin can create new floor plans with all required fields
3. Admin can edit existing floor plans
4. Admin can delete floor plans (soft delete)
5. Admin can filter floor plans by building, floor, and status
6. Form validation prevents invalid submissions
7. Clear error messages guide users
8. Toast notifications provide feedback
9. Navigation is intuitive and consistent
10. Page is responsive and accessible
