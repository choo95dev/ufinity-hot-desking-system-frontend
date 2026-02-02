'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { FloorPlansService, OpenAPI, FloorPlan, ResourcesService } from '@/src/api';
import { toast } from 'sonner';
import { getAuthToken } from '@/utils/auth';
import AdminSideNav from '@/components/AdminSideNav';
import styles from './page.module.css';

interface DateRange {
  start: string;
  end: string;
}

interface TimeRange {
  start: string;
  end: string;
}

interface Seat {
  id: string;
  number: string;
  x: number;
  y: number;
  dateRanges: DateRange[];
  timeRange: TimeRange;
  description: string;
  blocked: boolean;
  type: 'SOLO' | 'TEAM';
}

interface SeatEditForm {
  seatId: string;
  number: string;
  dateRanges: DateRange[];
  timeRange: TimeRange;
  description: string;
  blocked: boolean;
  type: 'SOLO' | 'TEAM';
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
        OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        const token = getAuthToken();
        if (token) {
          OpenAPI.TOKEN = token;
        }

        const response = await FloorPlansService.getApiFloorPlans(
          1,
          1
        ) as unknown as PaginatedFloorPlanResponse;
        
        const firstFloorPlan = response.data?.items?.[0];
        if (firstFloorPlan) {
          setFloorPlan(firstFloorPlan);
          
          // Load existing resources from API for this floor plan
          try {
            const resourcesResponse = await ResourcesService.getApiResourcesByFloorPlan(firstFloorPlan.id!);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const resources = (resourcesResponse.data || []) as Array<any>;
            
            // Convert resources to seats
            const loadedSeats: Seat[] = resources
              .filter(r => r.position_x != null && r.position_y != null)
              .map((resource) => ({
                id: `seat-${resource.id}`,
                number: resource.name || '',
                x: resource.position_x,
                y: resource.position_y,
                dateRanges: [],
                timeRange: { start: '09:00', end: '17:00' },
                description: resource.description || '',
                blocked: !resource.is_active,
                type: (resource.type || 'SOLO') as 'SOLO' | 'TEAM',
              }));
            
            setSeats(loadedSeats);
            
            // Also save to localStorage as cache
            localStorage.setItem(`adminSeatPlan_seats_${firstFloorPlan.id}`, JSON.stringify(loadedSeats));
          } catch (err) {
            console.error('Failed to load resources:', err);
            // Fallback to localStorage if API fails
            const savedSeats = localStorage.getItem(`adminSeatPlan_seats_${firstFloorPlan.id}`);
            if (savedSeats) {
              const parsedSeats = JSON.parse(savedSeats) as Seat[];
              const normalizedSeats = parsedSeats.map((seat) => ({
                ...seat,
                dateRanges: seat.dateRanges || [],
                type: seat.type || 'SOLO' as const,
              }));
              setSeats(normalizedSeats);
            }
          }
        } else {
          toast.error('No floor plans found');
        }
      } catch (err) {
        toast.error('Failed to load floor plan');
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
    const clickedSeat = seats.find(seat => {
      const distance = Math.sqrt((seat.x - x) ** 2 + (seat.y - y) ** 2);
      return distance < 25;
    });

    if (clickedSeat) {
      setSelectedSeat(clickedSeat);
      setEditForm({
        seatId: clickedSeat.id,
        number: clickedSeat.number,
        dateRanges: clickedSeat.dateRanges || [],
        timeRange: clickedSeat.timeRange,
        description: clickedSeat.description,
        blocked: clickedSeat.blocked,
        type: clickedSeat.type || 'SOLO',
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
        timeRange: { start: '09:00', end: '17:00' },
        description: '',
        blocked: false,
        type: 'SOLO',
      };
      setSeats([...seats, newSeat]);
      setSelectedSeat(newSeat);
      setEditForm({
        seatId: newSeat.id,
        number: newSeat.number,
        dateRanges: newSeat.dateRanges,
        timeRange: newSeat.timeRange,
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

    setSeats(seats.map(seat =>
      seat.id === editForm.seatId
        ? {
            ...seat,
            number: editForm.number,
            dateRanges: editForm.dateRanges || [],
            timeRange: editForm.timeRange,
            description: editForm.description,
            blocked: editForm.blocked,
            type: editForm.type,
          }
        : seat
    ));

    setShowForm(false);
    setSelectedSeat(null);
    setEditForm(null);
  };

  // Handle form input changes
  const handleFormChange = (field: keyof SeatEditForm, value: string | boolean | DateRange[] | TimeRange) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value,
      });
    }
  };

  // Add date range
  const handleAddDateRange = () => {
    if (!editForm) return;
    const today = new Date().toISOString().split('T')[0];
    const newDateRange: DateRange = { start: today, end: today };
    handleFormChange('dateRanges', [...editForm.dateRanges, newDateRange]);
  };

  // Update date range
  const handleUpdateDateRange = (index: number, field: 'start' | 'end', value: string) => {
    if (!editForm) return;
    const updatedRanges = [...editForm.dateRanges];
    updatedRanges[index] = { ...updatedRanges[index], [field]: value };
    handleFormChange('dateRanges', updatedRanges);
  };

  // Remove date range
  const handleRemoveDateRange = (index: number) => {
    if (!editForm) return;
    const updatedRanges = editForm.dateRanges.filter((_, i) => i !== index);
    handleFormChange('dateRanges', updatedRanges);
  };

  // Check if there are unsaved changes
  const hasChanges = () => {
    if (!editForm || !selectedSeat) return false;

    const dateRangesEqual = JSON.stringify(editForm.dateRanges) === JSON.stringify(selectedSeat.dateRanges);
    const timeRangeEqual = JSON.stringify(editForm.timeRange) === JSON.stringify(selectedSeat.timeRange);

    return (
      editForm.number !== selectedSeat.number ||
      !timeRangeEqual ||
      !dateRangesEqual ||
      editForm.description !== selectedSeat.description ||
      editForm.blocked !== selectedSeat.blocked
    );
  };

  // Delete seat
  const handleDeleteSeat = () => {
    if (!selectedSeat) return;
    setSeats(seats.filter(seat => seat.id !== selectedSeat.id));
    setShowForm(false);
    setSelectedSeat(null);
    setEditForm(null);
  };

  // Toggle date/time picker
  const handleDateTimePickerClick = (pickerId: string, inputRef: HTMLInputElement | null) => {
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

  // Save all seats (create resources via API)
  const handleSaveAll = async () => {
    if (!floorPlan) return;
    
    setIsSaving(true);
    try {
      OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const token = getAuthToken();
      if (token) {
        OpenAPI.TOKEN = token;
      }

      let successCount = 0;
      let errorCount = 0;

      // Create resources for each seat
      for (const seat of seats) {
        try {
          // Create resource
          const resourceResponse = await ResourcesService.postApiResources({
            name: seat.number,
            description: seat.description || '',
            type: seat.type,
            capacity: seat.type === 'TEAM' ? 4 : 1, // Default capacity based on type
            floor: floorPlan.floor || '',
            building: floorPlan.building || '',
            time_slot_granularity: 15, // Default 15 minutes
          });

          const resourceId = resourceResponse.data?.id;

          if (resourceId) {
            // Update resource position on floor plan
            await ResourcesService.patchApiResourcesPosition(resourceId, {
              floor_plan_id: floorPlan.id!,
              position_x: seat.x,
              position_y: seat.y,
            });

            // Set operating hours if date ranges are specified
            if (seat.dateRanges && seat.dateRanges.length > 0) {
              // TODO: Implement operating hours API call when endpoint is ready
              // For now, we'll skip this as the API expects date-based operating hours
            }

            successCount++;
          }
        } catch (err) {
          console.error(`Failed to create resource for seat ${seat.number}:`, err);
          errorCount++;
        }
      }

      // Also save to localStorage as backup
      localStorage.setItem(`adminSeatPlan_seats_${floorPlan.id}`, JSON.stringify(seats));

      if (errorCount === 0) {
        toast.success(`Successfully created ${successCount} resources!`);
      } else if (successCount > 0) {
        toast.warning(`Created ${successCount} resources, ${errorCount} failed`);
      } else {
        toast.error('Failed to create resources');
      }
    } catch (error) {
      console.error('Error saving seat plan:', error);
      toast.error('Failed to save seat plan');
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
          <a href="/admin/manage-floor-plan" className={styles.uploadButton}>
            Go to Floor Plans
          </a>
        </div>
      ) : (
        <div className={styles.mainContent}>
          <div className={styles.seatPlanSection}>
            <h2>Seat Plan Editor - {floorPlan.name}</h2>
            <p className={styles.instruction}>Click on the image to add seats or click on existing seats to edit</p>
            <div
              ref={imageRef}
              className={styles.canvasContainer}
              onClick={handleCanvasClick}
              style={{
                backgroundImage: `url(${floorPlan.image_url})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
              }}
            >
              {seats.map(seat => (
                <div
                  key={seat.id}
                  className={`${styles.seatMarker} ${selectedSeat?.id === seat.id ? styles.selected : ''} ${seat.blocked ? styles.blocked : ''}`}
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

          <div className={styles.editSection}>
            {showForm && editForm && (
              <form onSubmit={handleFormSubmit} className={styles.editForm}>
                <div className={styles.formHeader}>
                  <h3>Edit Seat</h3>
                  <label className={styles.blockToggle}>
                    <input
                      type="checkbox"
                      checked={editForm.blocked}
                      onChange={(e) => handleFormChange('blocked', e.target.checked)}
                    />
                    <span className={styles.blockLabel}>
                      {editForm.blocked ? 'Blocked' : 'Available'}
                    </span>
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="seatNumber">Seat Number:</label>
                  <input
                    id="seatNumber"
                    type="text"
                    value={editForm.number}
                    onChange={(e) => handleFormChange('number', e.target.value)}
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
                        checked={editForm.type === 'SOLO'}
                        onChange={(e) => handleFormChange('type', e.target.value as 'SOLO' | 'TEAM')}
                      />
                      <span>Solo</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="type"
                        value="TEAM"
                        checked={editForm.type === 'TEAM'}
                        onChange={(e) => handleFormChange('type', e.target.value as 'SOLO' | 'TEAM')}
                      />
                      <span>Team</span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Date Periods:</label>
                  <div className={styles.dateRangesContainer}>
                    {editForm.dateRanges.length === 0 ? (
                      <p className={styles.noDateRanges}>No date ranges set. Available for booking anytime.</p>
                    ) : (
                      editForm.dateRanges.map((range, index) => (
                        <div key={index} className={styles.dateRangeItem}>
                          <input
                            type="date"
                            value={range.start}
                            onChange={(e) => handleUpdateDateRange(index, 'start', e.target.value)}
                            onClick={(e) => handleDateTimePickerClick(`dateStart-${index}`, e.currentTarget)}
                            onBlur={() => setOpenPickerId(null)}
                          />
                          <span className={styles.dateSeparator}>→</span>
                          <input
                            type="date"
                            value={range.end}
                            min={range.start}
                            onChange={(e) => handleUpdateDateRange(index, 'end', e.target.value)}
                            onClick={(e) => handleDateTimePickerClick(`dateEnd-${index}`, e.currentTarget)}
                            onBlur={() => setOpenPickerId(null)}
                          />
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
                    Add Date Range
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <label>Time Range:</label>
                  <div className={styles.timeRangeContainer}>
                    <input
                      type="time"
                      value={editForm.timeRange.start}
                      onChange={(e) => handleFormChange('timeRange', { ...editForm.timeRange, start: e.target.value })}
                      onClick={(e) => handleDateTimePickerClick('timeStart', e.currentTarget)}
                      onBlur={() => setOpenPickerId(null)}
                    />
                    <span className={styles.timeSeparator}>→</span>
                    <input
                      type="time"
                      value={editForm.timeRange.end}
                      min={editForm.timeRange.start}
                      onChange={(e) => handleFormChange('timeRange', { ...editForm.timeRange, end: e.target.value })}
                      onClick={(e) => handleDateTimePickerClick('timeEnd', e.currentTarget)}
                      onBlur={() => setOpenPickerId(null)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="description">Description:</label>
                  <textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Add any notes about this seat"
                    rows={3}
                  />
                </div>

                <div className={styles.formActions}>
                  {hasChanges() && (
                    <button type="submit" className={styles.saveButton}>
                      Save
                    </button>
                  )}
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
            )}

            {!showForm && (
              <div className={styles.stats}>
                <h3>Seat Statistics</h3>
                <p>Total Seats: {seats.length}</p>
                <p>Blocked Seats: {seats.filter(s => s.blocked).length}</p>
                <p>Available Seats: {seats.filter(s => !s.blocked).length}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {floorPlan && seats.length > 0 && (
        <div className={styles.actionBar}>
          <button 
            className={styles.saveSeatButton} 
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save All Seats'}
          </button>
        </div>
      )}
    </div>
    </div>
    </div>
  );
}
