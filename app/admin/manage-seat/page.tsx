"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FloorPlansService,
  OpenAPI,
  FloorPlan,
  ResourcesService,
} from "@/src/api";
import { toast } from "sonner";
import { getAuthToken } from "@/utils/auth";
import AdminSideNav from "@/components/AdminSideNav";
import styles from "./page.module.css";

interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

interface Seat {
  id: string;
  resourceId?: number; // Actual resource ID from API
  number: string;
  x: number;
  y: number;
  dateRanges: DateRange[];
  description: string;
  blocked: boolean;
  type: "SOLO" | "TEAM";
}

interface SeatEditForm {
  seatId: string;
  number: string;
  dateRanges: DateRange[];
  description: string;
  blocked: boolean;
  type: "SOLO" | "TEAM";
}

interface PaginatedFloorPlanResponse {
  statusCode: number;
  data: {
    items: FloorPlan[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function AdminManageSeatPage() {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [isLoadingFloorPlan, setIsLoadingFloorPlan] = useState(true);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [deletedResourceIds, setDeletedResourceIds] = useState<number[]>([]); // Track deleted resource IDs
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [editForm, setEditForm] = useState<SeatEditForm | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Load floor plan from API
  useEffect(() => {
    const loadFloorPlan = async () => {
      setIsLoadingFloorPlan(true);
      try {
        OpenAPI.BASE =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        const token = getAuthToken();
        if (token) {
          OpenAPI.TOKEN = token;
        }

        const response = (await FloorPlansService.getApiFloorPlans(
          1,
          1,
        )) as unknown as PaginatedFloorPlanResponse;

        const firstFloorPlan = response.data?.items?.[0];
        if (firstFloorPlan) {
          setFloorPlan(firstFloorPlan);

          // Load existing resources from API for this floor plan
          try {
            const resourcesResponse =
              await ResourcesService.getApiResourcesByFloorPlan(
                firstFloorPlan.id!,
              );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const resources = (resourcesResponse.data || []) as Array<any>;

            // Convert resources to seats
            const loadedSeats: Seat[] = resources
              .filter((r) => r.position_x != null && r.position_y != null)
              .map((resource) => ({
                id: `seat-${resource.id}`,
                resourceId: resource.id, // Store the actual resource ID
                number: resource.name || "",
                x: resource.position_x,
                y: resource.position_y,
                dateRanges: [], // Operating hours will be loaded separately if needed
                description: resource.description || "",
                blocked: !resource.is_active,
                type: (resource.type || "SOLO") as "SOLO" | "TEAM",
              }));

            setSeats(loadedSeats);
          } catch (err) {
            console.error("Failed to load resources:", err);
            toast.error("Failed to load existing seats");
          }
        } else {
          toast.error("No floor plans found");
        }
      } catch (err) {
        toast.error("Failed to load floor plan");
        console.error(err);
      } finally {
        setIsLoadingFloorPlan(false);
      }
    };

    loadFloorPlan();
  }, []);

  // Handle seat click to position a new seat
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!floorPlan?.image_url) return;

    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing seat
    const clickedSeat = seats.find((seat) => {
      const distance = Math.sqrt((seat.x - x) ** 2 + (seat.y - y) ** 2);
      return distance < 25;
    });

    if (clickedSeat) {
      setSelectedSeat(clickedSeat);
      setEditForm({
        seatId: clickedSeat.id,
        number: clickedSeat.number,
        dateRanges: clickedSeat.dateRanges || [],
        description: clickedSeat.description,
        blocked: clickedSeat.blocked,
        type: clickedSeat.type || "SOLO",
      });
      setShowForm(true);
    } else {
      // Add new seat with default values
      const newSeat: Seat = {
        id: `seat-${Date.now()}`,
        number: `Seat ${seats.length + 1}`,
        x,
        y,
        dateRanges: [],
        description: "",
        blocked: false,
        type: "SOLO",
      };
      setSeats([...seats, newSeat]);
      setSelectedSeat(newSeat);
      setEditForm({
        seatId: newSeat.id,
        number: newSeat.number,
        dateRanges: newSeat.dateRanges,
        description: newSeat.description,
        blocked: newSeat.blocked,
        type: newSeat.type,
      });
      setShowForm(true);
    }
  };

  // Handle form submission
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editForm) return;

    setSeats(
      seats.map((seat) =>
        seat.id === editForm.seatId
          ? {
              ...seat,
              number: editForm.number,
              dateRanges: editForm.dateRanges || [],
              description: editForm.description,
              blocked: editForm.blocked,
              type: editForm.type,
            }
          : seat,
      ),
    );

    setShowForm(false);
    setSelectedSeat(null);
    setEditForm(null);
  };

  // Handle form input changes
  const handleFormChange = (
    field: keyof SeatEditForm,
    value: string | boolean | DateRange[],
  ) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value,
      });
    }
  };

  // Validate time format (must be in 1-hour increments)
  const isValidHourIncrement = (time: string): boolean => {
    const [, minutes] = time.split(':').map(Number);
    return minutes === 0; // Only allow :00 (full hours)
  };

  // Validate time range (minimum 1 hour, in 1-hour increments)
  const validateTimeRange = (startTime: string, endTime: string): { valid: boolean; error?: string } => {
    if (!isValidHourIncrement(startTime)) {
      return { valid: false, error: 'Start time must be on the hour (e.g., 09:00, 10:00)' };
    }
    if (!isValidHourIncrement(endTime)) {
      return { valid: false, error: 'End time must be on the hour (e.g., 10:00, 11:00)' };
    }

    const [startHours] = startTime.split(':').map(Number);
    const [endHours] = endTime.split(':').map(Number);
    
    let hourDiff = endHours - startHours;
    if (hourDiff < 0) hourDiff += 24; // Handle overnight bookings
    
    if (hourDiff < 1) {
      return { valid: false, error: 'Time range must be at least 1 hour' };
    }

    return { valid: true };
  };

  // Add date range with time range
  const handleAddDateRange = () => {
    if (!editForm) return;
    const today = new Date().toISOString().split("T")[0];
    const newDateRange: DateRange = { 
      start: today, 
      end: today,
      startTime: "09:00",
      endTime: "17:00"
    };
    handleFormChange("dateRanges", [...editForm.dateRanges, newDateRange]);
  };

  // Update date range field with validation
  const handleUpdateDateRange = (
    index: number,
    field: "start" | "end" | "startTime" | "endTime",
    value: string,
  ) => {
    if (!editForm) return;
    const updatedRanges = [...editForm.dateRanges];
    const currentRange = updatedRanges[index];

    // For time fields, validate before updating
    if (field === "startTime" || field === "endTime") {
      // Check if time is in 1-hour increments
      if (!isValidHourIncrement(value)) {
        toast.error('Time must be on the hour (e.g., 09:00, 10:00, 11:00)');
        return;
      }

      // Update the field first
      updatedRanges[index] = { ...currentRange, [field]: value };

      // Validate the complete time range
      const startTime = field === "startTime" ? value : currentRange.startTime;
      const endTime = field === "endTime" ? value : currentRange.endTime;
      
      const validation = validateTimeRange(startTime, endTime);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid time range');
        return;
      }
    } else {
      // For date fields, just update
      updatedRanges[index] = { ...currentRange, [field]: value };
    }

    handleFormChange("dateRanges", updatedRanges);
  };

  // Remove date range
  const handleRemoveDateRange = (index: number) => {
    if (!editForm) return;
    const updatedRanges = editForm.dateRanges.filter((_, i) => i !== index);
    handleFormChange("dateRanges", updatedRanges);
  };

  // Check if there are unsaved changes
  const hasChanges = () => {
    if (!editForm || !selectedSeat) return false;

    const dateRangesEqual =
      JSON.stringify(editForm.dateRanges) ===
      JSON.stringify(selectedSeat.dateRanges);

    return (
      editForm.number !== selectedSeat.number ||
      !dateRangesEqual ||
      editForm.description !== selectedSeat.description ||
      editForm.blocked !== selectedSeat.blocked
    );
  };

  // Delete seat (local only, actual deletion happens on Save)
  const handleDeleteSeat = () => {
    if (!selectedSeat) return;

    // Track the resourceId for deletion when Save is clicked
    if (selectedSeat.resourceId) {
      setDeletedResourceIds((prev) => [...prev, selectedSeat.resourceId!]);
    }

    // Remove from local state immediately
    setSeats(seats.filter((seat) => seat.id !== selectedSeat.id));

    setShowForm(false);
    setSelectedSeat(null);
    setEditForm(null);
  };

  // Toggle date/time picker
  const handleDateTimePickerClick = (
    pickerId: string,
    inputRef: HTMLInputElement | null,
  ) => {
    if (openPickerId === pickerId) {
      // Picker is already open, close it by blurring
      inputRef?.blur();
      setOpenPickerId(null);
    } else {
      // Open the picker
      inputRef?.showPicker?.();
      setOpenPickerId(pickerId);
    }
  };

  // Helper function to create operating hours from date ranges
  const createOperatingHours = async (resourceId: number, dateRanges: DateRange[]) => {
    // Convert date ranges to individual date entries
    const operatingHours: Array<{
      date: string;
      start_time: string;
      end_time: string;
      is_available: boolean;
    }> = [];

    for (const range of dateRanges) {
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);

      // Generate entries for each date in the range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        operatingHours.push({
          date: dateStr,
          start_time: range.startTime,
          end_time: range.endTime,
          is_available: true,
        });
      }
    }

    if (operatingHours.length > 0) {
      // API expects this structure based on the backend controller
      // Note: TypeScript API definition shows day_of_week but backend actually uses date
      await ResourcesService.postApiResourcesOperatingHours(resourceId, {
        operating_hours: operatingHours as unknown as Array<{
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available?: boolean;
        }>,
      });
    }
  };

  // Save all seats (batch create/update/delete resources via API)
  const handleSaveAll = async () => {
    if (!floorPlan) return;

    setIsSaving(true);
    try {
      OpenAPI.BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const token = getAuthToken();
      if (token) {
        OpenAPI.TOKEN = token;
      }

      let successCount = 0;
      let errorCount = 0;

      // 1. Delete removed seats
      for (const resourceId of deletedResourceIds) {
        try {
          await ResourcesService.deleteApiResources(resourceId);
          successCount++;
        } catch (err) {
          console.error(`Failed to delete resource ${resourceId}:`, err);
          errorCount++;
        }
      }

      if (seats.length === 0) {
        return;
      }

      // 2. Create or update seats
      for (const seat of seats) {
        try {
          if (seat.resourceId) {
            // Update existing resource
            await ResourcesService.putApiResources(seat.resourceId, {
              name: seat.number,
              description: seat.description || "",
              type: seat.type,
              capacity: seat.type === "TEAM" ? 4 : 1,
              floor: floorPlan.floor || "",
              building: floorPlan.building || "",
              time_slot_granularity: 60,
            });

            // Update position
            await ResourcesService.patchApiResourcesPosition(seat.resourceId, {
              floor_plan_id: floorPlan.id!,
              position_x: seat.x,
              position_y: seat.y,
            });

            // Create operating hours if date ranges are specified
            if (seat.dateRanges && seat.dateRanges.length > 0) {
              await createOperatingHours(seat.resourceId, seat.dateRanges);
            }
          } else {
            // Create new resource
            const resourceResponse = await ResourcesService.postApiResources({
              name: seat.number,
              description: seat.description || "",
              type: seat.type,
              capacity: seat.type === "TEAM" ? 4 : 1,
              floor: floorPlan.floor || "",
              building: floorPlan.building || "",
              time_slot_granularity: 15,
            });

            const resourceId = resourceResponse.data?.id;

            if (resourceId) {
              // Update resource position on floor plan
              await ResourcesService.patchApiResourcesPosition(resourceId, {
                floor_plan_id: floorPlan.id!,
                position_x: seat.x,
                position_y: seat.y,
              });

              // Update seat with resourceId
              seat.resourceId = resourceId;

              // Create operating hours if date ranges are specified
              if (seat.dateRanges && seat.dateRanges.length > 0) {
                await createOperatingHours(resourceId, seat.dateRanges);
              }
            }
          }
          successCount++;
        } catch (err) {
          console.error(
            `Failed to save resource for seat ${seat.number}:`,
            err,
          );
          errorCount++;
        }
      }

      // Clear deleted resource IDs after successful save
      setDeletedResourceIds([]);

      if (errorCount === 0) {
        toast.success(`Successfully saved ${successCount} changes!`);
      } else if (successCount > 0) {
        toast.warning(`Saved ${successCount} changes, ${errorCount} failed`);
      } else {
        toast.error("Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving seat plan:", error);
      toast.error("Failed to save seat plan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSideNav />
      <div className="flex-1 ml-48 transition-all duration-300">
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Manage Seats</h1>
            <p>Configure seats on the floor plan</p>
          </div>

          {isLoadingFloorPlan ? (
            <div className={styles.loadingSection}>
              <p>Loading floor plan...</p>
            </div>
          ) : !floorPlan ? (
            <div className={styles.uploadSection}>
              <p>No floor plan found. Please create a floor plan first.</p>
              <Link
                href="/admin/manage-floor-plan"
                className={styles.uploadButton}
              >
                Go to Floor Plans
              </Link>
            </div>
          ) : (
            <div className={styles.mainContent}>
              <div className={styles.seatPlanSection}>
                <h2>Seat Plan Editor - {floorPlan.name}</h2>
                <p className={styles.instruction}>
                  Click on the image to add seats or click on existing seats to
                  edit
                </p>
                <div
                  ref={imageRef}
                  className={styles.canvasContainer}
                  onClick={handleCanvasClick}
                  style={{
                    backgroundImage: `url(${floorPlan.image_url})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    position: "relative",
                  }}
                >
                  {seats.map((seat) => (
                    <div
                      key={seat.id}
                      className={`${styles.seatMarker} ${selectedSeat?.id === seat.id ? styles.selected : ""} ${seat.blocked ? styles.blocked : ""}`}
                      style={{
                        left: `${seat.x}px`,
                        top: `${seat.y}px`,
                      }}
                      title={seat.number}
                    >
                      {seat.number}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal for editing seat */}
          {showForm && editForm && (
            <div className={styles.modalOverlay} onClick={() => {
              setShowForm(false);
              setSelectedSeat(null);
              setEditForm(null);
            }}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleFormSubmit} className={styles.editForm}>
                    <div className={styles.formHeader}>
                      <h3>Edit Seat</h3>
                      <label className={styles.blockToggle}>
                        <input
                          type="checkbox"
                          checked={editForm.blocked}
                          onChange={(e) =>
                            handleFormChange("blocked", e.target.checked)
                          }
                        />
                        <span className={styles.blockLabel}>
                          {editForm.blocked ? "Blocked" : "Available"}
                        </span>
                      </label>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="seatNumber">Seat Number:</label>
                      <input
                        id="seatNumber"
                        type="text"
                        value={editForm.number}
                        onChange={(e) =>
                          handleFormChange("number", e.target.value)
                        }
                        placeholder="e.g., A1, B2"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Type:</label>
                      <div className={styles.radioGroup}>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="type"
                            value="SOLO"
                            checked={editForm.type === "SOLO"}
                            onChange={(e) =>
                              handleFormChange(
                                "type",
                                e.target.value as "SOLO" | "TEAM",
                              )
                            }
                          />
                          <span>Solo</span>
                        </label>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="type"
                            value="TEAM"
                            checked={editForm.type === "TEAM"}
                            onChange={(e) =>
                              handleFormChange(
                                "type",
                                e.target.value as "SOLO" | "TEAM",
                              )
                            }
                          />
                          <span>Team</span>
                        </label>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Date Periods with Time Ranges:</label>
                      <p className={styles.helpText}>
                        Time must be in 1-hour increments with minimum 1-hour duration (e.g., 09:00-10:00)
                      </p>
                      <div className={styles.dateRangesContainer}>
                        {editForm.dateRanges.length === 0 ? (
                          <p className={styles.noDateRanges}>
                            No date periods set. Click &quot;Add Date Period&quot; to specify availability.
                          </p>
                        ) : (
                          editForm.dateRanges.map((range, index) => (
                            <div key={index} className={styles.dateRangeItem}>
                              <div className={styles.dateRow}>
                                <label className={styles.inlineLabel}>Date:</label>
                                <input
                                  type="date"
                                  value={range.start}
                                  onChange={(e) =>
                                    handleUpdateDateRange(
                                      index,
                                      "start",
                                      e.target.value,
                                    )
                                  }
                                  onClick={(e) =>
                                    handleDateTimePickerClick(
                                      `dateStart-${index}`,
                                      e.currentTarget,
                                    )
                                  }
                                  onBlur={() => setOpenPickerId(null)}
                                />
                                <span className={styles.dateSeparator}>→</span>
                                <input
                                  type="date"
                                  value={range.end}
                                  min={range.start}
                                  onChange={(e) =>
                                    handleUpdateDateRange(
                                      index,
                                      "end",
                                      e.target.value,
                                    )
                                  }
                                  onClick={(e) =>
                                    handleDateTimePickerClick(
                                      `dateEnd-${index}`,
                                      e.currentTarget,
                                    )
                                  }
                                  onBlur={() => setOpenPickerId(null)}
                                />
                              </div>
                              <div className={styles.timeRow}>
                                <label className={styles.inlineLabel}>Time:</label>
                                <input
                                  type="time"
                                  step="3600"
                                  value={range.startTime}
                                  onChange={(e) =>
                                    handleUpdateDateRange(
                                      index,
                                      "startTime",
                                      e.target.value,
                                    )
                                  }
                                  onClick={(e) =>
                                    handleDateTimePickerClick(
                                      `timeStart-${index}`,
                                      e.currentTarget,
                                    )
                                  }
                                  onBlur={() => setOpenPickerId(null)}
                                />
                                <span className={styles.timeSeparator}>→</span>
                                <input
                                  type="time"
                                  step="3600"
                                  value={range.endTime}
                                  onChange={(e) =>
                                    handleUpdateDateRange(
                                      index,
                                      "endTime",
                                      e.target.value,
                                    )
                                  }
                                  onClick={(e) =>
                                    handleDateTimePickerClick(
                                      `timeEnd-${index}`,
                                      e.currentTarget,
                                    )
                                  }
                                  onBlur={() => setOpenPickerId(null)}
                                />
                              </div>
                              <button
                                type="button"
                                className={styles.removeButton}
                                onClick={() => handleRemoveDateRange(index)}
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.addDateRangeButton}
                        onClick={handleAddDateRange}
                      >
                        Add Date Period
                      </button>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="description">Description:</label>
                      <textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) =>
                          handleFormChange("description", e.target.value)
                        }
                        placeholder="Add any notes about this seat"
                        rows={3}
                      />
                    </div>

                    <div className={styles.formActions}>
                      <button type="submit" className={styles.saveButton}>
                        Save
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={handleDeleteSeat}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => {
                          setShowForm(false);
                          setSelectedSeat(null);
                          setEditForm(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          {floorPlan && (
            <div className={styles.actionBar}>
              <button
                className={styles.saveSeatButton}
                onClick={handleSaveAll}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save All Seats"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
