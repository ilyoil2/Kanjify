from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, WordButton


@receiver(post_save, sender=User)
def create_default_buttons(sender, instance, created, **kwargs):
    if not created:
        return
    WordButton.objects.bulk_create([
        WordButton(user=instance, hide_days=5, color='#3B82F6'),
        WordButton(user=instance, hide_days=10, color='#10B981'),
        WordButton(user=instance, hide_days=None, color='#EF4444'),
    ])
