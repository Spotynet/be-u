from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import ProfessionalProfile, PlaceProfile, User
from .profile_models import PlaceProfessionalLink, LinkedAvailabilitySchedule, LinkedTimeSlot, AvailabilitySchedule


class PlaceProfessionalLinkModelTests(TestCase):
    def setUp(self):
        UserModel = get_user_model()
        # Create place user
        self.place_user = UserModel.objects.create_user(
            email='place@example.com', username='place', password='pass', role=User.Role.PLACE
        )
        # Create professional user
        self.pro_user = UserModel.objects.create_user(
            email='pro@example.com', username='pro', password='pass', role=User.Role.PROFESSIONAL
        )
        # Create profiles
        self.place = PlaceProfile.objects.create(
            user=self.place_user, name='My Place', street='Main', postal_code='00000', owner=self.place_user
        )
        self.prof = ProfessionalProfile.objects.create(
            user=self.pro_user, name='John', last_name='Doe'
        )
    
    def test_unique_link(self):
        link1 = PlaceProfessionalLink.objects.create(place=self.place, professional=self.prof, invited_by=self.place_user)
        self.assertEqual(link1.status, PlaceProfessionalLink.Status.INVITED)
        # Re-invite should not create duplicate due to unique_together
        link2, created = PlaceProfessionalLink.objects.get_or_create(place=self.place, professional=self.prof, defaults={'invited_by': self.place_user})
        self.assertFalse(created)
        self.assertEqual(link2.id, link1.id)
    
    def test_schedule_create_for_accepted_link(self):
        link = PlaceProfessionalLink.objects.create(place=self.place, professional=self.prof, invited_by=self.place_user, status=PlaceProfessionalLink.Status.ACCEPTED)
        # Create a schedule day and a slot
        sched = LinkedAvailabilitySchedule.objects.create(link=link, day_of_week=AvailabilitySchedule.DayOfWeek.MONDAY, is_available=True)
        LinkedTimeSlot.objects.create(schedule=sched, start_time='09:00', end_time='10:00')
        self.assertEqual(link.schedules.count(), 1)
        self.assertEqual(sched.time_slots.count(), 1)
