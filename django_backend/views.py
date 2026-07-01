from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.views import LoginView
from django.contrib.auth.mixins import UserPassesTestMixin, LoginRequiredMixin
from django.views.generic import TemplateView, View
from django.http import HttpResponseForbidden, JsonResponse
from .models import Classroom, StudentProfile, Attendance, Assignment, Submission

class UniversalLoginView(View):
    """
    Renders the custom Cosmic Slate dark-themed Universal Login page,
    and upon standard session login, inspects the authenticated user's role 
    to perform secure, conditional redirection.
    """
    template_name = 'login.html'

    def get(self, request):
        if request.user.is_authenticated:
            return self.redirect_by_role(request.user)
        return render(request, self.template_name)

    def post(self, request):
        email = request.POST.get('email')
        # Since we use email as USERNAME_FIELD, authenticate accepts username=email
        role = request.POST.get('role')
        password = request.POST.get('password', 'default_password') # Safe demo key

        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            # Confirm user role matches selected role
            if user.role == role:
                login(request, user)
                return self.redirect_by_role(user)
            else:
                return render(request, self.template_name, {
                    'error': f"Account found, but role does not match '{role}' choices."
                })
        else:
            return render(request, self.template_name, {
                'error': "Invalid credentials or non-existent profile. Please try again."
            })

    def redirect_by_role(self, user):
        if user.role == 'admin':
            return redirect('/admin-panel/')
        elif user.role == 'teacher':
            return redirect('/dashboard/teacher/')
        elif user.role == 'student':
            return redirect('/dashboard/student/')
        elif user.role == 'parent':
            return redirect('/dashboard/parent/')
        return redirect('/login/')


# --- DJANGO ROUTE SECURITY GUARDS (Mixins) ---

class AdminRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    """
    Prevents non-admins from manually typing and loading /admin-panel/ paths.
    Raises standard HTTP 403 Forbidden on failure.
    """
    def test_func(self):
        return self.request.user.role == 'admin'

    def handle_no_permission(self):
        if self.request.is_ajax():
            return JsonResponse({'error': '403 Forbidden: Admin clearance required.'}, status=403)
        return HttpResponseForbidden("<h1>403 Forbidden</h1><p>You do not have administrative permissions to view this resource.</p>")


class TeacherRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    """
    Guards teacher dashboards and roster operations.
    """
    def test_func(self):
        return self.request.user.role == 'teacher' or self.request.user.role == 'admin'

    def handle_no_permission(self):
        return HttpResponseForbidden("<h1>403 Forbidden</h1><p>You must be registered as a Teacher to access this portal.</p>")


class StudentRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    """
    Guards student timelines and assignment upload views.
    """
    def test_func(self):
        return self.request.user.role == 'student' or self.request.user.role == 'admin'

    def handle_no_permission(self):
        return HttpResponseForbidden("<h1>403 Forbidden</h1><p>Student profile clearance required.</p>")


class ParentRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    """
    Guards parent engagement and grade ring gauge views.
    """
    def test_func(self):
        return self.request.user.role == 'parent' or self.request.user.role == 'admin'

    def handle_no_permission(self):
        return HttpResponseForbidden("<h1>403 Forbidden</h1><p>Parent profile access only.</p>")


# --- CORE DASHBOARD TEMPLATE VIEWS ---

class AdminDashboardView(AdminRequiredMixin, TemplateView):
    template_name = 'admin_dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['classrooms'] = Classroom.objects.all()
        context['profiles'] = StudentProfile.objects.all()
        return context


class TeacherDashboardView(TeacherRequiredMixin, TemplateView):
    template_name = 'teacher_dashboard.html'


class StudentDashboardView(StudentRequiredMixin, TemplateView):
    template_name = 'student_dashboard.html'


class ParentDashboardView(ParentRequiredMixin, TemplateView):
    template_name = 'parent_dashboard.html'


# --- NEW DJANGO CONTROLLERS IMPLEMENTING CRITICAL CORE FEATURES ---
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import json
from datetime import datetime

@method_decorator(csrf_exempt, name='dispatch')
class AttendanceUpdateView(TeacherRequiredMixin, View):
    """
    Saves or updates attendance logs dynamically using update_or_create() to prevent duplicates.
    Recalculates student's attendance average automatically.
    """
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            student_id = data.get('student_id')
            classroom_id = data.get('classroom_id')
            status = data.get('status')
            date_str = data.get('date')

            if not (student_id and classroom_id and status and date_str):
                return JsonResponse({'error': 'Missing required fields: student_id, classroom_id, status, date.'}, status=400)

            # Date formatting check
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

            student_profile = StudentProfile.objects.get(id=student_id)
            classroom = Classroom.objects.get(id=classroom_id)

            with transaction.atomic():
                attendance_log, created = Attendance.objects.update_or_create(
                    student=student_profile,
                    classroom=classroom,
                    date=date_obj,
                    defaults={'status': status}
                )

                # Recalculate attendance average: (Present + 0.8 * Late) / Total
                history = student_profile.attendance_history.all()
                total = history.count()
                if total > 0:
                    present = history.filter(status='Present').count()
                    late = history.filter(status='Late').count()
                    student_profile.attendance_avg = round(((present + (late * 0.8)) / total) * 100, 1)
                    student_profile.save()

            return JsonResponse({
                'success': True,
                'message': 'Attendance updated successfully.',
                'created': created,
                'attendance_avg': student_profile.attendance_avg
            })

        except StudentProfile.DoesNotExist:
            return JsonResponse({'error': 'StudentProfile not found.'}, status=404)
        except Classroom.DoesNotExist:
            return JsonResponse({'error': 'Classroom not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class RoutineEditView(TeacherRequiredMixin, View):
    """
    Edits and updates the routine timeline matrix.
    Implements strict multi-classroom double-booking collision checks.
    """
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            classroom_id = data.get('classroomId')
            day = data.get('day')
            start_time_str = data.get('startTime')
            end_time_str = data.get('endTime')
            room = data.get('room')
            platform = data.get('platform')
            link = data.get('link', '')

            if not (classroom_id and day and start_time_str and end_time_str and room and platform):
                return JsonResponse({'error': 'All routine slot fields are required.'}, status=400)

            classroom = Classroom.objects.get(id=classroom_id)

            # Convert times to absolute minutes
            def to_minutes(t_str):
                parts = t_str.split(':')
                return int(parts[0]) * 60 + int(parts[1])

            try:
                new_start_min = to_minutes(start_time_str)
                new_end_min = to_minutes(end_time_str)
            except (ValueError, IndexError):
                return JsonResponse({'error': 'Invalid time format. Use HH:MM.'}, status=400)

            if new_start_min >= new_end_min:
                return JsonResponse({'error': 'Time-Slot Validation Error: Start time must occur before end time.'}, status=400)

            # Strict overlap checks (Room or Teacher overlap)
            all_classrooms = Classroom.objects.all()
            for c in all_classrooms:
                schedule_list = c.schedule or []
                for period in schedule_list:
                    if period.get('day') == day:
                        is_same_room = period.get('room', '').strip().lower() == room.strip().lower()
                        is_same_teacher = c.teacher_id == classroom.teacher_id

                        if is_same_room or is_same_teacher:
                            try:
                                p_start_min = to_minutes(period['start_time'])
                                p_end_min = to_minutes(period['end_time'])
                            except (KeyError, ValueError):
                                continue

                            # Overlap range check
                            if new_start_min < p_end_min and new_end_min > p_start_min:
                                conflict_source = f"Room '{room}'" if is_same_room else f"Teacher '{classroom.teacher.full_name}'"
                                return JsonResponse({
                                    'error': f"Validation Conflict: Overlapping schedule block detected! {conflict_source} is already booked on {day} between {period['start_time']} and {period['end_time']} inside classroom: '{c.name}'."
                                }, status=400)

            # Clean and append
            new_period = {
                'day': day,
                'start_time': start_time_str,
                'end_time': end_time_str,
                'room': room,
                'platform': platform,
                'link': link
            }

            with transaction.atomic():
                current_schedule = classroom.schedule or []
                # Replace if matching same slot start
                filtered_schedule = [item for item in current_schedule if not (item.get('day') == day and item.get('start_time') == start_time_str)]
                filtered_schedule.append(new_period)
                # Sort chronologically by start time
                filtered_schedule.sort(key=lambda x: to_minutes(x['start_time']))
                classroom.schedule = filtered_schedule
                classroom.save()

            return JsonResponse({'success': True, 'schedule': classroom.schedule})

        except Classroom.DoesNotExist:
            return JsonResponse({'error': 'Classroom not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class AssignmentGradingView(TeacherRequiredMixin, View):
    """
    Grades student submissions, saves score and feedback, and recalculates grades average.
    """
    def post(self, request, submission_id, *args, **kwargs):
        try:
            data = json.loads(request.body)
            points_scored = data.get('pointsScored')
            teacher_feedback = data.get('teacherFeedback', '')

            if points_scored is None:
                return JsonResponse({'error': 'Points scored is a required field.'}, status=400)

            with transaction.atomic():
                submission = Submission.objects.get(id=submission_id)
                assignment = submission.assignment

                if int(points_scored) > assignment.max_points:
                    return JsonResponse({'error': f'Score cannot exceed maximum of {assignment.max_points}.'}, status=400)

                submission.status = 'Graded'
                submission.points_scored = int(points_scored)
                submission.teacher_feedback = teacher_feedback
                submission.save()

                # Recalculate dynamic grades average
                student = submission.student
                graded_subs = Submission.objects.filter(student=student, status='Graded')
                total_earned = sum(s.points_scored or 0 for s in graded_subs)
                total_max = sum(s.assignment.max_points for s in graded_subs)

                student.grades_avg = round((total_earned / total_max) * 100, 1) if total_max > 0 else 80.0
                student.save()

            return JsonResponse({
                'success': True,
                'points_scored': submission.points_scored,
                'grades_avg': student.grades_avg
            })

        except Submission.DoesNotExist:
            return JsonResponse({'error': 'Submission not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class StudentEnrollmentView(TeacherRequiredMixin, View):
    """
    Allows teachers to enroll a new student directly from their dashboard.
    Automatically creates a User account, a StudentProfile, and links the classroom.
    """
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            full_name = data.get('fullName')
            roll_id = data.get('rollId')
            parent_email = data.get('parentEmail')
            classroom_id = data.get('classroomId')

            if not (full_name and roll_id and parent_email and classroom_id):
                return JsonResponse({'error': 'Fields: fullName, rollId, parentEmail, classroomId are required.'}, status=400)

            # Check if classroom exists
            classroom = Classroom.objects.get(id=classroom_id)

            email = f"student.{roll_id}@classroom.com"

            with transaction.atomic():
                # Check if User already exists, else create with safe temp password
                user, user_created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': email,
                        'full_name': full_name,
                        'role': 'student',
                        'is_active': True
                    }
                )
                if user_created:
                    user.set_password(f"temp_{roll_id}")
                    user.save()

                # Check if StudentProfile already exists, else create
                profile, profile_created = StudentProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'parent_email': parent_email,
                        'engagement_score': 80,
                        'grades_avg': 0.0,
                        'attendance_avg': 0.0
                    }
                )

                # Associate active classroom
                if not profile.classes.filter(id=classroom.id).exists():
                    profile.classes.add(classroom)

            return JsonResponse({
                'success': True,
                'user_created': user_created,
                'profile_created': profile_created,
                'student_id': profile.id,
                'email': email
            })

        except Classroom.DoesNotExist:
            return JsonResponse({'error': 'Classroom not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
