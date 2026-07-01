import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from django_backend.models import User, Classroom, StudentProfile, Attendance, Assignment, Submission, Message, Reminder

class Command(BaseCommand):
    help = "Idempotently clears out stale data and seeds the database with advanced Cosmic Slate demo models."

    def handle(self, *args, **options):
        self.stdout.write("Initializing Idempotent Auto-Seed Engine...")

        # 1. Purge stale records safely to prevent primary key overlap
        self.stdout.write("Purging old records...")
        Submission.objects.all().delete()
        Assignment.objects.all().delete()
        Attendance.objects.all().delete()
        StudentProfile.objects.all().delete()
        Classroom.objects.all().delete()
        Message.objects.all().delete()
        Reminder.objects.all().delete()
        # Delete non-superuser account list
        User.objects.filter(is_superuser=False).delete()

        # 2. Inject high-fidelity mock Users
        self.stdout.write("Injecting high-fidelity Users...")
        admin = User.objects.create_user(
            username='admin@classroom.com',
            email='admin@classroom.com',
            full_name='Director Sarah Jenkins',
            role='admin',
            password='admin_password'
        )
        
        teacher1 = User.objects.create_user(
            username='clara.oswald@classroom.com',
            email='clara.oswald@classroom.com',
            full_name='Dr. Clara Oswald',
            role='teacher',
            password='teacher_password'
        )
        teacher2 = User.objects.create_user(
            username='albus.d@classroom.com',
            email='albus.d@classroom.com',
            full_name='Prof. Albus Dumbledore',
            role='teacher',
            password='teacher_password'
        )

        student1 = User.objects.create_user(
            username='peter.parker@classroom.com',
            email='peter.parker@classroom.com',
            full_name='Peter Parker',
            role='student',
            password='student_password'
        )
        student2 = User.objects.create_user(
            username='hermione.g@classroom.com',
            email='hermione.g@classroom.com',
            full_name='Hermione Granger',
            role='student',
            password='student_password'
        )
        student3 = User.objects.create_user(
            username='ron.weasley@classroom.com',
            email='ron.weasley@classroom.com',
            full_name='Ron Weasley',
            role='student',
            password='student_password'
        )

        parent1 = User.objects.create_user(
            username='may.parker@classroom.com',
            email='may.parker@classroom.com',
            full_name='May Parker',
            role='parent',
            password='parent_password'
        )
        parent2 = User.objects.create_user(
            username='jean.granger@classroom.com',
            email='jean.granger@classroom.com',
            full_name='Jean Granger',
            role='parent',
            password='parent_password'
        )
        parent3 = User.objects.create_user(
            username='arthur.weasley@classroom.com',
            email='arthur.weasley@classroom.com',
            full_name='Arthur Weasley',
            role='parent',
            password='parent_password'
        )

        # 3. Create Classrooms & schedule lists in JSONFields
        self.stdout.write("Configuring Classrooms & Schedules...")
        classroom1 = Classroom.objects.create(
            name="Quantum Physics & Astronomy",
            description="An advanced look at gravitational anomalies, quantum entanglement, and stellar spectroscopy.",
            teacher=teacher1,
            schedule=[
                {
                    "day": "Monday",
                    "start_time": "09:00",
                    "end_time": "10:30",
                    "room": "Observatory Alpha",
                    "platform": "In-Person",
                    "link": ""
                },
                {
                    "day": "Wednesday",
                    "start_time": "09:00",
                    "end_time": "10:30",
                    "room": "Observatory Alpha",
                    "platform": "Zoom",
                    "link": "https://zoom.us/j/quantum-physics-class"
                }
            ]
        )

        classroom2 = Classroom.objects.create(
            name="Advanced Transfiguration Theory",
            description="Deconstructing molecular frameworks and altering molecular lattices at a subatomic scale.",
            teacher=teacher2,
            schedule=[
                {
                    "day": "Tuesday",
                    "start_time": "11:00",
                    "end_time": "12:30",
                    "room": "Lecture Hall B",
                    "platform": "In-Person",
                    "link": ""
                },
                {
                    "day": "Thursday",
                    "start_time": "11:00",
                    "end_time": "12:30",
                    "room": "Lecture Hall B",
                    "platform": "Google Meet",
                    "link": "https://meet.google.com/transfig-advanced"
                }
            ]
        )

        # 4. Construct Student Profiles and associate Classes
        self.stdout.write("Establishing Student Profiles...")
        profile1 = StudentProfile.objects.create(
            user=student1,
            parent_email='may.parker@classroom.com',
            engagement_score=88,
            grades_avg=91.0,
            attendance_avg=94.0
        )
        profile1.classes.add(classroom1, classroom2)

        profile2 = StudentProfile.objects.create(
            user=student2,
            parent_email='jean.granger@classroom.com',
            engagement_score=99,
            grades_avg=100.0,
            attendance_avg=100.0
        )
        profile2.classes.add(classroom1, classroom2)

        profile3 = StudentProfile.objects.create(
            user=student3,
            parent_email='arthur.weasley@classroom.com',
            engagement_score=52,
            grades_avg=73.0,
            attendance_avg=85.0
        )
        profile3.classes.add(classroom2)

        # 5. Populate attendance logs
        self.stdout.write("Logging historical Roll Calls...")
        today = datetime.date.today()
        yesterday = today - datetime.timedelta(days=1)
        two_days_ago = today - datetime.timedelta(days=2)

        Attendance.objects.create(student=profile1, classroom=classroom1, date=two_days_ago, status='Present')
        Attendance.objects.create(student=profile2, classroom=classroom1, date=two_days_ago, status='Present')
        
        Attendance.objects.create(student=profile1, classroom=classroom2, date=yesterday, status='Late')
        Attendance.objects.create(student=profile2, classroom=classroom2, date=yesterday, status='Present')
        Attendance.objects.create(student=profile3, classroom=classroom2, date=yesterday, status='Absent')

        # 6. Set up Assignments
        self.stdout.write("Distributing Homework Assignments...")
        assign1 = Assignment.objects.create(
            classroom=classroom1,
            title="Lab Report: Einstein-Podolsky-Rosen Paradox",
            description="Analyze photon spin correlation data and calculate violation of Bell's inequalities.",
            due_date=datetime.datetime.now() + datetime.timedelta(days=4),
            max_points=100
        )
        assign2 = Assignment.objects.create(
            classroom=classroom2,
            title="Critique of Gamp's Law of Elemental Transfiguration",
            description="Discuss the 5 principal exceptions to Gamp's Law with modern scientific equivalents.",
            due_date=datetime.datetime.now() + datetime.timedelta(days=7),
            max_points=50
        )

        # 7. Add Submissions
        self.stdout.write("Gathering student Submissions...")
        Submission.objects.create(
            assignment=assign1,
            student=profile1,
            content_text="EPR paradox Bell states analyzed safely in Quantum crystal alignment lattice...",
            status='Submitted'
        )
        Submission.objects.create(
            assignment=assign1,
            student=profile2,
            content_text="Detailed dissertation verifying quantum non-locality violates classical hidden variables by 14 sigma.",
            status='Graded',
            points_scored=100,
            teacher_feedback="Amazing work as always, Hermione."
        )

        # 8. Create Bulletins and Reminders
        self.stdout.write("Publishing Bulletins and Reminders...")
        Message.objects.create(
            sender=teacher1,
            recipient_role='student',
            text='Please make sure to finish your physics laboratory essays by the end of this week!'
        )
        Reminder.objects.create(
            classroom=classroom1,
            type='Exam',
            title='Midterm: Stellar Spectroscopy & Quantum States',
            content='Approved scientific calculators are required. Open book rules apply.',
            target_date=today + datetime.timedelta(days=10)
        )

        self.stdout.write(self.style.SUCCESS("Database seeded successfully! Stale records cleared."))
