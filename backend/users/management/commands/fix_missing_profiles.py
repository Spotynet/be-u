from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User, ProfessionalProfile, PlaceProfile


class Command(BaseCommand):
    help = 'Create missing profile records for users with PROFESSIONAL or PLACE roles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Fix profile for specific user email'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Fix all users with missing profiles'
        )

    def handle(self, *args, **options):
        with transaction.atomic():
            if options['email']:
                self.fix_user_profile(options['email'])
            elif options['all']:
                self.fix_all_profiles()
            else:
                self.stdout.write(
                    self.style.WARNING(
                        'Please specify --email <email> or --all'
                    )
                )

    def fix_user_profile(self, email):
        try:
            user = User.objects.get(email=email)
            self.create_profile_for_user(user)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with email {email} not found')
            )

    def fix_all_profiles(self):
        # Find users with PROFESSIONAL role but no ProfessionalProfile
        professional_users = User.objects.filter(
            role=User.Role.PROFESSIONAL
        ).exclude(
            professional_profile__isnull=False
        )
        
        # Find users with PLACE role but no PlaceProfile
        place_users = User.objects.filter(
            role=User.Role.PLACE
        ).exclude(
            place_profile__isnull=False
        )
        
        total_fixed = 0
        
        for user in professional_users:
            self.create_profile_for_user(user)
            total_fixed += 1
            
        for user in place_users:
            self.create_profile_for_user(user)
            total_fixed += 1
            
        self.stdout.write(
            self.style.SUCCESS(f'Fixed {total_fixed} missing profiles')
        )

    def create_profile_for_user(self, user):
        if user.role == User.Role.PROFESSIONAL:
            if not hasattr(user, 'professional_profile'):
                ProfessionalProfile.objects.create(
                    user=user,
                    name=user.first_name or 'Professional',
                    last_name=user.last_name or 'User'
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created ProfessionalProfile for {user.email}'
                    )
                )
        elif user.role == User.Role.PLACE:
            if not hasattr(user, 'place_profile'):
                PlaceProfile.objects.create(
                    user=user,
                    name=user.first_name or 'Place',
                    street='TBD',
                    postal_code='00000',
                    owner=user
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created PlaceProfile for {user.email}'
                    )
                )
