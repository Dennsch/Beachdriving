import { TidePoint, SafeWindow } from '../types';
import { format, addHours, subHours, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const QUEENSLAND_TIMEZONE = 'Australia/Brisbane';
const UNSAFE_HOURS_BEFORE_HIGH_TIDE = 2;
const UNSAFE_HOURS_AFTER_HIGH_TIDE = 2;

export class SafetyService {
  private static instance: SafetyService;

  public static getInstance(): SafetyService {
    if (!SafetyService.instance) {
      SafetyService.instance = new SafetyService();
    }
    return SafetyService.instance;
  }

  /**
   * Determines if it's currently safe to drive on the beach
   */
  isSafeToDrive(tidePoints: TidePoint[], currentTime: Date): boolean {
    const highTides = tidePoints.filter(tide => tide.type === 'high');
    
    for (const highTide of highTides) {
      const tideTime = new Date(highTide.dateTime);
      const unsafeStart = subHours(tideTime, UNSAFE_HOURS_BEFORE_HIGH_TIDE);
      const unsafeEnd = addHours(tideTime, UNSAFE_HOURS_AFTER_HIGH_TIDE);
      
      if (isWithinInterval(currentTime, { start: unsafeStart, end: unsafeEnd })) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculates safe driving windows for a given day
   */
  calculateSafeWindows(tidePoints: TidePoint[], targetDate: Date): SafeWindow[] {
    const safeWindows: SafeWindow[] = [];
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);
    
    // Get high tides for the day and surrounding period
    const relevantHighTides = tidePoints
      .filter(tide => tide.type === 'high')
      .map(tide => ({
        ...tide,
        dateTime: new Date(tide.dateTime)
      }))
      .filter(tide => {
        // Include tides that might affect the target day
        const extendedStart = subHours(dayStart, UNSAFE_HOURS_AFTER_HIGH_TIDE);
        const extendedEnd = addHours(dayEnd, UNSAFE_HOURS_BEFORE_HIGH_TIDE);
        return tide.dateTime >= extendedStart && tide.dateTime <= extendedEnd;
      })
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    if (relevantHighTides.length === 0) {
      // No high tides, entire day is safe
      safeWindows.push({
        start: format(dayStart, 'HH:mm'),
        end: format(dayEnd, 'HH:mm'),
        duration: '24 hours'
      });
      return safeWindows;
    }

    let currentSafeStart = dayStart;

    for (const highTide of relevantHighTides) {
      const unsafeStart = subHours(highTide.dateTime, UNSAFE_HOURS_BEFORE_HIGH_TIDE);
      const unsafeEnd = addHours(highTide.dateTime, UNSAFE_HOURS_AFTER_HIGH_TIDE);

      // If there's a safe period before this high tide
      if (currentSafeStart < unsafeStart && unsafeStart > dayStart) {
        const windowEnd = unsafeStart > dayEnd ? dayEnd : unsafeStart;
        if (currentSafeStart < windowEnd) {
          const duration = this.calculateDuration(currentSafeStart, windowEnd);
          if (duration > 0) {
            safeWindows.push({
              start: format(currentSafeStart, 'HH:mm'),
              end: format(windowEnd, 'HH:mm'),
              duration: this.formatDuration(duration)
            });
          }
        }
      }

      // Update the next safe start time
      currentSafeStart = unsafeEnd < dayStart ? dayStart : unsafeEnd;
    }

    // Check if there's a safe period after the last high tide
    if (currentSafeStart < dayEnd) {
      const duration = this.calculateDuration(currentSafeStart, dayEnd);
      if (duration > 0) {
        safeWindows.push({
          start: format(currentSafeStart, 'HH:mm'),
          end: format(dayEnd, 'HH:mm'),
          duration: this.formatDuration(duration)
        });
      }
    }

    return safeWindows;
  }

  /**
   * Gets the next high tide from the current time
   */
  getNextHighTide(tidePoints: TidePoint[], currentTime: Date): TidePoint | null {
    const highTides = tidePoints
      .filter(tide => tide.type === 'high')
      .map(tide => ({
        ...tide,
        dateTime: new Date(tide.dateTime)
      }))
      .filter(tide => tide.dateTime > currentTime)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    return highTides.length > 0 ? {
      ...highTides[0],
      dateTime: highTides[0].dateTime.toISOString()
    } : null;
  }

  /**
   * Gets the current tide height by interpolating between tide points
   */
  getCurrentTideHeight(tidePoints: TidePoint[], currentTime: Date): number {
    if (tidePoints.length < 2) return 0;

    const sortedTides = tidePoints
      .map(tide => ({
        ...tide,
        dateTime: new Date(tide.dateTime)
      }))
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    // Find the two tide points that bracket the current time
    let beforeTide = null;
    let afterTide = null;

    for (let i = 0; i < sortedTides.length - 1; i++) {
      if (sortedTides[i].dateTime <= currentTime && sortedTides[i + 1].dateTime >= currentTime) {
        beforeTide = sortedTides[i];
        afterTide = sortedTides[i + 1];
        break;
      }
    }

    if (!beforeTide || !afterTide) {
      // If we can't bracket the time, return the closest tide height
      const closest = sortedTides.reduce((prev, curr) => 
        Math.abs(curr.dateTime.getTime() - currentTime.getTime()) < 
        Math.abs(prev.dateTime.getTime() - currentTime.getTime()) ? curr : prev
      );
      return closest.height;
    }

    // Linear interpolation between the two tide points
    const totalDuration = afterTide.dateTime.getTime() - beforeTide.dateTime.getTime();
    const elapsedDuration = currentTime.getTime() - beforeTide.dateTime.getTime();
    const ratio = elapsedDuration / totalDuration;

    return beforeTide.height + (afterTide.height - beforeTide.height) * ratio;
  }

  private calculateDuration(start: Date, end: Date): number {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
  }

  private formatDuration(hours: number): string {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} min`;
    } else if (hours < 24) {
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      if (minutes === 0) {
        return `${wholeHours}h`;
      }
      return `${wholeHours}h ${minutes}m`;
    } else {
      return `${Math.round(hours)}h`;
    }
  }

  /**
   * Converts a date to Queensland timezone
   */
  toQueenslandTime(date: Date): Date {
    return utcToZonedTime(date, QUEENSLAND_TIMEZONE);
  }

  /**
   * Gets current Queensland time
   */
  getCurrentQueenslandTime(): Date {
    return utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE);
  }
}