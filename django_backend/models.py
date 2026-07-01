from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

class User(AbstractUser):
    """
    Core authentication model extending AbstractUser to support
    email-centric logins, full names, and granular role assignments.
    """
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('parent', 'Parent'),
    )
    
    email = models.EmailField(unique=True, max_length=254)
    full_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='student')

    # Ensure email is used as the primary username identifier
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name or self.email} ({self.get_role_display()})"


class Classroom(models.Model):
    """
    Represents a specific classroom with a managing teacher, description,
    and a structured scheduling schema persisted in a JSONField.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        limit_choices_to={'role': 'teacher'},
        related_name='taught_classes'
    )
    
    # schedule contains array of items with keys: day, start_time, end_time, room, platform, link
    schedule = models.JSONField(default=list, help_text="List of JSON blocks representing periodic schedules.")

    def __str__(self):
        return self.name


class StudentProfile(models.Model):
    """
    Maintains a 1-to-1 extension of a student User, capturing parents' contact,
    course enrollments, and real-time behavioral analytics metadata.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='student_profile'
    )
    parent_email = models.EmailField(max_length=254)
    classes = models.ManyToManyField(Classroom, related_name='students_enrolled', blank=True)
    engagement_score = models.IntegerField(
        default=75,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Store dynamic aggregates
    grades_avg = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    attendance_avg = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(100)])

    def __str__(self):
        return f"Profile: {self.user.full_name or self.user.email}"


class Attendance(models.Model):
    """
    Captures daily or session roll calls with explicit database constraints 
    preventing duplicate attendance logs for any student, classroom, and date triplet.
    """
    STATUS_CHOICES = (
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
    )
    
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='attendance_history')
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES)

    class Meta:
        # Ensures atomic database safety preventing multiple logs for student/class/date
        unique_together = ('student', 'classroom', 'date')
        verbose_name_plural = "Attendance Logs"

    def __str__(self):
        return f"{self.student.user.full_name} - {self.classroom.name} on {self.date}: {self.status}"


class Assignment(models.Model):
    """
    Represents course objectives, homeworks, or labs designed by teachers 
    associated with a specific classroom.
    """
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField()
    max_points = models.PositiveIntegerField(default=100)

    def __str__(self):
        return f"{self.title} ({self.classroom.name})"


class Submission(models.Model):
    """
    Represents individual student completions with scoring triggers and evaluation feedback fields.
    """
    STATUS_CHOICES = (
        ('Submitted', 'Submitted'),
        ('Graded', 'Graded'),
        ('Late', 'Late'),
    )

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='submissions_made')
    submission_date = models.DateTimeField(auto_now_add=True)
    content_text = models.TextField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='Submitted')
    points_scored = models.PositiveIntegerField(blank=True, null=True)
    teacher_feedback = models.TextField(blank=True)

    def clean(self):
        if self.points_scored is not None and self.points_scored > self.assignment.maxPoints:
            raise ValidationError(f"Points scored cannot exceed assignment max points of {self.assignment.max_points}")

    def __str__(self):
        return f"Submission by {self.student.user.full_name} for {self.assignment.title}"


class Message(models.Model):
    """
    Communication model supporting role targeting of bulletin board announcements.
    """
    ROLE_TARGETS = (
        ('all', 'Everyone'),
        ('teacher', 'Teachers Only'),
        ('student', 'Students Only'),
        ('parent', 'Parents Only'),
    )

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages_sent')
    recipient_role = models.CharField(max_length=15, choices=ROLE_TARGETS, default='all')
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.full_name} to {self.recipient_role}"


class Reminder(models.Model):
    """
    Actionable bulletin triggers alerting specific classrooms about upcoming events.
    """
    TYPE_CHOICES = (
        ('Exam', 'Exam'),
        ('Deadline', 'Deadline'),
        ('Virtual Session', 'Virtual Session'),
        ('Announcement', 'Announcement'),
    )

    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='reminders')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    target_date = models.DateField()

    def __str__(self):
        return f"[{self.get_type_display()}] {self.title} - {self.classroom.name}"
