"""
Availability checking utilities for reservations
"""
from datetime import datetime, timedelta, time as dt_time
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from services.models import ProviderAvailability, TimeSlotBlock
from reservations.models import Reservation
# Also check AvailabilitySchedule model (used in profile customization)
try:
    from users.profile_models import AvailabilitySchedule, TimeSlot, BreakTime
except ImportError:
    AvailabilitySchedule = None
    TimeSlot = None
    BreakTime = None


def check_slot_availability(provider_ct, provider_id, date, start_time, duration):
    """
    Check if a time slot is available for booking.
    
    Args:
        provider_ct: ContentType for the provider (ProfessionalProfile or PlaceProfile)
        provider_id: ID of the provider
        date: Date object for the booking
        start_time: Time object for the start time
        duration: Timedelta object for the duration
    
    Returns:
        tuple: (is_available: bool, reason: str or None)
    """
    # Calculate end time
    start_datetime = datetime.combine(date, start_time)
    end_datetime = start_datetime + duration
    end_time = end_datetime.time()
    
    # Check if date is in the past
    if date < datetime.now().date():
        return False, "Cannot book appointments in the past"
    
    # Check if it's today and time has passed
    if date == datetime.now().date() and start_time < datetime.now().time():
        return False, "Cannot book appointments in the past"
    
    # Get day of week (0 = Monday, 6 = Sunday)
    day_of_week = date.weekday()
    
    # Check if provider has working hours for this day
    # First try ProviderAvailability model
    availability = ProviderAvailability.objects.filter(
        content_type=provider_ct,
        object_id=provider_id,
        day_of_week=day_of_week,
        is_active=True
    ).first()
    
    # If not found, try AvailabilitySchedule model
    if not availability and AvailabilitySchedule:
        schedule = AvailabilitySchedule.objects.filter(
            content_type=provider_ct,
            object_id=provider_id,
            day_of_week=day_of_week,
            is_available=True
        ).first()
        
        if schedule:
            # Check if time falls within any active time slot
            time_slots = TimeSlot.objects.filter(
                schedule=schedule,
                is_active=True
            )
            time_fits = False
            for slot in time_slots:
                if start_time >= slot.start_time and end_time <= slot.end_time:
                    time_fits = True
                    break
            
            if not time_fits:
                return False, "Requested time is outside provider's working hours"
        else:
            return False, "Provider is not available on this day"
    elif not availability:
        return False, "Provider is not available on this day"
    else:
        # Check if requested time falls within working hours (ProviderAvailability)
        if start_time < availability.start_time or end_time > availability.end_time:
            return False, "Requested time is outside provider's working hours"
    
    # Check for conflicts with existing reservations (TimeSlotBlock with reason=BOOKED)
    booked_conflicts = TimeSlotBlock.objects.filter(
        content_type=provider_ct,
        object_id=provider_id,
        date=date,
        reason='BOOKED'
    ).filter(
        Q(start_time__lt=end_time, end_time__gt=start_time)
    )
    
    if booked_conflicts.exists():
        return False, "Time slot is already booked"
    
    # Check for conflicts with break times
    # First check TimeSlotBlock with reason=BREAK
    break_conflicts = TimeSlotBlock.objects.filter(
        content_type=provider_ct,
        object_id=provider_id,
        date=date,
        reason='BREAK'
    ).filter(
        Q(start_time__lt=end_time, end_time__gt=start_time)
    )
    
    if break_conflicts.exists():
        return False, "Time slot conflicts with provider's break time"
    
    # Also check BreakTime model if AvailabilitySchedule is used
    if AvailabilitySchedule and BreakTime:
        schedule = AvailabilitySchedule.objects.filter(
            content_type=provider_ct,
            object_id=provider_id,
            day_of_week=day_of_week,
            is_available=True
        ).first()
        
        if schedule:
            break_times = BreakTime.objects.filter(
                schedule=schedule,
                is_active=True
            )
            
            for break_time in break_times:
                if start_time < break_time.end_time and end_time > break_time.start_time:
                    return False, "Time slot conflicts with provider's break time"
    
    # Check for conflicts with existing confirmed/pending reservations
    existing_reservations = Reservation.objects.filter(
        provider_content_type=provider_ct,
        provider_object_id=provider_id,
        date=date,
        status__in=['PENDING', 'CONFIRMED']
    )
    
    # Manual check for reservation conflicts
    for reservation in existing_reservations:
        res_start = reservation.time
        if reservation.duration:
            res_end_datetime = datetime.combine(date, res_start) + reservation.duration
            res_end = res_end_datetime.time()
        else:
            # Default to 1 hour if no duration
            res_end_datetime = datetime.combine(date, res_start) + timedelta(hours=1)
            res_end = res_end_datetime.time()
        
        # Check for overlap
        if res_start < end_time and res_end > start_time:
            return False, "Time slot conflicts with existing reservation"
    
    return True, None


def get_provider_schedule_for_date(provider_ct, provider_id, date):
    """
    Get provider's schedule information for a specific date.
    
    Returns:
        dict with:
        - working_hours: {start: str, end: str} or None
        - booked_slots: list of {start: str, end: str}
        - break_times: list of {start: str, end: str}
    """
    import logging
    logger = logging.getLogger(__name__)
    
    day_of_week = date.weekday()
    print(f"[AVAILABILITY] get_provider_schedule_for_date: provider_ct={provider_ct}, provider_id={provider_id}, date={date}, day_of_week={day_of_week}")
    logger.info(f"get_provider_schedule_for_date: provider_ct={provider_ct}, provider_id={provider_id}, date={date}, day_of_week={day_of_week}")
    
    # First try ProviderAvailability model (services app)
    availability = ProviderAvailability.objects.filter(
        content_type=provider_ct,
        object_id=provider_id,
        day_of_week=day_of_week,
        is_active=True
    ).first()
    
    print(f"[AVAILABILITY] ProviderAvailability query result: {availability}")
    logger.info(f"ProviderAvailability query result: {availability}")
    if availability:
        print(f"[AVAILABILITY] Found ProviderAvailability: start_time={availability.start_time}, end_time={availability.end_time}")
        logger.info(f"Found ProviderAvailability: start_time={availability.start_time}, end_time={availability.end_time}")
    
    working_hours = None
    if availability:
        working_hours = {
            'start': availability.start_time.strftime('%H:%M'),
            'end': availability.end_time.strftime('%H:%M')
        }
        print(f"[AVAILABILITY] Using ProviderAvailability: working_hours={working_hours}")
        logger.info(f"Using ProviderAvailability: working_hours={working_hours}")
    elif AvailabilitySchedule and TimeSlot:
        # Fallback to AvailabilitySchedule model (users app) with TimeSlot
        print(f"[AVAILABILITY] Trying AvailabilitySchedule model...")
        logger.info(f"Trying AvailabilitySchedule model...")
        schedule = AvailabilitySchedule.objects.filter(
            content_type=provider_ct,
            object_id=provider_id,
            day_of_week=day_of_week,
            is_available=True
        ).first()
        
        print(f"[AVAILABILITY] AvailabilitySchedule query result: {schedule}")
        logger.info(f"AvailabilitySchedule query result: {schedule}")
        if schedule:
            print(f"[AVAILABILITY] Found AvailabilitySchedule: id={schedule.id}, is_available={schedule.is_available}")
            logger.info(f"Found AvailabilitySchedule: id={schedule.id}, is_available={schedule.is_available}")
            # Get active time slots for this day
            time_slots = TimeSlot.objects.filter(
                schedule=schedule,
                is_active=True
            ).order_by('start_time')
            
            ts_count = time_slots.count()
            print(f"[AVAILABILITY] TimeSlot count for schedule: {ts_count}")
            logger.info(f"TimeSlot count for schedule: {ts_count}")
            if time_slots.exists():
                # Use the first time slot's start and last time slot's end
                # This gives us the overall working hours range
                first_slot = time_slots.first()
                last_slot = time_slots.last()
                working_hours = {
                    'start': first_slot.start_time.strftime('%H:%M'),
                    'end': last_slot.end_time.strftime('%H:%M')
                }
                print(f"[AVAILABILITY] Using AvailabilitySchedule: working_hours={working_hours}")
                logger.info(f"Using AvailabilitySchedule: working_hours={working_hours}")
            else:
                print(f"[AVAILABILITY] WARNING: AvailabilitySchedule found but no active TimeSlots")
                logger.warning(f"AvailabilitySchedule found but no active TimeSlots")
        else:
            print(f"[AVAILABILITY] WARNING: No AvailabilitySchedule found for provider_id={provider_id}, day_of_week={day_of_week}")
            logger.warning(f"No AvailabilitySchedule found for provider_id={provider_id}, day_of_week={day_of_week}")
    else:
        print(f"[AVAILABILITY] WARNING: AvailabilitySchedule/TimeSlot models not available")
        logger.warning(f"AvailabilitySchedule/TimeSlot models not available")
    
    # Get booked slots
    booked_blocks = TimeSlotBlock.objects.filter(
        content_type=provider_ct,
        object_id=provider_id,
        date=date,
        reason='BOOKED'
    ).order_by('start_time')
    
    booked_slots = [
        {
            'start': block.start_time.strftime('%H:%M'),
            'end': block.end_time.strftime('%H:%M')
        }
        for block in booked_blocks
    ]
    
    # Get break times
    break_blocks = TimeSlotBlock.objects.filter(
        content_type=provider_ct,
        object_id=provider_id,
        date=date,
        reason='BREAK'
    ).order_by('start_time')
    
    break_times = [
        {
            'start': block.start_time.strftime('%H:%M'),
            'end': block.end_time.strftime('%H:%M')
        }
        for block in break_blocks
    ]
    
    # Also get break times from BreakTime model if AvailabilitySchedule is used
    if AvailabilitySchedule and BreakTime:
        schedule = AvailabilitySchedule.objects.filter(
            content_type=provider_ct,
            object_id=provider_id,
            day_of_week=day_of_week,
            is_available=True
        ).first()
        
        if schedule:
            schedule_breaks = BreakTime.objects.filter(
                schedule=schedule,
                is_active=True
            ).order_by('start_time')
            
            for break_time in schedule_breaks:
                break_times.append({
                    'start': break_time.start_time.strftime('%H:%M'),
                    'end': break_time.end_time.strftime('%H:%M')
                })
    
    # Also include existing reservations as booked slots
    existing_reservations = Reservation.objects.filter(
        provider_content_type=provider_ct,
        provider_object_id=provider_id,
        date=date,
        status__in=['PENDING', 'CONFIRMED']
    )
    
    for reservation in existing_reservations:
        res_start = reservation.time.strftime('%H:%M')
        if reservation.duration:
            res_end_datetime = datetime.combine(date, reservation.time) + reservation.duration
            res_end = res_end_datetime.time().strftime('%H:%M')
        else:
            res_end_datetime = datetime.combine(date, reservation.time) + timedelta(hours=1)
            res_end = res_end_datetime.time().strftime('%H:%M')
        
        booked_slots.append({
            'start': res_start,
            'end': res_end
        })
    
    return {
        'working_hours': working_hours,
        'booked_slots': booked_slots,
        'break_times': break_times
    }

