"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isWeekday } from "../lib/utils/date";

interface DatePickerInputProps {
	id: string;
	name: string;
	selected: Date | null;
	onChange: (date: Date | null) => void;
	placeholderText?: string;
	minDate?: Date | null;
	dataTestId?: string;
	className?: string;
	filterWeekdays?: boolean;
}

/**
 * Reusable DatePicker component with consistent styling
 */
export default function DatePickerInput({
	id,
	name,
	selected,
	onChange,
	placeholderText = "dd/mm/yyyy",
	minDate,
	dataTestId,
	className = "block w-full px-4 py-2 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer",
}: DatePickerInputProps) {
	return (
		<DatePicker
			id={id}
			name={name}
			selected={selected}
			onChange={onChange}
			placeholderText={placeholderText}
			minDate={minDate || undefined}
			filterDate={isWeekday}
			className={className}
			data-testid={dataTestId}
		/>
	);
}
