import { z } from 'zod';

export const floorPlanSchema = z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.max(255, 'Name must be less than 255 characters')
		.trim(),

	building: z
		.string()
		.max(100, 'Building must be less than 100 characters')
		.optional()
		.or(z.literal('')),

	floor: z
		.string()
		.max(50, 'Floor must be less than 50 characters')
		.optional()
		.or(z.literal('')),

	image_url: z
		.string()
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

	image_width: z
		.number()
		.positive('Image width must be a positive number')
		.optional()
		.or(z.literal(undefined)),

	image_height: z
		.number()
		.positive('Image height must be a positive number')
		.optional()
		.or(z.literal(undefined)),

	is_active: z.boolean().default(true),
});

export type FloorPlanFormData = z.infer<typeof floorPlanSchema>;
