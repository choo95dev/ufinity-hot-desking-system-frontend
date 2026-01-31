'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
}

interface SeatEditForm {
  seatId: string;
  number: string;
  dateRanges: DateRange[];
  timeRange: TimeRange;
  description: string;
  blocked: boolean;
}

export default function AdminManageSeatPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [editForm, setEditForm] = useState<SeatEditForm | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedImage = localStorage.getItem('adminSeatPlan_image');
        const savedSeats = localStorage.getItem('adminSeatPlan_seats');

        if (savedImage) {
          setUploadedImage(savedImage);
        }

        if (savedSeats) {
          const parsedSeats = JSON.parse(savedSeats);
          // Ensure all seats have dateRanges property
          const normalizedSeats = parsedSeats.map((seat: any) => ({
            ...seat,
            dateRanges: seat.dateRanges || [],
          }));
          setSeats(normalizedSeats);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, []);

  // Handle image upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        // Reset seats when new image is uploaded
        setSeats([]);
        setSelectedSeat(null);
        setShowForm(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle seat click to position a new seat
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!uploadedImage) return;

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
          }
        : seat
    ));

    setShowForm(false);
    setSelectedSeat(null);
    setEditForm(null);
  };

  // Handle form input changes
  const handleFormChange = (field: keyof SeatEditForm, value: string | boolean | DateRange[]) => {
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

  // Save all seats (persist to localStorage and call API)
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Prepare data
      const seatPlanData = {
        image: uploadedImage,
        seats: seats,
        savedAt: new Date().toISOString(),
      };

      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch('/api/admin/seat-plans', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(seatPlanData),
      // });
      // const result = await response.json();

      // For now, persist to localStorage
      localStorage.setItem('adminSeatPlan_image', uploadedImage || '');
      localStorage.setItem('adminSeatPlan_seats', JSON.stringify(seats));

      console.log('Seat plan saved:', seatPlanData);
      alert('Seat plan saved successfully! Data persisted locally.');
      
      // Here you can add code to send to backend when ready:
      // Example API call structure:
      // const response = await fetch('http://your-backend-api/seat-plans', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(seatPlanData),
      // });
      // if (!response.ok) throw new Error('Failed to save');
    } catch (error) {
      console.error('Error saving seat plan:', error);
      alert('Failed to save seat plan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Manage Seats</h1>
        <p>Upload an office image and configure seats</p>
        <div className={styles.headerActions}>
          <Link href="/admin/view-booking" className={styles.viewBookingsLink}>
            View Bookings
          </Link>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className={styles.hiddenInput}
      />

      {!uploadedImage && (
        <div className={styles.uploadSection}>
          <button
            className={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Office Image
          </button>
        </div>
      )}

      {uploadedImage && (
        <div className={styles.mainContent}>
          <div className={styles.seatPlanSection}>
            <h2>Seat Plan Editor</h2>
            <p className={styles.instruction}>Click on the image to add seats or click on existing seats to edit</p>
            <div
              ref={imageRef}
              className={styles.canvasContainer}
              onClick={handleCanvasClick}
              style={{
                backgroundImage: `url(${uploadedImage})`,
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

      {uploadedImage && seats.length > 0 && (
        <div className={styles.actionBar}>
          <button className={styles.uploadNewButton} onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
              fileInputRef.current.click();
            }
          }}>
            Upload New Image
          </button>
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
  );
}
