from django import forms
from django.core.exceptions import ValidationError
from datetime import datetime, time
from .models import Classroom, User

class SchedulePeriodForm(forms.Form):
    """
    Form for teachers and admins to add or edit scheduled periods.
    Implements advanced double-booking collision checks across all rooms and teachers.
    """
    DAY_CHOICES = (
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    )
    
    PLATFORM_CHOICES = (
        ('In-Person', 'In-Person'),
        ('Zoom', 'Zoom'),
        ('Google Meet', 'Google Meet'),
    )

    classroom_id = forms.IntegerField()
    day = forms.ChoiceField(choices=DAY_CHOICES)
    start_time = forms.TimeField(widget=forms.TimeInput(attrs={'type': 'time'}))
    end_time = forms.TimeField(widget=forms.TimeInput(attrs={'type': 'time'}))
    room = forms.CharField(max_length=100)
    platform = forms.ChoiceField(choices=PLATFORM_CHOICES)
    link = forms.URLField(required=False)

    def clean_classroom_id(self):
        cid = self.cleaned_data.get('classroom_id')
        try:
            return Classroom.objects.get(id=cid)
        except Classroom.DoesNotExist:
            raise ValidationError("Target classroom does not exist.")

    def clean(self):
        cleaned_data = super().clean()
        classroom = cleaned_data.get('classroom_id')
        day = cleaned_data.get('day')
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')
        room = cleaned_data.get('room')
        platform = cleaned_data.get('platform')
        link = cleaned_data.get('link')

        if not (classroom and day and start_time and end_time and room):
            return cleaned_data # Fallback to default field validators

        # 1. Logical time check
        if start_time >= end_time:
            raise ValidationError("Time-Slot Error: Period start time must occur before end time.")

        # Helper function to convert time to absolute minutes
        def to_minutes(t):
            return t.hour * 60 + t.minute

        new_start_min = to_minutes(start_time)
        new_end_min = to_minutes(end_time)

        # 2. Retrieve all other Classrooms to scan schedules for overlap
        all_classrooms = Classroom.objects.all()

        for c in all_classrooms:
            # Check schedule array saved inside JSONField
            schedule_list = c.schedule or []
            for period in schedule_list:
                # Compare only if day is identical
                if period.get('day') == day:
                    # Check if either Room conflicts OR if the same Teacher is booked
                    is_same_room = period.get('room', '').strip().lower() == room.strip().lower()
                    is_same_teacher = c.teacher_id == classroom.teacher_id

                    if is_same_room or is_same_teacher:
                        try:
                            # Convert string times to time objects
                            p_start_time = datetime.strptime(period['start_time'], '%H:%M').time()
                            p_end_time = datetime.strptime(period['end_time'], '%H:%M').time()
                        except (ValueError, KeyError):
                            continue # Skip corrupt schedule blocks safely

                        p_start_min = to_minutes(p_start_time)
                        p_end_min = to_minutes(p_end_time)

                        # Check collision range: (start_A < end_B) and (end_A > start_B)
                        if new_start_min < p_end_min and new_end_min > p_start_min:
                            conflict_source = f"Room '{room}'" if is_same_room else f"Teacher '{classroom.teacher.full_name}'"
                            raise ValidationError(
                                f"Collision Detected! {conflict_source} is already booked on {day} "
                                f"from {period['start_time']} to {period['end_time']} inside classroom: '{c.name}'."
                            )

        return cleaned_data
