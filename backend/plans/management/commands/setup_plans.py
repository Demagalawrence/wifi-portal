from django.core.management.base import BaseCommand
from plans.models import Plan, PlanFeature


class Command(BaseCommand):
    help = 'Create initial WiFi hotspot plans'

    def handle(self, *args, **options):
        # Define the plans data
        plans_data = [
            {
                'name': '2 hours',
                'price': 500,
                'duration_hours': 2,
                'duration_display': '2 hours',
                'sort_order': 1,
                'features': []
            },
            {
                'name': '12 hours',
                'price': 1000,
                'duration_hours': 12,
                'duration_display': '12 hours',
                'sort_order': 2,
                'features': []
            },
            {
                'name': '24 hours',
                'price': 1500,
                'duration_hours': 24,
                'duration_display': '24 hours',
                'sort_order': 3,
                'features': []
            },
            {
                'name': '3 days',
                'price': 3000,
                'duration_hours': 72,
                'duration_display': '3 days',
                'sort_order': 4,
                'features': []
            },
            {
                'name': '1 week',
                'price': 5000,
                'duration_hours': 168,
                'duration_display': '1 week',
                'sort_order': 5,
                'features': []
            },
            {
                'name': '1 month',
                'price': 20000,
                'duration_hours': 720,
                'duration_display': '1 month',
                'sort_order': 6,
                'features': []
            }
        ]

        created_count = 0
        updated_count = 0

        for plan_data in plans_data:
            plan, created = Plan.objects.update_or_create(
                name=plan_data['name'],
                defaults={
                    'price': plan_data['price'],
                    'duration_hours': plan_data['duration_hours'],
                    'duration_display': plan_data['duration_display'],
                    'sort_order': plan_data['sort_order'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created plan: {plan.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated plan: {plan.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully setup plans! Created: {created_count}, Updated: {updated_count}'
            )
        )
